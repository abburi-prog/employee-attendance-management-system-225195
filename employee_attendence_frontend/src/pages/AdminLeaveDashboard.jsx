import { useEffect, useState } from "react";
import { getAllLeaves, updateLeaveStatus } from "../api/leaveApi";

export default function AdminLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await getAllLeaves();
    if (error) console.error(error);
    setLeaves(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Leave Dashboard</h1>

      {loading && <p>Loading...</p>}

      {leaves.map((leave) => (
        <div key={leave.id} className="p-4 border rounded mb-3">
          <p><strong>User:</strong> {leave.user?.email}</p>
          <p><strong>Type:</strong> {leave.leave_type}</p>
          <p><strong>From:</strong> {leave.start_date}</p>
          <p><strong>To:</strong> {leave.end_date}</p>
          {leave.total_days !== undefined && (
            <p><strong>Days:</strong> {leave.total_days}</p>
          )}
          <p><strong>Status:</strong> {leave.status}</p>

          {leave.status === "pending" && (
            <div className="flex gap-3 mt-3">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  await updateLeaveStatus(leave.id, "approved");
                  loadData();
                }}
              >
                Approve
              </button>

              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  await updateLeaveStatus(leave.id, "rejected");
                  loadData();
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
