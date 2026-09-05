import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset, clampDims } from './registry';
import { tokens } from '@/theme/tokens';

describe('component registry', () => {
  it('has unique ids', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all 8 ID prefixes (EQP twice: generic box + glovebox)', () => {
    const basic = PRESETS.filter((p) => p.group === 'basic').map((p) => p.type);
    expect([...basic].sort()).toEqual(['BCH', 'CAB', 'EQP', 'EQP', 'FHD', 'FRZ', 'SAF', 'SHF', 'SNK']);
  });

  it('every colorToken exists in tokens', () => {
    for (const p of PRESETS) expect(tokens.color.entity).toHaveProperty(p.colorToken);
  });

  it('default dims sit inside min/max', () => {
    for (const p of PRESETS) {
      expect(clampDims(p, p.dims)).toEqual(p.dims);
    }
  });

  it('subLocationParam, when set, names a numeric param', () => {
    for (const p of PRESETS) {
      if (p.subLocationParam) expect(typeof p.params[p.subLocationParam]).toBe('number');
    }
  });

  it('getPreset falls back by type, then to equipment', () => {
    expect(getPreset('cabinet').id).toBe('cabinet');
    expect(getPreset('nope', 'FHD').id).toBe('fume-hood');
    expect(getPreset(undefined).id).toBe('equipment');
  });

  it('clampDims clamps', () => {
    const cab = getPreset('cabinet');
    expect(clampDims(cab, { w: 10, d: 0.1, h: 2 })).toEqual({ w: cab.maxDims.w, d: cab.minDims.d, h: 2 });
  });
});
