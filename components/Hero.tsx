"use client";

import "@/lib/rafFallback";
import { scrollToTarget } from "@/lib/smoothScroll";
import {
  Component,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { hero } from "@/lib/content";
import {
  BLUEPRINT_DRAWN_EVENT,
  cityJourney,
  signalCityReady,
} from "@/lib/city";
import ManhattanMap from "./city/ManhattanMap";
import BlueprintLoader from "./BlueprintLoader";

const CityCanvas = dynamic(() => import("./city/CityCanvas"), { ssr: false });
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<{
    mobile: boolean;
    reduced: boolean;
  } | null>(null);
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(true);
  const [revealed, setRevealed] = useState(false);
  // The 3D build waits for the 2D blueprint sheet to finish drawing, then takes over from it.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const onDrawn = () => setDrawn(true);
    window.addEventListener(BLUEPRINT_DRAWN_EVENT, onDrawn, { once: true });
    return () => window.removeEventListener(BLUEPRINT_DRAWN_EVENT, onDrawn);
  }, []);
  const reduced = settings?.reduced ?? false;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setAvailable(false);
    setReady(true);
    signalCityReady();
  }, []);

  // Moves the camera along the map → skyline path and syncs the overlay copy to it.
  const setJourney = useCallback((p: number) => {
    cityJourney.progress = p;
    const view = viewport.current;
    if (!view) return;
    view.style.setProperty("--skyline-opacity", String(Math.min(1, Math.max(0, (p - 0.59) / 0.2))));
    view.dataset.stage = p > 0.66 ? "skyline" : p > 0.12 ? "descent" : "map";
    setStage(p > 0.66 ? 2 : p > 0.12 ? 1 : 0);
  }, []);

  // The blueprint sheet is the loading screen. Once it has drawn and the scene is ready, the
  // 3D wireframe extrudes out of the plan and is printed into the city, the camera flies to
  // the skyline, and only then does the page chrome arrive.
  useEffect(() => {
    if (!ready || !drawn) return;
    const finish = () => {
      cityJourney.reveal = 1;
      setJourney(1);
      setRevealed(true);
    };
    if (!available || reduced) {
      finish();
      return;
    }
    // Linear here: the camera rig eases every move itself (city/CityCanvas).
    const flight = { p: cityJourney.progress };
    const timeline = gsap
      .timeline({ paused: true })
      // A beat while the sheet lifts, then the blueprint extrudes and is printed (city/Blueprint).
      .to(cityJourney, { reveal: 1, duration: 4.6, ease: "none" }, 0.9)
      // The flight to the skyline starts while the last towers print, so the move never stops.
      .to(flight, { p: 1, duration: 3.6, ease: "none", onUpdate: () => setJourney(flight.p) }, 3.7);
    // The 3D render loop steps the timeline, one step per rendered frame.
    let done = false;
    cityJourney.intro = {
      advance: (seconds) => {
        if (done) return;
        timeline.time(timeline.time() + seconds);
        if (timeline.progress() >= 1) {
          done = true;
          cityJourney.intro = null;
          finish();
        }
      },
    };
    return () => {
      cityJourney.intro = null;
      timeline.kill();
    };
  }, [ready, drawn, available, reduced, setJourney]);
  useEffect(() => {
    if (revealed) delete document.documentElement.dataset.cityLoading;
  }, [revealed]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setSettings({ mobile: mobile.matches, reduced: reduced.matches });
    };
    update();
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) onFailure();
    else context.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, [onFailure]);

  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(onFailure, 12000);
    return () => clearTimeout(timeout);
  }, [ready, onFailure]);

  useEffect(() => {
    if (!section.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      id="top"
      className="city-journey"
      aria-label="ELXR's New York"
    >
      <div
        ref={viewport}
        className={`city-viewport ${ready ? "is-ready" : ""} ${!available ? "scene-fallback" : ""} ${revealed ? "is-revealed" : ""}`}
        data-stage="map"
        style={{ "--skyline-opacity": 0 } as CSSProperties}
      >
        <div className="city-map-fallback">
          <ManhattanMap />
        </div>
        {settings && available && (
          <div className={`city-live-scene ${ready ? "is-visible" : ""}`}>
            <SceneBoundary onFailure={onFailure}>
              <CityCanvas
                mobile={settings.mobile}
                reduced={reduced}
                // Keep rendering until the intro has landed: it is stepped by the render loop.
                active={inView || !revealed}
                onReady={onReady}
                onFailure={onFailure}
              />
            </SceneBoundary>
          </div>
        )}
        {!available && (
          <p className="city-webgl-note">
            The 3D city needs WebGL. Everything else on this page works
            without it.
          </p>
        )}
        <h1 className="sr-only">
          {hero.headline} {hero.subline}
        </h1>
        <div className="city-vignette" aria-hidden="true" />

        <div className="city-skyline-copy" aria-hidden={stage !== 2}>
          <h2>
            {hero.headlineLead}
            <br />
            <em>{hero.headlineEmphasis}</em>
          </h2>
          <p className="city-subline">{hero.subline}</p>
          <div className="hero-ctas">
            <a
              href={hero.primaryCta.href}
              className="btn-primary"
              tabIndex={stage === 2 ? 0 : -1}
            >
              {hero.primaryCta.label}
            </a>
          </div>
        </div>


        <div className="city-footer-bar">
          <button
            className="city-scroll-button"
            onClick={() =>
              scrollToTarget(document.getElementById("thesis"), { immediate: reduced })
            }
          >
            <span>{hero.nextCue}</span>
            <span className="scroll-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
        </div>
        <BlueprintLoader />
      </div>
    </section>
  );
}
