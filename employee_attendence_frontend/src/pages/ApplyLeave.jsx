import { useState } from "react";
import { applyLeave } from "../api/leaveApi";
import { supabase } from "../supabase";

export default function ApplyLeave() {
  const [form, setForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("You must be logged in to apply for leave.");
        return;
      }

      const payload = { ...form, user_id: user.id };
      const { error } = await applyLeave(payload);
      if (error) return alert(error.message);

      alert("Leave request submitted!");
      setForm({ leave_type: "", start_date: "", end_date: "", reason: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Apply for Leave</h1>

      <select
        className="border p-2 w-full mb-3 rounded"
        value={form.leave_type}
        onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
      >
        <option value="">Select Leave Type</option>
        <option value="sick">Sick Leave</option>
        <option value="casual">Casual Leave</option>
        <option value="annual">Annual Leave</option>
        <option value="wfh">Work From Home</option>
      </select>

      <input
        type="date"
        className="border p-2 w-full mb-3 rounded"
        value={form.start_date}
        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
      />

      <input
        type="date"
        className="border p-2 w-full mb-3 rounded"
        value={form.end_date}
        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
      />

      <textarea
        className="border p-2 w-full mb-3 rounded"
        placeholder="Reason"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />

      <button
        className="bg-blue-600 text-white p-2 w-full rounded disabled:opacity-60"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Leave Request"}
      </button>
    </div>
  );
}
