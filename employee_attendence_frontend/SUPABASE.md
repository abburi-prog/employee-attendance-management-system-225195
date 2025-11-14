# Supabase Integration Notes

This frontend uses Supabase for auth and attendance storage.

## Environment Variables
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY
- REACT_APP_FRONTEND_URL (optional; used for magic link redirect)

Copy `.env.example` to `.env` and set the above values. Do not commit the `.env` file.

## Auth
The Login page uses `signInWithOtp` (magic link). Ensure Email provider is enabled in your Supabase project.
Set the Site URL in Supabase Auth settings to your frontend’s URL (e.g., http://localhost:3000).

## Suggested Table (SQL)
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

For Admin visibility, create appropriate policies using a custom claim/role or manage via a backend service with a service role key. Avoid exposing service role keys in the client.
