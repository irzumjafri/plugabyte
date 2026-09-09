# Redesign to the direction comps

## Goal
Rebuild the site to the four comps in `brand-inspiration/`: illustrated scene
heroes, alternating light and dark grounds, a brighter matte mascot, marker-hand
annotations, and concept products alongside the real work.

## Decisions (asked, not assumed)
- **Mascot:** keep the interactive 3D ghost everywhere, re-graded to the comps —
  not replaced by flat art. Cursor tracking survives on every page.
- **Work content:** both. Homepage shows the concept products; `/work` keeps the
  four real teardowns with their ugly parts.

## Done
- **Ghost re-graded.** Colours sampled from the comps rather than eyeballed:
  body `#52A8FD`, bolt `#FB2B37`, eyes `#090E17`. Clearcoat removed for a matte
  vinyl finish. The light rig was rebuilt — a three-point setup that sold a
  glossy sculpt reads as mud on matte — and **ACES tone mapping was dropped**:
  filmic transfer desaturated the blue toward pale as soon as the scene was
  bright enough. Tuned by measuring rendered pixels against the target hex
  (landed `#4D9BEB` avg vs `#52A8FD`, nothing clipping) instead of by eye.
- **Scene plates.** Four clean plates from the comps into `public/scenes/`.
  The 941×1672 files are full-page comps, not art, and were not used.
- **New primitives.** `SceneHero` (plate + directional scrim + copy in the
  plate's own negative space + live ghost composited over it), `Annotation`
  (marker-hand asides, `aria-hidden`), `GhostStage` (window-wide pointer
  tracking for pages with no plate).
- **Home:** scene hero with the live ghost; the scoping chat moved directly
  below the hero, focused by the hero CTA; concept projects on Chalk; "The last
  20% is the job" over the exploded-layers plate; sky-tint close.
- **`/about`:** workbench hero, principles restyled as large numerals on Chalk.
- **`/work`:** typographic hero + live ghost, real teardowns on Chalk, diagrams
  keep their own dark panel.
- **`/rescue`:** new hero, and the seven checks became a `<details>` accordion.
- Caveat added for the annotations. `Ghost` no longer forces an inline size, so
  a container can drive it.
- Build/lint config: `exports/` and `brand-inspiration/` excluded from eslint
  and tsconfig — the bundled ghost was being linted and type-checked.

## Contrast — five real failures found and fixed
The comps' palette is more saturated than the brand book and several pairings
fail WCAG. All fixed, all four pages now audit clean:
- Azure on Chalk is **2.32:1** — numerals on light grounds use `--pb-azure-deep`
  (3.83:1, clears the 3:1 large-text bar).
- Deep Sky on the sky-tint band, 4.22:1 → `--pb-ink-soft` for that eyebrow.
- White on `--pb-red`, **3.82:1** → new `--pb-red-cta` `#DD1F2B` for anything
  with text on it. The bolt and graphics keep `#FB2B37` exactly.
- `--pb-red` on Chalk, 3.54:1 → same deeper red for the "ugly part" label.
- The type chip's own tint dragged Deep Sky to 4.46:1 → lighter chip.

## Next
- **Three concept plates are missing.** Only `folio` has artwork; relay, conduit
  and daybreak are set as type. They need `relay`, `conduit`, `daybreak` plates.
- **No plate for `/work` or `/rescue`.** Both use typographic heroes rather than
  borrowing a plate from another page, which would dilute both.
- The comps' blue and red sit outside the brand book (`Sky #8FB8E8`,
  `Bolt #F4586A`). The book needs updating, or the comps re-graded to it.
- The standalone ghost export in `exports/` is a snapshot from before the
  re-grade — re-run `scripts/export-ghost.sh` to refresh it.
- Windmill is still the brand's designated loading state; the app uses a
  generic spinner.

---

## Round two — the imagery, and a ghost bug

Feedback: the 3D ghost had vanished on `/rescue`, and the scene imagery — the
main impact of the comps — had been skipped on the inner pages.

### The ghost bug (real, mine)
`Ghost`'s `.wrap` had **zero height**. Making `size` optional in round one
removed the only thing giving that box dimensions, so the r3f canvas fell back
to its own 300×150 default and rendered a stretched ghost — invisible on
`/rescue`, oversized behind the headline elsewhere. Fixed at the root: `.wrap`
now defaults to `width/height: 100%`, so the parent sizes it and an explicit
`size` still wins.

### Imagery — nine more plates
Round one used only the four standalone plates and left `/work` and `/rescue`
with typographic heroes. The full-page comps carry far more art, so it was
harvested: `rescue-bridge`, `rescue-tower`, `rescue-ba`, `work-shelf`, `relay`,
`conduit`, `daybreak`, `about-boards`, `about-city`. Cropped past the comps'
own baked headlines, Lanczos-upscaled 2×.

- **Home:** all four concepts are now image cards (relay/conduit/daybreak had
  been type-only); the shelf plate heads the section, where the spines actually
  name those four.
- **`/work`:** boards-plate hero, live ghost at the CTA.
- **`/rescue`:** bridge hero, the tower alongside the accordion, and a real
  before/after.
- **`/about`:** city closing scene.
- `SceneHero` gained `objectPosition` and a `heavy` scrim — the crops are busier
  and lower-resolution than the wide plates, so the standard falloff left copy
  sitting on detail.
- The Chalk bands now break out of the 1180px wrapper to run edge to edge, as
  the comps do; `margin: 0 -gutter` only reached the wrapper's padding.

### Export script fixed (it had silently broken)
Its dvh workaround targeted `[class*="landing"]`, a class this redesign deleted,
so `SceneHero`'s `min-height: 78vh` re-inflated during export. Now it freezes
every resolved non-zero `min-height` inline — no class coupling — forces lazy
images eager and awaits `decode()`, and waits for the page height to stop moving
before measuring. Verified against the real PDF output.

### Honest limits
- The nine harvested plates come from 941px-wide comps. Upscaling does not
  invent detail; they are sharp enough as contained section images and behind
  a scrim, but they are **not** true retina art. High-resolution originals of
  these scenes would visibly improve `/rescue` and `/work`.
- Several plates have a ghost painted into them. That is native to the comps
  (they use several per page), but it is why the `/rescue` hero has no live
  ghost overlaid — two mascots in one frame read as a duplicate. The live ghost
  sits at that page's CTA instead.
- `about-city` has "brighter tomorrow" hand-lettered into it; our own
  `Annotation` there was removed rather than print the same words twice.
