export const MAP_ROTATION = -1.46;
export const MAP_CENTER = { x: -2, z: -4 };
export function mapViewHeight(aspect: number) {
  return aspect < 1 ? 48 : 56 / aspect;
}

/** Shared camera state, read every frame without re-rendering React.
 *  `load`     0 → 1 as the city's models download (drives the loading screen).
 *  `reveal`   0 → 1 once the scene is ready: the flat map rises into the city.
 *  `progress` 0 → 1 right after: the camera flies from the map to the skyline. */
export const cityJourney = {
  progress: 0,
  ready: false,
  reveal: 0,
  load: 0,
  /** The intro sequence, stepped by the 3D render loop so every rendered frame gets exactly
   *  one camera update (a separate animation clock drifts against it and reads as jitter). */
  intro: null as null | { advance: (seconds: number) => void },
};
/** The loading map is framed tighter than the first scroll position; the reveal pulls back. */
export const LOAD_ZOOM = 1.35;
export const CITY_READY_EVENT = "elxr:city-ready";
/** The 2D blueprint sheet has finished drawing: the 3D wireframe takes over from here. */
export const BLUEPRINT_DRAWN_EVENT = "elxr:blueprint-drawn";

export function signalCityReady() {
  cityJourney.ready = true;
  window.dispatchEvent(new Event(CITY_READY_EVENT));
}

/** A stylized Manhattan shoreline, in avenue-aligned scene coordinates. */
export const shoreline: [number, number][] = [
  [-3, 62],
  [-7, 54],
  [-10, 39],
  [-12, 24],
  [-13, 8],
  [-13, -12],
  [-12, -33],
  [-9, -51],
  [-7, -63],
  [-2, -69],
  [3, -68],
  [7, -59],
  [9, -42],
  [11, -26],
  [12, -7],
  [11, 14],
  [9, 31],
  [5, 47],
  [1, 57],
];

export function onIsland(x: number, z: number) {
  let inside = false;
  for (let i = 0, j = shoreline.length - 1; i < shoreline.length; j = i++) {
    const [xi, zi] = shoreline[i];
    const [xj, zj] = shoreline[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)
      inside = !inside;
  }
  return inside;
}

export function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

