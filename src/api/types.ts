/**
 * Domain types. These are what the rest of the app sees.
 * Database rows never leak past src/api/ — map them here.
 *
 * Units: metres everywhere. 2D coords: origin top-left of the plan, x right, y down.
 */

export type UUID = string;

export interface Workspace {
  id: UUID;
  name: string;
  slug: string;
  region: 'us-west' | 'ap';
  createdAt: string;
}

export interface Plan {
  id: UUID;
  workspaceId: UUID;
  imageUrl: string;
  pxPerM: number;
  levelHeight: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** An opening in one polygon edge. `offset` is measured along the edge from its start vertex. */
export interface Door {
  edge: number; // index of polygon[i] → polygon[i+1]
  offset: number; // m from polygon[edge]
  width: number; // m
  height?: number; // m, default 2.1
}

/** A room. `polygon` is the single source of truth for walls + floor. */
export interface Space {
  id: UUID;
  workspaceId: UUID;
  planId: UUID;
  code: string; // ROOM-01
  name: string;
  polygon: Vec2[];
  doors?: Door[];
  height: number;
}

export type EntityType = 'CAB' | 'SHF' | 'BCH' | 'FHD' | 'FRZ' | 'SAF' | 'SNK' | 'EQP';

export interface Transform {
  x: number;
  y: number; // plan-space y (maps to +z in three.js)
  z: number; // elevation, usually 0
  rot: number; // degrees, 90° steps
}

export interface Dims {
  w: number;
  d: number;
  h: number;
}

/** Spatial Entity = Identity (code) + Location (transform) + Information (items, notes…). */
export interface Entity {
  id: UUID;
  workspaceId: UUID;
  spaceId: UUID;
  parentId: UUID | null;
  code: string; // CAB-01, CAB-01-S2 — immutable once assigned
  type: EntityType;
  label: string;
  transform: Transform;
  dims: Dims;
  /** JSON scalars only (shelves, doors, preset id…). */
  params: Record<string, number | string | boolean>;
}

export interface Item {
  id: UUID;
  workspaceId: UUID;
  entityId: UUID;
  name: string;
  qty: number;
  unit: string;
}
