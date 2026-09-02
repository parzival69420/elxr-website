"use client";

import "@/lib/rafFallback";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero } from "@/lib/content";
import { pourProgress } from "@/lib/pour";

const CityCanvas = dynamic(() => import("./city/CityCanvas"), { ssr: false });

/**
 * The one orchestrated moment on the page. A 300vh scroll region with a
 * sticky viewport; GSAP ScrollTrigger scrubs a single progress value that
 * drives the pour shader AND the city liquid spread (section 5).
 *
 * Under 768px the shader pour is replaced by a CSS gradient wipe.
 * prefers-reduced-motion turns the pour into a simple cross-fade.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"shader" | "wipe" | "fade" | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    setMode(reduced ? "fade" : mobile ? "wipe" : "shader");
  }, []);

  useEffect(() => {
    if (!mode || !sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        pourProgress.value = self.progress;

        // headline + scroll cue dissolve as the flood begins
        if (headlineRef.current) {
          const fade = 1 - Math.min(1, self.progress / 0.22);
          headlineRef.current.style.opacity = String(fade);
          headlineRef.current.style.transform = `translateY(${self.progress * -60}px)`;
        }

        // DOM fallbacks for the pour itself
        if (wipeRef.current) {
          if (mode === "fade") {
            wipeRef.current.style.opacity = String(
              1 - Math.min(1, self.progress * 2),
            );
          } else if (mode === "wipe") {
            const p = self.progress;
            const flood = Math.min(1, p * 2);
            const recede = Math.max(0, (p - 0.5) * 2);
            // rises purple, then slides away upward
            wipeRef.current.style.background = `linear-gradient(to top, var(--purple) ${flood * 115 - recede * 130}%, transparent ${flood * 115 - recede * 130 + 12}%), linear-gradient(var(--base), var(--base))`;
            wipeRef.current.style.opacity = p > 0.55 ? String(1 - recede) : "1";
          }
        }
      },
    });

    return () => st.kill();
  }, [mode]);

  return (
    <section ref={sectionRef} id="top" className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the single WebGL context */}
        {mode && (
          <CityCanvas mobile={mode !== "shader"} withPour={mode === "shader"} />
        )}

        {/* CSS fallback layer (mobile wipe / reduced-motion cross-fade) */}
        {mode && mode !== "shader" && (
          <div
            ref={wipeRef}
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--base)" }}
            aria-hidden="true"
          />
        )}

        {/* headline block */}
        <div
          ref={headlineRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium text-text/75 md:text-xl">
            {hero.subline}
          </p>
        </div>

        {/* scroll cue */}
        <div
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-lavender">
            {hero.scrollCue}
          </span>
          <span className="block h-8 w-px bg-gradient-to-b from-lavender to-transparent" />
        </div>
      </div>
    </section>
  );
}
