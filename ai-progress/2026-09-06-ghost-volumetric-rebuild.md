# Ghost: volumetric rebuild, smoothing, friendlier face

## Goal

Make the landing ghost read like the reference render Irzum supplied — a soft,
glossy, genuinely 3D character — while keeping the brand silhouette and colours.
Along the way: fix the navbar sitting below the hero, and address "not smooth"
and "doesn't look friendly" feedback.

## Done

- **Navbar** (`src/components/Home/HomeClient.tsx`) — moved `<Navbar>` above
  `<LandingSection>`. It was rendered after the hero, so `position: sticky` only
  pinned it once you scrolled to it; on load it sat below the fold.
- **New `src/lib/ghostGeometry.ts`** — body geometry extracted out of the React
  component so it is testable in node, with `src/lib/ghostGeometry.test.ts`.
  - Body is built directly: a straight wall between the two silhouette rims plus
    two caps, each a radial fan of 26 rings from the rim in to a fan centre.
  - Caps are inflated by a distance-field dome (circular profile, vertical where
    it meets the wall, so wall and dome join tangentially with no rim crease).
  - The distance field uses a **smooth minimum** over the outline edges, plus
    light Laplacian relaxation of cap heights (rim pinned) and one
    normal-smoothing pass.
- **`GhostScene.tsx`** — studio environment (three's `RoomEnvironment` baked via
  PMREM, applied per material), retuned lighting/exposure, brand-sized ellipse
  eyes, both arms with hands, bolt in front of the hand.

## Why

- The old body was a flat `ExtrudeGeometry` slab: flat front, bevelled rim. It
  read as a cookie cutter, not a volume.
- Two failed attempts are worth recording so nobody repeats them:
  1. **Displacing the extruded cap directly** — three's cap is triangulated from
     outline points only, so there are no interior vertices to bulge; it creased
     between distant boundary points.
  2. **Subdividing that cap and smoothing** — earcut produces long slivers, and
     subdividing a sliver yields four slivers. The result was dense shading
     streaks fanning down the body. No amount of smoothing fixed the cause.
  The fan-mesh construction removes the cause: every triangle is well shaped.
- The blue was bleaching to near-white. Cause was not the material: an
  unattenuated `RoomEnvironment` was supplying nearly all the light, and ACES
  tone mapping pushes anything that bright toward white regardless of hue.
  Confirmed by reading live scene state in the browser rather than guessing.
- A profile that topped out inside the body left a visible curvature isoline;
  `INFLATE_RADIUS` is now set past the shape's deepest interior point (~35
  units) so curvature varies continuously.
- A plain `min` over the outline edges kinks along the shape's medial axis, and
  inflating through that kink drove a wedge down the middle of the body — it
  read as a snout. Mesh smoothing only masked it; `smoothMin` removes it at the
  source. It dips negative where two edges meet at a corner, so `inflateAt`
  clamps before the sqrt or the heights come out NaN.

## Decisions

- Silhouette is untouched — inflation only moves z, never x/y, and the rim is
  pinned. A test asserts the bounding box still matches the brand path.
- Environment is applied per material, not via `scene.environment`: keeps
  brightness per-object and satisfies the `react-hooks/immutability` lint rule.
- **Tried a smile and reverted it.** The reference render has one, but a heavy
  dark grin plus large glossy eyes on a rounded blob read as an animal face, not
  the mark. The face is back to the mark's two eyes; `GhostSprite` was never
  changed, so the SVG fallback and the 3D ghost still agree.
- Limbs are slimmer than the first pass (capsule radius 4 units, hands 5.5)
  because chunky nubs read as stuck-on appendages at hero size.
- Test tolerances are explicit and justified in comments (outline sampling
  resolution; relaxation taking a hair off the dome peak). The arm pivot gets a
  looser bound because it sits where the dome is still near-vertical.

## Next

- The bolt does not follow the arm during a wave (pre-existing: the bolt group
  is a sibling of the arm group, not a child).
- Geometry builds in ~35ms on mount; if that ever matters, cache the built
  geometry across Ghost instances.


---

## Update — recreated from the Meshy sculpt

Irzum generated a reference sculpt on Meshy ("Spooky Lightning Ghost", CC0,
their own account) and asked for it in Plugabyte colours. Orbiting it in the
viewer showed the thing the inflate approach could never produce: it is a solid
of revolution — as deep as it is wide — with a wavy hem running the whole way
round into four legs, of which two read from the front.

### Done

- `src/lib/ghostGeometry.ts` rewritten (304 → ~140 lines). The body is now a
  lathe: dome, wall, rolled hem, underside, revolved over 96 columns, with the
  hem height waved by `-HEM_WAVE * cos(4θ)`.
- Deleted wholesale: the distance field, `smoothMin`, `isInside`, `inflateAt`,
  the vertex adjacency map and both relaxation passes. None of it is needed once
  the surface is analytic — it existed only to repair an inflated flat mark.
