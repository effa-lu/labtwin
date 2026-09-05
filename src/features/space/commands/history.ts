import { create } from 'zustand';

/** A reversible edit. Commands are the only way scene data changes. */
export interface Command {
  label: string;
  do: () => void;
  undo: () => void;
}

interface HistoryState {
  past: Command[];
  future: Command[];
  run: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const LIMIT = 100;

export const useHistory = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  run: (cmd) => {
    cmd.do();
    set((s) => ({ past: [...s.past.slice(-LIMIT + 1), cmd], future: [] }));
  },
  undo: () => {
    const { past } = get();
    const cmd = past[past.length - 1];
    if (!cmd) return;
    cmd.undo();
    set((s) => ({ past: s.past.slice(0, -1), future: [cmd, ...s.future] }));
  },
  redo: () => {
    const { future } = get();
    const cmd = future[0];
    if (!cmd) return;
    cmd.do();
    set((s) => ({ past: [...s.past, cmd], future: s.future.slice(1) }));
  },
  clear: () => set({ past: [], future: [] }),
}));
