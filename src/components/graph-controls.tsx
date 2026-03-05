"use client";

import { Search, RotateCcw, Layers } from "lucide-react";

const CATEGORIES = [
  { key: "core", label: "Core", color: "#22d3ee" },
  { key: "official-tool", label: "Official", color: "#3b82f6" },
  { key: "plugin", label: "Plugins", color: "#a78bfa" },
  { key: "adapter", label: "Adapters", color: "#fb923c" },
  { key: "client", label: "Clients", color: "#38bdf8" },
  { key: "community-plugin", label: "Community Plugins", color: "#6ee7b7" },
  { key: "community", label: "Community", color: "#34d399" },
  { key: "game", label: "Games", color: "#f472b6" },
  { key: "infrastructure", label: "Infra", color: "#94a3b8" },
  { key: "documentation", label: "Docs", color: "#fbbf24" },
];

interface GraphControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  meta: {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    fetchedAt: string;
    elizaOSRepoCount: number;
    pluginRepoCount: number;
    communityRepoCount: number;
    registryPluginCount: number;
  } | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function GraphControls({
  searchQuery,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  meta,
  isLoading,
  onRefresh,
}: GraphControlsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="p-4 flex items-start justify-between gap-4">
        {/* Left: Title + Stats */}
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span className="text-accent">elizaOS</span>
            <span className="text-muted-foreground font-normal">
              Ecosystem Graph
            </span>
          </h1>
          {meta && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{meta.totalRepos} repos</span>
              <span className="text-border">|</span>
              <span>{meta.totalStars.toLocaleString()} stars</span>
              <span className="text-border">|</span>
              <span>{meta.pluginRepoCount + meta.communityRepoCount} plugins</span>
              {meta.registryPluginCount > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span>{meta.registryPluginCount} in registry</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Search + Refresh */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search repos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border bg-card/80 backdrop-blur-md pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-colors"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card/80 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RotateCcw
              size={14}
              className={isLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 pb-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Layers size={12} className="text-muted-foreground mr-1" />
          {CATEGORIES.map((cat) => {
            const isActive = activeCategories.has(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                style={{
                  backgroundColor: isActive ? cat.color + "1a" : "transparent",
                  borderColor: isActive ? cat.color + "44" : "#1e293b",
                  color: isActive ? cat.color : "#64748b",
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
