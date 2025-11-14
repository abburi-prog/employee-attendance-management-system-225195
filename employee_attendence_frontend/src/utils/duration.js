 // PUBLIC_INTERFACE
 export function formatDurationHMS(totalSeconds) {
   /** Humanize a duration in seconds to "X hour(s) Y min(s) Z sec(s)". Omits zero units gracefully. */
   const secsNum = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
   const hours = Math.floor(secsNum / 3600);
   const minutes = Math.floor((secsNum % 3600) / 60);
   const seconds = secsNum % 60;

   const parts = [];
   if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
   if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
   if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? 'sec' : 'secs'}`);

   return parts.join(' ');
 }

 // PUBLIC_INTERFACE
 export function diffSecondsBetweenIso(startIso, endIso) {
   /** Returns non-negative integer seconds between two ISO timestamps. If either invalid, returns 0. */
   try {
     const start = new Date(startIso);
     const end = new Date(endIso);
     if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
     const diffMs = end.getTime() - start.getTime();
     return Math.max(0, Math.floor(diffMs / 1000));
   } catch {
     return 0;
   }
 }
