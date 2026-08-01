# Plugabyte — Website & Automation Build Plan v2

**Positioning:** Plugabyte builds the part that stays up.
**Headline:** The demo was the easy part.

Changed from v1: the site now leads with **build** work across six types, not integration alone. Integration is one branch. The stack mapper is demoted from front door to conditional step, because a founder with nothing built has nothing to map.

See `plugabyte-brand-guidelines.md` for colour, type, voice and ghost rules.

---

## 0. Prerequisites (documents, not code)

Everything computes from these. Phase 2 is blocked until they exist.

| Artefact                   | Contents                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service catalog**        | The six build types, and an explicit not-us list. Grounds the agent so it cannot promise work you don't do.                                  |
| **Effort library**         | Base effort in days per primitive — see below.                                                                                               |
| **Complexity multipliers** | No public API, poor data quality, >2 approval humans, legacy/on-prem, hard external deadline, regulated data, live system requiring cutover. |
| **Rate card**              | Internal only. Never on the site.                                                                                                            |

**Effort primitives must span build work, not just connectors:**

- Screens / views
- Auth and permission model (by role count)
- Data model complexity
- Admin surface
- Mobile vs web vs both
- Third-party dependency count
- Per-connector integration
- Data migration per 100k records
- Approval workflow
- Monitoring and alerting setup
- **AI-specific:** eval harness, prompt/version management, human handoff path, cost modelling at volume, grounding and containment

The site quotes **effort in weeks only**. Pricing happens in the call.

---

## 1. Offers

**Ladder:** Discovery spike (1 week, fixed scope, proves the hard part) → Build → Harden & run.

**Named entry points on the site:**

1. **Prototype rescue** — highest-intent lead available. These buyers have spent money and failed, know exactly what hurts, and hold budget authority.
2. **Build** — any of the six types.
3. **Discovery spike** — the low-friction first transaction.

---

## 2. Architecture: the ghost is the landing page

**The home page is not a page. It is the agent.** One locked viewport, the 3D mark centre-stage, a single question, and a text field. No nav bar, no hero copy stack, no feature grid competing for the click. The scoping conversation _is_ the front door — `/scope` no longer exists as a separate destination.

**The whole conventional site lives beneath it, reached by scroll.** The landing screen occupies `100vh` and does not scrolljack; scrolling simply moves past it into a normal, indexable site. The mark docks to a small corner element as you go, and remains a persistent way back into the conversation from any depth.

```
100vh   [ ghost · one question · one field ]      ← the product
        ──────────── scroll ────────────
  ↓     proof strip · shipped, capacity, where you are
  ↓     six build types
  ↓     teardowns
  ↓     integration pairs
  ↓     about · contact · legal
```

This resolves three problems at once: one undiluted CTA, an escape hatch for people who won't chat first, and real indexable content on the root URL.

### Landing screen spec

**The question: “What are you trying to ship?”** Open to any build type, outcome-framed, and it earns the _demo was the easy part_ line that follows.

**Progressive disclosure.** The ghost is large and centred at rest. On the first answer it scales down and moves up-left, handing the floor to the conversation. The star recedes as the work begins — this transition is the signature moment and should be the most carefully tuned thing on the site.

**First paint must not wait on WebGL.** Ship the 2D SVG mark and a working input field in the initial HTML; the 3D scene replaces the SVG once initialised, and if it never does, nothing is lost. The field is usable before the canvas exists.

**Idle behaviour.** At rest the mark breathes and the eyes track the cursor — that alone is the hook, and it costs nothing. After ~15s of no input, one cycle of `pb-wave` (the approved "notice this" state). Never `pb-windmill` while idle; spin only when work is real.

**Cold start.** The placeholder rotates through real, specific examples drawn from shipped work. This does double duty: it prompts a blank mind _and_ proves the work exists. Generic placeholders waste the highest-attention pixel on the site.

**Set the expectation up front.** "About four questions, then you get effort in weeks." Reduces bounce more than any persuasion copy.

**Say where the input goes.** One quiet line near the field. People are about to describe their business; the absence of that line is louder than its presence.

**Mobile is a different layout, not a narrower one.** On input focus the keyboard takes roughly half the viewport, so the mark collapses to a small fixed header element and the thread gets the remaining space. Full-stage ghost returns on blur.

### Depth: how services are reached

Two routes, both downstream of engagement rather than competing with it:

1. **Scroll** — the conventional site under the fold, for people who won't talk to an agent first.
2. **The spec artifact is the hub.** Once a spec exists, it links only to what's relevant to that scope: rescue triage for a broken prototype, the matching integration pages, the teardown closest to their build. Service pages are reached through relevance, not through a nav bar.

### Rescue (`/rescue`)

