import { createContext, useContext } from 'react';
import * as THREE from 'three';

/** Visual state shared by every Part inside one entity. */
export interface MeshStyle {
  /** Base colour of the preset (from tokens). */
  base: string;
  /** Accent colour when selected/hovered, else null. */
  accent: string | null;
  /** 0 = none, 1 = strong. */
  accentStrength: number;
}

export const MeshStyleContext = createContext<MeshStyle>({
  base: '#cccccc',
  accent: null,
  accentStrength: 0,
});

export function useMeshStyle(): MeshStyle {
  return useContext(MeshStyleContext);
}

const cache = new Map<string, string>();

/** Lighten (+) or darken (−) a hex colour by a lightness delta in [−1, 1]. Cached. */
export function shade(hex: string, delta: number): string {
  const key = `${hex}|${delta}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + delta)));
  const out = `#${c.getHexString()}`;
  cache.set(key, out);
  return out;
}

/** Panel thickness used across all parametric meshes (m). */
export const T = 0.02;
