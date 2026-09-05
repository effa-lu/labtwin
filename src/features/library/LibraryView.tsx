import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Grid, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { tokens } from '@/theme/tokens';
import { Icon } from '@/theme/Icon';
import { SectionTitle, Swatch, Field, rowStyle } from '@/ui/primitives';
import {
  PRESETS,
  ParametricComponent,
  CustomModel,
  MeshStyleContext,
  type ComponentPreset,
} from '@/features/space/components';

/**
 * Showroom: every preset at its default size on one floor, for reviewing shapes, colours and icons.
 * Click one to see its registry entry. Nothing here touches scene data.
 */
export function LibraryView() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('preset'),
  );

  // showroom grid: rows of 5, 1 m gaps, front row nearest the camera
  const { layout, width, depth } = useMemo(() => {
    const perRow = 4;
    const gap = 1.0;
    const rowDepth = 2.6;
    const out: { preset: ComponentPreset; x: number; z: number }[] = [];
    let width = 0;
    for (let r = 0; r * perRow < PRESETS.length; r++) {
      const row = PRESETS.slice(r * perRow, (r + 1) * perRow);
      const rowW = row.reduce((a, p) => a + p.dims.w, 0) + gap * (row.length - 1);
      width = Math.max(width, rowW);
      let x = -rowW / 2;
      for (const p of row) {
        out.push({ preset: p, x: x + p.dims.w / 2, z: -r * rowDepth });
        x += p.dims.w + gap;
      }
    }
    const rows = Math.ceil(PRESETS.length / perRow);
    return { layout: out, width, depth: rowDepth * rows };
  }, []);

  const selected = PRESETS.find((p) => p.id === selectedId) ?? null;
  const controls = useRef<OrbitControlsImpl>(null);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows dpr={[1, 2]} style={{ background: tokens.color.bg }} data-testid="library-canvas"
          onPointerMissed={() => setSelectedId(null)}>
          <PerspectiveCamera makeDefault fov={40} position={[0, width * 0.8, depth / 2 + width * 0.55]} near={0.1} far={100} />
          <OrbitControls ref={controls} target={[0, 0.8, -depth / 2 + 1.5]} enableDamping maxPolarAngle={Math.PI / 2 - 0.05} minDistance={1} maxDistance={30} />
          <FocusOn item={layout.find((l) => l.preset.id === selectedId) ?? null} controls={controls} />
          <ambientLight intensity={1.0} />
          <directionalLight position={[4, 12, 8]} intensity={1.0} castShadow shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
          <Grid position={[0, -0.001, 0]} args={[40, 40]} cellSize={0.5} cellThickness={0.5}
            cellColor={tokens.color.grid} sectionSize={1} sectionThickness={0.8} sectionColor={tokens.color.gridSection} fadeDistance={40} infiniteGrid />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0, -depth / 2 + 1.5]} receiveShadow>
            <planeGeometry args={[width + 3, depth + 2]} />
            <meshStandardMaterial color={tokens.color.floor} />
          </mesh>

          {layout.map(({ preset, x, z }) => (
            <ShowroomItem key={preset.id} preset={preset} x={x} z={z} selected={selectedId === preset.id}
              onSelect={() => setSelectedId(preset.id)} />
          ))}
        </Canvas>
      </div>

      <aside style={{ width: tokens.panel.inspectorWidth, borderLeft: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface, padding: `0 ${tokens.space.lg}px ${tokens.space.lg}px`, overflowY: 'auto' }}>
        <SectionTitle>{t('library.title')}</SectionTitle>
        {selected ? <PresetCard preset={selected} /> : (
          <p style={{ color: tokens.color.textMuted, fontSize: tokens.font.size.sm, margin: 0, lineHeight: 1.5 }}>{t('library.hint')}</p>
        )}
        <SectionTitle>{t('library.all')}</SectionTitle>
        {PRESETS.map((p) => {
          const active = p.id === selectedId;
          return (
            <button key={p.id} type="button" onClick={() => setSelectedId(active ? null : p.id)}
              style={rowStyle(active)}>
              <Icon name={p.icon} size={14} />
              <span style={{ flex: 1 }}>{t(`component.${p.id}`)}</span>
              <span style={{ fontFamily: tokens.font.mono, opacity: 0.7 }}>{p.type}</span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}

/** Fly the camera to the selected item so it can be inspected up close. */
function FocusOn({
  item,
  controls,
}: {
  item: { preset: ComponentPreset; x: number; z: number } | null;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!item || !controls.current) return;
    const { preset, x, z } = item;
    const r = Math.max(preset.dims.w, preset.dims.d, preset.dims.h) * 1.4 + 0.8;
    // steep-ish view from the front-right so items in the row ahead don't block the view
    controls.current.target.set(x, preset.dims.h * 0.45, z);
    camera.position.set(x + r * 0.55, preset.dims.h * 0.45 + r * 0.85, z + r * 0.7);
    controls.current.update();
  }, [item, controls, camera]);
  return null;
}

function ShowroomItem({ preset, x, z, selected, onSelect }: { preset: ComponentPreset; x: number; z: number; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(false);
  const style = useMemo(() => ({
    base: tokens.color.entity[preset.colorToken],
    accent: selected ? tokens.color.selected : hover ? tokens.color.hovered : null,
    accentStrength: selected ? 1 : 0.6,
  }), [preset.colorToken, selected, hover]);
  return (
    <group position={[x, 0, z]}>
      <MeshStyleContext.Provider value={style}>
        <group onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}>
          {preset.source.kind === 'parametric'
            ? <ParametricComponent mesh={preset.source.mesh} dims={preset.dims} params={preset.params} />
            : <CustomModel url={preset.source.url} dims={preset.dims} />}
        </group>
      </MeshStyleContext.Provider>
      <Html position={[0, -0.02, preset.dims.d / 2 + 0.25]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ textAlign: 'center', fontFamily: tokens.font.family, whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: selected ? tokens.color.selected : tokens.color.text }}>{t(`component.${preset.id}`)}</div>
          <div style={{ fontSize: 10, fontFamily: tokens.font.mono, color: tokens.color.textMuted }}>
            {preset.type} · {preset.dims.w}×{preset.dims.d}×{preset.dims.h} m
          </div>
        </div>
      </Html>
    </group>
  );
}

