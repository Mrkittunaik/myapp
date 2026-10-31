import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useApp } from './store';
import { useLocation } from './location';
import { DEMO_USERS, DEMO_OFFSETS } from './demoData';
import { destination, distanceM, bearingDeg, LL } from './geo';
import { api, ApiNearby, ApiError } from './api';
import { USE_BACKEND } from './config';
import { startBackground, stopBackground } from './background';
import { registerForPush } from './notifications';
import { rememberPeople } from './people';
import { onHint, isLive } from './realtime';
import { Nearby } from '@/types';

type Live = 'off' | 'connecting' | 'ok' | 'error';
type Ctx = { remote: ApiNearby[]; live: Live; sync: () => Promise<void>; pull: () => Promise<void> };
const C = createContext<Ctx>({ remote: [], live: 'off', sync: async () => {}, pull: async () => {} });
const DEMO_FALLBACK: LL = { lat: 20.0, lng: 78.0 };

// Real mode (EXPO_PUBLIC_API_URL set): sends my position to the backend and pulls the people near me,
// each with an exact distance (m) and bearing computed on the server. Also runs the background service.
export function NearbyProvider({ children }: { children: React.ReactNode }) {
  const app = useApp(); const loc = useLocation();
  const [remote, setRemote] = useState<ApiNearby[]>([]); const [live, setLive] = useState<Live>(USE_BACKEND ? 'connecting' : 'off');
  const ref = useRef({ coords: loc.coords, acc: loc.accuracy, radius: app.radius, on: false });
  ref.current = { coords: loc.coords, acc: loc.accuracy, radius: app.radius, on: USE_BACKEND && app.ready && app.loggedIn && app.emailVerified && app.face.status === 'verified' && app.nearbyMode && loc.status === 'granted' };
  const busy = useRef(false); const again = useRef(false);

  // pull = only read the list (what a live hint from the server triggers; it must never post my position, or two phones would hint each other forever).
  // sync = post my position, then pull. A request that arrives while one is running is not lost: it runs again right after.
  const run = useCallback(async (post: boolean) => {
    const c = ref.current; if (!c.on || (post && !c.coords)) return;
    if (busy.current) { again.current = true; return; }
    busy.current = true;
    try {
      if (post && c.coords) await api.postLocation({ lat: c.coords.lat, lng: c.coords.lng, accuracy: c.acc });
      const r = await api.nearby(ref.current.radius);
      rememberPeople(r.people); setRemote(r.people); setLive('ok');
    } catch (e) { setLive('error'); if (e instanceof ApiError && e.code === 'face_required') app.update((x) => ({ face: { ...x.face, status: 'none' } })); } finally { busy.current = false; }
    if (again.current) { again.current = false; run(false); }
  }, []);
  const sync = useCallback(() => run(true), [run]);
  const pull = useCallback(() => run(false), [run]);
  // Live: someone near me moved, appeared, left or changed their profile.
  useEffect(() => onHint((h) => { if (h === 'nearby') pull(); }), [pull]);

  // Foreground: push my position as it changes (every ~3 s at most) and refresh the list every 5 s.
  const lastPush = useRef(0);
  useEffect(() => { if (Date.now() - lastPush.current > 3000) { lastPush.current = Date.now(); sync(); } }, [loc.coords?.lat, loc.coords?.lng, sync]);
  useEffect(() => {
    if (!USE_BACKEND) return;
    // Heartbeat + safety net: every 5 s on its own, every 10 s while the live channel is up (it also lets people who went quiet drop off).
    let n = 0; const t = setInterval(() => { if (AppState.currentState !== 'active') return; if (isLive() && ++n % 2) return; sync(); }, 5000);
    return () => clearInterval(t);
  }, [sync]);
  useEffect(() => { sync(); }, [app.radius, app.nearbyMode, app.loggedIn, loc.status, sync]);
  // Going hidden removes me from other people's results.
  useEffect(() => { if (USE_BACKEND && app.ready && app.loggedIn && !app.nearbyMode) { api.setVisible(false).catch(() => {}); setRemote([]); } }, [app.nearbyMode, app.ready, app.loggedIn]);
  useEffect(() => { if (USE_BACKEND && app.ready && app.loggedIn && app.nearbyMode) api.setVisible(true).catch(() => {}); }, [app.nearbyMode, app.ready, app.loggedIn]);
  // Phone push token (needs a development build).
  useEffect(() => { if (USE_BACKEND && app.ready && app.loggedIn && app.emailVerified) registerForPush().catch(() => {}); }, [app.ready, app.loggedIn]);
  // Background service: keeps sending location and alerts you when someone comes in range, even when the app is closed.
  useEffect(() => {
    if (!app.ready) return;
    if (USE_BACKEND && app.loggedIn && app.nearbyMode && app.background) startBackground().then((r) => { if (!r.ok) app.set({ background: false }); });
    else stopBackground();
  }, [app.ready, app.loggedIn, app.nearbyMode, app.background]);

  return <C.Provider value={{ remote, live, sync, pull }}>{children}</C.Provider>;
}

export function useNearby() {
  const app = useApp(); const loc = useLocation(); const ctx = useContext(C);
  const origin = loc.coords || DEMO_FALLBACK;
  const all: Nearby[] = useMemo(() => {
    if (!app.nearbyMode || loc.status === 'loading') return [];
    const want = app.me.interestedIn === 'Women' ? 'Woman' : app.me.interestedIn === 'Men' ? 'Man' : null;
    const rel = (b: number) => (b - (loc.heading ?? 0) + 360) % 360;
    if (USE_BACKEND) {
      return ctx.remote.filter((p) => !app.hiddenIds.includes(p.id) && (!want || p.gender === want)).map((p) => {
        const { distance, bearing, accuracy, updatedAt, ...user } = p; return { user, distance, bearing, rel: rel(bearing) };
      });
    }
    // Demo mode: people are placed around the user's real GPS fix (or a neutral fallback).
    return DEMO_USERS.filter((u) => !app.hiddenIds.includes(u.id) && (!want || u.gender === want)).map((user) => {
      const [d, b] = DEMO_OFFSETS[user.id];
      const pos = destination(origin, d, b);
      const distance = distanceM(origin, pos), bearing = bearingDeg(origin, pos);
      return { user, distance, bearing, rel: rel(bearing) };
    });
  }, [origin.lat, origin.lng, loc.heading, loc.status, app.hiddenIds, app.nearbyMode, app.me.interestedIn, ctx.remote]);
  const eligible = all.filter((n) => n.distance <= app.radius && (!app.intentFilter || n.user.intentions.includes(app.intentFilter))).sort((a, b) => a.distance - b.distance);
  const refresh = async () => { await loc.refresh(); await ctx.sync(); };
  return { ...loc, refresh, all, eligible, live: ctx.live, demoPlacement: !USE_BACKEND, backend: USE_BACKEND };
}

// Light hook for screens that only need "refresh my position and the list" (no list maths).
export function useDiscoveryRefresh() { const loc = useLocation(); const ctx = useContext(C); return useCallback(async () => { await loc.refresh(); await ctx.sync(); }, [loc.refresh, ctx.sync]); }
