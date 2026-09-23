# ELXR city hero design QA

final result: passed

## Source, intent, and evidence

- References: `/Users/shivvyas/Desktop/Screenshot 2026-09-23 at 00.07.35.png` (overhead city), `/Users/shivvyas/Desktop/Screenshot 2026-09-23 at 00.08.04.png` (skyline), and https://ultrasupernew.com/.
- User refinements: Manhattan runs sideways; opening camera stays close enough for blocks and rooftops to fill the screen; scrolling reaches a real, interactive cyberpunk Times Square model. The user explicitly rejected generated skyline imagery. These instructions supersede the asset-generation defaults of the design skill.
- Preview: http://127.0.0.1:3002/.
- Source images: 3024 × 1928 pixels; normalized reference copies at `/tmp/elxr-ui-qa/reference-map.png` and `/tmp/elxr-ui-qa/reference-skyline.png` are 1440 × 918.
- Desktop viewport and screenshots: 1440 × 918 CSS/pixel dimensions, density 1. Final captures: `/tmp/elxr-ui-qa/close-midtown-map.png`, `/tmp/elxr-ui-qa/live-city.png`, `/tmp/elxr-ui-qa/live-city-exploring.png`.
- Mobile viewport and screenshots: 390 × 844 CSS/pixel dimensions, density 1. Captures: `/tmp/elxr-ui-qa/live-mobile-map.png` and `/tmp/elxr-ui-qa/live-mobile-city.png`.
- Reference and final implementation screenshots were displayed together for each desktop state. The reference supplies the visual direction; its Japanese city, serif copy, branding, and navigation map are intentionally replaced with ELXR content and Manhattan. Mobile has no supplied reference.

## Findings and comparison history

1. [Resolved P1] The former final skyline was a generated image. Removed its asset and rendering layer. The endpoint now contains live instanced towers, modeled landmark setbacks, animated billboard surfaces, traffic, lighting, and orbit controls. Final skyline and exploration captures document the replacement.
2. [Resolved P1] Opening framing showed the whole island at a small scale. Reframed both the loading canvas and live camera over Midtown, retaining the sideways orientation. Added smaller blocks around the plaza. The final close aerial fills the viewport with streets and rooftops.
3. [Resolved P2] Exploring could move the pinned hero out of view through focus scrolling. Canvas focus now prevents browser scrolling; exploration stabilizes at the city stop. Camera buttons, direct dragging, and selection preserve the visible hero.
4. [Resolved P2] A hard water/sky boundary and overly prominent light beams distracted from the skyline. Distance fades and lower beam opacity produce the continuous navy/pink horizon visible in the final skyline.
5. [Resolved P2] Old location labels no longer matched the close map crop. Repositioned them and removed the offscreen Central Park label on mobile. No clipped primary copy or controls at the tested sizes.
6. [Resolved P2] OrbitControls can consume touch scrolling. On mobile, orbit is enabled after entering exploration; before that, canvas touch action permits vertical scrolling. Actual physical-device touch gestures remain a test gap.

No actionable P0/P1/P2 issues remain within the requested hero scope.

## Required fidelity surfaces

- **Typography:** retained ELXR's self-hosted Satoshi and content hierarchy. Large display copy, subdued coordinates, and small controls remain legible at the tested viewports. The reference's serif family is not copied because the requested change is the city experience within the existing brand.
- **Spacing/layout:** close aerial occupies the full viewport, then descends to a centered skyline. Navigation and bottom controls have consistent margins. Exploration hides the display headline, exposing the model. Mobile controls and landmark cards fit without horizontal overflow (document width and viewport both 390px).
- **Colors/tokens:** navy scene, cyan and pink lighting, warm scattered windows, white display copy. The model uses a more graphic geometric rendering than the reference; this is a stylized Manhattan interpretation.
- **Assets/rendering:** all city views are rendered geometry or the lightweight initial 2D canvas. No generated skyline asset remains. Billboards use animated shaders and runtime canvas lettering. Shoreline and building placements are artistic, not survey-accurate.
- **Content:** ELXR headline, services, about, and contact destinations remain. New city labels and landmark cards relate the environment to existing site sections.
- **Focused review:** inspected headline wrapping, navigation, control labels, landmark card text, and screen crops in the full-resolution desktop/mobile captures. These regions were readable without separate crops.

## Validation

- `ELXR_BUILD_DIR=.next-city-production npm run build`: passed after final implementation, including TypeScript and static generation.
- `git diff --check`: passed.
- Browser: map/city stops, scroll-driven descent, Explore entry, direct drag rotation, rotate buttons, zoom, reset, accessible landmark buttons, and direct click on the 3D Empire State marker exercised successfully.
- Camera telemetry changed during orbit and zoom; page scroll remained stable at the exploration stop. Ordinary scrolling reaches the existing content below the hero.
- Mobile skyline, opening, and selected landmark card reviewed; no horizontal overflow.
- Reduced-motion toggle retains the live WebGL canvas and switches the motion state. OS-level preference changes were not separately exercised.
- Console review shows only two historical development errors from an incomplete CSS write at 04:57:48 UTC; both resolved before the successful builds. No new runtime/shader errors appeared during the final verification.
- Earlier navigation check verified opening the menu, Escape dismissal/focus restoration, and Services navigation on mobile.

## Follow-up polish and test limits

- Additional facade variety and more geographically exact streets could increase realism; current geometry is intentionally stylized.
- Physical-device GPU benchmarking, touch testing, network throttling, and forced WebGL context-loss testing were not performed.
- Existing contact backend and social-link placeholders remain documented in README.md; this work changes the hero experience.

## Implementation checklist

- [x] Close sideways loading map and aerial camera.
- [x] Scroll descent into live 3D Times Square.
- [x] Orbit, zoom, reset, and selectable landmarks.
- [x] Responsive layout and reduced-motion behavior.
- [x] Remove generated skyline asset and obsolete documentation.
- [x] Visual comparison, browser interaction checks, and production build.
