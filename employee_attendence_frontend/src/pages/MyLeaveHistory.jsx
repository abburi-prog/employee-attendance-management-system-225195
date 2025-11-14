import { useEffect, useState } from "react";
import { getMyLeaves } from "../api/leaveApi";

export default function MyLeaveHistory() {
  const [leaves, setLeaves] = useState(undefined); // undefined=loading, []=loaded, null=unauth

  useEffect(() => {
    let mounted = true;
    getMyLeaves().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error(error);
      if (Array.isArray(data)) setLeaves(data);
      else setLeaves([]); // unauthenticated or null → empty list
    }).catch(() => {
      if (mounted) setLeaves([]);
    });
    return () => { mounted = false; };
  }, []);

  if (leaves === undefined) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Leave History</h1>

      {leaves.length === 0 && <p>No leave records found.</p>}

      {leaves.map((leave) => (
        <div key={leave.id} className="p-4 border rounded mb-3">
          <p><strong>Type:</strong> {leave.leave_type}</p>
          <p><strong>Dates:</strong> {leave.start_date} → {leave.end_date}</p>
          {leave.total_days !== undefined && (
            <p><strong>Days:</strong> {leave.total_days}</p>
          )}
          <p><strong>Status:</strong> {leave.status}</p>
          {leave.reason && <p><strong>Reason:</strong> {leave.reason}</p>}
        </div>
      ))}
    </div>
  );
}
