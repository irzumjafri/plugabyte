# Plugabyte Phase 1 — Agency Site Rebuild Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Phase 1 UI + deterministic scoping chat + lead capture + brand kit  
**Approach:** Rebuild in place on the existing Next.js 16 app

---

## 1. Goal

Replace the current brochure-style marketing site with a proper agency front door:

- The **ghost + scoping chat** is the product landing experience.
- A conventional, indexable site lives **under the fold**.
- Leads are captured into **Supabase** for a future **on-site admin panel** (no third-party CRM; Zoho is explicitly out of scope and removed from the build plan).

Positioning (from brand / build plan v2): *Plugabyte builds the part that stays up.* Headline: *The demo was the easy part.*

---

## 2. Decisions locked

| Topic | Decision |
|---|---|
| Slice | Phase 1 focused: UI + deterministic chat + leads; not WhatsApp, booking, LLM extraction, or `/spec/[id]` |
| Visual | Hybrid: Home A ghost-first opening + Home B editorial density below the fold |
| Landing focus | Always ghost-first; “how can I help / what are you trying to ship” |
| Chat | Deterministic chip flow from prototype; free-text always available (user keeps control) |
| End UX | Confirmation popup after email gate + lead save |
| Voice | Agency **“we”** — not solo/named founder (overrides build-plan §12 solo/first-person) |
| Content | Draft plausible teardowns/proof copy; editable before launch |
| Routes | Home full build + thin stubs: `/about`, `/work`, `/rescue` |
| Architecture | Rebuild in place; delete old brochure components |
| CRM | None. Supabase only → later `/admin` |
| Ghost | Always visible and reactive to user actions (never hidden; dock = scale/position only) |
| Process | `ai-progress/` session logs; rule in `AGENTS.md` / `CLAUDE.md` |
| Brand share kit | `design/` folder for client-facing assets |

---

## 3. Product shape

### Home (`/`)

1. **100vh landing** — centred ghost, question “What are you trying to ship?”, free-text field + build-type chip shortcuts, expectation line (“About four questions, then you get effort in weeks”), quiet privacy note. No competing hero stack; no primary nav on this screen.
2. **Chat on first answer** — ghost remains on screen, scales/docks to give the thread room; guided deterministic conversation; chips are shortcuts; free-text can override any step.
3. **Scroll site beneath** — proof strip → six build types → teardown teasers → light contact/footer. Docked/persistent ghost reopens or continues chat from any depth.

### Secondary stubs

- `/about` — agency voice, what we build, handover/ownership note  
- `/work` — four teardown teasers spanning product / AI agent / integration / rescue  
- `/rescue` — short production-readiness pitch + CTA into chat with rescue preselected  

### Explicitly out of Phase 1

- LLM extraction / URL fetch summarisation  
- Shareable versioned `/spec/[id]` artifact pages  
- WhatsApp channel  
- Google Calendar booking widget  
- Integration pair pages (`/integrations/...`)  
- Admin panel UI (schema must support it)  
- Any Zoho or external CRM association  

---

## 4. Architecture

```
Browser
  ├── Ghost (SVG first paint → optional WebGL upgrade)
  ├── Chat UI (chips + free-text)
  ├── Scroll marketing sections
  └── Estimator (client TS, pure functions)

Next.js API
  └── POST /api/lead → Supabase (leads + transcript + structured answers)

Later
  └── /admin → read/manage same Supabase data
```

### Stack

- Keep: Next.js 16, React 19, Framer Motion, R3F/Three (ghost), Supabase  
- Remove: Geist marketing branding, `/plan`, `/api/plan` LLM route, old scroll-journey brochure, GetStarted drawer as primary CTA  

### Estimator

Port `Plugabyte prototype directions/estimator-engine.js` to TypeScript:

- Model does **nothing** in Phase 1 — code classifies and computes  
- Build types: product, internal, AI agent, pipeline, integration, rescue  
- Branch questions, disqualification rules, effort band in weeks  
- Free-text path: classify → clear / ambiguous / vague; max two clarification turns then offer call  

