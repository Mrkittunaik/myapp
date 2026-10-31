import { EXACT_DISTANCE } from './config';
const R = 6371000, rad = (d: number) => (d * Math.PI) / 180, deg = (r: number) => (r * 180) / Math.PI;
export type LL = { lat: number; lng: number };
export function distanceM(a: LL, b: LL) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function bearingDeg(a: LL, b: LL) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export function destination(a: LL, distM: number, brg: number): LL {
  const d = distM / R, b = rad(brg), p1 = rad(a.lat), l1 = rad(a.lng);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { lat: deg(p2), lng: deg(l2) };
}
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
// Direction as a compass point plus exact bearing, e.g. "NE 47°".
export const compassLabel = (b: number) => `${DIRS[Math.round(b / 45) % 8]} ${Math.round(b) % 360}°`;
let UNITS: 'km' | 'mi' = 'km';
export const setUnits = (u: 'km' | 'mi') => { UNITS = u; };
const ft = (m: number, step: number) => Math.round((m * 3.281) / step) * step;
// Exact to the metre when EXACT_DISTANCE is on (services/config.ts), otherwise rounded to 50 m.
export function approxDistance(m: number) {
  if (!EXACT_DISTANCE) {
    if (UNITS === 'mi') return m < 50 ? 'under 160 ft' : m < 800 ? `~${ft(m, 50)} ft` : `~${(m / 1609.34).toFixed(1)} mi`;
    if (m < 50) return 'under 50 m';
    const r = Math.round(m / 50) * 50;
    return r < 1000 ? `~${r} m` : `~${(m / 1000).toFixed(1)} km`;
  }
  if (UNITS === 'mi') { const f = Math.max(1, Math.round(m * 3.28084)); return f < 1000 ? `${f} ft` : `${(m / 1609.344).toFixed(2)} mi`; }
  const r = Math.max(1, Math.round(m));
  return r < 1000 ? `${r} m` : `${(m / 1000).toFixed(2)} km`;
}
export function radiusLabel(m: number) {
  if (UNITS === 'mi') return m < 800 ? `${ft(m, 10)} ft` : `${(m / 1609.34).toFixed(1)} mi`;
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}
