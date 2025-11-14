# Employee Attendance Frontend (React + Supabase)

Modern React application for managing and tracking employee attendance.
Styled with Tailwind (Ocean Professional theme). Supabase client is configured for optional future authentication and data storage.

## Features

- Public dashboard by default (no login required)
- Optional authentication context preserved for future use (signUp, signIn, signOut, profile fetch)
- Pages: Dashboard, Admin (admin view shows notice unless authenticated with admin role)
- Components: ClockInOut, AttendanceTable, AdminDashboard, NavBar
- Routing via react-router-dom v6
- TailwindCSS with Ocean Professional theme
- Utilities for date/time formatting and error handling

## Prerequisites

- Node.js 18+
- (Optional) Supabase project if you plan to enable authentication and data storage

## Environment

1. Copy .env.example to .env and set (optional for now):
```
REACT_APP_SUPABASE_URL=your-url
REACT_APP_SUPABASE_KEY=your-anon-key
REACT_APP_FRONTEND_URL=http://localhost:3000
```

2. If enabling Supabase-backed features, open `SUPABASE.md` and run the SQL in your Supabase SQL Editor to create:
  - attendance table + RLS policies
  - profiles table + trigger/function + RLS policies

## Install and Run

```
npm install
npm start
```

App runs at http://localhost:3000

## Build

```
npm run build
```

## Project Structure

- src/context/AuthContext.jsx: Optional auth state and helpers
- src/supabase/client.js: Supabase client reading REACT_APP_SUPABASE_URL/KEY
- src/pages: Dashboard, AdminPage
- src/components: NavBar, ClockInOut, AttendanceTable, AdminDashboard
- src/utils: datetime.js, errors.js
- tailwind.config.js, postcss.config.js, src/index.css: Tailwind and theme setup

## Notes

- Do not hardcode Supabase credentials. Use env vars.
- Admin page shows a notice unless the authenticated user's profile.role === 'admin'.
- For email confirmation behavior see SUPABASE.md if/when auth is enabled.
