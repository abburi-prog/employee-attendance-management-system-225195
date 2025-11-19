# Employee Attendance Frontend (React + Supabase)

Modern React application for managing and tracking employee attendance.
Styled with Tailwind (Ocean Professional theme). Supabase client is configured for optional future authentication and data storage.

## Pages and Routing

- / → redirects to /dashboard
- /dashboard → overview and quick components
- /attendance → clock-in/out with today's status and history (filters, pagination)
- /admin → KPIs, attendance overview table with filters/search/export, employees list (visible only if role === 'admin')
- /admin/leaves → Admin Leave Approvals (list, approve/deny with confirmation and toasts)
- /admin/attendance → Admin Attendance Viewer (user search/autocomplete, date range filters, table + pagination)
- /settings → feature flags placeholder
- /not-authorized → friendly message for restricted access

## Layout and Theme

- TopNav shows app title and user/role badge (fallback to Guest/employee).
- SideNav shows Dashboard, Attendance, Admin (role === 'admin'), Settings.
- ThemeProvider implements Ocean Professional palette:
  - primary #2563EB, success/secondary #F59E0B, error #EF4444, background #f9fafb, surface #ffffff, text #111827
- Accessible components with keyboard focus states.

## Data Layer and Mock/API Mode

- services/attendanceService.js reads REACT_APP_API_BASE. If not set, runs in MOCK mode using in-memory arrays.
- services/adminService.js reads REACT_APP_API_BASE or REACT_APP_BACKEND_URL. If both are missing or backend unreachable, it runs in MOCK mode and shows a toast.
- Functions:
  - getTodayStatus, clockIn, clockOut
  - getAttendanceHistory
  - getAdminOverview, getAdminAttendance
  - listEmployees
- Mock mode simulates latency and supports filters, pagination, CSV export.
- If you provide a backend, set REACT_APP_API_BASE to the REST base URL or a relative base (e.g. "/api").
- API base normalization:
  - Trailing slashes are removed.
  - Relative base like "/api" is supported (use CRA proxy or reverse proxy).
- When API mode is enabled but the backend is unreachable or CORS blocks the request:
  - The app automatically switches to MOCK mode at runtime and shows a toast: "Backend unreachable. Switched to mock mode..."
  - Errors like "Failed to fetch" are surfaced in toasts with a hint to verify CORS and base URL.
- CORS (backend requirement):
  - Access-Control-Allow-Origin should include your frontend origin (e.g., http://localhost:3000) during development.
  - Allow methods: GET, POST, OPTIONS. Allow headers: Content-Type, Authorization (if required).

## Time Formatting

- All displayed times (clock-in, clock-out, table timestamps) are shown as HH:mm:ss and respect the user's local timezone.
- The UI uses a shared utility in `src/utils/time.js` (formatTimeHHmmss) to ensure consistent formatting.
- In mock mode, the service now returns ISO timestamps (e.g., 2025-01-01T09:30:15.123Z) so seconds are preserved end-to-end.
- Worked duration formatting:
  - `src/utils/duration.js` provides:
    - `formatDurationHMS(totalSeconds)` → "X hours Y mins Z secs" with correct pluralization.
    - `diffSecondsBetweenIso(startIso, endIso)` to compute total seconds between timestamps.
  - Example: 12:37:02 → 13:49:04 yields `diffSecondsBetweenIso = 4322` and `formatDurationHMS(4322) = '1 hour 12 mins 2 secs'`.
  - Attendance Today status, Attendance History, Admin table and CSV export now use the humanized duration.

## Hooks

- useAttendance: Provides today's status, clock in/out actions, history (with pagination and date filters), loading/error.
- useAdminData: Provides KPIs, attendance rows with filters, employees list.

## Shared Components

- Button, Card, KPIStat, Table, Pagination, DateRangePicker, ToastProvider.

## Authentication and Roles

- Auth remains optional. Role is resolved from profile.role when available; otherwise defaults to 'employee'.
- Admin menu item is hidden for non-admin; direct /admin access renders NotAuthorized.

## Environment

Copy .env.example to .env and set as needed:

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_KEY=
REACT_APP_FRONTEND_URL=http://localhost:3000
REACT_APP_API_BASE=   # if empty → mock mode; if set → API mode (e.g., http://localhost:4000)
REACT_APP_BACKEND_URL=  # optional alternative base; adminService falls back to this if provided
REACT_APP_FEATURE_FLAGS={}
```

Notes:
- Attendance service logs at init: `[AttendanceService:init] mode=MOCK|API base=...`.
- In API mode, the backend must expose:
  - POST /attendance/clock-in  body: { userId }
  - POST /attendance/clock-out body: { userId }
  - GET  /attendance/today-status?userId=...
  - GET  /attendance/history?userId=...&page=1&pageSize=10&start=YYYY-MM-DD&end=YYYY-MM-DD
  - GET  /admin/overview?date=YYYY-MM-DD
  - GET  /admin/attendance?... (filters)
  - GET  /admin/employees?... (filters)
- If API is unavailable or returns an error, user-facing toasts show the error. Keep `REACT_APP_API_BASE` unset to run in mock mode.

For Supabase setup details see SUPABASE.md.

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

## Tests

- A smoke test renders the app and checks for the header "Employee Attendance".
- Run: `npm test`

## Project Structure

- src/theme/ThemeProvider.jsx
- src/components/ToastProvider.jsx
- src/components/layout/{TopNav,SideNav,Layout}.jsx
- src/components/ui/{Button,Card,KPIStat,Table,Pagination,DateRangePicker}.jsx
- src/services/attendanceService.js
- src/hooks/{useAttendance,useAdminData}.js
- src/pages/{Dashboard,Attendance,Admin,Settings,NotAuthorized}.jsx
- src/context/AuthContext.jsx
- src/supabase/client.js

## Notes

- Do not hardcode Supabase credentials. Use env vars.
- Admin page shows Not Authorized unless profile.role === 'admin'.
- No login route; flows work without authentication by design.
