"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const ElizaWorld = dynamic(() => import("@/components/eliza-world"), {
  ssr: false,
});

export default function WorldPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
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
