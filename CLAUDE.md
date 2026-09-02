# ELXR Creative Website: Build Brief

Save this file as `CLAUDE.md` in the project root. Claude Code reads it automatically at the start of every session, so you never have to re-explain the project. Keep `elxr-website-content.md` in the same folder.

---

## 0. HOW TO USE THIS

1. Make a folder. Put this file in it as `CLAUDE.md` and the content doc next to it.
2. Open Claude Code in that folder.
3. Run the phase prompts in section 6, one at a time, in order.
4. After each phase, look at it in the browser, then tell Claude what to change in plain English.

Do not paste all phases at once. The build is too big for one pass and the quality drops hard.

---

## 1. PROJECT

A single-page marketing site for ELXR Creative, a creative marketing agency in New York and New Jersey. All copy, section order and content rules live in `elxr-website-content.md`. That file is the source of truth for words. This file is the source of truth for how it gets built.

Central metaphor: ELXR = elixir. Purple liquid. A bottle pours over an isometric New York. Six bottles, six services.

---

## 2. STACK (LOCKED, DO NOT SUBSTITUTE)

- **Next.js 14+, App Router, TypeScript**
- **Tailwind CSS** for layout and utility styling
- **react-three-fiber + @react-three/drei** for the isometric city
- **GSAP + ScrollTrigger** for scroll choreography
- **Framer Motion** for component-level transitions and the carousel drag
- **Satoshi** self-hosted from `/public/fonts` as woff2
- Deploy target: **Vercel**
- No CMS. Copy lives in a single typed `content.ts` file so it can be edited in one place.

Everything is one Next.js app in one repo. No external page builders, no design tools in the pipeline.

---

## 3. DESIGN TOKENS

Define these once in `globals.css` as CSS variables and mirror them in the Tailwind config. Never hardcode a hex anywhere else.

```
--base:        #0B0710   /* page background */
--text:        #F7F4F0   /* body text */
--purple:      #7038E0   /* primary, brand and liquid */
--lavender:    #A78BFA   /* purple-family TEXT color on dark */
--butter:      #F3DFA2   /* small-type accent only */
--orchid:      #B43FD6
--deep-butter: #E8C766
--plum:        #4C1D95
```

Contrast rule, non-negotiable: `--purple` is never used for body text on the dark base. It fails contrast. Use `--lavender` for purple-family text. Use `--butter` only for small accent type, never long-form copy.

Type: Satoshi only. One family. Weights carry the whole hierarchy. The logo is not set in Satoshi and arrives as an SVG file.

Glass surfaces: one reusable `.glass` treatment. Backdrop blur, low-opacity white fill, a 1px inner top highlight, a soft outer shadow. Define it once. Do not invent a second card style later in the build.

---

## 4. HARD RULES

Carried over from the content doc. Do not undo these while designing.

1. No client is ever named. Sector descriptors only.
2. No past agency is named anywhere except the About founder story, once.
3. No metric appears without its mechanism and constraint attached.
4. There is no "Our Clients" section. The category and credential strips replace it.
5. Voice is confident, sharp, lightly playful. One potion joke per screen, maximum.

---

## 5. MOTION AND 3D APPROACH

This is the part that decides whether the site ships. Read it before writing any 3D code.

### The isometric city is generated in code, not modelled

No 3D software, no downloaded models, no Blender. The city is instanced geometry on a grid:

- One `InstancedMesh` of `BoxGeometry` for buildings, a few hundred instances maximum.
- Heights from seeded pseudo-random noise so the skyline is repeatable across reloads.
- An orthographic camera at a true isometric angle. Locked. No orbit controls.
- Streets are gaps in the grid, not separate meshes.
- Windows are an emissive texture or a shader, not individual meshes.
- A handful of taller landmark blocks near the center so it reads as a skyline and not a bar chart.

Low-poly and stylised is the goal. Do not attempt photoreal. Photoreal will look worse and run at 20fps.

### The liquid

Three separate techniques. Do not try to solve all three with one system.

1. **Loader bottle fill.** SVG bottle. A rect clipped to the bottle silhouette rises with load progress. An animated sine path on top gives the surface a slosh. Pure SVG and CSS. No WebGL.
2. **Hero pour and flood.** A fullscreen WebGL shader quad over the canvas. A rising liquid line with noise distortion floods the frame, then recedes. Driven by scroll progress, not a timer.
3. **Liquid spreading over the city.** A radial mask on the ground plane material, its radius driven by the same scroll progress value. The liquid does not simulate. It reveals.

### One WebGL context only

The city scene gets the canvas. The six carousel bottles are **SVG**, using the same fill technique as the loader. Six 3D bottles plus a city will kill mobile. This is a deliberate call, not a shortcut.

### Motion discipline

One orchestrated moment per screen. The pour is the memorable thing. Everything after it stays quiet. No fade-and-slide-up on every section. No hover transition on every card. Motion that answers a click or a drag is welcome. Ambient motion is not.

### Mobile and accessibility floor

