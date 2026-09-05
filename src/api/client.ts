/**
 * The ONLY place that creates a Supabase client.
 * Nothing outside src/api/ may import this file (enforced by ESLint).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
    );
  }
  cached = createClient(url, anonKey);
  return cached;
}

export function isConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
