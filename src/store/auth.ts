import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  email: string | null;
  setSession: (userId: string | null, email: string | null) => void;
}

/** Filled by magic-link auth once Supabase is wired up. */
export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  setSession: (userId, email) => set({ userId, email }),
}));