Production-readiness triage: auth, secrets, error states, rate limits, data integrity, observability, behaviour at 100× volume. For AI builds, add the five-item credibility set.

### Work (`/work`)

Teardowns — real builds, ugly parts included. **Must span the range at launch: one product build, one AI agent, one integration, one rescue.** Four minimum. All-plumbing teardowns re-narrow the positioning you just widened.

### Integrations (`/integrations/[tool-a]-[tool-b]`)

~20 tool-pair pages you genuinely know. What's possible, what breaks, effort band. Generating hundreds makes you the slop you're positioning against.

### Spec (`/spec/[id]`)

Persistent, shareable, versioned artifact page. Never gated on return visits.

### About

Short, first person, named. What I shipped before, and how handover works — the bus-factor question answered before it is asked. Founders buy specific people.

---

## 3. The estimator

### Architecture — the load-bearing decision

- The model does **extraction only**: `build_type`, `systems[]`, `dependencies_available`, `screens_est`, `roles[]`, `ai_surface`, `unknowns[]`, `timeline_weeks`, `approval_humans`, `prior_attempts`, `owner_role`.
- **Code computes effort** from the effort library.

Consequences: identical descriptions return identical numbers, arithmetic is defensible in the call, changing the library re-costs every open spec for free, version diffs are deterministic with no model call, and the expensive turn only does extraction.

### Question flow

1. **What are you building?** → six types, branches everything downstream
2. Branch-specific scope questions (screens/roles for product; systems for integration; agent surface and volume for AI)
3. Dependency access — do the things you need to reach have APIs
4. Approval humans in the loop
5. Deadline
6. Prior attempts

### The mapper, demoted

When the answer implies existing systems, the stack mapper appears **inside** the flow, rendered in the ghost's place while it's relevant: tap your tools, see the broken edges. Still zero LLM calls — fixed taxonomy, deterministic gap detection. Still captures exact stack without asking a question. Just no longer the entry point.

### The free-text problem — the real design work

Chips are easy. The hard case is someone pasting two paragraphs of context that don't map cleanly to a build type. That path needs deciding before launch:

- Extract what's there, state the reading back plainly, and ask only about what's genuinely missing — never re-ask what they already told you.
- When the description spans two build types, say so and ask which matters first rather than silently picking one.
- When it's too vague to classify, ask for the outcome rather than the technology: what should be true after this ships that isn't true now.
- Cap the clarification loop at two turns. A third means offering the call instead.

### It must be able to disqualify

"Two systems with APIs and one approver — this is a weekend on an off-the-shelf tool, not an agency engagement." Strongest trust signal available, keeps the pipeline clean, and it's the most screenshottable thing you can publish.

---

## 4. The artifact

Identity: `PB-0147 · Order sync · 6–9 weeks · 4 systems · 2 unknowns`

Contents: tiers (Slice / Build / Platform) with weeks each, **explicit assumptions in the same view as the number**, "what drives this number", risks, what Plugabyte needs from them, recommended sequence.

**For AI builds, the five credibility items appear as their own line items with weeks against them.** This is the single most differentiating thing in the product — it demonstrates you've shipped one of these.

- Effort never appears without its assumptions.
- Non-binding language.
- Live URL, versioned. Reopening, sharing, OG rendering invoke nothing.
- Export as Linear/Jira tickets.
- **Scheduling widget in the footer**, not a link out. Real Google Calendar availability, the spec URL attached to the event, booked without leaving the conversation.

**Share mechanics:** auto-generated OG image of the spec or stack map, failures in Bolt Red. A "we told them not to hire us" badge for disqualified scopes.

---

## 5. WhatsApp channel

Same extraction schema, same effort engine, different transport. Large friction drop in MENA and it demos the capability in the medium you sell it.

- Session continuity keyed to phone number; a web-started spec continues on WhatsApp.
- Inbound sessions cheap for 24h; business-initiated templates bill per message. Batch re-engagement, and make every message carry real news — a version diff worth reading, never a check-in.

---

## 6. Internal automations

Roughly in build order.

