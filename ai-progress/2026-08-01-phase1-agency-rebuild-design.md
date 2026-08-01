# 2026-08-01 — Phase 1 agency rebuild design

## Goal

Clarify and lock a rebuild of the Plugabyte site from a brochure page into a ghost-first agency lead-gen product (Phase 1), including process rules for future AI sessions.

## Done

- Reviewed current Next.js app, `plugabyte-build-plan_1.md`, brand system, and prototype directions (Home A/B, estimator, stubs).
- Brainstormed and locked Phase 1 scope, visual hybrid, chat behaviour, voice, routes, and architecture (rebuild in place).
- Removed Zoho / external CRM from `plugabyte-build-plan_1.md` (and uploads copy); leads → Supabase → future on-site admin.
- Wrote design spec: `docs/superpowers/specs/2026-08-01-phase1-agency-rebuild-design.md`
- Added `ai-progress/` rule to `AGENTS.md` and `CLAUDE.md`

## Why

Current site feels like a simple webpage; brand + build plan describe a scoping-agent front door with scroll site beneath. Phase 1 ships UI + deterministic chat + leads before LLM/spec/admin complexity.

## Decisions

- Phase 1 only (expanded to include deterministic chip chat + effort band, not LLM)
- Visual: Home A ghost-first + Home B editorial below
- Free-text always available; chips are shortcuts
- Agency “we” voice (overrides build-plan solo/first-person)
- Draft teardown/proof copy; thin stubs for `/about`, `/work`, `/rescue`
- Ghost always on-screen and reactive
- No Zoho association; admin panel later on-site
- Approach: rebuild in place on existing Next.js app

## Next

- User reviews design spec
- Write implementation plan via writing-plans skill
- Execute Phase 1: cleanup, ghost landing, chat, scroll site, stubs, `design/` kit, lead API
