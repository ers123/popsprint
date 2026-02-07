# PopSprint Pals (PWA)

Suggested repo name: `popsprint-pals-pwa`

PopSprint Pals is an ad-free, family-friendly casual game designed for elementary school children and parents to enjoy together.

## Core Experience
- One-tap gameplay in short 45-second rounds.
- Mission-based replay loop with streak rewards.
- Persistent level + XP progression.
- Family achievement milestones.
- Mobile-first PWA (installable, lightweight, battery-conscious).

## Why This Direction
- Casual genres dominate mobile download share.
- Repeatable short-loop mechanics continue to perform strongly across top game charts.

Sources:
- [Sensor Tower - State of Mobile Gaming 2025](https://sensortower.com/blog/state-of-mobile-gaming-2025)
- [Sensor Tower - State of Mobile 2025](https://sensortower.com/blog/state-of-mobile-2025)
- [Apple Marketing Tools - Top Free Games Feed](https://rss.applemarketingtools.com/api/v2/ww/games/top-free/50/games.json)

## Run Locally
1. Serve the folder with any static server.
2. Open `index.html` in a browser.
3. Install from browser menu (Add to Home Screen / Install App).

## Hosting Notes

### Vercel
1. Import this folder as a Vercel project.
2. Framework preset: `Other`.
3. Root Directory: repo root.
4. Build Command: empty.
5. Output Directory: empty.
6. Deploy from `main`.

If you hit 404:
1. Confirm production branch is `main`.
2. Redeploy once with build cache disabled.

### GitHub Pages
1. Repo settings -> Pages.
2. Source: `Deploy from a branch`.
3. Branch: `main`, Folder: `/(root)`.

## Image Drop Location
Place generated image files in `public/images/`:
- `icon-192.png`
- `icon-512.png`
- `maskable-512.png`
- `apple-touch-icon.png`
- `favicon-32.png`
- `og-image-1200x630.png`
- `screenshot.png` (marketing asset)

## Battery-Efficiency Choices
- Frame rate capped (`20-30 FPS`) based on reduced-motion/data-saver hints.
- Auto-pause on background tab/app transitions.
- Lightweight canvas rendering and object limits.
- No heavy engines, no video/audio loops.

## Progression + Gamification
- Persistent XP and levels with gentle scaling.
- Rotating round mission with bonus XP.
- Achievement unlocks for score/streak/consistency milestones.
- Positive reinforcement cues during gameplay.

## File Map
- `index.html`: main game UI shell
- `styles.css`: visual system and responsive layout
- `game.js`: gameplay loop, progression, achievements
- `manifest.webmanifest`: installable PWA metadata
- `sw.js`: offline cache and update behavior
- `privacy.html`: privacy notice page
- `parents.html`: parents/guardians page
- `tasks/todo.md`: implementation checklist and review notes

## Image Prompt Pack
1. App Icon (`1024x1024`)
   "Create a clean, playful mobile game app icon for a kids game called PopSprint Pals. Show three bright floating circles in teal, sky blue, and yellow over a soft aqua background. Add subtle motion streaks to imply speed. Rounded-corner composition, high contrast, simple shapes, no text, no characters, modern flat vector style."

2. Maskable Icon (`1024x1024`)
   "Design a maskable PWA icon with a safe center composition for PopSprint Pals. Keep all key elements inside the middle 70 percent. Use an energetic teal background with colorful circular game tokens. Minimal vector style, bold edges, clean silhouette, no text, no border, optimized for Android maskable icon crops."

3. Open Graph Image (`1200x630`)
   "Create a vibrant hero banner for a casual kids mobile game named PopSprint Pals. Scene: colorful floating game tokens, soft sky gradient, playful energy lines, simple sparkles, and a mobile phone silhouette showing a color-match tap game. Add headline text: PopSprint Pals. Subtitle text: Fast one-tap fun for kids. Friendly, bright, safe, global appeal."

4. Store Screenshot Frame (`1242x2688`)
   "Create a polished app store screenshot for a portrait kids game UI. Show a gameplay scene with a target color badge at top, score/time cards, and floating colorful circles to tap. Add a bold caption text at top: Tap the right color. Keep layout clean, high readability, and cheerful colors. No ads in screenshot."

## Manual QA (Mobile)
- Install to home screen and confirm standalone launch.
- Lock and reopen app to verify stable pause/resume behavior.
- Play multiple rounds and verify score, level, mission, and achievement updates.
- Refresh after deploy and verify latest assets and UI are loaded.
