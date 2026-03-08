"use client";

import { useState, useRef, useEffect } from "react";
import {
  ARCADE_FIGHTERS,
  TIER_COLORS,
  getFightersForRepo,
  getAllRepoNames,
  type ArcadeFighter,
} from "@/lib/arcade-data";

type ScopeTab = "global" | "tier" | "repo";

interface MKLeaderboardProps {
  filterRepo?: string;
  title?: string;
}

export default function MKLeaderboard({ filterRepo, title }: MKLeaderboardProps) {
  const [scope, setScope] = useState<ScopeTab>(filterRepo ? "repo" : "global");
  const [selectedTier, setSelectedTier] = useState<ArcadeFighter["tier"] | "all">("all");
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string | undefined>(filterRepo);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Derive fighters list based on scope
  let fighters: ArcadeFighter[];
  let scopeTitle: string;

  if (scope === "repo" && selectedRepoFilter) {
    fighters = getFightersForRepo(selectedRepoFilter);
    scopeTitle = `${selectedRepoFilter.toUpperCase()} FIGHTERS`;
  } else if (scope === "tier" && selectedTier !== "all") {
    fighters = ARCADE_FIGHTERS.filter((f) => f.tier === selectedTier);
    scopeTitle = `${selectedTier.toUpperCase()} TIER`;
  } else {
    fighters = ARCADE_FIGHTERS;
    scopeTitle = "SELECT YOUR FIGHTER";
  }

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showBio, setShowBio] = useState(false);
  const [vsFlash, setVsFlash] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = Math.min(5, fighters.length);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIdx(0);
    setShowBio(false);
  }, [scope, selectedTier, selectedRepoFilter]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const len = fighters.length;
      if (e.key === "ArrowRight") setSelectedIdx((i) => (i + 1) % len);
      else if (e.key === "ArrowLeft") setSelectedIdx((i) => (i - 1 + len) % len);
      else if (e.key === "ArrowDown") setSelectedIdx((i) => Math.min(i + cols, len - 1));
      else if (e.key === "ArrowUp") setSelectedIdx((i) => Math.max(i - cols, 0));
      else if (e.key === "Enter") {
        setVsFlash(true);
        setTimeout(() => {
          setVsFlash(false);
          setShowBio((b) => !b);
        }, 400);
      }
      else if (e.key === "Escape") setShowBio(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fighters.length, cols]);

  const selected = fighters[selectedIdx];

  return (
    <div className="mk-screen">
      {/* VS Flash overlay */}
      {vsFlash && (
        <div className="mk-vs-flash">
          <div className="mk-vs-text">VS</div>
        </div>
      )}

      {/* Dragon ornament header */}
      <div className="mk-header">
        <div className="mk-dragon-left">
          <DragonSVG flip={false} />
        </div>
        <div className="mk-title-block">
          <div className="mk-subtitle">ELIZAOS ARCADE</div>
          <h1 className="mk-title">
            {title || scopeTitle}
          </h1>
          <div className="mk-title-underline" />
        </div>
        <div className="mk-dragon-right">
          <DragonSVG flip={true} />
        </div>
      </div>

      {/* Scope tabs — functional */}
      <div className="mk-scope-tabs">
        <button
          className={`mk-scope-tab ${scope === "global" ? "mk-scope-active" : ""}`}
          onClick={() => { setScope("global"); setShowRepoDropdown(false); }}
        >
          GLOBAL
        </button>
        <button
          className={`mk-scope-tab ${scope === "tier" ? "mk-scope-active" : ""}`}
          onClick={() => { setScope("tier"); setShowRepoDropdown(false); }}
        >
          BY TIER
        </button>
        <button
          className={`mk-scope-tab ${scope === "repo" ? "mk-scope-active" : ""}`}
          onClick={() => { setScope("repo"); setShowRepoDropdown((v) => !v); }}
        >
          BY REPO
        </button>
      </div>

      {/* Tier filter pills */}
      {scope === "tier" && (
        <div className="mk-filter-row">
          {(["all", "boss", "champion", "warrior", "rookie"] as const).map((t) => (
            <button
              key={t}
              className={`mk-filter-pill ${selectedTier === t ? "mk-filter-pill-active" : ""}`}
              style={t !== "all" ? { borderColor: TIER_COLORS[t], color: selectedTier === t ? "#000" : TIER_COLORS[t], backgroundColor: selectedTier === t ? TIER_COLORS[t] : "transparent" } : undefined}
              onClick={() => setSelectedTier(t)}
            >
              {t === "all" ? "ALL" : t.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Repo picker */}
      {scope === "repo" && showRepoDropdown && (
        <div className="mk-repo-picker">
          <button
            className={`mk-repo-pill ${!selectedRepoFilter ? "mk-repo-pill-active" : ""}`}
            onClick={() => { setSelectedRepoFilter(undefined); setShowRepoDropdown(false); setScope("global"); }}
          >
            ALL REPOS
          </button>
          {getAllRepoNames().map((r) => (
            <button
              key={r}
              className={`mk-repo-pill ${selectedRepoFilter === r ? "mk-repo-pill-active" : ""}`}
              onClick={() => { setSelectedRepoFilter(r); setShowRepoDropdown(false); }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

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
                setVsFlash(true);
                setTimeout(() => {
                  setVsFlash(false);
                  setShowBio(true);
                }, 400);
              }}
            />
          ))}
        </div>

        {/* Bio panel */}
        <div className={`mk-bio-panel ${showBio ? "mk-bio-open" : ""}`}>
          {selected && <FighterBio fighter={selected} rank={selectedIdx + 1} />}
        </div>
      </div>

      {/* Bottom HUD */}
      {selected && !showBio && (
        <div className="mk-bottom-bar">
          {/* Left: P1 info */}
          <div className="mk-hud-player">
            <div className="mk-hud-p-label">P1</div>
            <div className="mk-hud-name-block">
              <span className="mk-rank">#{selectedIdx + 1}</span>
              <span className="mk-fighter-name">{selected.username}</span>
            </div>
            <div className="mk-hud-title" style={{ color: TIER_COLORS[selected.tier] }}>
              {selected.title}
            </div>
            {/* Health bar style stat */}
            <div className="mk-health-bar">
              <div className="mk-health-fill" style={{
                width: `${(selected.score / 10000) * 100}%`,
                background: `linear-gradient(90deg, ${TIER_COLORS[selected.tier]}, ${TIER_COLORS[selected.tier]}88)`,
              }} />
              <span className="mk-health-text">{selected.score.toLocaleString()} elizaEffect</span>
            </div>
          </div>

          {/* Center: stat hexagon */}
          <div className="mk-hud-stats">
            <HudStat label="PRs" value={selected.stats.prsMerged} max={850} color="#ff0040" />
            <HudStat label="REV" value={selected.stats.reviewsGiven} max={1200} color="#ffd700" />
            <HudStat label="ISS" value={selected.stats.issuesClosed} max={320} color="#00ccff" />
            <HudStat label="LOC" value={selected.stats.linesChanged} max={285000} color="#ff8800" />
            <HudStat label="CMT" value={selected.stats.commits} max={2100} color="#a78bfa" />
            <HudStat label="SOC" value={selected.stats.socialScore} max={100} color="#88ff88" />
          </div>

          {/* Right: score */}
          <div className="mk-hud-score">
            <div className="mk-score-label">POWER LEVEL</div>
            <div className="mk-score-value">{selected.score.toLocaleString()}</div>
            <div className="mk-score-tier" style={{ color: TIER_COLORS[selected.tier] }}>
              {selected.tier.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mk-controls-hint">
        <span className="mk-key">D-PAD</span> MOVE
        <span className="mk-key-sep">|</span>
        <span className="mk-key">START</span> SELECT
        <span className="mk-key-sep">|</span>
        <span className="mk-key">B</span> BACK
      </div>
    </div>
  );
}

// ── Dragon ornament SVG ─────────────────────────────────────────────
function DragonSVG({ flip }: { flip: boolean }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className="mk-dragon-svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* Stylized dragon/serpent */}
      <path
        d="M5,35 C8,30 12,28 15,25 C18,22 20,18 22,15 C24,12 28,8 32,6 C36,4 40,5 42,8 C44,11 43,15 40,18 C37,21 34,22 36,25 C38,28 42,28 45,30 C48,32 52,35 55,35"
        fill="none"
        stroke="#ff004066"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Wing */}
      <path
        d="M28,12 C32,6 38,3 42,5 C38,8 35,12 33,15"
        fill="#ff004022"
        stroke="#ff004044"
        strokeWidth="0.8"
      />
      {/* Eye */}
      <circle cx="40" cy="9" r="1.5" fill="#ffd700" />
      {/* Flame */}
      <path
        d="M42,8 C44,5 47,4 48,6 C47,5 45,6 44,8"
        fill="#ff0040"
        opacity="0.6"
      />
    </svg>
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
      className={`mk-cell ${isSelected ? "mk-cell-selected" : ""} mk-cell-${fighter.tier}`}
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

      {/* Tier emblem (top right) */}
      <div className="mk-cell-emblem" style={{ borderColor: tierColor }}>
        {fighter.tier === "boss" ? "S" : fighter.tier === "champion" ? "A" : fighter.tier === "warrior" ? "B" : "C"}
      </div>

      {/* Avatar with pixelation + color overlay */}
      <div className="mk-cell-avatar" style={{ borderColor: tierColor }}>
        <div
          className="mk-avatar-img"
          style={{ backgroundImage: `url(${fighter.avatarUrl})` }}
        />
        <div className="mk-pixel-overlay" />
        {/* Tier color tint */}
        <div className="mk-avatar-tint" style={{ backgroundColor: tierColor }} />
      </div>

      {/* Mini health bar under avatar */}
      <div className="mk-cell-hp-bar">
        <div
          className="mk-cell-hp-fill"
          style={{
            width: `${(fighter.score / 10000) * 100}%`,
            backgroundColor: tierColor,
          }}
        />
      </div>

      {/* Name */}
      <div className="mk-cell-name">{fighter.username}</div>

      {/* Score */}
      <div className="mk-cell-score">{fighter.score.toLocaleString()}</div>
    </button>
  );
}

// ── HUD stat (bottom bar) ───────────────────────────────────────────
function HudStat({
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
  const displayVal = value >= 10000
    ? `${(value / 1000).toFixed(0)}K`
    : value.toLocaleString();

  return (
    <div className="mk-hud-stat">
      <div className="mk-hud-stat-label">{label}</div>
      <div className="mk-hud-stat-bar">
        <div className="mk-hud-stat-track">
          <div
            className="mk-hud-stat-fill"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}88`,
            }}
          />
          {/* Segmented look */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="mk-hud-stat-segment"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
        <span className="mk-hud-stat-value" style={{ color }}>{displayVal}</span>
      </div>
    </div>
  );
}

// ── Stat bar (bio panel version) ────────────────────────────────────
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
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}66` }}
        />
      </div>
      <span className="mk-stat-value">{value.toLocaleString()}</span>
    </div>
  );
}

// ── Full bio panel ──────────────────────────────────────────────────
function FighterBio({ fighter, rank }: { fighter: ArcadeFighter; rank: number }) {
  const tierColor = TIER_COLORS[fighter.tier];

  return (
    <div className="mk-bio">
      {/* Header with large portrait */}
      <div className="mk-bio-header">
        <div className="mk-bio-portrait-frame" style={{ borderColor: tierColor }}>
          <div
            className="mk-bio-avatar"
            style={{ backgroundImage: `url(${fighter.avatarUrl})` }}
          />
          <div className="mk-pixel-overlay" />
          <div className="mk-bio-avatar-shine" />
        </div>
        <div className="mk-bio-info">
          <div className="mk-bio-rank" style={{ color: tierColor }}>
            RANK #{rank}
          </div>
          <h2 className="mk-bio-name">{fighter.username}</h2>
          <div className="mk-bio-title" style={{ color: tierColor }}>
            {fighter.title}
          </div>
          <div className="mk-bio-tier-badge" style={{ borderColor: tierColor, color: tierColor }}>
            {fighter.tier.toUpperCase()} TIER
          </div>
        </div>
      </div>

      {/* Special move with flame effect */}
      <div className="mk-special" style={{ borderColor: tierColor + "44" }}>
        <div className="mk-special-flames" />
        <span className="mk-special-label">FATALITY</span>
        <span className="mk-special-name" style={{ color: tierColor }}>
          {fighter.specialMove}
        </span>
      </div>

      {/* Score with ornate frame */}
      <div className="mk-bio-score" style={{ borderColor: tierColor + "33" }}>
        <span>elizaEffect POWER LEVEL</span>
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
