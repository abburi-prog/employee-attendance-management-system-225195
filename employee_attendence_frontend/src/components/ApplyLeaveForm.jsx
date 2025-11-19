import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { useToast } from "./ToastProvider";

/**
 * PUBLIC_INTERFACE
 * ApplyLeaveForm - Leave application form component for submitting employee leave requests.
 * 
 * Props:
 *   onSuccess: function({submittedObject}) - called after successful submission.
 * 
 * This component robustly handles:
 * - Backend URL detection (REACT_APP_API_BASE preferred, REACT_APP_BACKEND_URL fallback)
 * - Auth token propagation (from localStorage "token", injected if present)
 * - Error differentiation (network, validation, unauthorized, generic backend or local fallback)
 * - Graceful fallback to localStorage if backend is not configured
 * - Clean UI feedback via a toast provider
 * 
 * Code style and accents use "Ocean Professional" theme.
 */

const LEAVE_TYPES = [
  { value: "Annual", label: "Annual" },
  { value: "Sick", label: "Sick" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Other", label: "Other" },
];

const accentColor = "#2563EB"; // blue
const errorColor = "#EF4444";

function getApiBase() {
  // Prefer explicit API base URL, fallback to BACKEND URL, or return empty string (fallback path)
  return (
    (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
    (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL.trim()) ||
    ""
  );
}

// PUBLIC_INTERFACE
async function submitLeaveRequest(data, token) {
  const apiBase = getApiBase();
  if (apiBase) {
    // POST to /leave/apply (preferred), fallback to /api/leave or /leave-requests for compatibility
    const endpointCandidates = [
      `${apiBase.replace(/\/$/, "")}/leave/apply`,
      `${apiBase.replace(/\/$/, "")}/leave-requests`,
      `${apiBase.replace(/\/$/, "")}/api/leave`,
    ];
    for (const url of endpointCandidates) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        });
        // Handle specific status codes according to requirements
        if (res.ok) {
          return { success: true, record: await res.json(), endpoint: url };
        }
        if (res.status === 401) {
          return {
            success: false,
            error: "Unauthorized: Your session may have expired. Please sign in again.",
            status: 401,
          };
        }
        if (res.status === 400) {
          let errText = "Validation failed.";
          try {
            const j = await res.json();
            if (j && typeof j.error === "string") errText = j.error;
            else if (typeof j === "string") errText = j;
          } catch {}
          return { success: false, error: errText, status: 400 };
        }
        // If not found, try next endpoint; else generic failure
        if (res.status === 404) continue;
        // All other backend errors
        return {
          success: false,
          error: `Backend error (${res.status || "unknown"}).`,
          status: res.status,
        };
      } catch (err) {
        if (err.name === "TypeError" && err.message && err.message.match(/fetch/)) {
          return {
            success: false,
            error: "Network error: Cannot contact backend. Please check your connection or try again later.",
            network: true,
          };
        }
        // Try the next candidate
      }
    }
    // Backend configured, but none worked
    return {
      success: false,
      error: "Failed to submit leave request. Please contact administrator or try later.",
    };
  }
  // Fallback to localStorage for demos/dev/when backend not set
  const key = "local_leave_requests";
  const pendingRequests = JSON.parse(localStorage.getItem(key) || "[]");
  const localRecord = {
    ...data,
    storedAt: new Date().toISOString(),
    id: Math.random().toString(36).substring(2),
    status: "pending",
  };
  pendingRequests.push(localRecord);
  localStorage.setItem(key, JSON.stringify(pendingRequests));
  return {
    success: true,
    local: true,
    record: localRecord,
  };
}

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

const ApplyLeaveForm = ({ onSuccess }) => {
  const [fields, setFields] = useState({
    startDate: "",
    endDate: "",
    leaveType: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  // Reset all field and error values
  const resetForm = () => {
    setFields({
      startDate: "",
      endDate: "",
      leaveType: "",
      reason: "",
    });
    setErrors({});
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
    // Client-side validation
    const validation = validate(fields);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      show({ type: "error", message: "Please correct highlighted errors." });
      return;
    }
    setSubmitting(true);

    // Grab session token for auth, if set
    const token = localStorage.getItem("token");

    // Compose request object
    const payload = {
      ...fields,
      startDate: formatDate(fields.startDate),
      endDate: formatDate(fields.endDate),
      leaveType: fields.leaveType,
      reason: fields.reason.trim(),
    };

    const result = await submitLeaveRequest(payload, token);
    setSubmitting(false);

    if (result.success) {
      show({
        type: "success",
        message:
          "Leave request submitted successfully." +
          (result.local
            ? " (Stored locally – not sent to backend!)"
            : ""),
      });
      if (typeof onSuccess === "function") {
        onSuccess(result.record);
      }
      resetForm();
    } else if (result.status === 401) {
      show({
        type: "error",
        message: result.error || "Unauthorized: Your session may have expired. Please sign in again.",
      });
    } else if (result.status === 400) {
      show({
        type: "error",
        message: "Validation error: " + (result.error || ""),
      });
    } else if (result.network) {
      show({ type: "error", message: result.error });
    } else {
      show({
        type: "error",
        message: result.error || "Failed to submit leave request.",
      });
    }
  };

  // Form UI with accent color and clear errors
  return (
    <Card
      style={{
        maxWidth: 470,
        margin: "2rem auto",
        background: "#fff",
      }}
      shadow="md"
    >
      <h2
        style={{
          color: accentColor,
          fontWeight: 600,
          fontSize: "1.4rem",
          marginBottom: "16px",
          letterSpacing: "-.01em",
        }}
      >
        Apply for Leave
      </h2>
      <form
        data-testid="apply-leave-form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="startDate">
            Start Date
            <span style={{ color: errorColor }}>*</span>
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${
              errors.startDate ? "border-red-500" : "border-gray-300"
            }`}
            value={fields.startDate}
            onChange={(e) => onFieldChange("startDate", e.target.value)}
            min={formatDate(new Date())}
            required
          />
          {errors.startDate && (
            <small style={{ color: errorColor }}>{errors.startDate}</small>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="endDate">
            End Date
            <span style={{ color: errorColor }}>*</span>
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${
              errors.endDate ? "border-red-500" : "border-gray-300"
            }`}
            value={fields.endDate}
            onChange={(e) => onFieldChange("endDate", e.target.value)}
            min={fields.startDate || formatDate(new Date())}
            required
          />
          {errors.endDate && (
            <small style={{ color: errorColor }}>{errors.endDate}</small>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium" htmlFor="leaveType">
            Leave Type
            <span style={{ color: errorColor }}>*</span>
          </label>
          <select
            id="leaveType"
            name="leaveType"
            className={`border rounded px-3 py-2 w-full focus:outline-none ${
              errors.leaveType ? "border-red-500" : "border-gray-300"
            }`}
            value={fields.leaveType}
            onChange={(e) => onFieldChange("leaveType", e.target.value)}
            required
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
            Reason
            <span style={{ color: errorColor }}>*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            className={`border rounded px-3 py-2 w-full focus:outline-none resize-vertical min-h-[64px] ${
              errors.reason ? "border-red-500" : "border-gray-300"
            }`}
            value={fields.reason}
            onChange={(e) => onFieldChange("reason", e.target.value)}
            required
            maxLength={500}
            placeholder="Briefly explain the reason for your leave"
            aria-describedby="reasonHelp"
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

ApplyLeaveForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default ApplyLeaveForm;
