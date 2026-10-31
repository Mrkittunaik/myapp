import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK, STATE_KEY, SEEN_KEY, USE_BACKEND } from './config';
import { api } from './api';
import { approxDistance, compassLabel } from './geo';
import { showLocal } from './notifications';

// Runs even when the app is closed or in the background (Android foreground service).
// IMPORTANT: defineTask must run at app start, so this file is imported from app/_layout.tsx.
// It only works in a development/production build, not in Expo Go.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error || !USE_BACKEND) return;
  const loc = (data?.locations || []).slice(-1)[0]; if (!loc) return;
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY); const st = raw ? JSON.parse(raw) : {};
    if (!st.loggedIn || !st.nearbyMode) return;
    await api.postLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy });
    const { people } = await api.nearby(st.radius || 500);
    // Alert only for people who just came into range (not seen in the last run).
    const prev: string[] = JSON.parse((await AsyncStorage.getItem(SEEN_KEY)) || '[]');
    const hidden: string[] = [...(st.blocked || []), ...((st.reports || []).map((r: any) => r.id))];
    const now = people.filter((p) => !hidden.includes(p.id));
    const fresh = now.filter((p) => !prev.includes(p.id));
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(now.map((p) => p.id)));
    if (st.notifPrefs?.nearby === false) return;
    for (const p of fresh.slice(0, 3)) {
      await showLocal({ kind: 'nearby', body: `${p.name} is ${approxDistance(p.distance)} away, ${compassLabel(p.bearing)}`, to: '/(tabs)/nearby', quiet: !!st.quietHours });
    }
  } catch { /* offline or backend down: try again on the next update */ }
});

export type BgResult = { ok: true } | { ok: false; reason: 'foreground-denied' | 'background-denied' | 'needs-dev-build' | 'failed' };

export async function startBackground(): Promise<BgResult> {
  try {
    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return { ok: false, reason: 'foreground-denied' };
    let bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== 'granted') bg = await Location.requestBackgroundPermissionsAsync(); // Android: choose "Allow all the time"
    if (bg.status !== 'granted') return { ok: false, reason: 'background-denied' };
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) return { ok: true };
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 15000, pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: 'Nearby is running', notificationBody: 'Finding people around you. Turn off in Settings.', notificationColor: '#6C4DF6' },
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: /task|expo go|not available|unavailable|native/i.test(String(e?.message)) ? 'needs-dev-build' : 'failed' };
  }
}
export async function stopBackground() {
  try { if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK); } catch {}
}
export const isBackgroundRunning = () => Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
