import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Room } from './Room';
import { EntityMesh } from './EntityMesh';
import { Cameras } from './Cameras';
import { Floor } from './Floor';
import { tokens } from '@/theme/tokens';
import { useEditorStore } from '@/store/editor';
import { useEntitiesStore } from '@/store/entities';
import { useHistory, deleteEntityCommand, rotateEntityCommand } from '../commands';

/**
 * The 3D shell. Everything drawn here is derived from Space + Entity records —
 * there is no mesh file anywhere except the optional GLB skins in public/models/.
 */
export function SpaceScene() {
  const space = useEntitiesStore((s) => s.space);
  const entities = useEntitiesStore((s) => s.entities);
  const draggingId = useEditorStore((s) => s.draggingId);
  const cameraMode = useEditorStore((s) => s.cameraMode);

  useKeyboard();

  if (!space) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      style={{ background: tokens.color.bg, touchAction: 'none' }}
      data-testid="space-canvas"
    >
      <Cameras polygon={space.polygon} controlsEnabled={!draggingId} />

      <ambientLight intensity={1.0} />
      <directionalLight
        position={[6, 30, 10]}
        intensity={0.9}
        // shadows clutter the plan view; keep them for the 3D preview only
        castShadow={cameraMode !== 'top'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      <Grid
        position={[0, -0.001, 0]}
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={tokens.color.grid}
        sectionSize={1}
        sectionThickness={0.8}
        sectionColor={tokens.color.gridSection}
        fadeDistance={80}
        infiniteGrid
      />

      <Floor />
      <Room space={space} />
      {entities.map((en) => (
        <EntityMesh key={en.id} entity={en} />
      ))}
    </Canvas>
  );
}

/** Esc cancels placing / clears selection; Delete removes; R rotates; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y. */
function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const ed = useEditorStore.getState();
      const h = useHistory.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) h.redo();
        else h.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        h.redo();
        return;
      }
      if (e.key === 'Escape') {
        if (ed.placingPresetId) ed.startPlacing(null);
        else ed.select(null);
        return;
      }
      const selected = ed.selectedCode
        ? useEntitiesStore.getState().entities.find((x) => x.code === ed.selectedCode)
        : null;
      if (e.key.toLowerCase() === 'r') {
        if (ed.placingPresetId) ed.rotatePlacing();
        else if (selected) {
          const cmd = rotateEntityCommand(selected.id);
          if (cmd) h.run(cmd);
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        const cmd = deleteEntityCommand(selected.id);
        if (cmd) h.run(cmd);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
