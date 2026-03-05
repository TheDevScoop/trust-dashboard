"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import type { EcosystemNode, EcosystemEdge, EcosystemData } from "@/lib/ecosystem-types";

// Galaxy color palette - celestial body colors
const STAR_COLORS: Record<string, { main: string; glow: string; corona: string }> = {
  core: { main: "#fef08a", glow: "#fbbf24", corona: "#f97316" },
  "official-tool": { main: "#38bdf8", glow: "#0ea5e9", corona: "#0284c7" },
  plugin: { main: "#c084fc", glow: "#a855f7", corona: "#7c3aed" },
  community: { main: "#4ade80", glow: "#22c55e", corona: "#16a34a" },
  documentation: { main: "#fb923c", glow: "#f97316", corona: "#ea580c" },
};

function starRadius(node: EcosystemNode): number {
  if (node.category === "core") return 50;
  const base = Math.log2(Math.max(node.stars, 1) + 1) * 3.5;
  return Math.max(4, Math.min(base, 32));
}

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

interface EcosystemGraphProps {
  data: EcosystemData;
  onNodeClick: (node: EcosystemNode) => void;
  onNodeDoubleClick: (node: EcosystemNode) => void;
  searchQuery: string;
  activeCategories: Set<string>;
  expandedNodes: Set<string>;
}

