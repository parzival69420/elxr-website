# ELXR Creative: Designer Handoff

The site in this folder is a **working layout**, not the final look. The page order, the copy, the interactions and the scroll timing are all in place. **Your job is to replace every placeholder artwork with final 3D art.** This sheet lists every art slot, what it does on the page, and what file to hand back.

Read these first:
- `CLAUDE.md` is the build brief. Section 5 explains how the motion and 3D work.
- `elxr-website-content.md` has every word on the site. Do not change copy in your renders. Use the text exactly as written.

---

## 1. Brand rules your art must respect

| Token | Hex | Use |
|---|---|---|
| Base | `#0B0710` | Page background. Every render sits on this. |
| Text | `#F7F4F0` | Body text |
| Purple | `#7038E0` | The brand liquid. **Never used for body text.** |
| Lavender | `#A78BFA` | Purple-family text colour |
| Butter | `#F3DFA2` | Small accent type only |
| Orchid | `#B43FD6` | Bottle 2 liquid |
| Deep butter | `#E8C766` | Bottle 4 liquid |
| Plum | `#4C1D95` | Bottle 6 liquid |

- **Typeface:** Satoshi only (free from Fontshare). The logo is the one exception.
- **Surfaces:** one frosted "glass" card style is used everywhere. Don't design a second card style.
- **The idea:** ELXR = elixir. Purple liquid. A bottle pours over an isometric New York. Six bottles = six services.
- **Hard content rules:** never show a client name or logo. No "Our Clients" section.

---

## 2. Art slots to replace

For every render: **transparent background** (PNG or WebP with alpha) unless stated otherwise. Deliver at 2x the listed size so it stays sharp on retina screens.

### A. Logo
- **Where:** nav bar (top), footer, loader screen
- **Now:** the letters "ELXR" typed in Satoshi as a stand-in
- **Deliver:** SVG, light and dark versions

### B. Loader bottle (first thing anyone sees)
- **Where:** full-screen loading screen with the words "Pouring..." then "Served." underneath
- **What it does:** the bottle fills with purple liquid as the page loads, from 0% to 100%
- **Now:** flat SVG bottle outline with a purple fill that rises
- **Deliver:** a **frame sequence of the bottle filling**, 0% → 100%, about 30 frames, around 300 × 500 px each. We play the frame that matches load progress.
- **File now:** `components/Loader.tsx`

### C. Hero pour (the signature moment)
- **Where:** the first screen. The headline "The ELXR for marketing growth." sits on top.
- **What it does, driven by scrolling, not a timer:**
  1. The bottle tilts and pours
  2. Purple liquid floods the whole screen
  3. The liquid drains away to reveal the New York city
  4. The liquid then spreads outward across the city's streets
- **Now:** a code-generated purple wave, then a code-generated city
- **Deliver:** a **scroll-scrubbed frame sequence**, around 120–150 frames, 1920 × 1080 for desktop, plus a **1080 × 1920 portrait version** for phones. We show the frame that matches how far the visitor has scrolled. If a frame sequence is too heavy, a video with a keyframe on every frame also works.
- **Hand-off note:** leave the top-centre area calm enough for the headline to stay readable over frames 1–20.
- **File now:** `components/Hero.tsx` and `components/city/CityCanvas.tsx`

### D. Isometric New York city
- **Where:** behind the hero and the Thesis line after the pour settles
- **Now:** about 380 code-generated boxes with lit windows, a true isometric camera, and purple liquid spreading through the streets
- Pick one of two routes:
  - **Pre-rendered (simpler):** make the city part of the hero frame sequence in slot C, and end the sequence on a clean "settled city" still.
  - **Live 3D (more premium):** a `.glb` model we load in the browser. Keep it **under about 50k triangles** and **under 5 MB**. Bake the lighting and window glow into textures. The camera stays locked isometric with no rotation. We keep the liquid-spread effect in code on top of the model.
- **Reference:** open `/city?p=0` (dry city) and `/city?p=1` (flooded city) on the running site.

### E. The six service bottles (the "menu")
- **Where:** a swipeable carousel under the heading "Pick your potion." Tapping a bottle opens its details.
- **Deliver, per bottle:** one front-facing render, same bottle shape across all six but a distinct label/character each, **roughly 3:5 portrait (600 × 1000 px)**. Optional: an "uncorked / opened" state for when a visitor opens that service.

