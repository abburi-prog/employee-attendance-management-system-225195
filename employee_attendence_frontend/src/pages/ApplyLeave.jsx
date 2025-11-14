import { useRef, useState } from "react";
import { applyLeave } from "../api/leaveApi";
import { supabase } from "../supabase";
import { useToast } from "../components/ToastProvider";

/**
 * ApplyLeave form with validation, loading state, and user feedback.
 * Props:
 * - onSubmitted?: function() -> optional callback to refresh parent dashboards after successful submission.
 */
// PUBLIC_INTERFACE
export default function ApplyLeave({ onSubmitted }) {
  const toast = useToast();
  const topRef = useRef(null);

  const [form, setForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" }); // 'success' | 'error' | 'info'

  const scrollToTop = () => {
    try {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // no-op
    }
    // Fallback for older browsers
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  // Inclusive total day count helper
  const computeTotalDays = (start, end) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
      // floor to midnight to avoid TZ partial days
      const sUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
      const eUTC = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
      const diff = (eUTC - sUTC) / (1000 * 60 * 60 * 24);
      return diff >= 0 ? diff + 1 : 0; // inclusive
    } catch {
      return 0;
    }
  };

  const validateForm = () => {
    const { leave_type, start_date, end_date } = form;
    if (!leave_type || !start_date || !end_date) {
      return "Please complete all required fields: leave type, start date, and end date.";
    }
    if (end_date < start_date) {
      return "End date must be on or after the start date.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return; // prevent double submit

    const errorMsg = validateForm();
    if (errorMsg) {
      setMessage({ type: "error", text: errorMsg });
      toast.show({ type: "error", message: errorMsg });
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "info", text: "" });
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        const msg = "You must be logged in to apply for leave.";
        setMessage({ type: "error", text: msg });
        toast.show({ type: "error", message: msg });
        scrollToTop();
        return;
      }

      // Build payload without total_days so DB can compute it (GENERATED ALWAYS or trigger)
      // Only include allowed fields: user_id, leave_type (if present), start_date, end_date, reason
      const basePayload = {
        user_id: user.id,
        start_date: form.start_date,
        end_date: form.end_date,
      };
      if (form.leave_type) basePayload.leave_type = form.leave_type;
      if (form.reason) basePayload.reason = form.reason;

      const { error } = await applyLeave(basePayload);
      if (error) {
        const msg = error?.message || "Failed to submit leave request.";
        setMessage({ type: "error", text: msg });
        toast.show({ type: "error", message: msg });
        scrollToTop();
        return;
      }

      // success
      const successMsg = "Leave request submitted.";
      setMessage({ type: "success", text: successMsg });
      toast.show({ type: "success", message: successMsg });
      // reset form
      setForm({ leave_type: "", start_date: "", end_date: "", reason: "" });

      // optional callback for parent dashboards to refresh
      try {
        onSubmitted?.();
      } catch {
        // ignore errors from consumer
      }

      scrollToTop();
    } catch (e2) {
      const msg = e2?.message || "Unexpected error while submitting leave request.";
      setMessage({ type: "error", text: msg });
      toast.show({ type: "error", message: msg });
      scrollToTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const banner =
    message?.text &&
    ({
      success: {
        bg: "#ECFDF5",
        br: "#A7F3D0",
        color: "#065F46",
      },
      error: {
        bg: "#FEF2F2",
        br: "#FECACA",
        color: "#991B1B",
      },
      info: {
        bg: "#EFF6FF",
        br: "#BFDBFE",
        color: "#1E40AF",
      },
    }[message.type] || { bg: "#EFF6FF", br: "#BFDBFE", color: "#1E40AF" });

  return (
    <div ref={topRef} className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Apply for Leave</h1>

      {banner ? (
        <div
          className="text-sm rounded-lg mb-4"
          style={{
            background: banner.bg,
            border: `1px solid ${banner.br}`,
            color: banner.color,
            padding: 12,
          }}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Leave Type</label>
          <select
            className="border p-2 w-full rounded"
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            required
          >
            <option value="">Select Leave Type</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="annual">Annual Leave</option>
            <option value="wfh">Work From Home</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="border p-2 w-full rounded"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="border p-2 w-full rounded"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
          <textarea
            className="border p-2 w-full rounded"
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={3}
          />
        </div>

        <button
          className="bg-blue-600 text-white p-2 w-full rounded disabled:opacity-60"
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="submit"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Submit Leave Request"}
        </button>
      </form>
    </div>
  );
}
