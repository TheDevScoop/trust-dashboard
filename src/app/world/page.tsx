"use client";

import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ElizaWorld = dynamic(() => import("@/components/eliza-world"), {
  ssr: false,
});

export default function WorldPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-background relative">
      {/* Navigation overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="p-4 flex items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-md text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Graph
            </Link>
            <div className="text-xs text-muted-foreground/60">|</div>
            <Link
              href="/arcade"
              className="px-3 py-1.5 rounded-lg border border-[#ff0040]/20 bg-card/80 backdrop-blur-md text-sm text-[#ff0040]/70 hover:text-[#ff0040] hover:border-[#ff0040]/40 transition-colors font-mono"
            >
              ARCADE
            </Link>
          </div>
          <div className="pointer-events-auto">
            <h1 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <span className="text-accent">elizaOS</span>
              <span className="text-muted-foreground font-normal">3D World</span>
            </h1>
          </div>
        </div>
      </div>

      <Suspense fallback={<WorldLoading />}>
        <ElizaWorld />
      </Suspense>
    </div>
  );
}

function WorldLoading() {
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
        <p className="text-sm font-medium text-foreground">Building World</p>
        <p className="text-xs text-muted-foreground mt-1">
          Generating the elizaOS universe...
        </p>
      </div>
    </div>
  );
}
