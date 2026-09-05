import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { Dims } from '@/api';
import { useMeshStyle } from './meshes/style';

/**
 * Hand-made low-poly model (.glb) fitted into the entity's dims.
 *
 * Fit rule: uniform scale so the model's bounding box fits inside (w, h, d) without
 * distortion, then centred in x/z with its lowest point on the floor. A model built at
 * real size (see docs/models.md) gets scale ≈ 1.
 */
function Model({ url, dims }: { url: string; dims: Dims }) {
  const gltf = useGLTF(url);
  const style = useMeshStyle();

  const { object, scale, offset } = useMemo(() => {
    const object = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = Math.min(
      dims.w / Math.max(size.x, 1e-6),
      dims.h / Math.max(size.y, 1e-6),
      dims.d / Math.max(size.z, 1e-6),
    );
    const center = new THREE.Vector3();
    box.getCenter(center);
    // centre x/z, floor at y=0 (after scaling)
    const offset: [number, number, number] = [-center.x * s, -box.min.y * s, -center.z * s];
    object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      // clone materials so tinting never touches the cached GLTF
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const cloned = mats.map((mat) => mat.clone());
      m.material = cloned.length === 1 ? cloned[0] : cloned;
    });
    return { object, scale: s, offset };
  }, [gltf.scene, dims.w, dims.h, dims.d]);

  // Selection tint: emissive on every (already cloned) material.
  useEffect(() => {
    object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!('emissive' in std)) continue;
        std.emissive.set(style.accent ?? '#000000');
        std.emissiveIntensity = style.accent ? 0.12 * style.accentStrength : 0;
      }
    });
  }, [object, style.accent, style.accentStrength]);

  return <primitive object={object} scale={scale} position={offset} />;
}

/** Wireframe stand-in while the GLB loads (or if the file is missing). */
function Placeholder({ dims }: { dims: Dims }) {
  const style = useMeshStyle();
  return (
    <mesh position={[0, dims.h / 2, 0]}>
      <boxGeometry args={[dims.w, dims.h, dims.d]} />
      <meshStandardMaterial color={style.base} wireframe />
    </mesh>
  );
}

/** A missing or broken .glb must never take the whole scene down — show the wireframe instead. */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode; url: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn(`[LabTwin] could not load model ${this.props.url}:`, err);
  }
  componentDidUpdate(prev: { url: string }) {
    if (prev.url !== this.props.url && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function CustomModel({ url, dims }: { url: string; dims: Dims }) {
  const placeholder = <Placeholder dims={dims} />;
  return (
    <ModelBoundary url={url} fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <Model url={url} dims={dims} />
      </Suspense>
    </ModelBoundary>
  );
}
