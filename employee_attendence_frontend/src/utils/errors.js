/**
 * Extracts a safe error message from unknown errors.
 */
// PUBLIC_INTERFACE
export function getErrorMessage(err, fallback = 'Unexpected error') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}