export default function EcosystemGraph({
  data,
  onNodeClick,
  onNodeDoubleClick,
  searchQuery,
  activeCategories,
  expandedNodes,
}: EcosystemGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);
  const [tooltip, setTooltip] = useState<{
    node: EcosystemNode;
    x: number;
    y: number;
  } | null>(null);

  const getFilteredData = useCallback(() => {
    const filteredNodes = data.nodes.filter((n) =>
      activeCategories.has(n.category)
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, activeCategories]);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Create radial gradients and glow filters for each category
    Object.entries(STAR_COLORS).forEach(([cat, colors]) => {
      // Star body gradient
      const starGrad = defs
        .append("radialGradient")
        .attr("id", `star-grad-${cat}`)
        .attr("cx", "30%")
        .attr("cy", "30%");
      starGrad.append("stop").attr("offset", "0%").attr("stop-color", "#ffffff").attr("stop-opacity", 0.9);
      starGrad.append("stop").attr("offset", "40%").attr("stop-color", colors.main);
      starGrad.append("stop").attr("offset", "100%").attr("stop-color", colors.glow);

      // Corona glow filter
      const filter = defs
        .append("filter")
        .attr("id", `glow-${cat}`)
        .attr("x", "-100%")
        .attr("y", "-100%")
        .attr("width", "300%")
        .attr("height", "300%");

      filter.append("feGaussianBlur")
        .attr("stdDeviation", cat === "core" ? 15 : 6)
        .attr("result", "blur1");
      filter.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", cat === "core" ? 8 : 3)
        .attr("result", "blur2");

      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "blur1");
      feMerge.append("feMergeNode").attr("in", "blur2");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Energy connection gradient
    const connGrad = defs
      .append("linearGradient")
      .attr("id", "connection-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    connGrad.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8").attr("stop-opacity", 0.6);
    connGrad.append("stop").attr("offset", "50%").attr("stop-color", "#c084fc").attr("stop-opacity", 0.3);
    connGrad.append("stop").attr("offset", "100%").attr("stop-color", "#38bdf8").attr("stop-opacity", 0.6);

    // Orbital ring pattern
    const orbitPattern = defs.append("pattern")
      .attr("id", "orbit-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10);
    orbitPattern.append("circle")
      .attr("cx", 5)
      .attr("cy", 5)
      .attr("r", 0.5)
      .attr("fill", "rgba(56, 189, 248, 0.3)");

    const { nodes: filteredNodes, edges: filteredEdges } = getFilteredData();

    const simNodes: SimNode[] = filteredNodes.map((n) => ({
      ...n,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200,
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

    // Main container for zoom/pan
    const container = svg.append("g").attr("class", "galaxy-container");

    // Orbital rings (decorative)
    const orbitGroup = container.append("g").attr("class", "orbits");
    [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].forEach((pct, i) => {
      const r = Math.min(width, height) * pct * 0.48;
      orbitGroup
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "rgba(56, 189, 248, 0.08)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", i % 2 === 0 ? "4,8" : "2,6")
        .attr("class", "animate-orbit-pulse")
        .style("animation-delay", `${i * 0.5}s`);
    });

    // Energy connections (edges)
    const edgeGroup = container.append("g").attr("class", "connections");
    const edgeLines = edgeGroup
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(simEdges)
      .join("line")
      .attr("stroke", "url(#connection-gradient)")
      .attr("stroke-width", (d) => Math.max(0.5, d.strength * 2.5))
      .attr("stroke-opacity", (d) => Math.max(0.02, d.strength * 0.15))
      .attr("stroke-linecap", "round");

    // Node groups (stars/planets)
    const nodeGroup = container.append("g").attr("class", "celestial-bodies");
    const nodeGroups = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes, (d) => d.id)
      .join("g")
      .attr("cursor", "pointer")
      .attr("class", (d) => d.category === "core" ? "animate-core-pulse" : "");

    // Corona (outer glow) for larger stars
    nodeGroups
      .filter((d) => starRadius(d) > 12 || d.category === "core")
      .append("circle")
      .attr("r", (d) => starRadius(d) * 2.5)
      .attr("fill", (d) => {
        const colors = STAR_COLORS[d.category] || STAR_COLORS.community;
        return colors.corona;
      })
      .attr("opacity", (d) => d.category === "core" ? 0.15 : 0.08);

    // Main star body
    nodeGroups
      .append("circle")
      .attr("r", (d) => starRadius(d))
      .attr("fill", (d) => `url(#star-grad-${d.category})`)
      .attr("filter", (d) => `url(#glow-${d.category})`);

    // Inner bright core
    nodeGroups
      .filter((d) => starRadius(d) > 8)
      .append("circle")
      .attr("r", (d) => starRadius(d) * 0.3)
      .attr("fill", "#ffffff")
      .attr("opacity", 0.8);

    // Labels
    nodeGroups
      .filter((d) => starRadius(d) > 12 || d.category === "core")
      .append("text")
      .text((d) => {
        if (d.category === "core") return "ELIZA PRIME";
        const name = d.name.replace(/^plugin-/, "").replace(/^eliza-/, "");
        return name.length > 18 ? name.substring(0, 16) + ".." : name;
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => starRadius(d) + 18)
      .attr("fill", (d) => STAR_COLORS[d.category]?.main || "#7dd3fc")
      .attr("font-size", (d) => d.category === "core" ? 14 : 10)
      .attr("font-weight", (d) => d.category === "core" ? 700 : 500)
      .attr("font-family", "var(--font-mono)")
      .attr("letter-spacing", "0.1em")
      .attr("pointer-events", "none")
      .attr("opacity", 0.9);

    // Expanded contributors as moons
    nodeGroups.each(function (d) {
      if (!expandedNodes.has(d.id) || !d.contributors.length) return;
      const g = d3.select(this);
      const contribs = d.contributors.slice(0, 6);
      const parentR = starRadius(d);

      contribs.forEach((c, i) => {
        const angle = (i / contribs.length) * Math.PI * 2 - Math.PI / 2;
        const orbitR = parentR + 30 + (i % 2) * 8;
        const cx = Math.cos(angle) * orbitR;
        const cy = Math.sin(angle) * orbitR;

        // Moon orbit ring
        g.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", orbitR)
          .attr("fill", "none")
          .attr("stroke", STAR_COLORS[d.category]?.main || "#7dd3fc")
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.2)
          .attr("stroke-dasharray", "2,4");

        // Moon body
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 10)
          .attr("fill", "#0f172a")
          .attr("stroke", STAR_COLORS[d.category]?.main || "#7dd3fc")
          .attr("stroke-width", 1);

        // Avatar clip
        g.append("clipPath")
          .attr("id", `clip-${d.id}-${c.login}`)
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 9);

        g.append("image")
          .attr("href", c.avatarUrl)
          .attr("x", cx - 9)
          .attr("y", cy - 9)
          .attr("width", 18)
          .attr("height", 18)
          .attr("clip-path", `url(#clip-${d.id}-${c.login})`)
          .attr("crossOrigin", "anonymous");
      });
    });

    // Force simulation
    const maxExtent = Math.min(width, height) * 0.44;

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force("center", d3.forceCenter<SimNode>(centerX, centerY).strength(0.03))
      .force("charge", d3.forceManyBody<SimNode>().strength((d) =>
        d.category === "core" ? -800 : -40 - starRadius(d) * 4
      ))
      .force("collision", d3.forceCollide<SimNode>()
        .radius((d) => starRadius(d) + (expandedNodes.has(d.id) ? 50 : 6))
        .strength(0.85)
      )
      .force("radial", d3.forceRadial<SimNode>(
        (d) => {
          if (d.category === "core") return 0;
          return maxExtent * (1 - d.couplingScore / 100) * 0.95 + 60;
        },
        centerX,
        centerY
      ).strength((d) => d.category === "core" ? 1 : 0.65))
      .force("link", d3.forceLink<SimNode, SimEdge>(simEdges)
        .id((d) => d.id)
        .strength((d) => d.strength * 0.08)
        .distance((d) =>
          maxExtent * (2 - (d.source as SimNode).couplingScore / 100 - (d.target as SimNode).couplingScore / 100) * 0.25 + 80
        )
      )
      .alphaDecay(0.015)
      .velocityDecay(0.35)
      .on("tick", () => {
        edgeLines
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodeGroups.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(drag);

    // Hover interactions
    nodeGroups
      .on("mouseenter", (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltip({ node: d, x, y });

        // Highlight connections
        edgeLines
          .attr("stroke-opacity", (e) =>
            e.source.id === d.id || e.target.id === d.id
              ? Math.max(0.5, e.strength * 0.8)
              : 0.02
          )
          .attr("stroke-width", (e) =>
            e.source.id === d.id || e.target.id === d.id
              ? Math.max(1.5, e.strength * 4)
              : Math.max(0.5, e.strength * 2.5)
          );

        // Dim unconnected nodes
        nodeGroups.attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const connected = simEdges.some(
            (e) =>
              (e.source.id === d.id && e.target.id === n.id) ||
              (e.target.id === d.id && e.source.id === n.id)
          );
          return connected ? 1 : 0.15;
        });
      })
      .on("mouseleave", () => {
        setTooltip(null);
        edgeLines
          .attr("stroke-opacity", (d) => Math.max(0.02, d.strength * 0.15))
          .attr("stroke-width", (d) => Math.max(0.5, d.strength * 2.5));
        nodeGroups.attr("opacity", 1);
      })
      .on("click", (_event, d) => onNodeClick(d))
      .on("dblclick", (_event, d) => onNodeDoubleClick(d));

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 6])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial zoom
    const initialScale = 0.8;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate((width * (1 - initialScale)) / 2, (height * (1 - initialScale)) / 2)
        .scale(initialScale)
    );

    return () => {
      simulation.stop();
    };
  }, [data, getFilteredData, expandedNodes, onNodeClick, onNodeDoubleClick]);

  // Search highlight effect
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const query = searchQuery.toLowerCase().trim();

    svg.selectAll<SVGGElement, SimNode>(".celestial-bodies g").each(function (d) {
      const g = d3.select(this);
      if (!query) {
        g.attr("opacity", 1);
        return;
      }

      const match =
        d.name.toLowerCase().includes(query) ||
        (d.description || "").toLowerCase().includes(query) ||
        d.topics.some((t) => t.toLowerCase().includes(query));

      g.attr("opacity", match ? 1 : 0.08);
    });
  }, [searchQuery]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" style={{ background: "transparent" }} />
      
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 animate-fade-in"
          style={{
            left: Math.min(tooltip.x + 16, (svgRef.current?.clientWidth || 800) - 280),
            top: tooltip.y - 10,
          }}
        >
          <div className="hud-panel rounded-lg px-4 py-3 max-w-[260px] relative">
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            
            <p className="font-mono font-bold text-sm tracking-wide" style={{ color: STAR_COLORS[tooltip.node.category]?.main || "#7dd3fc" }}>
              {tooltip.node.category === "core" ? "ELIZA PRIME" : tooltip.node.name.toUpperCase()}
            </p>
            {tooltip.node.description && (
              <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">
                {tooltip.node.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">*</span>
                {tooltip.node.stars.toLocaleString()}
              </span>
              {tooltip.node.language && (
                <span className="opacity-70">{tooltip.node.language}</span>
              )}
              <span className="ml-auto font-bold" style={{ color: STAR_COLORS[tooltip.node.category]?.main }}>
                {tooltip.node.couplingScore}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