- `frontSurfaceZ` is now exact and one line of trigonometry: cross-sections are
  ellipses, so `z = ratio * sqrt(r(y)² - x²)`.
- Bolt is chunkier and `flatShading`, to read as the reference's crystal shard.

### Why this is simpler, not just different

Every hard problem from the first pass was self-inflicted by inflating a 2D
silhouette: cap triangulation, medial-axis creases, curvature isolines, streaky
normals. A lathe has none of them — the grid is regular, the surface is smooth
by construction, and the poles are handled the way `SphereGeometry` handles
them.

### Decisions

- Wave numbers are pinned to the mark: `HEM_WAVE = 10` about `HEM_Y = 107` puts
  the legs at the mark's y=117 and the notches at y=97, and the head keeps the
  `A 42 42` arc. So the front silhouette still reads as the brand mark.
- Four lobes, not two, because the hem has to wave all the way round; a test
  asserts the back has the same notch depth as the front, which is what a flat
  inflated mark could not do.
- Eyes stay the mark's dark navy rather than the sculpt's raised body-coloured
  bumps — "proper Plugabyte colouring" was the ask.

### Next

- The bolt still does not follow the arm during a wave (pre-existing).
- The eyes are flattened ellipsoids sunk into the face; if they read as too
  almond-shaped on the rounder body, make them rounder and sink them less.

---

## Update 2 — matched against the sculpt's own reference data

The first "recreation" was eyeballed off orbit screenshots and missed. Meshy's
public task API turned out to carry the ground truth:

`https://www.meshy.ai/meshyd-api/web/public/v2/tasks/<id>`

- `args.draft.imageUrl` — **the source image is our own flat brand sprite.** The
  sculpt is Meshy's 3D interpretation of the mark, which is why matching the
  mark's proportions is the right base.
- `result.previewUrl` — a clean render of the model; a far better reference than
  orbiting the viewer by hand.
- `result.generate.modelUrl` — a `MESHY.AI`-magic proprietary container, and
  `quadJsonUrl` is a stub (`verts: []`). So no mesh extraction; measurements come
  from the render.

### What the sculpt actually has that we did not

- **Eyes are raised bumps**, not dark sunken discs. Now spheres seated into the
  face along its surface normal, kept brand navy (the ask was the sculpt's form
  in Plugabyte colours, and the source image has dark eyes).
- **The bolt is large and at the upper right of the head**, not small down at the
  hand. The mark composes -34° (arm) with -46° (bolt) about (112, 51), which is
  exactly where the sculpt keeps it; scaled 1.7 so it matches the mark's ~64-unit
  bolt against the 97-unit body, flat-shaded for the crystalline facets.
- Eye bumps measured off the render sit **higher and closer together** than the
  flat mark draws them, because the 3D head is round where the mark is a
  semicircle. Body width ~21% per eye, ~37% apart.
- Wall tapers 3 units below the head; arms are thin with ball hands.

### Notes

- `surfaceAt(markX, markY)` replaces bare `frontSurfaceZ` for placement: it
  returns the point *and* the outward normal, so features ride the normal and
  stay seated on a face that curves away. `radiusAt` is the single source of
  truth both it and the mesh read, so tuning the body cannot drift features off
  the surface.
- The bolt makes the mascot asymmetric, so the rig is shifted -0.9 and the camera
  pulled to 16.5 to frame the whole character; hero Ghost size 230 → 260 to keep
  its visual weight.
- The feature-anchor test measures 3D distance, not distance in xy: near the side
  of the body the surface is almost vertical and nearest-in-xy is meaningless.
  Its tolerance is set by mesh resolution (96 radial segments), not placement.

---

## Update 3 — friendliness pass, and the logo per the guidelines

### Logo

The nav and footer were rendering `plug<span class="accent">a</span>byte` — a
plain letter "a" tinted sky blue. The brand guidelines call that out explicitly
as incorrect: the "a" *is* the ghost. New `Wordmark` component carries the exact
lockup from `Plugabyte_Brand_System_v2.1.html` (symbol `#pbA`):

- single-storey bowl on the baseline, eyes **cut out** of it (`fill-rule:
  evenodd`) so the background shows through;
- bolt hanging into the descender where a "g" tail would fall;
- glyph metrics straight from the guidelines (`height: 2.135ex`, `width:
  1.351ex`, `top: .689ex`), so the bowl matches the x-height of the type beside
  it rather than behaving as full-height punctuation between two words.

A visually-hidden "a" keeps the accessible name "plugabyte" (verified in the
browser) while the glyph carries the letter visually. Navbar and Footer both use
it, and their duplicated wordmark CSS is gone.

### Friendliness

The mascot read blank rather than cute. Fixes, cheapest cue first:

- **Catchlights.** A dark eye with no highlight reads dead. Small unlit white
  spheres poke through each eye toward the key light. Biggest single gain.
