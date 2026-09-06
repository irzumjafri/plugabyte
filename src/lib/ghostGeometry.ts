import * as THREE from 'three';

// Brand-mark coordinate system (see GhostSprite.tsx, pbSprite body path from
// Plugabyte_Brand_System_v2.1.html): x/y in the mark's own units, y growing
// downwards, converted to a ~5.2-unit-wide model by SCALE.
const CX = 64;
const CY = -68.5; // -( (apex -20) + (bottom -117) ) / 2, in flipped-y space
export const SCALE = 5.2 / 84;

// The body is a solid of revolution — dome, wall, rolled hem, underside — with
// the hem height waved around the circumference. That gives a ghost as deep as
// it is wide, with a skirt of legs all the way round, rather than a flat mark
// inflated forwards (which only ever has legs on the face it is drawn on).
const DOME_RADIUS = 42; // matches the mark's `A 42 42` head arc
const DOME_CENTRE_Y = 62;
const WALL_BOTTOM_Y = 93;
// The sculpt is widest at the feet, not the head — it flares out below the dome
// rather than tapering in.
const WALL_FLARE = 2.5;
const FILLET_RADIUS = 12;
const HEM_RADIUS = DOME_RADIUS + WALL_FLARE - FILLET_RADIUS;
const HEM_Y = WALL_BOTTOM_Y + FILLET_RADIUS; // 105
const UNDERSIDE_RISE = 6;
// ±12 about HEM_Y keeps the legs at the mark's y=117 and drops the notch to 93,
// the ~25%-of-height notch the sculpt has.
const HEM_WAVE = 12;
const HEM_LOBES = 4; // four legs, two of which read from the front, as in the mark
// The sculpt has broad feet split by a narrow U, not an even sine. Pushing the
// wave towards its "leg" extreme widens the feet and pinches the notches.
const HEM_SHAPE = 2.2;
const DEPTH_RATIO = 0.95;

const RADIAL_SEGMENTS = 96;
const DOME_STEPS = 30;
const WALL_STEPS = 18;
const FILLET_STEPS = 16;
const UNDERSIDE_STEPS = 12;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function toLocal(x: number, y: number): [number, number] {
  return [(x - CX) * SCALE, (-y - CY) * SCALE];
}

function toLocalY(y: number): number {
  return (-y - CY) * SCALE;
}

/**
 * Horizontal radius of the body at mark-space height y. Single source of truth:
 * the profile and frontSurfaceZ both read it, so features cannot drift off the
 * surface when the shape is tuned.
 */
function radiusAt(y: number): number {
  if (y < DOME_CENTRE_Y) {
    const dy = DOME_CENTRE_Y - y;
    return Math.sqrt(Math.max(0, DOME_RADIUS * DOME_RADIUS - dy * dy));
  }
  const t = Math.min(1, (y - DOME_CENTRE_Y) / (WALL_BOTTOM_Y - DOME_CENTRE_Y));
  return DOME_RADIUS + WALL_FLARE * smoothstep(t);
}

/**
 * Z of the front surface at local (x, y) — where the eyes and arms have to sit.
 * Cross-sections are ellipses, so this is exact anywhere the hem wave has not
 * reached, which covers the whole face.
 */
export function frontSurfaceZ(x: number, y: number): number {
  const markY = -(y / SCALE) - CY;
  const r = radiusAt(markY) * SCALE;
  return DEPTH_RATIO * Math.sqrt(Math.max(0, r * r - x * x));
}

export interface SurfaceAnchor {
  /** Point on the front of the body, in local units. */
  position: [number, number, number];
  /** Outward surface normal there — the direction a feature should sit along. */
  normal: [number, number, number];
}

/**
 * Where a feature drawn at mark-space (x, y) lands on the round body, and which
 * way is "out". Eyes and arms ride the normal, so they stay seated on a face
 * that curves away instead of being pushed along z and floating off it.
 */
