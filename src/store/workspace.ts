import { create } from 'zustand';
import type { Workspace } from '@/api';

interface WorkspaceState {
  current: Workspace | null;
  list: Workspace[];
  setList: (list: Workspace[]) => void;
  select: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  current: null,
  list: [],
  setList: (list) => set({ list, current: get().current ?? list[0] ?? null }),
  select: (id) => set({ current: get().list.find((w) => w.id === id) ?? null }),
}));
