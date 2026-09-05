/**
 * Tiny UI kit. No component library — everything reads tokens so Effa can restyle in one place.
 * Variants follow the brand sheet: primary = filled cyan, secondary = outlined cyan, ghost = toolbar.
 */
import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { tokens } from '@/theme/tokens';

export const font: CSSProperties = {
  fontFamily: tokens.font.family,
  fontSize: tokens.font.size.md,
  color: tokens.color.text,
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  tone?: 'default' | 'danger';
  /** kept for compatibility; every surface is dark now */
  onDark?: boolean;
  children?: ReactNode;
}

export function Button({
  icon: Icon,
  active,
  variant = 'ghost',
  tone = 'default',
  children,
  style,
  ...rest
}: BtnProps) {
  const c = tokens.color;
  let border: string = c.border;
  let background: string = 'transparent';
  let color: string = c.text;
  if (variant === 'primary') {
    border = c.interactive;
    background = c.interactive;
    color = c.textOnAccent;
  } else if (variant === 'secondary') {
    border = c.interactive;
    background = 'transparent';
    color = c.interactive;
  } else if (variant === 'accent') {
    border = c.secondary;
    background = c.secondary;
    color = c.textOnAccent;
  } else if (active) {
    border = c.interactive;
    background = c.interactiveSoft;
    color = c.interactive;
  }
  if (tone === 'danger') {
    color = c.danger;
    border = variant === 'ghost' ? c.border : c.danger;
    background = 'transparent';
  }
  return (
    <button
      type="button"
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: children ? '6px 12px' : 6,
        border: `1px solid ${border}`,
        borderRadius: tokens.radius.sm,
        background,
        color,
        cursor: rest.disabled ? 'default' : 'pointer',
        opacity: rest.disabled ? 0.4 : 1,
        fontFamily: tokens.font.family,
        fontSize: tokens.font.size.sm,
        fontWeight: 500,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        transition: 'background 120ms, border-color 120ms',
        ...style,
      }}
    >
      {Icon && <Icon size={15} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

/** Uppercase, wide-tracked label — the brand sheet's section headers. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: tokens.font.size.xs,
        fontWeight: 500,
        letterSpacing: tokens.font.tracking,
        textTransform: 'uppercase',
        color: tokens.color.textMuted,
        margin: `${tokens.space.lg}px 0 ${tokens.space.sm}px`,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.space.sm,
      }}
    >
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: tokens.color.border }} />
    </div>
  );
}

export function Swatch({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: 3,
        background: color,
        border: `1px solid rgba(255,255,255,0.12)`,
        flexShrink: 0,
      }}
    />
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ color: tokens.color.textMuted, fontSize: tokens.font.size.sm }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.sm,
  fontFamily: tokens.font.family,
  fontSize: tokens.font.size.sm,
  color: tokens.color.text,
  background: tokens.color.surfaceMuted,
  boxSizing: 'border-box',
  outline: 'none',
};

/** Row in a list (entities, presets). `selected` = orange per the brand sheet's attention colour. */
export function rowStyle(selected: boolean): CSSProperties {
  return {
    width: '100%',
    textAlign: 'left',
    padding: '6px 8px',
    marginBottom: 1,
    border: `1px solid ${selected ? tokens.color.secondary : 'transparent'}`,
    borderRadius: tokens.radius.sm,
    cursor: 'pointer',
    background: selected ? tokens.color.secondarySoft : 'transparent',
    color: selected ? tokens.color.text : tokens.color.text,
    fontFamily: tokens.font.family,
    fontSize: tokens.font.size.sm,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  };
}
