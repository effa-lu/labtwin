import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { Vec2 } from '@/api';
import { bounds } from '../geometry';
import { useEditorStore } from '@/store/editor';

/**
 * Two cameras, one active at a time.
 * top: orthographic, straight down, rotation locked (pan + zoom only) — the default editing view.
 * perspective: free orbit — the preview.
 */
export function Cameras({ polygon, controlsEnabled = true }: { polygon: Vec2[]; controlsEnabled?: boolean }) {
  const mode = useEditorStore((s) => s.cameraMode);
  const size = useThree((s) => s.size);
  const b = bounds(polygon);
  const cx = (b.min.x + b.max.x) / 2;
  const cz = (b.min.y + b.max.y) / 2;
  const spanX = Math.max(1, b.max.x - b.min.x);
  const spanY = Math.max(1, b.max.y - b.min.y);
  const span = Math.max(spanX, spanY);
  // fit the room into ~80% of the viewport (pixels per metre)
  const fitZoom = Math.min(size.width / spanX, size.height / spanY) * 0.8;

  if (mode === 'top') {
    return (
      <>
        <OrthographicCamera
          makeDefault
          position={[cx, 50, cz]}
          up={[0, 0, -1]}
          zoom={fitZoom}
          near={0.1}
          far={200}
        />
        <OrbitControls
          enabled={controlsEnabled}
          target={[cx, 0, cz]}
          enableRotate={false}
          enableDamping={false}
          minZoom={fitZoom * 0.3}
          maxZoom={fitZoom * 6}
          // left button is reserved for select / drag-move; pan with right button or two-finger drag
          mouseButtons={{ LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        />
      </>
    );
  }

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={45}
        position={[cx + span * 0.9, span * 0.9, cz + span * 0.9]}
        near={0.1}
        far={200}
      />
      <OrbitControls
        enabled={controlsEnabled}
        target={[cx, 0.8, cz]}
        enableDamping
        dampingFactor={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={60}
      />
    </>
  );
}
