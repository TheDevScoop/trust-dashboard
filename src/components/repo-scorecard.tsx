"use client";

import { useState } from "react";
import {
  REPO_GRADES,
  GRADE_COLORS,
  type RepoGrade,
  type RepoGradeLetter,
} from "@/lib/arcade-data";

type SortKey = "score" | "activity" | "community" | "quality" | "adoption" | "maintenance";
type FilterOrg = "all" | "elizaOS" | "elizaos-plugins";
type FilterCategory = "all" | "official-tool" | "plugin" | "documentation" | "community";

export default function RepoScorecard() {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [filterOrg, setFilterOrg] = useState<FilterOrg>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  let repos = [...REPO_GRADES];

  // Filter
  if (filterOrg !== "all") repos = repos.filter((r) => r.org === filterOrg);
  if (filterCategory !== "all") repos = repos.filter((r) => r.category === filterCategory);

  // Sort
  repos.sort((a, b) => {
    if (sortKey === "score") return b.overallScore - a.overallScore;
    return b.dimensions[sortKey].score - a.dimensions[sortKey].score;
  });

  // Grade distribution
  const gradeCounts: Record<RepoGradeLetter, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  repos.forEach((r) => gradeCounts[r.overallGrade]++);

  return (
    <div className="sc-screen">
      {/* Header */}
      <div className="sc-header">
        <h1 className="sc-title">REPO POWER RANKINGS</h1>
        <div className="sc-subtitle">NON-CORE REPOSITORY GRADES</div>
      </div>

      {/* Grade distribution bar */}
      <div className="sc-dist">
        {(["S", "A", "B", "C", "D", "F"] as RepoGradeLetter[]).map((g) => (
          <div key={g} className="sc-dist-item">
            <div className="sc-dist-grade" style={{ color: GRADE_COLORS[g] }}>{g}</div>
            <div className="sc-dist-bar-track">
              <div
                className="sc-dist-bar-fill"
                style={{
                  width: `${(gradeCounts[g] / repos.length) * 100}%`,
                  backgroundColor: GRADE_COLORS[g],
                }}
              />
            </div>
            <div className="sc-dist-count">{gradeCounts[g]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sc-filters">
        <div className="sc-filter-group">
          <span className="sc-filter-label">ORG</span>
          {(["all", "elizaOS", "elizaos-plugins"] as FilterOrg[]).map((o) => (
            <button
              key={o}
              className={`sc-filter-btn ${filterOrg === o ? "sc-filter-active" : ""}`}
              onClick={() => setFilterOrg(o)}
            >
              {o === "all" ? "ALL" : o}
            </button>
          ))}
        </div>
        <div className="sc-filter-group">
          <span className="sc-filter-label">TYPE</span>
          {(["all", "plugin", "official-tool", "documentation", "community"] as FilterCategory[]).map((c) => (
            <button
              key={c}
              className={`sc-filter-btn ${filterCategory === c ? "sc-filter-active" : ""}`}
              onClick={() => setFilterCategory(c)}
            >
              {c === "all" ? "ALL" : c === "official-tool" ? "TOOL" : c.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="sc-filter-group">
          <span className="sc-filter-label">SORT</span>
          {(["score", "activity", "community", "quality", "adoption", "maintenance"] as SortKey[]).map((s) => (
            <button
              key={s}
              className={`sc-filter-btn ${sortKey === s ? "sc-filter-active" : ""}`}
              onClick={() => setSortKey(s)}
            >
              {s === "score" ? "OVERALL" : s.slice(0, 4).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Repo list */}
      <div className="sc-list">
        {repos.map((repo, i) => (
          <RepoCard
            key={repo.repo}
            repo={repo}
            rank={i + 1}
            expanded={expandedRepo === repo.repo}
            onToggle={() => setExpandedRepo(expandedRepo === repo.repo ? null : repo.repo)}
          />
        ))}
        {repos.length === 0 && (
          <div className="sc-empty">NO REPOS MATCH FILTERS</div>
        )}
      </div>
    </div>
  );
}

// ── Repo card ───────────────────────────────────────────────────────
function RepoCard({
  repo,
  rank,
  expanded,
  onToggle,
}: {
  repo: RepoGrade;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const gradeColor = GRADE_COLORS[repo.overallGrade];

  return (
    <div
      className={`sc-card ${expanded ? "sc-card-expanded" : ""}`}
      style={{ "--grade-color": gradeColor } as React.CSSProperties}
    >
      {/* Main row */}
      <button className="sc-card-main" onClick={onToggle}>
        {/* Rank */}
        <div className="sc-card-rank">#{rank}</div>

        {/* Grade badge */}
        <div className="sc-grade-badge" style={{ borderColor: gradeColor, color: gradeColor }}>
          <span className="sc-grade-letter">{repo.overallGrade}</span>
          <span className="sc-grade-score">{repo.overallScore}</span>
        </div>

        {/* Info */}
        <div className="sc-card-info">
          <div className="sc-card-name">{repo.displayName}</div>
          <div className="sc-card-repo">
            <span className="sc-card-org">{repo.org}/</span>
            {repo.repo}
          </div>
        </div>

        {/* Mini dimension bars */}
        <div className="sc-card-dims">
          {(["activity", "community", "quality", "adoption", "maintenance"] as const).map((dim) => (
            <div key={dim} className="sc-card-dim">
              <div className="sc-card-dim-label">{dim.slice(0, 3).toUpperCase()}</div>
              <div className="sc-card-dim-track">
                <div
                  className="sc-card-dim-fill"
                  style={{
                    width: `${repo.dimensions[dim].score}%`,
                    backgroundColor: GRADE_COLORS[repo.dimensions[dim].grade],
                  }}
                />
              </div>
              <div className="sc-card-dim-grade" style={{ color: GRADE_COLORS[repo.dimensions[dim].grade] }}>
                {repo.dimensions[dim].grade}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="sc-card-stats-mini">
          <span>* {repo.stats.stars}</span>
          <span>{repo.stats.contributors} devs</span>
        </div>

        {/* Expand indicator */}
        <div className="sc-card-expand">{expanded ? "[-]" : "[+]"}</div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="sc-card-detail">
          {/* Full dimension breakdown */}
          <div className="sc-detail-dims">
            {(["activity", "community", "quality", "adoption", "maintenance"] as const).map((dim) => {
              const d = repo.dimensions[dim];
              return (
                <div key={dim} className="sc-detail-dim">
                  <div className="sc-detail-dim-header">
                    <span className="sc-detail-dim-name">{dim.toUpperCase()}</span>
                    <span className="sc-detail-dim-grade" style={{ color: GRADE_COLORS[d.grade] }}>
                      {d.grade} ({d.score})
                    </span>
                  </div>
                  <div className="sc-detail-dim-bar">
                    <div
                      className="sc-detail-dim-fill"
                      style={{ width: `${d.score}%`, backgroundColor: GRADE_COLORS[d.grade] }}
                    />
                  </div>
                  <div className="sc-detail-dim-text">{d.detail}</div>
                </div>
              );
            })}
          </div>

          {/* Raw stats */}
          <div className="sc-detail-stats">
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.stars}</span>
              <span className="sc-detail-stat-label">STARS</span>
            </div>
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.forks}</span>
              <span className="sc-detail-stat-label">FORKS</span>
            </div>
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.contributors}</span>
              <span className="sc-detail-stat-label">DEVS</span>
            </div>
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.openIssues}</span>
              <span className="sc-detail-stat-label">ISSUES</span>
            </div>
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.weeklyCommits}</span>
              <span className="sc-detail-stat-label">WK/CMT</span>
            </div>
            <div className="sc-detail-stat">
              <span className="sc-detail-stat-val">{repo.stats.lastCommitDaysAgo}d</span>
              <span className="sc-detail-stat-label">LAST</span>
            </div>
          </div>

          {/* Category + org tags */}
          <div className="sc-detail-tags">
            <span className="sc-detail-tag">{repo.org}</span>
            <span className="sc-detail-tag">{repo.category}</span>
          </div>
        </div>
      )}
    </div>
  );
}
