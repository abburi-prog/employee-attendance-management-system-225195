const API_BASE = process.env.REACT_APP_API_BASE || '';
// Single toggle for mock mode. If API_BASE is not set, default to mock mode.
const MOCK_MODE = !API_BASE;

// Minimal runtime diagnostics to clarify which mode is active and where API points to.
// eslint-disable-next-line no-console
console.info(
  `[AttendanceService:init] mode=${MOCK_MODE ? 'MOCK' : 'API'} base=${API_BASE || '(unset)'}`
);

/**
 * In-memory storage for mock data. Not persisted across reloads.
 */
const mockDb = {
  attendance: [], // { id, userId, date: 'YYYY-MM-DD', checkIn: 'HH:mm', checkOut: 'HH:mm' }
  employees: [
    { id: 'u-1', name: 'Jane Doe', email: 'jane@example.com', department: 'Engineering', role: 'admin', status: 'active' },
    { id: 'u-2', name: 'John Smith', email: 'john@example.com', department: 'Engineering', role: 'employee', status: 'active' },
    { id: 'u-3', name: 'Alice Lee', email: 'alice@example.com', department: 'Design', role: 'employee', status: 'inactive' },
  ],
};
let seq = 1;

function simulateLatency(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function timeHm(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1] = checkIn.split(':').map((n) => parseInt(n, 10));
  const [h2, m2] = checkOut.split(':').map((n) => parseInt(n, 10));
  const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  return Math.max(0, Math.round((minutes / 60) * 100) / 100);
}

/**
 * Fetch helper for API mode.
 */
