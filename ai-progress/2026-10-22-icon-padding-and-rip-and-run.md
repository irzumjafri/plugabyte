# Favicon optical padding and Rip and Run rename

## Goal
1. Scale down and center the favicon mark inside its canvas with safe-area padding so that circular masks (like Google Search) render it cleanly without clipping the dome or bolt.
2. Update the in-development product card from "Invincible XI" to "Rip and Run".

## Done
- Updated `src/app/icon.svg` with `scale(0.7)` and `translate(38.2, 27.4)` inside the `132x132` viewBox, providing ~27px clearance at the top and ~12px below the bolt, centering the blue ghost mass horizontally and vertically.
- Regenerated all raster fallbacks (`public/icon-48x48.png`, `public/icon-192x192.png`, `public/icon-512x512.png`, `public/favicon.ico`, `src/app/favicon.ico`, `src/app/apple-icon.png`, and `public/apple-touch-icon.png`).
- Renamed `Invincible XI` to `Rip and Run` (slug: `rip-and-run`) in `src/lib/projects.ts`.
- Verified clean build and TypeScript check via Turbopack.

## Why
- In Google Search results, Google masks favicons into a white circular frame. The unpadded mark filled the full bounding box from y=0 to y=132, causing the top dome to scrape the circle boundary and pushing the center of mass uncomfortably high.
- Product branding was updated to "Rip and Run".

## Decisions
- Kept 0.70 scale which preserves sharp definition at 16px/48px sizes while providing comfortable circular safe-area margins.
- Kept the artwork screenshot `/work/invincible-xi.jpg` referenced by `image` while updating public-facing titles and slugs.

## Next
- Commit changes and deploy to production via Vercel.
