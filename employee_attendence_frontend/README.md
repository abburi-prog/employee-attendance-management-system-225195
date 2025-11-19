# Employee Attendance Frontend

This React app integrates Supabase Auth for sign-in/sign-out, session management, and role-based access (admin).

## Setup

1) Install dependencies
```
npm install
```

2) Create `.env` in `employee_attendence_frontend/`:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_anon_key
REACT_APP_FRONTEND_URL=http://localhost:3000
```

Optional (existing):
- REACT_APP_API_BASE
- REACT_APP_BACKEND_URL

3) Start the app
```
npm start
```

### Feature flags

Sign-out behavior is controlled via `REACT_APP_FEATURE_FLAGS`.

- Default: sign-out is disabled to prevent accidental logouts in this environment.
- To enable sign-out, set the feature flag in your `.env`:
  ```
  REACT_APP_FEATURE_FLAGS=enable_sign_out=true
  ```
  You can combine multiple flags as a comma-separated list if needed.

When disabled, clicking the "Logout" button does nothing and shows a tooltip: "Sign-out disabled in this environment".

## Supabase Auth

- Client initialized at `src/supabase/client.js` (singleton; import from `src/supabase/client` or `src/supabase.js`).
- `AuthProvider` at `src/context/AuthContext.jsx`:
  - Subscribes to `supabase.auth.onAuthStateChange`
  - Exposes:
    - user, session, loading, profile (role), actionLoading
    - signIn(email, password)
    - signUp(email, password) with `emailRedirectTo` using `REACT_APP_FRONTEND_URL`
    - signOut() → calls `supabase.auth.signOut({ scope: 'global' })`, clears storage, redirects to `/login`
    - loginWithMagicLink(email, redirectTo?) uses `supabase.auth.signInWithOtp`
  - Role resolution:
    1. user.app_metadata.role or user.user_metadata.role
    2. Fallback: profiles table (id = auth.users.id) with `role` field
    3. Default: `employee`

- Login page at `src/pages/Login.jsx`:
  - Email/password sign-in
  - Optional magic-link sender
  - Redirects to `/` or `?returnTo=/path` on success
  - Minimal error/loading messaging

- Navbar at `src/components/Navbar.jsx`:
  - Shows Login when not authenticated
  - Logout button UI is visible, but the click is intentionally a no-op by default (no navigation/state clearing)
  - To enable actual sign-out behavior, add `enable_sign_out=true` to `REACT_APP_FEATURE_FLAGS` in `.env` (see below)
  - Hides Admin links when role !== 'admin'

## Route Guards

- `src/routes/AdminRoute.jsx` protects admin-only routes:
  - Requires authenticated user with role `admin`
  - Uses safety timeout so UI does not hang

- App wraps routes with `AuthProvider` in `src/index.js`

## Profiles Table (optional, for roles)

Create table in Supabase:
```
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'employee',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;
```

Admin roles recognized: `admin`, `superadmin` (ensure you set `role` accordingly).

## Notes

- Do not hardcode secrets; use environment variables.
- Keep existing safety timeouts for a responsive UI even if auth events delay.
- Confirm Authentication → URL Configuration in Supabase matches `REACT_APP_FRONTEND_URL`.
