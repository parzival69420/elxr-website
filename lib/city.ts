export const MAP_ROTATION = -1.46;
export const MAP_CENTER = { x: -2, z: -4 };
export function mapViewHeight(aspect: number) {
  return aspect < 1 ? 48 : 56 / aspect;
}

/** Shared camera position. Scroll updates this without rendering React each frame. */
export const cityJourney = { progress: 0, ready: false };
export const CITY_READY_EVENT = "elxr:city-ready";

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

export const landmarks = [
  {
    id: "times-square",
    label: "One Times Square",
    kicker: "THE CROSSROADS",
    description:
      "Where Broadway meets Seventh Avenue. Where your next big idea meets the world.",
    cta: "Explore our services",
    href: "#services",
    position: [-2.5, 14.6, 0] as [number, number, number],
  },
  {
    id: "empire-state",
    label: "Empire State",
    kicker: "BUILT TO STAND OUT",
    description:
      "A New York icon, reimagined in neon. We build brands with the same ambition.",
    cta: "Meet ELXR",
    href: "#about",
    position: [7.5, 22.3, 9] as [number, number, number],
  },
  {
    id: "world-trade",
    label: "World Trade Center",
    kicker: "LOWER MANHATTAN / ONE WORLD",
    description: "A faceted glass silhouette, eight triangular faces, and a needle above the downtown skyline. Select, orbit, and explore the architecture from every angle.",
    cta: "Discover our perspective",
    href: "#about",
    position: [-3, 29, 47] as [number, number, number],
  },
  {
    id: "summit",
    label: "SUMMIT",
    kicker: "ONE VANDERBILT / MIDTOWN EAST",
    description: "Stacked glass volumes rise into a luminous crown. The observation floors and projecting skyboxes bring a different perspective to the city.",
    cta: "Take your brand higher",
    href: "#services",
    position: [8, 25.3, -6] as [number, number, number],
  },
  {
    id: "edge",
    label: "Edge",
    kicker: "30 HUDSON YARDS / WEST SIDE",
    description: "A sloping glass tower with a triangular observation deck suspended over the streets. Big ideas deserve a view this bold.",
    cta: "Build something bold",
    href: "#contact",
    position: [-10, 21, 10] as [number, number, number],
  },
  {
    id: "elxr-tower",
    label: "ELXR Tower",
    kicker: "OUR LITTLE CORNER OF THE CITY",
    description:
      "Independent minds. Electric ideas. A concentrated dose of what grows your brand.",
    cta: "Let's make something",
    href: "#contact",
    position: [4, 17, -8] as [number, number, number],
  },
] as const;
export type LandmarkId = (typeof landmarks)[number]["id"];
export type CityAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "zoom-in"
  | "zoom-out"
  | "reset";
export type CityCommand = { id: number; action: CityAction };
