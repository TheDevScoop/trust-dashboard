"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import CockpitHUD from "@/components/cockpit-hud";
import NodeDetailPanel from "@/components/node-detail-panel";
import type { EcosystemNode, EcosystemData } from "@/lib/ecosystem-types";

// Dynamic import for 3D components (they need client-side only)
const GalaxyView = dynamic(() => import("@/components/galaxy-view"), {
  ssr: false,
  loading: () => <LoadingState />,
});

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

  const handleExpandFromPanel = useCallback(() => {
    // In 3D view, we could zoom to the node
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
    <div className="w-screen h-screen overflow-hidden bg-[#030014]">
      {/* Cockpit HUD overlay */}
      <CockpitHUD
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        meta={data?.meta || null}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Main 3D view */}
      <div className="w-full h-full">
        {isLoading && !data && <LoadingState />}
        {error && !data && <ErrorState onRetry={handleRefresh} />}
        {data && (
          <Suspense fallback={<LoadingState />}>
            <GalaxyView
              data={data}
              onNodeClick={handleNodeClick}
              searchQuery={searchQuery}
              activeCategories={activeCategories}
            />
          </Suspense>
        )}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExpand={handleExpandFromPanel}
          isExpanded={false}
        />
      )}
    </div>
  );
}

function LoadingState() {
  const [statusText, setStatusText] = useState("INITIALIZING WARP DRIVE");

  useEffect(() => {
    const messages = [
      "INITIALIZING WARP DRIVE",
      "CALIBRATING SENSORS",
      "SCANNING QUADRANT",
      "MAPPING STAR SYSTEMS",
      "ESTABLISHING NEURAL LINK",
      "LOADING UNIVERSE DATA",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setStatusText(messages[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-[#030014]">
      {/* Animated warp effect */}
      <div className="relative w-48 h-48">
        {/* Outer warp ring */}
        <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
        
        {/* Middle rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-cyan-500/30"
            style={{
              inset: `${i * 20}px`,
              animation: `spin ${8 + i * 2}s linear infinite${i % 2 ? " reverse" : ""}`,
            }}
          />
        ))}
        
        {/* Core glow */}
        <div className="absolute inset-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.5)]">
          <span className="text-3xl font-bold text-black animate-pulse">E</span>
        </div>
        
        {/* Particle ring */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateX(90px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-lg font-mono font-bold text-accent tracking-[0.4em]">
          ELIZA UNIVERSE
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-2 tracking-wider animate-pulse">
          {statusText}...
        </p>
      </div>

      {/* Loading bar */}
      <div className="w-72 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent via-purple-500 to-accent rounded-full"
          style={{
            width: "100%",
            animation: "shimmer 2s ease-in-out infinite",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#030014]">
      {/* Error visualization */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping" />
      </div>

      {/* Error message */}
      <div className="text-center hud-panel rounded-lg px-8 py-5 relative max-w-sm">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
        
        <p className="text-sm font-mono font-bold text-red-400 tracking-wider">
          NAVIGATION OFFLINE
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-2">
          Unable to establish connection with the Eliza Universe. Check your
          GITHUB_TOKEN configuration or retry transmission.
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="px-8 py-3 rounded-lg font-mono text-sm tracking-wider transition-all border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent/50"
      >
        REINITIALIZE CONNECTION
      </button>
    </div>
  );
}
