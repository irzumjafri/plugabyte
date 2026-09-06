# AI-driven scoping chat (Z.AI / GLM), autoscroll fix

## Goal

Two asks: the chat thread didn't follow new questions, and the fixed question
list should be model-driven instead.

## Done

**Autoscroll.** `.messages` is a 44vh scroll box and nothing scrolled it, so from
about the fourth exchange the newest question sat below its own fold and the
conversation looked stalled. Scrolls the box (not `scrollIntoView`, which would
drag the whole hero) on new message / step / thinking, honouring
`prefers-reduced-motion`.

**AI conversation, deterministic number.** Irzum chose: the model runs the
interview, `computeEffort` still produces the weeks. So a client is never quoted
a timeline a model invented, and two identical briefs still size the same.

- `src/app/api/scope/route.ts` — server-side call to Z.AI. OpenAI-compatible, so
  plain `fetch`, no new dependency. `glm-4.6`, `response_format: json_object`,
  12s timeout, transcript capped.
- `src/lib/scopeReply.ts` — the prompt and, more importantly,
  `validateScopeReply`. Model output is untrusted input.
- `ScopingChat.tsx` — asks the route for each next step; the opening free text
  now goes to the model instead of keyword matching.

## The bit that matters: values, not just shape

`computeEffort` matches exact strings — `'2–3'`, `'1,000+/day'`, with en-dashes.
A model that answers "two or three" would look plausible and score as nothing,
silently under-estimating the build. So:

- the route sends the model the field catalogue with its allowed answers;
- canonical options always override whatever the model echoes back;
- on `done`, any value not in the allowed list is **dropped** rather than stored.

Tests pin this, including the hyphen-vs-en-dash case that would actually happen.

## Fallback is not optional

No key, timeout, non-JSON, or a reply that fails validation all return
`{status:'unavailable'}` and the client falls back to the scripted branch
permanently for that session. This keeps the design doc's success criterion —
"complete a scoped conversation and leave a lead without LLM" — literally true,
and is why the site still works locally with no key.

## Verified

- Fallback with no key: `/api/scope` → `unavailable`, 7 scripted questions,
  estimate reached. No regression.
- AI path, stubbed at the network boundary: opening free text goes to the model;
  `ask` with options renders canonical chips; `ask` without options renders a
  text input and stores the answer (sent back as `payment_provider: "Stripe"`);
  `done` produced **7–9 weeks**, exactly `computeEffort('rescue', {systems:'4 or
  more', apis:'No', approvers:'3 or more'})`. The model picked the path, the code
  produced the number.
- Autoscroll: `scrollTop` tracks `scrollHeight - clientHeight` on every question.

## Not verified

**No live call has ever been made** — there is no `ZAI_API_KEY` here. Everything
up to the network boundary is tested; the real model's adherence to the JSON
contract is not. Set `ZAI_API_KEY` (now in `.env.local.example`) and walk the
chat to confirm.

## Flag

This contradicts the canonical Phase 1 design
(`docs/superpowers/specs/2026-08-01-phase1-agency-rebuild-design.md`), which
scopes LLM work to "Phase 2+" and states Phase 1 is deterministic. Irzum approved
the change knowingly; the spec is now stale and should be updated so a future
session doesn't "fix" this back out.

## Cost

One API call per question, ~5-7 per completed conversation, plus one per
free-text turn. Nothing caches.

---

## Update — key added, and the bug it exposed