function PresetCard({ preset }: { preset: ComponentPreset }) {
  const { t } = useTranslation();
  const color = tokens.color.entity[preset.colorToken];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: tokens.radius.md, background: color, display: 'grid', placeItems: 'center', color: '#1f2426' }}>
          <Icon name={preset.icon} size={18} />
        </span>
        <div>
          <div style={{ fontWeight: 600 }}>{t(`component.${preset.id}`)}</div>
          <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.xs, color: tokens.color.textMuted }}>{preset.id}</div>
        </div>
      </div>
      <Field label={t('library.idPrefix')}><span style={{ fontFamily: tokens.font.mono }}>{preset.type}-NN</span></Field>
      <Field label={t('library.source')}>
        <span style={{ fontSize: tokens.font.size.sm }}>
          {preset.source.kind === 'parametric' ? t('library.parametric') : preset.source.url}
        </span>
      </Field>
      <Field label={t('library.color')}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm }}>
          <Swatch color={color} /> {color} <span style={{ color: tokens.color.textMuted }}>entity.{preset.colorToken}</span>
        </span>
      </Field>
      <Field label={t('library.icon')}><span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm }}>{preset.icon}</span></Field>
      <Field label={t('panel.dims')}>
        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm }}>
          {preset.dims.w} × {preset.dims.d} × {preset.dims.h}
        </span>
      </Field>
      <Field label={t('library.range')}>
        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.xs, color: tokens.color.textMuted }}>
          {preset.minDims.w}–{preset.maxDims.w} / {preset.minDims.d}–{preset.maxDims.d} / {preset.minDims.h}–{preset.maxDims.h}
        </span>
      </Field>
      {preset.paramFields.length > 0 && (
        <Field label={t('library.params')}>
          <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.xs }}>
            {preset.paramFields.map((f) => `${f.key} ${f.min}–${f.max}`).join(', ')}
          </span>
        </Field>
      )}
      <p style={{ fontSize: tokens.font.size.xs, color: tokens.color.textMuted, lineHeight: 1.5, marginTop: 10 }}>
        {t('library.editHint')}
      </p>
    </div>
  );
}
