"use client";

import "@/lib/rafFallback";
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero } from "@/lib/content";
import {
  cityJourney,
  signalCityReady,
  type CityCommand,
  type CityAction,
} from "@/lib/city";
import ManhattanMap from "./city/ManhattanMap";
import Loader from "./Loader";

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
  const [exploring, setExploring] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [command, setCommand] = useState<CityCommand>({
    id: 0,
    action: "reset",
  });
  const onExplore = useCallback(() => {
    setExploring(true);
    const hero = section.current;
    if (hero)
      window.scrollTo({
        top:
          hero.getBoundingClientRect().top +
          window.scrollY +
          (hero.offsetHeight - window.innerHeight) * 0.92,
        behavior: "instant",
      });
  }, []);
  const onCameraChange = useCallback((position: string) => {
    if (viewport.current) viewport.current.dataset.camera = position;
  }, []);
  const issueCommand = (action: CityAction) => {
    if (action === "reset") setExploring(false);
    else onExplore();
    setCommand((previous) => ({ id: previous.id + 1, action }));
  };
  useEffect(() => {
    if (stage !== 2) setExploring(false);
  }, [stage]);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const reduced = motionOverride ?? settings?.reduced ?? false;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setAvailable(false);
    setReady(true);
    signalCityReady();
  }, []);

  // Once the scene is ready, the flat map rises into the city; only then does any copy appear.
  useEffect(() => {
    if (!ready) return;
    const finish = () => {
      cityJourney.reveal = 1;
      setRevealed(true);
    };
    if (!available || reduced) {
      finish();
      return;
    }
    const tween = gsap.to(cityJourney, {
      reveal: 1,
      duration: 2.6,
      delay: 0.9,
      ease: "none",
      onComplete: finish,
    });
    return () => {
      tween.kill();
    };
  }, [ready, available, reduced]);
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

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const update = (p: number) => {
      cityJourney.progress = p;
      const view = viewport.current;
      if (!view) return;
      const mapOpacity = 1 - Math.min(1, p / 0.25);
      const skylineOpacity = Math.min(1, Math.max(0, (p - 0.59) / 0.2));
      view.style.setProperty("--map-opacity", String(mapOpacity));
      view.style.setProperty("--skyline-opacity", String(skylineOpacity));
      view.style.setProperty("--journey-progress", `${p * 100}%`);
      view.dataset.stage = p > 0.66 ? "skyline" : p > 0.12 ? "descent" : "map";
      setStage(p > 0.66 ? 2 : p > 0.12 ? 1 : 0);
    };
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => {
      trigger.kill();
      cityJourney.progress = 0;
    };
  }, []);

  const travelTo = (progress: number) => {
    if (!section.current) return;
    const top = section.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (section.current.offsetHeight - window.innerHeight) * progress,
      behavior: reduced ? "instant" : "smooth",
    });
  };

  return (
    <section
      ref={section}
      id="top"
      className="city-journey"
      aria-label="Explore ELXR's New York"
    >
      <div
        ref={viewport}
        className={`city-viewport ${ready ? "is-ready" : ""} ${!available ? "scene-fallback" : ""} ${exploring ? "is-exploring" : ""} ${revealed ? "is-revealed" : ""}`}
        data-stage="map"
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
                active={inView}
                interactive={stage === 2}
                exploring={exploring}
                command={command}
                onExplore={onExplore}
                onCameraChange={onCameraChange}
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

        <div className="city-topline">
          <button
            className="motion-toggle"
            aria-pressed={!reduced}
            onClick={() => {
              setMotionOverride(!reduced);
              setReady(true);
              signalCityReady();
            }}
            aria-label={reduced ? "Enable full motion" : "Reduce motion"}
          >
            MOTION {reduced ? "OFF" : "ON"}
            <span className="signal-dot" />
          </button>
        </div>

        <div className="city-intro" aria-hidden={stage !== 0}>
          <p className="city-intro-kicker">{hero.intro.kicker}</p>
          <p className="city-intro-title">{hero.intro.title}</p>
          <p className="city-intro-caption">{hero.intro.caption}</p>
          <div className="hero-ctas">
            <a
              href={hero.primaryCta.href}
              className="btn-primary"
              tabIndex={stage === 0 ? 0 : -1}
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="btn-secondary"
              tabIndex={stage === 0 ? 0 : -1}
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>
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
            {available && (
              <button
                onClick={onExplore}
                tabIndex={stage === 2 ? 0 : -1}
                className="btn-secondary"
              >
                {hero.exploreCta}
              </button>
            )}
          </div>
        </div>

        {stage === 2 && available && exploring && (
          <>
            <div
              className="city-interaction-tools"
              aria-label="3D city controls"
            >
              <p className="city-drag-hint">
                Drag to look around.
              </p>
              <div className="city-tool-row">
                <div className="city-camera-buttons">
                  <button
                    aria-label="Rotate city left"
                    onClick={() => issueCommand("left")}
                  >
                    ←
                  </button>
                  <button
                    aria-label="Rotate city right"
                    onClick={() => issueCommand("right")}
                  >
                    →
                  </button>
                  <button
                    aria-label="Zoom in"
                    onClick={() => issueCommand("zoom-in")}
                  >
                    +
                  </button>
                  <button
                    aria-label="Zoom out"
                    onClick={() => issueCommand("zoom-out")}
                  >
                    −
                  </button>
                  <button
                    className="city-reset"
                    onClick={() => issueCommand("reset")}
                  >
                    Done exploring
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="journey-controls" aria-label="City viewpoints">
          <button
            onClick={() => travelTo(0)}
            aria-label="View Manhattan map"
            aria-pressed={stage === 0}
          >
            <span className={stage === 0 ? "active" : ""} />{" "}
            <span className="viewpoint-label">MAP</span>
          </button>
          <div className="journey-track">
            <i />
          </div>
          <button
            onClick={() => travelTo(0.94)}
            aria-label="View Times Square skyline"
            aria-pressed={stage === 2}
          >
            <span className={stage === 2 ? "active" : ""} />{" "}
            <span className="viewpoint-label">CITY</span>
          </button>
        </div>

        <div className="city-footer-bar">
          <button
            className="city-scroll-button"
            onClick={() =>
              stage === 2
                ? document.getElementById("thesis")?.scrollIntoView({
                    behavior: reduced ? "instant" : "smooth",
                  })
                : travelTo(0.94)
            }
          >
            <span>{stage === 2 ? hero.nextCue : hero.scrollCue}</span>
            <span className="scroll-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
        </div>
        <Loader />
      </div>
    </section>
  );
}