| # | Service | Liquid colour | Tagline |
|---|---|---|---|
| 1 | Attention Engineering (hero bottle, centred by default) | Electric violet `#7038E0` | Fame, without the media bill. |
| 2 | Content Engine | Orchid `#B43FD6` | Always on. Never off-brand. |
| 3 | Launch & Moments | Butter `#F3DFA2` | Own the night. And the morning feed. |
| 4 | Paid Amplification | Deep butter `#E8C766` | Every dollar, working overtime. |
| 5 | AI Visibility | Iridescent lavender `#A78BFA` | Be the answer, not the search result. |
| 6 | Brand & Identity | Deep plum `#4C1D95` | Look like the brand you're about to become. |

- **File now:** `components/BottleSVG.tsx`, used by `components/BottleCarousel.tsx` and `components/ServiceDetails.tsx`

### F. Manifesto background bottle
- **Where:** a large, faint bottle behind the line "ATTENTION ISN'T BOUGHT. IT'S ENGINEERED."
- **Deliver:** one tall render, about 800 × 1300, subtle. It's shown at low opacity behind huge type.
- **File now:** `components/Manifesto.tsx`

### G. 404 "evaporated" bottle
- **Where:** the page-not-found screen: "This page evaporated." with the button "Pour me home"
- **Deliver:** an **empty** bottle, perhaps with a last wisp of vapour. About 300 × 500.
- **File now:** `app/not-found.tsx`

### H. Social share image (new, doesn't exist yet)
- **Where:** the preview card when the link is pasted into WhatsApp, LinkedIn, iMessage, etc.
- **Deliver:** 1200 × 630 JPG. Include the hero line "The ELXR for marketing growth." and the logo.

### I. Favicon (new)
- **Deliver:** a square mark, SVG plus a 512 × 512 PNG

### J. Founder photo (optional)
- **Where:** the About section ("Who's pouring."). It appears in a glass hover card on Nav's name.
- **Deliver:** a portrait, 800 × 1000

---

## 3. Screens to include in your final render

Mock each screen at **1440 px wide (desktop)** and **375 px wide (phone)**, in this order:

1. Loader: mid-fill, and the "Served." state
2. Hero: before the pour, mid-flood, and the settled city
3. Thesis over the settled city
4. Strips: moving sector list, four number tiles, credentials line
5. Services intro + bottle carousel, with Bottle 1 centred
6. One bottle opened into its detail panel (do Bottle 5, which has the special "Get your free AI visibility check →" button)
7. Service detail cards
8. Manifesto
9. About
10. FAQ, with one question open
11. Contact ("Thirsty?") with the form
12. Footer
13. 404 page

---

## 4. Motion guardrails (so the build still works after your redesign)

- **One big moment per screen.** The pour is the showpiece. Everything after it stays calm. Don't add fade-ins to every section.
- **Only one live 3D scene on the page** (the city). The six carousel bottles must be **flat renders (images)**, not live 3D. Six live 3D bottles plus a city would crash phones.
- **Phones get a lighter version:** a simpler city and a simple colour wipe instead of the full pour.
- **Reduced motion:** some visitors turn off animation. They see a still of the settled city and a plain scrolling row of bottles, so each bottle render must still look good as a still image.
- **Size budget:** keep the total art download for the first screen **under about 8 MB**. Frame sequences should be WebP or AVIF.

---

## 5. Seeing the current layout

- Open the live link Nav sends you, or run it locally (instructions in `README.md`).
- `/city` shows the city alone. Add `?p=0` for dry, `?p=0.3&pour=1` for mid-flood, or `?p=1` for flooded.

## 6. Delivering files back

Put everything in one folder with this structure and the developer will wire it in:

```
art/
  logo/          logo-light.svg, logo-dark.svg
  loader/        fill_000.webp … fill_029.webp
  hero/desktop/  pour_000.webp … pour_149.webp
  hero/mobile/   pour_000.webp … pour_149.webp
  city/          city.glb (only if you take the live 3D route)
  bottles/       bottle-1.webp … bottle-6.webp (+ bottle-1-open.webp, etc.)
  manifesto-bottle.webp
  404-bottle.webp
  og-image.jpg
  favicon.svg, favicon-512.png
  founder.webp (optional)
```
