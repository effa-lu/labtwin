import { create } from 'zustand';
import type { Entity, EntityType, Space } from '@/api';

/**
 * Scene data: the current Space and its Entities.
 *
 * In-memory for now (seeded from demo.ts). When the database lands, the commands in
 * features/space/commands keep the same shape and additionally call api.entities.*;
 * nothing that reads this store has to change.
 *
 * Mutations go through commands (do/undo) — components must not call set* directly.
 */
interface EntitiesState {
  space: Space | null;
  entities: Entity[];
  /** Highest number handed out per type. Never decremented (ids are never reused). */
  counters: Record<string, number>;

  load: (space: Space, entities: Entity[]) => void;
  _insert: (entity: Entity) => void;
  _remove: (id: string) => void;
  _patch: (id: string, patch: Partial<Entity>) => void;
  _nextCode: (type: EntityType) => string;
}

export const useEntitiesStore = create<EntitiesState>((set, get) => ({
  space: null,
  entities: [],
  counters: {},

  load: (space, entities) => {
    const counters: Record<string, number> = {};
    for (const e of entities) {
      const m = /^([A-Z]+)-(\d+)$/.exec(e.code);
      if (m) counters[m[1]] = Math.max(counters[m[1]] ?? 0, Number(m[2]));
    }
    set({ space, entities, counters });
  },

  _insert: (entity) => set((s) => ({ entities: [...s.entities, entity] })),
  _remove: (id) => set((s) => ({ entities: s.entities.filter((e) => e.id !== id) })),
  _patch: (id, patch) =>
    set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

  /**
   * Front-end stand-in for the Postgres allocator: <TYPE>-NN, monotonically increasing,
   * never reused even after deletes. Replaced by a server call when the DB lands.
   */
  _nextCode: (type) => {
    const n = (get().counters[type] ?? 0) + 1;
    set((s) => ({ counters: { ...s.counters, [type]: n } }));
    return `${type}-${String(n).padStart(2, '0')}`;
  },
}));
