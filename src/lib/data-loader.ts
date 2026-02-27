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

    // Defer score history - computed lazily on demand via getContributorScoreHistory()
    const scoreHistory: { timestamp: number; score: number }[] = [];

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

// --- Skills computation ---
export interface ContributorSkills {
  codeQuality: number;
  consistency: number;
  complexity: number;
  security: number;
  velocity: number;
  reliability: number;
}

function computeSkills(
  contributor: ContributorData,
  events: TrustEvent[],
): ContributorSkills {
  if (events.length === 0) {
    return { codeQuality: 0, consistency: 0, complexity: 0, security: 0, velocity: 0, reliability: 0 };
  }

  const totalPRs = contributor.totalApprovals + contributor.totalRejections + contributor.totalCloses + contributor.totalSelfCloses;
  const approvalRate = totalPRs > 0 ? contributor.totalApprovals / totalPRs : 0;

  // Code Quality: Based on approval rate and low rejection streak
  const codeQuality = Math.min(100, Math.round(approvalRate * 100));

  // Consistency: Based on streak length, regular activity over time
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  let maxStreak = 0;
  let currentApprovalRun = 0;
  for (const e of sorted) {
    if (e.type === "approve") {
      currentApprovalRun++;
      maxStreak = Math.max(maxStreak, currentApprovalRun);
    } else if (e.type === "reject" || e.type === "close") {
      currentApprovalRun = 0;
    }
  }
  const streakFactor = Math.min(1, maxStreak / 10);
  const activeDays = new Set(sorted.map((e) => new Date(e.timestamp).toISOString().slice(0, 10))).size;
  const daySpan = sorted.length >= 2
    ? Math.max(1, (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 86400000)
    : 1;
  const activitySpread = Math.min(1, activeDays / Math.max(1, daySpan * 0.5));
  const consistency = Math.min(100, Math.round(((streakFactor * 0.6) + (activitySpread * 0.4)) * 100));

  // Complexity: Based on average lines changed and large PR ratio
  const avgLines = events.reduce((sum, e) => sum + (e.linesChanged || 0), 0) / events.length;
  const largePRRatio = events.filter((e) => (e.linesChanged || 0) > 150).length / events.length;
  const complexityScore = Math.min(100, Math.round(
    (Math.min(1, avgLines / 300) * 0.5 + largePRRatio * 0.5) * 100,
  ));

  // Security: Based on security/critical-fix label frequency
  const securityEvents = events.filter((e) =>
    e.labels?.some((l) => {
      const normalized = l.toLowerCase().replace(/\s+/g, "-");
      return normalized === "security" || normalized === "critical-fix";
    }),
  );
  const securityScore = Math.min(100, Math.round(
    (securityEvents.length / Math.max(1, events.length)) * 400,
  ));

  // Velocity: Based on weekly PR throughput relative to soft cap (10/week)
  const weekAgo = Date.now() - 7 * 86400000;
  const recentCount = events.filter((e) => e.timestamp >= weekAgo).length;
  const velocityScore = Math.min(100, Math.round((recentCount / 10) * 100));

  // Reliability: Based on low self-close/close rate and high approval rate
  const negativeRate = totalPRs > 0
    ? (contributor.totalCloses + contributor.totalSelfCloses) / totalPRs
    : 0;
  const reliabilityScore = Math.min(100, Math.round((1 - negativeRate) * approvalRate * 100));

  return {
    codeQuality,
    consistency,
    complexity: complexityScore,
    security: securityScore,
    velocity: velocityScore,
    reliability: reliabilityScore,
  };
}

// Cache the computed results so we don't recompute on every call
let cachedContributors: ContributorData[] | null = null;
let cachedStats: TrustStats | null = null;
let cachedSkills: Map<string, ContributorSkills> | null = null;

function ensureComputed(): void {
  if (cachedContributors !== null) return;

  const now = Date.now();
  const raw = (trustData.contributors ?? []) as unknown as RawContributor[];
  cachedContributors = recomputeContributors(raw, now);
  cachedStats = computeStats(cachedContributors);

  cachedSkills = new Map();
  for (const c of cachedContributors) {
    cachedSkills.set(c.username.toLowerCase(), computeSkills(c, c.events));
  }
}

export function getContributors(): ContributorData[] {
  ensureComputed();
  return cachedContributors!;
}

export function getContributor(username: string): ContributorData | undefined {
  ensureComputed();
  return cachedContributors!.find(
    (c) => c.username.toLowerCase() === username.toLowerCase(),
  );
}

const scoreHistoryCache = new Map<string, { timestamp: number; score: number }[]>();

export function getContributorScoreHistory(username: string): { timestamp: number; score: number }[] {
  const key = username.toLowerCase();
  if (scoreHistoryCache.has(key)) return scoreHistoryCache.get(key)!;

  const contributor = getContributor(username);
  if (!contributor || contributor.events.length === 0) {
    const empty = [{ timestamp: Date.now(), score: 35 }];
    scoreHistoryCache.set(key, empty);
    return empty;
  }

  const state: ContributorState = {
    contributor: contributor.username,
    createdAt: new Date(contributor.firstSeenAt).getTime(),
    events: contributor.events,
    manualAdjustment: 0,
  };

  const history = computeScoreHistory(state, undefined, Date.now());
  scoreHistoryCache.set(key, history);
  return history;
}

export function getContributorSkills(username: string): ContributorSkills {
  ensureComputed();
  return cachedSkills!.get(username.toLowerCase()) ?? {
    codeQuality: 0, consistency: 0, complexity: 0, security: 0, velocity: 0, reliability: 0,
  };
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
