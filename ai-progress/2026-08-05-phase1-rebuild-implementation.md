# 2026-08-05 — Phase 1 rebuild implementation

## Goal

Implement the Phase 1 design spec (`docs/superpowers/specs/2026-08-01-phase1-agency-rebuild-design.md`): replace the generic AI-agency scroll journey with a ghost-first landing, a deterministic scoping chat, brand-aligned copy/tokens, and the supporting stub routes.

## Done

- Removed off-brand/off-spec code: `Hero`, `Services`, `ScrollExperience`/`ScrollScene`, `GetStartedDrawer`, `ThreeCanvas`, `/app/plan`, `/api/plan` (LLM route), and the old `Contact` form (duplicated the chat's lead capture with off-brand copy).
- Ported `Plugabyte prototype directions/estimator-engine.js` → `src/lib/estimator.ts` (typed, pure functions — build types, classification, branching, disqualification, effort, spec id). Added Vitest + `src/lib/estimator.test.ts` (17 tests, all passing).
- Ported `ghost-3d.js` → `src/components/Ghost/` (`GhostSprite` SVG first-paint, `GhostScene` R3F port using installed `@react-three/fiber`/`three` deps instead of a runtime `esm.sh` import, `Ghost` composing both with crossfade + imperative `setLookAt`/`playWave`/`playThinking`).
- Built `src/components/ScopingChat/ScopingChat.tsx` — the deterministic chat state machine (hero → chat → done), chips + free text, ambiguous/vague clarification cap (2 turns → offer call), disqualification (Bolt Red badge), email-gated lead submission, confirmation popup, `initialType` prop for preselection.
- Rebuilt `/` (`src/app/page.tsx` + `src/components/Home/*`): 100vh ghost landing (no nav) → sticky `Navbar` → proof strip → six build types (`Start here` seeds the chat) → teardown teaser → rescue/about teaser → `Footer`. Reads `?type=` search param server-side to preselect a build type.
- Rebuilt `Navbar`/added `Footer` in brand tokens; removed the drawer-based "Get Started" in favor of scrolling to / focusing the landing chat.
- Added `/work` and `/rescue` stub routes (content adapted from `Work.dc.html`/`Rescue.dc.html`, agency "we" voice). Fixed `/about`'s CTA (pointed at the removed `/plan`) and rewrote its CSS module from the old cyan/purple template palette to brand tokens.
- Applied brand v2.1 tokens: `src/app/globals.css` (Void/Ghost/Bolt palette, text scale, `pb-*` keyframes), `layout.tsx` (Nunito/Space Grotesk/JetBrains Mono via `next/font/google`, positioning-line metadata).
- Created `design/` brand kit: `tokens.css`, `ghost-mark.svg`, `wordmark.svg`, `README.md`.
- Extended lead capture: `supabase-leads-v2.sql` (build_type/answers/effort band/channel/session_id columns), `/api/lead` widened payload + honeypot + best-effort per-IP rate limit (5/10min, in-memory — noted as a Phase 1 stopgap, not a distributed limiter).
- Made `src/lib/supabase.ts` lazily instantiate the client (`getSupabaseAdmin()`) — the previous eager `createClient` at module scope broke `next build` without real credentials.
- Verified: `npm run lint` clean (added an eslint ignore for the untracked prototype reference folder), `npm run build` succeeds, `npm run test` (17/17 pass), manual dev-server pass on `/`, `/about`, `/work`, `/rescue`, `/?type=rescue`, and `/api/lead` (missing-email 400, honeypot silent-200, rate-limit 429 after 5, unconfigured-Supabase 500) — no server errors or warnings in the log.

## Why

The previous implementation had drifted from the locked design spec (see `2026-08-01-phase1-agency-rebuild-design.md` and the review earlier in this session) — it shipped a generic scroll journey plus an LLM-backed chat drawer, neither of which matched the ghost-first/deterministic-chat architecture the spec calls for, and it carried an unrate-limited public LLM endpoint.

## Decisions

- Ghost 3D geometry ported into `@react-three/fiber` primitives rather than kept as a raw-`three`-via-CDN module — the deps were already installed, no reason to fetch from `esm.sh` at runtime.
- Dropped the old `Contact` component entirely instead of keeping it alongside the chat — it was non-functional (client-only `setSubmitted`, no backend call), off-brand copy, and fully redundant with `ScopingChat`'s email-gated lead flow.
- `supabase.ts` changed from an eager module-scope client to a lazy `getSupabaseAdmin()` getter — needed so `next build` doesn't require secrets just to collect page data; this is a build-robustness fix, not a scope change.
- Rate limiting is in-memory/per-instance, explicitly flagged in code comments as a Phase 1 stopgap per design spec §9 — real distributed limiting is future work, not blocking Phase 1.
- Disqualified leads are shown the reason but not asked for contact info / not persisted — matches the locked "no follow-up" decision for disqualification.

## Next

- Run `supabase-leads.sql` then `supabase-leads-v2.sql` against the real Supabase project, and set `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` before this can capture real leads.
- Visual QA in an actual browser (ghost 3D crossfade, mobile keyboard-focus collapse, wave/thinking states) — this session verified via lint/build/tests/curl/dev-server-log, not a real browser.
- Phase 2 per the build plan: LLM extraction, `/spec/[id]`, WhatsApp channel, booking, `/integrations` pages, admin panel.
