import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Entity } from '@/api';
import { entityBox } from '../geometry';
import { tokens } from '@/theme/tokens';
import { useEditorStore } from '@/store/editor';
import { getPreset, ParametricComponent, CustomModel, MeshStyleContext, type MeshStyle } from '../components';

/**
 * One spatial entity: its visual (parametric or GLB) + Location ID label.
 * Click = select. In top view, press-and-drag = move (committed by the floor on pointer-up).
 */
export function EntityMesh({ entity }: { entity: Entity }) {
  const box = useMemo(() => entityBox(entity.transform, entity.dims), [entity.transform, entity.dims]);
  const preset = getPreset(entity.params.preset as string | undefined, entity.type);

  const selected = useEditorStore((s) => s.selectedCode === entity.code);
  const hovered = useEditorStore((s) => s.hoveredCode === entity.code);
  const placing = useEditorStore((s) => s.placingPresetId !== null);
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const select = useEditorStore((s) => s.select);
  const hover = useEditorStore((s) => s.hover);
  const setDragging = useEditorStore((s) => s.setDragging);

  const style = useMemo<MeshStyle>(
    () => ({
      base: tokens.color.entity[preset.colorToken],
      accent: selected ? tokens.color.selected : hovered ? tokens.color.hovered : null,
      accentStrength: selected ? 1 : 0.6,
    }),
    [preset.colorToken, selected, hovered],
  );

  const onPointerDown = (ev: ThreeEvent<PointerEvent>) => {
    if (placing) return;
    ev.stopPropagation();
    select(entity.code);
    if (cameraMode === 'top' && ev.button === 0) {
      setDragging(entity.id);
    }
  };

  return (
    <group
      position={[box.center[0], entity.transform.z, box.center[2]]}
      rotation-y={box.rotationY}
      name={entity.code}
    >
      <MeshStyleContext.Provider value={style}>
        <group
          onPointerDown={onPointerDown}
          onPointerOver={(ev) => {
            if (placing) return;
            ev.stopPropagation();
            hover(entity.code);
            document.body.style.cursor = cameraMode === 'top' ? 'grab' : 'pointer';
          }}
          onPointerOut={() => {
            hover(null);
            document.body.style.cursor = 'auto';
          }}
        >
          {preset.source.kind === 'parametric' ? (
            <ParametricComponent mesh={preset.source.mesh} dims={entity.dims} params={entity.params} />
          ) : (
            <CustomModel url={preset.source.url} dims={entity.dims} />
          )}
        </group>
      </MeshStyleContext.Provider>

      {/* selection footprint on the floor (also under elevated / wall-hung entities) */}
      {selected && (
        <mesh position={[0, 0.003 - entity.transform.z, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[entity.dims.w + 0.12, entity.dims.d + 0.12]} />
          <meshBasicMaterial color={tokens.color.selected} transparent opacity={0.18} />
        </mesh>
      )}

      <Html
        position={[0, entity.dims.h + 0.15, 0]}
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <span
          data-testid={`label-${entity.code}`}
          style={{
            fontSize: 11,
            padding: '1px 5px',
            borderRadius: 3,
            background: selected ? tokens.color.selected : 'rgba(45,49,51,0.88)',
            color: selected ? '#fff' : tokens.color.text,
            border: `1px solid ${selected ? tokens.color.selected : tokens.color.borderStrong}`,
            fontFamily: tokens.font.mono,
            whiteSpace: 'nowrap',
          }}
        >
          {entity.code}
        </span>
      </Html>
    </group>
  );
}
