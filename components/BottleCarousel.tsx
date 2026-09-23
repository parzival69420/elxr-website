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
import { useReducedMotion } from "framer-motion";
import { bottles, servicesIntro } from "@/lib/content";
import { bottleColors as colors } from "@/lib/bottles";

const BottleStage = dynamic(() => import("./bottles/BottleStage"), {
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

export default function BottleCarousel() {
  const [active, setActive] = useState(1);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduced = !!useReducedMotion();
  const region = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const gesture = useRef({ x: 0, startRotation: 0, down: false, moved: false });
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const select = useCallback((index: number) => {
    setActive(index);
    setOpen(false);
    rotation.current = 0;
  }, []);
  useEffect(() => {
    const mq = matchMedia("(max-width: 700px)");
    const resize = () => setMobile(mq.matches);
    resize();
    mq.addEventListener("change", resize);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "180px" },
    );
    if (region.current) observer.observe(region.current);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", resize);
    };
  }, []);
  const bottle = bottles[active];
  return (
    <div
      className="bottle-showcase"
      style={{ "--formula-color": colors[active] } as CSSProperties}
    >
      <div
        className={`bottle-stage ${failed ? "is-failed" : ""}`}
        ref={region}
        data-active-formula={active + 1}
        data-open={open}
        data-ready={ready}
      >
        <div className="bottle-stage-meta">
          <span>{servicesIntro.collection}</span>
          <span>0{active + 1} / 06</span>
        </div>
        <div
          className="bottle-canvas"
          role="group"
          aria-label={`${bottle.name} 3D bottle. Drag to rotate. Arrow keys rotate, Enter opens, Home resets.`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              rotation.current += event.key === "ArrowLeft" ? -0.3 : 0.3;
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((value) => !value);
            } else if (event.key === "Home") {
              event.preventDefault();
              rotation.current = 0;
            } else if (event.key === "Escape") setOpen(false);
          }}
          onPointerDown={(event) => {
            gesture.current = {
              x: event.clientX,
              startRotation: rotation.current,
              down: true,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            if (!gesture.current.down) return;
            const distance = event.clientX - gesture.current.x;
            if (Math.abs(distance) > 6) gesture.current.moved = true;
            if (gesture.current.moved)
              rotation.current =
                gesture.current.startRotation + distance * 0.012;
          }}
          onPointerUp={() => {
            gesture.current.down = false;
          }}
          onPointerCancel={() => {
            gesture.current.down = false;
          }}
          onPointerLeave={() => {
            gesture.current.down = false;
            setHovered(null);
          }}
        >
          {mounted && !failed && (
            <SceneBoundary onFailure={onFailure}>
              <BottleStage
                active={active}
                open={open}
                hovered={hovered}
                rotation={rotation}
                reduced={reduced}
                mobile={mobile}
                inView={inView}
                onReady={onReady}
                onFailure={onFailure}
                onHover={setHovered}
                onSelect={(index) => {
                  if (gesture.current.moved) return;
                  if (index === active) setOpen((value) => !value);
                  else select(index);
                }}
              />
            </SceneBoundary>
          )}
          {(!ready || failed) && (
            <div className="bottle-loading" role="status">
              {!failed && (
                <span className="bottle-loading-orbit" aria-hidden="true" />
              )}
              <p>{failed ? servicesIntro.fallback : servicesIntro.loading}</p>
              {failed && (
                <button
                  className="formula-open"
                  type="button"
                  onClick={() => {
                    setReady(false);
                    setFailed(false);
                  }}
                >
                  {servicesIntro.retry}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="bottle-stage-controls">
          <button
            type="button"
            aria-label="Previous bottle"
            onClick={() =>
              select((active + bottles.length - 1) % bottles.length)
            }
          >
            ←
          </button>
          <p>
            {servicesIntro.dragCue}
            <span>{servicesIntro.hoverCue}</span>
          </p>
          <button
            type="button"
            aria-label="Next bottle"
            onClick={() => select((active + 1) % bottles.length)}
          >
            →
          </button>
        </div>
      </div>
      <div
        className="bottle-formulas"
        role="tablist"
        aria-label="Choose a service formula"
      >
        {bottles.map((item, index) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            id={`formula-tab-${index}`}
            aria-controls="formula-panel"
            aria-selected={index === active}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % bottles.length;
              else if (event.key === "ArrowLeft")
                next = (index + bottles.length - 1) % bottles.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = bottles.length - 1;
              else return;
              event.preventDefault();
              select(next);
              document.getElementById(`formula-tab-${next}`)?.focus();
            }}
          >
            <span className="formula-number" style={{ color: colors[index] }}>
              0{index + 1}
            </span>
            <span>{item.name}</span>
            <span
              className="formula-dot"
              style={{ background: colors[index] }}
            />
          </button>
        ))}
      </div>
      <div
        id="formula-panel"
        className="formula-panel"
        role="tabpanel"
        aria-labelledby={`formula-tab-${active}`}
      >
        <div className="formula-title">
          <p className="section-kicker">{bottle.tagline}</p>
          <h3>{bottle.name}</h3>
        </div>
        <div className="formula-description">
          <p>{bottle.oneLiner}</p>
          <div className="formula-actions">
            <button
              type="button"
              className="formula-open"
              aria-expanded={open}
              aria-controls="formula-ingredients"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? servicesIntro.close : servicesIntro.open}
              <span aria-hidden="true">{open ? "−" : "+"}</span>
            </button>
            <a
              href={`#detail-${bottle.id}`}
              onClick={() => {
                const detail = document.getElementById(`detail-${bottle.id}`);
                if (detail instanceof HTMLDetailsElement) detail.open = true;
              }}
            >
              {servicesIntro.details} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
      <div
        id="formula-ingredients"
        hidden={!open}
        className="formula-ingredients"
      >
        <p className="section-kicker">{servicesIntro.inside}</p>
        <ul>
          {bottle.whatsInside.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a href={bottle.cta.href}>{bottle.cta.label}</a>
      </div>
    </div>
  );
}
