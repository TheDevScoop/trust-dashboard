"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ARCADE_FIGHTERS,
  TIER_COLORS,
  getFightersForRepo,
  type ArcadeFighter,
} from "@/lib/arcade-data";

interface MKLeaderboardProps {
  filterRepo?: string;
  title?: string;
}

export default function MKLeaderboard({ filterRepo, title }: MKLeaderboardProps) {
  const fighters = filterRepo
    ? getFightersForRepo(filterRepo)
    : ARCADE_FIGHTERS;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showBio, setShowBio] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = Math.min(5, fighters.length);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const len = fighters.length;
      if (e.key === "ArrowRight") setSelectedIdx((i) => (i + 1) % len);
      else if (e.key === "ArrowLeft") setSelectedIdx((i) => (i - 1 + len) % len);
      else if (e.key === "ArrowDown") setSelectedIdx((i) => Math.min(i + cols, len - 1));
      else if (e.key === "ArrowUp") setSelectedIdx((i) => Math.max(i - cols, 0));
      else if (e.key === "Enter") setShowBio((b) => !b);
      else if (e.key === "Escape") setShowBio(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fighters.length, cols]);

  const selected = fighters[selectedIdx];

  return (
    <div className="mk-screen">
      {/* Title bar with lightning */}
      <div className="mk-title-bar">
        <div className="mk-lightning mk-lightning-left" />
        <h1 className="mk-title">
          {title || "SELECT YOUR FIGHTER"}
        </h1>
        <div className="mk-lightning mk-lightning-right" />
      </div>

      {/* Scope tabs */}
      <div className="mk-scope-tabs">
        <span className="mk-scope-tab mk-scope-active">GLOBAL</span>
        <span className="mk-scope-tab">PER REPO</span>
        <span className="mk-scope-tab">PER PROJECT</span>
      </div>

      <div className="mk-main">
        {/* Fighter grid */}
        <div
          ref={gridRef}
          className="mk-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {fighters.map((f, i) => (
            <FighterCell
              key={f.username}
              fighter={f}
              rank={i + 1}
              isSelected={i === selectedIdx}
              onSelect={() => {
                setSelectedIdx(i);
                setShowBio(false);
              }}
              onActivate={() => {
                setSelectedIdx(i);
                setShowBio(true);
              }}
            />
          ))}
        </div>

        {/* Bio panel (slides in from right like MK) */}
        <div className={`mk-bio-panel ${showBio ? "mk-bio-open" : ""}`}>
          {selected && <FighterBio fighter={selected} rank={selectedIdx + 1} />}
        </div>
      </div>

      {/* Bottom stats bar for selected fighter */}
      {selected && !showBio && (
        <div className="mk-bottom-bar">
          <div className="mk-bottom-name">
            <span className="mk-rank">#{selectedIdx + 1}</span>
            <span className="mk-fighter-name">{selected.username}</span>
            <span className="mk-fighter-title" style={{ color: TIER_COLORS[selected.tier] }}>
              {selected.title}
            </span>
          </div>
          <div className="mk-bottom-stats">
            <StatBar label="PRs" value={selected.stats.prsMerged} max={850} color="#ff0040" />
            <StatBar label="REV" value={selected.stats.reviewsGiven} max={1200} color="#ffd700" />
            <StatBar label="ISS" value={selected.stats.issuesClosed} max={320} color="#00ccff" />
            <StatBar label="SOC" value={selected.stats.socialScore} max={100} color="#88ff88" />
          </div>
          <div className="mk-score">
            <span className="mk-score-label">elizaEffect</span>
            <span className="mk-score-value">{selected.score.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="mk-controls-hint">
        ARROWS to move | ENTER to select | ESC to close
      </div>
    </div>
  );
}

// ── Fighter grid cell ───────────────────────────────────────────────
function FighterCell({
  fighter,
  rank,
  isSelected,
  onSelect,
  onActivate,
}: {
  fighter: ArcadeFighter;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  onActivate: () => void;
}) {
  const tierColor = TIER_COLORS[fighter.tier];

  return (
    <button
      className={`mk-cell ${isSelected ? "mk-cell-selected" : ""} ${
        fighter.tier === "boss" ? "mk-cell-boss" : ""
      }`}
      onClick={onSelect}
      onDoubleClick={onActivate}
      style={{
        "--tier-color": tierColor,
        "--tier-glow": tierColor + "66",
      } as React.CSSProperties}
    >
      {/* Rank badge */}
      <div className="mk-cell-rank" style={{ backgroundColor: tierColor }}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="mk-cell-avatar">
        <div
          className="mk-avatar-img"
          style={{
            backgroundImage: `url(${fighter.avatarUrl})`,
          }}
        />
        {/* Pixelation overlay */}
        <div className="mk-pixel-overlay" />
      </div>

      {/* Name */}
      <div className="mk-cell-name">{fighter.username}</div>

      {/* Tier indicator */}
      <div className="mk-cell-tier" style={{ color: tierColor }}>
        {fighter.tier.toUpperCase()}
      </div>
    </button>
  );
}

// ── Stat bar ────────────────────────────────────────────────────────
function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mk-stat-bar">
      <span className="mk-stat-label">{label}</span>
      <div className="mk-stat-track">
        <div
          className="mk-stat-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="mk-stat-value">{value}</span>
    </div>
  );
}

// ── Full bio panel ──────────────────────────────────────────────────
function FighterBio({ fighter, rank }: { fighter: ArcadeFighter; rank: number }) {
  const tierColor = TIER_COLORS[fighter.tier];

  return (
    <div className="mk-bio">
      {/* Header */}
      <div className="mk-bio-header">
        <div
          className="mk-bio-avatar"
          style={{ backgroundImage: `url(${fighter.avatarUrl})`, borderColor: tierColor }}
        />
        <div className="mk-bio-info">
          <div className="mk-bio-rank" style={{ color: tierColor }}>
            RANK #{rank}
          </div>
          <h2 className="mk-bio-name">{fighter.username}</h2>
          <div className="mk-bio-title" style={{ color: tierColor }}>
            {fighter.title}
          </div>
        </div>
      </div>

      {/* Special move */}
      <div className="mk-special">
        <span className="mk-special-label">SPECIAL MOVE</span>
        <span className="mk-special-name" style={{ color: tierColor }}>
          {fighter.specialMove}
        </span>
      </div>

      {/* Score */}
      <div className="mk-bio-score">
        <span>elizaEffect SCORE</span>
        <span className="mk-bio-score-value">{fighter.score.toLocaleString()}</span>
      </div>

      {/* Full stats */}
      <div className="mk-bio-stats">
        <StatBar label="PRs MERGED" value={fighter.stats.prsMerged} max={850} color="#ff0040" />
        <StatBar label="REVIEWS" value={fighter.stats.reviewsGiven} max={1200} color="#ffd700" />
        <StatBar label="ISSUES" value={fighter.stats.issuesClosed} max={320} color="#00ccff" />
        <StatBar label="LINES" value={fighter.stats.linesChanged} max={285000} color="#ff8800" />
        <StatBar label="COMMITS" value={fighter.stats.commits} max={2100} color="#a78bfa" />
        <StatBar label="SOCIAL" value={fighter.stats.socialScore} max={100} color="#88ff88" />
      </div>

      {/* Repos */}
      <div className="mk-bio-repos">
        <span className="mk-bio-repos-label">ARENA HISTORY</span>
        <div className="mk-bio-repo-list">
          {fighter.repos.map((r) => (
            <span key={r} className="mk-bio-repo-tag">{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
