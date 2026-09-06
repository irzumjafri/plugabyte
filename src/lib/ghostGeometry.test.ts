import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildBodyGeometry, frontSurfaceZ, surfaceAt, toLocal } from './ghostGeometry';

describe('ghost body geometry', () => {
  const geo = buildBodyGeometry();
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const pos = geo.getAttribute('position');

  it('keeps the brand mark proportions', () => {
    const [, top] = toLocal(0, 20);
    const [, legs] = toLocal(0, 117);
    expect(box.max.y).toBeCloseTo(top, 2);
    expect(box.min.y).toBeCloseTo(legs, 2); // lowest point is a foot
    // Head keeps the mark's 42-unit arc; the body is a touch wider at the feet.
    const width = box.max.x - box.min.x;
    const [markLeft] = toLocal(22, 0);
    const [markRight] = toLocal(106, 0);
    expect(width).toBeGreaterThan(markRight - markLeft);
    expect(width).toBeLessThan((markRight - markLeft) * 1.12);
  });

  it('flares towards the feet, as the sculpt does', () => {
    // Widest slice is below the head, not at it.
    const widthAt = (markY: number) => {
      const [, y] = toLocal(0, markY);
      let max = 0;
      for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getY(i) - y) > 0.04) continue;
        max = Math.max(max, Math.abs(pos.getX(i)));
      }
      return max;
    };
    expect(widthAt(90)).toBeGreaterThan(widthAt(62));
  });

  it('is a solid of revolution, not an inflated flat mark', () => {
    const depth = box.max.z - box.min.z;
    const width = box.max.x - box.min.x;
    expect(depth / width).toBeGreaterThan(0.9);
  });

  it('waves the hem around the whole body, so legs exist off the front too', () => {
    // The notch facing the viewer sits at the mark's y=97, well above the legs.
    const [, notchY] = toLocal(0, 93);
    let frontLowest = Infinity;
    let backLowest = Infinity;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getX(i)) > 0.05) continue;
      const z = pos.getZ(i);
      // Stay on the outer surface: near the axis the underside collapses to the
      // pole, and those vertices are not the hem.
      if (Math.abs(z) < box.max.z * 0.6) continue;
      const y = pos.getY(i);
      if (z > 0) frontLowest = Math.min(frontLowest, y);
      else backLowest = Math.min(backLowest, y);
    }
    // ~2 mark units of a 97-unit body: the underside tucks below the hem edge,
    // and that tuck deepens with the wave, so the lowest vertex at a notch sits
    // just under the hem itself.
    expect(Math.abs(frontLowest - notchY)).toBeLessThan(0.11);
    // A flat mark inflated forwards would have a featureless back.
    expect(Math.abs(backLowest - notchY)).toBeLessThan(0.11);
    expect(frontLowest).toBeGreaterThan(box.min.y + 0.5);
  });

  it('anchors features on the surface the mesh actually has', () => {
    // Eyes and arms are seated with surfaceAt; drift means they float off the
    // body or sink into it. Measured in 3D, because near the side of the body
    // the surface is almost vertical and nearest-in-xy says nothing.
    for (const [sx, sy] of [[49, 55], [85, 55], [104, 78], [24, 78]]) {
      const { position } = surfaceAt(sx, sy);
      let nearest = Infinity;
      for (let i = 0; i < pos.count; i++) {
        const d =
          (pos.getX(i) - position[0]) ** 2 +
          (pos.getY(i) - position[1]) ** 2 +
          (pos.getZ(i) - position[2]) ** 2;
        if (d < nearest) nearest = d;
      }
      // Bounded by mesh resolution, not placement: 96 radial segments put
      // vertices ~0.16 apart at the equator, so half that is the floor. A
      // feature actually floating off the body misses by far more.
      expect(Math.sqrt(nearest)).toBeLessThan(0.09);
    }
  });

  it('keeps frontSurfaceZ and surfaceAt agreeing', () => {
    for (const [sx, sy] of [[49, 55], [85, 55]]) {
      const { position } = surfaceAt(sx, sy);
      expect(frontSurfaceZ(position[0], position[1])).toBeCloseTo(position[2], 6);
    }
  });

  it('produces finite positions and normals', () => {
    for (const name of ['position', 'normal']) {
      const attr = geo.getAttribute(name) as THREE.BufferAttribute;
      expect(attr.count).toBeGreaterThan(0);
      expect(Array.from(attr.array as Float32Array).every(Number.isFinite)).toBe(true);
    }
  });
});
