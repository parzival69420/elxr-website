# ELXR bottle collection and page layout QA

final result: passed for the implemented reference-inspired direction

## Reference and scope

User reference: `/var/folders/2q/8qv6msq1527bw7sbmmdtwsmm0000gn/T/TemporaryItems/NSIRD_screencaptureui_oh15KL/Screenshot 2026-09-23 at 01.04.54.png` (2690 × 964).

The reference supplies three silhouettes, dark metal armatures, transparent glass, luminous energy and a black product stage. This implementation uses original editable GLB geometry, with six service finishes. The user explicitly requested real interactive 3D models, so no image generation was used for the bottles. The result is a stylized real-time interpretation, not an exact reproduction of the reference's rendered surface detail.

The existing city is being refined in the separate active task “Create hyperrealistic cyberpunk city.” Its changes are preserved. This report covers the bottle collection and the surrounding layout changes in this task, not that task's final city verification.

## Implemented

- Three self-contained glTF 2.0 GLBs: arc chamber, armored prism flask, aether decanter. Each includes separate Stopper and LabelSurface nodes, PBR glass and metal materials, geometry filaments and small fittings.
- Six named service finishes, large live viewer, previous/next controls and six accessible formula tabs.
- Horizontal drag rotation; pointer hover tilts and lifts the stopper; clicking/tapping the selected bottle opens it, lifts its cap and brightens its energy. The selected service ingredients appear below.
- Keyboard rotation, reset, open/close and tab navigation. Native disclosures preserve the full service copy without WebGL or JavaScript.
- Darker page background, quieter stats, clearer typography, service index, simplified manifesto, two-column About/FAQ and contact layout.
- Lazy scene mounting, offscreen render pause, limited mobile pixel ratio, reduced ambient motion for OS preference, failure fallback and retry.

## Findings resolved

1. The first studio render made the floor gray and the glass too pale. Replaced the floor material, narrowed the reflection cards and tuned transmission, light intensity and glass tint.
2. Initial flask geometry read as an oval. Replaced its smooth outer frame with faceted rails and added bronze armor braces.
3. Repetitive helical filaments looked generic. Added branching electrical geometry and a plasma surface shader.
4. Opening the cylinder could clip its cap. Reframed the camera with more space above the model.
5. A front brace crossed the cylinder's branding. Rotated the armature and moved/enlarged the label plaque.
6. A hot-reload unmount could report intentional WebGL context disposal as failure. Added listener cleanup in a scene component.

## Evidence and verification

- Desktop: 1440 × 918 during interaction tests, 1440 × 1100 for the complete collection capture at `/tmp/elxr-ui-qa/bottles-desktop.png`.
- Mobile: 390 × 844 at `/tmp/elxr-ui-qa/bottles-mobile.png`. Document width and viewport were both 390px. Main formula name, controls and tabs fit without horizontal overflow.
- Opened model: `/tmp/elxr-ui-qa/bottles-open-desktop.png`.
- Detail and contact layout captures: `/tmp/elxr-ui-qa/services-detail-desktop.png`, `/tmp/elxr-ui-qa/contact-desktop.png`.
- All six formula tabs selected the correct title and content. ArrowRight wraps from formula 06 to 01. Previous/next controls change the live model and finish.
- Direct drag visibly rotated the flask to show its side profile. Direct model click and Enter opened the ingredient panel. Home reset rotation without changing the page scroll in the dedicated test. The result link opened the matching native service disclosure.
- Fresh dedicated preview console: no warnings or errors. Earlier transient city-development errors were from the parallel city work; the fresh bottle preview was clean.
- GLB header/version/length, embedded buffers and required named nodes checked for all three models; each has 13 meshes and seven materials. Total model payload is approximately 4.8 MB before transfer compression.
- `npx tsc --noEmit`: passed.
- `ELXR_BUILD_DIR=.next-bottles-production npm run build`: passed, including static generation.
- `git diff --check`: passed.

## Limits

Physical-device touch/GPU performance, forced context loss and OS-level preference switching were not exercised. Pointer interactions were tested at desktop and mobile viewport sizes. Existing booking, social and email-backend placeholders remain documented in README.md. The work is available locally and has not been published.
