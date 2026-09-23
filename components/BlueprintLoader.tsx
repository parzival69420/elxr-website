"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BLUEPRINT_DRAWN_EVENT, CITY_READY_EVENT, cityJourney, onIsland, shoreline } from "@/lib/city";
import { loader } from "@/lib/content";

/** Stagger a stroke's drawing window: it draws while progress runs from `start` to `start + span`. */
const draw = (start: number, span = 0.14) =>
  ({ "--s": start.toFixed(3), "--l": span.toFixed(3) }) as CSSProperties;

/* ---------- Manhattan plan, in the city scene's own coordinates ---------- */
const coast = `M${shoreline.map(([x, z]) => `${x} ${z}`).join("L")}Z`;
const avenues = Array.from({ length: 11 }, (_, i) => -13.25 + i * 2.5);
const streets = Array.from({ length: 62 }, (_, i) => -65.05 + i * 2.15).filter((z) =>
  [-12, -6, 0, 6, 12].some((x) => onIsland(x, z)),
);

/* ---------- Skyline elevation, 1000 × 300, ground at y = 280 ---------- */
const skyline: { d: string; x: number; accent?: boolean }[] = [
  { x: 20, d: "M20 280V210H70V280M30 222h30M30 236h30M30 250h30" },
  { x: 90, d: "M90 280V168L142 180V280M100 196l32 6M100 214l32 5M100 232l32 4" },
  { x: 160, d: "M158 280V196H214V280M168 206v66M186 206v66M204 206v66" },
  { x: 240, d: "M232 280V232H268V280" },
  { x: 275, d: "M276 280V152H282V130M322 130V152H328V280M282 130h40" },
  { x: 300, d: "M284 130Q302 94 320 130M288 118Q302 88 316 118M292 106Q302 82 312 106M302 82V28", accent: true },
  { x: 340, d: "M344 280V186H396V280M354 196h32M354 212h32M354 228h32" },
  { x: 420, d: "M418 280V200H433V152H443V112H453V82H461V56H477V82H485V112H495V152H505V200H520V280" },
  { x: 470, d: "M469 56V8M428 214h84M438 164h64M448 124h44", accent: true },
  { x: 560, d: "M552 280V222H610V280M562 232v40M580 232v40M598 232v40" },
  { x: 630, d: "M626 280V178H664V280" },
  { x: 680, d: "M672 280V240L688 60H716L732 240V280M672 240L716 60M732 240L688 60" },
  { x: 702, d: "M702 60V4", accent: true },
  { x: 760, d: "M748 280V208H786V280" },
  { x: 810, d: "M790 244H1000M790 250H1000" },
  { x: 840, d: "M832 280V150H852V280M836 238V204Q842 190 848 204V238M836 190V168Q842 158 848 168V190" },
  { x: 900, d: "M842 150Q902 236 962 150M790 238Q818 204 842 150M962 150Q988 204 1000 228", accent: true },
  { x: 930, d: "M862 181V244M882 202V244M902 208V244M922 202V244M942 181V244" },
  { x: 960, d: "M952 280V150H972V280M956 238V204Q962 190 968 204V238M956 190V168Q962 158 968 168V190" },
];

/**
 * The loading screen: a New York blueprint. The Manhattan grid drafts itself street by
 * street, then the skyline elevation is drawn left to right, all from real load progress.
 * When the city is ready the lines flash amber and the sheet lifts away.
 */
