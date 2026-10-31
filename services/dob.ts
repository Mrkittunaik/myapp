// Date-of-birth helpers (YYYY-MM-DD). Age is exact (birthday-aware), not just a year difference.
export const formatDob = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return d.length > 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
};
export function ageFrom(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  const now = new Date(); let age = now.getFullYear() - y;
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d)) age--;
  return age;
}
export function dobError(dob: string): string | undefined {
  if (!dob) return undefined;
  if (dob.length < 10) return 'Use format DD-MM-YYYY';
  const a = ageFrom(dob);
  if (a === null) return 'Enter a real date';
  if (a < 0 || a > 100) return 'Enter a real date';
  if (a < 18) return 'You must be 18 or older';
  return undefined;
}
export const dobValid = (dob: string) => dob.length === 10 && !dobError(dob);

// Typing format is DD-MM-YYYY (how people in India write it). Storage stays YYYY-MM-DD.
export const formatDobInput = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
};
export const isoToDisplay = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : iso);
// Complete input becomes the stored ISO date; partial input is kept as typed (and counts as invalid).
export const displayToStored = (disp: string) => (/^\d{2}-\d{2}-\d{4}$/.test(disp) ? `${disp.slice(6)}-${disp.slice(3, 5)}-${disp.slice(0, 2)}` : disp);
