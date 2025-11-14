import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

/**
 * AdminDashboard:
 * Fetches all attendance records.
 * NOTE: Requires appropriate RLS policies or service role on server-side. For client-side,
 * ensure authenticated users with admin role can read all rows via RLS.
 */
// PUBLIC_INTERFACE
export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, user_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) setErr(error.message);
      else setRows(data || []);
    } catch (e) {
      setErr(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: '#ffffff',
        boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#111827' }}>Admin - All Attendance</h3>
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
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#111827' }}>Time</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#111827' }}>User</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#111827' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={{ padding: 8 }} colSpan={3}>
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: 8, borderTop: '1px solid #f3f4f6' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #f3f4f6' }}>{r.user_id}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #f3f4f6' }}>
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
