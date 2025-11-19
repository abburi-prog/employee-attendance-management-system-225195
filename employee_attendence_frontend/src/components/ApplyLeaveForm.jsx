import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "./ui/Button";
import Card from "./ui/Card";
import DateRangePicker from "./ui/DateRangePicker";
import { useToast } from "./ToastProvider";

/**
 * PUBLIC_INTERFACE
 * ApplyLeaveForm - Leave application form component
 *
 * Props:
 *   onSuccess: function({submittedObject}) - called after successful submission.
 */
const LEAVE_TYPES = [
  { value: "Annual", label: "Annual" },
  { value: "Sick", label: "Sick" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Other", label: "Other" },
];

// Ocean Professional theme accents
const accentColor = "#2563EB"; // blue
const accentAmber = "#F59E0B";
const errorColor = "#EF4444";

function getApiBase() {
  return (
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    ""
  );
}

/**
 * Submits leave request.
 * If backend is not available, stores in localStorage.
 */
async function submitLeaveRequest(data) {
  const apiBase = getApiBase();
  if (apiBase) {
    // Try POST to /api/leave, fallback /leave-requests if 404
    let endpoints = [
      `${apiBase.replace(/\/$/, "")}/api/leave`,
      `${apiBase.replace(/\/$/, "")}/leave-requests`,
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (res.ok) return { success: true };
      } catch (e) {
        // Try next endpoint or fallback
        // ignore for now
      }
    }
    // Backend is configured, but failed
    return {
      success: false,
      error:
        "Failed to submit leave request. Please contact administrator or try later.",
    };
  }
  // Graceful fallback: save to localStorage
  const pendingRequests =
    JSON.parse(localStorage.getItem("local_leave_requests") || "[]");
  pendingRequests.push({
    ...data,
    storedAt: new Date().toISOString(),
    id: Math.random().toString(36).substring(2),
  });
  localStorage.setItem(
    "local_leave_requests",
    JSON.stringify(pendingRequests)
  );
  return {
    success: true,
    local: true,
  };
}

function formatDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/**
 * Validates leave form fields.
 * Returns an errors object.
 */
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

  const resetForm = () => {
    setFields({
      startDate: "",
      endDate: "",
      leaveType: "",
      reason: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate(fields);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      show({ type: "error", message: "Please correct highlighted errors." });
      return;
    }
    setSubmitting(true);
    const result = await submitLeaveRequest({
      ...fields,
      startDate: formatDate(fields.startDate),
      endDate: formatDate(fields.endDate),
      leaveType: fields.leaveType,
      reason: fields.reason.trim(),
    });
    setSubmitting(false);

    if (result.success) {
      show({
        type: "success",
        message:
          "Leave request submitted successfully." +
          (result.local
            ? " (Stored temporarily, not yet sent to backend!)"
            : ""),
      });
      if (typeof onSuccess === "function") {
        onSuccess(fields);
      }
      resetForm();
    } else {
      show({
        type: "error",
        message: result.error || "Failed to submit leave request.",
      });
    }
  };

  // Responsive form card
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
        {/* Start/End date pickers */}
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
