# ELXR Creative — Website

Single-page marketing site for ELXR Creative. Built per `CLAUDE.md` (build brief) and `elxr-website-content.md` (copy source of truth).

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · react-three-fiber (isometric city, one WebGL context) · GSAP ScrollTrigger (pour choreography) · Framer Motion (carousel) · Satoshi self-hosted from `/public/fonts`.

## Run it

Node is installed locally at `~/.local/node/node-v24.20.0-darwin-arm64`. From this folder:

```sh
export PATH="$HOME/.local/node/node-v24.20.0-darwin-arm64/bin:$PATH"
npm run dev     # dev server on http://localhost:3000
npm run build   # production build
```

`/city` is a dev-only tuning page: the city scene alone at full viewport.
`?p=0..1` previews any pour/spread progress state, `&pour=1` adds the pour shader. Delete `app/city/` before launch if you don't want it public.

## Editing

- **All copy** lives in `lib/content.ts`. One file, plain text, typed.
- **Design tokens** live in `app/globals.css` (`:root` variables) and are mirrored in `tailwind.config.ts`. Never hardcode a hex elsewhere.
- **Skyline tuning knobs** are the constants at the top of `components/city/CityCanvas.tsx` (`GRID`, `STREET_EVERY`, `EMPTY_CHANCE`, `SEED`).

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
