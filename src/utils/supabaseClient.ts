import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project configuration provided by the user
export const SUPABASE_PROJECT_ID = 'pubjjjvzscuqdplxzxqw';
export const SUPABASE_DEFAULT_URL = 'https://pubjjjvzscuqdplxzxqw.supabase.co';
export const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_NA6-GB0VJH5l28IC1YaTkQ_UAYWkBMN';

// Safe environment variable resolution with fallback
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env : undefined;

const supabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  SUPABASE_DEFAULT_URL;

const supabaseAnonKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  SUPABASE_DEFAULT_ANON_KEY;

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabase();
