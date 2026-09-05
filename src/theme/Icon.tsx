import { createElement } from 'react';
import { iconFor } from './icons';

/** Render a lucide icon by registry name (e.g. preset.icon). */
export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return createElement(iconFor(name), { size, strokeWidth: 1.75 });
}
