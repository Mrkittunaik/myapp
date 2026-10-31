import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { LL } from './geo';
import { useApp } from './store';

export type LocStatus = 'loading' | 'undetermined' | 'granted' | 'denied' | 'disabled';
type Ctx = {
  status: LocStatus; canAskAgain: boolean; coords: LL | null; accuracy: number | null; heading: number | null; updatedAt: number | null;
  request: () => Promise<LocStatus>; refresh: () => Promise<void>; openSettings: () => void; setHeadingActive: (on: boolean) => void;
};
const C = createContext<Ctx>(null as any);
export const useLocation = (_legacyEnabled?: boolean) => useContext(C);

// One shared location source for the whole app (permission, GPS fix, compass).
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const [status, setStatus] = useState<LocStatus>('loading');
  const [canAskAgain, setCanAsk] = useState(true);
  const [coords, setCoords] = useState<LL | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null); // metres, as reported by the GPS
  const [heading, setHeading] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [headingOn, setHeadingOn] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const fix = useCallback(async () => {
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (!alive.current) return;
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setAccuracy(p.coords.accuracy ?? null); setUpdatedAt(Date.now());
    } catch {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last && alive.current) { setCoords({ lat: last.coords.latitude, lng: last.coords.longitude }); setUpdatedAt(Date.now()); }
    }
  }, []);

  // Reads the current state. Never shows a system dialog.
  const refresh = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      setCanAsk(perm.canAskAgain);
      if (perm.status === 'undetermined') return setStatus('undetermined');
      if (perm.status !== 'granted') return setStatus('denied');
      if (!(await Location.hasServicesEnabledAsync())) return setStatus('disabled');
      setStatus('granted'); await fix();
    } catch { setStatus('disabled'); }
  }, [fix]);

  // Shows the system permission dialog (and, on Android, the "turn on location" dialog).
  const request = useCallback(async (): Promise<LocStatus> => {
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted' && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
      setCanAsk(perm.canAskAgain);
      if (perm.status !== 'granted') { setStatus('denied'); return 'denied'; }
      let on = await Location.hasServicesEnabledAsync();
      if (!on && Platform.OS === 'android') { await Location.enableNetworkProviderAsync().catch(() => {}); on = await Location.hasServicesEnabledAsync(); }
      if (!on) { setStatus('disabled'); return 'disabled'; }
      setStatus('granted'); await fix(); return 'granted';
    } catch { setStatus('disabled'); return 'disabled'; }
  }, [fix]);

  useEffect(() => { refresh(); }, [refresh]);
  // Coming back from system Settings: pick up whatever the person changed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  // Live position while the person is logged in and discoverable.
  useEffect(() => {
    if (status !== 'granted' || !app.loggedIn || !app.nearbyMode) return;
    let sub: Location.LocationSubscription | undefined; let gone = false;
    // High accuracy, update every ~2 m or 3 s so distances to nearby people stay exact.
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 3000 }, (p) => {
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setAccuracy(p.coords.accuracy ?? null); setUpdatedAt(Date.now());
    }).then((x) => { if (gone) x.remove(); else sub = x; }).catch(() => {});
    return () => { gone = true; sub?.remove(); };
  }, [status, app.loggedIn, app.nearbyMode]);

  // Compass runs only while the radar screen asks for it (saves battery).
  useEffect(() => {
    if (!headingOn) { setHeading(null); return; } // forget the last bearing when the radar closes
    if (status !== 'granted') return;
    let sub: Location.LocationSubscription | undefined; let gone = false;
    Location.watchHeadingAsync((h) => {
      const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      setHeading(h.accuracy === 0 ? null : v); // accuracy 0 = uncalibrated -> treat as unavailable
    }).then((x) => { if (gone) x.remove(); else sub = x; }).catch(() => setHeading(null));
    return () => { gone = true; sub?.remove(); };
  }, [status, headingOn]);

  const value: Ctx = { status, canAskAgain, coords, accuracy, heading, updatedAt, request, refresh, openSettings: () => Linking.openSettings(), setHeadingActive: setHeadingOn };
  return <C.Provider value={value}>{children}</C.Provider>;
}

// Convenience: ask if the system will still show a dialog, otherwise send the person to Settings.
export function useAllowLocation() {
  const loc = useLocation();
  return async () => {
    if (loc.status === 'denied' && !loc.canAskAgain) return loc.openSettings();
    if (loc.status === 'disabled' && Platform.OS === 'ios') return loc.openSettings();
    return loc.request();
  };
}
