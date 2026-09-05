import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/store/editor';
import { useEntitiesStore } from '@/store/entities';
import { tokens } from '@/theme/tokens';
import { icons } from '@/theme/icons';
import { Button, Field, SectionTitle, inputStyle, rowStyle } from '@/ui/primitives';
import { getPreset } from './components';
import {
  useHistory,
  deleteEntityCommand,
  rotateEntityCommand,
  setDimsCommand,
  setParamCommand,
  setLabelCommand,
} from './commands';

/** Right panel: the selected entity as a record (2D parity with the 3D selection) + the entity list. */
export function InspectorPanel() {
  const { t } = useTranslation();
  const entities = useEntitiesStore((s) => s.entities);
  const selectedCode = useEditorStore((s) => s.selectedCode);
  const select = useEditorStore((s) => s.select);
  const run = useHistory((s) => s.run);
  const entity = entities.find((e) => e.code === selectedCode) ?? null;
  const preset = entity ? getPreset(entity.params.preset as string | undefined, entity.type) : null;

  const runIf = (cmd: ReturnType<typeof setDimsCommand>) => {
    if (cmd) run(cmd);
  };

  return (
    <aside
      data-testid="inspector"
      style={{
        width: tokens.panel.inspectorWidth,
        borderLeft: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        padding: `0 ${tokens.space.lg}px ${tokens.space.lg}px`,
        overflowY: 'auto',
        fontSize: tokens.font.size.md,
      }}
    >
      <SectionTitle>{t('panel.selection')}</SectionTitle>
      {entity && preset ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: tokens.font.size.lg, color: tokens.color.primary }}>
              {entity.code}
            </span>
            <span style={{ color: tokens.color.textMuted, fontSize: tokens.font.size.sm }}>
              {t(`component.${preset.id}`)}
            </span>
          </div>

          <Field label={t('panel.label')}>
            <input
              data-testid="label-input"
              style={inputStyle}
              value={entity.label}
              onChange={(e) => runIf(setLabelCommand(entity.id, e.target.value))}
            />
          </Field>

          <Field label={t('panel.dims')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {(['w', 'd', 'h'] as const).map((k) => (
                <input
                  key={k}
                  type="number"
                  step={0.05}
                  min={preset.minDims[k]}
                  max={preset.maxDims[k]}
                  style={inputStyle}
                  value={entity.dims[k]}
                  title={k.toUpperCase()}
                  onChange={(e) =>
                    runIf(setDimsCommand(entity.id, { ...entity.dims, [k]: Number(e.target.value) }))
                  }
                />
              ))}
            </div>
          </Field>

          {preset.paramFields.map((f) => (
            <Field key={f.key} label={t(`param.${f.key}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={Number(entity.params[f.key] ?? f.min)}
                  onChange={(e) => runIf(setParamCommand(entity.id, f.key, Number(e.target.value)))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm, width: 28, textAlign: 'right' }}>
                  {Number(entity.params[f.key] ?? f.min)}
                </span>
              </div>
            </Field>
          ))}

          <Field label={t('panel.position')}>
            <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm }}>
              {entity.transform.x.toFixed(2)}, {entity.transform.y.toFixed(2)}
              {entity.transform.z ? ` · ↑${entity.transform.z.toFixed(2)}` : ''} · {entity.transform.rot}°
            </span>
          </Field>

          {preset.subLocationParam && (
            <Field label={t('panel.subLocations')}>
              <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.size.sm, color: tokens.color.textMuted }}>
                {entity.code}-S1 … S{Number(entity.params[preset.subLocationParam])}
              </span>
            </Field>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Button variant="secondary" icon={icons.RotateCw} onClick={() => runIf(rotateEntityCommand(entity.id))}>
              {t('action.rotate')}
            </Button>
            <Button icon={icons.Trash2} tone="danger" onClick={() => runIf(deleteEntityCommand(entity.id))}>
              {t('action.delete')}
            </Button>
          </div>
        </div>
      ) : (
        <p style={{ color: tokens.color.textMuted, margin: 0, fontSize: tokens.font.size.sm, lineHeight: 1.5 }}>
          {t('panel.empty')}
        </p>
      )}

      <SectionTitle>
        {t('panel.entities')} · {entities.length}
      </SectionTitle>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entities.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              data-testid={`row-${e.code}`}
              onClick={() => select(e.code === selectedCode ? null : e.code)}
              style={rowStyle(e.code === selectedCode)}
            >
              <span style={{ fontFamily: tokens.font.mono, minWidth: 56 }}>{e.code}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
