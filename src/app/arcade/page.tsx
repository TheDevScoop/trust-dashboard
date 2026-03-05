"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "./arcade.css";
import { getLevelNode } from "@/lib/arcade-data";

const OverworldMap = dynamic(() => import("@/components/overworld-map"), { ssr: false });
const MKLeaderboard = dynamic(() => import("@/components/mk-leaderboard"), { ssr: false });

type View = "overworld" | "leaderboard";

export default function ArcadePage() {
  const [view, setView] = useState<View>("overworld");
  const [selectedRepo, setSelectedRepo] = useState<string | undefined>();
  const [showIntro, setShowIntro] = useState(true);

  // Intro screen auto-dismiss (3s to match CSS animation)
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleSelectLevel = (repo: string) => {
    setSelectedRepo(repo);
    setView("leaderboard");
  };

  const node = selectedRepo ? getLevelNode(selectedRepo) : null;

  return (
    <div className="arcade-root">
      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      {/* Intro splash */}
      {showIntro && (
        <div className="arcade-intro">
          <div className="arcade-intro-text">
            <div className="arcade-intro-line1">elizaOS</div>
            <div className="arcade-intro-line2">A R C A D E</div>
            <div className="arcade-intro-copyright">
              (C) 2024-2025 ELIZAOS FOUNDATION
            </div>
            <div className="arcade-intro-line3">PRESS START</div>
          </div>
        </div>
      )}

      {/* Top nav */}
      {!showIntro && (
        <>
          <div className="arcade-nav">
            <Link
              href="/"
              className="arcade-nav-btn"
            >
              EXIT ARCADE
            </Link>
            <div className="arcade-nav-tabs">
              <button
                className={`arcade-tab ${view === "overworld" ? "arcade-tab-active" : ""}`}
                onClick={() => setView("overworld")}
              >
                WORLD MAP
              </button>
              <button
                className={`arcade-tab ${view === "leaderboard" ? "arcade-tab-active" : ""}`}
                onClick={() => {
                  setSelectedRepo(undefined);
                  setView("leaderboard");
                }}
              >
                LEADERBOARD
              </button>
            </div>
            <Link
              href="/world"
              className="arcade-nav-btn"
            >
              3D WORLD
            </Link>
          </div>

          {/* Main content */}
          <div className="arcade-content">
            {view === "overworld" && (
              <OverworldMap
                onSelectLevel={handleSelectLevel}
                selectedRepo={selectedRepo}
              />
            )}
            {view === "leaderboard" && (
              <MKLeaderboard
                filterRepo={selectedRepo}
                title={
                  node
                    ? `${node.displayName} FIGHTERS`
                    : "SELECT YOUR FIGHTER"
                }
              />
            )}
          </div>

          {/* Selected level info bar */}
          {view === "leaderboard" && selectedRepo && node && (
            <div className="arcade-level-bar">
              <button
                className="arcade-back-btn"
                onClick={() => {
                  setSelectedRepo(undefined);
                  setView("overworld");
                }}
              >
                BACK TO MAP
              </button>
              <span className="arcade-level-name">{node.displayName}</span>
              <span className="arcade-level-desc">{node.description}</span>
              <span className="arcade-level-stars">{node.stars} STARS</span>
            </div>
          )}

          {/* Activity feed / combo counter */}
          <ComboFeed />
        </>
      )}
    </div>
  );
}

// ── Combo counter / activity feed ───────────────────────────────────
const COMBO_MESSAGES = [
  { user: "shakkernerd", action: "merged 3 PRs", combo: "3-HIT COMBO!", color: "#ff0040" },
  { user: "lalalune", action: "closed 5 issues", combo: "5-HIT COMBO!", color: "#ffd700" },
  { user: "odilitime", action: "reviewed 4 PRs", combo: "EXCELLENT!", color: "#00ccff" },
  { user: "sirkitree", action: "shipped plugin-solana v2", combo: "PERFECT!", color: "#88ff88" },
  { user: "madjin", action: "updated 12 doc pages", combo: "KNOWLEDGE BOMB!", color: "#a78bfa" },
  { user: "monilpat", action: "first contribution!", combo: "NEW CHALLENGER!", color: "#f472b6" },
  { user: "HashWarlock", action: "merged TEE module", combo: "FLAWLESS VICTORY!", color: "#ffd700" },
];

function ComboFeed() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % COMBO_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const msg = COMBO_MESSAGES[msgIdx];

  return (
    <div className={`combo-feed ${visible ? "combo-visible" : "combo-hidden"}`}>
      <span className="combo-user">@{msg.user}</span>
      <span className="combo-action">{msg.action}</span>
      <span className="combo-label" style={{ color: msg.color }}>{msg.combo}</span>
    </div>
  );
}
