# Ryan — Portfolio

A scroll-driven, interactive developer portfolio. No frameworks, no build
step — vanilla HTML/CSS/JS with Three.js and GSAP loaded via CDN, deployed
as a static site on GitHub Pages.

**Live:** https://sadsamon.github.io/ryan-konyango-portfolio/

## Features

- **Scannable intro** — a short statement, key facts, a tech-stack chip
  cloud, and direct email / GitHub / LinkedIn links up front, with the
  longer story behind a native toggle
- **Sticky navigation** — anchor links with scroll-driven active state, and a
  contact call-to-action that stays in reach
- **Interactive 3D globe** — Three.js scene marking places lived, studied,
  and worked, with click-to-navigate pins that camera-zoom into the
  relevant section
- **Scroll-triggered project reveals** — each project animates in as it
  enters the viewport, with a sticky panel tracking live metadata
  (stack, status) for whichever project is in view
- **GSAP-driven transitions** — preloader sequence, entrance animations,
  and camera movement, all triggered by clicks, taps, or scroll position
  (no hover-dependent interactions)
- **Project case studies** — each project leads with the problem, then an
  architecture diagram, key decisions, metrics, and links; the full write-up
  sits in a native toggle on the card
- **Project terminal** — the same write-ups are readable from a command-line
  interface (`ls`, `cat <file>`), with tap-to-run command and file buttons
- **Terminal-style contact** — a command-line interface (`help`, `ls`, `cat`,
  `contact`, `status`, history and tab-completion) with draggable file chips
  that run commands when dropped on the terminal; tap and keyboard fallbacks
  included, and plain contact links alongside it
- **Fully responsive** — desktop, tablet, and mobile, with touch-friendly
  fallbacks for the 3D elements; the page stays usable if WebGL or a CDN
  library fails to load, the globe pauses rendering when off-screen, and the
  preloader runs once per session and respects reduced-motion settings

## Tech Stack

| Layer      | Tools |
|------------|-------|
| Markup     | HTML5 |
| Styling    | CSS3 — custom properties, Grid, Flexbox |
| Behavior   | Vanilla JavaScript (ES6+) |
| 3D         | [Three.js](https://threejs.org/) |
| Animation  | [GSAP](https://gsap.com/) |
| Hosting    | GitHub Pages |

## Project Structure

```
.
├── index.html
├── css/
│   └── style.css        # design tokens + all styling
├── js/
│   └── main.js           # preloader, globe, project reveals, terminals
└── assets/
    └── images/
```

## Running Locally

No build step required.

```bash
git clone https://github.com/Sadsamon/ryan-konyango-portfolio.git
cd ryan-konyango-portfolio
python3 -m http.server 8000
```

Then open `http://localhost:8000` — or just open `index.html` directly
in a browser.

## Deployment

Deployed via GitHub Pages:

1. Push to `main`
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch**
3. Select `main` / `root`

## Design System

| Token             | Value              |
|-------------------|--------------------|
| Background        | `#1A1613`          |
| Surface           | `#2B2118`          |
| Text              | `#EDE6DC`          |
| Muted text        | `#8C8177`          |
| Accent (orange)   | `#E67E22`          |
| Accent (burgundy) | `#6E2B3A`          |
| Headings          | Space Grotesk      |
| Body              | Inter               |
| Code / technical  | JetBrains Mono     |

## License

All rights reserved.
