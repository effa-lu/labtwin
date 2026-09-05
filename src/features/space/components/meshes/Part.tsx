import { useMeshStyle } from './style';

interface PartProps {
  /** Centre position in entity-local metres: x right, y up (0 = floor), z front (+). */
  pos: [number, number, number];
  size: [number, number, number];
  /** Absolute colour; defaults to the entity base colour. */
  color?: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  rotation?: [number, number, number];
}

/** One box of a parametric component. Picks up selection tint from MeshStyleContext. */
export function Part({
  pos,
  size,
  color,
  opacity = 1,
  roughness = 0.85,
  metalness = 0.05,
  rotation,
}: PartProps) {
  const style = useMeshStyle();
  return (
    <mesh position={pos} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color ?? style.base}
        emissive={style.accent ?? '#000000'}
        emissiveIntensity={style.accent ? 0.12 * style.accentStrength : 0}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

/** Vertical cylinder helper (faucets, legs). */
export function Rod({
  pos,
  radius,
  length,
  color,
  rotation,
}: {
  pos: [number, number, number];
  radius: number;
  length: number;
  color?: string;
  rotation?: [number, number, number];
}) {
  const style = useMeshStyle();
  return (
    <mesh position={pos} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial
        color={color ?? style.base}
        emissive={style.accent ?? '#000000'}
        emissiveIntensity={style.accent ? 0.12 * style.accentStrength : 0}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
}
