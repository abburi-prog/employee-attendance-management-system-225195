/**
 * Formats an ISO or Date into a readable local date-time string.
 * Returns '-' on invalid input.
 */
// PUBLIC_INTERFACE
export function formatLocalDateTime(value) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  } catch {
    return '-';
  }
}

/**
 * Returns current ISO timestamp.
 */
// PUBLIC_INTERFACE
export function nowIso() {
  return new Date().toISOString();
}
