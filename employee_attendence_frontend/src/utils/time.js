 /**
  * Time formatting utilities used across the Attendance UI.
  * All functions respect the user's local timezone via built-in Intl APIs.
  */

 // PUBLIC_INTERFACE
 export function formatTimeHHmmss(value) {
   /** Format a Date or ISO string into 'HH:mm:ss'. Returns '-' on invalid input. */
   try {
     const d = value instanceof Date ? value : new Date(value);
     if (isNaN(d.getTime())) return '-';
     // Use 24-hour time with seconds and respect locale/timezone
     return new Intl.DateTimeFormat(undefined, {
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit',
       hour12: false,
     }).format(d);
   } catch {
     return '-';
   }
 }

 // PUBLIC_INTERFACE
 export function toISO(value = new Date()) {
   /** Returns an ISO string for a Date or now if not provided. */
   try {
     const d = value instanceof Date ? value : new Date(value);
     return d.toISOString();
   } catch {
     return new Date().toISOString();
   }
 }
