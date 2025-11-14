import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initializer.
 * Reads credentials from environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * NOTE: Do not hardcode credentials. Set env vars in the project's .env file.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

/**
 * Only initialize once per bundle. The module scope export guarantees singleton behavior in CRA.
 * We provide clear console guidance when env vars are missing to aid local setup.
 */
if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn(
    [
      'Supabase: Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_KEY.',
      'Auth and data features will fail until configured.',
      'Create .env from .env.example and set values. Then restart dev server.',
    ].join(' ')
  );
}

/**
 * Create the Supabase client. Default options (persistSession and autoRefreshToken)
 * are appropriate for browser apps.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

// PUBLIC_INTERFACE
export function getSupabase() {
  /** Returns a configured Supabase client instance. */
  return supabase;
}
