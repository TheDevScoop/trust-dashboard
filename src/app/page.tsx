"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] =
    useState<Set<string>>(ALL_CATEGORIES);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<EcosystemData>("/api/ecosystem", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

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
    <div className="w-screen h-screen overflow-hidden relative bg-background">
      {/* Controls overlay */}
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
        style={{ paddingRight: selectedNode ? 360 : 0 }}
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

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-4 z-20 text-[10px] text-muted-foreground space-y-0.5">
        <p>Drag nodes to rearrange. Scroll to zoom.</p>
        <p>Click a node for details. Double-click to expand contributors.</p>
      </div>

      {/* 3D World link */}
      <Link
        href="/world"
        className="absolute bottom-4 right-4 z-20 px-4 py-2 rounded-lg border border-accent/30 bg-card/80 backdrop-blur text-sm text-accent hover:border-accent hover:bg-accent/10 transition-all"
      >
        Enter 3D World
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-spin-slow" />
        <div
          className="absolute inset-2 rounded-full border border-accent/40 animate-spin-slow"
          style={{ animationDirection: "reverse", animationDuration: "15s" }}
        />
        <div className="absolute inset-[18px] rounded-full bg-accent/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
        </div>
      </div>
      <div className="text-center animate-fade-in">
        <p className="text-sm font-medium text-foreground">
          Loading Ecosystem
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Fetching repos from GitHub...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-destructive text-2xl font-bold">!</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Failed to load ecosystem data
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Check that GITHUB_TOKEN is set, or try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-accent/50 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