export function surfaceAt(markX: number, markY: number): SurfaceAnchor {
  const r = radiusAt(markY);
  const x = Math.max(-r, Math.min(r, markX - CX));
  const z = DEPTH_RATIO * Math.sqrt(Math.max(0, r * r - x * x));
  // Ellipse gradient: (x / r², z / (depth² r²)), constants drop out on normalise.
  const nx = x;
  const nz = z / (DEPTH_RATIO * DEPTH_RATIO);
  const len = Math.hypot(nx, nz) || 1;
  return {
    position: [x * SCALE, toLocalY(markY), z * SCALE],
    normal: [nx / len, 0, nz / len],
  };
}

/** Hem offset at an angle: positive drops a foot, negative lifts a notch. */
function hemWave(theta: number): number {
  const u = -Math.cos(HEM_LOBES * theta); // -1 at a notch, +1 at a foot
  return (1 - 2 * Math.pow((1 - u) / 2, HEM_SHAPE)) * HEM_WAVE;
}

interface ProfilePoint {
  r: number;
  y: number;
  wave: number; // how much of the hem wave this point takes, 0..1
}

/**
 * The silhouette profile from the top pole round to the bottom pole. `wave`
 * fades in over the lower wall and back out to zero at the pole, so the legs
 * swing without tearing open the underside where every angle meets.
 */
function buildProfile(): ProfilePoint[] {
  const pts: ProfilePoint[] = [];
  const waveAt = (y: number) => smoothstep((y - 70) / 25);

  for (let i = 0; i <= DOME_STEPS; i++) {
    const a = (i / DOME_STEPS) * (Math.PI / 2);
    const y = DOME_CENTRE_Y - DOME_RADIUS * Math.cos(a);
    pts.push({ r: DOME_RADIUS * Math.sin(a), y, wave: waveAt(y) });
  }
  for (let i = 1; i <= WALL_STEPS; i++) {
    const y = DOME_CENTRE_Y + (WALL_BOTTOM_Y - DOME_CENTRE_Y) * (i / WALL_STEPS);
    pts.push({ r: radiusAt(y), y, wave: waveAt(y) });
  }
  for (let i = 1; i <= FILLET_STEPS; i++) {
    const b = (i / FILLET_STEPS) * (Math.PI / 2);
    pts.push({
      r: HEM_RADIUS + FILLET_RADIUS * Math.cos(b),
      y: WALL_BOTTOM_Y + FILLET_RADIUS * Math.sin(b),
      wave: 1,
    });
  }
  for (let i = 1; i <= UNDERSIDE_STEPS; i++) {
    const u = i / UNDERSIDE_STEPS;
    pts.push({
      r: HEM_RADIUS * (1 - u),
      y: HEM_Y - UNDERSIDE_RISE * smoothstep(u),
      wave: 1 - u, // zero at the pole, where every angle coincides
    });
  }
  return pts;
}

export function buildBodyGeometry(): THREE.BufferGeometry {
  const profile = buildProfile();
  const rows = profile.length;
  const cols = RADIAL_SEGMENTS;

  const positions = new Float32Array(rows * cols * 3);
  for (let i = 0; i < rows; i++) {
    const p = profile[i];
    for (let j = 0; j < cols; j++) {
      const theta = (j / cols) * Math.PI * 2;
      const y = p.y + p.wave * hemWave(theta);
      const k = (i * cols + j) * 3;
      positions[k] = p.r * Math.cos(theta) * SCALE;
      positions[k + 1] = toLocalY(y);
      positions[k + 2] = p.r * Math.sin(theta) * DEPTH_RATIO * SCALE;
    }
  }

  // Columns wrap by index rather than being duplicated, so the seam welds and
  // shades as one surface. Pole rows collapse to a point, leaving degenerate
  // quads there — harmless, and how three's own SphereGeometry handles poles.
  const indices: number[] = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const j2 = (j + 1) % cols;
      const a = i * cols + j;
      const b = i * cols + j2;
      const c = (i + 1) * cols + j2;
      const d = (i + 1) * cols + j;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
