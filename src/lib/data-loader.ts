import trustData from "@/data/trust-scores.json";
import {
  type ContributorData,
  type TrustStats,
  getTierConfig,
  type TrustTier,
} from "./trust-scoring";
import {
  computeTrustScore,
  computeScoreHistory,
  type ContributorState,
  type EventType,
  type TrustEvent,
} from "./scoring-engine";

interface RawEvent {
  type: string;
  timestamp: number;
  linesChanged: number;
  labels: string[];
  prNumber: number;
  reviewSeverity?: string;
  filesChanged?: number;
}

interface RawContributor {
  username?: string;
  avatarUrl?: string;
  trustScore?: number;
  tier?: TrustTier;
  tierInfo?: { label?: TrustTier };
  breakdown?: ContributorData["breakdown"];
  currentStreak?: { type: "approve" | "negative" | null; length: number };
  currentStreakType?: "approve" | "negative" | null;
  currentStreakLength?: number;
  totalApprovals?: number;
  totalRejections?: number;
  totalCloses?: number;
  totalSelfCloses?: number;
  lastEventAt?: string | null;
  firstSeenAt?: string;
  walletAddress?: string | null;
  autoMergeEligible?: boolean;
  events?: RawEvent[];
  scoreHistory?: ContributorData["scoreHistory"];
  warnings?: string[];
  manualAdjustment?: number;
}

function toTrustEvents(rawEvents: RawEvent[]): TrustEvent[] {
  return rawEvents.map((e) => ({
    type: e.type as EventType,
    timestamp: e.timestamp,
    linesChanged: e.linesChanged ?? 0,
    labels: e.labels ?? [],
    prNumber: e.prNumber,
    reviewSeverity: e.reviewSeverity as TrustEvent["reviewSeverity"],
    filesChanged: e.filesChanged,
  }));
}

function computeCurrentStreak(
  events: TrustEvent[],
): { type: "approve" | "negative" | null; length: number } {
  if (events.length === 0) return { type: null, length: 0 };

  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const firstType = sorted[0].type;
  const isPositive = firstType === "approve";
  const isNegative = firstType === "reject" || firstType === "close" || firstType === "selfClose";

  if (!isPositive && !isNegative) return { type: null, length: 0 };

  const streakType = isPositive ? "approve" : "negative";
  let length = 0;

  for (const event of sorted) {
    const eventIsPositive = event.type === "approve";
    const eventIsNegative =
      event.type === "reject" || event.type === "close" || event.type === "selfClose";

    if (isPositive && eventIsPositive) {
      length++;
    } else if (isNegative && eventIsNegative) {
      length++;
    } else {
      break;
    }
  }

  return { type: streakType, length };
}

function recomputeContributors(raw: RawContributor[], now: number): ContributorData[] {
  return raw.map((contributor) => {
    const username = contributor.username ?? "unknown";
    const rawEvents = contributor.events ?? [];
    const trustEvents = toTrustEvents(rawEvents);

    // Build ContributorState for the scoring engine
    const state: ContributorState = {
      contributor: username,
      createdAt: contributor.firstSeenAt
        ? new Date(contributor.firstSeenAt).getTime()
        : now,
      events: trustEvents,
      manualAdjustment: contributor.manualAdjustment ?? 0,
    };

    // Recompute the trust score using the scoring engine with current time
    const result = computeTrustScore(state, undefined, now);

    // Recompute score history
    const scoreHistory = computeScoreHistory(state, undefined, now);

    // Determine tier from the freshly computed score
    const tier = getTierConfig(result.tier);

    // Compute current streak from events
    const currentStreak = computeCurrentStreak(trustEvents);

    // Count event types
    let totalApprovals = 0;
    let totalRejections = 0;
    let totalCloses = 0;
    let totalSelfCloses = 0;
    for (const e of trustEvents) {
      if (e.type === "approve") totalApprovals++;
      else if (e.type === "reject") totalRejections++;
      else if (e.type === "close") totalCloses++;
      else if (e.type === "selfClose") totalSelfCloses++;
    }

    // Find last event timestamp
    const sorted = [...trustEvents].sort((a, b) => b.timestamp - a.timestamp);
    const lastEventAt =
      sorted.length > 0 ? new Date(sorted[0].timestamp).toISOString() : null;

    return {
      username,
      avatarUrl:
        contributor.avatarUrl ??
        `https://github.com/${username}.png`,
      trustScore: result.score,
      tier,
      tierInfo: tier,
      breakdown: result.breakdown,
      currentStreak,
      currentStreakType: currentStreak.type,
      currentStreakLength: currentStreak.length,
      totalApprovals,
      totalRejections,
      totalCloses,
      totalSelfCloses,
      lastEventAt,
      firstSeenAt:
        contributor.firstSeenAt ?? new Date().toISOString(),
      walletAddress: contributor.walletAddress ?? null,
      autoMergeEligible: tier.autoMerge,
      events: trustEvents,
      scoreHistory,
      warnings: result.warnings,
    };
  });
}

function computeStats(contributors: ContributorData[]): TrustStats {
  const tierDistribution: Record<TrustTier, number> = {
    legendary: 0,
    trusted: 0,
    established: 0,
    contributing: 0,
    probationary: 0,
    untested: 0,
    restricted: 0,
  };

  let totalEvents = 0;
  let totalScore = 0;

  for (const c of contributors) {
    tierDistribution[c.tier.label as TrustTier]++;
    totalEvents += c.events.length;
    totalScore += c.trustScore;
  }

  return {
    totalContributors: contributors.length,
    totalEvents,
    tierDistribution,
    avgScore:
      contributors.length > 0
        ? Math.round((totalScore / contributors.length) * 100) / 100
        : 0,
  };
}

// Cache the computed results so we don't recompute on every call
let cachedContributors: ContributorData[] | null = null;
let cachedStats: TrustStats | null = null;

function ensureComputed(): void {
  if (cachedContributors !== null) return;

  const now = Date.now();
  const raw = (trustData.contributors ?? []) as unknown as RawContributor[];
  cachedContributors = recomputeContributors(raw, now);
  cachedStats = computeStats(cachedContributors);
}

export function getContributors(): ContributorData[] {
  ensureComputed();
  return cachedContributors!;
}

export function getStats(): TrustStats {
  ensureComputed();
  return cachedStats!;
}

export function getGeneratedAt(): string {
  return trustData.generatedAt;
}

// Backward-compatible aliases
export const loadContributors = getContributors;
export const loadStats = getStats;
