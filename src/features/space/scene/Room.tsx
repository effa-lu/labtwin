import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Space } from '@/api';
import { wallBoxes, pointInPolygon } from '../geometry';
import { tokens } from '@/theme/tokens';

const WALL_OPACITY = 0.85;
const CUTAWAY_OPACITY = 0.08;

/**
 * Floor + walls derived from the space polygon. Geometry math lives in ../geometry.
 * Dollhouse cutaway: a wall whose outside faces the camera fades out so the room stays readable
 * from any angle. In the top view nothing fades (the camera is above every wall).
 */
export function Room({ space }: { space: Space }) {
  const walls = useMemo(
    () => wallBoxes(space.polygon, { height: space.height, doors: space.doors }),
    [space],
  );

  // outward normal (plan coords) per wall, for the cutaway test
  const outward = useMemo(
    () =>
      walls.map((w) => {
        const [cx, , cz] = w.center;
        // wall runs along local +x; its plan normal is (−sin, cos) of the edge angle
        const ang = -w.rotationY;
        const n = { x: -Math.sin(ang), y: Math.cos(ang) };
        const probe = { x: cx + n.x * 0.3, y: cz + n.y * 0.3 };
        return pointInPolygon(probe, space.polygon) ? { x: -n.x, y: -n.y } : n;
      }),
    [walls, space.polygon],
  );

  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(({ camera }) => {
    walls.forEach((w, i) => {
      const m = mats.current[i];
      if (!m) return;
      const toCam = { x: camera.position.x - w.center[0], y: camera.position.z - w.center[2] };
      const horiz = Math.hypot(toCam.x, toCam.y);
      const elevation = camera.position.y - w.center[1];
      // camera is outside this wall and not looking steeply down → cut it away
      const outside = toCam.x * outward[i].x + toCam.y * outward[i].y > 0;
      const steep = elevation > horiz * 2.5;
      // lintels fade in the top view so door openings read on the plan
      const target =
        outside && !steep ? CUTAWAY_OPACITY : w.part === 'lintel' && steep ? 0.25 : WALL_OPACITY;
      m.opacity += (target - m.opacity) * 0.25;
    });
  });

  const floorShape = useMemo(() => {
    const s = new THREE.Shape();
    space.polygon.forEach((p, i) => {
      // ShapeGeometry is built in XY; rotating it -90° about X sends shape (x, y) → world (x, 0, -y).
      // We need world z = +plan y, so feed (x, -y).
      if (i === 0) s.moveTo(p.x, -p.y);
      else s.lineTo(p.x, -p.y);
    });
    s.closePath();
    return s;
  }, [space]);

  return (
    <group name={space.code}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0}>
        <shapeGeometry args={[floorShape]} />
        <meshStandardMaterial color={tokens.color.floor} />
      </mesh>
      {walls.map((w, i) => (
        <mesh key={i} position={w.center} rotation-y={w.rotationY} receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color={tokens.color.wall}
            transparent
            opacity={WALL_OPACITY}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
