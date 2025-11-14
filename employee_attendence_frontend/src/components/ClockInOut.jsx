import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';

/**
 * ClockInOut component:
 * - Inserts 'in' or 'out' records into 'attendance' table with user_id and timestamp.
 * Expected table schema:
 *   create table if not exists attendance (
 *     id uuid primary key default uuid_generate_v4(),
 *     user_id uuid not null,
 *     status text not null check (status in ('in','out')),
 *     created_at timestamptz default now()
 *   );
 * RLS example (to be configured in Supabase, not here):
 *   enable row level security;
 *   create policy "individuals can view own" on attendance
 *     for select using (auth.uid() = user_id);
 *   create policy "individuals can insert own" on attendance
 *     for insert with check (auth.uid() = user_id);
 */
const cardStyle = {
  padding: 20,
  borderRadius: 12,
  background: '#ffffff',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
};

const btnBase = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnIn = { ...btnBase, background: '#2563EB' };
const btnOut = { ...btnBase, background: '#F59E0B' };

// PUBLIC_INTERFACE
export default function ClockInOut() {
  const { user } = useAuth();
  const [working, setWorking] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [error, setError] = useState('');

  const fetchLast = async () => {
    if (!user) {
      setLastStatus(null);
      return;
    }
    const { data, error: err } = await supabase
      .from('attendance')
      .select('status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (err) {
      setError(err.message);
      return;
    }
    setLastStatus(data?.[0]?.status || null);
  };

  useEffect(() => {
    fetchLast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClock = async (status) => {
    if (!user) return;
    setWorking(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('attendance').insert({
        user_id: user.id,
        status,
      });
      if (insertError) {
        setError(insertError.message);
      } else {
        setLastStatus(status);
      }
    } catch (e) {
      setError(e.message || 'Unable to record attendance event.');
    } finally {
      setWorking(false);
    }
  };

  const inDisabled = !user || working || lastStatus === 'in';
  const outDisabled = !user || working || lastStatus === 'out';

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, color: '#111827' }}>Clock In / Out</h3>
      {!user ? (
        <div
          style={{
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            color: '#7C2D12',
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          Sign in to enable clock-in and attendance recording.
        </div>
      ) : null}
      {error ? (
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
          {error}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => handleClock('in')}
          disabled={inDisabled}
          style={{ ...btnIn, opacity: inDisabled ? 0.7 : 1 }}
          aria-disabled={inDisabled}
        >
          {working && lastStatus !== 'in' ? 'Working...' : 'Clock In'}
        </button>
        <button
          type="button"
          onClick={() => handleClock('out')}
          disabled={outDisabled}
          style={{ ...btnOut, opacity: outDisabled ? 0.7 : 1 }}
          aria-disabled={outDisabled}
        >
          {working && lastStatus !== 'out' ? 'Working...' : 'Clock Out'}
        </button>
      </div>
      <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>
        Last status: <strong>{lastStatus || 'N/A'}</strong>
      </p>
    </div>
  );
}
