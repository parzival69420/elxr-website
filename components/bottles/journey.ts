/** Scroll position through the bottle scenes, written by ScrollTrigger and read every frame.
 *  `g` counts scenes: bottle i is centred on screen when g = i + 0.5. */
export const bottleJourney = { g: -0.5 };

/** Scroll length of each bottle scene, in viewport heights. */
export const SCENE_LENGTH = 1.15;
export const SCENE_COUNT = 6;

/** Map scroll (in viewport heights, measured from the track's top meeting the viewport's bottom)
 *  to scene position. The first bottle enters before the stage pins; the last leaves after. */
export function sceneFromScroll(s: number) {
  const pinned = SCENE_COUNT * SCENE_LENGTH - 1;
  if (s < 1) return s - 0.5;
  if (s <= SCENE_COUNT * SCENE_LENGTH)
    return 0.5 + ((SCENE_COUNT - 1) * (s - 1)) / pinned;
  return SCENE_COUNT - 0.5 + (s - SCENE_COUNT * SCENE_LENGTH);
}
export function scrollFromScene(g: number) {
  const pinned = SCENE_COUNT * SCENE_LENGTH - 1;
  return 1 + ((g - 0.5) * pinned) / (SCENE_COUNT - 1);
}
