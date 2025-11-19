import React, { useEffect, useState } from 'react';
import supabase from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import { formatTimeHHmmss } from '../utils/time';
import { formatDurationHMS, diffSecondsBetweenIso } from '../utils/duration';

/**
 * AttendanceTable lists the signed-in user's attendance records.
 */
const tableCard = {
  padding: 20,
  borderRadius: 12,
  background: '#ffffff',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
};

const headerCell = { textAlign: 'left', padding: '10px 8px', color: '#111827' };
const cell = { textAlign: 'left', padding: '8px 8px', color: '#111827', borderTop: '1px solid #f3f4f6' };

// PUBLIC_INTERFACE
export default function AttendanceTable() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const fetchRows = async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        setErr(error.message);
      } else {
        setRows(data || []);
      }
    } catch (e) {
      setErr(e.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div style={tableCard}>
      <h3 style={{ marginTop: 0, color: '#111827' }}>Your Attendance</h3>
      {err ? (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      ) : null}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCell}>Time</th>
                <th style={headerCell}>Status</th>
                <th style={headerCell}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={cell} colSpan={2}>
                    No records yet.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  // If this row is an 'out' event, try to find the next row (later in time) that is 'in' to pair
                  let durCell = '-';
                  if (r.status === 'out') {
                    const prev = rows[idx + 1]; // because ordered desc by created_at
                    if (prev && prev.status === 'in') {
                      const secs = diffSecondsBetweenIso(prev.created_at, r.created_at);
                      if (secs > 0) durCell = formatDurationHMS(secs);
                    }
                  }
                  return (
                    <tr key={r.id}>
                      <td style={cell}>{formatTimeHHmmss(r.created_at)}</td>
                      <td style={cell}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: r.status === 'in' ? '#DBEAFE' : '#FEF3C7',
                            color: r.status === 'in' ? '#1E40AF' : '#92400E',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={cell}>{durCell}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