### Lead payload (minimum)

- Contact: email (required at gate); optional name/phone  
- Transcript (messages array)  
- Structured answers + build type  
- Effort band or disqualified reason  
- Channel: `web`  
- Timestamps / session id  

---

## 5. UI & ghost behaviour

### Ghost rules

- Always on screen during landing, chat, and scroll  
- Reactive states driven by user actions: idle breath, eye-track, sending, computing, success, disqualify, error  
- On first answer: scale down and move (signature transition); never unmount/hide  
- Mobile: on input focus, collapse to compact header presence; full stage on blur when appropriate  
- First paint: SVG mark + working input before WebGL; degrade gracefully if 3D fails  

### Chat rules

- Free-text field always present and usable  
- Chips never lock the user into a wizard  
- Confirmation popup after successful lead save  
- Disqualified and “offer call” end states are first-class  

### Scroll site

- Editorial sections (Home B density) under the ghost-first fold  
- Build-type cards: “Start here →” seeds chat with that type and scrolls/focuses the conversation  
- Proof strip: drafted capacity/shipped/agency framing (editable)  

### Mobile

- Different layout, not only narrower desktop  
- Keyboard-safe: ghost compact + thread in remaining space  

---

## 6. Brand kit (`design/`)

Client-shareable package:

- Colour tokens (Void `#0D131B`, Ghost `#8FB8E8`, Bolt `#F4586A`, neutrals)  
- SVG wordmark + standalone ghost mark; PNG exports as needed  
- Typefaces: Nunito (display), Space Grotesk (UI), JetBrains Mono (meta)  
- Usage notes: minimum size, clear space, do/don’t  
- Sourced from `Plugabyte_Brand_System_v2.1.html` / prototype assets  

Site CSS variables must match this kit so marketing and product stay aligned.

---

## 7. AI progress knowledge base

Folder: `ai-progress/`

Every significant agent session creates a markdown file covering:

- Goal  
- What was done  
- Why  
- Decisions / deviations  
- Next steps  

Enforced via `AGENTS.md` and `CLAUDE.md` so future sessions load context instead of rediscovering.

---

## 8. Cleanup map

| Remove / replace | Why |
|---|---|
| `ScrollExperience` journey phases & generic AI consultancy copy | Wrong positioning |
| `Hero` / old `Services` brochure pieces if unused | Dead UI |
| `GetStartedDrawer` as LLM plan entry | Replaced by ghost chat |
| `/plan`, `/api/plan` | Phase 1 is deterministic |
| Geist fonts + old metadata | Brand v2.1 fonts + agency metadata |

Keep app shell, Supabase client patterns, Three/R3F deps for the ghost.

---

## 9. Error handling & guardrails (Phase 1)

- Lead API failures → clear UI error; do not lose transcript locally; allow retry  
- Rate-limit / basic junk filter on `/api/lead`  
- Estimator never invents capabilities outside catalog  
- Disqualification is allowed and preferred when honest  
- Privacy line near input (retention/session note)  
- No pricing on site; effort in weeks only  

---

## 10. Testing (Phase 1)

- Manual: landing first paint without WebGL; chat happy path; free-text override; disqualify path; email gate + popup; mobile keyboard layout  
- Unit: estimator classify / branch / effort / disqualify pure functions  
- Smoke: `/`, `/about`, `/work`, `/rescue` render; lead insert against Supabase (or mocked)  

---

## 11. Success criteria

- Ghost is the undiluted front door and stays reactive  
- User can complete a scoped conversation and leave a lead without LLM  
- Scroll site communicates six build types + proof without competing with the chat  
- Brand kit exists for client sharing  
- Old brochure site is gone  
- `ai-progress/` has a design-session note and the agent rule is in place  

---

## 12. Follow-on (not this plan)

Phase 2+: LLM extraction, live `/spec/[id]`, admin panel, booking, WhatsApp, integrations library — all against the same lead/session model, still with no Zoho.
