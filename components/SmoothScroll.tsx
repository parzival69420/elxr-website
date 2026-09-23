"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/smoothScroll";

/**
 * Inertial page scroll. Wheel and trackpad input glides to rest instead of
 * stepping, and every scroll-driven scene (the city flight, the bottle menu)
 * reads that eased position, so they move with it. Lenis runs on GSAP's
 * ticker so ScrollTrigger and the scroll update in the same frame.
 * Touch keeps native momentum; reduced motion keeps native scroll.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      autoRaf: false,
      // The city's explore mode uses the wheel to zoom; leave it alone there.
      prevent: (node) => !!node.closest?.(".city-viewport.is-exploring"),
    });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // In-page links glide instead of jumping. `force` lets the open nav menu
    // (which pauses scrolling) still send the page to its target as it closes.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash) return;
      const target = hash === "#" ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
      if (hash !== "#top" && !target) return;
      event.preventDefault();
      lenis.scrollTo(hash === "#top" ? 0 : target!, { duration: 1.6, force: true });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);
    // Depth between sections: each oversized ghost word drifts slower than the page.
    const drift = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".theme-split > .ghost-word").forEach((word) => {
        gsap.fromTo(
          word,
          { y: 70 },
          {
            y: -70,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: word.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    });
    return () => {
      drift.revert();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