async function apiFetch(path, options) {
  if (!API_BASE) {
    throw new Error('API base URL is not configured');
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
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
    // eslint-disable-next-line no-console
    console.warn('[AttendanceService:apiFetch] Falling back to mock due to error:', e?.message);
    throw e;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export async function getTodayStatus(userId = 'u-2') {
  /** Returns today's status for the current user: { state: 'none'|'in'|'out', checkInAt?, checkOutAt? } */
  if (MOCK_MODE) {
    await simulateLatency();
    const d = todayYmd();
    const row = mockDb.attendance.find((r) => r.userId === userId && r.date === d);
    if (!row) return { state: 'none' };
    if (row.checkIn && !row.checkOut) return { state: 'in', checkInAt: row.checkIn };
    if (row.checkIn && row.checkOut) return { state: 'out', checkInAt: row.checkIn, checkOutAt: row.checkOut };
    return { state: 'none' };
  }
  try {
    return await apiFetch(`/attendance/today-status?userId=${encodeURIComponent(userId)}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[AttendanceService:getTodayStatus] API error:', e?.message);
    throw e;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export async function clockIn(userId = 'u-2') {
  /** Records check-in for the user today and returns updated status. */
  if (MOCK_MODE) {
    await simulateLatency();
    const d = todayYmd();
    let row = mockDb.attendance.find((r) => r.userId === userId && r.date === d);
    if (!row) {
      row = { id: `a-${seq++}`, userId, date: d, checkIn: timeHm(), checkOut: null };
      mockDb.attendance.unshift(row);
      // eslint-disable-next-line no-console
      console.info('[AttendanceService:clockIn:mock] ok user=', userId, 'time=', row.checkIn);
      return { ok: true, status: { state: 'in', checkInAt: row.checkIn } };
    }
    if (row.checkIn && !row.checkOut) {
      return { ok: false, error: 'Already clocked in.' };
    }
    // Has checkOut for today, create new entry
    row = { id: `a-${seq++}`, userId, date: d, checkIn: timeHm(), checkOut: null };
    mockDb.attendance.unshift(row);
    // eslint-disable-next-line no-console
    console.info('[AttendanceService:clockIn:mock:new-session] ok user=', userId, 'time=', row.checkIn);
    return { ok: true, status: { state: 'in', checkInAt: row.checkIn } };
  }
  try {
    const data = await apiFetch(`/attendance/clock-in`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    // Expected data normalization: accept backend {state,checkInAt,checkOutAt} or wrapped
    const status = data?.status || data || null;
    if (!status) {
      return { ok: false, error: 'Invalid response from server' };
    }
    return { ok: true, status };
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to clock in' };
  }
}

/**
 * PUBLIC_INTERFACE
 */
export async function clockOut(userId = 'u-2') {
  /** Records check-out for the user today and returns updated status. */
  if (MOCK_MODE) {
    await simulateLatency();
    const d = todayYmd();
    const row = mockDb.attendance.find((r) => r.userId === userId && r.date === d);
    if (!row || !row.checkIn) return { ok: false, error: 'Not clocked in yet.' };
    if (row.checkOut) return { ok: false, error: 'Already clocked out.' };
    row.checkOut = timeHm();
    // eslint-disable-next-line no-console
    console.info('[AttendanceService:clockOut:mock] ok user=', userId, 'time=', row.checkOut);
    return { ok: true, status: { state: 'out', checkInAt: row.checkIn, checkOutAt: row.checkOut } };
  }
  try {
    const data = await apiFetch(`/attendance/clock-out`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    const status = data?.status || data || null;
    if (!status) {
      return { ok: false, error: 'Invalid response from server' };
    }
    return { ok: true, status };
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to clock out' };
  }
}

/**
 * PUBLIC_INTERFACE
 */
export async function getAttendanceHistory({ userId = 'u-2', page = 1, pageSize = 10, start, end }) {
  /** Returns paged history with date filter: { rows: [], total } */
  if (MOCK_MODE) {
    await simulateLatency();
    let rows = mockDb.attendance
      .filter((r) => r.userId === userId)
      .map((r) => ({
        id: r.id,
        date: r.date,
        checkIn: r.checkIn || '-',
        checkOut: r.checkOut || '-',
        hours: calcHours(r.checkIn, r.checkOut),
      }));
    if (start) rows = rows.filter((r) => r.date >= start);
    if (end) rows = rows.filter((r) => r.date <= end);
    const total = rows.length;
    const startIdx = (page - 1) * pageSize;
    const pageRows = rows.slice(startIdx, startIdx + pageSize);
    return { rows: pageRows, total };
  }
  const params = new URLSearchParams({ userId, page, pageSize });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return apiFetch(`/attendance/history?${params.toString()}`);
}

/**
 * PUBLIC_INTERFACE
 */
export async function getAdminOverview({ date = todayYmd() } = {}) {
  /** Returns KPI metrics: { presentToday, absentToday, late, totalEmployees } */
  if (MOCK_MODE) {
    await simulateLatency();
    const totalEmployees = mockDb.employees.length;
    const todays = mockDb.attendance.filter((r) => r.date === date);
    const presentIds = new Set(todays.map((r) => r.userId));
    const presentToday = presentIds.size;
    const absentToday = totalEmployees - presentToday;
    const late = todays.filter((r) => r.checkIn && r.checkIn > '09:30').length;
    return { presentToday, absentToday, late, totalEmployees };
  }
  return apiFetch(`/admin/overview?date=${encodeURIComponent(date)}`);
}

/**
 * PUBLIC_INTERFACE
 */
export async function getAdminAttendance({ page = 1, pageSize = 10, start, end, department, search }) {
  /** Returns admin attendance table data with filters. */
  if (MOCK_MODE) {
    await simulateLatency();
    // Join to employees for name/email
    let rows = mockDb.attendance.map((r) => {
      const emp = mockDb.employees.find((e) => e.id === r.userId);
      return {
        id: r.id,
        name: emp?.name || r.userId,
        email: emp?.email || '',
        department: emp?.department || '',
        date: r.date,
        checkIn: r.checkIn || '-',
        checkOut: r.checkOut || '-',
        hours: calcHours(r.checkIn, r.checkOut),
      };
    });
    if (start) rows = rows.filter((r) => r.date >= start);
    if (end) rows = rows.filter((r) => r.date <= end);
    if (department) rows = rows.filter((r) => r.department === department);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s));
    }
    const total = rows.length;
    const startIdx = (page - 1) * pageSize;
    const pageRows = rows.slice(startIdx, startIdx + pageSize);
    return { rows: pageRows, total };
  }
  const params = new URLSearchParams({ page, pageSize });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (department) params.set('department', department);
  if (search) params.set('search', search);
  return apiFetch(`/admin/attendance?${params.toString()}`);
}

/**
 * PUBLIC_INTERFACE
 */
export async function listEmployees({ search, department } = {}) {
  /** Returns employee list with status and role. */
  if (MOCK_MODE) {
    await simulateLatency();
    let rows = [...mockDb.employees];
    if (department) rows = rows.filter((e) => e.department === department);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((e) => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
    }
    return rows;
  }
  const params = new URLSearchParams();
  if (department) params.set('department', department);
  if (search) params.set('search', search);
  return apiFetch(`/admin/employees?${params.toString()}`);
}
