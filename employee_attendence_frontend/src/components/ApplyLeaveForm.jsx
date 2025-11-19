import React, { useState, useContext, useRef } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { useToast } from "./ToastProvider";
import { getSupabaseClient } from "../lib/supabaseClient";
import AuthContext from "../context/AuthContext";
import { v4 as uuidv4 } from "uuid"; // for client-generated ids

const LEAVE_TYPES = [
  { value: "Annual", label: "Annual" },
  { value: "Sick", label: "Sick" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Other", label: "Other" },
];

const accentColor = "#2563EB"; // ocean blue
const errorColor = "#EF4444";

/**
 * Dynamically checks for required Supabase env variables at runtime – supports CRA, Netlify, Vercel, Docker, etc.
 * Looks for process.env, window._env_ (Netlify Docker pattern), and window.ENV.
 */
function isSupabaseEnvMissing() {
  // Try resolving env vars as runtime properties (browser) as well as build time (Node/CRA).
  let url = undefined, key = undefined;
  if (typeof window !== "undefined") {
    url =
      (window._env_ && window._env_.REACT_APP_SUPABASE_URL) ||
      (window.ENV && window.ENV.REACT_APP_SUPABASE_URL) ||
      (window.process && window.process.env && window.process.env.REACT_APP_SUPABASE_URL);
    key =
      (window._env_ && window._env_.REACT_APP_SUPABASE_KEY) ||
      (window.ENV && window.ENV.REACT_APP_SUPABASE_KEY) ||
      (window.process && window.process.env && window.process.env.REACT_APP_SUPABASE_KEY);
  }
  // Fallback to build-time env (works in some tools)
  url = url || process.env.REACT_APP_SUPABASE_URL;
  key = key || process.env.REACT_APP_SUPABASE_KEY;
  return !(url && key);
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
  const [lastLocalId, setLastLocalId] = useState(null);
  const [retryingSubmit, setRetryingSubmit] = useState(false);

  const { show } = useToast();

  // React Hooks must be called unconditionally - so do not wrap in try/catch.
  const contextUserRaw = useContext(AuthContext);
  const contextUser = contextUserRaw && typeof contextUserRaw === "object"
    ? contextUserRaw.user ?? null
    : null;

  // Either supabase client or null if not configured
  const supabase = getSupabaseClient();
  const supabaseMissing = isSupabaseEnvMissing();

  // Ref to track last failed local request for retry
  const lastFailedLocalRef = useRef(null);

  // Reset form helper - move to top for safe use in all handlers
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

  // Update form field logic - move to top
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

  // Deduplication utility for client-side requests
  function getDedupId(fieldsObj) {
    // We want a deterministic, unique id: hash form values + current user + created_at for retries
    // v4 UUID for brand new submission, else persists across attempts
    return fieldsObj.client_id || uuidv4();
  }

  // Save failed request locally for retry
  function storeLocalRequest(localRecord) {
    const key = "local_leave_requests";
    const pendingRequests = JSON.parse(localStorage.getItem(key) || "[]");
    // Remove duplicates (by id)
    const filtered = pendingRequests.filter((req) => req.id !== localRecord.id);
    filtered.push(localRecord);
    localStorage.setItem(key, JSON.stringify(filtered));
    setLastLocalId(localRecord.id);
    lastFailedLocalRef.current = localRecord;
  }

  // Remove request from local fallback store after successful retry
  function removeLocalRequestById(id) {
    if (!id) return;
    const key = "local_leave_requests";
    const pendingRequests = JSON.parse(localStorage.getItem(key) || "[]");
    const filtered = pendingRequests.filter((req) => req.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Utility function: Exponential backoff with per-attempt timeout and offline awareness
  async function retrySupabaseInsert(record, maxAttempts = 3, baseTimeoutMs = 5000) {
    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Immediately abort if user is offline
        throw new Error("offline");
      }
      attempt += 1;
      // Per-attempt timeout (5s, 2x, 4x); maxAttempts=3 → 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
      let didTimeout = false;
      let result, error;

      try {
        const insertOp = supabase
          .from("leave_requests")
          .insert([record])
          .select();

        // Per-attempt timeout, but never exceeding baseTimeoutMs (minimum of backoff or total timeout)
        const resultPromise = Promise.race([
          insertOp,
          new Promise((_, reject) =>
            setTimeout(() => {
              didTimeout = true;
              if (controller) controller.abort();
              reject(new Error("Request timed out"));
            }, Math.min(delay, baseTimeoutMs))
          )
        ]);
        ({ data: result, error } = await resultPromise);
        if (error) {
          lastError = error;
        } else if (result && !error) {
          // Success!
          return result;
        }
      } catch (e) {
        lastError = e;
        if (e.message === "offline") throw e;
        if (didTimeout || (e && e.name === "AbortError")) {
          // Continue to retry on timeout
        } else {
          // If not a network/timeout error, do not retry more
          break;
        }
      }
      // Next attempt waits exponentially (backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    // After attempts exhausted
    throw lastError || new Error("Supabase insert failed after retries");
  }

  // PUBLIC_INTERFACE
  // - Main form submit handler, now with robust retry, deduplication, offline fallback,
  // feedback for Ocean Professional UI, and error-safe local save.
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

    const generatedId = getDedupId(fields); // Use/assign client id for dedup
    const leaveRecord = {
      user_id: contextUser?.id || null,
      start_date: fields.startDate,
      end_date: fields.endDate,
      leave_type: fields.leaveType,
      reason: fields.reason,
      status: "pending",
      created_at: new Date().toISOString(),
      client_id: generatedId,
      id: generatedId,
    };

    // Check for offline mode
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Store locally, notify user
      storeLocalRequest({
        ...leaveRecord,
        storedAt: new Date().toISOString(),
        offline: true,
      });
      setSupabaseError("Saved locally, will sync when online.");
      show({
        type: "info",
        message: "Offline: Saved locally. Tap 'Retry submit' when back online.",
      });
      setSubmitting(false);
      return;
    }

    // If Supabase config present, attempt exponential backoff retry
    if (!supabaseMissing && supabase && typeof supabase.from === "function") {
      try {
        const { userId } = await getCurrentUserInfo(supabase, contextUser);
        leaveRecord.user_id = userId || leaveRecord.user_id;

        const result = await retrySupabaseInsert(leaveRecord, 3, 5000);
        show({ type: "success", message: "Leave request submitted successfully!" });
        if (onSuccess && typeof onSuccess === "function")
          onSuccess((result && result[0]) || leaveRecord);

        removeLocalRequestById(leaveRecord.id);
        setLastLocalId(null);
        resetForm();
        setSubmitting(false);
        return;
      } catch (err) {
        // If offline detected during retry, fall back to local
        if (err.message === "offline") {
          storeLocalRequest({
            ...leaveRecord,
            storedAt: new Date().toISOString(),
            offline: true,
          });
          setSupabaseError("Saved locally, will sync when online. Use 'Retry submit' to resubmit.");
          show({
            type: "info",
            message: "Offline: Saved locally. Tap 'Retry submit' when back online.",
          });
          resetForm();
          setSubmitting(false);
          return;
        }
        // If all attempts failed (timeout or network), fall back and show retry
        storeLocalRequest({
          ...leaveRecord,
          storedAt: new Date().toISOString(),
          failed: true,
        });
        setSupabaseError("Could not submit: timeout or network error. Saved locally, retry available.");
        show({
          type: "warning",
          message:
            "Submission failed (timeout/network). Saved locally. Tap 'Retry submit' to try again when online.",
        });
        setSubmitting(false);
        return;
      }
    }

    // Fallback: LocalStorage (legacy - env misconfig/missing)
    try {
      storeLocalRequest({
        ...leaveRecord,
        storedAt: new Date().toISOString(),
        fallback: true,
      });
      setSupabaseError(
        "Supabase unavailable; leave saved locally until administrator sets up Supabase."
      );
      show({
        type: "info",
        message: "Supabase not configured: leave stored locally for now.",
      });
      if (onSuccess && typeof onSuccess === "function") onSuccess(leaveRecord);
      resetForm();
    } catch (err) {
      setSupabaseError(`Could not save leave locally: ${err.message || ""}`);
      show({
        type: "error",
        message: `Could not store leave locally: ${err?.message || "Unknown error"}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // PUBLIC_INTERFACE
  // Retry button handler for local -> Supabase resubmission
  const handleRetrySubmit = async () => {
    if (!lastLocalId) {
      show({ type: "info", message: "Nothing to retry." });
      return;
    }
    setRetryingSubmit(true);
    setSupabaseError(null);

    const key = "local_leave_requests";
    const pendingRequests = JSON.parse(localStorage.getItem(key) || "[]");
    const retryRequest = pendingRequests.find((req) => req.id === lastLocalId);

    if (!retryRequest) {
      show({ type: "info", message: "No saved request found for retry." });
      setRetryingSubmit(false);
      setLastLocalId(null);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSupabaseError("Still offline. Please go online to retry.");
      show({ type: "warning", message: "Still offline. Connect to internet to retry." });
      setRetryingSubmit(false);
      return;
    }

    if (!supabaseMissing && supabase && typeof supabase.from === "function") {
      try {
        // Remove non-schema attributes before send
        const {
          storedAt,
          failed,
          offline,
          fallback,
          ...prepared
        } = retryRequest;
        const result = await retrySupabaseInsert(prepared, 3, 5000);
        show({ type: "success", message: "Leave request synced/submitted!" });
        if (onSuccess && typeof onSuccess === "function")
          onSuccess((result && result[0]) || prepared);
        removeLocalRequestById(retryRequest.id);
        setLastLocalId(null);
        setSupabaseError(null);
      } catch (err) {
        setSupabaseError(
          "Retry failed: " +
            (err && err.message === "offline"
              ? "Still offline."
              : err?.message || "timeout/network error. Tap 'Retry' again.")
        );
        show({
          type: "warning",
          message: "Resubmission failed. Check network or try again.",
        });
      } finally {
        setRetryingSubmit(false);
      }
    } else {
      show({
        type: "info",
        message: "Supabase config/connection still missing. Cannot resubmit.",
      });
      setSupabaseError("Supabase unavailable; please try again later.");
      setRetryingSubmit(false);
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
          className="mb-4 p-3 border border-red-400 rounded bg-red-50 text-red-700 text-sm flex items-center gap-2"
          style={{
            border: "1.5px solid #ef4444",
            background: "#fef2f2",
            color: errorColor,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ flex: 1 }}>{supabaseError}</span>
          {/* Show 'Retry submit' if failure was due to timeout/offline and local copy exists */}
          {lastLocalId && (
            <Button
              type="button"
              color="primary"
              style={{
                background: accentColor,
                color: "#fff",
                fontSize: "0.91em",
                minWidth: "100px",
                marginLeft: 8,
                opacity: retryingSubmit ? 0.7 : 1,
                transition: "opacity 0.2s",
                borderRadius: 6,
                height: 32,
              }}
              disabled={retryingSubmit}
              onClick={handleRetrySubmit}
              aria-busy={retryingSubmit ? "true" : undefined}
            >
              {retryingSubmit ? "Retrying..." : "Retry submit"}
            </Button>
          )}
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
