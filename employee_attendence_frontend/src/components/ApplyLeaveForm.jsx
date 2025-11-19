import React, { useState, useContext } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { useToast } from "./ToastProvider";
import { getSupabaseClient } from "../lib/supabaseClient";
import AuthContext from "../context/AuthContext";

const LEAVE_TYPES = [
  { value: "Annual", label: "Annual" },
  { value: "Sick", label: "Sick" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Other", label: "Other" },
];

const accentColor = "#2563EB"; // ocean blue
const errorColor = "#EF4444";

// PUBLIC_INTERFACE
/**
 * Checks if required Supabase variables are missing.
 */
function isSupabaseEnvMissing() {
  return !process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_KEY;
}

// PUBLIC_INTERFACE
/**
 * Returns { userId, userEmail } from context or Supabase client, or null if unavailable.
 */
async function getCurrentUserInfo(supabase, contextUser) {
  // Prioritize AuthContext if provided.
  if (contextUser) {
    return {
      userId: contextUser.id || contextUser.sub || null,
      userEmail: contextUser.email || null,
    };
  }
  // Otherwise, use Supabase auth if available.
  if (supabase?.auth) {
    try {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      return {
        userId: user?.id || null,
        userEmail: user?.email || null,
      };
    } catch {
      return { userId: null, userEmail: null };
    }
  }
  return { userId: null, userEmail: null };
}

/**
 * Returns yyyy-mm-dd string for a Date or date string.
 */
function formatDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function validate({ startDate, endDate, leaveType, reason }) {
  const errors = {};
  if (!startDate) errors.startDate = "Start date is required.";
  if (!endDate) errors.endDate = "End date is required.";
  if (
    startDate &&
    endDate &&
    new Date(startDate) > new Date(endDate)
  ) {
    errors.endDate = "End date must not be before start date.";
  }
  if (!leaveType) errors.leaveType = "Leave type is required.";
  if (!reason) errors.reason = "Reason is required.";
  return errors;
}

/**
 * ApplyLeaveForm - Submits leave requests to Supabase/postgREST with fallback, user-linkage, and full feedback.
 */
const ApplyLeaveForm = ({ onSuccess }) => {
  const [fields, setFields] = useState({
    startDate: "",
    endDate: "",
    leaveType: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [supabaseError, setSupabaseError] = useState(null);

  const { show } = useToast();

  // React Hooks must be called unconditionally - so do not wrap in try/catch.
  const contextUserRaw = useContext(AuthContext);
  const contextUser = contextUserRaw && typeof contextUserRaw === "object"
    ? contextUserRaw.user ?? null
    : null;

  // Either supabase client or null if not configured
  const supabase = getSupabaseClient();
  const supabaseMissing = isSupabaseEnvMissing();

  const resetForm = () => {
    setFields({
      startDate: "",
      endDate: "",
      leaveType: "",
      reason: "",
    });
    setErrors({});
    setSupabaseError(null);
  };

  // Update form field logic
  const onFieldChange = (name, value) => {
    setFields((old) => ({
      ...old,
      [name]: value,
    }));
    setErrors((old) => ({
      ...old,
      [name]: undefined,
    }));
  };

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSupabaseError(null);
    const validation = validate(fields);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      show({ type: "error", message: "Please correct highlighted errors." });
      return;
    }

    setSubmitting(true);

    // Preferred: Submit into Supabase
    if (!supabaseMissing && supabase) {
      try {
        const { userId, userEmail } = await getCurrentUserInfo(supabase, contextUser);

        // Insert row into leave_requests: always supply all needed cols (status is 'pending', user_id if present)
        const { data, error } = await supabase
          .from("leave_requests")
          .insert([
            {
              user_id: userId || null,
              start_date: fields.startDate,
              end_date: fields.endDate,
              leave_type: fields.leaveType,
              reason: fields.reason,
              status: "pending",
              created_at: new Date().toISOString(),
            }
          ])
          .select();

        if (error) {
          setSupabaseError(error.message);
          show({ type: "error", message: `Leave not submitted: ${error.message}` });
          setSubmitting(false);
          return;
        }
        show({ type: "success", message: "Leave request submitted successfully!" });
        if (onSuccess && typeof onSuccess === "function") onSuccess(data?.[0] || {});
        resetForm();
        setSubmitting(false);
        return;
      } catch (err) {
        setSupabaseError(err?.message || "Unknown error");
        show({
          type: "error",
          message: `Could not submit leave: ${err?.message || "Unknown error"}`,
        });
        setSubmitting(false);
        return;
      }
    }

    // Fallback: LocalStorage (only if env missing or client missing)
    try {
      const key = "local_leave_requests";
      const pendingRequests = JSON.parse(localStorage.getItem(key) || "[]");
      const localRecord = {
        ...fields,
        storedAt: new Date().toISOString(),
        id: Math.random().toString(36).substring(2),
        status: "pending",
        user_id: contextUser?.id || null,
      };
      pendingRequests.push(localRecord);
      localStorage.setItem(key, JSON.stringify(pendingRequests));
      show({
        type: "success",
        message: "Leave request submitted (stored locally until admin sets up Supabase)",
      });
      if (onSuccess && typeof onSuccess === "function") onSuccess(localRecord);
      resetForm();
      setSubmitting(false);
    } catch (err) {
      setSupabaseError(`Could not save leave locally: ${err.message || ""}`);
      show({
        type: "error",
        message: `Could not store leave locally: ${err?.message || "Unknown error"}`,
      });
      setSubmitting(false);
    }
  };

  // UI
  return (
    <Card
      style={{
        maxWidth: 470,
        margin: "2rem auto",
        background: "#fff",
        boxShadow: "0 1px 4px 0 #a5b4fc20",
      }}
      shadow="md"
    >
      <h2
        style={{
          color: accentColor,
          fontWeight: 600,
          fontSize: "1.35rem",
          marginBottom: "1rem",
          letterSpacing: "-.01em",
        }}
      >
        Apply for Leave
      </h2>
      {/* Notice for missing Supabase environment */}
      {supabaseMissing && (
        <div
          className="mb-3 p-3 border border-amber-400 rounded bg-yellow-50 text-amber-700 text-sm"
          style={{
            border: "1.5px solid #fbbf24",
            background: "#fefce8",
            color: "#92400e",
            marginBottom: 12,
          }}
        >
          Supabase configuration missing.<br />
          <b>
            Please ask the administrator to set <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_KEY</code>.
          </b>
          <div style={{ fontSize: "0.93em", color: "#86722f", marginTop: 2 }}>
            Leave requests will be stored locally until Supabase setup is complete.
          </div>
        </div>
      )}
      {supabaseError && (
        <div
          className="mb-4 p-3 border border-red-400 rounded bg-red-50 text-red-700 text-sm"
          style={{
            border: "1.5px solid #ef4444",
            background: "#fef2f2",
            color: errorColor,
            marginBottom: 12,
          }}
        >
          {supabaseError}
        </div>
      )}
      <form
        data-testid="apply-leave-form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="startDate">
            Start Date <span style={{ color: errorColor }}>*</span>
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${errors.startDate ? "border-red-500" : "border-gray-300"}`}
            value={fields.startDate}
            onChange={(e) => onFieldChange("startDate", e.target.value)}
            min={formatDate(new Date())}
            required
            style={errors.startDate ? { borderColor: errorColor } : {}}
          />
          {errors.startDate && (
            <small style={{ color: errorColor }}>{errors.startDate}</small>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="endDate">
            End Date <span style={{ color: errorColor }}>*</span>
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${errors.endDate ? "border-red-500" : "border-gray-300"}`}
            value={fields.endDate}
            onChange={(e) => onFieldChange("endDate", e.target.value)}
            min={fields.startDate || formatDate(new Date())}
            required
            style={errors.endDate ? { borderColor: errorColor } : {}}
          />
          {errors.endDate && (
            <small style={{ color: errorColor }}>{errors.endDate}</small>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="leaveType">
            Leave Type <span style={{ color: errorColor }}>*</span>
          </label>
          <select
            id="leaveType"
            name="leaveType"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${errors.leaveType ? "border-red-500" : "border-gray-300"}`}
            value={fields.leaveType}
            onChange={(e) => onFieldChange("leaveType", e.target.value)}
            required
            style={errors.leaveType ? { borderColor: errorColor } : {}}
          >
            <option value="">Select leave type</option>
            {LEAVE_TYPES.map((type) => (
              <option value={type.value} key={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.leaveType && (
            <small style={{ color: errorColor }}>{errors.leaveType}</small>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="reason">
            Reason <span style={{ color: errorColor }}>*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            className={`border rounded px-3 py-2 w-full focus:outline-none resize-vertical min-h-[64px] ${errors.reason ? "border-red-500" : "border-gray-300"}`}
            value={fields.reason}
            onChange={(e) => onFieldChange("reason", e.target.value)}
            required
            maxLength={500}
            placeholder="Briefly explain the reason for your leave"
            aria-describedby="reasonHelp"
            style={errors.reason ? { borderColor: errorColor } : {}}
          />
          <small id="reasonHelp" className="text-gray-500">
            Max 500 characters.
          </small>
          {errors.reason && (
            <small style={{ color: errorColor, display: "block" }}>
              {errors.reason}
            </small>
          )}
        </div>
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            color="primary"
            style={{
              background: accentColor,
              color: "#fff",
              minWidth: 120,
              opacity: submitting ? 0.7 : 1,
              transition: "opacity 0.2s"
            }}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ApplyLeaveForm;
