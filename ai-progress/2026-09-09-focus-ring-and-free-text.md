# Focus ring shape, and always offering free text

## Goal

Two bits of chat UX: the focus highlight looked wrong, and chips were the only
way to answer a question that offered them.

## Done

**Focus ring.** The `:focus-visible` outline added during the accessibility pass
sat on the bare `<input>`, which has no border of its own and lives inside a
rounded `.inputRow`. An outline on it drew a square inside a rounded box — the
mismatched double border Irzum spotted. The ring is now on the row via
`:focus-within` (border tint plus a soft 3px halo), so it is one shape at the
container's own 8px radius. `.contactInput` keeps its own ring because it has
its own border and radius.

Removing it was not an option — that reintroduces the violation the pass fixed.
Verified: row shows the ring at 8px radius, input reports `outline: none`.

**Free text alongside chips.** A chips question now always renders an input
underneath ("Or say it in your own words…"). Options can always miss the real
answer, and being unable to say so was a dead end.

## Why the storage needed care

A typed answer to a chips question is almost never one of the exact strings
`computeEffort` scores. Writing it to the scoring key would have been the worst
case: it would not score **and** `fillUnknowns` would see the key as present and
skip its default — so answering in your own words would silently produce a
cheaper estimate than tapping a chip.

Free text that does not match an option is therefore stored as
`<field>_note`, leaving the scoring field open for the default. The note stays
in the transcript, so the model can still infer the proper value from it.

Verified live: "honestly it is mostly angry customers and my staff rebooking by
hand" stored as `problem_cost_note`, with `systems`, `apis`, `volume`, `roles`,
`approvers` and `deadline` all holding canonical values.

## Decisions

- Ring on the container, not the field — the field has no border to tint.
- Chips are shortcuts, never the only route. Always render the input too, rather
  than hiding it behind an "or type" toggle.
- Unmatched free text never occupies a scoring key.

## Next

- Privacy line still does not mention that non-submitted transcripts are stored.
- Vercel needs `NEXT_PUBLIC_CONVEX_URL` and `ZAI_API_KEY` at deploy time.

---

## Shorter timelines

"Product build · 9–11 weeks" read as too long for an agency selling AI-assisted
delivery, where a buyer expects weeks rather than quarters.

Two causes, and one of them was mine. Bases were set for traditional delivery
(product 5, ai 6). On top of that, the `fillUnknowns` defaults added last
session put a bump on nearly every *unasked* field — so the shortest
conversations, which assume the most, inflated the fastest. The four-question
redesign and the conservative defaults worked against each other.

**Bases**, for AI-assisted delivery: product 5→3, internal 3→2, ai 6→3,
pipeline 4→2, integration 3→2, rescue 2→1.

**Bumps** now only price genuine complexity. The mid-range answers cost nothing:
"2–3 systems" and an unconfirmed "Not sure" were each worth a week, which made
every ordinary build look hard. `4 or more` systems, `No` data access, `15+`
screens and `4+` roles still escalate.

| | typical | realistic worst case |
|---|---|---|
| Product build | 3–5 | 10–12 |
| Internal tool | 2–4 | 9–11 |
| AI agent | 4–6 | 9–11 |
| Data pipeline | 2–4 | 6–8 |
| Automation & integration | 2–4 | 6–8 |
| Prototype rescue | 1–3 | 5–7 |

The floor came down; the ceiling still reflects real complexity.

Verified live: the same kind of product-build conversation that produced 9–11
now returns `PB-BFWYC1 · Product build · 3–5 weeks`.

### Test note

`fillUnknowns`'s "never estimates lower than asking" test now asserts
`toBeGreaterThanOrEqual` rather than `toBeGreaterThan`. The mid-range defaults
are deliberately worth zero, so filling them equals asking them — which is the
invariant that matters. Assumptions are still listed, since they remain
assumptions even when they cost nothing.
