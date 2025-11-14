# Employee Attendance Frontend (React + Supabase)

Modern React application for managing and tracking employee attendance.
Styled with Tailwind (Ocean Professional theme), using Supabase for auth and storage.

## Features

- Email/Password authentication (Supabase)
- Auth context with signUp, signIn, signOut, profile fetch
- Pages: Login, Dashboard, Admin
- Components: ClockInOut, AttendanceTable, AdminDashboard, NavBar, ProtectedRoute
- Routing via react-router-dom v6
- TailwindCSS with Ocean Professional theme
- Utilities for date/time formatting and error handling

## Prerequisites

- Node.js 18+
- Supabase project with Email provider enabled

## Environment

1. Copy .env.example to .env and set:
```
REACT_APP_SUPABASE_URL=your-url
REACT_APP_SUPABASE_KEY=your-anon-key
REACT_APP_FRONTEND_URL=http://localhost:3000
```

2. Supabase SQL setup:
- Open `SUPABASE.md` and run the SQL in your Supabase SQL Editor to create:
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

- src/context/AuthContext.jsx: Auth state, signUp, signIn, signOut, profile load
- src/supabase/client.js: Supabase client reading REACT_APP_SUPABASE_URL/KEY
- src/pages: Login, Dashboard, AdminPage
- src/components: NavBar, ProtectedRoute, ClockInOut, AttendanceTable, AdminDashboard
- src/utils: datetime.js, errors.js
- tailwind.config.js, postcss.config.js, src/index.css: Tailwind and theme setup

## Notes

- Do not hardcode Supabase credentials. Use env vars.
- Admin page requires profile.role === 'admin' per RLS or manual role setting.
- For email confirmation behavior see SUPABASE.md.
