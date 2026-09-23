"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { bottles, servicesIntro } from "@/lib/content";
import { scrollToTarget } from "@/lib/smoothScroll";
import { bottleColors } from "@/lib/bottles";
import {
  bottleJourney,
  sceneFromScroll,
  scrollFromScene,
  SCENE_COUNT,
  SCENE_LENGTH,
} from "./bottles/journey";

const BottleScenesCanvas = dynamic(() => import("./bottles/BottleScenesCanvas"), {
  ssr: false,
});

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

const strip = (label: string) => label.replace(/\s*→\s*$/, "");

/** Open a service's full detail disclosure below, then bring it into view. */
function openDetail(id: string) {
  const detail = document.getElementById(`detail-${id}`) as HTMLDetailsElement | null;
  if (!detail) return;
  detail.open = true;
  scrollToTarget(detail);
}

/**
 * The menu: one full screen per bottle. The stage (split panels, ghost name, ring, 3D bottle)
 * stays pinned while the page scrolls through the six formulas. Without JavaScript the
 * scenes are plain stacked panels, and all copy is in the DOM either way.
 */
export default function BottleScenes() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({ mobile: false, reduced: false });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const mobile = matchMedia("(max-width: 760px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSettings({ mobile: mobile.matches, reduced: reduced.matches });
    update();
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "300px" },
    );
    if (track.current) observer.observe(track.current);
    // Build the bottle scene in the background once the hero's reveal flight has landed,
    // so its model parsing and shader compiles never stall a scroll or the flight itself.
    let idle = 0;
    const html = document.documentElement;
    const warm = () => {
      if ("cityLoading" in html.dataset) return;
      loading.disconnect();
      const schedule =
        window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
      idle = schedule(() => setMounted(true), { timeout: 3000 }) as number;
    };
    const loading = new MutationObserver(warm);
    loading.observe(html, { attributes: true, attributeFilter: ["data-city-loading"] });
    warm();
    return () => {
      loading.disconnect();
      window.cancelIdleCallback?.(idle);
      observer.disconnect();
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const view = stage.current;
    if (!track.current || !view) return;
    const ghosts = view.querySelectorAll<HTMLElement>("[data-ghost]");
    const scenes = view.querySelectorAll<HTMLElement>("[data-scene]");
    const bars = view.querySelectorAll<HTMLElement>("[data-progress]");
    const reduced = settings.reduced;
    const update = (progress: number) => {
      const total = SCENE_COUNT * SCENE_LENGTH + 1;
      const g = sceneFromScroll(progress * total);
      bottleJourney.g = g;
      const current = Math.max(0, Math.min(SCENE_COUNT - 1, Math.floor(g)));
      setActive(current);
      view.style.setProperty("--accent", bottleColors[current]);
      scenes.forEach((scene, i) => {
        let e = g - i - 0.5;
        if (reduced) e = Math.abs(e) < 0.5 ? 0 : 2;
        const shown = 1 - smoothstep(Math.abs(e), 0.2, 0.45);
        scene.style.opacity = String(shown);
        scene.style.setProperty("--e", e.toFixed(3));
        scene.style.visibility = shown < 0.02 ? "hidden" : "visible";
      });
      ghosts.forEach((ghost, i) => {
        let e = g - i - 0.5;
        if (reduced) e = Math.abs(e) < 0.5 ? 0 : 2;
        ghost.style.opacity = String(1 - smoothstep(Math.abs(e), 0.25, 0.5));
        ghost.style.setProperty("--e", e.toFixed(3));
      });
      bars.forEach((bar, i) => {
        bar.style.setProperty("--fill", String(Math.max(0, Math.min(1, g - i))));
      });
      view.style.setProperty("--ring", String(Math.min(1, Math.abs(g - current - 0.5) * 2)));
    };
    const trigger = ScrollTrigger.create({
      trigger: track.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => trigger.kill();
  }, [settings.reduced]);

  const goTo = (index: number) => {
    const el = track.current;
    if (!el) return;
    if (index >= SCENE_COUNT) {
      scrollToTarget(document.getElementById("formula-index"));
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    scrollToTarget(top + scrollFromScene(index + 0.5) * window.innerHeight, {
      immediate: settings.reduced,
    });
  };

  return (
    <section id="services" className="menu" aria-labelledby="menu-heading">
      <div
        ref={track}
        className="menu-track"
        style={{ "--scene-count": SCENE_COUNT, "--scene-length": SCENE_LENGTH } as CSSProperties}
      >
        <div
          ref={stage}
          className={`menu-stage ${ready && !failed ? "is-ready" : ""}`}
          style={{ "--accent": bottleColors[0] } as CSSProperties}
        >
          <div className="menu-panels" aria-hidden="true" />
          <header className="menu-heading">
            <h2 id="menu-heading">{servicesIntro.heading}</h2>
            <p>{servicesIntro.subline}</p>
          </header>
          <div className="menu-ghosts" aria-hidden="true">
            {bottles.map((b, i) => (
              <span key={b.id} data-ghost className="menu-ghost" style={{ opacity: i === 0 ? 1 : 0 }}>
                {b.name}
              </span>
            ))}
          </div>
          <span className="theme-ring menu-ring" aria-hidden="true" />
          <span className="menu-floor" aria-hidden="true" />
          <div className="menu-canvas">
            {mounted && !failed && (
              <SceneBoundary onFailure={onFailure}>
                <BottleScenesCanvas
                  reduced={settings.reduced}
                  mobile={settings.mobile}
                  active={inView}
                  onReady={onReady}
                  onFailure={onFailure}
                />
              </SceneBoundary>
            )}
          </div>

          {bottles.map((b, i) => {
            const proof = b.proof[0]?.stat ?? b.bodyCopy?.[0] ?? b.oneLiner;
            const special = b.id === "ai-visibility";
            return (
              <article
                key={b.id}
                data-scene
                className="menu-scene"
                aria-labelledby={`scene-${b.id}`}
                style={{ "--scene-accent": bottleColors[i] } as CSSProperties}
              >
                <p className="menu-scene-index">
                  Formula {i + 1} <span>of {SCENE_COUNT}</span>
                </p>
                <div className="menu-scene-title">
                  <h3 id={`scene-${b.id}`} className="theme-display">
                    {b.name}
                  </h3>
                  <p>{b.tagline}</p>
                </div>
                <div className="theme-tile menu-tile-left">
                  <h4>What&rsquo;s inside</h4>
                  <ul>
                    {b.whatsInside.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="theme-tile menu-tile-right">
                  <h4>{b.proof.length ? "The proof" : "Why now"}</h4>
                  <p>{proof}</p>
                  <a
                    href={`#detail-${b.id}`}
                    className="round-link"
                    onClick={(event) => {
                      event.preventDefault();
                      openDetail(b.id);
                    }}
                  >
                    <span className="sr-only">Open the full {b.name} formula</span>
                    <span aria-hidden="true">+</span>
                  </a>
                </div>
                {special ? (
                  <a href={b.cta.href} className="btn-primary menu-scene-cta">
                    {strip(b.cta.label)}
                  </a>
                ) : (
                  <a href={b.cta.href} className="cta-bar menu-scene-cta">
                    <span aria-hidden="true" />
                    {strip(b.cta.label)}
                  </a>
                )}
              </article>
            );
          })}

          <div className="menu-chrome">
            <ol className="menu-progress" aria-label="Formulas">
              {bottles.map((b, i) => (
                <li key={b.id}>
                  <button
                    type="button"
                    data-progress
                    aria-current={active === i ? "step" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="sr-only">{b.name}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="menu-next"
              onClick={() => goTo(active + 1)}
              aria-label={
                active + 1 < SCENE_COUNT ? `Next: ${bottles[active + 1].name}` : "See every formula in detail"
              }
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function smoothstep(x: number, min: number, max: number) {
  const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
  return t * t * (3 - 2 * t);
}
