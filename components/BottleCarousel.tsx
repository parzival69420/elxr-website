"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { bottles, servicesIntro } from "@/lib/content";
import BottleSVG from "./BottleSVG";

/**
 * Horizontal drag carousel (Framer Motion) with full keyboard support:
 * arrow keys move the selection, Enter/Space opens a bottle into its
 * service detail panel. Under prefers-reduced-motion it degrades to a
 * scroll-snap list. Full service content also lives in the static
 * ServiceDetails section, so nothing here is the only copy of anything.
 */
export default function BottleCarousel() {
  // Bottle 1 (Attention Engineering) is the hero bottle, centered by default.
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const regionRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((a) => Math.min(bottles.length - 1, a + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((o) => (o === active ? null : active));
    } else if (e.key === "Escape") {
      setOpen(null);
    }
  };

  const openBottle = bottles[open ?? -1];

  if (reduced) {
    /* Reduced motion: a plain scroll-snap list, no drag, no spring. */
    return (
      <div className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 py-8">
        {bottles.map((b) => (
          <a
            key={b.id}
            href={`#detail-${b.id}`}
            className="glass flex w-64 shrink-0 snap-center flex-col items-center gap-4 p-8"
          >
            <BottleSVG id={`rm-${b.id}`} color={b.liquidColor} className="h-40 w-auto" />
            <span className="text-lg font-bold">{b.name}</span>
            <span className="text-center text-sm text-lavender">{b.tagline}</span>
          </a>
        ))}
      </div>
    );
  }

  const SPACING = 260;

  return (
    <div>
      <div
        ref={regionRef}
        role="listbox"
        aria-label="Services — the six bottles"
        aria-activedescendant={`bottle-${bottles[active].id}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative h-[26rem] select-none overflow-hidden outline-offset-8"
      >
        <motion.div
          className="absolute left-1/2 top-8 flex cursor-grab items-start active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            const delta = Math.round(-info.offset.x / SPACING);
            setActive((a) => Math.max(0, Math.min(bottles.length - 1, a + delta)));
          }}
          animate={{ x: -active * SPACING }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {bottles.map((b, i) => {
            const isActive = i === active;
            return (
              <motion.button
                key={b.id}
                id={`bottle-${b.id}`}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  if (i === active) setOpen(open === i ? null : i);
                  else setActive(i);
                }}
                className="group flex w-[260px] shrink-0 flex-col items-center gap-3 px-6 focus-visible:outline-none"
                animate={{
                  scale: isActive ? 1 : 0.72,
                  opacity: isActive ? 1 : 0.45,
                  y: isActive ? 0 : 28,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                style={{ marginLeft: i === 0 ? -130 : 0 }}
                tabIndex={-1}
              >
                <BottleSVG
                  id={b.id}
                  color={b.liquidColor}
                  fill={isActive ? 0.78 : 0.6}
                  className="h-56 w-auto drop-shadow-[0_0_40px_rgba(112,56,224,0.25)]"
                />
                <span className="text-lg font-bold">{b.name}</span>
                <span className="text-center text-sm font-medium text-lavender">
                  {b.tagline}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-butter opacity-0 transition-opacity group-hover:opacity-100">
                  {isActive ? servicesIntro.hoverCue : ""}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* prev / next + drag cue */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setActive((a) => Math.max(0, a - 1))}
          disabled={active === 0}
          aria-label="Previous bottle"
          className="glass flex h-11 w-11 items-center justify-center text-lg text-lavender disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-text/50">
          {servicesIntro.dragCue}
        </span>
        <button
          onClick={() => setActive((a) => Math.min(bottles.length - 1, a + 1))}
          disabled={active === bottles.length - 1}
          aria-label="Next bottle"
          className="glass flex h-11 w-11 items-center justify-center text-lg text-lavender disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* the open interaction — a bottle expands into its detail panel */}
      <AnimatePresence>
        {openBottle && (
          <motion.div
            key={openBottle.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 w-[min(60rem,calc(100%-2rem))] overflow-hidden"
          >
            <div className="glass p-8 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row">
                <BottleSVG
                  id={`open-${openBottle.id}`}
                  color={openBottle.liquidColor}
                  fill={0.85}
                  className="mx-auto h-48 w-auto shrink-0 md:mx-0"
                />
                <div>
                  <h3 className="text-3xl font-black">{openBottle.name}</h3>
                  <p className="mt-1 text-lg font-bold text-lavender">
                    {openBottle.tagline}
                  </p>
                  <p className="mt-4 leading-relaxed text-text/80">
                    {openBottle.oneLiner}
                  </p>
                  {openBottle.bodyCopy?.map((p, i) => (
                    <p key={i} className="mt-3 leading-relaxed text-text/80">
                      {p}
                    </p>
                  ))}
                  <h4 className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-butter">
                    What&apos;s inside
                  </h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {openBottle.whatsInside.map((w) => (
                      <li
                        key={w}
                        className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-text/80"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {openBottle.proof.length > 0 && (
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {openBottle.proof.map((p, i) => (
                    <blockquote key={i} className="border-l-2 border-purple pl-5">
                      <p className="text-sm leading-relaxed text-text/75">{p.body}</p>
                      <p className="mt-3 text-sm font-bold text-lavender">{p.stat}</p>
                    </blockquote>
                  ))}
                </div>
              )}

              <a
                href={openBottle.cta.href}
                className="mt-10 inline-block rounded-full bg-purple px-7 py-3 font-bold transition-transform hover:scale-105"
              >
                {openBottle.cta.label}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