Irzum added `ZAI_API_KEY`. The live call still returns `unavailable`, and the
server log gives the real reason:

    Z.AI error: 429 {"error":{"code":"1113","message":"Insufficient balance or
    no resource package. Please recharge."}}

The key is valid; the Z.AI account has no balance. Nothing to fix in code — but
running against a *failing* live key exposed a genuine bug the earlier stubbed
tests missed.

### Bug: free text + unavailable AI produced a spec with no build type

Reproduced: typing an opening message (rather than clicking a build-type chip)
with the AI unavailable gave `PB-SR2W3S · · 4–6 weeks` — no questions asked,
blank type, and a band invented from `BASE_WEEKS[null] ?? 4`.

Cause: on AI failure `askNext` rebuilt the scripted queue only
`if (buildTypeRef.current)`. Coming from free text there is no type yet, so the
queue stayed empty, `askNext` fell through to `finish()`, and `finish` ran on
`buildTypeRef.current!` — a non-null assertion that was simply false.

The earlier fallback test passed because it clicked a chip first, which sets the
type. The chip path and the free-text path fail differently, and only one was
covered.

Fixed in two places:
- `askNext` now classifies the last user message when the AI drops out before a
  type is known, instead of finishing with nothing.
- `finish` refuses to build a spec without a build type and offers a call
  instead. A blank type with an invented band is worse than admitting we could
  not classify it.

`classifyRef` / `offerCallRef` hold those callbacks because `askNext` is
declared above them; a ref avoids capturing a stale render's copy.

### Re-verified (AI unavailable, i.e. today's real state)
- Free text → "Got it — Prototype rescue" → 6 questions → `PB-Y10M0S ·
  Prototype rescue · 2–4 weeks`.
- Chip → 7 questions → `PB-ESGFSX · AI agent · 7–9 weeks`.

### Still unverified
The AI path against a *funded* account. Everything up to the model's reply is
now exercised against the real endpoint (auth, transport, error handling); the
model's adherence to the JSON contract is not.

---

## Update 2 — live and working on the Coding Plan

### Endpoint: the Coding Plan is a different base URL

`1113 "Insufficient balance"` on a valid key was not a billing problem. The GLM
Coding Plan is served from **`/api/coding/paas/v4`**, not the standard
`/api/paas/v4` — the standard path bills against pay-as-you-go credits the
account doesn't have. Confirmed by calling both directly with the same key.
Base URL and model are now `ZAI_BASE_URL` / `ZAI_MODEL` overridable.

### The plan routes to a reasoning model

The response comes back as `glm-5.3-flash` whatever model is requested, and it
is a reasoning model: with `thinking` left on, the whole token budget went to
`reasoning_content` and `content` came back **empty**, which our code correctly
read as a failure. Fixed with `thinking: {type:'disabled'}` and an explicit
`max_tokens`. This work wants a small JSON object, not deliberation.

### Root cause of "the AI only answers the first question"

Symptom looked like duplicated questions. It was not. The log gave it away:

    Z.AI returned non-JSON: How many people need to sign off before this ships?

The model obeyed the JSON contract on turn one and emitted **bare question
strings** from turn two onwards. Cause was ours: prior questions were replayed
as `assistant` messages in plain prose, so the model saw its own last turn as
unformatted text and copied that shape. Every follow-up then failed to parse and
fell back to the script — and the script restarting is what produced the
"duplicates" being chased.

Fix: the transcript now goes in as a **single user message** ("Conversation so
far: …"), so the model never sees its own prose as an assistant turn. Result:
6 calls, **0 fallbacks**, 5 questions then done.

### Guards kept (all earned by observed misbehaviour, not speculation)

- Repeat by field id — it re-asked `built_with` twice.
- Repeat by question text — it re-asked volume under a new field id.
- Bespoke fields rejected: given the freedom, it twice used it to duplicate a
  catalogue question in its own words. It still chooses which question comes
  next and rewords it, which is where the adaptiveness actually shows.
- `MAX_QUESTIONS` cap — it ran to 10 against a prompt asking for 5-7.
- Mid-conversation fallback now skips already-answered questions instead of
  restarting the branch.

### Verified live
Free text → classified `ai` unprompted → 5 reworded questions, all canonical
fields, no repeats → `PB-2Y03DT · AI agent · 7–9 weeks`, computed by
`computeEffort`, not the model.

---

## Update 3 — live-chat feel, and founder-first language

### Language

The scripted questions were written for someone technical ("Do the systems you
need to reach have public APIs?", "How many distinct user roles need their own
permissions?"). Rewritten in plain business language — prompts only, since ids
and option strings are what `computeEffort` matches on and must not move.

The system prompt now names the audience: assume a non-technical founder, ask
what the thing does and who uses it, and never introduce vocabulary they have
not used (API, endpoint, webhook, schema, backend, deploy). If they use
technical terms first, mirror their level rather than talking down.

Live result, from "we take bookings on whatsapp and my team cannot keep up":

    So the tool would chat with customers on WhatsApp for you?
    Roughly how many of those a day, once it is live?
    How many other tools does this need to work with?
    Does WhatsApp let other software pull the booking details out of it?

Zero jargon, and it opens by reflecting back what they said.

### Live-chat feel

Replaced the static "thinking…" / "computing…" text with an animated
three-dot bubble in bot shape — the universal typing cue — plus a 650ms floor
on how briefly it can show. A reply that lands in 300ms and snaps a question
onscreen reads as a form posting back; holding the dots is what sells "live".
Respects `prefers-reduced-motion`.

### Two estimate-skewing bugs the live runs exposed

`computeEffort` bumps on `screens` for **every** build type, so a `screens`
answer on an AI agent silently adds weeks. The model asked exactly that, twice:

1. Mid-conversation, with the type known — fixed by allowing only the fields in
   that build type's own branch, not the union across types.
2. On turn one, before the type was known — the union was allowed there by
   definition. Fixed with `COMMON_FIELD_IDS`, the intersection across all build
   types, which is the only safe set to ask from before the type is settled.

Neither was visible in the transcript as an error: the question looked
reasonable and the number was simply wrong.

### Also

"About four questions" corrected to "A few questions" — the funnel is 5-7, which
the audit flagged and the AI path confirmed.

Verified live: 7 questions, all valid for the build type, no jargon, no repeats,
`PB-1N88X7 · AI agent · 7–9 weeks`.
