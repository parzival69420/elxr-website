"use client";

import { useEffect, useRef } from "react";
import {
  MAP_ROTATION,
  MAP_CENTER,
  mapViewHeight,
  onIsland,
  random,
  shoreline,
} from "@/lib/city";

/** The lightweight map is visible before the WebGL chunk or fonts have loaded. */
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
      context.scale(dpr, dpr);
      context.clearRect(0, 0, width, height);
      const scale = height / mapViewHeight(width / height);
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
      context.fillStyle = "#0c1630";
      context.fill();
      context.strokeStyle = "#456b8d";
      context.lineWidth = 0.14;
      context.stroke();
      context.save();
      context.clip();
      context.strokeStyle = "#244365";
      context.lineWidth = 0.1;
      for (let x = -15; x <= 15; x += 2.5) {
        context.beginPath();
        context.moveTo(x, -72);
        context.lineTo(x, 64);
        context.stroke();
      }
      for (let z = -72; z <= 64; z += 1.65) {
        context.beginPath();
        context.moveTo(-16, z);
        context.lineTo(16, z);
        context.stroke();
      }
      const rand = random(422);
      for (let x = -12; x < 13; x += 1.25)
        for (let z = -64; z < 59; z += 1.65) {
          if (!onIsland(x, z) || (x > -1 && x < 7 && z > -38 && z < -15))
            continue;
          context.fillStyle = rand() > 0.8 ? "#3c4772" : "#1c2a46";
          context.fillRect(x + 0.18, z + 0.2, 0.82, 1.12);
        }
      context.fillStyle = "#102e2b";
      context.fillRect(-1, -38, 8, 23);
      context.beginPath();
      context.moveTo(-9, 50);
      context.bezierCurveTo(-9, 20, -2, 3, 8, -65);
      context.strokeStyle = "#ef55bb";
      context.lineWidth = 0.32;
      context.shadowColor = "#ff34ac";
      context.shadowBlur = 12;
      context.stroke();
      context.restore();
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
