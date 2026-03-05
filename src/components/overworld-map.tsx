"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  LEVEL_NODES,
  PLUGIN_POWERUPS,
  SPRITE_COLORS,
  GROUP_COLORS,
  type ArcadeLevelNode,
} from "@/lib/arcade-data";

const CELL = 64;
const GRID_W = 15;
const GRID_H = 9;
const MAP_W = GRID_W * CELL;
const MAP_H = GRID_H * CELL;

// Terrain noise seed — deterministic "random" per tile
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x12345678;
  h = ((h >> 13) ^ h) * 1274126177;
  return ((h >> 16) ^ h) & 0xff;
}

// Pixel-art sprite drawing helpers
function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// Draw a classic SMW-style castle sprite
function drawCastle(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const p = s / 8; // pixel unit
  const baseX = cx - s / 2;
  const baseY = cy - s / 2;

  // Shadow
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.6;
  }

  // Main body
  drawPixelRect(ctx, baseX + p * 1, baseY + p * 3, p * 6, p * 5, color);
  // Darker body shade
  drawPixelRect(ctx, baseX + p * 1, baseY + p * 5, p * 6, p * 3, shadeColor(color, -30));
  // Left tower
  drawPixelRect(ctx, baseX, baseY + p * 1, p * 2, p * 7, color);
  // Right tower
  drawPixelRect(ctx, baseX + p * 6, baseY + p * 1, p * 2, p * 7, color);
  // Left turret
  drawPixelRect(ctx, baseX, baseY, p * 2, p * 1, lightenColor(color, 40));
  drawPixelRect(ctx, baseX - p * 0.5, baseY - p * 0.5, p, p, lightenColor(color, 60));
  drawPixelRect(ctx, baseX + p * 1.5, baseY - p * 0.5, p, p, lightenColor(color, 60));
  // Right turret
  drawPixelRect(ctx, baseX + p * 6, baseY, p * 2, p * 1, lightenColor(color, 40));
  drawPixelRect(ctx, baseX + p * 6, baseY - p * 0.5, p, p, lightenColor(color, 60));
  drawPixelRect(ctx, baseX + p * 7.5, baseY - p * 0.5, p, p, lightenColor(color, 60));
  // Center peak
  drawPixelRect(ctx, baseX + p * 3, baseY + p * 1, p * 2, p * 2, lightenColor(color, 30));
  drawPixelRect(ctx, baseX + p * 3.5, baseY, p, p * 1, lightenColor(color, 50));
  // Door
  drawPixelRect(ctx, baseX + p * 3, baseY + p * 6, p * 2, p * 2, "#0a0a1a");
  drawPixelRect(ctx, baseX + p * 3.25, baseY + p * 5.5, p * 1.5, p * 0.5, lightenColor(color, 20));
  // Windows
  drawPixelRect(ctx, baseX + p * 0.5, baseY + p * 3, p, p, "#ffd700");
  drawPixelRect(ctx, baseX + p * 6.5, baseY + p * 3, p, p, "#ffd700");

  ctx.shadowBlur = 0;
}

// Draw a fortress
function drawFortress(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const p = s / 6;
  const baseX = cx - s / 2;
  const baseY = cy - s / 2;

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = s * 0.5; }

  drawPixelRect(ctx, baseX, baseY + p * 2, p * 6, p * 4, color);
  drawPixelRect(ctx, baseX, baseY + p * 4, p * 6, p * 2, shadeColor(color, -25));
  // Battlements
  for (let i = 0; i < 3; i++) {
    drawPixelRect(ctx, baseX + i * p * 2, baseY + p * 1, p, p, lightenColor(color, 30));
    drawPixelRect(ctx, baseX + p + i * p * 2, baseY + p * 1.5, p, p * 0.5, color);
  }
  // Gate
  drawPixelRect(ctx, baseX + p * 2, baseY + p * 4, p * 2, p * 2, "#0a0a1a");
  drawPixelRect(ctx, baseX + p * 2.25, baseY + p * 3.5, p * 1.5, p * 0.5, lightenColor(color, 20));
  // Flag
  drawPixelRect(ctx, baseX + p * 5, baseY, p * 0.4, p * 2, "#aaa");
  drawPixelRect(ctx, baseX + p * 5.4, baseY, p * 1.2, p * 0.8, "#ff0040");

  ctx.shadowBlur = 0;
}

