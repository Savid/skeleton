/** How long ago an ISO timestamp was, relative to `now` in milliseconds: "0.3 s", "12 s", "4 min". */
export function formatAge(iso: string, now: number): string {
  const seconds = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (seconds < 10) return `${seconds.toFixed(1)} s`;
  if (seconds < 120) return `${Math.round(seconds)} s`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}