- Under 768px: city renders at reduced instance count, pour shader is replaced by a CSS gradient wipe.
- `prefers-reduced-motion`: loader jumps to `Served.`, pour becomes a cross-fade, carousel becomes a scroll-snap list.
- Visible keyboard focus on every interactive element.
- The carousel is operable by arrow keys, not drag only.
- Every bottle's content is in the DOM and readable with JavaScript disabled.

---

## 6. BUILD PHASES

Run these one at a time in Claude Code. Each is a complete prompt. Paste it as written.

### Phase 1: Foundation

> Read CLAUDE.md and elxr-website-content.md. Scaffold the Next.js project: TypeScript, Tailwind, App Router. Set up the design tokens from section 3 as CSS variables in globals.css and mirror them in tailwind.config. Self-host Satoshi from Fontshare into /public/fonts and wire up the @font-face rules with all weights. Build the reusable `.glass` surface treatment. Create content.ts and move every single piece of copy from elxr-website-content.md into it as typed objects, section by section, including all six bottles with their taglines, one-liners, what's-inside lists and proof blocks. Do not build any sections yet. Do not build any 3D yet. Stop when the project runs, the fonts render, and the content file is complete. Then show me the type scale on a test page so I can approve it.

### Phase 2: Static page, no motion

> Build every section of the page as static, unanimated, responsive components, pulling all copy from content.ts. Order: Hero, Thesis, Strips, Services intro, Bottle carousel, Service details, Manifesto, About, FAQ, Contact, Footer. Leave a placeholder div where the 3D city goes. Use plain SVG placeholder shapes for the six bottles. The carousel should be a working horizontal drag carousel with keyboard arrow support, but no liquid effects yet. Get the layout, spacing, type hierarchy and responsive behaviour right first. This phase should look good with zero animation.

### Phase 3: The city

> Build the isometric NYC scene per section 5 of CLAUDE.md. Instanced boxes on a seeded grid, orthographic isometric camera, emissive window shader, stylised and low-poly. It should be static for now, just sitting in the hero. Optimise for 60fps on a mid-range laptop and give me an instance count I can tune. Show me the scene alone at full viewport so I can approve the skyline before anything pours on it.

### Phase 4: The pour

> Build the three liquid techniques from section 5: the SVG loader bottle fill tied to real load progress with the "Pouring..." and "Served." microcopy, the fullscreen shader pour that floods and recedes over the hero, and the radial liquid spread across the city ground plane. Drive the pour and the spread from a single shared scroll progress value using GSAP ScrollTrigger. Respect prefers-reduced-motion with the fallbacks specified. Nothing else on the page should animate.

### Phase 5: Bottles

> Give the six carousel bottles their real treatment: SVG bottle silhouettes filled with their assigned liquid colors from the content doc, using the loader's fill technique. Add the open interaction so a bottle expands into its service detail panel with the what's-inside list and proof blocks. Bottle 5 gets its special CTA. This is the one place besides the pour where motion should feel expensive.

### Phase 6: Finish

> Polish pass. Add the SEO meta and OG tags from the content doc. Build the 404 page and the form states with the microcopy from section 13. Wire the contact form. Run a full accessibility pass: keyboard navigation, focus states, contrast, alt text, reduced motion. Test at 375px, 768px, 1440px and 2560px. Run Lighthouse and fix anything under 90. Then critique your own work against CLAUDE.md and tell me the three weakest things on the page.

---

## 7. ASSETS NAV SUPPLIES

Claude cannot generate these. Have them ready or the build stalls.

| Asset | Where it goes | Status |
|---|---|---|
| Logo, SVG, light and dark variants | Nav bar, footer, loader | Pending |
| Domain | `hello@[domain]` in footer and contact | Pending |
| Calendar link | Every "Book a call" button | Pending |
| Instagram handle | Footer | Pending |
| LinkedIn URL | Footer | Pending |
| Revenue figure, $5.5M or $3M | Numbers strip | Pending |
| Founder photo, optional | About hover card | Optional |

Satoshi downloads free from Fontshare. Vercel hosting is free at this scale. Nothing else costs money except the domain.

---

## 8. DECISIONS STILL OPEN

From section 14 of the content doc. Build with the recommended option, flag it in a comment, swap later in `content.ts`.

- Hero headline: use "The ELXR for marketing growth."
- Services heading: use "Pick your potion."
- Manifesto: use "ATTENTION ISN'T BOUGHT. IT'S ENGINEERED."
- Contact heading: use "Thirsty?"
- FAQ: build it. Cutting a section later is one line. Adding it back is a phase.
- Keep the anonymized cocktail-bar proof entries in Bottles 2 and 4 until told otherwise.

---

## 9. WHEN THE BUILD IS DONE

Editing later never requires a rebuild.

- Copy changes: edit `content.ts`, one file, plain text.
- Anything structural: open the folder in Claude Code and say what you want changed.
- Push to GitHub, connect Vercel once, and every future change deploys on save.

The site is yours as code. No platform can take it away or start charging for it.
