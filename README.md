# ELXR Creative — Website

Single-page marketing site for ELXR Creative. Built per `CLAUDE.md` (build brief) and `elxr-website-content.md` (copy source of truth).

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · react-three-fiber (Manhattan journey and lazy-loaded 3D bottle collection) · GSAP ScrollTrigger (scroll choreography) · Framer Motion (motion preferences) · Satoshi self-hosted from `/public/fonts`.

## Run it

Use Node.js 20 or newer. From this folder:

```sh
npm ci
npm run dev     # dev server on http://localhost:3000
npm run build   # production build
```

`/city` is a full-viewport city preview with landmark selection, orbit, zoom, and reset controls.
`?p=0` shows the close, sideways Midtown aerial; `?p=1` shows the live 3D skyline. Intermediate values preview the camera descent.

Set `ELXR_BUILD_DIR` to isolate concurrent development/build outputs. The verified preview uses `ELXR_BUILD_DIR=.next-city npm run dev -- --hostname 127.0.0.1 --port 3002`.

## Editing

- **All copy** lives in `lib/content.ts`. One file, plain text, typed.
- **Design tokens** live in `app/globals.css` (`:root` variables) and are mirrored in `tailwind.config.ts`. Never hardcode a hex elsewhere.
- **City geography and map rotation** live in `lib/city.ts`. The shoreline is an artistic simplification, not navigation-grade geography.
- **Camera and interaction** live in `components/city/CityCanvas.tsx`. Scroll descends from the close overhead map into Times Square. Drag to orbit, use the labeled buttons to rotate/zoom/reset, or focus the canvas and use arrow keys and +/−. Scroll continues down the page.
- **3D architecture** lives in `components/city/CityArchitecture.tsx`. It loads seven locally served glTF 2.0 assets from `public/models/city`: ten building variants, Empire State, One World Trade Center, One Vanderbilt / SUMMIT, 30 Hudson Yards / Edge, One Times Square, and a street kit with animated taxis, pedestrians, streetlights, and bollards. Select the actual landmark geometry or its accessible button to fly the camera toward it. Full orbit and keyboard controls remain available.
- **City assets** are reproducible with `npm run models:city`. The original model generator, facade texture provenance, final image-generation prompt, and architecture references are documented in `public/models/city/README.md`. The shared facade atlas adds varied glazing, room lighting, masonry, blinds, and weathering to the PBR materials. The HDR reflection source is credited in `public/textures/ATTRIBUTION.md`.
- **Street surfaces** live in `components/city/CityGeometry.tsx`: textured pavement, reflective neon spill, the Times Square plaza and red steps, river highlights, and distant traffic. `CentralPark.tsx` adds trees, paths, and a shaped reservoir.
- **Billboards** live in `components/city/CityBillboards.tsx`. Stacked and side-facing advertising, theater marquees, and high-resolution lettering fill the square. Screens animate gently, respond to selection, and preserve a dark field behind the type.
- **Atmosphere and effects** live in `components/city/CityAtmosphere.tsx`: camera-aware layered clouds against a dark sky, haze, sparse stars, and restrained bloom. The skyline is real geometry; no generated skyline backdrop is used.
- **Hero choreography** lives in `components/Hero.tsx`. `ManhattanMap.tsx` displays a lightweight 2D map while the WebGL chunk loads; the rendered city fades in at the same orientation. Map and city stops are reachable directly.
- **Motion and fallback** respect the OS preference and the visible motion toggle. Reduced motion freezes ambient animation and uses direct camera transitions, retaining the interactive 3D model. Failed WebGL retains the 2D map and normal navigation. The scene pauses outside the hero; rendering resolution and distant geometry are reduced on mobile.

## Interactive bottle collection

The services use three original binary glTF 2.0 models in `public/models`, with six finish colors. The cylinder, armored flask and curved decanter follow the supplied bottle reference. They use real glass/metal geometry, branching emissive filaments, runtime surface shaders and studio reflections.

- `components/bottles/BottleStage.tsx` loads the GLBs, textures the labels, and animates the separate stopper groups.
- `components/BottleCarousel.tsx` handles formula selection, horizontal drag rotation, hover, pointer/touch opening, and accessible controls. Arrow keys rotate a focused viewer; Enter/Space opens it; Home resets rotation. The six formula tabs support arrow keys, Home and End.
- `lib/bottles.ts` holds the six finish colors; service copy remains in `lib/content.ts`.
- The viewer loads near the services section, renders three bottles at a time, caps mobile resolution and pauses outside the viewport. OS reduced-motion preferences disable energy pulsing and hover tilt. All service copy remains in native disclosures if WebGL fails, with a retry control for the viewer.
- `npm run models:bottles` rebuilds the three self-contained GLBs. Mesh/material details are documented in `public/models/BOTTLES.md`.
- Bottle/layout verification is recorded in `bottle-design-qa.md`.

## Still open ([NAV] items from the content doc)

1. Domain + email — placeholder `hello@elxrcreative.com` in `lib/content.ts`
2. Calendar link — every "Book a call" points at `#book` (the contact section)
3. Logo SVG — nav/footer show an ELXR wordmark placeholder
4. IG handle and LinkedIn URL — footer placeholders
5. Revenue figure — `$3M+` used (the "measurable" one); swap in `content.ts`
6. Contact form backend — currently opens a pre-filled mailto: draft; point it at Formspree/Resend/an API route in `components/Contact.tsx`
7. Re-verify the AI search stats in Bottle 5 the week the site publishes

## Deploy

Push to GitHub, import the repo in Vercel, done. Every push deploys. No config needed.
