# Supabase Integration

This frontend uses Supabase Auth for session management and role-based access.

## Environment Variables

Set these in `.env` (do not commit secrets):
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY
- REACT_APP_FRONTEND_URL (optional; used for magic link/redirect consistency)

Example `.env.example`:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_anon_key
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## Client

- Initialized in `src/supabase/client.js` with session persistence and auto-refresh.
- Always import the singleton client from:
  - `src/supabase/client.js` (default export), or
  - `src/supabase.js` (re-export convenience).
- Do NOT create alternate clients or import from other paths to prevent duplicate instances.

## Auth Provider

`src/context/AuthContext.jsx`:
- Subscribes to `supabase.auth.onAuthStateChange` and handles:
  - `SIGNED_OUT`: clears React state (`session`, `user`, `role`) immediately so UI/guards react without lag.
  - `TOKEN_REFRESHED`, `SIGNED_IN`, `USER_UPDATED`: updates `session`, `user`, and recomputes `role`.
- Exposes `user`, `session`, `loading`, `profile` (optional), helpers:
  - `signIn(email, password)`
  - `signOut()` which:
    1) performs Supabase v2 global sign-out: `await supabase.auth.signOut({ scope: 'global' })`
    2) defensively clears local storage keys used by Supabase (keys starting with `sb-` or including `supabase`) and attempts to clear cookies
    3) resets React state
    4) hard-redirects to `/login` via `window.location.assign('/login')` to avoid SPA cache if session persists
    5) includes a hard sign-out fallback that clears storage/cookies and reloads if anything fails
- Role resolution order:
  1) `user.app_metadata.role` (or `user.user_metadata.role`)
  2) Fallback `public.profiles.role` by `id = auth.users.id`
  3) Default `employee` (or `user` internally), surfaced to UI as `profile.role`

## UI and Route Guards

- Navbar (`src/components/Navbar.jsx`):
  - The Logout is a button (not inside a Link) and calls `await signOut()` from context.
  - The AuthContext handles redirection after clearing session, so no client-side `navigate` is needed.

- Login page (`src/pages/Login.jsx`):
  - Email/password sign-in via `useAuth().signIn`.
  - Redirects to `/dashboard` on success, blocks form while authenticated.

- Protected routes (`src/App.js`):
  - `ProtectedRoute` redirects to `/login` when `user === null`.
  - `AdminRoute` requires `profile.role === 'admin'` and fails safe if resolution times out.

## Profiles Table (optional, for roles)

Recommended SQL:
```
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'employee',
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
```
Add policies as needed (e.g., users can select/update own profile; admins can read all).

## Redirects

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: http://localhost:3000 (dev)
- Add additional redirect URLs as needed (ensure this matches `REACT_APP_FRONTEND_URL` in `.env`).

## Diagnostics

- Minimal `console.info` logging for auth state changes is enabled in non-production to assist with debugging sign-in/sign-out flows.
- Ensure only one `AuthProvider` wraps the app (this project wraps it once inside `App`).

## Security

- Do not expose service role keys in the frontend.
- Use RLS policies for tables accessed from the client.
- Do not log PII or secrets.
