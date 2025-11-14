import { supabase } from "../supabase";

/**
 * Helper to get current user safely. Returns { user: null } if unauthenticated or on error.
 */
async function getCurrentUserSafe() {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user || null;
    return { user };
  } catch {
    return { user: null };
  }
}

// PUBLIC_INTERFACE
export async function applyLeave(payload) {
  /** Inserts a leave request. Caller must ensure authentication. */
  return await supabase.from("leave_requests").insert(payload);
}

// PUBLIC_INTERFACE
export async function getMyLeaves() {
  /**
   * Returns the current user's leave requests ordered by created_at desc.
   * When unauthenticated, returns a safe empty result: { data: null, error: null } so callers can render a friendly message.
   */
  const { user } = await getCurrentUserSafe();
  if (!user) {
    return { data: null, error: null };
  }
  return await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
}

// PUBLIC_INTERFACE
export async function getAllLeaves() {
  /** Admin usage: fetch all leave requests with user email. */
  return await supabase
    .from("leave_requests")
    .select("*, user:auth.users(email)")
    .order("created_at", { ascending: false });
}

// PUBLIC_INTERFACE
export async function updateLeaveStatus(id, status) {
  /** Admin usage: update status for a leave request. */
  return await supabase
    .from("leave_requests")
    .update({ status })
    .eq("id", id);
}

// PUBLIC_INTERFACE
export async function getLeaveBalance() {
  /**
   * Returns the current user's leave balance row.
   * When unauthenticated, returns a safe empty result: { data: null, error: null } to avoid runtime errors.
   */
  const { user } = await getCurrentUserSafe();
  if (!user) {
    return { data: null, error: null };
    }
  return await supabase
    .from("leave_balance")
    .select("*")
    .eq("user_id", user.id)
    .single();
}
