import type { Dims, Entity, Transform, Vec2 } from '@/api';
import { useEntitiesStore } from '@/store/entities';
import { useEditorStore } from '@/store/editor';
import { getPreset, clampDims, type ComponentPreset } from '../components/registry';
import { pointInPolygon, snapPoint, snapRotation } from '../geometry';
import type { Command } from './history';

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Place a preset at a plan point. Returns null (no command) if the point is outside the room.
 * The Location ID is allocated on first `do()` and kept across undo/redo, so redo restores
 * the same code — codes are never reused.
 */
export function placeEntityCommand(
  preset: ComponentPreset,
  at: Vec2,
  rot = 0,
): Command | null {
  const st = useEntitiesStore.getState();
  const space = st.space;
  if (!space) return null;
  const p = snapPoint(at);
  if (!pointInPolygon(p, space.polygon)) return null;

  let entity: Entity | null = null;
  return {
    label: `place ${preset.id}`,
    do: () => {
      const s = useEntitiesStore.getState();
      if (!entity) {
        const code = s._nextCode(preset.type);
        entity = {
          id: uid(),
          workspaceId: space.workspaceId,
          spaceId: space.id,
          parentId: null,
          code,
          type: preset.type,
          label: code,
          transform: { x: p.x, y: p.y, z: 0, rot: snapRotation(rot) },
          dims: { ...preset.dims },
          params: { ...preset.params, preset: preset.id },
        };
      }
      s._insert(entity);
      useEditorStore.getState().select(entity.code);
    },
    undo: () => {
      if (!entity) return;
      useEntitiesStore.getState()._remove(entity.id);
      const ed = useEditorStore.getState();
      if (ed.selectedCode === entity.code) ed.select(null);
    },
  };
}

export function deleteEntityCommand(id: string): Command | null {
  const entity = useEntitiesStore.getState().entities.find((e) => e.id === id);
  if (!entity) return null;
  return {
    label: `delete ${entity.code}`,
    do: () => {
      useEntitiesStore.getState()._remove(entity.id);
      const ed = useEditorStore.getState();
      if (ed.selectedCode === entity.code) ed.select(null);
    },
    undo: () => {
      useEntitiesStore.getState()._insert(entity);
    },
  };
}

export function moveEntityCommand(id: string, to: Vec2): Command | null {
  const st = useEntitiesStore.getState();
  const entity = st.entities.find((e) => e.id === id);
  if (!entity || !st.space) return null;
  const p = snapPoint(to);
  if (!pointInPolygon(p, st.space.polygon)) return null;
  const before: Transform = entity.transform;
  const after: Transform = { ...before, x: p.x, y: p.y };
  if (before.x === after.x && before.y === after.y) return null;
  return {
    label: `move ${entity.code}`,
    do: () => useEntitiesStore.getState()._patch(id, { transform: after }),
    undo: () => useEntitiesStore.getState()._patch(id, { transform: before }),
  };
}

export function rotateEntityCommand(id: string, deltaDeg = 90): Command | null {
  const entity = useEntitiesStore.getState().entities.find((e) => e.id === id);
  if (!entity) return null;
  const before = entity.transform;
  const after = { ...before, rot: snapRotation(before.rot + deltaDeg) };
  return {
    label: `rotate ${entity.code}`,
    do: () => useEntitiesStore.getState()._patch(id, { transform: after }),
    undo: () => useEntitiesStore.getState()._patch(id, { transform: before }),
  };
}

export function setDimsCommand(id: string, dims: Dims): Command | null {
  const entity = useEntitiesStore.getState().entities.find((e) => e.id === id);
  if (!entity) return null;
  const preset = getPreset(entity.params.preset as string | undefined, entity.type);
  const after = clampDims(preset, dims);
  const before = entity.dims;
  if (before.w === after.w && before.d === after.d && before.h === after.h) return null;
  return {
    label: `resize ${entity.code}`,
    do: () => useEntitiesStore.getState()._patch(id, { dims: after }),
    undo: () => useEntitiesStore.getState()._patch(id, { dims: before }),
  };
}

export function setParamCommand(id: string, key: string, value: number | string | boolean): Command | null {
  const entity = useEntitiesStore.getState().entities.find((e) => e.id === id);
  if (!entity) return null;
  if (entity.params[key] === value) return null;
  const before = entity.params;
  const after = { ...before, [key]: value };
  return {
    label: `set ${entity.code}.${key}`,
    do: () => useEntitiesStore.getState()._patch(id, { params: after }),
    undo: () => useEntitiesStore.getState()._patch(id, { params: before }),
  };
}

export function setLabelCommand(id: string, label: string): Command | null {
  const entity = useEntitiesStore.getState().entities.find((e) => e.id === id);
  if (!entity || entity.label === label) return null;
  const before = entity.label;
  return {
    label: `rename ${entity.code}`,
    do: () => useEntitiesStore.getState()._patch(id, { label }),
    undo: () => useEntitiesStore.getState()._patch(id, { label: before }),
  };
}
