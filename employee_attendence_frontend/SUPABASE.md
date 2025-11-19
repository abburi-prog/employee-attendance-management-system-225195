# Supabase Integration

This frontend uses Supabase Auth for session management and role-based access.

## Environment Variables

Set these in `.env`:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY
- REACT_APP_FRONTEND_URL (optional; used for magic link/redirect consistency)

## Client

- Initialized in `src/supabase/client.js` with session persistence and auto-refresh.

## Auth Provider

`src/context/AuthContext.jsx`:
- Subscribes to `supabase.auth.onAuthStateChange`
- Exposes `user`, `session`, `loading`, `profile` (optional), helpers:
  - `signIn(email, password)`
  - `signOut()`

Role resolution order:
1. `user.app_metadata.role` (or `user.user_metadata.role`)
2. Fallback `public.profiles.role` by `id = auth.users.id`
3. Default `employee`

Admin-only routes require `role === 'admin'` (or `superadmin` if you extend).

## Profiles Table

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
- Add additional redirect URLs as needed

Ensure this matches `REACT_APP_FRONTEND_URL`.

## UI

- `src/pages/Login.jsx` implements email/password login.
- `src/components/Navbar.jsx` and `src/components/NavBar.jsx` show Login/Logout and hide Admin links for non-admins.
- `src/routes/AdminRoute.jsx` protects Admin routes with safety timeouts to avoid indefinite loading.

## Security

- Do not expose service role keys in the frontend.
- Use RLS policies for tables accessed from the client.
