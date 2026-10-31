export function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);
export const hm = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// Day heading: Today / Yesterday / weekday (this week) / date.
export function dayLabel(t: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(t)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(t).toLocaleDateString([], { weekday: 'long' });
  return new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short', year: new Date(t).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
// Short stamp for list rows: time today, otherwise the day.
export const stamp = (t: number) => (sameDay(t, Date.now()) ? hm(t) : dayLabel(t));
