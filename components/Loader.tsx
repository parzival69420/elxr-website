"use client";

import { useEffect, useRef, useState } from "react";
import { CITY_READY_EVENT, cityJourney } from "@/lib/city";
import { loader } from "@/lib/content";

/** The loading screen's one control: a glass pill over the flat map, filled by real model progress. */
export default function Loader() {
  const [loaded, setLoaded] = useState(false);
  const [gone, setGone] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finish = () => setLoaded(true);
    if (cityJourney.ready) finish();
    window.addEventListener(CITY_READY_EVENT, finish, { once: true });
    return () => window.removeEventListener(CITY_READY_EVENT, finish);
  }, []);

  useEffect(() => {
    const start = performance.now();
    let shown = 0;
    let frame = 0;
    const tick = (now: number) => {
      // Before the 3D chunk arrives there is no model progress yet, so creep slowly to 25%.
      const waiting = Math.min(0.25, (now - start) / 16000);
      const target = loaded ? 1 : Math.max(waiting, 0.1 + cityJourney.load * 0.85);
      shown += (Math.min(target, loaded ? 1 : 0.95) - shown) * 0.08;
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (label.current)
        label.current.textContent = `${Math.round(shown * 100)}%`;
      if (!loaded || shown < 0.995) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(timeout);
  }, [loaded]);

  return (
    <div
      className={`city-loading ${loaded ? "is-done" : ""} ${gone ? "is-gone" : ""}`}
    >
      <p className="city-loading-mark" aria-hidden="true">
        ELXR
      </p>
      <div className="city-loading-pill glass">
        <span role="status" aria-live="polite">
          {loaded ? loader.served : loader.pouring}
        </span>
        <span className="city-loading-track" aria-hidden="true">
          <span ref={bar} />
        </span>
        <span ref={label} className="city-loading-percent" aria-hidden="true">
          0%
        </span>
      </div>
    </div>
  );
}
