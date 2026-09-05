/**
 * Coordinate conversions. The ONLY place these rules live.
 *
 * Plan (2D): origin top-left, x → right, y → down, metres.
 * World (three.js): y up. Plan x → world x, plan y → world +z.
 *
 * Why +z (not -z): the top view looks down the -Y axis with screen-up = -Z.
 * That puts plan y=0 at the top of the screen and x to the right — i.e. the 3D
 * top view matches the uploaded floor plan pixel-for-pixel, no mirroring.
 */
import type { Vec2 } from '@/api';

export type Vec3 = [x: number, y: number, z: number];

export function planToWorld(p: Vec2, elevation = 0): Vec3 {
  return [p.x, elevation, p.y];
}

export function worldToPlan(v: Vec3): Vec2 {
  return { x: v[0], y: v[2] };
}

export function pxToM(px: number, pxPerM: number): number {
  return px / pxPerM;
}

export function mToPx(m: number, pxPerM: number): number {
  return m * pxPerM;
}

/** Snap a scalar to a grid (default 0.05 m). */
export function snap(v: number, grid = 0.05): number {
  return Math.round(v / grid) * grid;
}

/** Snap a 2D point to a grid. */
export function snapPoint(p: Vec2, grid = 0.05): Vec2 {
  return { x: snap(p.x, grid), y: snap(p.y, grid) };
}

/** Snap rotation to 90° steps, normalised to [0, 360). */
export function snapRotation(deg: number, step = 90): number {
  const r = Math.round(deg / step) * step;
  return ((r % 360) + 360) % 360;
}
