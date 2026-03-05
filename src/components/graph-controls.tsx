"use client";

import { Search, RotateCcw, Satellite, Radar, Radio } from "lucide-react";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { key: "core", label: "PRIME", color: "#fef08a", icon: "star" },
  { key: "official-tool", label: "OFFICIAL", color: "#38bdf8", icon: "satellite" },
  { key: "plugin", label: "PLUGINS", color: "#c084fc", icon: "plugin" },
  { key: "community", label: "COMMUNITY", color: "#4ade80", icon: "users" },
  { key: "documentation", label: "ARCHIVES", color: "#fb923c", icon: "book" },
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
  const [systemTime, setSystemTime] = useState<string>("");
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toISOString().split("T")[1].split(".")[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoordinates({
        x: Math.round((e.clientX / window.innerWidth) * 1000),
        y: Math.round((e.clientY / window.innerHeight) * 1000),
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        {/* Main header */}
        <div className="p-4 flex items-start justify-between gap-4">
          {/* Left: Eliza Identity */}
          <div className="pointer-events-auto">
            <div className="hud-panel rounded-lg px-4 py-3 relative">
              <div className="hud-corner hud-corner-tl" />
              <div className="hud-corner hud-corner-tr" />
              <div className="hud-corner hud-corner-bl" />
              <div className="hud-corner hud-corner-br" />
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 flex items-center justify-center animate-glow-pulse">
                    <span className="text-lg font-bold text-black">E</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-widest holo-text">
                    ELIZA
                  </h1>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
                    UNIVERSAL CARTOGRAPHY v2.0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Stats readout */}
          {meta && (
            <div className="pointer-events-auto hidden md:block">
              <div className="hud-panel rounded-lg px-5 py-3 relative">
                <div className="hud-corner hud-corner-tl" />
                <div className="hud-corner hud-corner-tr" />
                <div className="hud-corner hud-corner-bl" />
                <div className="hud-corner hud-corner-br" />
                
                <div className="flex items-center gap-6">
                  <StatReadout
                    label="SYSTEMS"
                    value={meta.totalRepos}
                    icon={<Satellite size={12} />}
                  />
                  <div className="w-px h-8 bg-border" />
                  <StatReadout
                    label="LUMINOSITY"
                    value={meta.totalStars}
                    icon={<Radio size={12} />}
                    suffix="*"
                  />
                  <div className="w-px h-8 bg-border" />
                  <StatReadout
                    label="PLUGINS"
                    value={meta.pluginRepoCount}
                    icon={<Radar size={12} />}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right: Search + Actions */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="hud-panel rounded-lg relative overflow-hidden">
              <div className="flex items-center">
                <Search size={14} className="ml-3 text-accent" />
                <input
                  type="text"
                  placeholder="SCAN FOR SYSTEMS..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-10 w-52 bg-transparent pl-2 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none tracking-wider"
                />
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="hud-panel h-10 w-10 flex items-center justify-center rounded-lg text-accent hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RotateCcw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="px-4 pb-3 pointer-events-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground mr-2 tracking-widest">
              FILTER //
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategories.has(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-all border"
                  style={{
                    backgroundColor: isActive ? cat.color + "15" : "transparent",
                    borderColor: isActive ? cat.color + "40" : "rgba(56, 189, 248, 0.1)",
                    color: isActive ? cat.color : "#7dd3fc50",
                    boxShadow: isActive ? `0 0 20px ${cat.color}20` : "none",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: isActive ? `0 0 8px ${cat.color}` : "none",
                    }}
                  />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Left: Coordinates + Time */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="hud-panel rounded-lg px-4 py-3 relative">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="text-accent">SYS.TIME</span>
              <span className="text-foreground tracking-widest">{systemTime}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="text-accent">CURSOR</span>
              <span className="text-foreground tracking-widest">
                X:{coordinates.x.toString().padStart(4, "0")} Y:{coordinates.y.toString().padStart(4, "0")}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="text-accent">STATUS</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400">ONLINE</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Controls hint */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <div className="hud-panel rounded-lg px-4 py-3 relative">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          <div className="space-y-1.5 text-[10px] font-mono text-muted-foreground tracking-wider">
            <p><span className="text-accent">DRAG</span> // REPOSITION SYSTEMS</p>
            <p><span className="text-accent">SCROLL</span> // NAVIGATE DEPTH</p>
            <p><span className="text-accent">CLICK</span> // SCAN SYSTEM</p>
            <p><span className="text-accent">DOUBLE-CLICK</span> // REVEAL CREW</p>
          </div>
        </div>
      </div>
    </>
  );
}

function StatReadout({
  label,
  value,
  icon,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
        {icon}
        <span className="text-[10px] font-mono tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono text-foreground tracking-wider">
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  );
}