// Draw a star node (plugin)
function drawStarSprite(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, time: number, glow: boolean) {
  const pulse = 1 + Math.sin(time * 0.005) * 0.1;
  const rr = r * pulse;

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = rr * 1.2; }

  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr);
    else ctx.lineTo(cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr);
    ctx.lineTo(cx + Math.cos(innerAngle) * rr * 0.45, cy + Math.sin(innerAngle) * rr * 0.45);
  }
  ctx.closePath();
  ctx.fill();

  // Inner highlight
  ctx.fillStyle = lightenColor(color, 50);
  ctx.beginPath();
  ctx.arc(cx - rr * 0.15, cy - rr * 0.15, rr * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

// Draw a tower
function drawTower(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const p = s / 6;
  const baseX = cx - p * 1.5;
  const baseY = cy - s / 2;

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = s * 0.4; }

  drawPixelRect(ctx, baseX, baseY + p * 2, p * 3, p * 4, color);
  drawPixelRect(ctx, baseX, baseY + p * 4, p * 3, p * 2, shadeColor(color, -20));
  // Roof (triangle as stacked rects)
  drawPixelRect(ctx, baseX - p * 0.5, baseY + p * 1.5, p * 4, p * 0.5, lightenColor(color, 20));
  drawPixelRect(ctx, baseX, baseY + p * 1, p * 3, p * 0.5, lightenColor(color, 30));
  drawPixelRect(ctx, baseX + p * 0.5, baseY + p * 0.5, p * 2, p * 0.5, lightenColor(color, 40));
  drawPixelRect(ctx, baseX + p, baseY, p, p * 0.5, lightenColor(color, 60));
  // Window
  drawPixelRect(ctx, baseX + p, baseY + p * 3, p, p, "#ffd700");

  ctx.shadowBlur = 0;
}

// Draw a house
function drawHouse(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const p = s / 6;
  const baseX = cx - s / 2 + p * 0.5;
  const baseY = cy - s / 2 + p;

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = s * 0.3; }

  // Body
  drawPixelRect(ctx, baseX, baseY + p * 2, p * 5, p * 3, color);
  drawPixelRect(ctx, baseX, baseY + p * 3.5, p * 5, p * 1.5, shadeColor(color, -20));
  // Roof
  drawPixelRect(ctx, baseX - p * 0.5, baseY + p * 1.5, p * 6, p * 0.5, shadeColor(color, -10));
  drawPixelRect(ctx, baseX, baseY + p * 1, p * 5, p * 0.5, lightenColor(color, 20));
  drawPixelRect(ctx, baseX + p * 0.5, baseY + p * 0.5, p * 4, p * 0.5, lightenColor(color, 35));
  drawPixelRect(ctx, baseX + p, baseY, p * 3, p * 0.5, lightenColor(color, 50));
  // Door
  drawPixelRect(ctx, baseX + p * 2, baseY + p * 3.5, p, p * 1.5, "#0a0a1a");
  // Window
  drawPixelRect(ctx, baseX + p * 0.5, baseY + p * 2.5, p * 0.8, p * 0.8, "#ffd700");
  drawPixelRect(ctx, baseX + p * 3.7, baseY + p * 2.5, p * 0.8, p * 0.8, "#ffd700");

  ctx.shadowBlur = 0;
}

