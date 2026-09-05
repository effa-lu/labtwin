/**
 * Entity (transform + dims) → box description. Pure math.
 * transform.x/y is the entity's footprint centre in plan coords; rot in degrees.
 */
import type { Dims, Transform } from '@/api';
import { planToWorld } from './coords';
import type { BoxDesc } from './walls';

export function entityBox(transform: Transform, dims: Dims): BoxDesc {
  const [cx, , cz] = planToWorld({ x: transform.x, y: transform.y });
  return {
    center: [cx, transform.z + dims.h / 2, cz],
    size: [dims.w, dims.h, dims.d],
    // rot is clockwise on the plan (y down) = clockwise seen from above = negative rotation about +Y.
    rotationY: -(transform.rot * Math.PI) / 180,
  };
}

/** Axis-aligned footprint corners (plan coords) after rotation — for overlap checks later. */
export function footprint(transform: Transform, dims: Dims): { x: number; y: number }[] {
  const r = (transform.rot * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const hw = dims.w / 2;
  const hd = dims.d / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([lx, ly]) => ({
    x: transform.x + lx * c - ly * s,
    y: transform.y + lx * s + ly * c,
  }));
}
