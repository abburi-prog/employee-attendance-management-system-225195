import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
/**
 * Initializes and exports a Supabase client if environment variables are provided, else returns null.
 * Ensures no network/client call is attempted if env vars are missing.
 * @returns {SupabaseClient|null} The initialized client, or null if configuration is missing.
 */
export function getSupabaseClient() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}