// Draw a cave
function drawCave(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const r = s / 2;

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = s * 0.4; }

  // Rock mound
  ctx.fillStyle = shadeColor(color, -30);
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.2, r, Math.PI, 0);
  ctx.fill();

  // Lighter top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.85, Math.PI, 0);
  ctx.fill();

  // Cave mouth
  ctx.fillStyle = "#06060b";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.5, r * 0.45, r * 0.5, 0, Math.PI, 0);
  ctx.fill();

  // Eyes in the dark
  if (glow) {
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy + r * 0.35, r * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, cy + r * 0.35, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// Draw a bridge
function drawBridge(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, glow: boolean) {
  const p = s / 6;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = s * 0.3; }

  // Planks
  drawPixelRect(ctx, cx - p * 3, cy - p * 0.5, p * 6, p, color);
  drawPixelRect(ctx, cx - p * 3, cy + p * 0.5, p * 6, p * 0.3, shadeColor(color, -20));
  // Rails
  drawPixelRect(ctx, cx - p * 3, cy - p * 2, p * 0.5, p * 3, lightenColor(color, 20));
  drawPixelRect(ctx, cx + p * 2.5, cy - p * 2, p * 0.5, p * 3, lightenColor(color, 20));
  // Rope
  ctx.strokeStyle = "#8b7355";
  ctx.lineWidth = p * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - p * 2.75, cy - p * 2);
  ctx.quadraticCurveTo(cx, cy - p * 0.5, cx + p * 2.75, cy - p * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

// Color helpers
function shadeColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function lightenColor(hex: string, amt: number): string {
  return shadeColor(hex, amt);
}

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
  // Cache the terrain image so we don't re-draw tiles every frame
  const terrainCacheRef = useRef<HTMLCanvasElement | null>(null);
  const terrainScaleRef = useRef(0);

  const buildTerrainCache = useCallback((w: number, h: number, sc: number, ox: number, oy: number) => {
    const tc = document.createElement("canvas");
    tc.width = w;
    tc.height = h;
    const tctx = tc.getContext("2d")!;
    const cs = CELL * sc;

    // Background gradient (deep ocean)
    const grad = tctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, "#0c1a2e");
    grad.addColorStop(1, "#060d18");
    tctx.fillStyle = grad;
    tctx.fillRect(0, 0, w, h);

    // Draw terrain tiles
    const tileSize = cs;
    const startGX = Math.floor(-ox / cs);
    const startGY = Math.floor(-oy / cs);
    const endGX = Math.ceil((w - ox) / cs);
    const endGY = Math.ceil((h - oy) / cs);

    for (let gx = startGX; gx <= endGX; gx++) {
      for (let gy = startGY; gy <= endGY; gy++) {
        const px = ox + gx * cs;
        const py = oy + gy * cs;
        const inBounds = gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H;
        const h_val = hash(gx, gy);

        if (!inBounds) {
          // Water tiles outside the map
          drawWaterTile(tctx, px, py, tileSize, h_val, 0);
        } else {
          // Is there a node nearby? Different terrain for node tiles
          const hasNode = LEVEL_NODES.some((n) => n.x === gx && n.y === gy);
          if (hasNode) {
            // Cleared ground tile
            drawGroundTile(tctx, px, py, tileSize, h_val, true);
          } else {
            // Regular terrain based on position
            const distToCenter = Math.sqrt((gx - 7) ** 2 + (gy - 4) ** 2);
            if (distToCenter > 6) {
              drawWaterTile(tctx, px, py, tileSize, h_val, 0);
            } else if (h_val > 200) {
              drawMountainTile(tctx, px, py, tileSize, h_val);
            } else if (h_val > 140) {
              drawTreeTile(tctx, px, py, tileSize, h_val);
            } else {
              drawGroundTile(tctx, px, py, tileSize, h_val, false);
            }
          }
        }
      }
    }

    terrainCacheRef.current = tc;
    terrainScaleRef.current = sc;
  }, []);

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
    ctx.imageSmoothingEnabled = false;

    // Rebuild terrain cache if scale changed
    if (!terrainCacheRef.current || Math.abs(terrainScaleRef.current - scale) > 0.01) {
      buildTerrainCache(w, h, scale, offset.x, offset.y);
    }

    // Draw cached terrain
    if (terrainCacheRef.current) {
      ctx.drawImage(terrainCacheRef.current, 0, 0, w, h);
    }

    // Animated water shimmer overlay
    const waterTime = time * 0.001;
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#22d3ee";
    for (let wx = 0; wx < w; wx += 32) {
      for (let wy = 0; wy < h; wy += 32) {
        const shimmer = Math.sin(wx * 0.05 + wy * 0.03 + waterTime) * 0.5 + 0.5;
        if (shimmer > 0.7) {
          ctx.fillRect(wx, wy, 4, 2);
        }
      }
    }
    ctx.globalAlpha = 1;

    const cs = CELL * scale;

    // Draw paths between connected nodes — thick dotted trail
    LEVEL_NODES.forEach((node) => {
      node.connections.forEach((targetRepo) => {
        const target = LEVEL_NODES.find((n) => n.repo === targetRepo);
        if (!target) return;
        if (LEVEL_NODES.indexOf(node) > LEVEL_NODES.indexOf(target)) return;

        const x1 = offset.x + (node.x + 0.5) * cs;
        const y1 = offset.y + (node.y + 0.5) * cs;
        const x2 = offset.x + (target.x + 0.5) * cs;
        const y2 = offset.y + (target.y + 0.5) * cs;
        const isActive = node.status !== "locked" && target.status !== "locked";

        if (isActive) {
          // Draw path as repeating dots (like SMW path dots)
          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const dotCount = Math.floor(dist / (8 * scale));
          const dx = (x2 - x1) / dotCount;
          const dy = (y2 - y1) / dotCount;

          for (let d = 0; d < dotCount; d++) {
            const dotX = x1 + dx * d;
            const dotY = y1 + dy * d;
            const dotSize = 2.5 * scale;
            // Alternating colors for authenticity
            ctx.fillStyle = d % 2 === 0 ? "#c4a44a" : "#8b7732";
            ctx.fillRect(
              Math.floor(dotX - dotSize / 2),
              Math.floor(dotY - dotSize / 2),
              Math.ceil(dotSize),
              Math.ceil(dotSize)
            );
          }
        } else {
          // Faded path
          ctx.setLineDash([3 * scale, 6 * scale]);
          ctx.lineWidth = 1 * scale;
          ctx.strokeStyle = "#1a2535";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });

    // Draw power-ups bouncing on paths
    PLUGIN_POWERUPS.forEach((pu, i) => {
      const fromNode = LEVEL_NODES.find((n) => n.repo === pu.pathFrom);
      const toNode = LEVEL_NODES.find((n) => n.repo === pu.pathTo);
      if (!fromNode || !toNode) return;

      const t = ((time * 0.00015 + i * 0.12) % 1);
      const bounce = Math.abs(Math.sin(t * Math.PI * 3)) * 8 * scale;
      const x1 = offset.x + (fromNode.x + 0.5) * cs;
      const y1 = offset.y + (fromNode.y + 0.5) * cs;
      const x2 = offset.x + (toNode.x + 0.5) * cs;
      const y2 = offset.y + (toNode.y + 0.5) * cs;

      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t - bounce;

      const color = GROUP_COLORS[pu.group];
      const sz = 5 * scale;

      // Question block style (like SMW ? blocks)
      ctx.fillStyle = color;
      ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
      ctx.fillStyle = lightenColor(color, 40);
      ctx.fillRect(px - sz, py - sz, sz * 2, sz * 0.5);
      ctx.fillStyle = shadeColor(color, -30);
      ctx.fillRect(px - sz, py + sz * 0.5, sz * 2, sz * 0.5);
      // ? mark
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.floor(sz * 1.2)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", px, py);

      // Shadow on ground
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(px, y1 + (y2 - y1) * t + sz * 1.5, sz * 0.8, sz * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw level nodes with proper pixel-art sprites
    LEVEL_NODES.forEach((node) => {
      const cx = offset.x + (node.x + 0.5) * cs;
      const cy = offset.y + (node.y + 0.5) * cs;
      const size = (node.sprite === "castle" ? 36 : node.sprite === "fortress" ? 28 : node.sprite === "star" ? 12 : 22) * scale;
      const color = SPRITE_COLORS[node.sprite];
      const isSelected = node.repo === selectedRepo;
      const isHovered = hoveredNode?.repo === node.repo;
      const alpha = node.status === "locked" ? 0.25 : 1;
      const glow = isSelected || isHovered || node.status === "active";

      ctx.globalAlpha = alpha;

      // Draw sprite based on type
      switch (node.sprite) {
        case "castle":
          drawCastle(ctx, cx, cy, size, color, glow);
          break;
        case "fortress":
          drawFortress(ctx, cx, cy, size, color, glow);
          break;
        case "star":
          drawStarSprite(ctx, cx, cy, size, color, time, glow);
          break;
        case "tower":
          drawTower(ctx, cx, cy, size, color, glow);
          break;
        case "house":
          drawHouse(ctx, cx, cy, size, color, glow);
          break;
        case "cave":
          drawCave(ctx, cx, cy, size, color, glow);
          break;
        case "bridge":
          drawBridge(ctx, cx, cy, size, color, glow);
          break;
        default:
          // Fallback circle
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.fill();
      }

      // Selection cursor (blinking bracket)
      if (isSelected || isHovered) {
        const blink = Math.sin(time * 0.008) > 0;
        if (blink || isHovered) {
          const cr = size * 0.8;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2 * scale;
          // Corner brackets
          const bl = cr * 0.3;
          // Top-left
          ctx.beginPath();
          ctx.moveTo(cx - cr, cy - cr + bl);
          ctx.lineTo(cx - cr, cy - cr);
          ctx.lineTo(cx - cr + bl, cy - cr);
          ctx.stroke();
          // Top-right
          ctx.beginPath();
          ctx.moveTo(cx + cr - bl, cy - cr);
          ctx.lineTo(cx + cr, cy - cr);
          ctx.lineTo(cx + cr, cy - cr + bl);
          ctx.stroke();
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(cx - cr, cy + cr - bl);
          ctx.lineTo(cx - cr, cy + cr);
          ctx.lineTo(cx - cr + bl, cy + cr);
          ctx.stroke();
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(cx + cr - bl, cy + cr);
          ctx.lineTo(cx + cr, cy + cr);
          ctx.lineTo(cx + cr, cy + cr - bl);
          ctx.stroke();
        }
      }

      // Label with drop shadow
      const labelY = cy + size * 0.7 + 8 * scale;
      ctx.font = `bold ${Math.floor(9 * scale)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      // Shadow
      ctx.fillStyle = "#000";
      ctx.fillText(node.displayName, cx + 1, labelY + 1);
      // Text
      ctx.fillStyle = node.status === "locked" ? "#2a3040" : lightenColor(color, 30);
      ctx.fillText(node.displayName, cx, labelY);

      // Stars count with star icon
      if (node.stars > 0 && node.status !== "locked") {
        ctx.font = `${Math.floor(7 * scale)}px monospace`;
        ctx.fillStyle = "#ffd700";
        ctx.fillText(`* ${node.stars}`, cx, labelY + 12 * scale);
      }

      ctx.globalAlpha = 1;
    });

    // Draw Mario-style player indicator on selected node
    if (selectedRepo) {
      const node = LEVEL_NODES.find((n) => n.repo === selectedRepo);
      if (node) {
        const cx = offset.x + (node.x + 0.5) * cs;
        const cy = offset.y + (node.y + 0.5) * cs;
        const bob = Math.sin(time * 0.006) * 3 * scale;
        const playerY = cy - 30 * scale + bob;

        // Arrow pointing down
        ctx.fillStyle = "#ff0040";
        const aw = 6 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, playerY + aw * 2);
        ctx.lineTo(cx - aw, playerY + aw);
        ctx.lineTo(cx + aw, playerY + aw);
        ctx.closePath();
        ctx.fill();

        // "P1" text
        ctx.font = `bold ${Math.floor(8 * scale)}px monospace`;
        ctx.fillStyle = "#ff0040";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("P1", cx, playerY + aw);
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [offset, scale, hoveredNode, selectedRepo, buildTerrainCache]);

  // Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const fitScale = Math.min(w / MAP_W, h / MAP_H) * 0.85;
      setScale(fitScale);
      setOffset({
        x: (w - MAP_W * fitScale) / 2,
        y: (h - MAP_H * fitScale) / 2,
      });
    }
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cs = CELL * scale;

      for (const node of LEVEL_NODES) {
        if (node.status === "locked") continue;
        const cx = offset.x + (node.x + 0.5) * cs;
        const cy = offset.y + (node.y + 0.5) * cs;
        const r = (node.sprite === "castle" ? 20 : node.sprite === "fortress" ? 16 : 12) * scale;
        if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) <= r + 6) {
          onSelectLevel(node.repo);
          return;
        }
      }
    },
    [offset, scale, onSelectLevel]
  );

  // Hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cs = CELL * scale;

      for (const node of LEVEL_NODES) {
        const cx = offset.x + (node.x + 0.5) * cs;
        const cy = offset.y + (node.y + 0.5) * cs;
        const r = (node.sprite === "castle" ? 20 : node.sprite === "fortress" ? 16 : 12) * scale;
        if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) <= r + 6) {
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

  // Zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newScale = Math.max(0.4, Math.min(3, scale * delta));
      terrainCacheRef.current = null; // invalidate terrain cache
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
            {hoveredNode.stars > 0 && <span>* {hoveredNode.stars}</span>}
            <span>{hoveredNode.org}/{hoveredNode.repo}</span>
            <span className={`overworld-status-${hoveredNode.status}`}>
              {hoveredNode.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Map legend */}
      <div className="overworld-legend">
        <span className="overworld-legend-item"><span style={{color:"#ff0040"}}>W</span> Castle</span>
        <span className="overworld-legend-item"><span style={{color:"#ff8800"}}>F</span> Fortress</span>
        <span className="overworld-legend-item"><span style={{color:"#22d3ee"}}>*</span> Plugin</span>
        <span className="overworld-legend-item"><span style={{color:"#ffd700"}}>?</span> Power-up</span>
      </div>
    </div>
  );
}

// ── Terrain tile drawing functions ──────────────────────────────────

function drawWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, h: number, _time: number) {
  // Deep water with variation
  const base = 8 + (h % 8);
  ctx.fillStyle = `rgb(${base}, ${base + 15}, ${base + 35})`;
  ctx.fillRect(x, y, size, size);

  // Wave highlights
  const p = size / 8;
  ctx.fillStyle = `rgba(34, 211, 238, ${0.05 + (h % 5) * 0.01})`;
  for (let i = 0; i < 3; i++) {
    const wx = x + ((h + i * 37) % 6) * p;
    const wy = y + ((h + i * 53) % 6) * p;
    ctx.fillRect(wx, wy, p * 2, p * 0.4);
  }
}

function drawGroundTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, h: number, isNodeTile: boolean) {
  const p = size / 8;

  // Base grass color
  const greenBase = isNodeTile ? 28 : 18;
  const r = greenBase + (h % 8);
  const g = greenBase + 40 + (h % 12);
  const b = greenBase + (h % 6);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(x, y, size, size);

  // Grass tufts (small pixel details)
  ctx.fillStyle = `rgb(${r + 15}, ${g + 20}, ${b + 10})`;
  for (let i = 0; i < 4; i++) {
    const gx = x + ((h + i * 29) % 7) * p;
    const gy = y + ((h + i * 43) % 7) * p;
    ctx.fillRect(gx, gy, p, p * 0.5);
  }

  // Darker patches
  ctx.fillStyle = `rgb(${r - 8}, ${g - 10}, ${b - 5})`;
  const dx = x + ((h * 3) % 5) * p;
  const dy = y + ((h * 7) % 5) * p;
  ctx.fillRect(dx, dy, p * 1.5, p);

  // Tile border (subtle grid look like SNES tiles)
  ctx.fillStyle = `rgba(0,0,0,0.08)`;
  ctx.fillRect(x, y, size, 1);
  ctx.fillRect(x, y, 1, size);
}

function drawTreeTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, h: number) {
  // Ground first
  drawGroundTile(ctx, x, y, size, h, false);

  const p = size / 8;
  // Tree trunk
  const tx = x + p * 3;
  const ty = y + p * 4;
  ctx.fillStyle = "#5c3a1e";
  ctx.fillRect(tx + p * 0.5, ty, p, p * 3);

  // Canopy (layered circles as rects for pixel look)
  ctx.fillStyle = "#1a6b30";
  ctx.fillRect(tx - p, ty - p * 2, p * 3, p * 2);
  ctx.fillStyle = "#228b3a";
  ctx.fillRect(tx - p * 0.5, ty - p * 3, p * 2, p * 1.5);
  ctx.fillStyle = "#2ea848";
  ctx.fillRect(tx, ty - p * 3.5, p, p);

  // Highlight
  ctx.fillStyle = "#3cc858";
  ctx.fillRect(tx - p * 0.5, ty - p * 2.5, p * 0.5, p * 0.5);
}

function drawMountainTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, h: number) {
  // Base ground
  const p = size / 8;
  ctx.fillStyle = "#1a1e28";
  ctx.fillRect(x, y, size, size);

  // Mountain body
  ctx.fillStyle = "#3a3e58";
  ctx.beginPath();
  ctx.moveTo(x + p, y + p * 7);
  ctx.lineTo(x + p * 4, y + p);
  ctx.lineTo(x + p * 7, y + p * 7);
  ctx.closePath();
  ctx.fill();

  // Lighter face
  ctx.fillStyle = "#4a5070";
  ctx.beginPath();
  ctx.moveTo(x + p * 4, y + p);
  ctx.lineTo(x + p * 7, y + p * 7);
  ctx.lineTo(x + p * 4, y + p * 7);
  ctx.closePath();
  ctx.fill();

  // Snow cap
  if (h > 220) {
    ctx.fillStyle = "#e8e8f0";
    ctx.beginPath();
    ctx.moveTo(x + p * 3.5, y + p * 2);
    ctx.lineTo(x + p * 4, y + p);
    ctx.lineTo(x + p * 4.5, y + p * 2);
    ctx.closePath();
    ctx.fill();
  }

  // Rocky texture
  ctx.fillStyle = "#2a2e40";
  ctx.fillRect(x + p * 2.5, y + p * 5, p, p * 0.5);
  ctx.fillRect(x + p * 5, y + p * 4, p * 0.5, p);
}