| #   | Automation                    | Trigger → Action                                                                                                                                                                                                                                        |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Lead sync**                 | Spec generated → Supabase row with build type, stack, effort band, unknowns, timeline, prior attempts, channel, and transcript. Managed in the on-site admin panel — no third-party CRM.                                                                |
| 2   | **Intent routing**            | Score on build type + scope + timeline pressure + owner seniority + prior failure. High → personal follow-up. Low → nurture. Disqualified → polite close, no follow-up.                                                                                 |
| 3   | **Spec versioning**           | Effort library changes → re-cost all open specs → flag material changes → queue notification.                                                                                                                                                           |
| 4   | **Version-diff notification** | Material change on a spec >7 days old → "3 things changed since you last looked." Only fires on genuine news.                                                                                                                                           |
| 5   | **Watchlist**                 | "What I need isn't viable yet" → capture, notify when it is.                                                                                                                                                                                            |
| 6   | **Weekly transcript digest**  | Cluster by build type, requested capability, drop-off point. This is your market research — repeats become fixed-price packages.                                                                                                                        |
| 7   | **Abandonment tagging**       | Log the turn people leave on. Fix the question losing them.                                                                                                                                                                                             |
| 8   | **Teardown pipeline**         | Build completed → prompt for notes → draft → publish to `/work` + ticker. Keeps proof from drying up, and keeps the mix spanning all build types.                                                                                                       |
| 9   | **Availability + booking**    | Google Calendar free/busy → in-conversation scheduling widget, shown only after a spec exists. Booking writes the event, invite, admin lead/booking row and spec link in one action. Private concurrency cap so it never sells time that doesn't exist. |
| 10  | **Cost guardrails**           | Daily ceiling → degrade to plain form, not an error page. Alert on anomalous usage.                                                                                                                                                                     |
| 11  | **Tool-pair refresh**         | Connector capability change → flag affected `/integrations` pages for review.                                                                                                                                                                           |
| 12  | **`curl` endpoint**           | `curl plugabyte.com/effort -d "..."` → JSON effort estimate. Hash-cache normalized input, hard rate limit. An afternoon's work, high flex with technical founders.                                                                                      |

---

## 7. Cost and abuse controls

Per-conversation cost is cents. The risk is _unbounded_ usage on a public endpoint — so spend engineering on caps, not token shaving.

- Prompt-cache the catalog and effort library. Biggest single lever.
- Cap turns at 6–8. Tighter artifacts anyway.
- Cap `max_tokens` per turn. Streaming is free; speed is an aesthetic.
- Email gate before final spec generation — puts the expensive call behind a captured lead.
- Rate limit per session and IP; heuristic junk filter before the model.
- Keep the system prompt boring. It's public; people will try to make it say things for a screenshot.
- Retrieval strictly over your own catalog. The agent cannot invent capabilities.
- All ghost states and counters are computed client-side from the returned object. Zero model cost for the entire expressive layer.
- **Tier the models.** Cheap fast model for URL fetch, summarisation and classification; the capable model only for extraction on turns that need it. Effort computes locally regardless, so model choice never moves a number.

---

## 8. Build phases

**Phase 1 — The screen and the site under it (~2–3 weeks)**
Landing viewport with the 3D mark, SVG-first paint, one question, working field. Scroll-reveal site beneath: proof strip, six build types, four teardowns spanning build types. Field posts to a plain form for now — no LLM yet. Ships credibility and starts capturing intent immediately.

**Phase 2 — The conversation (~3 weeks)**
Extraction schema, effort engine, free-text path, chip fallbacks, motion states wired to real signals, live counters, spec artifact with live URL, AI line items, email gate, cost guardrails. Mapper as conditional step.

**Phase 3 — Distribution (~2 weeks)**
WhatsApp channel, OG share images, versioning + diff notifications, on-site admin panel for leads, intent routing.

**Phase 4 — Compounding**
Rescue triage, 20 tool-pair pages, ticket export, watchlist, teardown pipeline, `curl` endpoint.

---

## 9. What to measure

- Share rate on artifacts
- WhatsApp reply rate on the second message
- Unprompted returns to a spec link
- Abandonment turn distribution
- Disqualification rate — if it's zero, the agent isn't being honest
- Build-type mix, to check the widened positioning is actually landing
- Spec → call → spike conversion
- **Engagement rate on the field** — what share of landings type anything at all. This is the single number that says whether the ghost-as-interface bet worked.
- **Scroll-past rate** — what share skip the conversation entirely for the site beneath. If it's high, the question is wrong, not the concept.

**Not** time on site. Founders don't want a destination, they want a vendor.

---

## 10. Deliberate exclusions

Cost-of-manual-work calculators. Manufactured scarcity or a published queue, since capacity can expand. Gamification of any kind. A talking mascot. Any price on the site. Competitor names — punch at the outcome, never at the tools your buyers used. Mass-generated pages.

---

## 11. Decisions, resolved

