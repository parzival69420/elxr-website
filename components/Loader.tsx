"use client";

import { useEffect, useRef, useState } from "react";
import { CITY_READY_EVENT, cityJourney } from "@/lib/city";
import { loader } from "@/lib/content";

const CELLS = 32;

/**
 * The loading screen: a neon HUD over the flat map. The wordmark fills with
 * liquid, the cell bar lights up and the boot log ticks over, all from real
 * model progress, written to one `--p` custom property on the root.
 */
export default function Loader() {
  const [loaded, setLoaded] = useState(false);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const log = useRef<HTMLOListElement>(null);

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
      root.current?.style.setProperty("--p", shown.toFixed(4));
      if (label.current)
        label.current.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      log.current?.querySelectorAll("li").forEach((line, i, lines) => {
        line.toggleAttribute("data-on", shown >= (i + 1) / (lines.length + 1));
      });
      if (!loaded || shown < 0.995) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => setGone(true), 1300);
    return () => clearTimeout(timeout);
  }, [loaded]);

  return (
    <div
      ref={root}
      className={`hud-loader ${loaded ? "is-done" : ""} ${gone ? "is-gone" : ""}`}
    >
      <span className="hud-corner is-tl" aria-hidden="true" />
      <span className="hud-corner is-tr" aria-hidden="true" />
      <span className="hud-corner is-bl" aria-hidden="true" />
      <span className="hud-corner is-br" aria-hidden="true" />

      <div className="hud-top" aria-hidden="true">
        <span>ELXR//SYS 0.9</span>
        <span>40.7580°N 73.9855°W</span>
      </div>

      <div className="hud-core" aria-hidden="true">
        <span className="hud-ring" />
        <span className="hud-ring is-inner" />
        <p className="hud-mark" data-text="ELXR">
          ELXR
          <span className="hud-mark-fill">ELXR</span>
        </p>
      </div>

      <div className="hud-panel">
        <div className="hud-readout">
          <span role="status" aria-live="polite" className="hud-status">
            {loaded ? loader.served : loader.pouring}
          </span>
          <span className="hud-percent" aria-hidden="true">
            <span ref={label}>000</span>%
          </span>
        </div>
        <div className="hud-cells" aria-hidden="true">
          {Array.from({ length: CELLS }, (_, i) => (
            <span key={i} style={{ "--i": i / CELLS } as React.CSSProperties} />
          ))}
        </div>
        <ol ref={log} className="hud-log" aria-hidden="true">
          {loader.boot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
