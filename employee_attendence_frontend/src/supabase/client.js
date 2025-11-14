import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initializer.
 * Reads credentials from environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * NOTE: Do not hardcode credentials. Set env vars in the project's .env file.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Basic runtime checks to help local development; avoid throwing to not break CI builds
if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase: Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_KEY. Auth and data features will be disabled until configured.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// PUBLIC_INTERFACE
export function getSupabase() {
  /** Returns a configured Supabase client instance. */
  return supabase;
}