- **Eyes bigger and lower** (radius 10.5, at y=52), back toward where the mark
  draws them. Large low eyes on a round head is the whole neoteny cue; the
  sculpt-matched placement was smaller and higher, which read severe.
- **Blink**, every 4.6s over 0.14s, by squashing each eye group's y. Movement is
  what makes it read alive.
- **Head tilt** — a constant 0.05 with a slow drift, so it looks attentive
  rather than staring square at the camera.

Deliberately *not* re-added: the smile. It was tried and reverted earlier for
reading as an animal face; the friendliness here comes from the eyes instead.

### Checked

Bolt extrude was suspected of NaN positions (sharp non-convex shape with a
bevel); built it in a scratch test across three bevel settings — 0 NaN in all.
The NaN warning in the console is a stale HMR artifact: the error count held at
31 across two further page loads, so nothing new is being produced.

---

## Update 4 — measured against four clean sculpt views

Irzum supplied four clay renders (front, two 3/4s, low angle). Measured off the
front view against the current build, three things were wrong:

- **The sculpt flares towards the feet.** We tapered *inward* below the head
  (`WALL_TAPER = 3`). It is widest at the hem, ~6% wider than at eye level, so
  that is now `WALL_FLARE = 2.5` and a test asserts the widest slice sits below
  the head rather than at it.
- **The notch is deeper and much narrower**, splitting two broad feet — not the
  even sine an unshaped `cos(4θ)` gives. `hemWave` now pushes the wave towards
  its "foot" extreme (`HEM_SHAPE = 2.2`), which widens the feet and pinches the
  notches. Wave raised to ±12 about a hem at y=105, which keeps the feet on the
  mark's y=117 while dropping the notch to y=93 (~25% of height, as measured).
- **The bolt is a chunky ridged crystal**, not a flat plate. Its bevel is now
  larger than its extrude depth (0.18 against 0.14), which builds a centre ridge
  and reads as faceted stone.

Measurements that already matched and were left alone: overall height/width
(1.16), eye height (~33% down), bolt size and position (~62% of body width,
centred near mark (112, 51)). Eyes retuned to the measured ~21% of body width,
~42% apart.

A heavier bevel on a sharp non-convex shape is a classic NaN source, so the
three candidate bevel settings were built in a scratch test first — 0 NaN in all
three, and the chosen one gives 0.5 thickness.

---

## Update 5 — framing, and dropping the 2D→3D crossfade

### The hand was clipping the canvas

`RIG_OFFSET_X` was hardcoded at -0.9, picked by eye. The mascot is asymmetric
(bolt far right, hand far left), and that guess left ~0.09 units of margin on the
left — so breathing and look-at rotation pushed the hand through the frame.

Now derived from where those features actually land:

    rigOffsetX = -((leftHandX - HAND_RADIUS) + (boltX + boltReach)) / 2

with `boltReach` read off the bolt geometry's own bounding sphere. Camera moved
to 17.6 (half-width 5.05) against a content half-width of ~4.48, which holds at
1.04× breathing. Verified at both look-at extremes.

Watch the ordering: `boltReach` reads `boltGeo`, so it has to sit *after* that
`useMemo` — putting it before throws a TDZ error on the const.

### The crossfade is gone

The flat SVG mark painted first and crossfaded out as WebGL mounted. A flat mark
morphing into a lit 3D one never lines up, so it read as a glitch. Now a neutral
spinner holds the space and only the 3D ghost ever reads as the mascot, fading in
over 420ms (both animations respect `prefers-reduced-motion`).

The flat mark is kept as a **failure** fallback: if WebGL never initialises,
`onReady` never fires, and a spinner that never resolves is worse than a swap. A
6s timer gives up and paints the flat mark. That swap only happens on the path
where the alternative is a permanently spinning page.

`GhostSprite`'s `waving`/`thinking` props are now unused by this path — the
fallback is static — but the component still drives them for its own animations.

---

## Update 6 — eye highlights

The catchlights were unlit white spheres poking through each eye. They read as
doll's eyes: hard, flat, and fixed regardless of where the head turned, because
`meshBasicMaterial` ignores lighting entirely.

Removed them. The eye is now a glossy `meshPhysicalMaterial` (roughness 0.14,
clearcoat 1, higher `envMapIntensity`) that earns its highlight from the key
light and the studio environment. Softer, and it tracks the head instead of
sitting there like a sticker. Less code than the version it replaces.

While verifying this, a blank frame appeared where the mascot should be. Worth
recording that it was **not** a real fault: the DOM showed the scene ready with a
live canvas, and dumping the derived values on `window` showed all of them finite
and sane (`rigOffsetX = -0.80`, bolt radius 1.40). It was a transient HMR state,
and the "changed size between renders" error in the console was the temporary
debug hook itself altering a `useEffect` deps array. Both are gone.
