"use client";

import { useEffect, useRef, useState } from "react";
import { neonLiquids } from "@/lib/bottles";

type Mix = {
  a: string;
  b: string;
  level: number; // % of the vial the liquid fills
  amp: number; // wave height, px
  waveLength: number; // px per wave
  speed: number; // seconds per wave cycle
  reverse: boolean;
  bubbles: { left: number; size: number; delay: number; duration: number }[];
};

// One shuffle per page view, so the vials on screen never share a colour.
let order: number[] | null = null;
function liquidFor(index: number) {
  if (!order) {
    order = neonLiquids.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  const pair = neonLiquids[order[index % order.length]];
  return Math.random() < 0.5 ? pair : ([pair[1], pair[0]] as [string, string]);
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function randomMix(index: number): Mix {
  const [a, b] = liquidFor(index);
  return {
    a,
    b,
    level: Math.round(rand(38, 68)),
    amp: Math.round(rand(16, 30)),
    waveLength: Math.round(rand(180, 320)),
    speed: rand(3.2, 6.5),
    reverse: Math.random() < 0.5,
    bubbles: Array.from({ length: 6 }, () => ({
      left: rand(6, 94),
      size: rand(3, 9),
      delay: rand(0, 6),
      duration: rand(3.5, 7),
    })),
  };
}

/** A case figure as a vial of neon liquid. The mix is random per visitor, so no two visits look alike. */
export default function WorkVial({
  index,
  figure,
  label,
  fallback,
}: {
  index: number;
  figure: string;
  label: string;
  fallback: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mix, setMix] = useState<Mix | null>(null);
  const [live, setLive] = useState(false);

  // Randomise after hydration so server and client markup match.
  useEffect(() => setMix(randomMix(index)), [index]);

  // Only animate while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const vars = {
    "--liq-a": mix?.a ?? fallback,
    "--liq-b": mix?.b ?? fallback,
    "--level": `${mix?.level ?? 45}%`,
    "--amp": `${mix?.amp ?? 22}px`,
    "--wl": `${mix?.waveLength ?? 240}px`,
    "--speed": `${mix?.speed ?? 5}s`,
    "--dir": mix?.reverse ? "reverse" : "normal",
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      className={`work-figure work-vial${mix ? " is-mixed" : ""}${live ? " is-live" : ""}`}
      style={vars}
      aria-hidden="true"
    >
      <div className="vial-glow">
        <div className="vial-liquid vial-liquid-back" />
        <div className="vial-liquid vial-liquid-front">
          {mix?.bubbles.map((b, i) => (
            <i
              key={i}
              className="vial-bubble"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
              }}
            />
          ))}
        </div>
      </div>
      <span>{figure}</span>
      <small>{label}</small>
    </div>
  );
}
