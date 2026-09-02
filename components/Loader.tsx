"use client";

import { useEffect, useState } from "react";
import { loader } from "@/lib/content";

/**
 * SVG bottle fill tied to real load progress (technique 1, section 5).
 * A rect clipped to the bottle silhouette rises with progress; a sine-ish
 * wave path on top gives the surface its slosh. Pure SVG + CSS, no WebGL.
 */
export default function Loader() {
  const [progress, setProgress] = useState(0);
  const [served, setServed] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Reduced motion: jump straight to "Served." and get out of the way.
      setProgress(100);
      setServed(true);
      const t = setTimeout(() => setGone(true), 500);
      return () => clearTimeout(t);
    }

    let current = 0;
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);

    // setInterval rather than rAF so the pour still completes in a
    // backgrounded tab instead of freezing mid-fill.
    const start = Date.now();
    const interval = setInterval(() => {
      if (document.readyState === "complete") loaded = true;
      // hard cap: never hold the page hostage behind the loader
      if (Date.now() - start > 8000) loaded = true;
      const target = loaded ? 100 : 90;
      current += loaded
        ? Math.max((target - current) * 0.16, 1.5)
        : (target - current) * 0.04;
      if (current > 99.5) current = 100;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setServed(true);
        setTimeout(() => setGone(true), 700); // the beat before transition
      }
    }, 40);

    return () => {
      clearInterval(interval);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (gone) return null;

  // Bottle interior spans y=18..92 in the 60x100 viewBox.
  const fillTop = 92 - (progress / 100) * 74;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-base transition-opacity duration-500 ${
        served ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 60 100" className="h-40 w-auto">
        <defs>
          <clipPath id="bottle-clip">
            <path d="M22 4 h16 v14 c0 4 12 10 12 24 v46 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8 V42 c0 -14 12 -20 12 -24 Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#bottle-clip)">
          <rect x="-20" y={fillTop} width="100" height="100" fill="var(--purple)" />
          {/* sloshing surface wave */}
          <path
            className="slosh"
            d={`M -20 ${fillTop} q 10 -4 20 0 t 20 0 t 20 0 t 20 0 t 20 0 v 6 h -100 Z`}
            fill="var(--purple)"
          />
        </g>
        <path
          d="M22 4 h16 v14 c0 4 12 10 12 24 v46 a8 8 0 0 1 -8 8 H18 a8 8 0 0 1 -8 -8 V42 c0 -14 12 -20 12 -24 Z"
          fill="none"
          stroke="rgba(247,244,240,0.35)"
          strokeWidth="2"
        />
      </svg>
      <p className="text-sm font-medium tracking-widest text-lavender">
        {served ? loader.served : loader.pouring}
      </p>
    </div>
  );
}
