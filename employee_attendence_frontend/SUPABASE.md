# Supabase Integration Notes

This frontend uses Supabase for auth and attendance storage.

## Environment Variables
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Copy `.env.example` to `.env` and set the above values. Do not commit the `.env` file.

## Auth
This app now uses email/password authentication.

- Enable Email provider in Supabase Dashboard:
  - Go to Authentication → Providers → Email
  - Ensure "Enable email signups" and "Password sign in" are enabled
  - Configure email confirmation as you prefer (if enabled, users must confirm before signing in)

- The frontend calls:
  - `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signOut()`

- Optional Profiles Table:
  - The app attempts to read a `profiles` table with columns: `id (uuid)`, `full_name (text)`, `role (text)`.
  - If present, ensure rows exist for users (can be via trigger on auth.user creation).
  - The `role` is used to guard the Admin page (`role === 'admin'`).

## Suggested Tables (SQL)
Create a table `attendance`:

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  status text not null check (status in ('in','out')),
  created_at timestamptz not null default now()
);

alter table public.attendance enable row level security;

-- Users can insert/select their own rows
create policy "Individuals can view own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

create policy "Individuals can insert own attendance"
  on public.attendance for insert
  with check (auth.uid() = user_id);
```

Optionally, create a `profiles` table:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'user',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Optional trigger to create profile on signup (adjust language/permissions as needed)
-- This requires a Postgres function to insert into profiles upon user creation.
```

For Admin visibility across all attendance, configure appropriate RLS policies for users with `role = 'admin'` or manage via a secure backend using a service role key. Never expose service role keys in the client.
