# Lead capture: stop losing enquiries

## Goal

Site-wide audit first (browser + axe-style a11y + source review), then fix the
bundle Irzum picked: the revenue path. Findings 1, 2, 3 and 5 of the audit.

## Done

**1. The form no longer claims success when the save failed.**
`ScopingChat.tsx` ended `submitLead` with `finally { setSubmitted(true) }` — the
response was never inspected and a thrown fetch was swallowed. Every
rate-limited, offline or misconfigured visitor read "We'll reach out within one
business day" while nothing was stored. Now the response is checked, 429 gets
its own wording, and failure shows an error with a `mailto:` carrying the spec
reference and effort band, so a failed save still has a route to us.

**2. Free-text classification no longer matches inside words.**
`estimator.ts` scored keywords with `t.includes(w)`, so "ret**ai**l",
"em**ai**l" and "det**ai**l" all classified as AI and "r**api**d" as an
integration. Ordinary sentences came back ambiguous, and two ambiguous turns
dump the user into "let's get on a call" — the conversion path collapsing.
Keywords now need a word-boundary start, with real inflections allowed
(`customers`, `integrated`) but not open-ended ones: a trailing wildcard made
"product" match "production", the opposite build type. Short keywords take a
plural "s" only, so "ai" cannot match "aim".

**3. The spec reference is persisted and no longer collides.**
`PB-####` drew from 9,000 values — measured, 2,000 draws produced ~190
collisions — and was never included in the POST at all, so a prospect quoting
"PB-4312" could not be found. Now `PB-` plus 6 Crockford characters (no I/L/O/U,
~1.07e9 space), sent in the payload, stored in a new indexed `spec_id` column
(`supabase-leads-v3.sql`).

**5. API route hardened.** Unguarded `request.json()` returned an opaque 500 on
a malformed body; there was no email validation, no size cap, and the rate-limit
map never evicted dead IPs so it grew for the process lifetime.

## Verified, not assumed

- Both logic bugs were **reproduced** before fixing (ran `classifyFreeText`, drew
  20k spec IDs) and are pinned by tests.
- The submit paths were driven in a real browser with `fetch` stubbed per case —
  failure shows the error and **no** success state and keeps the retry button,
  429 gets its own copy, success still works and clears the error. Stubbing
  meant zero network effect and nothing written anywhere.
- Route rejections tested against the dev server: malformed JSON → 400 (was
  500), missing/invalid email → 400, oversized body → 413.

## Decisions

- Oversized transcripts are truncated, not rejected: a runaway conversation
  should not cost us the lead.
- The ambiguity rule (`second >= top - 1`) was left alone — it is a product
  call, and the boundary fix removes most spurious ambiguity anyway.
- Contact submission was never exercised end-to-end against a real backend;
  Supabase is unconfigured locally and that is a real write.

## Next (audited, not yet fixed)

- Mobile nav is a dead end: header links `display:none` under 640px with no
  menu, and `/about` renders no `<Footer>`.
- 11 a11y violations on `/`: no accessible name on any input (hero placeholder
  rotates every 3.2s), `outline:none` with no `:focus-visible`, contrast 3.04:1
  on placeholders, `<h1>` disappears once the chat starts.
- Copy: `/about` breaks the agency "we" voice with a founder sign-off;
  "About four questions" is really 5–7; the privacy line contradicts what is
  persisted.
