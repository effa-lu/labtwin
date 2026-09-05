/**
 * Polygon → wall boxes. Pure math, no three.js.
 *
 * Rule (fixed): one box per polygon edge, thickness 0.15 m, centred on the edge line.
 * A door splits its edge into "left segment + lintel + right segment" — three boxes replacing one.
 * No polygon offsetting, no CSG.
 */
import type { Door, Vec2 } from '@/api';
import { planToWorld, type Vec3 } from './coords';

export interface BoxDesc {
  /** World-space centre. */
  center: Vec3;
  /** [width along edge, height, thickness]. */
  size: Vec3;
  /** Rotation around world Y in radians. */
  rotationY: number;
  /** 'wall' | 'lintel' — lets the renderer style them differently if it wants. */
  part?: 'wall' | 'lintel';
}

export interface WallOptions {
  height: number; // m
  thickness?: number; // m, default 0.15
  doors?: Door[];
}

export const WALL_THICKNESS = 0.15;
export const DOOR_HEIGHT = 2.1;

export function wallBoxes(polygon: Vec2[], opts: WallOptions): BoxDesc[] {
  const t = opts.thickness ?? WALL_THICKNESS;
  const h = opts.height;
  const out: BoxDesc[] = [];
  if (polygon.length < 2) return out;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const ux = dx / len;
    const uy = dy / len;
    // Edge direction (dx, dy) in plan = (dx, dz) in world. Rotation about +Y turns +X toward -Z,
    // so to point +X along (dx, dz) we rotate by -atan2(dz, dx).
    const rotationY = -Math.atan2(dy, dx);

    // A segment of this edge from s0 to s1 (metres along the edge), full height or a lintel.
    const push = (s0: number, s1: number, y0: number, y1: number, part: BoxDesc['part'], pad: number) => {
      const segLen = s1 - s0;
      if (segLen <= 1e-9 || y1 - y0 <= 1e-9) return;
      const mid: Vec2 = { x: a.x + ux * (s0 + s1) / 2, y: a.y + uy * (s0 + s1) / 2 };
      const [cx, , cz] = planToWorld(mid);
      out.push({ center: [cx, (y0 + y1) / 2, cz], size: [segLen + pad, y1 - y0, t], rotationY, part });
    };

    const doors = (opts.doors ?? [])
      .filter((d) => d.edge === i && d.width > 0)
      .map((d) => ({ s0: Math.max(0, d.offset), s1: Math.min(len, d.offset + d.width), h: d.height ?? DOOR_HEIGHT }))
      .filter((d) => d.s1 > d.s0)
      .sort((p, q) => p.s0 - q.s0);

    if (doors.length === 0) {
      // Extend by thickness so corners close without a mitre.
      push(0, len, 0, h, 'wall', t);
      continue;
    }

    let cursor = 0;
    for (const d of doors) {
      // left segment: pad only at the polygon corner end
      push(cursor, d.s0, 0, h, 'wall', cursor === 0 ? t / 2 : 0);
      // lintel above the opening
      push(d.s0, d.s1, Math.min(d.h, h), h, 'lintel', 0);
      cursor = d.s1;
    }
    push(cursor, len, 0, h, 'wall', t / 2);
  }
  return out;
}
