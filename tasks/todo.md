# Viral Kids PWA Game - Implementation Plan

## Todo
- [x] Confirm environment and constraints.
- [x] Research top-ranking casual/mobile games for design inspiration.
- [x] Decide recognizable game/repo naming.
- [x] Build minimal PWA scaffold (manifest + service worker + installable shell).
- [x] Implement simple, high-fun casual game loop for elementary school players.
- [x] Add battery-efficient behavior and performance protections.
- [x] Add non-intrusive Google Ads placeholder slots and integration hooks.
- [x] Document child-directed ad and privacy setup notes.
- [x] Test core code and structure locally (syntax checks + file verification).
- [x] Prepare image-generation prompts (icon, OG image, optional app screenshots).
- [x] Add Vercel deployment cache headers for stable PWA updates.
- [x] Add social sharing metadata (`og:*`, `twitter:*`, canonical).
- [x] Add legal pages (`privacy.html`, `parents.html`) and link from home page.
- [x] Add safe-by-default Google Ads loader scaffold with placeholder client ID.
- [x] Extend docs with Vercel deploy and manual mobile QA checklist.

## Review
- Built a complete vanilla PWA game prototype named `PopSprint Pals` in the target folder.
- Implemented a one-tap, color-target game loop with short rounds and local best-score tracking.
- Added efficiency controls: capped FPS, reduced-motion/data-saver handling, and background auto-pause.
- Added service worker + manifest for installable/offline-first behavior.
- Added top/bottom Google Ads placeholder slots without enabling live ad scripts.
- Documented child-directed ad policy references and top-game inspiration links in `README.md`.
- Verified JavaScript syntax with `node --check` for `game.js` and `sw.js`.
- Added `vercel.json` with no-cache headers for app shell/service worker and immutable cache for icon assets.
- Added sharing metadata and canonical URL placeholders in `index.html`.
- Added `privacy.html` and `parents.html` with direct links from home page.
- Added `ads-config.js` with explicit opt-in enable flag and placeholder publisher ID.
- Updated docs with deploy instructions, ad activation steps, and mobile QA checklist.
- Remaining manual check for you: run the mobile QA list after first Vercel deployment.
