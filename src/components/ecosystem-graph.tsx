"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import type { EcosystemNode, EcosystemEdge, EcosystemData } from "@/lib/ecosystem-types";
import { initWebGPUGlow, type WebGPUGlow } from "@/lib/webgpu-glow";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  core: "#22d3ee",
  "official-tool": "#3b82f6",
  plugin: "#a78bfa",
  community: "#34d399",
  documentation: "#fbbf24",
};

const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nodeRadius(node: EcosystemNode): number {
  if (node.category === "core") return 40;
  const base = Math.log2(Math.max(node.stars, 1) + 1) * 3;
  return Math.max(6, Math.min(base, 28));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Simulation types
// ---------------------------------------------------------------------------

interface SimNode extends EcosystemNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
  strength: number;
  type: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EcosystemGraphProps {
  data: EcosystemData;
  onNodeClick: (node: EcosystemNode) => void;
  onNodeDoubleClick: (node: EcosystemNode) => void;
  searchQuery: string;
  activeCategories: Set<string>;
  expandedNodes: Set<string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EcosystemGraph({
  data,
  onNodeClick,
  onNodeDoubleClick,
  searchQuery,
  activeCategories,
  expandedNodes,
}: EcosystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);
  const glowRef = useRef<WebGPUGlow | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const hoveredRef = useRef<SimNode | null>(null);
  const rafRef = useRef<number>(0);
  const avatarCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const needsDrawRef = useRef(true);

  const [tooltip, setTooltip] = useState<{
    node: EcosystemNode;
    x: number;
    y: number;
  } | null>(null);

  // Preload contributor avatar images
  const preloadAvatar = useCallback((url: string) => {
    if (avatarCache.current.has(url)) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    avatarCache.current.set(url, img);
  }, []);

  // -----------------------------------------------------------------------
  // Canvas draw function
  // -----------------------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = canvas.width / DPR;
    const height = canvas.height / DPR;
    const t = transformRef.current;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const hovered = hoveredRef.current;
    const query = searchQuery.toLowerCase().trim();

    ctx.save();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // -- Background ---
    const bgGrad = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2,
    );
    bgGrad.addColorStop(0, "#0c1a2e");
    bgGrad.addColorStop(1, "#06060b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // -- Apply zoom transform --
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const centerX = width / 2;
    const centerY = height / 2;

    // -- Concentric reference rings --
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5 / t.k;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([2 / t.k, 4 / t.k]);
    for (const pct of [0.2, 0.4, 0.6, 0.8]) {
      const r = Math.min(width, height) * pct * 0.45;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // -- Edges --
    for (const edge of edges) {
      const connected =
        hovered &&
        (edge.source.id === hovered.id || edge.target.id === hovered.id);

      if (hovered) {
        ctx.globalAlpha = connected
          ? Math.max(0.4, edge.strength * 0.8)
          : 0.03;
        ctx.strokeStyle = connected
          ? CATEGORY_COLORS[hovered.category] || "#64748b"
          : "#334155";
      } else {
        ctx.globalAlpha = Math.max(0.05, edge.strength * 0.3);
        ctx.strokeStyle = "#334155";
      }

      ctx.lineWidth = Math.max(0.3, edge.strength * 2) / t.k;
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // -- Nodes --
    const connectedIds = new Set<string>();
    if (hovered) {
      for (const e of edges) {
        if (e.source.id === hovered.id) connectedIds.add(e.target.id);
        if (e.target.id === hovered.id) connectedIds.add(e.source.id);
      }
      connectedIds.add(hovered.id);
    }

    for (const node of nodes) {
      const r = nodeRadius(node);
      const color = CATEGORY_COLORS[node.category] || "#64748b";
      const isCore = node.category === "core";

      // Compute opacity based on hover and search
      let opacity = 1;
      if (hovered && !connectedIds.has(node.id)) opacity = 0.2;
      if (query) {
        const match =
          node.name.toLowerCase().includes(query) ||
          (node.description || "").toLowerCase().includes(query) ||
          node.topics.some((t) => t.toLowerCase().includes(query));
        if (!match) opacity = 0.1;
      }

      ctx.globalAlpha = opacity;

      // Glow (Canvas 2D shadow-based, complements WebGPU bloom)
      ctx.shadowColor = color;
      ctx.shadowBlur = isCore ? 18 : 8;

      // Fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isCore ? color : hexToRgba(color, 0.8);
      ctx.fill();

      // Stroke
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.lineWidth = (isCore ? 2 : 1) / t.k;
      ctx.stroke();

      // Label
      if (r > 10 || isCore) {
        const label = isCore
          ? "elizaOS"
          : (() => {
              const name = node.name.replace(/^plugin-/, "").replace(/^eliza-/, "");
              return name.length > 16 ? name.substring(0, 14) + ".." : name;
            })();

        ctx.shadowBlur = 0;
        ctx.fillStyle = hexToRgba("#94a3b8", opacity);
        ctx.font = `${isCore ? "700" : "400"} ${isCore ? 14 : 10}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, node.x, node.y + r + 6);
      }

      // Expanded contributor sub-nodes
      if (expandedNodes.has(node.id) && node.contributors.length) {
        const contribs = node.contributors.slice(0, 5);
        const parentR = r;

        contribs.forEach((c, i) => {
          const angle = (i / contribs.length) * Math.PI * 2 - Math.PI / 2;
          const orbitR = parentR + 22;
          const cx = node.x + Math.cos(angle) * orbitR;
          const cy = node.y + Math.sin(angle) * orbitR;

          // Sub-node circle
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fillStyle = "#1e293b";
          ctx.fill();
          ctx.strokeStyle = hexToRgba(color, 0.6);
          ctx.lineWidth = 1 / t.k;
          ctx.stroke();

          // Avatar image (clipped to circle)
          preloadAvatar(c.avatarUrl);
          const img = avatarCache.current.get(c.avatarUrl);
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, cx - 7, cy - 7, 14, 14);
            ctx.restore();
          }

          // Sub-label
          ctx.fillStyle = hexToRgba("#64748b", opacity);
          ctx.font = "400 7px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(c.login.substring(0, 8), cx, cy + 10);
        });
      }

      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // -- WebGPU bloom overlay --
    if (glowRef.current?.ready) {
      glowRef.current.applyBloom(canvas, ctx);
    }
  }, [searchQuery, expandedNodes, preloadAvatar]);

  // -----------------------------------------------------------------------
  // Animation loop — only draws when flagged dirty
  // -----------------------------------------------------------------------

  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      if (needsDrawRef.current) {
        draw();
        needsDrawRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // -----------------------------------------------------------------------
  // Setup simulation + interaction
  // -----------------------------------------------------------------------

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !data.nodes.length) return;

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    // Size canvas for HiDPI
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const centerX = width / 2;
    const centerY = height / 2;

    // Init WebGPU glow (async, non-blocking)
    initWebGPUGlow(width, height).then((glow) => {
      glowRef.current = glow;
    });

    // Filter data
    const filteredNodes = data.nodes.filter((n) => activeCategories.has(n.category));
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );

    const simNodes: SimNode[] = filteredNodes.map((n) => ({
      ...n,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simEdges: SimEdge[] = filteredEdges
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        strength: e.strength,
        type: e.type,
      }))
      .filter((e) => e.source && e.target);

    nodesRef.current = simNodes;
    edgesRef.current = simEdges;

    // Preload all contributor avatars
    for (const node of simNodes) {
      for (const c of node.contributors.slice(0, 5)) {
        preloadAvatar(c.avatarUrl);
      }
    }

    // Force simulation
    const maxExtent = Math.min(width, height) * 0.42;

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force("center", d3.forceCenter<SimNode>(centerX, centerY).strength(0.05))
      .force(
        "charge",
        d3
          .forceManyBody<SimNode>()
          .strength((d) => (d.category === "core" ? -400 : -30 - nodeRadius(d) * 3)),
      )
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => nodeRadius(d) + (expandedNodes.has(d.id) ? 35 : 4))
          .strength(0.8),
      )
      .force(
        "radial",
        d3
          .forceRadial<SimNode>(
            (d) => {
              if (d.category === "core") return 0;
              return maxExtent * (1 - d.couplingScore / 100) * 0.95 + 40;
            },
            centerX,
            centerY,
          )
          .strength((d) => (d.category === "core" ? 1 : 0.6)),
      )
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .strength((d) => d.strength * 0.1)
          .distance(
            (d) =>
              maxExtent *
                (2 -
                  (d.source as SimNode).couplingScore / 100 -
                  (d.target as SimNode).couplingScore / 100) *
                0.3 +
              60,
          ),
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3)
      .on("tick", () => {
        needsDrawRef.current = true;
      });

    simulationRef.current = simulation;

    // ---- D3 zoom on a hidden <svg> overlay isn't needed — use Canvas directly
    const canvasSel = d3.select(canvas);

    // Initial transform
    const initialScale = 0.85;
    transformRef.current = d3.zoomIdentity
      .translate((width * (1 - initialScale)) / 2, (height * (1 - initialScale)) / 2)
      .scale(initialScale);

    const zoomBehavior = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        needsDrawRef.current = true;
      });

    canvasSel.call(zoomBehavior);
    canvasSel.call(zoomBehavior.transform, transformRef.current);

    // ---- Hit-testing helper ----
    function hitTest(px: number, py: number): SimNode | null {
      const t = transformRef.current;
      const mx = (px - t.x) / t.k;
      const my = (py - t.y) / t.k;
      // Reverse iterate so top-drawn nodes get priority
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const n = simNodes[i];
        const r = nodeRadius(n) + 4;
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    }

    // ---- Drag behaviour ----
    const dragBehavior = d3
      .drag<HTMLCanvasElement, unknown>()
      .subject((event) => {
        const node = hitTest(event.x, event.y);
        if (!node) return null;
        return node;
      })
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        const d = event.subject as SimNode;
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event) => {
        const d = event.subject as SimNode;
        const t = transformRef.current;
        d.fx = (event.sourceEvent.offsetX - t.x) / t.k;
        d.fy = (event.sourceEvent.offsetY - t.y) / t.k;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        const d = event.subject as SimNode;
        d.fx = null;
        d.fy = null;
      });

    canvasSel.call(dragBehavior as unknown as d3.DragBehavior<HTMLCanvasElement, unknown, unknown>);

    // ---- Mouse interactions ----
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = hitTest(x, y);
      if (node !== hoveredRef.current) {
        hoveredRef.current = node;
        needsDrawRef.current = true;
        if (node) {
          setTooltip({ node, x, y });
          canvas.style.cursor = "pointer";
        } else {
          setTooltip(null);
          canvas.style.cursor = "default";
        }
      } else if (node) {
        setTooltip({ node, x, y });
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (node) onNodeClick(node);
    };

    const handleDblClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (node) onNodeDoubleClick(node);
    };

    const handleMouseLeave = () => {
      hoveredRef.current = null;
      setTooltip(null);
      needsDrawRef.current = true;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("dblclick", handleDblClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      simulation.stop();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("dblclick", handleDblClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      glowRef.current?.destroy();
      glowRef.current = null;
    };
  }, [data, activeCategories, expandedNodes, onNodeClick, onNodeDoubleClick, draw, preloadAvatar]);

  // Trigger redraw when search changes
  useEffect(() => {
    needsDrawRef.current = true;
  }, [searchQuery]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 animate-fade-in"
          style={{
            left: Math.min(
              tooltip.x + 12,
              (wrapperRef.current?.clientWidth || 800) - 260,
            ),
            top: tooltip.y - 10,
          }}
        >
          <div className="rounded-lg border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl max-w-[240px]">
            <p className="font-semibold text-sm text-foreground truncate">
              {tooltip.node.name}
            </p>
            {tooltip.node.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {tooltip.node.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{"* "}{tooltip.node.stars.toLocaleString()}</span>
              {tooltip.node.language && <span>{tooltip.node.language}</span>}
              <span
                className="ml-auto font-mono text-[10px]"
                style={{ color: CATEGORY_COLORS[tooltip.node.category] }}
              >
                {tooltip.node.couplingScore}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
