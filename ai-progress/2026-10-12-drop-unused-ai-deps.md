# Drop Supabase / Google AI leftovers

**Goal** — Z.AI (GLM) is the only AI provider, and Supabase was never wired up. Remove the dead references so the dependency list and env match reality.

**Done**
- Audited every dependency for actual imports: `@anthropic-ai/sdk` 0, `@google/generative-ai` 0, `framer-motion` 0, `@react-three/drei` 0. Uninstalled all four.
- Remaining deps: `@react-three/fiber`, `@types/three`, `convex`, `next`, `react`, `react-dom`, `three`.
- Removed `GOOGLE_AI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.
- Rewrote the stale Supabase comment on the lead-route rate limiter to point at Convex.
- Committed the regenerated `convex/_generated/api.d.ts` (picks up the `analytics` module).
- Verified: lint clean, build compiles, 66/66 vitest pass.

**Why** — Four unused packages (two of them AI SDKs for providers we don't use) were misleading about the stack and carried install weight for nothing. Nothing imported them, so removal is zero-risk.

**Decisions**
- Z.AI is the sole AI provider; no second provider kept "just in case". Scripted fallback still covers an outage.
- Rate-limit state stays per-instance. `ponytail:` ceiling noted in the comment — move to Convex only when it needs to hold across instances.

**Next**
- Real testimonials (section renders nothing in production while all entries are placeholders).
- Privacy policy — the consent banner has nothing to link to.
- `NEXT_PUBLIC_SITE_URL` not yet set on Vercel.
- Still deploying from a local working tree on `feat/initial-setup`.
