"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  LEVEL_NODES,
  PLUGIN_POWERUPS,
  SPRITE_COLORS,
  GROUP_COLORS,
  type ArcadeLevelNode,
  type ArcadePluginPowerUp,
} from "@/lib/arcade-data";

const CELL = 64; // px per grid cell
const GRID_W = 15;
const GRID_H = 9;
const MAP_W = GRID_W * CELL;
const MAP_H = GRID_H * CELL;

interface OverworldMapProps {
  onSelectLevel: (repo: string) => void;
  selectedRepo?: string;
}

export default function OverworldMap({ onSelectLevel, selectedRepo }: OverworldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<ArcadeLevelNode | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const animFrameRef = useRef(0);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background — dark green tiled pattern (SMW style)
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, w, h);

    // Draw subtle grid
    ctx.strokeStyle = "#0f2040";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        const px = offset.x + gx * CELL * scale;
        const py = offset.y + gy * CELL * scale;
        ctx.strokeRect(px, py, CELL * scale, CELL * scale);
      }
    }

    // Draw paths (dotted lines between connected nodes)
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.lineWidth = 2 * scale;
    LEVEL_NODES.forEach((node) => {
      node.connections.forEach((targetRepo) => {
        const target = LEVEL_NODES.find((n) => n.repo === targetRepo);
        if (!target) return;
        // Only draw once (from lower index)
        if (LEVEL_NODES.indexOf(node) > LEVEL_NODES.indexOf(target)) return;

        const x1 = offset.x + (node.x + 0.5) * CELL * scale;
        const y1 = offset.y + (node.y + 0.5) * CELL * scale;
        const x2 = offset.x + (target.x + 0.5) * CELL * scale;
        const y2 = offset.y + (target.y + 0.5) * CELL * scale;

        const isActive =
          node.status !== "locked" && target.status !== "locked";
        ctx.strokeStyle = isActive ? "#2a5a3a" : "#151f2e";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    });
    ctx.setLineDash([]);

    // Draw power-ups bouncing on paths
    const bounce = Math.sin(time * 0.003) * 4 * scale;
    PLUGIN_POWERUPS.forEach((pu, i) => {
      const fromNode = LEVEL_NODES.find((n) => n.repo === pu.pathFrom);
      const toNode = LEVEL_NODES.find((n) => n.repo === pu.pathTo);
      if (!fromNode || !toNode) return;

      const t = ((time * 0.0002 + i * 0.15) % 1);
      const x1 = offset.x + (fromNode.x + 0.5) * CELL * scale;
      const y1 = offset.y + (fromNode.y + 0.5) * CELL * scale;
      const x2 = offset.x + (toNode.x + 0.5) * CELL * scale;
      const y2 = offset.y + (toNode.y + 0.5) * CELL * scale;

      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t + bounce;

      const color = GROUP_COLORS[pu.group];
      const size = 4 * scale;

      // Diamond shape
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.lineTo(px + size, py);
      ctx.lineTo(px, py + size);
      ctx.lineTo(px - size, py);
      ctx.closePath();
      ctx.fill();

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 * scale;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw level nodes
    LEVEL_NODES.forEach((node) => {
      const cx = offset.x + (node.x + 0.5) * CELL * scale;
      const cy = offset.y + (node.y + 0.5) * CELL * scale;
      const r = (node.sprite === "castle" ? 18 : node.sprite === "fortress" ? 14 : 10) * scale;
      const color = SPRITE_COLORS[node.sprite];
      const isSelected = node.repo === selectedRepo;
      const isHovered = hoveredNode?.repo === node.repo;

      // Locked nodes are dimmed
      const alpha = node.status === "locked" ? 0.3 : 1;
      ctx.globalAlpha = alpha;

      // Node background circle
      ctx.fillStyle = isSelected ? color : "#0d1b2a";
      ctx.strokeStyle = color;
      ctx.lineWidth = (isSelected || isHovered ? 3 : 2) * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pulsing glow for active/selected
      if ((node.status === "active" || isSelected) && !isHovered) {
        const pulse = 0.3 + Math.sin(time * 0.004 + node.x) * 0.2;
        ctx.globalAlpha = pulse * alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      // Selection highlight
      if (isSelected || isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * scale;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Sprite icon (simplified pixel art)
      ctx.fillStyle = node.status === "locked" ? "#334" : "#fff";
      ctx.font = `bold ${Math.floor(r * 0.8)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icon =
        node.sprite === "castle" ? "W" :
        node.sprite === "fortress" ? "F" :
        node.sprite === "tower" ? "T" :
        node.sprite === "house" ? "H" :
        node.sprite === "hut" ? "h" :
        node.sprite === "cave" ? "C" :
        node.sprite === "bridge" ? "B" :
        "*";
      ctx.fillText(icon, cx, cy);

      // Label below
      ctx.font = `bold ${Math.floor(8 * scale)}px monospace`;
      ctx.fillStyle = node.status === "locked" ? "#334" : color;
      ctx.fillText(node.displayName, cx, cy + r + 10 * scale);

      // Stars count
      if (node.stars > 0) {
        ctx.font = `${Math.floor(7 * scale)}px monospace`;
        ctx.fillStyle = "#ffd700";
        ctx.fillText(`${node.stars}`, cx, cy + r + 20 * scale);
      }

      ctx.globalAlpha = 1;
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, [offset, scale, hoveredNode, selectedRepo]);

  useEffect(() => {
    // Center the map
    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const fitScale = Math.min(w / MAP_W, h / MAP_H) * 0.9;
      setScale(fitScale);
      setOffset({
        x: (w - MAP_W * fitScale) / 2,
        y: (h - MAP_H * fitScale) / 2,
      });
    }
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Mouse interaction
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const node of LEVEL_NODES) {
        if (node.status === "locked") continue;
        const cx = offset.x + (node.x + 0.5) * CELL * scale;
        const cy = offset.y + (node.y + 0.5) * CELL * scale;
        const r = (node.sprite === "castle" ? 18 : node.sprite === "fortress" ? 14 : 10) * scale;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        if (dist <= r + 4) {
          onSelectLevel(node.repo);
          return;
        }
      }
    },
    [offset, scale, onSelectLevel]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const node of LEVEL_NODES) {
        const cx = offset.x + (node.x + 0.5) * CELL * scale;
        const cy = offset.y + (node.y + 0.5) * CELL * scale;
        const r = (node.sprite === "castle" ? 18 : node.sprite === "fortress" ? 14 : 10) * scale;
        if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) <= r + 4) {
          setHoveredNode(node);
          canvas.style.cursor = node.status === "locked" ? "not-allowed" : "pointer";
          return;
        }
      }
      setHoveredNode(null);
      canvas.style.cursor = "default";
    },
    [offset, scale]
  );

  // Scroll zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(3, scale * delta));
      setScale(newScale);
    },
    [scale]
  );

  return (
    <div className="overworld-container">
      <canvas
        ref={canvasRef}
        className="overworld-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />

      {/* Tooltip */}
      {hoveredNode && (
        <div className="overworld-tooltip">
          <div className="overworld-tooltip-name" style={{ color: SPRITE_COLORS[hoveredNode.sprite] }}>
            {hoveredNode.displayName}
          </div>
          <div className="overworld-tooltip-desc">{hoveredNode.description}</div>
          <div className="overworld-tooltip-meta">
            {hoveredNode.stars > 0 && <span>{hoveredNode.stars} stars</span>}
            <span>{hoveredNode.org}</span>
            <span>{hoveredNode.status.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
