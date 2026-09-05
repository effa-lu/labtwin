import { useTranslation } from 'react-i18next';
import { PRESETS } from './components';
import { useEditorStore } from '@/store/editor';
import { tokens } from '@/theme/tokens';
import { Icon } from '@/theme/Icon';
import { SectionTitle, Swatch } from '@/ui/primitives';

/** Left panel: the component library. Click an item, then click the floor to place it. */
export function Palette() {
  const { t } = useTranslation();
  const placing = useEditorStore((s) => s.placingPresetId);
  const startPlacing = useEditorStore((s) => s.startPlacing);

  const groups: Array<'basic' | 'custom'> = ['basic', 'custom'];

  return (
    <aside
      data-testid="palette"
      style={{
        width: tokens.panel.paletteWidth,
        borderRight: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
        padding: `0 ${tokens.space.md}px ${tokens.space.lg}px`,
        overflowY: 'auto',
      }}
    >
      {groups.map((g) => (
        <div key={g}>
          <SectionTitle>{t(`palette.${g}`)}</SectionTitle>
          {PRESETS.filter((p) => p.group === g).map((p) => {
            const active = placing === p.id;
            return (
              <button
                key={p.id}
                type="button"
                data-testid={`preset-${p.id}`}
                onClick={() => startPlacing(active ? null : p.id)}
                title={t('palette.hint')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 8px',
                  marginBottom: 2,
                  border: `1px solid ${active ? tokens.color.interactive : 'transparent'}`,
                  borderRadius: tokens.radius.md,
                  background: active ? tokens.color.interactiveSoft : 'transparent',
                  color: tokens.color.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: tokens.font.family,
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: tokens.radius.md,
                    background: tokens.color.entity[p.colorToken],
                    display: 'grid',
                    placeItems: 'center',
                    color: '#1f2426',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={p.icon} size={16} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: tokens.font.size.sm, fontWeight: 500 }}>
                    {t(`component.${p.id}`)}
                  </span>
                  <span style={{ fontSize: tokens.font.size.xs, color: tokens.color.textMuted, fontFamily: tokens.font.mono }}>
                    {p.type} · {p.dims.w}×{p.dims.d}×{p.dims.h}
                  </span>
                </span>
              </button>
            );
          })}
          {g === 'custom' && (
            <p style={{ fontSize: tokens.font.size.xs, color: tokens.color.textMuted, margin: '8px 4px 0', lineHeight: 1.5 }}>
              {t('palette.customHint')}
            </p>
          )}
        </div>
      ))}

      <SectionTitle>{t('palette.legend')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {(Object.keys(tokens.color.entity) as Array<keyof typeof tokens.color.entity>).map((k) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: tokens.font.size.xs }}>
            <Swatch color={tokens.color.entity[k]} />
            <span style={{ fontFamily: tokens.font.mono }}>{k}</span>
          </span>
        ))}
      </div>
    </aside>
  );
}
