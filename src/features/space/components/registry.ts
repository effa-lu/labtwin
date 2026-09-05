/**
 * Component library registry.
 *
 * Two kinds of preset:
 *   parametric — drawn in code from dims + params (basic furniture: cabinets, benches, hoods…)
 *   glb        — a hand-made low-poly model in public/models/, auto-fitted to dims (special equipment)
 *
 * Adding a custom model = one entry here + one .glb file. See docs/models.md for the modelling spec.
 * Changing this file must never require changing the mesh generators.
 */
import type { Dims, EntityType } from '@/api';
import type { tokens } from '@/theme/tokens';

export type ParametricMesh =
  | 'cabinet'
  | 'openShelf'
  | 'bench'
  | 'fumeHood'
  | 'fridge'
  | 'safetyCabinet'
  | 'sink'
  | 'equipment'
  | 'glovebox';

export type PresetSource =
  | { kind: 'parametric'; mesh: ParametricMesh }
  | { kind: 'glb'; url: string };

export interface ParamField {
  key: string;
  min: number;
  max: number;
  step: number;
}

export interface ComponentPreset {
  /** Stable id, stored in entity.params.preset. */
  id: string;
  /** Location-ID prefix this preset produces (CAB, FHD, …). */
  type: EntityType;
  source: PresetSource;
  dims: Dims;
  minDims: Dims;
  maxDims: Dims;
  params: Record<string, number | string | boolean>;
  /** Editable numeric params shown in the inspector. */
  paramFields: ParamField[];
  /** Which param (if any) expands into sub-locations CAB-01-S1…Sn. */
  subLocationParam: string | null;
  colorToken: keyof typeof tokens.color.entity;
  /** lucide icon name, resolved in the palette. */
  icon: string;
  /** Library group for the palette. */
  group: 'basic' | 'custom';
}