| #   | Decision          | Resolution                                                                                                                                                                                            |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Brand line        | **v2.1 positioning is the top-line.** The old "connects the tools a team already runs" line is superseded, not preserved as a parallel message. Normal iteration; no dual-positioning.                |
| 2   | Team              | **Solo, expanding.** Named individual on About, first person throughout. See §12.                                                                                                                     |
| 3   | Discovery spike   | **One week, fixed scope, fixed fee.** See §12 for the pricing logic.                                                                                                                                  |
| 4   | Data              | **Supabase.** Postgres with RLS; see §12 for region and retention.                                                                                                                                    |
| 5   | Rescue entry      | **Conversation only.** No code upload, no repo scan as an entry step. Scheduling widget in-conversation, backed by Google Calendar.                                                                   |
| 6   | Capacity          | **No scarcity line.** Capacity can expand, so a published queue would be false. Honest omission beats manufactured urgency — and it's what the Honest pillar requires.                                |
| 7   | Over-index on     | **AI agents** and **automations & integrations.** See §12 for reasoning.                                                                                                                              |
| 8   | The question      | **"What are you trying to ship?"** Open to any build type, outcome-framed, ties to _the demo was the easy part_. Rejected "What keeps not shipping?" — presumes a stuck project and narrows the door. |
| 9   | URL on first turn | **Accepted.** Fetched and summarised by a cheap fast model before extraction. See §13 — this one carries a real security requirement.                                                                 |

---

## 12. Consequences of those decisions

### Solo (2)

- **First person, always.** "I build…" not "our team". A named person is a differentiator against faceless agencies, and the Honest pillar makes "we" actively off-brand for a one-person shop. Switch to "we" the day there's a second person, not before.
- **The bus-factor question will come up** in every serious conversation. Answer it on the About page before it's asked: documentation and handover are part of every build, and the client owns the repo and the infrastructure from day one. That turns the weakness into a process claim.
- **Constrain concurrency privately, not publicly.** Track real availability in the routing logic so the scheduling widget doesn't sell time that doesn't exist.
- **Depth beats breadth in proof.** Four teardowns written well outperform twelve thin ones, and a solo shop can actually produce four.

### Discovery spike (3)

One week, fixed scope, fixed fee, delivered as a working spike plus a written finding — not a slide deck. Price it as a real fraction of a build week rather than a loss-leader: a spike priced near zero signals the week is worth near zero, and it attracts people who were never going to buy. High enough to filter, low enough to be an easy yes without procurement. Benchmark it against a week of your build rate for the UAE market and set it deliberately; it's a positioning decision as much as a pricing one.

### Supabase (4)

- **Postgres + RLS.** Tables: `sessions`, `turns`, `specs`, `spec_versions`, `stacks`, `leads`, `bookings`, `effort_library`.
- **The effort library lives in the database, not in code.** That's what makes re-costing every open spec a data change instead of a deploy.
- **Region matters.** Buyers are UAE/KSA; pick the closest region and state it in the privacy note. Some enterprise buyers will ask.
- **Retention policy, written down.** Transcripts contain competitively sensitive business detail. Set a retention window, honour deletion requests, and say so near the input field — the absence of that line is louder than its presence.
- **pgvector is already there.** Useful later for semantic retrieval over past specs and teardowns; not needed for launch.

### Scheduling in-conversation (5)

- Availability widget appears **after** the spec exists, never before — the spec is the agenda for the call.
- Google Calendar as source of truth. Real free/busy, buffers either side, a daily cap, and a cutoff so nothing books within a few hours.
- **Timezone is a real trap.** Default to the visitor's detected zone, display both theirs and GST, and confirm in the booking email.
- Booking creates the event, the invite, and the lead/booking row in Supabase (visible in the admin panel) in one action, with the spec URL in the event description.
- Cancellation and reschedule links in the confirmation. A dead-end booking is worse than no booking.

### Over-indexing on AI agents + integrations (7)

Chosen for demonstrable proof rather than market size. You have production AI agent experience — a live WhatsApp bot at real volume, prompt versioning, evals, escalation paths — and deep integration work across CRM platforms, MySQL and AWS. Those two are the only categories where you can write teardowns with specifics today, and specifics are the entire credibility argument.

Internal tools is the natural upsell from either and needs no separate push. Product builds stay supported but shouldn't lead — the competition there is every agency on earth, and you have no differentiating proof yet.

---

## 13. The URL path (9)

A cheap fast model (Gemini Flash Lite or equivalent) fetches and summarises a pasted URL, then hands structured notes to the extraction model. Effort still computes locally.

**This is the only place in the product that processes untrusted third-party content, and it needs treating as such:**

- **Prompt injection is a live risk.** Fetched page text can contain instructions aimed at the model. Pass it in as clearly delimited data, never as instructions, and give the summariser a narrow job with a fixed output shape — nothing that can be talked out of.
- **Never let fetched content influence effort, pricing, or the disqualification decision.** Those stay in local code, immune to whatever a page says.
- **Fetch only public URLs.** No auth-walled pages, no private repos, no internal hosts. Block private IP ranges and localhost explicitly.
- **Cap and cache.** Size limit on the fetch, timeout, cache by URL hash, hard rate limit per session. Most pastes will repeat.
- **Strip before summarising.** No scripts, no hidden text.
- **Say what happened.** "I read your landing page" — never silently absorb a URL. Show the reading back so a wrong interpretation is correctable.
