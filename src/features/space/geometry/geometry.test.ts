import { describe, it, expect } from 'vitest';
import {
  planToWorld,
  worldToPlan,
  snap,
  snapPoint,
  snapRotation,
  pxToM,
  pointInPolygon,
  area,
  wallBoxes,
  WALL_THICKNESS,
  entityBox,
  footprint,
} from './index';

const square = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 3 },
  { x: 0, y: 3 },
];

describe('coords', () => {
  it('plan y maps to world +z', () => {
    expect(planToWorld({ x: 2, y: 3 })).toEqual([2, 0, 3]);
    expect(worldToPlan([2, 0, 3])).toEqual({ x: 2, y: 3 });
  });
  it('px → m via px_per_m', () => {
    expect(pxToM(250, 50)).toBe(5);
  });
  it('snaps to 5 cm grid', () => {
    expect(snap(1.234)).toBeCloseTo(1.25);
    expect(snap(1.226)).toBeCloseTo(1.25);
    expect(snap(1.22)).toBeCloseTo(1.2);
    expect(snapPoint({ x: 0.03, y: 0.08 })).toEqual({ x: 0.05, y: 0.1 });
  });
  it('snaps rotation to 90° and normalises', () => {
    expect(snapRotation(44)).toBe(0);
    expect(snapRotation(46)).toBe(90);
    expect(snapRotation(-90)).toBe(270);
    expect(snapRotation(370)).toBe(0);
  });
});

describe('polygon', () => {
  it('point in / out / on edge', () => {
    expect(pointInPolygon({ x: 1, y: 1 }, square)).toBe(true);
    expect(pointInPolygon({ x: 5, y: 1 }, square)).toBe(false);
    expect(pointInPolygon({ x: 4, y: 1.5 }, square)).toBe(true); // on edge
    expect(pointInPolygon({ x: 0, y: 0 }, square)).toBe(true); // on vertex
  });
  it('L-shaped room', () => {
    const L = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 5 },
      { x: 0, y: 5 },
    ];
    expect(pointInPolygon({ x: 1, y: 4 }, L)).toBe(true);
    expect(pointInPolygon({ x: 5, y: 4 }, L)).toBe(false);
    expect(area(L)).toBe(21);
  });
  it('area', () => {
    expect(area(square)).toBe(12);
  });
});

describe('wallBoxes', () => {
  it('one box per edge, centred on the edge, thickness 0.15', () => {
    const walls = wallBoxes(square, { height: 3 });
    expect(walls).toHaveLength(4);
    // first edge (0,0)→(4,0): mid (2,0), length 4
    expect(walls[0].center).toEqual([2, 1.5, 0]);
    expect(walls[0].size[0]).toBeCloseTo(4 + WALL_THICKNESS);
    expect(walls[0].size[1]).toBe(3);
    expect(walls[0].size[2]).toBe(WALL_THICKNESS);
    expect(walls[0].rotationY).toBeCloseTo(0);
    // second edge (4,0)→(4,3): vertical in plan → rotated -90°
    expect(walls[1].center[0]).toBe(4);
    expect(walls[1].center[2]).toBeCloseTo(1.5);
    expect(Math.abs(walls[1].rotationY)).toBeCloseTo(Math.PI / 2);
  });
  it('skips zero-length edges', () => {
    const poly = [...square, { x: 0, y: 3 }];
    expect(wallBoxes(poly, { height: 3 })).toHaveLength(4);
  });
  it('custom thickness', () => {
    expect(wallBoxes(square, { height: 3, thickness: 0.2 })[0].size[2]).toBe(0.2);
  });

  it('a door splits its edge into left + lintel + right', () => {
    // edge 0: (0,0)→(4,0); door from 1.0 to 2.0, 2.1 high
    const walls = wallBoxes(square, { height: 3, doors: [{ edge: 0, offset: 1, width: 1 }] });
    expect(walls).toHaveLength(6);
    const [left, lintel, right] = walls;
    expect(left.center[0]).toBeCloseTo(0.5);
    expect(left.size[0]).toBeCloseTo(1 + WALL_THICKNESS / 2);
    expect(left.size[1]).toBe(3);
    expect(lintel.part).toBe('lintel');
    expect(lintel.center[0]).toBeCloseTo(1.5);
    expect(lintel.center[1]).toBeCloseTo((2.1 + 3) / 2);
    expect(lintel.size[1]).toBeCloseTo(0.9);
    expect(right.center[0]).toBeCloseTo(3);
    expect(right.size[0]).toBeCloseTo(2 + WALL_THICKNESS / 2);
  });

  it('a door flush with a corner leaves no zero-width segment', () => {
    const walls = wallBoxes(square, { height: 3, doors: [{ edge: 0, offset: 0, width: 1 }] });
    // lintel + right + 3 plain walls
    expect(walls).toHaveLength(5);
    expect(walls[0].part).toBe('lintel');
  });

  it('door on a vertical edge (edge 3: (0,3)→(0,0))', () => {
    const walls = wallBoxes(square, { height: 3, doors: [{ edge: 3, offset: 0.5, width: 1.8 }] });
    const lintel = walls.find((w) => w.part === 'lintel')!;
    // offset 0.5 from (0,3) heading to (0,0): centre at plan y = 3 - 0.5 - 0.9 = 1.6 → world z 1.6
    expect(lintel.center[0]).toBeCloseTo(0);
    expect(lintel.center[2]).toBeCloseTo(1.6);
  });
});

describe('entityBox', () => {
  it('sits on the floor, centred on transform', () => {
    const b = entityBox({ x: 1, y: 2, z: 0, rot: 0 }, { w: 0.9, d: 0.6, h: 2 });
    expect(b.center).toEqual([1, 1, 2]);
    expect(b.size).toEqual([0.9, 2, 0.6]);
    expect(b.rotationY).toBe(-0);
  });
  it('footprint rotates 90°', () => {
    const fp = footprint({ x: 0, y: 0, z: 0, rot: 90 }, { w: 2, d: 1 , h: 1 });
    // After 90° rotation the 2 m width lies along y.
    const xs = fp.map((p) => Math.abs(p.x));
    const ys = fp.map((p) => Math.abs(p.y));
    expect(Math.max(...xs)).toBeCloseTo(0.5);
    expect(Math.max(...ys)).toBeCloseTo(1);
  });
});
