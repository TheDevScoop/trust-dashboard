"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import EcosystemGraph from "@/components/ecosystem-graph";
import NodeDetailPanel from "@/components/node-detail-panel";
import GraphControls from "@/components/graph-controls";
import type { EcosystemNode, EcosystemData } from "@/lib/ecosystem-types";

const ALL_CATEGORIES = new Set([
  "core",
  "official-tool",
  "plugin",
  "community",
  "documentation",
]);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch ecosystem data");
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(ALL_CATEGORIES);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data, error, isLoading, mutate } = useSWR<EcosystemData>(
    "/api/ecosystem",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const handleNodeClick = useCallback((node: EcosystemNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDoubleClick = useCallback((node: EcosystemNode) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const handleToggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        if (next.size > 1) next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    mutate(
      fetch("/api/ecosystem?refresh=true")
        .then((r) => r.json())
        .then((d) => d as EcosystemData)
    );
  }, [mutate]);

  const handleExpandFromPanel = useCallback((node: EcosystemNode) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  // Close panel on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* HUD Controls */}
      <GraphControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        meta={data?.meta || null}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Main graph area */}
      <div
        className="w-full h-full transition-[padding] duration-300"
        style={{ paddingRight: selectedNode ? 380 : 0 }}
      >
        {isLoading && !data && <LoadingState />}
        {error && !data && <ErrorState onRetry={handleRefresh} />}
        {data && (
          <EcosystemGraph
            data={data}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            searchQuery={searchQuery}
            activeCategories={activeCategories}
            expandedNodes={expandedNodes}
          />
        )}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExpand={handleExpandFromPanel}
          isExpanded={expandedNodes.has(selectedNode.id)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  const [statusText, setStatusText] = useState("INITIALIZING SYSTEMS");

  useEffect(() => {
    const messages = [
      "INITIALIZING SYSTEMS",
      "SCANNING STAR CHARTS",
      "MAPPING ORBITAL PATHS",
      "ANALYZING GRAVITATIONAL BONDS",
      "LOADING CREW MANIFESTS",
      "ESTABLISHING CONNECTIONS",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setStatusText(messages[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8">
      {/* Animated rings */}
      <div className="relative w-40 h-40">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border border-accent/30 animate-spin-slow"
          style={{ animationDuration: "20s" }}
        />
        {/* Middle ring */}
        <div
          className="absolute inset-4 rounded-full border border-purple-500/40 animate-spin-slow"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-8 rounded-full border border-orange-500/30 animate-spin-slow"
          style={{ animationDuration: "10s" }}
        />
        {/* Core */}
        <div className="absolute inset-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
          <span className="text-2xl font-bold text-black">E</span>
        </div>
        {/* Orbiting dots */}
        <div
          className="absolute inset-0 animate-spin-slow"
          style={{ animationDuration: "8s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
        </div>
        <div
          className="absolute inset-4 animate-spin-slow"
          style={{ animationDuration: "6s", animationDirection: "reverse" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center animate-fade-in">
        <p className="text-sm font-mono font-medium text-accent tracking-[0.3em]">
          ELIZA CARTOGRAPHY
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-2 tracking-wider animate-pulse">
          {statusText}...
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent via-purple-500 to-accent animate-pulse"
          style={{
            width: "60%",
            animation: "pulse 2s ease-in-out infinite, shimmer 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Error icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 flex items-center justify-center">
          <span className="text-red-400 text-3xl font-bold">!</span>
        </div>
        <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping opacity-50" />
      </div>

      {/* Error text */}
      <div className="text-center hud-panel rounded-lg px-6 py-4 relative">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
        
        <p className="text-sm font-mono font-medium text-red-400 tracking-wider">
          TRANSMISSION FAILURE
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-2 max-w-xs">
          Unable to establish connection with galaxy data. Verify GITHUB_TOKEN configuration or retry transmission.
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-lg font-mono text-sm tracking-wider transition-all border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent/50"
      >
        RETRY TRANSMISSION
      </button>
    </div>
  );
}
