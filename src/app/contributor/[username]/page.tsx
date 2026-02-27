import Link from "next/link";
import { EventTimeline } from "@/components/contributor/event-timeline";
import { ScoreBreakdownViz } from "@/components/contributor/score-breakdown";
import { ScoreSparkline } from "@/components/contributor/score-sparkline";
import { VelocityGauge } from "@/components/contributor/velocity-gauge";
import { SkillsRadar } from "@/components/contributor/skills-radar";
import { getContributor, getContributors, getContributorSkills } from "@/lib/data-loader";
import { TIERS, getNextTier, getPointsToNextTier } from "@/lib/trust-scoring";

function formatPct(value: number): string {
  return `${Math.max(0, value).toFixed(1)}%`;
}

function normalizeTimestamp(ts: number): number {
  return ts < 1_000_000_000_000 ? ts * 1000 : ts;
}

function estimateDaysToNextTier(
  score: number,
  scoreHistory: { timestamp: number; score: number }[],
): string {
  const pointsNeeded = getPointsToNextTier(score);
  if (!pointsNeeded || scoreHistory.length < 2) return "At top tier";

  const history = [...scoreHistory].sort((a, b) => a.timestamp - b.timestamp).slice(-10);
  const first = history[0];
  const last = history[history.length - 1];
  const deltaScore = last.score - first.score;
  const elapsedDays = Math.max(
    1,
    (normalizeTimestamp(last.timestamp) - normalizeTimestamp(first.timestamp)) / 86_400_000,
  );
  const ratePerDay = deltaScore / elapsedDays;

  if (ratePerDay <= 0.05) return "Trend too flat to estimate";

  const days = Math.ceil(pointsNeeded / ratePerDay);
  if (days < 1) return "< 1 day at current pace";
  return `${days} days at current pace`;
}

