"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import type { EcosystemNode, EcosystemEdge, EcosystemData } from "@/lib/ecosystem-types";

const CATEGORY_COLORS: Record<string, string> = {
  core: "#22d3ee",
  "official-tool": "#3b82f6",
  plugin: "#a78bfa",
  community: "#34d399",
  documentation: "#fbbf24",
};

function nodeRadius(node: EcosystemNode): number {
  if (node.category === "core") return 40;
  const base = Math.log2(Math.max(node.stars, 1) + 1) * 3;
  return Math.max(6, Math.min(base, 28));
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

    // Background radial gradient
    const defs = svg.append("defs");
    const radialGrad = defs
      .append("radialGradient")
      .attr("id", "bg-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    radialGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#0c1a2e")
      .attr("stop-opacity", 0.8);
    radialGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#06060b")
      .attr("stop-opacity", 1);

    // Glow filters for each category
    Object.entries(CATEGORY_COLORS).forEach(([cat, color]) => {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${cat}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", cat === "core" ? 6 : 3)
        .attr("result", "blur");
      filter
        .append("feFlood")
        .attr("flood-color", color)
        .attr("flood-opacity", cat === "core" ? 0.6 : 0.3);
      filter
        .append("feComposite")
        .attr("in2", "blur")
        .attr("operator", "in");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#bg-gradient)");

    // Concentric reference rings
    const ringGroup = svg.append("g").attr("class", "rings");
    [0.2, 0.4, 0.6, 0.8].forEach((pct) => {
      const r = Math.min(width, height) * pct * 0.45;
      ringGroup
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#1e293b")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "2,4")
        .attr("opacity", 0.4);
    });

    const { nodes: filteredNodes, edges: filteredEdges } = getFilteredData();

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

    // Container for zoom/pan
    const container = svg.append("g").attr("class", "graph-container");

    // Edges
    const edgeGroup = container.append("g").attr("class", "edges");
    const edgeLines = edgeGroup
      .selectAll<SVGLineElement, SimEdge>("line")
      .data(simEdges)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", (d) => Math.max(0.3, d.strength * 2))
      .attr("stroke-opacity", (d) => Math.max(0.05, d.strength * 0.3));

    // Node groups
    const nodeGroup = container.append("g").attr("class", "nodes");
    const nodeGroups = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes, (d) => d.id)
      .join("g")
      .attr("cursor", "pointer");

    // Node circles
    nodeGroups
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => {
        const color = CATEGORY_COLORS[d.category] || "#64748b";
        return d.category === "core" ? color : color + "cc";
      })
      .attr("stroke", (d) => CATEGORY_COLORS[d.category] || "#64748b")
      .attr("stroke-width", (d) => (d.category === "core" ? 2 : 1))
      .attr("filter", (d) => `url(#glow-${d.category})`);

    // Labels (only for larger nodes)
    nodeGroups
      .filter((d) => nodeRadius(d) > 10 || d.category === "core")
      .append("text")
      .text((d) => {
        if (d.category === "core") return "elizaOS";
        const name = d.name.replace(/^plugin-/, "").replace(/^eliza-/, "");
        return name.length > 16 ? name.substring(0, 14) + ".." : name;
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d) + 14)
      .attr("fill", "#94a3b8")
      .attr("font-size", (d) => (d.category === "core" ? 14 : 10))
      .attr("font-weight", (d) => (d.category === "core" ? 700 : 400))
      .attr("pointer-events", "none");

    // Expanded contributor sub-nodes
    nodeGroups.each(function (d) {
      if (!expandedNodes.has(d.id) || !d.contributors.length) return;
      const g = d3.select(this);
      const contribs = d.contributors.slice(0, 5);
      const parentR = nodeRadius(d);

      contribs.forEach((c, i) => {
        const angle = (i / contribs.length) * Math.PI * 2 - Math.PI / 2;
        const orbitR = parentR + 22;
        const cx = Math.cos(angle) * orbitR;
        const cy = Math.sin(angle) * orbitR;

        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 8)
          .attr("fill", "#1e293b")
          .attr("stroke", CATEGORY_COLORS[d.category] || "#64748b")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.6);

        g.append("clipPath")
          .attr("id", `clip-${d.id}-${c.login}`)
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 7);

        g.append("image")
          .attr("href", c.avatarUrl)
          .attr("x", cx - 7)
          .attr("y", cy - 7)
          .attr("width", 14)
          .attr("height", 14)
          .attr("clip-path", `url(#clip-${d.id}-${c.login})`)
          .attr("crossOrigin", "anonymous");

        g.append("text")
          .text(c.login.substring(0, 8))
          .attr("x", cx)
          .attr("y", cy + 16)
          .attr("text-anchor", "middle")
          .attr("fill", "#64748b")
          .attr("font-size", 7)
          .attr("pointer-events", "none");
      });
    });

    // Force simulation
    const maxExtent = Math.min(width, height) * 0.42;

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "center",
        d3.forceCenter<SimNode>(centerX, centerY).strength(0.05)
      )
      .force(
        "charge",
        d3.forceManyBody<SimNode>().strength((d) =>
          d.category === "core" ? -400 : -30 - nodeRadius(d) * 3
        )
      )
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => nodeRadius(d) + (expandedNodes.has(d.id) ? 35 : 4))
          .strength(0.8)
      )
      .force(
        "radial",
        d3
          .forceRadial<SimNode>(
            (d) => {
              if (d.category === "core") return 0;
              // Invert coupling: high coupling = close to center
              return maxExtent * (1 - d.couplingScore / 100) * 0.95 + 40;
            },
            centerX,
            centerY
          )
          .strength((d) => (d.category === "core" ? 1 : 0.6))
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
              (2 - (d.source as SimNode).couplingScore / 100 - (d.target as SimNode).couplingScore / 100) *
              0.3 +
              60
          )
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3)
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

        // Highlight connected edges
        edgeLines
          .attr("stroke-opacity", (e) =>
            e.source.id === d.id || e.target.id === d.id
              ? Math.max(0.4, e.strength * 0.8)
              : 0.03
          )
          .attr("stroke", (e) =>
            e.source.id === d.id || e.target.id === d.id
              ? CATEGORY_COLORS[d.category] || "#64748b"
              : "#334155"
          );

        // Dim non-connected nodes
        nodeGroups.select("circle").attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const connected = simEdges.some(
            (e) =>
              (e.source.id === d.id && e.target.id === n.id) ||
              (e.target.id === d.id && e.source.id === n.id)
          );
          return connected ? 1 : 0.2;
        });
      })
      .on("mouseleave", () => {
        setTooltip(null);
        edgeLines
          .attr("stroke-opacity", (d) => Math.max(0.05, d.strength * 0.3))
          .attr("stroke", "#334155");
        nodeGroups.select("circle").attr("opacity", 1);
      })
      .on("click", (_event, d) => {
        onNodeClick(d);
      })
      .on("dblclick", (_event, d) => {
        onNodeDoubleClick(d);
      });

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial gentle zoom to fit
    const initialScale = 0.85;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(
          (width * (1 - initialScale)) / 2,
          (height * (1 - initialScale)) / 2
        )
        .scale(initialScale)
    );

    return () => {
      simulation.stop();
    };
  }, [data, getFilteredData, expandedNodes, onNodeClick, onNodeDoubleClick]);

  // Highlight search matches
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const query = searchQuery.toLowerCase().trim();

    svg.selectAll<SVGGElement, SimNode>(".nodes g").each(function (d) {
      const g = d3.select(this);
      if (!query) {
        g.select("circle").attr("opacity", 1);
        g.select("text").attr("opacity", 1);
        return;
      }

      const match =
        d.name.toLowerCase().includes(query) ||
        (d.description || "").toLowerCase().includes(query) ||
        d.topics.some((t) => t.toLowerCase().includes(query));

      g.select("circle").attr("opacity", match ? 1 : 0.1);
      g.select("text").attr("opacity", match ? 1 : 0.1);
    });
  }, [searchQuery]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 animate-fade-in"
          style={{
            left: Math.min(tooltip.x + 12, (svgRef.current?.clientWidth || 800) - 260),
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
              <span>
                {"* "}
                {tooltip.node.stars.toLocaleString()}
              </span>
              {tooltip.node.language && <span>{tooltip.node.language}</span>}
              <span className="ml-auto font-mono text-[10px]" style={{ color: CATEGORY_COLORS[tooltip.node.category] }}>
                {tooltip.node.couplingScore}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
