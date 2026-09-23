"use client";

import { useEffect, useRef } from "react";
import {
  LOAD_ZOOM,
  MAP_ROTATION,
  MAP_CENTER,
  mapViewHeight,
  onIsland,
  random,
  shoreline,
} from "@/lib/city";

/** Street grid shared with the 3D ground so the map and the risen city line up. */
const GRID = { x0: -13.25, dx: 2.5, z0: -65.05, dz: 2.15 };

/** The bare, zoomed-in top view shown while the city loads: blocks and street borders, nothing else. */
export default function ManhattanMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Water and night haze
      context.fillStyle = "#050a22";
      context.fillRect(0, 0, width, height);
      const haze = (x: number, y: number, r: number, color: string) => {
        const g = context.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "transparent");
        context.fillStyle = g;
        context.fillRect(0, 0, width, height);
      };
      haze(width * 0.92, height * 0.12, width * 0.45, "#2a3a5a44");
      haze(width * 0.1, height * 0.95, width * 0.5, "#1e2a4455");

      const scale = (height / mapViewHeight(width / height)) * LOAD_ZOOM;
      context.save();
      context.translate(width * 0.5, height * 0.5);
      context.rotate(-MAP_ROTATION);
      context.scale(scale, scale);
      context.translate(-MAP_CENTER.x, -MAP_CENTER.z);

      context.beginPath();
      shoreline.forEach(([x, z], i) =>
        i ? context.lineTo(x, z) : context.moveTo(x, z),
      );
      context.closePath();
      context.fillStyle = "#1b2766";
      context.fill();
      context.save();
      context.clip();

      // Blocks: dark fills, the lighter island showing through as street borders.
      const rand = random(422);
      const inset = 0.2;
      for (let x = GRID.x0; x < 13; x += GRID.dx)
        for (let z = GRID.z0; z < 62; z += GRID.dz) {
          const cx = x + GRID.dx / 2;
          const cz = z + GRID.dz / 2;
          if (!onIsland(cx, cz)) continue;
          const bx = x + inset;
          const bz = z + inset;
          const bw = GRID.dx - inset * 2;
          const bd = GRID.dz - inset * 2;
          context.fillStyle = rand() > 0.85 ? "#111a4a" : "#0b1136";
          context.fillRect(bx, bz, bw, bd);
          // Lot lines split most blocks, so the grid doesn't read as a spreadsheet.
          context.strokeStyle = "#18225a";
          context.lineWidth = 0.035;
          const lots = 1 + Math.floor(rand() * 3);
          for (let i = 1; i <= lots; i++) {
            const t = bx + (bw * i) / (lots + 1) + (rand() - 0.5) * 0.3;
            context.beginPath();
            context.moveTo(t, bz);
            context.lineTo(t, bz + bd);
            context.stroke();
          }
          if (rand() > 0.5) {
            context.beginPath();
            context.moveTo(bx, bz + bd / 2);
            context.lineTo(bx + bw, bz + bd / 2);
            context.stroke();
          }
        }
      // Central Park: an open, unbuilt rectangle.
      context.fillStyle = "#0e1840";
      context.fillRect(-1.7 + 0.2, -39 + 0.2, 8.8 - 0.4, 25 - 0.4);
      context.restore();

      context.strokeStyle = "#3a4ea8";
      context.lineWidth = 0.12;
      context.stroke();
      context.restore();
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, []);
  return (
    <canvas ref={canvasRef} className="manhattan-map" aria-hidden="true" />
  );
}
