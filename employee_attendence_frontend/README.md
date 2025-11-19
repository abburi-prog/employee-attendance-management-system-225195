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

# Optional (existing)
REACT_APP_API_BASE=
REACT_APP_BACKEND_URL=

# Feature control
# If omitted or empty, logout is ENABLED by default.
REACT_APP_ENABLE_LOGOUT=true
```

3) Start the app
```
npm start
```

## Account Page and Profile Menu

- Account page (`/account`): A protected route showing the signed-in user's basic information (email and role) with placeholders for future settings. Accessible only to authenticated users.
- Profile menu in Navbar: When signed in, the top Navbar shows a circular avatar button. Clicking it opens a dropdown with:
  - Account: navigates to `/account`
  - Logout: signs out via `AuthContext.signOut()` (respects `REACT_APP_ENABLE_LOGOUT` feature flag)
- The "Sign In" button remains always visible in the Navbar per requirement.

## Feature Flags

- REACT_APP_ENABLE_LOGOUT
  - Type: boolean string ("true" | "false")
  - Default: "true" when the variable is not set
  - Behavior:
    - When "true": The "Logout" button in the Navbar calls `AuthContext.signOut()`, which performs a Supabase global sign-out, clears local state, and redirects to `/login`.
    - When "false": The "Logout" button remains visible but acts as a no-op and shows a tooltip: "Sign-out is disabled in this environment".

Note: The AuthContext implementation of `signOut()` remains unchanged and handles Supabase global sign-out and redirect.

## Supabase Auth

- Client initialized at `src/supabase/client.js` (singleton; import from `src/supabase/client`).
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
    3. Default: `user`

- Navbar at `src/components/Navbar.jsx`:
  - Shows Login when not authenticated
  - Logout behavior is controlled by `REACT_APP_ENABLE_LOGOUT` as described above
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
  role text not null default 'user',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;
```

Admin roles recognized: `admin`, `superadmin` (ensure you set `role` accordingly).

## Notes

- Do not hardcode secrets; use environment variables.
- Confirm Authentication → URL Configuration in Supabase matches `REACT_APP_FRONTEND_URL`.
