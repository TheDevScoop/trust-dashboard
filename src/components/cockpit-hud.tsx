"use client";

import { useState, useEffect } from "react";
import type { EcosystemData } from "@/lib/ecosystem-types";

const CATEGORY_COLORS: Record<string, string> = {
  core: "#fbbf24",
  "official-tool": "#06b6d4",
  plugin: "#a855f7",
  community: "#22c55e",
  documentation: "#f97316",
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "CORE SYSTEM",
  "official-tool": "MODULES",
  plugin: "EXTENSIONS",
  community: "ALLIED",
  documentation: "ARCHIVES",
};

interface CockpitHUDProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  meta: EcosystemData["meta"] | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function CockpitHUD({
  searchQuery,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  meta,
  isLoading,
  onRefresh,
}: CockpitHUDProps) {
  const [time, setTime] = useState("");
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });
  const [systemStatus, setSystemStatus] = useState("NOMINAL");

  // Update time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate coordinate drift
  useEffect(() => {
    const interval = setInterval(() => {
      setCoordinates({
        x: Math.random() * 1000 - 500,
        y: Math.random() * 1000 - 500,
        z: Math.random() * 1000 - 500,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Random system status
  useEffect(() => {
    const statuses = ["NOMINAL", "OPTIMAL", "ACTIVE", "SCANNING"];
    const interval = setInterval(() => {
      setSystemStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Top HUD bar */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-start justify-between p-4 gap-4">
          {/* Left panel - Ship status */}
          <div className="hud-panel rounded-lg p-4 pointer-events-auto min-w-[280px]">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            {/* Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-black">E</span>
              </div>
              <div>
                <h1 className="text-sm font-mono font-bold text-accent tracking-wider">
                  ELIZA UNIVERSE
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground">
                  CARTOGRAPHY v3.0 // 3D NAV
                </p>
              </div>
            </div>
            
            {/* System status */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">STATUS</span>
                <span className="text-green-400">{systemStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TIME</span>
                <span className="text-accent">{time}</span>
              </div>
            </div>
            
            {/* Coordinates */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">
                NAV COORDINATES
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <span className="text-red-400">
                  X: {coordinates.x.toFixed(1)}
                </span>
                <span className="text-green-400">
                  Y: {coordinates.y.toFixed(1)}
                </span>
                <span className="text-blue-400">
                  Z: {coordinates.z.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md pointer-events-auto">
            <div className="hud-panel rounded-lg p-3 relative">
              <div className="hud-corner hud-corner-tl" />
              <div className="hud-corner hud-corner-tr" />
              <div className="hud-corner hud-corner-bl" />
              <div className="hud-corner hud-corner-br" />
              
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="SCAN FOR SYSTEMS..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Right panel - Stats */}
          <div className="hud-panel rounded-lg p-4 pointer-events-auto min-w-[200px]">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <p className="text-[10px] font-mono text-muted-foreground mb-2 tracking-wider">
              SECTOR ANALYSIS
            </p>
            
            {meta ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">SYSTEMS</span>
                  <span className="text-accent">{meta.totalRepos}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">LUMINOSITY</span>
                  <span className="text-yellow-400">
                    {meta.totalStars.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">ANOMALIES</span>
                  <span className="text-purple-400">
                    {meta.pluginRepoCount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-muted-foreground animate-pulse">
                SCANNING...
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="mt-3 w-full py-1.5 text-[10px] font-mono rounded border border-accent/30 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {isLoading ? "SCANNING..." : "RESCAN SECTOR"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom HUD - Category filters */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex justify-center p-4">
          <div className="hud-panel rounded-lg p-4 pointer-events-auto">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <p className="text-[10px] font-mono text-muted-foreground text-center mb-3 tracking-wider">
              SYSTEM CLASSIFICATION FILTER
            </p>
            
            <div className="flex items-center gap-2">
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const active = activeCategories.has(cat);
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => onToggleCategory(cat)}
                    className="px-3 py-1.5 rounded text-[10px] font-mono tracking-wider transition-all border"
                    style={{
                      borderColor: active ? color : "rgba(255,255,255,0.1)",
                      backgroundColor: active ? `${color}20` : "transparent",
                      color: active ? color : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Side decorative elements */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-accent/30"
              style={{ height: 20 + Math.random() * 30 }}
            />
          ))}
        </div>
      </div>
      
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-purple-500/30"
              style={{ height: 20 + Math.random() * 30 }}
            />
          ))}
        </div>
      </div>

      {/* Corner brackets */}
      <div className="fixed top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-accent/20 pointer-events-none z-40" />
      <div className="fixed top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-accent/20 pointer-events-none z-40" />
      <div className="fixed bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-accent/20 pointer-events-none z-40" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-accent/20 pointer-events-none z-40" />

      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
        />
      </div>
    </>
  );
}
