import { useCallback, useEffect, useState } from 'react';
import { getAdminAttendance, getAdminOverview, listEmployees } from '../services/attendanceService';
import { useToast } from '../components/ToastProvider';

/**
 * Hook for admin overview KPIs, attendance table, and employee list with filters.
 */
// PUBLIC_INTERFACE
export default function useAdminData() {
  const toast = useToast();
  const [overview, setOverview] = useState({ presentToday: 0, absentToday: 0, late: 0, totalEmployees: 0 });
  const [attRows, setAttRows] = useState([]);
  const [attTotal, setAttTotal] = useState(0);
  const [attLoading, setAttLoading] = useState(false);
  const [empRows, setEmpRows] = useState([]);
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    department: '',
    search: '',
    page: 1,
    pageSize: 10,
  });

  const loadOverview = useCallback(async () => {
    try {
      const res = await getAdminOverview({});
      setOverview(res);
    } catch (e) {
      toast.show({ type: 'error', message: e?.message || 'Failed to load overview' });
    }
  }, [toast]);

  const loadAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const res = await getAdminAttendance(filters);
      setAttRows(res.rows || []);
      setAttTotal(res.total || 0);
    } catch (e) {
      toast.show({ type: 'error', message: e?.message || 'Failed to load attendance' });
    } finally {
      setAttLoading(false);
    }
  }, [toast, filters]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await listEmployees({ search: filters.search, department: filters.department });
      setEmpRows(res || []);
    } catch (e) {
      toast.show({ type: 'error', message: e?.message || 'Failed to load employees' });
    }
  }, [toast, filters.search, filters.department]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    overview,
    attRows,
    attTotal,
    attLoading,
    empRows,
    filters,
    setFilters,
  };
}
