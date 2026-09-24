"use client";

import type { PointerEvent } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { about } from "@/lib/content";

const pass = about.founder;

/**
 * A lanyard pass for the founder: a cream laminated card on an amber strap, in the same
 * spec-sheet language as the bento cards. It hangs from the top of its column and swings
 * toward the pointer, like a pass on a hook.
 */
export default function FounderBadge() {
  const reduced = useReducedMotion();
  const swing = useSpring(0, { stiffness: 120, damping: 9, mass: 0.8 });
  const lean = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    swing.set(((event.clientX - box.left) / box.width - 0.5) * -9);
  };
  return (
    <div className="founder-pass" onPointerMove={lean} onPointerLeave={() => swing.set(0)}>
      <motion.div className="founder-pass-swing" style={{ rotate: swing }}>
        <span className="founder-pass-strap" aria-hidden="true">
          <span className="founder-pass-clip" />
        </span>
        <article className="founder-pass-card" aria-label={`${pass.role}: ${pass.name}`}>
          <span className="founder-pass-slot" aria-hidden="true" />
          <header className="founder-pass-head">
            <p>
              <span>{pass.name}</span>
              <span>{pass.role}</span>
            </p>
            <p className="founder-pass-coords">{pass.coordinates}</p>
          </header>
          <div className="founder-pass-photo">
            {pass.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pass.photo} alt={pass.name} />
            ) : (
              <span className="founder-pass-monogram" aria-hidden="true">
                {pass.initials}
              </span>
            )}
          </div>
          <div className="founder-pass-brand">
            <p>
              {pass.based.map((place) => (
                <span key={place}>{place}</span>
              ))}
            </p>
            <p className="founder-pass-wordmark" aria-hidden="true">
              ELXR
            </p>
          </div>
          <div className="founder-pass-tiles">
            <div className="founder-pass-bio">
              <p>{pass.bio}</p>
              <span className="bento-barcode" aria-hidden="true" />
              <p className="founder-pass-title">
                {pass.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
            </div>
            <div className="founder-pass-tenure">
              <p className="founder-pass-label">{pass.tenureLabel}</p>
              <p className="founder-pass-years">{pass.tenure}</p>
              <p className="founder-pass-method">{pass.method}</p>
            </div>
          </div>
          <span className="founder-pass-x" aria-hidden="true">
            X
          </span>
        </article>
      </motion.div>
    </div>
  );
}
