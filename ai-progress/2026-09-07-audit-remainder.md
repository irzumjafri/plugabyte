# Closing out the audit

## Goal

Everything from the site audit outside the lead-capture bundle already shipped:
mobile navigation, accessibility, layout/interaction, copy and brand voice, and
the duplication worth deleting.

## Done

### Mobile navigation (audit #4)
Header links were `display:none` under 640px with nothing in their place, and
`/about` was the one page rendering `Navbar` without `Footer` — so on a phone it
offered exactly one link out. Added a real menu (toggle with `aria-expanded` /
`aria-controls`, Escape to close, every link closes it, 12px touch targets) and
gave `/about` the Footer and a `<main>` it never had.

Two bugs found only by driving it, both invisible in the code:
- `hidden={!menuOpen}` did nothing: `.mobileMenu { display: flex }` is more
  specific than the `[hidden]` attribute's default, so the menu was permanently
  open. Fixed with `.mobileMenu[hidden]`.
- With that fixed the menu still did not appear: `.navbar` is a fixed 66px, so
  the wrapped panel was open but clipped to zero height. The bar now grows only
  while the menu is open, so the closed bar keeps its exact height.

### Accessibility (audit #11-14) — 11 violations to 0
Verified with the same axe-style audit that found them; `/`, `/about` and
`/work` all report clean.
- Every input has an accessible name. The hero placeholder rotates every 3.2s,
  so its name was changing under a screen-reader user.
- `:focus-visible` rings across nav, chat, chips and buttons. `outline:none` sat
  on the two most important fields and nothing replaced it.
- Contrast: `--pb-text-ghosted` was 3.04:1 on the void (every placeholder),
  `--pb-text-faint` 4.41:1 on panels. Both lifted past AA without flattening the
  hierarchy.
- One `<h1>` that survives the chat starting (it lived inside the hero phase and
  vanished on first click), and a single `<main>` wrapping the whole page — the
  hero and its h1 previously sat outside any landmark.
- Site-wide `prefers-reduced-motion` block; only the Ghost honoured it before.
- `color-scheme: dark`, so browser autofill stops painting the contact fields
  light-on-light.
- The three inline links distinguished by colour alone are now underlined.

### Layout and interaction (audit #6, 8, 9, 10)
- Hero was `min-height:100vh` **plus** a 66px sticky navbar, so it always
  overflowed the first viewport and was never actually centred. Now
  `calc(100dvh - 66px)` — measured, 814px inside an 880px viewport.
- The mobile keyboard-collapse class was applied to `.inner`, an auto-height
  flex column, where `justify-content` does nothing. Moved to `.landing`, where
  it has an effect, and driven by state rather than by mutating a DOM class
  React owns.
- The ghost was mouse-only, so on a phone it never reacted at all — against the
  "always visible and reactive" constraint. Now pointer events, which cover
  touch and pen.
- The idle-wave timer re-armed itself with no cleanup and kept firing after
  unmount; `getBoundingClientRect()` also ran on every mousemove and is now
  cached per pointer-enter.

### Copy and brand voice (audit #15, 17, 18)
- `/about` signed off "Irzum Jafri / Founder, Plugabyte" — precisely the solo
  founder branding `AGENTS.md:28` rules out. Now "The Plugabyte team".
- The privacy line claimed "nothing kept past this session" while the
  transcript, answers and session id are all persisted on submit. Rewritten to
  say what actually happens.
- The proof strip read "Solo, expanding" next to "14 builds shipped", which
  contradicted both that number and the "small team" line on `/about`, and did
  not parse as a stat. Replaced with two real ones.
- "What plugabyte builds" capitalised.

### Deletion (audit #19)
- `TEARDOWNS` was duplicated between the homepage teaser and `/work`; editing
  one silently desynced the teaser from the page it advertises. Now one source
  in `src/lib/teardowns.ts`.
- Dead API contract removed: `summary` and `disqualifiedReason` were never sent,
  and the honeypot was checked server-side but never rendered, so it caught
  nothing while looking like anti-bot cover.
- Unused `@keyframes pb-wave` deleted (GhostSprite has its own `pb-wave-arm`).

## Still open, deliberately

- `focusInput()` is a no-op mid-conversation: it focuses an input that only
  exists in the hero phase or on a free-text step, so the navbar CTA just
  scrolls to top once chips are showing.
- No `metadataBase` or OG image, so every share renders as a bare text card.
- `src/app/page.tsx` awaits `searchParams`, opting the landing page out of
  static rendering to read an optional `?type=`.
- The rate limiter is per-instance and in-memory; it needs a shared store before
  it means anything across multiple server instances.
