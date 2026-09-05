import type { Vec2 } from '@/api';

/** Ray-casting point-in-polygon. Points exactly on an edge count as inside. */
export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (onSegment(p, a, b)) return true;
    const intersects =
      a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function onSegment(p: Vec2, a: Vec2, b: Vec2, eps = 1e-9): boolean {
  const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > eps) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  if (dot < -eps) return false;
  const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= len2 + eps;
}

/** Signed area (shoelace). Positive = counter-clockwise in plan coords (y down → visually clockwise). */
export function signedArea(poly: Vec2[]): number {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  }
  return s / 2;
}

export function area(poly: Vec2[]): number {
  return Math.abs(signedArea(poly));
}

export function centroid(poly: Vec2[]): Vec2 {
  if (poly.length === 0) return { x: 0, y: 0 };
  const n = poly.length;
  const sx = poly.reduce((a, p) => a + p.x, 0);
  const sy = poly.reduce((a, p) => a + p.y, 0);
  return { x: sx / n, y: sy / n };
}

export function bounds(poly: Vec2[]): { min: Vec2; max: Vec2 } {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}
