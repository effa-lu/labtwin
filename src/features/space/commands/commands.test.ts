import { describe, it, expect, beforeEach } from 'vitest';
import { useEntitiesStore } from '@/store/entities';
import { useEditorStore } from '@/store/editor';
import { useHistory } from './history';
import {
  placeEntityCommand,
  deleteEntityCommand,
  moveEntityCommand,
  rotateEntityCommand,
  setDimsCommand,
} from './entityCommands';
import { getPreset } from '../components/registry';
import { demoSpace } from '../demo';

const cab = getPreset('cabinet');

beforeEach(() => {
  useEntitiesStore.getState().load(demoSpace, []);
  useHistory.getState().clear();
  useEditorStore.getState().select(null);
});

describe('place', () => {
  it('allocates <TYPE>-NN, snaps to 5 cm, selects, and is undoable', () => {
    const cmd = placeEntityCommand(cab, { x: 1.012, y: 1.04 });
    expect(cmd).not.toBeNull();
    useHistory.getState().run(cmd!);
    const es = useEntitiesStore.getState().entities;
    expect(es).toHaveLength(1);
    expect(es[0].code).toBe('CAB-01');
    expect(es[0].transform).toEqual({ x: 1, y: 1.05, z: 0, rot: 0 });
    expect(es[0].params.preset).toBe('cabinet');
    expect(useEditorStore.getState().selectedCode).toBe('CAB-01');

    useHistory.getState().undo();
    expect(useEntitiesStore.getState().entities).toHaveLength(0);
    expect(useEditorStore.getState().selectedCode).toBeNull();

    useHistory.getState().redo();
    expect(useEntitiesStore.getState().entities[0].code).toBe('CAB-01'); // same code on redo
  });

  it('refuses points outside the room', () => {
    expect(placeEntityCommand(cab, { x: 7, y: 5.5 })).toBeNull(); // in the notch of the L
    expect(placeEntityCommand(cab, { x: -1, y: 1 })).toBeNull();
  });

  it('never reuses a code after delete', () => {
    const h = useHistory.getState();
    h.run(placeEntityCommand(cab, { x: 1, y: 1 })!);
    h.run(placeEntityCommand(cab, { x: 2, y: 1 })!);
    const second = useEntitiesStore.getState().entities[1];
    h.run(deleteEntityCommand(second.id)!);
    h.run(placeEntityCommand(cab, { x: 3, y: 1 })!);
    const codes = useEntitiesStore.getState().entities.map((e) => e.code);
    expect(codes).toEqual(['CAB-01', 'CAB-03']);
  });

  it('counters continue from loaded data', () => {
    useEntitiesStore.getState().load(demoSpace, [
      { ...placeholder('CAB-07') },
    ]);
    useHistory.getState().run(placeEntityCommand(cab, { x: 1, y: 1 })!);
    expect(useEntitiesStore.getState().entities.at(-1)!.code).toBe('CAB-08');
  });
});

describe('move / rotate / resize', () => {
  it('move snaps and rejects outside; rotate steps 90°; resize clamps', () => {
    const h = useHistory.getState();
    h.run(placeEntityCommand(cab, { x: 1, y: 1 })!);
    const id = useEntitiesStore.getState().entities[0].id;

    h.run(moveEntityCommand(id, { x: 2.03, y: 2.02 })!);
    expect(useEntitiesStore.getState().entities[0].transform.x).toBeCloseTo(2.05);
    expect(moveEntityCommand(id, { x: 7, y: 5.5 })).toBeNull();

    h.run(rotateEntityCommand(id)!);
    h.run(rotateEntityCommand(id)!);
    expect(useEntitiesStore.getState().entities[0].transform.rot).toBe(180);
    h.undo();
    expect(useEntitiesStore.getState().entities[0].transform.rot).toBe(90);

    h.run(setDimsCommand(id, { w: 9, d: 0.6, h: 2 })!);
    expect(useEntitiesStore.getState().entities[0].dims.w).toBe(cab.maxDims.w);
  });
});

function placeholder(code: string) {
  return {
    id: `x-${code}`,
    workspaceId: demoSpace.workspaceId,
    spaceId: demoSpace.id,
    parentId: null,
    code,
    type: 'CAB' as const,
    label: code,
    transform: { x: 1, y: 1, z: 0, rot: 0 },
    dims: { w: 0.9, d: 0.6, h: 2 },
    params: {},
  };
}
