import type { ParametricMesh } from '../registry';
import type { MeshProps } from './basic';
import { Bench, Cabinet, Equipment, Fridge, FumeHood, Glovebox, OpenShelf, SafetyCabinet, Sink } from './basic';

const MESHES: Record<ParametricMesh, (p: MeshProps) => React.JSX.Element> = {
  cabinet: Cabinet,
  openShelf: OpenShelf,
  bench: Bench,
  fumeHood: FumeHood,
  fridge: Fridge,
  safetyCabinet: SafetyCabinet,
  sink: Sink,
  equipment: Equipment,
  glovebox: Glovebox,
};

/** Dispatch a registry mesh name to its component. Adding a mesh = one entry here + one function. */
export function ParametricComponent({ mesh, ...props }: MeshProps & { mesh: ParametricMesh }) {
  const M = MESHES[mesh] ?? Equipment;
  return <M {...props} />;
}

export { MeshStyleContext, type MeshStyle } from './style';
