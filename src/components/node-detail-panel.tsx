"use client";

import { X, Star, GitFork, AlertCircle, ExternalLink, Users, Zap, Radio, Orbit } from "lucide-react";
import type { EcosystemNode } from "@/lib/ecosystem-types";

const STAR_COLORS: Record<string, { main: string; glow: string }> = {
  core: { main: "#fef08a", glow: "#fbbf24" },
  "official-tool": { main: "#38bdf8", glow: "#0ea5e9" },
  plugin: { main: "#c084fc", glow: "#a855f7" },
  community: { main: "#4ade80", glow: "#22c55e" },
  documentation: { main: "#fb923c", glow: "#f97316" },
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "PRIME STAR",
  "official-tool": "ORBITAL STATION",
  plugin: "SATELLITE",
  community: "OUTPOST",
  documentation: "DATA ARCHIVE",
};

interface NodeDetailPanelProps {
  node: EcosystemNode;
  onClose: () => void;
  onExpand: (node: EcosystemNode) => void;
  isExpanded: boolean;
}

export default function NodeDetailPanel({
  node,
  onClose,
  onExpand,
  isExpanded,
}: NodeDetailPanelProps) {
  const colors = STAR_COLORS[node.category] || STAR_COLORS.community;
  const timeSinceUpdate = getTimeSince(node.updatedAt);

  return (
    <div className="absolute right-0 top-0 h-full w-[380px] z-40 animate-slide-in-right">
      <div className="h-full border-l border-border bg-gradient-to-b from-[#080f1e]/98 to-[#0f1729]/95 backdrop-blur-xl flex flex-col overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent animate-pulse" />
        </div>

        {/* Header */}
        <div className="relative p-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.main, boxShadow: `0 0 12px ${colors.main}` }}
                />
                <span
                  className="text-[10px] font-mono tracking-[0.2em] px-2 py-0.5 rounded"
                  style={{
                    color: colors.main,
                    backgroundColor: colors.main + "15",
                    border: `1px solid ${colors.main}30`,
                  }}
                >
                  {CATEGORY_LABELS[node.category] || node.category.toUpperCase()}
                </span>
              </div>

              {/* Name */}
              <h2
                className="text-xl font-bold font-mono tracking-wide truncate"
                style={{ color: colors.main }}
              >
                {node.category === "core" ? "ELIZA PRIME" : node.name.toUpperCase()}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1 opacity-70">
                {node.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Description */}
          {node.description && (
            <div className="hud-panel rounded-lg p-4 relative">
              <div className="hud-corner hud-corner-tl" />
              <div className="hud-corner hud-corner-tr" />
              <div className="hud-corner hud-corner-bl" />
              <div className="hud-corner hud-corner-br" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {node.description}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Star size={14} />}
              label="LUMINOSITY"
              value={node.stars.toLocaleString()}
              color="#fbbf24"
            />
            <StatCard
              icon={<GitFork size={14} />}
              label="FORKS"
              value={node.forks.toLocaleString()}
              color="#38bdf8"
            />
            <StatCard
              icon={<AlertCircle size={14} />}
              label="ANOMALIES"
              value={node.openIssues.toLocaleString()}
              color="#f43f5e"
            />
            <StatCard
              icon={<Zap size={14} />}
              label="COUPLING"
              value={`${node.couplingScore}/100`}
              color={colors.main}
            />
          </div>

          {/* Coupling strength visualization */}
          <div className="hud-panel rounded-lg p-4 relative">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-accent tracking-[0.2em]">
                GRAVITATIONAL BINDING
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: colors.main }}>
                {node.couplingScore}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${node.couplingScore}%`,
                  background: `linear-gradient(90deg, ${colors.glow}, ${colors.main})`,
                  boxShadow: `0 0 20px ${colors.main}50`,
                }}
              />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2 opacity-70">
              {node.couplingScore >= 80
                ? "TIGHTLY BOUND TO CORE"
                : node.couplingScore >= 50
                ? "MODERATE ORBITAL DISTANCE"
                : "OUTER SYSTEM BODY"}
            </p>
          </div>

          {/* Meta info */}
          <div className="space-y-2">
            {node.language && (
              <MetaRow label="PRIMARY LANG" value={node.language} />
            )}
            <MetaRow label="LAST SIGNAL" value={timeSinceUpdate} />
            {node.isFork && <MetaRow label="ORIGIN" value="FORKED BODY" />}
          </div>

          {/* Topics */}
          {node.topics.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
                CLASSIFICATION TAGS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {node.topics.slice(0, 12).map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 text-muted-foreground border border-border"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contributors */}
          {node.contributors.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
                CREW MANIFEST
              </p>
              <div className="space-y-2">
                {node.contributors.map((c, i) => (
                  <a
                    key={c.login}
                    href={`https://github.com/${c.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground w-4">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="relative">
                      <img
                        src={c.avatarUrl}
                        alt={`${c.login}`}
                        className="w-8 h-8 rounded-full border border-border"
                        crossOrigin="anonymous"
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background"
                        style={{ backgroundColor: colors.main }}
                      />
                    </div>
                    <span className="text-sm font-mono text-foreground group-hover:text-accent transition-colors">
                      {c.login}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                      {c.contributions} COMMITS
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Expand button */}
          {node.contributors.length > 0 && node.category !== "core" && (
            <button
              onClick={() => onExpand(node)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-mono tracking-wider transition-all border"
              style={{
                borderColor: isExpanded ? colors.main + "60" : "rgba(56, 189, 248, 0.2)",
                backgroundColor: isExpanded ? colors.main + "10" : "transparent",
                color: isExpanded ? colors.main : "#7dd3fc",
              }}
            >
              <Orbit size={14} />
              {isExpanded ? "COLLAPSE CREW ORBITS" : "DEPLOY CREW TO ORBIT"}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <a
            href={`https://github.com/${node.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-mono font-medium tracking-wider transition-all"
            style={{
              background: `linear-gradient(135deg, ${colors.main}20, ${colors.glow}10)`,
              color: colors.main,
              border: `1px solid ${colors.main}40`,
              boxShadow: `0 0 30px ${colors.main}10`,
            }}
          >
            <Radio size={14} />
            OPEN TRANSMISSION LINK
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="hud-panel rounded-lg p-3 relative">
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />
      
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[9px] font-mono tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm font-mono">
      <span className="text-muted-foreground text-xs tracking-wider">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return "TODAY";
  if (days === 1) return "1 CYCLE AGO";
  if (days < 30) return `${days} CYCLES AGO`;
  if (days < 365) return `${Math.floor(days / 30)} MONTHS AGO`;
  return `${Math.floor(days / 365)} YEARS AGO`;
}
