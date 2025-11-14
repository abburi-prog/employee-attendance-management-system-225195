import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';

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
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={cell}>{new Date(r.created_at).toLocaleString()}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
