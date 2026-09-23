# Portfolio — Build Notes

Static site, no build step. To deploy: push this folder to a GitHub repo,
then Settings → Pages → Deploy from branch → `main` / root.

## Structure
- `index.html` — page shell, one `<section>` per phase
- `css/style.css` — design tokens + base styles. No `:hover` rules — every
  interaction is click/tap/scroll-driven.
- `js/main.js` — behavior, grows per phase

## Design tokens
- Color: charcoal `#1A1613`, brown `#2B2118`, off-white text `#EDE6DC`,
  muted gray `#8C8177`, orange accent `#E67E22`, burgundy accent `#6E2B3A`
- Type: Space Grotesk (headings), Inter (body), JetBrains Mono (code/technical)

## Phase checklist
- [x] Phase 1 — Foundation (structure, tokens, section shell)
- [x] Phase 2 — Preloader + Hero
- [x] Phase 3 — 3D globe + pin navigation
- [x] Phase 4 — Projects (all six) + sticky metadata panel
- [ ] Phase 5 — Academic / global experience grid
- [ ] Phase 6 — Terminal contact
- [ ] Phase 7 — Responsive + cross-device pass
