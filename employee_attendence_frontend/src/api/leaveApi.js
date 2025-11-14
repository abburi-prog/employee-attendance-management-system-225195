import { supabase } from "../supabase";

export async function applyLeave(payload) {
  return await supabase.from("leave_requests").insert(payload);
}

export async function getMyLeaves() {
  const { data: { user } } = await supabase.auth.getUser();
  return await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
}

export async function getAllLeaves() {
  return await supabase
    .from("leave_requests")
    .select("*, user:auth.users(email)")
    .order("created_at", { ascending: false });
}

export async function updateLeaveStatus(id, status) {
  return await supabase
    .from("leave_requests")
    .update({ status })
    .eq("id", id);
}

export async function getLeaveBalance() {
  const { data: { user } } = await supabase.auth.getUser();
  return await supabase
    .from("leave_balance")
    .select("*")
    .eq("user_id", user.id)
    .single();
}