export default function BlueprintLoader() {
  const [loaded, setLoaded] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  // Progress survives re-renders, so the drawing never runs backwards when loading completes.
  const shown = useRef(0);

  useEffect(() => {
    const finish = () => setLoaded(true);
    if (cityJourney.ready) finish();
    window.addEventListener(CITY_READY_EVENT, finish, { once: true });
    return () => window.removeEventListener(CITY_READY_EVENT, finish);
  }, []);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // Before the 3D chunk reports progress, creep so the first streets appear straight away.
      const waiting = Math.min(0.28, (now - start) / 9000);
      const target = loaded ? 1 : Math.min(0.96, Math.max(waiting, 0.08 + cityJourney.load * 0.88));
      // Once loaded, finish the drawing briskly rather than cutting to the end.
      const ease = loaded ? 0.1 : 0.07;
      const next = reduced ? target : shown.current + (target - shown.current) * ease;
      shown.current = Math.max(shown.current, next);
      root.current?.style.setProperty("--p", shown.current.toFixed(4));
      if (percent.current)
        percent.current.textContent = String(Math.round(shown.current * 100)).padStart(3, "0");
      if (loaded && shown.current > 0.995) {
        root.current?.style.setProperty("--p", "1");
        if (percent.current) percent.current.textContent = "100";
        setDrawn(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loaded]);

  useEffect(() => {
    if (!drawn) return;
    window.dispatchEvent(new Event(BLUEPRINT_DRAWN_EVENT));
    const timeout = setTimeout(() => setGone(true), 1900);
    return () => clearTimeout(timeout);
  }, [drawn]);

  if (gone) return null;
  return (
    <div ref={root} className={`blueprint-loader ${drawn ? "is-done" : ""}`}>
      <div className="bp-grid" aria-hidden="true" />

      {/* Plan: Manhattan, drafted downtown to uptown */}
      <svg className="bp-plan" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <clipPath id="bp-island">
            <path d={coast} />
          </clipPath>
        </defs>
        <g transform="translate(700 280) rotate(76) scale(8) translate(0.5 3.5)">
          <g clipPath="url(#bp-island)">
            {avenues.map((x, i) => (
              <path key={`a${x}`} d={`M${x} 64V-70`} pathLength={1} className="bp-line is-fine" style={draw(0.02 + i * 0.012, 0.3)} />
            ))}
            {streets.map((z, i) => (
              <path
                key={`s${z}`}
                d={`M-14 ${z}H14`}
                pathLength={1}
                className="bp-line is-fine"
                style={draw(0.04 + ((streets.length - i) / streets.length) * 0.34, 0.1)}
              />
            ))}
            <path d="M-1.7 -39h8.8v25h-8.8z" pathLength={1} className="bp-line" style={draw(0.3, 0.16)} />
            <ellipse cx={2.7} cy={-31} rx={2.1} ry={2.8} pathLength={1} className="bp-line is-fine" style={draw(0.38, 0.12)} />
          </g>
          <path d={coast} pathLength={1} className="bp-line is-strong" style={draw(0, 0.42)} />
          <path
            d="M-8 53C-6.5 40-4.5 14-3 1S2-40 4-58"
            pathLength={1}
            className="bp-line is-accent"
            style={draw(0.34, 0.24)}
          />
        </g>
      </svg>

      {/* Elevation: the skyline, drawn left to right */}
      <div className="bp-elevation" aria-hidden="true">
        <svg viewBox="0 0 1000 300">
          <path d="M0 280H1000" pathLength={1} className="bp-line is-strong" style={draw(0.12, 0.3)} />
          <path d="M0 288H1000" className="bp-hatch" />
          {skyline.map((b, i) => (
            <path
              key={i}
              d={b.d}
              pathLength={1}
              className={`bp-line ${b.accent ? "is-accent" : ""}`}
              style={draw(0.22 + (b.x / 1000) * 0.62, 0.16)}
            />
          ))}
          <g className="bp-dimension" style={draw(0.78, 0.12)}>
            <path d="M544 8V280M536 8H552M536 280H552" pathLength={1} className="bp-line is-fine" />
            <text x={560} y={150} transform="rotate(-90 560 150)">1,454 FT</text>
          </g>
          <line className="bp-cursor" x1="0" y1="0" x2="0" y2="300" />
        </svg>
      </div>

      <p className="bp-sheet-label" aria-hidden="true">
        Manhattan
        <span>Plan and elevation</span>
      </p>

      {/* The architect's title block, with live status */}
      <div className="bp-title-block">
        <p className="bp-title">ELXR Creative</p>
        <dl>
          <div>
            <dt>Project</dt>
            <dd>New York, NY</dd>
          </div>
          <div>
            <dt>Sheet</dt>
            <dd>A-01</dd>
          </div>
          <div>
            <dt>Scale</dt>
            <dd>1:1000</dd>
          </div>
          <div className="bp-status-row">
            <dt>Status</dt>
            <dd>
              <span role="status" aria-live="polite">
                {loaded ? loader.served : loader.pouring}
              </span>
              <span className="bp-percent" aria-hidden="true">
                <span ref={percent}>000</span>%
              </span>
            </dd>
          </div>
        </dl>
        <span className="bp-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
