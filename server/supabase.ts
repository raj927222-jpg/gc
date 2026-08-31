import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pubjjjvzscuqdplxzxqw';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_NA6-GB0VJH5l28IC1YaTkQ_UAYWkBMN';

export const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});

export { SUPABASE_PROJECT_ID, SUPABASE_URL };
