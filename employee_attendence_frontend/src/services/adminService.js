//
// Admin service: centralizes API calls for admin features (leave approvals and attendance viewer)
// Reads API base from REACT_APP_API_BASE or REACT_APP_BACKEND_URL.
// Provides mock fallback if backend is unavailable or env vars are missing.
// Exposes functions used by Admin pages.
//
const RAW_BASE_A = (process.env.REACT_APP_API_BASE || '').trim();
const RAW_BASE_B = (process.env.REACT_APP_BACKEND_URL || '').trim();

function normalizeBase(url) {
  if (!url) return '';
  try {
    if (url.startsWith('/')) return url.replace(/\/+$/, '');
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

let API_BASE = normalizeBase(RAW_BASE_A || RAW_BASE_B);
let MOCK_MODE = !API_BASE;

// eslint-disable-next-line no-console
console.info(`[AdminService:init] mode=${MOCK_MODE ? 'MOCK' : 'API'} base=${API_BASE || '(unset)'}`);

function toast(message, type = 'info', duration = 3500) {
  try {
    const evt = new CustomEvent('app:toast', { detail: { message, type, duration } });
    window.dispatchEvent(evt);
  } catch {
    // no-op for tests
  }
}

async function apiFetch(path, options) {
  if (!API_BASE) throw new Error('API base URL is not configured');
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${p}`;
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed: ${res.status}`);
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  } catch (e) {
    if (!MOCK_MODE) {
      MOCK_MODE = true;
      toast('Backend unreachable. Switched to mock mode for admin service.', 'info', 4500);
      // eslint-disable-next-line no-console
      console.warn('[AdminService] Auto-switched to MOCK due to error:', e?.message);
    }
    throw e;
  }
}

// --------- Mock DB ---------
let __id = 1;
const mockEmployees = [
  { id: 'u-1', name: 'Jane Doe', email: 'jane@example.com', department: 'Engineering', role: 'admin', status: 'active' },
  { id: 'u-2', name: 'John Smith', email: 'john@example.com', department: 'Engineering', role: 'employee', status: 'active' },
  { id: 'u-3', name: 'Alice Lee', email: 'alice@example.com', department: 'Design', role: 'employee', status: 'inactive' },
];

const mockLeaves = [
  {
    id: `L-${__id++}`,
    userId: 'u-2',
    user: { email: 'john@example.com' },
    name: 'John Smith',
    leave_type: 'annual',
    start_date: '2025-01-10',
    end_date: '2025-01-12',
    total_days: 3,
    reason: 'Family trip',
    status: 'pending',
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: `L-${__id++}`,
    userId: 'u-3',
    user: { email: 'alice@example.com' },
    name: 'Alice Lee',
    leave_type: 'sick',
    start_date: '2025-01-05',
    end_date: '2025-01-05',
    total_days: 1,
    reason: 'Medical',
    status: 'approved',
    created_at: '2025-01-02T11:00:00.000Z',
  },
];

const mockAttendance = [
  // One day with in/out
  { id: `A-${__id++}`, userId: 'u-2', date: '2025-01-10', checkInIso: '2025-01-10T09:35:12.000Z', checkOutIso: '2025-01-10T17:45:00.000Z' },
  { id: `A-${__id++}`, userId: 'u-3', date: '2025-01-10', checkInIso: '2025-01-10T09:05:45.000Z', checkOutIso: '2025-01-10T18:00:12.000Z' },
  { id: `A-${__id++}`, userId: 'u-2', date: '2025-01-11', checkInIso: '2025-01-11T09:10:00.000Z', checkOutIso: '2025-01-11T17:12:33.000Z' },
];

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}

// --------- Leaves ---------
// PUBLIC_INTERFACE
export async function adminListLeaves() {
  /** Returns list of leave requests for admin dashboard. */
  if (MOCK_MODE) {
    await delay();
    // latest first
    return [...mockLeaves].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  return apiFetch('/admin/leaves', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function adminUpdateLeaveStatus(id, status) {
  /** Approve or deny a leave request. Returns updated row. */
  if (MOCK_MODE) {
    await delay();
    const idx = mockLeaves.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Leave not found');
    mockLeaves[idx] = { ...mockLeaves[idx], status };
    return mockLeaves[idx];
  }
  return apiFetch(`/admin/leaves/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// --------- Attendance (Admin viewer) ---------
// PUBLIC_INTERFACE
export async function adminListAttendance({ userId, start, end, page = 1, pageSize = 10 } = {}) {
  /**
   * Returns { rows, total } for admin attendance viewer with optional user and date range filters.
   * Rows have: { id, name, email, department, date, checkIn, checkOut, status }
   * checkIn/checkOut are ISO strings or '-' if not available.
   */
  if (MOCK_MODE) {
    await delay();
    let rows = mockAttendance.map((r) => {
      const emp = mockEmployees.find((e) => e.id === r.userId);
      return {
        id: r.id,
        name: emp?.name || r.userId,
        email: emp?.email || '',
        department: emp?.department || '',
        date: r.date,
        checkIn: r.checkInIso || '-',
        checkOut: r.checkOutIso || '-',
        status: r.checkInIso && r.checkOutIso ? 'present' : r.checkInIso ? 'in' : 'absent',
      };
    });
    if (userId) rows = rows.filter((r) => r.email === userId || r.name === userId || r.id === userId);
    if (start) rows = rows.filter((r) => r.date >= start);
    if (end) rows = rows.filter((r) => r.date <= end);
    const total = rows.length;
    const idx = (page - 1) * pageSize;
    return { rows: rows.slice(idx, idx + pageSize), total };
  }

  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return apiFetch(`/admin/attendance?${params.toString()}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function adminSearchUsers(query) {
  /** Simple search for users by name/email; used by autocomplete. */
  if (MOCK_MODE) {
    await delay();
    if (!query) return mockEmployees;
    const q = query.toLowerCase();
    return mockEmployees.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  return apiFetch(`/admin/users?${params.toString()}`, { method: 'GET' });
}
