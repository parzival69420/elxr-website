import type Lenis from "lenis";

/** The page's one Lenis instance, set by <SmoothScroll />. Null before mount, and on
 *  reduced motion, where scrolling stays native. */
let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}
export function getLenis() {
  return instance;
}

/** Scroll to an element or a pixel offset. Eased through Lenis when it's running;
 *  otherwise a native jump or smooth scroll. */
export function scrollToTarget(
  target: HTMLElement | number | null | undefined,
  { immediate = false }: { immediate?: boolean } = {},
) {
  if (target == null) return;
  if (instance) {
    instance.scrollTo(target, { immediate, duration: 1.6 });
    return;
  }
  const behavior = immediate ? "instant" : "smooth";
  if (typeof target === "number") window.scrollTo({ top: target, behavior });
  else target.scrollIntoView({ behavior, block: "start" });
}
