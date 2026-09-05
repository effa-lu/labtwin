import { useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Vec2 } from '@/api';
import { useEditorStore } from '@/store/editor';
import { useEntitiesStore } from '@/store/entities';
import { worldToPlan, snapPoint, pointInPolygon } from '../geometry';
import { getPreset, ParametricComponent, CustomModel, MeshStyleContext } from '../components';
import { useHistory, placeEntityCommand, moveEntityCommand } from '../commands';
import { tokens } from '@/theme/tokens';

/**
 * Invisible interaction plane at y = 0 covering the whole scene.
 * - placing mode: shows a ghost of the preset under the pointer; click drops it (inside the room only)
 * - drag mode (top view): moves the dragged entity live; pointer-up commits one move command
 */
export function Floor() {
  const placingPresetId = useEditorStore((s) => s.placingPresetId);
  const placingRot = useEditorStore((s) => s.placingRot);
  const floorPoint = useEditorStore((s) => s.floorPoint);
  const setFloorPoint = useEditorStore((s) => s.setFloorPoint);
  const draggingId = useEditorStore((s) => s.draggingId);
  const setDragging = useEditorStore((s) => s.setDragging);
  const startPlacing = useEditorStore((s) => s.startPlacing);
  const select = useEditorStore((s) => s.select);
  const space = useEntitiesStore((s) => s.space);
  const patch = useEntitiesStore((s) => s._patch);
  const run = useHistory((s) => s.run);

  // Where the drag started, so we can restore visually on an invalid drop.
  const dragStart = useRef<Vec2 | null>(null);

  const toPlan = (ev: ThreeEvent<PointerEvent | MouseEvent>): Vec2 =>
    snapPoint(worldToPlan([ev.point.x, ev.point.y, ev.point.z]));

  const onPointerMove = (ev: ThreeEvent<PointerEvent>) => {
    const p = toPlan(ev);
    if (placingPresetId) {
      setFloorPoint(p);
      return;
    }
    if (draggingId) {
      const ent = useEntitiesStore.getState().entities.find((e) => e.id === draggingId);
      if (!ent) return;
      if (!dragStart.current) dragStart.current = { x: ent.transform.x, y: ent.transform.y };
      // live preview only; command is committed on pointer-up
      patch(draggingId, { transform: { ...ent.transform, x: p.x, y: p.y } });
    }
  };

  const onPointerUp = (ev: ThreeEvent<PointerEvent>) => {
    if (!draggingId) return;
    const id = draggingId;
    const start = dragStart.current;
    dragStart.current = null;
    setDragging(null);
    if (!start) return;
    const ent = useEntitiesStore.getState().entities.find((e) => e.id === id);
    if (!ent) return;
    const p = toPlan(ev);
    // restore the pre-drag position, then apply as a proper command (so undo works)
    patch(id, { transform: { ...ent.transform, x: start.x, y: start.y } });
    const cmd = moveEntityCommand(id, p);
    if (cmd) run(cmd);
  };

  const onClick = (ev: ThreeEvent<MouseEvent>) => {
    if (!placingPresetId) {
      select(null);
      return;
    }
    const preset = getPreset(placingPresetId);
    const cmd = placeEntityCommand(preset, toPlan(ev), placingRot);
    if (cmd) {
      run(cmd);
      // stay in placing mode unless Shift wasn't held — one click = one placement by default
      if (!ev.nativeEvent.shiftKey) startPlacing(null);
    }
  };

  const ghost = placingPresetId && floorPoint ? getPreset(placingPresetId) : null;
  const ghostInside = ghost && space ? pointInPolygon(floorPoint!, space.polygon) : false;

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -0.002, 0]}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onPointerLeave={() => {
          setFloorPoint(null);
          if (draggingId) onPointerUpCancel();
        }}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {ghost && floorPoint && (
        <group position={[floorPoint.x, 0, floorPoint.y]} rotation-y={-(placingRot * Math.PI) / 180}>
          <MeshStyleContext.Provider
            value={{
              base: ghostInside ? tokens.color.entity[ghost.colorToken] : tokens.color.danger,
              accent: ghostInside ? tokens.color.selected : tokens.color.danger,
              accentStrength: 0.5,
            }}
          >
            <group>
              {ghost.source.kind === 'parametric' ? (
                <ParametricComponent mesh={ghost.source.mesh} dims={ghost.dims} params={ghost.params} />
              ) : (
                <CustomModel url={ghost.source.url} dims={ghost.dims} />
              )}
            </group>
          </MeshStyleContext.Provider>
          <mesh position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[ghost.dims.w + 0.12, ghost.dims.d + 0.12]} />
            <meshBasicMaterial
              color={ghostInside ? tokens.color.selected : tokens.color.danger}
              transparent
              opacity={0.22}
            />
          </mesh>
        </group>
      )}
    </>
  );

  function onPointerUpCancel() {
    const id = draggingId!;
    const start = dragStart.current;
    dragStart.current = null;
    setDragging(null);
    const ent = useEntitiesStore.getState().entities.find((e) => e.id === id);
    if (ent && start) patch(id, { transform: { ...ent.transform, x: start.x, y: start.y } });
  }
}
