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
 *
 * We also log a safe, minimal diagnostic (boolean flags + sanitized URL host) to verify
 * that env variables were injected at build time. We never print the anon key.
 */
(() => {
  try {
    const urlOk = Boolean(supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.length > 0);
    const keyOk = Boolean(supabaseKey && typeof supabaseKey === 'string' && supabaseKey.length > 0);

    // Derive a sanitized host for visibility without leaking full URL path/query
    let host = '';
    try {
      if (urlOk) {
        const u = new URL(supabaseUrl);
        host = u.host || '';
      }
    } catch {
      // ignore URL parse errors
    }

    // eslint-disable-next-line no-console
    console.info(
      `[Supabase:init] URL present=${urlOk} KEY present=${keyOk} Host=${host || 'invalid-url'} EnvFrontendURL=${Boolean(process.env.REACT_APP_FRONTEND_URL)}`
    );

    if (!urlOk || !keyOk) {
      // eslint-disable-next-line no-console
      console.warn(
        [
          'Supabase: Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_KEY.',
          'Auth and data features will fail until configured.',
          'Create .env from .env.example and set values. Then restart dev server.',
        ].join(' ')
      );
    }
  } catch {
    // no-op
  }
})();

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
