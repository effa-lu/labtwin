import { create } from 'zustand';
import type { Vec2 } from '@/api';

export type CameraMode = 'top' | 'perspective';
export type View = 'space' | 'library';

interface EditorState {
  view: View;
  /** Which demo scene is loaded (until workspaces come from the database). */
  sceneId: string;
  cameraMode: CameraMode;
  selectedCode: string | null;
  hoveredCode: string | null;
  /** Preset id currently being placed (click on the floor to drop it), or null. */
  placingPresetId: string | null;
  /** Rotation for the ghost while placing (degrees, 90° steps). */
  placingRot: number;
  /** Where the pointer currently is on the floor plane (plan coords), or null. */
  floorPoint: Vec2 | null;
  /** Entity id being dragged in the top view, or null. */
  draggingId: string | null;

  setView: (v: View) => void;
  setScene: (id: string) => void;
  setCameraMode: (m: CameraMode) => void;
  toggleCameraMode: () => void;
  select: (code: string | null) => void;
  hover: (code: string | null) => void;
  startPlacing: (presetId: string | null) => void;
  rotatePlacing: () => void;
  setFloorPoint: (p: Vec2 | null) => void;
  setDragging: (id: string | null) => void;
}

/**
 * UI state of Space Studio. No domain data lives here —
 * spaces/entities come from the entities store and only change via commands.
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  view: 'space',
  sceneId: 'l-shape',
  cameraMode: 'top',
  selectedCode: null,
  hoveredCode: null,
  placingPresetId: null,
  placingRot: 0,
  floorPoint: null,
  draggingId: null,

  setView: (view) => set({ view, placingPresetId: null, draggingId: null }),
  setScene: (sceneId) => set({ sceneId, selectedCode: null, hoveredCode: null, placingPresetId: null, draggingId: null }),
  setCameraMode: (cameraMode) => set({ cameraMode, draggingId: null }),
  toggleCameraMode: () =>
    set({ cameraMode: get().cameraMode === 'top' ? 'perspective' : 'top', draggingId: null }),
  select: (selectedCode) => set({ selectedCode }),
  hover: (hoveredCode) => set({ hoveredCode }),
  startPlacing: (placingPresetId) =>
    set({ placingPresetId, placingRot: 0, selectedCode: placingPresetId ? null : get().selectedCode }),
  rotatePlacing: () => set({ placingRot: (get().placingRot + 90) % 360 }),
  setFloorPoint: (floorPoint) => set({ floorPoint }),
  setDragging: (draggingId) => set({ draggingId }),
}));
