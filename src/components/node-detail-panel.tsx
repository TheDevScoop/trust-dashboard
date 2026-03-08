"use client";

import { X, Star, GitFork, AlertCircle, ExternalLink, Users, Zap } from "lucide-react";
import type { EcosystemNode } from "@/lib/ecosystem-types";

const CATEGORY_COLORS: Record<string, string> = {
  core: "#22d3ee",
  "official-tool": "#3b82f6",
  plugin: "#a78bfa",
  community: "#34d399",
  documentation: "#fbbf24",
  game: "#f472b6",
  adapter: "#fb923c",
  client: "#38bdf8",
  infrastructure: "#94a3b8",
  "community-plugin": "#6ee7b7",
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  "official-tool": "Official",
  plugin: "Plugin",
  community: "Community",
  documentation: "Docs",
  game: "Game",
  adapter: "Adapter",
  client: "Client",
  infrastructure: "Infra",
  "community-plugin": "Community Plugin",
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
  const color = CATEGORY_COLORS[node.category] || "#64748b";
  const timeSinceUpdate = getTimeSince(node.updatedAt);

  return (
    <div className="absolute right-0 top-0 h-full w-[360px] z-40 animate-slide-in-right">
      <div className="h-full border-l border-border bg-card/90 backdrop-blur-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  color,
                  backgroundColor: color + "1a",
                  border: `1px solid ${color}33`,
                }}
              >
                {CATEGORY_LABELS[node.category] || node.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground truncate">
              {node.name}
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              {node.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Description */}
          {node.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {node.description}
            </p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Star size={14} />}
              label="Stars"
              value={node.stars.toLocaleString()}
              color="#fbbf24"
            />
            <StatCard
              icon={<GitFork size={14} />}
              label="Forks"
              value={node.forks.toLocaleString()}
              color="#3b82f6"
            />
            <StatCard
              icon={<AlertCircle size={14} />}
              label="Issues"
              value={node.openIssues.toLocaleString()}
              color="#f87171"
            />
            <StatCard
              icon={<Zap size={14} />}
              label="Coupling"
              value={`${node.couplingScore}/100`}
              color={color}
            />
          </div>

          {/* Coupling score bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Coupling Strength
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color }}
              >
                {node.couplingScore}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${node.couplingScore}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="space-y-2 text-sm">
            {node.language && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="text-foreground font-medium">
                  {node.language}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span className="text-foreground">{timeSinceUpdate}</span>
            </div>
            {node.isFork && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fork</span>
                <span className="text-foreground">Yes</span>
              </div>
            )}
          </div>

          {/* Topics */}
          {node.topics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {node.topics.slice(0, 10).map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Top Contributors
              </p>
              <div className="space-y-2">
                {node.contributors.map((c) => (
                  <a
                    key={c.login}
                    href={`https://github.com/${c.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <img
                      src={c.avatarUrl}
                      alt={`${c.login}'s avatar`}
                      className="w-7 h-7 rounded-full border border-border"
                      crossOrigin="anonymous"
                    />
                    <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                      {c.login}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">
                      {c.contributions.toLocaleString()} commits
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
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
            >
              <Users size={14} />
              {isExpanded
                ? "Collapse contributors"
                : "Expand contributors on graph"}
            </button>
          )}
        </div>

        {/* Footer link */}
        <div className="p-4 border-t border-border">
          <a
            href={`https://github.com/${node.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: color + "1a",
              color,
              border: `1px solid ${color}33`,
            }}
          >
            View on GitHub
            <ExternalLink size={14} />
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
    <div className="rounded-lg bg-muted/50 border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
