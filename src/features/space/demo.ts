/**
 * Hard-coded demo scenes so the app has something to show before the database exists.
 * Shape: exactly what api.spaces / api.entities will return later — swap the source, not the scene.
 *
 * Coordinates: metres, plan origin top-left, x right, y down.
 * rot is clockwise as seen on the plan. rot 0 → front faces plan +y (down the screen in top view);
 * 90 → faces −x; 180 → faces −y; 270 → faces +x. Put furniture with its back to the wall.
 * transform.z = elevation of the underside (0 = on the floor; wall-hung cabinets sit higher).
 */
import type { Entity, Space } from '@/api';
import { getPreset } from './components/registry';

export interface DemoScene {
  id: string;
  /** i18n key under scene.* */
  nameKey: string;
  space: Space;
  entities: Entity[];
}

function entityFactory(space: Space) {
  return function e(
    code: string,
    presetId: string,
    label: string,
    x: number,
    y: number,
    rot: number,
    dims?: { w: number; d: number; h: number },
    params: Record<string, number | string | boolean> = {},
    z = 0,
  ): Entity {
    const p = getPreset(presetId);
    return {
      id: `${space.id}-${code}`,
      workspaceId: space.workspaceId,
      spaceId: space.id,
      parentId: null,
      code,
      type: p.type,
      label,
      transform: { x, y, z, rot },
      dims: dims ?? { ...p.dims },
      params: { ...p.params, ...params, preset: p.id },
    };
  };
}

// ---------------------------------------------------------------- Scene 1: L-shaped lab (synthetic)
const lShape: Space = {
  id: 'demo-l',
  workspaceId: 'demo-workspace',
  planId: 'demo-plan',
  code: 'ROOM-01',
  name: 'Demo Lab',
  height: 3.0,
  polygon: [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 4 },
    { x: 5, y: 4 },
    { x: 5, y: 6 },
    { x: 0, y: 6 },
  ],
  // door on the bottom-left wall (edge 5: (0,6)→(0,0)), 0.9 m wide, 0.6 m from the corner
  doors: [{ edge: 5, offset: 0.6, width: 0.9 }],
};
const l = entityFactory(lShape);
const lShapeEntities: Entity[] = [
  l('CAB-01', 'cabinet', 'Solvent cabinet', 0.32, 2.0, 270, undefined, { shelves: 4 }),
  l('CAB-02', 'cabinet', 'Glassware', 0.32, 3.0, 270, undefined, { shelves: 5, doors: 1 }),
  l('BCH-01', 'bench', 'Bench A', 4.0, 0.4, 0, { w: 3.0, d: 0.75, h: 0.9 }),
  l('EQP-02', 'sample-rotavap', 'Rotavap', 4.8, 0.4, 0),
  l('FHD-01', 'fume-hood', 'Fume hood', 7.55, 1.5, 90),
  l('FRZ-01', 'fridge', '-20 °C freezer', 7.65, 3.3, 90),
  l('SNK-01', 'sink', 'Sink', 2.5, 5.7, 180),
  l('SHF-01', 'open-shelf', 'Open shelf', 4.3, 5.8, 180, undefined, { shelves: 5 }),
  l('SAF-01', 'safety-cabinet', 'Flammables', 1.2, 5.75, 180),
  l('EQP-01', 'equipment', 'Centrifuge', 3.0, 3.0, 0),
];

// ---------------------------------------------------------------- Scene 2: corridor lab (Effa's sketch, 2026-09-05)
// Read from the hand drawing: a 6.8 × 2.8 m room. Top wall (y=0), left → right:
//   floor cabinet 1.5×0.5 (h 2.0) · 0.2 gap · small unit 0.6×0.6 (h 1.2) · 0.5 gap ·
//   glovebox 1.5×1.2 (h 1.8) · ~1.0 gap · wall-hung cabinet 1.5 wide (h 1.5 above floor)
// Bottom wall (y=2.8), left → right:
//   bench with worktop, length × 0.6, with upper cabinets 0.4 deep × 1.2 high above ·
//   sink 0.4 · fume hood 2.2×1.0 (h 2.5)
// Left wall: 0.5 solid · 1.8 door · 0.5 solid.
// Assumptions (not on the sketch): room depth 2.8 = 0.5+1.8+0.5; bench depth 0.6 / height 0.9;
// upper cabinets hung at 1.4; wall cabinet depth 0.4 hung at 1.5; total length 6.8 (gap ≈ 1.0).
const corridor: Space = {
  id: 'demo-corridor',
  workspaceId: 'demo-workspace',
  planId: 'demo-plan-2',
  code: 'ROOM-02',
  name: 'Corridor Lab (sketch)',
  height: 3.0,
  polygon: [
    { x: 0, y: 0 },
    { x: 6.8, y: 0 },
    { x: 6.8, y: 2.8 },
    { x: 0, y: 2.8 },
  ],
  // edge 3 runs (0,2.8)→(0,0); door starts 0.5 m from (0,2.8) and is 1.8 m wide → spans y 2.3…0.5
  doors: [{ edge: 3, offset: 0.5, width: 1.8 }],
};
const c = entityFactory(corridor);
const corridorEntities: Entity[] = [
  // top wall
  c('CAB-01', 'cabinet', '落地柜', 0.75, 0.25, 0, { w: 1.5, d: 0.5, h: 2.0 }, { shelves: 4, doors: 2 }),
  c('EQP-01', 'equipment', '小设备', 2.0, 0.3, 0, { w: 0.6, d: 0.6, h: 1.2 }),
  c('EQP-02', 'glovebox', '手套箱', 3.55, 0.6, 0, { w: 1.5, d: 1.2, h: 1.8 }),
  c('CAB-02', 'cabinet', '挂柜', 6.05, 0.2, 0, { w: 1.5, d: 0.4, h: 0.7 }, { shelves: 2, doors: 2 }, 1.5),
  // bottom wall
  c('BCH-01', 'bench', '落地柜（台面）', 2.1, 2.5, 180, { w: 4.2, d: 0.6, h: 0.9 }),
  c('CAB-03', 'cabinet', '台面上方吊柜', 2.1, 2.6, 180, { w: 4.2, d: 0.4, h: 1.2 }, { shelves: 2, doors: 2 }, 1.4),
  c('SNK-01', 'sink', 'Sink', 4.4, 2.5, 180, { w: 0.4, d: 0.6, h: 0.9 }),
  c('FHD-01', 'fume-hood', '通风柜', 5.7, 2.3, 180, { w: 2.2, d: 1.0, h: 2.5 }),
];

export const DEMO_SCENES: DemoScene[] = [
  { id: 'l-shape', nameKey: 'lShape', space: lShape, entities: lShapeEntities },
  { id: 'corridor', nameKey: 'corridor', space: corridor, entities: corridorEntities },
];

export const demoSpace = lShape;
export const demoEntities = lShapeEntities;
