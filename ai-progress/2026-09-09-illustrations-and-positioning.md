# Illustrations, imagery and positioning

## Goal
Kill the wireframe feel on the pages beyond the hero; shift positioning toward
from-scratch builds and AI advisory; give the site actual illustrations and
images rather than boxes of text.

## Done
- **Positioning.** Homepage "What we build" now leads with *"Most of it starts
  from an empty repo"* and says integration is one branch. New **Advisory**
  section (panel ground, so it reads as a different engagement from a build):
  what to automate, what to leave alone, what it costs to run — explicitly
  available whether or not they hire us to build.
- **Schematic illustrations** (`src/components/Diagram.tsx`). Four line drawings,
  one per case study, each drawing the system the teardown describes. On `/work`
  full width under the prose; on the homepage inside each teardown card. Colour
  comes from `currentColor` + two CSS vars, so the same markup works on dark and
  on Chalk.
  - First pass was plain rects and arrows — correct and completely anonymous.
    Rebuilt on two devices from the brand book and nothing else: every node is
    cut with the **ghost hem** (three lobes, "the only trace of the ghost", which
    is what makes a box one of ours), and the failure is pinned with the **actual
    bolt glyph** from the mark rather than a red rectangle, since Shock is
    already the brand's error state. One bolt per drawing; a second halves the
    first. Wires stay hairline so those two read.
- **Real mascot stills** (`public/ghost/*.png`). Rendered from the actual 3D rig
  via a new `/shot-rig` route + dev-only `/api/shot-save`, then alpha-trimmed to
  640px. Placed per the brand book's own state usage: Slouch on the `/rescue`
  hero (off/empty states), Pointer beside the `/work` and `/rescue` CTAs
  (nudges), idle mark on `/about` (marketing default).
- **Brand fix:** the bolt is now a child of the arm group, as the brand system
  requires ("rotate the shoulder and the hand carries it for free"). It was a
  sibling, so the wave animation used to swing the arm out from under the sign.
- `GhostScene` gained a `pose` prop (`{arm, bolt, lid}`) and a `POSES` map of
  named states. `preserveDrawingBuffer` is on only when a pose is set.
- Fixed the homepage index-row hover: `translateX` on the text instead of
  animating `padding-left`, which relaid out the grid every frame.
- `Teardown` gained `diagram` and an optional `image` — a real screenshot
  replaces the schematic wherever one is cleared to publish.

## Why
The brand system already defines an illustration language (the sixteen
sign-spinner states) and it was unused outside the hero. Drawings of the ghost
would drift from the model; frames of the actual rig cannot. The case-study
diagrams carry information the prose otherwise spends a paragraph on, which is
the only reason they earn space.

## Decisions
- No invented case study for the AI-advisory offering. The four teardowns are
  real work; advisory lives in page copy until there is a real one to show.
- No fabricated product screenshots. `Teardown.image` is the slot; the images
  have to come from Irzum.
- Advisory positioning is in tension with the brand line *"AI is how the work
  gets done, not what is sold"* — flagged, and taken as overridden by the
  explicit ask. It does resolve `/about` already calling us "an AI consultancy".
- Diagrams capped at 400px wide: the mono labels only read correctly near 1:1.

## Next
- Real screenshots of shipped work → `public/work/`, then set `image` on the
  teardowns. This is the biggest remaining gap; a diagram is a stand-in.
- Windmill is the brand's designated loading state and the app still uses a
  generic spinner.
- Case-study efforts (7/9 weeks) still clash with the shortened estimate bands.
- Privacy line doesn't mention that non-submitted transcripts are stored.
- Vercel needs `NEXT_PUBLIC_CONVEX_URL` and `ZAI_API_KEY`.
