import React, { useEffect, useState, useCallback } from "react";
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import { LuRefreshCcw } from "react-icons/lu";

/**
 * PUBLIC_INTERFACE
 * MyLeaveHistory - Displays user's locally saved leave requests with basic filters, search, and sync button.
 * Reads leave requests from localStorage using the same key as ApplyLeaveForm (defaults to 'leave_requests').
 * Switch to Supabase easily when backend is available.
 */
const storageKey = "leave_requests";
const statusOptions = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

/**
 * Helper to get leave requests from localStorage.
 */
function getLocalLeaves() {
  let raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Table column definitions
 */
const columns = [
  {
    Header: "Date Range",
    accessor: (row) =>
      row.start_date && row.end_date
        ? `${row.start_date} → ${row.end_date}`
        : "",
  },
  { Header: "Type", accessor: "type" },
  { Header: "Reason", accessor: "reason" },
  { Header: "Status", accessor: "status" },
  {
    Header: "Created At",
    accessor: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString()
        : "—",
  },
  {
    Header: "Sync", // present only if record is unsynced
    accessor: "__sync",
  },
];

/**
 * Returns true if the leave record needs syncing (using a local property or 'synced' flag)
 */
function needsSync(leave) {
  return leave?.synced === false || leave?.synced === undefined;
}

export default function MyLeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [syncingIndex, setSyncingIndex] = useState(null);

  // Load data from localStorage
  useEffect(() => {
    setLeaves(getLocalLeaves());
  }, []);

  const handleStatusChange = (evt) => setStatus(evt.target.value);
  const handleSearchChange = (evt) => setSearch(evt.target.value);

  const handleRetrySync = useCallback(
    async (idx) => {
      setSyncingIndex(idx);
      // Placeholder for real sync logic (to Supabase)
      setTimeout(() => {
        let updated = [...leaves];
        updated[idx].synced = true;
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setLeaves(updated);
        setSyncingIndex(null);
      }, 1200);
    },
    [leaves]
  );

  // Filtering logic (status + search)
  const filtered = leaves.filter((leave) => {
    // Status filter
    if (status !== "ALL" && leave.status !== status) return false;
    // Search filter (by reason/type, case-insensitive)
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const inReason = leave.reason?.toLowerCase().includes(query);
    const inType = leave.type?.toLowerCase().includes(query);
    return inReason || inType;
  });

  // Table row rendering (add retry sync button if unsynced)
  const tableRows = filtered.map((leave, idx) => {
    let row = {
      ...leave,
    };
    if (needsSync(leave)) {
      row.__sync = (
        <Button
          variant="secondary"
          size="sm"
          startIcon={<LuRefreshCcw size={16} />}
          loading={syncingIndex === idx}
          onClick={() => handleRetrySync(idx)}
          title="Retry syncing this request"
        >
          Retry Sync
        </Button>
      );
    } else {
      row.__sync = <span className="text-green-600">✔</span>;
    }
    return row;
  });

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 bg-[linear-gradient(120deg,#2563eb0d_0,#f9fafb_100%)]">
      <Card className="max-w-5xl mx-auto p-6 shadow-lg rounded-xl bg-white/90">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 tracking-tight flex items-center gap-2">
          <span>My Leave History</span>
        </h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:ml-6">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by reason or type..."
              className="rounded-md border border-gray-300 px-3 py-1 w-full text-sm focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table columns={columns} data={tableRows} rowKey={(row, idx) => row.id || idx} />
        </div>
        {filtered.length === 0 && (
          <div className="text-gray-500 mt-8 text-center py-10">
            <p>No leave requests found matching your filters.</p>
          </div>
        )}
        <div className="mt-8 text-xs text-gray-400 text-center">
          <span>
            Data loaded from local storage. { /* This could switch to Supabase in future release. */ }
          </span>
        </div>
      </Card>
    </div>
  );
}
