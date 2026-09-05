/**
 * Icon set (lucide). Explicit imports keep the bundle small.
 * To change an icon: pick a name at https://lucide.dev/icons, import it here, reference it by key.
 */
import {
  Archive,
  Box,
  Droplets,
  Eye,
  FlaskConical,
  Grid3x3,
  Hand,
  Languages,
  LayoutGrid,
  Layers,
  Microscope,
  Library,
  MousePointer2,
  Redo2,
  Refrigerator,
  RotateCw,
  ShieldAlert,
  Table2,
  Trash2,
  Undo2,
  Wind,
  type LucideIcon,
} from 'lucide-react';

export const icons = {
  // component presets
  Archive,
  Layers,
  Table2,
  Wind,
  Refrigerator,
  ShieldAlert,
  Droplets,
  Box,
  FlaskConical,
  Hand,
  Microscope,
  // ui
  Eye,
  Grid3x3,
  Languages,
  LayoutGrid,
  Library,
  MousePointer2,
  Redo2,
  RotateCw,
  Trash2,
  Undo2,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function iconFor(name: string): LucideIcon {
  return (icons as Record<string, LucideIcon>)[name] ?? Box;
}
