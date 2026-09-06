# Convex backend, and the scoping chat rebuilt as a conversation

## Goal

Move off Supabase to Convex as the single backend for everything — leads, chat
transcripts, events, statistics — running locally first. Then fix the chat: the
follow-up questions were wrong on all four counts Irzum picked (too much
qualifying, too many, too form-like, wrong subjects). And never tell a prospect
not to hire us.

## Convex

Set up **locally with no account**: `CONVEX_AGENT_MODE=anonymous npx convex dev`
runs a backend on 127.0.0.1:3210. Nothing was signed up for; moving it online is
Irzum's to do.

Three tables in `convex/schema.ts`:
- `leads` — a submitted brief. The only place contact details exist.
- `chatSessions` — every conversation, **including the ones nobody submits**.
  Those never reached Supabase at all, and they are where the funnel's drop-off
  is actually visible. Anonymous: session id only, no contact details.
- `events` — the raw stream: funnel steps, outcomes, failures.

`stats:funnel` answers the first questions an on-site admin will ask
(conversations / reached estimate / submitted / abandoned / by build type).

Supabase is gone entirely — package, `src/lib/supabase.ts`, all three SQL files.

**Verified with real data, not mocks.** A posted lead landed in `leads` with its
spec id; a browser run wrote five `question_answered` events, a `disqualified`
event and the full transcript; `stats:funnel` returned
`{conversations: 2, reachedEstimate: 1, submitted: 1, abandoned: 2}`.

Two rows in the local DB are mine from verification: `verify@example.test` and
session `smoke-session-1`.

## Never tell them not to hire us

The disqualify path showed a red "We told them not to hire us" badge and offered
only "Start over" — a dead end for someone we had just proven our honesty to.
Now: a calm "You could do this one yourself" note, a message that says plenty of
people get there themselves on Zapier/Make/n8n **and that we would happily take
it on**, and the contact form right there under "Want us to take it on anyway?".

Its copy was also wrong: it said "Two systems with APIs" while the rule fires on
"Just one" too, so a one-system prospect was told they had two. Jargon removed.

## The conversation

Rebuilt around asking about the business and inferring the rest:

- **Procurement questions are gone.** Sign-off, deadlines and prior attempts are
  never asked — they made us sound like we were qualifying them. They are
  assumed instead, and the assumption is shown.
- **Four questions maximum**, usually two or three.
- **It reacts before it asks.** Each turn may carry a `reflection` — one clause
  showing it understood — which lands as its own message before the question.
- **It infers scoring values** from what it hears (`inferred`) instead of asking
  for each one.

Live, from "our claims process is all spreadsheets and three people email each
other about it":

    Where does it hurt most — things getting lost in the emails, or just the
    time it all takes?
    > Lost or duplicated claims means no single source of truth.
    When a claim moves through the process, what has to happen at each step?
    > A fixed process makes this straightforward to track in one place.
    Roughly what needs to be on screen?

Three questions, zero jargon, zero procurement, correctly classified as an
internal tool.

### The money problem this created

`computeEffort` only ever *adds*, so every unasked field made the build look
cheaper. Fewer questions would have quietly under-quoted every job.

`fillUnknowns` fills anything the conversation never established with mid-range
values — not optimistic ones — and returns an assumption line for each, which is
appended to what the reader sees. A test asserts a filled estimate is never lower
than the equivalent asked one.

### Guards, rebalanced

Bespoke questions are now the design, so the "catalogue fields only" rule is
gone. The protection moved to where it belongs: `scoringValues` accepts an
inferred value only if it is an exact allowed string **and** belongs to this
build type — `computeEffort` bumps on `screens` for every type, so an inferred
screen count on an AI agent would have inflated the number. Repeat detection (by
field id and by question text) and the question cap stay.

## Note

We now store transcripts from people who never submit. They are anonymous, but
the privacy line says "if you send it to us, we keep the brief" — which is no
longer the whole truth and should say so.

---

## Update — site-wide page views, and one shared session

Every page now records a `page_view` into Convex: path, document title, and the
referrer on the first page of a visit.

`PageViews` is a client component in the root layout keyed off `usePathname`,
because the App Router does not remount the layout between routes — a mount-only
effect would have recorded the first page of a visit and nothing after it. It
also ignores a repeat of the same path, since React runs effects twice in
development and every figure would otherwise be doubled.

### One session id, not two

The chat was minting its own `crypto.randomUUID()`, so its funnel events could
never be joined to the page views from the same visit. Both now use
`getSessionId()` — one id per tab in `sessionStorage`, with an in-memory
fallback because private mode can refuse storage. Verified: page views for
`/`, `/rescue`, `/about`, `/work` and a `chat_started` all carried the same id.

### The gap this exposed

`chatSessions` was empty after starting a chat, because the transcript was only
written when a question was *answered*. Anyone who opened the chat and left at
the first question left no transcript — the earliest and most common drop-off
was the one we could not see. The snapshot now runs as soon as a question is on
screen.

Confirmed: abandoning at question one records the conversation, the build type
it had inferred and the exact question they were looking at, and `stats:funnel`
counts it as `conversations: 1, reachedEstimate: 0, abandoned: 1`.

### Test rows

The cloud deployment holds my verification data: a `cloud-check@example.test`
lead plus the page-view/chat rows from these checks.
