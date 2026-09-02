/**
 * Single shared scroll-progress value driving the hero pour AND the city
 * liquid spread (section 5 of CLAUDE.md). GSAP ScrollTrigger writes it;
 * the R3F frame loop and DOM fallbacks read it. A mutable ref avoids
 * re-rendering React on every scroll frame.
 */
export const pourProgress = { value: 0 };
