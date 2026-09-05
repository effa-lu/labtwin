/**
 * The 8 parametric primitives. Each is a pure function of (dims, params).
 * Local frame: origin at footprint centre on the floor; x = width, y = up, +z = front.
 */
import type { Dims } from '@/api';
import { Part, Rod } from './Part';
import { shade, T, useMeshStyle } from './style';

export interface MeshProps {
  dims: Dims;
  params: Record<string, number | string | boolean>;
}

const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);

/** Evenly spaced shelf boards between yMin and yMax (inclusive of the bottom, exclusive of top). */
function shelfYs(count: number, yMin: number, yMax: number): number[] {
  if (count <= 1) return [yMin];
  const step = (yMax - yMin) / count;
  return Array.from({ length: count }, (_, i) => yMin + i * step);
}

// ---------------------------------------------------------------- Cabinet (CAB)
export function Cabinet({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const doors = Math.max(1, Math.min(2, Math.round(num(params.doors, 2))));
  const plinth = 0.08;
  const gap = 0.006;
  const doorW = (w - gap * (doors + 1)) / doors;
  const doorH = h - plinth - 0.02;
  return (
    <group>
      {/* carcass, set back so doors read as a separate plane */}
      <Part pos={[0, (h + plinth) / 2, -T / 2]} size={[w, h - plinth, d - T]} />
      <Part pos={[0, plinth / 2, -0.03]} size={[w - 0.04, plinth, d - 0.06]} color={shade(base, -0.25)} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + gap + doorW / 2 + i * (doorW + gap);
        const handleX = doors === 2 ? (i === 0 ? x + doorW / 2 - 0.05 : x - doorW / 2 + 0.05) : x + doorW / 2 - 0.05;
        return (
          <group key={i}>
            <Part pos={[x, plinth + doorH / 2, d / 2 - T / 2]} size={[doorW, doorH, T]} color={shade(base, 0.05)} />
            <Part pos={[handleX, h * 0.55, d / 2 + 0.015]} size={[0.02, 0.14, 0.03]} color={shade(base, -0.45)} />
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------- Open shelf (SHF)
export function OpenShelf({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const shelves = Math.max(1, Math.round(num(params.shelves, 5)));
  const ys = shelfYs(shelves, 0.06, h - T);
  return (
    <group>
      <Part pos={[-w / 2 + T / 2, h / 2, 0]} size={[T, h, d]} />
      <Part pos={[w / 2 - T / 2, h / 2, 0]} size={[T, h, d]} />
      <Part pos={[0, h / 2, -d / 2 + T / 2]} size={[w - 2 * T, h, T]} color={shade(base, 0.06)} />
      <Part pos={[0, h - T / 2, 0]} size={[w, T, d]} />
      {ys.map((y, i) => (
        <Part key={i} pos={[0, y + T / 2, 0]} size={[w - 2 * T, T, d - T]} color={shade(base, -0.08)} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- Bench (BCH)
export function Bench({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const top = 0.04;
  const legs = params.base === 'legs';
  return (
    <group>
      <Part pos={[0, h - top / 2, 0]} size={[w, top, d]} color={shade(base, 0.12)} roughness={0.5} />
      {legs ? (
        <>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <Part
                key={`${sx}${sz}`}
                pos={[sx * (w / 2 - 0.05), (h - top) / 2, sz * (d / 2 - 0.05)]}
                size={[0.05, h - top, 0.05]}
                color={shade(base, -0.3)}
              />
            )),
          )}
          <Part pos={[0, h * 0.25, -d / 2 + 0.05]} size={[w - 0.1, 0.05, 0.03]} color={shade(base, -0.3)} />
        </>
      ) : (
        <>
          <Part pos={[0, (h - top + 0.1) / 2, -0.03]} size={[w - 0.02, h - top - 0.1, d - 0.06]} />
          <Part pos={[0, 0.05, -0.06]} size={[w - 0.1, 0.1, d - 0.15]} color={shade(base, -0.3)} />
          {/* drawer lines */}
          {[0.3, 0.55].map((f) => (
            <Part
              key={f}
              pos={[0, (h - top) * f, d / 2 - 0.03 + 0.001]}
              size={[w - 0.08, 0.004, 0.002]}
              color={shade(base, -0.35)}
            />
          ))}
        </>
      )}
    </group>
  );
}

// ---------------------------------------------------------------- Fume hood (FHD)
export function FumeHood({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const lower = 0.85;
  const worktop = 0.03;
  const hoodTop = 0.14;
  const sashOpen = Math.max(0, Math.min(1, num(params.sashOpen, 0.4)));
  const chamberH = h - lower - worktop - hoodTop;
  const sashH = chamberH * (1 - 0.65 * sashOpen);
  const glass = '#bfe0ec';
  return (
    <group>
      {/* base cabinet */}
      <Part pos={[0, lower / 2, -T / 2]} size={[w, lower, d - T]} />
      <Part pos={[0, 0.04, -0.03]} size={[w - 0.04, 0.08, d - 0.06]} color={shade(base, -0.25)} />
      {[-1, 1].map((s) => (
        <Part
          key={s}
          pos={[(s * w) / 4, 0.08 + (lower - 0.1) / 2, d / 2 - T / 2]}
          size={[w / 2 - 0.01, lower - 0.1, T]}
          color={shade(base, 0.05)}
        />
      ))}
      {/* worktop */}
      <Part pos={[0, lower + worktop / 2, 0]} size={[w, worktop, d]} color="#2f3336" roughness={0.6} />
      {/* chamber: back, sides, top */}
      <Part pos={[0, lower + worktop + chamberH / 2, -d / 2 + T / 2]} size={[w, chamberH, T]} color={shade(base, 0.08)} />
      {[-1, 1].map((s) => (
        <Part
          key={s}
          pos={[s * (w / 2 - 0.03), lower + worktop + chamberH / 2, 0]}
          size={[0.06, chamberH, d]}
          color={shade(base, 0.04)}
        />
      ))}
      <Part pos={[0, h - hoodTop / 2, 0]} size={[w, hoodTop, d]} color={shade(base, -0.05)} />
      {/* exhaust collar */}
      <Rod pos={[0, h + 0.08, -d / 4]} radius={0.08} length={0.16} color={shade(base, -0.3)} />
      {/* sash glass, hanging from the top */}
      <Part
        pos={[0, h - hoodTop - sashH / 2, d / 2 - 0.03]}
        size={[w - 0.12, sashH, 0.008]}
        color={glass}
        opacity={0.45}
        roughness={0.1}
        metalness={0.1}
      />
      {/* sash handle */}
      <Part pos={[0, h - hoodTop - sashH, d / 2 - 0.03]} size={[w - 0.12, 0.03, 0.03]} color={shade(base, -0.35)} />
    </group>
  );
}

// ---------------------------------------------------------------- Fridge / freezer (FRZ)
export function Fridge({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const doors = Math.max(1, Math.min(2, Math.round(num(params.doors, 1))));
  const gap = 0.006;
  const doorW = (w - gap * (doors + 1)) / doors;
  const doorH = h - 0.08;
  return (
    <group>
      <Part pos={[0, h / 2, -0.015]} size={[w, h, d - 0.03]} roughness={0.5} metalness={0.15} />
      <Part pos={[0, 0.03, 0]} size={[w - 0.06, 0.06, d - 0.08]} color={shade(base, -0.3)} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + gap + doorW / 2 + i * (doorW + gap);
        const hx = doors === 2 ? (i === 0 ? x + doorW / 2 - 0.05 : x - doorW / 2 + 0.05) : x + doorW / 2 - 0.06;
        return (
          <group key={i}>
            <Part pos={[x, 0.06 + doorH / 2, d / 2]} size={[doorW, doorH, 0.03]} color={shade(base, 0.06)} roughness={0.45} metalness={0.15} />
            <Part pos={[hx, h * 0.55, d / 2 + 0.03]} size={[0.025, h * 0.35, 0.03]} color={shade(base, -0.4)} />
          </group>
        );
      })}
      {/* top vent */}
      <Part pos={[0, h - 0.015, -d / 2 + 0.05]} size={[w - 0.1, 0.03, 0.06]} color={shade(base, -0.35)} />
    </group>
  );
}

// ---------------------------------------------------------------- Safety cabinet (SAF)
export function SafetyCabinet({ dims }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const gap = 0.006;
  const doorW = (w - gap * 3) / 2;
  const doorH = h - 0.1;
  return (
    <group>
      <Part pos={[0, h / 2, -T / 2]} size={[w, h, d - T]} roughness={0.6} metalness={0.2} />
      <Part pos={[0, 0.04, -0.03]} size={[w - 0.04, 0.08, d - 0.06]} color={shade(base, -0.3)} />
      {[0, 1].map((i) => {
        const x = -w / 2 + gap + doorW / 2 + i * (doorW + gap);
        const hx = i === 0 ? x + doorW / 2 - 0.05 : x - doorW / 2 + 0.05;
        return (
          <group key={i}>
            <Part pos={[x, 0.08 + doorH / 2, d / 2 - T / 2]} size={[doorW, doorH, T]} color={shade(base, 0.04)} roughness={0.6} metalness={0.2} />
            <Part pos={[hx, h * 0.5, d / 2 + 0.015]} size={[0.02, 0.14, 0.03]} color={shade(base, -0.45)} />
          </group>
        );
      })}
      {/* hazard band + label plate */}
      <Part pos={[0, h * 0.82, d / 2 + 0.004]} size={[w - 0.06, 0.1, 0.004]} color={shade(base, -0.4)} />
      <Part pos={[0, h * 0.82, d / 2 + 0.007]} size={[w * 0.35, 0.05, 0.002]} color="#f3f3f0" />
      {/* vent bungs */}
      {[-1, 1].map((s) => (
        <Part key={s} pos={[(s * w) / 3, h + 0.03, -d / 4]} size={[0.1, 0.06, 0.1]} color={shade(base, -0.3)} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- Sink (SNK)
export function Sink({ dims }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const top = 0.04;
  const basinW = Math.min(0.6, w * 0.55);
  const basinD = d * 0.6;
  const steel = '#b9bec2';
  return (
    <group>
      <Part pos={[0, (h - top + 0.08) / 2, -0.02]} size={[w - 0.02, h - top - 0.08, d - 0.04]} />
      <Part pos={[0, 0.04, -0.05]} size={[w - 0.1, 0.08, d - 0.12]} color={shade(base, -0.3)} />
      <Part pos={[0, h - top / 2, 0]} size={[w, top, d]} color={shade(base, 0.12)} roughness={0.5} />
      {/* basin: dark inset + steel rim */}
      <Part pos={[0, h + 0.002, 0.03]} size={[basinW + 0.04, 0.004, basinD + 0.04]} color={steel} roughness={0.3} metalness={0.6} />
      <Part pos={[0, h + 0.004, 0.03]} size={[basinW, 0.004, basinD]} color="#4a5257" roughness={0.4} />
      {/* faucet */}
      <Rod pos={[0, h + 0.14, -d / 2 + 0.08]} radius={0.012} length={0.28} color={steel} />
      <Rod pos={[0, h + 0.27, -d / 2 + 0.16]} radius={0.01} length={0.18} color={steel} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------- Generic equipment (EQP)
export function Equipment({ dims }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  return (
    <group>
      <Part pos={[0, h / 2, 0]} size={[w, h, d]} roughness={0.6} />
      <Part pos={[0, h - 0.008, 0]} size={[w - 0.02, 0.016, d - 0.02]} color={shade(base, 0.1)} />
      {/* front control panel */}
      <Part pos={[0, h * 0.62, d / 2 + 0.004]} size={[w * 0.7, h * 0.22, 0.008]} color={shade(base, -0.4)} />
      <Part pos={[w * 0.18, h * 0.62, d / 2 + 0.009]} size={[w * 0.22, h * 0.12, 0.002]} color="#8fd3c9" />
    </group>
  );
}

// ---------------------------------------------------------------- Glovebox (EQP)
/**
 * Inert-atmosphere glovebox on a leg stand (Etelux Lab2000 style):
 * chamber with a front window and N glove ports (gloves hanging out), antechamber cylinder on the
 * right side, control unit under the chamber, lower shelf, casters.
 */
export function Glovebox({ dims, params }: MeshProps) {
  const { w, d, h } = dims;
  const { base } = useMeshStyle();
  const ports = Math.max(1, Math.min(4, Math.round(num(params.ports, 2))));
  const body = shade(base, 0.18);
  const bodyDark = shade(base, -0.05);
  const steel = '#b9bec2';
  const glove = '#1f2224';
  const legH = h * 0.42; // stand height
  const chamberH = h - legH;
  const chamberD = d * 0.85; // chamber is a bit shallower than the footprint (gloves stick out)
  const chamberZ = -(d - chamberD) / 2; // push chamber back so gloves stay inside the footprint
  const frame = 0.05;
  const winH = chamberH * 0.62;
  const winY = legH + chamberH * 0.16 + winH / 2;
  const portR = Math.min(0.11, w * 0.09);
  const portY = legH + chamberH * 0.42;
  const gloveLen = legH * 0.95;

  return (
    <group>
      {/* stand: 4 legs, lower shelf, casters */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <Part pos={[sx * (w / 2 - 0.05), legH / 2 + 0.03, chamberZ + sz * (chamberD / 2 - 0.05)]} size={[0.05, legH - 0.06, 0.05]} color={body} />
            <Rod pos={[sx * (w / 2 - 0.05), 0.03, chamberZ + sz * (chamberD / 2 - 0.05)]} radius={0.03} length={0.03} color="#3a3d40" rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )),
      )}
      <Part pos={[0, 0.16, chamberZ]} size={[w - 0.08, T, chamberD - 0.08]} color={body} />
      {/* control unit under the chamber, right side */}
      <Part pos={[w / 4, legH * 0.55, chamberZ + chamberD / 2 - 0.2]} size={[w * 0.28, legH * 0.55, 0.36]} color={bodyDark} />
      <Part pos={[w / 4, legH * 0.72, chamberZ + chamberD / 2 - 0.015]} size={[w * 0.16, 0.05, 0.004]} color="#2f3336" />

      {/* chamber shell: bottom (stainless inside), top, back, sides */}
      <Part pos={[0, legH + T / 2, chamberZ]} size={[w, T, chamberD]} color="#8f999c" roughness={0.35} metalness={0.5} />
      <Part pos={[0, legH - 0.02, chamberZ]} size={[w, 0.04, chamberD]} color={body} />
      <Part pos={[0, h - T / 2, chamberZ]} size={[w, T, chamberD]} color={body} />
      {/* back wall is stainless inside, so the window reads as a window */}
      <Part pos={[0, legH + chamberH / 2, chamberZ - chamberD / 2 + T / 2]} size={[w, chamberH, T]} color="#8f999c" roughness={0.35} metalness={0.5} />
      {[-1, 1].map((s) => (
        <Part key={s} pos={[s * (w / 2 - T / 2), legH + chamberH / 2, chamberZ]} size={[T, chamberH, chamberD]} color={body} />
      ))}
      {/* front: window with frame band above and below */}
      <Part pos={[0, legH + chamberH * 0.08, chamberZ + chamberD / 2 - T / 2]} size={[w, chamberH * 0.16, T]} color={body} />
      <Part pos={[0, h - chamberH * 0.11, chamberZ + chamberD / 2 - T / 2]} size={[w, chamberH * 0.22, T]} color={body} />
      {[-1, 1].map((s) => (
        <Part key={s} pos={[s * (w / 2 - frame / 2), winY, chamberZ + chamberD / 2 - T / 2]} size={[frame, winH, T]} color={body} />
      ))}
      <Part pos={[0, winY, chamberZ + chamberD / 2 - T / 2]} size={[w - 2 * frame, winH, 0.008]} color="#9fcfe0" opacity={0.45} roughness={0.05} metalness={0.2} />
      {/* thin dark seal around the window */}
      <Part pos={[0, winY + winH / 2, chamberZ + chamberD / 2 + 0.002]} size={[w - 2 * frame + 0.02, 0.012, 0.004]} color="#3a3d40" />
      <Part pos={[0, winY - winH / 2, chamberZ + chamberD / 2 + 0.002]} size={[w - 2 * frame + 0.02, 0.012, 0.004]} color="#3a3d40" />

      {/* glove ports + gloves */}
      {Array.from({ length: ports }, (_, i) => {
        const x = (-(ports - 1) / 2 + i) * (w / (ports + 0.6));
        const zf = chamberZ + chamberD / 2;
        return (
          <group key={i}>
            <Rod pos={[x, portY, zf + 0.02]} radius={portR} length={0.05} color={glove} rotation={[Math.PI / 2, 0, 0]} />
            <Rod pos={[x, portY, zf + 0.055]} radius={portR * 0.85} length={0.02} color="#3a3d40" rotation={[Math.PI / 2, 0, 0]} />
            {/* glove: upper arm leans out ~25° from the port, forearm hangs nearly vertical */}
            {(() => {
              const a1 = 0.45;
              const a2 = 0.1;
              const L1 = gloveLen * 0.5;
              const L2 = gloveLen * 0.5;
              const z0 = zf + 0.06;
              const c1: [number, number, number] = [x, portY - Math.cos(a1) * L1 / 2, z0 + Math.sin(a1) * L1 / 2];
              const e1: [number, number, number] = [x, portY - Math.cos(a1) * L1, z0 + Math.sin(a1) * L1];
              const c2: [number, number, number] = [x, e1[1] - Math.cos(a2) * L2 / 2, e1[2] + Math.sin(a2) * L2 / 2];
              return (
                <>
                  <Rod pos={c1} radius={portR * 0.62} length={L1} color={glove} rotation={[-a1, 0, 0]} />
                  <Rod pos={e1} radius={portR * 0.55} length={0.02} color={glove} rotation={[Math.PI / 2, 0, 0]} />
                  <Rod pos={c2} radius={portR * 0.5} length={L2} color={glove} rotation={[-a2, 0, 0]} />
                </>
              );
            })()}
          </group>
        );
      })}

      {/* antechamber cylinder on the right side, with a round door */}
      <Rod pos={[w / 2 + 0.16, legH + chamberH * 0.5, chamberZ]} radius={Math.min(0.17, chamberH * 0.28)} length={0.32} color={steel} rotation={[0, 0, Math.PI / 2]} />
      <Rod pos={[w / 2 + 0.33, legH + chamberH * 0.5, chamberZ]} radius={Math.min(0.19, chamberH * 0.3)} length={0.03} color={shade(steel, -0.15)} rotation={[0, 0, Math.PI / 2]} />
      {/* gauge on the right front */}
      <Rod pos={[w / 2 - 0.12, h - chamberH * 0.11, chamberZ + chamberD / 2 + 0.01]} radius={0.04} length={0.02} color="#f3f3f0" rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}