const BASIC: ComponentPreset[] = [
  {
    id: 'cabinet',
    type: 'CAB',
    source: { kind: 'parametric', mesh: 'cabinet' },
    dims: { w: 0.9, d: 0.6, h: 2.0 },
    minDims: { w: 0.4, d: 0.3, h: 0.5 },
    maxDims: { w: 6.0, d: 0.9, h: 2.6 },
    params: { shelves: 4, doors: 2 },
    paramFields: [
      { key: 'shelves', min: 1, max: 8, step: 1 },
      { key: 'doors', min: 1, max: 2, step: 1 },
    ],
    subLocationParam: 'shelves',
    colorToken: 'CAB',
    icon: 'Archive',
    group: 'basic',
  },
  {
    id: 'open-shelf',
    type: 'SHF',
    source: { kind: 'parametric', mesh: 'openShelf' },
    dims: { w: 1.0, d: 0.4, h: 2.0 },
    minDims: { w: 0.4, d: 0.25, h: 0.6 },
    maxDims: { w: 3.0, d: 0.8, h: 2.6 },
    params: { shelves: 5 },
    paramFields: [{ key: 'shelves', min: 1, max: 10, step: 1 }],
    subLocationParam: 'shelves',
    colorToken: 'SHF',
    icon: 'Layers',
    group: 'basic',
  },
  {
    id: 'bench',
    type: 'BCH',
    source: { kind: 'parametric', mesh: 'bench' },
    dims: { w: 1.8, d: 0.75, h: 0.9 },
    minDims: { w: 0.6, d: 0.5, h: 0.7 },
    maxDims: { w: 6.0, d: 1.5, h: 1.1 },
    params: { base: 'cabinet' }, // 'cabinet' | 'legs'
    paramFields: [],
    subLocationParam: null,
    colorToken: 'BCH',
    icon: 'Table2',
    group: 'basic',
  },
  {
    id: 'fume-hood',
    type: 'FHD',
    source: { kind: 'parametric', mesh: 'fumeHood' },
    dims: { w: 1.5, d: 0.9, h: 2.4 },
    minDims: { w: 1.0, d: 0.7, h: 2.0 },
    maxDims: { w: 3.0, d: 1.2, h: 2.8 },
    params: { sashOpen: 0.4 },
    paramFields: [{ key: 'sashOpen', min: 0, max: 1, step: 0.1 }],
    subLocationParam: null,
    colorToken: 'FHD',
    icon: 'Wind',
    group: 'basic',
  },
  {
    id: 'fridge',
    type: 'FRZ',
    source: { kind: 'parametric', mesh: 'fridge' },
    dims: { w: 0.7, d: 0.7, h: 1.8 },
    minDims: { w: 0.5, d: 0.5, h: 0.8 },
    maxDims: { w: 1.5, d: 1.0, h: 2.2 },
    params: { doors: 1, shelves: 4 },
    paramFields: [
      { key: 'doors', min: 1, max: 2, step: 1 },
      { key: 'shelves', min: 1, max: 6, step: 1 },
    ],
    subLocationParam: 'shelves',
    colorToken: 'FRZ',
    icon: 'Refrigerator',
    group: 'basic',
  },
  {
    id: 'safety-cabinet',
    type: 'SAF',
    source: { kind: 'parametric', mesh: 'safetyCabinet' },
    dims: { w: 0.9, d: 0.5, h: 1.65 },
    minDims: { w: 0.5, d: 0.4, h: 0.6 },
    maxDims: { w: 1.5, d: 0.7, h: 2.0 },
    params: { shelves: 3 },
    paramFields: [{ key: 'shelves', min: 1, max: 5, step: 1 }],
    subLocationParam: 'shelves',
    colorToken: 'SAF',
    icon: 'ShieldAlert',
    group: 'basic',
  },
  {
    id: 'sink',
    type: 'SNK',
    source: { kind: 'parametric', mesh: 'sink' },
    dims: { w: 1.2, d: 0.6, h: 0.9 },
    minDims: { w: 0.4, d: 0.45, h: 0.7 },
    maxDims: { w: 2.4, d: 0.8, h: 1.0 },
    params: {},
    paramFields: [],
    subLocationParam: null,
    colorToken: 'SNK',
    icon: 'Droplets',
    group: 'basic',
  },
  {
    id: 'glovebox',
    type: 'EQP',
    source: { kind: 'parametric', mesh: 'glovebox' },
    dims: { w: 1.5, d: 1.2, h: 1.8 },
    minDims: { w: 0.9, d: 0.7, h: 1.4 },
    maxDims: { w: 3.0, d: 1.5, h: 2.4 },
    params: { ports: 2 },
    paramFields: [{ key: 'ports', min: 1, max: 4, step: 1 }],
    subLocationParam: null,
    colorToken: 'GLV',
    icon: 'Hand',
    group: 'basic',
  },
  {
    id: 'equipment',
    type: 'EQP',
    source: { kind: 'parametric', mesh: 'equipment' },
    dims: { w: 0.6, d: 0.6, h: 0.6 },
    minDims: { w: 0.2, d: 0.2, h: 0.2 },
    maxDims: { w: 3.0, d: 3.0, h: 2.5 },
    params: {},
    paramFields: [],
    subLocationParam: null,
    colorToken: 'EQP',
    icon: 'Box',
    group: 'basic',
  },
];

/**
 * Custom low-poly models. One entry per .glb in public/models/.
 * `dims` is the real-world footprint the model is fitted into (metres).
 */
const CUSTOM: ComponentPreset[] = [
  {
    id: 'sample-rotavap',
    type: 'EQP',
    source: { kind: 'glb', url: '/models/sample-rotavap.glb' },
    dims: { w: 0.55, d: 0.35, h: 0.9 },
    minDims: { w: 0.3, d: 0.2, h: 0.5 },
    maxDims: { w: 1.0, d: 0.8, h: 1.4 },
    params: {},
    paramFields: [],
    subLocationParam: null,
    colorToken: 'EQP',
    icon: 'FlaskConical',
    group: 'custom',
  },
];

export const PRESETS: ComponentPreset[] = [...BASIC, ...CUSTOM];

const byId = new Map(PRESETS.map((p) => [p.id, p]));
const byType = new Map(BASIC.map((p) => [p.type, p]));

export function getPreset(id: string | undefined, type?: EntityType): ComponentPreset {
  if (id && byId.has(id)) return byId.get(id)!;
  if (type && byType.has(type)) return byType.get(type)!;
  return byType.get('EQP')!;
}

export function clampDims(preset: ComponentPreset, dims: Dims): Dims {
  const c = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    w: c(dims.w, preset.minDims.w, preset.maxDims.w),
    d: c(dims.d, preset.minDims.d, preset.maxDims.d),
    h: c(dims.h, preset.minDims.h, preset.maxDims.h),
  };
}
