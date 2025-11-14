import { useCallback, useEffect, useMemo, useState } from 'react';
import { clockIn, clockOut, getAttendanceHistory, getTodayStatus } from '../services/attendanceService';
import { useToast } from '../components/ToastProvider';

/**
 * Hook encapsulating attendance state for current user (auth-optional).
 * Defaults to a mock user id in mock mode.
 */
// PUBLIC_INTERFACE
export default function useAttendance({ userId = 'u-2' } = {}) {
  const toast = useToast();
  const [today, setToday] = useState({ state: 'none' });
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState(null);

  const refreshToday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTodayStatus(userId);
      setToday(res);
    } catch (e) {
      setError(e);
      toast.show({ type: 'error', message: e?.message || 'Failed to load status' });
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  const refreshHistory = useCallback(async () => {
    setHistLoading(true);
    setError(null);
    try {
      const res = await getAttendanceHistory({ userId, page, pageSize, start, end });
      setHistory(res.rows || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e);
      toast.show({ type: 'error', message: e?.message || 'Failed to load history' });
    } finally {
      setHistLoading(false);
    }
  }, [toast, userId, page, pageSize, start, end]);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const onClockIn = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clockIn(userId);
      if (res?.ok) {
        setToday(res.status);
        toast.show({ type: 'success', message: 'Clocked in' });
        await refreshHistory();
        await refreshToday();
        // eslint-disable-next-line no-console
        console.info('[useAttendance] clock-in success', res.status);
      } else {
        toast.show({ type: 'error', message: res?.error || 'Unable to clock in' });
        // eslint-disable-next-line no-console
        console.warn('[useAttendance] clock-in failed', res);
      }
    } catch (e) {
      const msg = e?.message || 'Unable to clock in';
      toast.show({ type: 'error', message: msg });
      // eslint-disable-next-line no-console
      console.warn('[useAttendance] clock-in error', msg);
    } finally {
      setLoading(false);
    }
  }, [toast, userId, refreshHistory, refreshToday]);

  const onClockOut = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clockOut(userId);
      if (res?.ok) {
        setToday(res.status);
        toast.show({ type: 'success', message: 'Clocked out' });
        await refreshHistory();
        await refreshToday();
        // eslint-disable-next-line no-console
        console.info('[useAttendance] clock-out success', res.status);
      } else {
        toast.show({ type: 'error', message: res?.error || 'Unable to clock out' });
        // eslint-disable-next-line no-console
        console.warn('[useAttendance] clock-out failed', res);
      }
    } catch (e) {
      const msg = e?.message || 'Unable to clock out';
      toast.show({ type: 'error', message: msg });
      // eslint-disable-next-line no-console
      console.warn('[useAttendance] clock-out error', msg);
    } finally {
      setLoading(false);
    }
  }, [toast, userId, refreshHistory, refreshToday]);

  const filtered = useMemo(() => history, [history]);

  return {
    today,
    loading,
    error,
    history: filtered,
    histLoading,
    page,
    pageSize,
    total,
    setPage,
    setStart,
    setEnd,
    onClockIn,
    onClockOut,
    refreshToday,
  };
}
