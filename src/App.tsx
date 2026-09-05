import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/api';
import { useEditorStore } from '@/store/editor';
import { useEntitiesStore } from '@/store/entities';
import { tokens } from '@/theme/tokens';
import { icons } from '@/theme/icons';
import { Button } from '@/ui/primitives';
import { SpaceScene } from '@/features/space/scene';
import { InspectorPanel } from '@/features/space/InspectorPanel';
import { Palette } from '@/features/space/Palette';
import { useHistory } from '@/features/space/commands';
import { DEMO_SCENES } from '@/features/space/demo';
import { LibraryView } from '@/features/library/LibraryView';

export default function App() {
  const { t, i18n } = useTranslation();
  const view = useEditorStore((s) => s.view);
  const setView = useEditorStore((s) => s.setView);
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const toggleCamera = useEditorStore((s) => s.toggleCameraMode);
  const placing = useEditorStore((s) => s.placingPresetId);
  const canUndo = useHistory((s) => s.past.length > 0);
  const canRedo = useHistory((s) => s.future.length > 0);
  const undo = useHistory((s) => s.undo);
  const redo = useHistory((s) => s.redo);
  const sceneId = useEditorStore((s) => s.sceneId);
  const setScene = useEditorStore((s) => s.setScene);

  // Seed the scene from demo data until the database is wired up; reload when the scene changes.
  useEffect(() => {
    const scene = DEMO_SCENES.find((s) => s.id === sceneId) ?? DEMO_SCENES[0];
    useEntitiesStore.getState().load(scene.space, scene.entities);
    useHistory.getState().clear();
  }, [sceneId]);

  const nextMode = cameraMode === 'top' ? 'perspective' : 'top';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: tokens.font.family,
        color: tokens.color.text,
        background: tokens.color.bg,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.space.sm,
          padding: `${tokens.space.sm}px ${tokens.space.lg}px`,
          borderBottom: `1px solid ${tokens.color.headerBorder}`,
          background: tokens.color.headerBg,
          color: tokens.color.headerText,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: tokens.space.xl, lineHeight: 1.05 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3 }}>
            <span style={{ color: tokens.color.wordmarkA }}>LAB</span>
            <span style={{ color: tokens.color.wordmarkB }}>TWIN</span>
          </span>
          <span
            style={{
              fontSize: 8.5,
              letterSpacing: 2.2,
              color: tokens.color.headerMuted,
              textTransform: 'uppercase',
              marginTop: 3,
            }}
          >
            {t('app.tagline')}
          </span>
        </div>

        <Button onDark icon={icons.LayoutGrid} active={view === 'space'} onClick={() => setView('space')} data-testid="tab-space">
          {t('tab.space')}
        </Button>
        <Button onDark icon={icons.Library} active={view === 'library'} onClick={() => setView('library')} data-testid="tab-library">
          {t('tab.library')}
        </Button>

        <span style={{ flex: 1 }} />

        {view === 'space' && (
          <select
            data-testid="scene-select"
            value={sceneId}
            onChange={(e) => setScene(e.target.value)}
            style={{
              padding: '6px 8px',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              background: tokens.color.surfaceMuted,
              color: tokens.color.headerText,
              fontFamily: tokens.font.family,
              fontSize: tokens.font.size.sm,
              marginRight: tokens.space.sm,
              maxWidth: 220,
            }}
          >
            {DEMO_SCENES.map((s) => (
              <option key={s.id} value={s.id}>
                {t(`scene.${s.nameKey}`)}
              </option>
            ))}
          </select>
        )}

        {view === 'space' && (
          <>
            <span
              data-testid="hint"
              style={{
                color: tokens.color.headerMuted,
                fontSize: tokens.font.size.xs,
                marginRight: tokens.space.sm,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 300,
              }}
            >
              {placing ? t('hint.placing') : cameraMode === 'top' ? t('hint.top') : t('hint.perspective')}
            </span>
            <Button onDark icon={icons.Undo2} disabled={!canUndo} onClick={undo} title="Ctrl+Z" data-testid="undo" />
            <Button onDark icon={icons.Redo2} disabled={!canRedo} onClick={redo} title="Ctrl+Shift+Z" data-testid="redo" />
            <Button
              onDark
              icon={cameraMode === 'top' ? icons.Eye : icons.Grid3x3}
              variant="secondary"
              onClick={toggleCamera}
              data-testid="camera-toggle"
              title={t('camera.switchTo', { mode: t(`camera.${nextMode}`) })}
            >
              {t(`camera.${nextMode}`)}
            </Button>
          </>
        )}

        <span data-testid="status" style={{ color: tokens.color.headerMuted, fontSize: tokens.font.size.xs, margin: `0 ${tokens.space.sm}px`, whiteSpace: 'nowrap' }}>
          {api.isConfigured() ? t('status.connected') : t('status.demo')}
        </span>
        <Button
          onDark
          icon={icons.Languages}
          data-testid="lang-toggle"
          onClick={() => void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
        >
          {t('app.lang')}
        </Button>
      </header>

      {view === 'space' ? (
        <main style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <Palette />
          <div style={{ flex: 1, position: 'relative' }}>
            <SpaceScene />
          </div>
          <InspectorPanel />
        </main>
      ) : (
        <main style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <LibraryView />
        </main>
      )}
    </div>
  );
}
