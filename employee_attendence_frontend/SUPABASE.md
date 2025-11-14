# Supabase Integration Notes

This frontend uses Supabase for auth and attendance storage.

## Environment Variables
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY
- (Optional) REACT_APP_FRONTEND_URL for email confirmation redirect

Copy `.env.example` to `.env` and set the above values. Do not commit the `.env` file.

Currently present envs in container (for reference): REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY, REACT_APP_API_BASE, REACT_APP_BACKEND_URL, REACT_APP_FRONTEND_URL, REACT_APP_WS_URL, REACT_APP_NODE_ENV, REACT_APP_NEXT_TELEMETRY_DISABLED, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_LOG_LEVEL, REACT_APP_HEALTHCHECK_PATH, REACT_APP_FEATURE_FLAGS, REACT_APP_EXPERIMENTS_ENABLED

## Auth
This app uses email/password authentication.

- Enable Email provider in Supabase Dashboard:
  - Go to Authentication → Providers → Email
  - Ensure "Enable email signups" and "Password sign in" are enabled
  - Configure "Confirm email" as you prefer:
    - If ON: Users must confirm via email link before they can sign in. Until then, sign-in will fail with "Email not confirmed".
    - If OFF: Users can sign in immediately after sign-up.

- Redirect after email confirmation:
  - In Supabase Dashboard → Authentication → URL Configuration:
    - Set the "Site URL" to your frontend (e.g., http://localhost:3000 during development).
    - Optionally, specify additional redirect URLs if needed.
  - The app can also pass a custom redirect via `options.emailRedirectTo` during `signUp` (not required if Site URL is sufficient).

- The frontend calls:
  - `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signOut()`

Important behavior notes:
- If confirmation is ON, `signUp` returns `data.session = null` and no user is signed in until the email is confirmed.
- The UI will show a friendly message asking users to check their email and then sign in.

## Attendance Table (SQL)

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  status text not null check (status in ('in','out')),
  created_at timestamptz not null default now()
);

alter table if exists public.attendance enable row level security;

-- Users can insert/select their own rows
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance' and policyname = 'Individuals can view own attendance'
  ) then
    create policy "Individuals can view own attendance"
      on public.attendance for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance' and policyname = 'Individuals can insert own attendance'
  ) then
    create policy "Individuals can insert own attendance"
      on public.attendance for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
```

## Profiles Auto-Creation on Signup

To ensure each new authenticated user has a profile row created automatically, create the `profiles` table, a SECURITY DEFINER function, and a trigger on `auth.users`.

Requirements:
- Table public.profiles:
  - id uuid primary key references auth.users(id)
  - full_name text
  - role text default 'employee'
  - created_at timestamptz default now()
- Function public.handle_new_user() that inserts into profiles when a new auth.users row is inserted
- Trigger on auth.users to call the function
- RLS policy to allow users to select their own profile

Run the following SQL in Supabase SQL Editor:

```sql
-- 1) Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'employee',
  created_at timestamptz default now()
);

-- 2) Function (SECURITY DEFINER)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Make sure the function owner can insert into public.profiles
alter function public.handle_new_user() owner to postgres;

-- 3) Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) RLS + Policy
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile" on public.profiles
      for select using (auth.uid() = id);
  end if;
end $$;
```

Notes:
- The function uses `new.raw_user_meta_data->>'full_name'` to populate `full_name` from sign-up metadata when available.
- The default `role` is set to `employee` to align with app expectations.
- The function is `SECURITY DEFINER` so it can insert into `public.profiles`. Ensure its owner has the right privileges (e.g., `postgres`).
- Add additional policies as needed (e.g., allow users to update their own profile).

## Troubleshooting

- If you see errors like `PGRST202 Could not find the function public.run_sql(query)`, run the SQL directly in the Supabase SQL Editor as above. The app does not require `run_sql` to function; it's only used for automation.
- Ensure RLS policies are present; otherwise, the client may not be able to read profiles/attendance.
- If sign-in fails with "Email not confirmed", either:
  - Confirm the user's email by clicking the link sent by Supabase (required when email confirmation is enabled), or
  - Disable "Confirm email" in Supabase Authentication settings for testing.

## Admin Access Considerations

If the app needs admin-level data access on the client, implement policies that check `exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')` for broader selects, or route admin data via a secure backend using the service role key (never expose service role keys in the client).
