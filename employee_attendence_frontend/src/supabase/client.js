import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
/**
 * Initialize and export a singleton Supabase client.
 * Requires env vars:
 * - REACT_APP_SUPABASE_URL: Supabase project URL
 * - REACT_APP_SUPABASE_KEY: Supabase anon/public key
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing: REACT_APP_SUPABASE_URL and/or REACT_APP_SUPABASE_KEY. Auth features will not work until set.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
export default supabase;