export default async function ContributorDetailPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Use recomputed data from data-loader (not raw JSON)
  const contributor = getContributor(username);
  const allContributors = getContributors();
  const sorted = [...allContributors].sort((a, b) => b.trustScore - a.trustScore);

  if (!contributor) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Leaderboard &gt; {username}
        </p>
        <h2 className="mt-2 text-2xl font-bold">Contributor not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {"We couldn't find a contributor with that username."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-accent hover:underline"
        >
          {"<- Back to Leaderboard"}
        </Link>
      </div>
    );
  }

  const skills = getContributorSkills(username);
  const tier = contributor.tier;
  const rank =
    sorted.findIndex(
      (entry) =>
        entry.username.toLowerCase() === contributor.username.toLowerCase(),
    ) + 1;
  const total = sorted.length;
  const totalPRs =
    contributor.totalApprovals +
    contributor.totalRejections +
    contributor.totalCloses +
    contributor.totalSelfCloses;
  const approvalRate =
    totalPRs > 0 ? (contributor.totalApprovals / totalPRs) * 100 : 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyVelocity = contributor.events.filter(
    (event) => normalizeTimestamp(event.timestamp) >= weekAgo,
  ).length;

  const nextTier = getNextTier(contributor.trustScore);
  const pointsToNext = getPointsToNextTier(contributor.trustScore);
  const tierMin = tier.minScore;
  const tierMax = nextTier ? nextTier.minScore : 100;
  const tierProgress = Math.min(
    100,
    Math.max(
      0,
      ((contributor.trustScore - tierMin) / Math.max(1, tierMax - tierMin)) *
        100,
    ),
  );

  const streakText =
    contributor.currentStreakType === "approve"
      ? `${contributor.currentStreakLength} approval streak`
      : contributor.currentStreakType === "negative"
        ? `${contributor.currentStreakLength} negative streak`
        : "No active streak";

  // Compute daily cap utilization from breakdown
  const dailyCapLoss = contributor.breakdown.eventDetails.reduce(
    (sum, event) => sum + (event.cappedBy ?? 0),
    0,
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-block text-sm text-accent hover:underline"
        >
          {"<- Back to Leaderboard"}
        </Link>
        <div className="text-xs text-muted-foreground">
          Leaderboard &gt; {contributor.username}
        </div>
      </div>

      {/* Header */}
      <section className="rounded-xl border border-border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contributor.avatarUrl}
              alt={contributor.username}
              className="h-16 w-16 rounded-full border border-border bg-muted"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                @{contributor.username}
              </h1>
              <p className="text-sm text-muted-foreground">
                Rank #{rank} of {total}
              </p>
              {contributor.autoMergeEligible && (
                <span className="mt-2 inline-flex rounded-full border border-tier-legendary/40 px-2.5 py-1 text-xs text-tier-legendary">
                  Auto-merge eligible
                </span>
              )}
            </div>
          </div>

          <div className="text-left md:text-right">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-sm capitalize"
              style={{
                borderColor: `${tier.color}66`,
                color: tier.color,
                backgroundColor: `${tier.bg}`,
              }}
            >
              {tier.icon} {tier.label}
            </span>
            <div
              className="mt-2 text-4xl font-bold font-mono"
              style={{ color: tier.color }}
            >
              {contributor.trustScore.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Trust score (0-100)
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <InfoCard
          label="Current Score"
          value={contributor.trustScore.toFixed(1)}
          subtitle={`${tier.label} tier`}
          accent={tier.color}
        />
        <InfoCard
          label="Approval Rate"
          value={formatPct(approvalRate)}
          subtitle={`${contributor.totalApprovals}/${totalPRs || 0} approved`}
        />
        <InfoCard
          label="Streak"
          value={
            contributor.currentStreakLength > 0
              ? String(contributor.currentStreakLength)
              : "-"
          }
          subtitle={streakText}
        />
        <InfoCard
          label="Weekly Velocity"
          value={`${weeklyVelocity}`}
          subtitle="PRs this week"
        />
        <InfoCard
          label="Total PRs"
          value={String(totalPRs)}
          subtitle={`${contributor.totalRejections} rejected, ${contributor.totalCloses} closed`}
        />
        <InfoCard
          label="Daily Cap Lost"
          value={dailyCapLoss > 0 ? dailyCapLoss.toFixed(1) : "0"}
          subtitle={dailyCapLoss > 0 ? "Points capped" : "No cap applied"}
        />
      </section>

      {/* Skills Radar */}
      <SkillsRadar skills={skills} tierColor={tier.color} />

      {/* Score Breakdown */}
      <ScoreBreakdownViz breakdown={contributor.breakdown} />

      {/* Score Trend + Velocity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <ScoreSparkline history={contributor.scoreHistory} />
        <VelocityGauge weeklyCount={weeklyVelocity} softCap={10} hardCap={25} />
      </div>

      {/* Next Tier Progress */}
      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h3 className="text-lg font-semibold mb-3">Next Tier Progress</h3>
        {nextTier && pointsToNext !== null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground capitalize">
                {tier.label} {"-> "} {nextTier.label}
              </span>
              <span className="font-mono">
                {pointsToNext.toFixed(1)} points needed
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${tierProgress}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Est.{" "}
              {estimateDaysToNextTier(
                contributor.trustScore,
                contributor.scoreHistory,
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-tier-legendary">
            Top tier reached. No higher tier available.
          </div>
        )}
      </section>

      {/* Warnings */}
      {contributor.warnings.length > 0 && (
        <section className="rounded-xl border border-tier-probationary/40 bg-tier-probationary/5 p-4 md:p-5">
          <h3 className="text-lg font-semibold mb-2 text-tier-probationary">
            Warnings
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {contributor.warnings.map((warning, i) => (
              <li key={i} className="font-mono text-xs">
                {warning}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Event Timeline */}
      <EventTimeline
        username={contributor.username}
        events={contributor.events}
        eventDetails={contributor.breakdown.eventDetails}
      />

      {/* Tier Reference */}
      <section className="text-center text-xs text-muted-foreground pb-3">
        Tier thresholds:{" "}
        {TIERS.map(
          (tierLine) => `${tierLine.label} ${tierLine.minScore}+`,
        ).join(" . ")}
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div
        className="mt-1 text-xl font-bold font-mono"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}
