# Favicon raster fallbacks and Google search indexability

## Goal
Resolve why Google Search was displaying an old red/coral 5x5 identicon next to `plugabyte.com` instead of the brand ghost mark, generate standard raster and Apple Touch icon fallbacks, and prepare the site for Googlebot-Image re-indexing.

## Done
- Identified root cause of the incorrect icon in Google Search results: Google had cached a pre-existing 5x5 GitHub/host identicon from before the rebuild, and the removal of `favicon.ico` in commit `007879b` left only `icon.svg` with no raster fallbacks (causing direct `/favicon.ico` requests to 404 and leaving Googlebot-Image without a raster fallback).
- Generated multi-resolution `favicon.ico` (16x16, 32x32, 48x48) in both `src/app/favicon.ico` and `public/favicon.ico`.
- Generated 48x48px, 192x192px, and 512x512px transparent PNG icons in `public/` matching Google Search and PWA icon guidelines.
- Generated `apple-icon.png` (180x180) on `#0D131B` solid background in `src/app/apple-icon.png` and `public/apple-touch-icon.png`.
- Updated `src/app/layout.tsx` metadata with explicit `icons` configuration (`icon.svg`, `icon-48x48.png`, `favicon.ico`, and `apple-icon.png`).
- Verified build and TypeScript compilation with `npm run build`.

## Why
- Googlebot-Image requires square favicons (ideally multiples of 48px square) and frequently struggles with SVG-only favicons without raster fallbacks.
- Legacy crawlers, direct browser requests, and link unfurlers check `/favicon.ico` directly at root.
- Apple Touch Icons require an opaque background to prevent iOS from rendering transparent pixels as black.

## Decisions
- Maintained the transparent SVG mark for modern browser tabs that support SVG.
- Backed it with a multi-size `.ico` and a dedicated 48x48 PNG for search engines and crawlers.
- Kept the Apple Touch Icon seated on the brand surface `#0D131B`.

## Next
- Merge and deploy branch to production so live `plugabyte.com` serves the new `/favicon.ico` and raster chips.
- Request re-indexing in Google Search Console via URL Inspection for `https://plugabyte.com/`.
