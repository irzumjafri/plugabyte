# Giving the site a personality

## Goal

Everything past the hero read as a wireframe: identical bordered boxes, one
column, no colour. Irzum suggested looking at Framer themes.

## Why I did not go to Framer

The brand system in `Plugabyte_Brand_System_v2.1.html` is far richer than the
site was using, and borrowing a generic agency look would have buried the one
thing that is actually distinctive here. Unused until now:

- **70 / 25 / 5** — seventy ground, twenty-five sky, five red. The site was
  running about 97 / 3 / 0. Sky appeared only as small link text.
- **Chalk `#F3F7FA`, a light ground** — never used once. The whole site was dark,
  which is most of why it read as an endless wireframe.
- **Deep Sky `#4E6C93`** — the brand notes Sky fails contrast on Chalk and Deep
  Sky is the substitute. Followed exactly on the new light section.
- **Type scale** (Display 56 / H1 36 / H2 24 / Body 16 / Mono 13) and a real
  mono role for data, both barely present.
- **Voice**: "lead with the failure the reader has already lived, named in
  specifics — expired tokens, dropped webhooks, duplicate records, nobody
  watching." The page never named a single failure.

## Done — homepage sections

- **A light section, and it carries the thesis.** Chalk ground, Deep Sky
  eyebrow, Nunito 900 at 52px: "The first 80% is nearly free now. The last 20% is
  the part that pages you." Under it, five failures in the brand's own
  specifics, as a term/consequence table. It is the one break in the dark and
  the one place the argument is made outright.
- **Six identical cards became a typographic index.** The build types are a
  taxonomy, not a sequence, so they are an index and deliberately *not* numbered
  — 01/02/03 would imply an order that does not exist. Large display names,
  hairline rules, mono "Start here →" that appears on hover (and stays visible
  on touch, where there is no hover).
- **Teardowns now show the ugly line.** It was in the data and unused. The red
  gets spent here — a single bolt-red rule marking the admission, once per card.
  That is the 5%, and it is the reason the rest of the page is believable.
- **Three stat cards became one mono fact line.** "Solo, expanding" was never a
  statistic, and three boxes pretending to be metrics is the wireframe look.
- Sky now carries emphasis inside headings rather than only tinting links.

## Decisions

- One break, not many: a single light section. Alternating grounds would have
  read as a template.
- No scroll-reveal animation yet. The page needed structure and colour first;
  motion on top of a wireframe just makes an animated wireframe.
- Kept the existing content. This was a design pass, not a rewrite.

## Next

- `/work`, `/rescue` and `/about` still have the old treatment. The same
  vocabulary (light break, index rows, mono data, bolt-red for admissions)
  extends to them.
- The brand defines a **twirl** state for the ghost and specifies it for "button
  spinners, inline status" — the loading spinner I built is generic and should
  be the twirl.
- The case-study efforts (7 and 9 weeks) now sit oddly beside the shortened
  estimator bands (a product build is 3–5). Real past projects can legitimately
  be longer, but a reader may notice.
