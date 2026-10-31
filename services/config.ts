// Backend + feature switches. Set EXPO_PUBLIC_API_URL in .env (see .env.example).
// While it is empty the app runs in DEMO mode (fictional people placed around you).
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export const USE_BACKEND = !!API_URL;
// true  = show the real distance to the metre ("37 m") and compass direction ("NE 47°").
// false = round to the nearest 50 m (privacy-friendly).
export const EXACT_DISTANCE = true;
export const LOCATION_TASK = 'nearby-background-location';
export const STATE_KEY = 'nearby.state.v1';
export const SEEN_KEY = 'nearby.bg.seen.v1';
// Chat messages are temporary (the server enforces the same rules): gone after 3 hours, and only the newest 10 per chat are kept.
export const MSG_TTL_MS = 3 * 3600e3;
export const MSG_KEEP = 10;
