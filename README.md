# PopSprint Pals (PWA Prototype)

Recognizable repo name suggestion: `popsprint-pals-pwa`

This project is a lightweight, kid-friendly casual web game designed for elementary school players:
- Fast one-tap rounds (45 seconds).
- Bright visuals and simple rules (tap the target color only).
- Mobile-first PWA shell.
- Built-in ad placeholders (no live ad scripts enabled by default).
- Level/XP progression, round missions, and achievements for replayability.

## Why This Direction
- Casual genres dominate mobile downloads. Sensor Tower reports that four of the top five game genres by download share are casual categories, with puzzle leading by volume.
- Individual top-downloaded titles called out by Sensor Tower include simple, repeatable games like `Block Blast!`, `Subway Surfers`, and `Roblox`, which reinforces short-loop, low-friction gameplay patterns.
- Apple publishes live top-free game charts via Apple Marketing Tools API, useful for tracking current ranking movement before each content update.

Sources:
- [Sensor Tower - State of Mobile Gaming 2025](https://sensortower.com/blog/state-of-mobile-gaming-2025)
- [Sensor Tower - State of Mobile 2025](https://sensortower.com/blog/state-of-mobile-2025)
- [Apple Marketing Tools - Top Free Games Feed](https://rss.applemarketingtools.com/api/v2/ww/games/top-free/50/games.json)

## Run Locally
1. Serve the folder with any static server.
2. Open `index.html` in a browser.
3. Install from browser menu (Add to Home Screen / Install App).

## Vercel Deploy Checklist
1. Import this folder as a Vercel project.
2. Keep framework preset as `Other` (static project).
3. Deploy from the default branch.
4. After deploy, update these URLs in `index.html`:
   - `og:url`
   - `canonical`
5. Replace `/public/images/og-image-1200x630.png` with your generated OG image file.

If you see a Vercel 404:
1. Confirm `Production Branch` is `main`.
2. Keep `Root Directory` at repo root.
3. Keep `Build Command` and `Output Directory` empty.
4. Redeploy with build cache disabled once.

## Image Drop Location
Place generated image files in:
- `public/images/`

Required filenames:
- `public/images/icon-192.png`
- `public/images/icon-512.png`
- `public/images/maskable-512.png`
- `public/images/apple-touch-icon.png`
- `public/images/favicon-32.png`
- `public/images/og-image-1200x630.png`
- `public/images/screenshot.png` (marketing/store screenshot asset)

## Battery-Efficiency Choices
- Frame rate capped (`20-30 FPS`) depending on reduced-motion and data-saver hints.
- Auto-pause when tab/app goes to background (`visibilitychange`).
- Small object counts and lightweight vector rendering.
- No heavy audio, physics engines, or large image/video assets.

## Progression + Gamification
- Persistent XP and level system with gentle scaling.
- Rotating round mission with bonus XP rewards.
- Family-friendly achievement badges and round wrap-up panel.
- Positive feedback triggers on streak milestones and mission completion.

## Google Ads Placeholder Setup
Current placeholders live in:
- `#ad-slot-top`
- `#ad-slot-bottom`

This project intentionally keeps ads disabled by default.
Ad scaffold file:
- `ads-config.js`

To enable ads later:
1. Set `ADS_ENABLED = true` in `ads-config.js`.
2. Replace `ADS_CLIENT` with your real `ca-pub-...` value.
3. Keep child-directed and policy-safe settings enabled for your audience.
4. Add your chosen ad units inside the placeholder sections in `index.html`.

Before enabling ads, configure for child-directed audiences and verify compliance:
- [Google AdSense child-directed/COPPA guidance](https://support.google.com/adsense/answer/9007197?hl=en)
- [Google Ad Manager COPPA controls](https://support.google.com/admanager/answer/3671211?hl=en)
- [FTC COPPA business guidance](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy)

## File Map
- `index.html`: UI shell, controls, ad placeholders
- `styles.css`: visual system and responsive layout
- `game.js`: game loop, input, scoring, battery-aware behavior
- `ads-config.js`: safe-by-default ad loader scaffold
- `manifest.webmanifest`: installable PWA config
- `sw.js`: offline caching service worker
- `privacy.html`: privacy notice page
- `parents.html`: parent/guardian information page
- `tasks/todo.md`: implementation checklist + review summary

## Image Prompt Pack
Use these prompts in your image generator:

1. App Icon (`1024x1024`)
   "Create a clean, playful mobile game app icon for a kids game called PopSprint Pals. Show three bright floating circles in teal, sky blue, and yellow over a soft aqua background. Add subtle motion streaks to imply speed. Rounded-corner composition, high contrast, simple shapes, no text, no characters, modern flat vector style."

2. Maskable Icon (`1024x1024`)
   "Design a maskable PWA icon with a safe center composition for PopSprint Pals. Keep all key elements inside the middle 70 percent. Use an energetic teal background with colorful circular game tokens. Minimal vector style, bold edges, clean silhouette, no text, no border, optimized for Android maskable icon crops."

3. Open Graph Image (`1200x630`)
   "Create a vibrant hero banner for a casual kids mobile game named PopSprint Pals. Scene: colorful floating game tokens, soft sky gradient, playful energy lines, simple sparkles, and a mobile phone silhouette showing a color-match tap game. Add headline text: PopSprint Pals. Subtitle text: Fast one-tap fun for kids. Friendly, bright, safe, global appeal."

4. Store Screenshot Frame (`1242x2688`)
   "Create a polished app store screenshot for a portrait kids game UI. Show a gameplay scene with a target color badge at top, score/time cards, and floating colorful circles to tap. Add a bold caption at top: Tap the right color. Keep layout clean, high readability, and cheerful colors. No ads in screenshot."

## Manual QA (Mobile)
- Install to home screen and confirm standalone launch.
- Lock phone, reopen app, and verify game remains stable after background pause.
- Play 5 rounds and verify score updates and best-score persistence.
- Refresh after deploy and verify latest UI appears (no stale service worker content).
