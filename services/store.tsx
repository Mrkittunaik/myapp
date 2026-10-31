import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyProfile, ReqState, Message, Notif, NotifKind, Report, FaceState } from '@/types';
import { DEMO_INCOMING, DEMO_CONNECTED, DEMO_MESSAGES } from './demoData';
import { setUnits } from './geo';
import { showLocal } from './notifications';
import { STATE_KEY as KEY, USE_BACKEND } from './config';
import { setToken, setUnauthorizedHandler, ServerMe } from './api';
import { clearPeople } from './people';
const emptyMe: MyProfile = { name: '', dob: '', language: 'English', gender: '', interestedIn: 'Everyone', bio: '', photo: '', photos: [], interests: [], intentions: ['new_friends'], languages: ['English'], socials: [], visibility: 'everyone' };
const now = Date.now();
// Sample notifications and people exist ONLY in demo mode (no EXPO_PUBLIC_API_URL). With a backend everything starts empty and fills from the server.
const seedNotifs: Notif[] = USE_BACKEND ? [] : [
  { id: 'n1', kind: 'requests', icon: 'person-add', t: 'Meera wants to connect', at: now - 10 * 60e3, read: false, to: '/(tabs)/connections' },
  { id: 'n2', kind: 'nearby', icon: 'navigate', t: 'Aisha is nearby and shares 2 interests', at: now - 60 * 60e3, read: false, to: '/(tabs)/nearby' },
  { id: 'n3', kind: 'requests', icon: 'checkmark-circle', t: 'Rohan accepted your request', at: now - 2 * 3600e3, read: false, to: '/(tabs)/messages' },
  { id: 'n4', kind: 'system', icon: 'shield-checkmark', t: 'Welcome to Nearby', at: now - 26 * 3600e3, read: true, to: '/settings' },
];
const mkNotif = (kind: NotifKind, icon: string, t: string, to: string): Notif => ({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6), kind, icon, t, at: Date.now(), read: false, to });
export type BlockedInfo = Record<string, { name: string; photo: string }>;
type S = {
  ready: boolean; onboarded: boolean; loggedIn: boolean; emailVerified: boolean; email: string; pendingEmail: string | null; userId: string; setupDone: boolean; locationAsked: boolean; notifAsked: boolean; me: MyProfile; nearbyMode: boolean; radius: number; units: 'km' | 'mi';
  face: FaceState; msgRev: number; notifSeq: number; blockedInfo: BlockedInfo;
  intentFilter: string | null; requests: Record<string, ReqState>; blocked: string[]; messages: Record<string, Message[]>; muted: string[]; waved: string[];
  notifs: Notif[]; readChats: Record<string, number>; notifPrefs: Record<string, boolean>; quietHours: boolean;
  reports: Report[]; alerted: string[]; background: boolean; ageRange: [number, number] | null;
};
const init: S = {
  ready: false, onboarded: false, loggedIn: false, emailVerified: true, email: '', pendingEmail: null, userId: '', setupDone: false, locationAsked: false, notifAsked: false, me: emptyMe, nearbyMode: true, radius: 500, units: 'km', intentFilter: null,
  face: { status: 'none', gender: null, age: null }, msgRev: 0, notifSeq: 0, blockedInfo: {},
  requests: USE_BACKEND ? {} : { ...Object.fromEntries(DEMO_INCOMING.map((i) => [i, 'incoming'])), ...Object.fromEntries(DEMO_CONNECTED.map((i) => [i, 'connected'])) } as any,
  blocked: [], messages: USE_BACKEND ? {} : DEMO_MESSAGES, muted: [], waved: [], notifs: seedNotifs, readChats: {}, notifPrefs: { nearby: true, requests: true, messages: true }, quietHours: false, reports: [], alerted: USE_BACKEND ? [] : ['u1'], background: false, ageRange: null,
};
type Ctx = S & {
  set: (p: Partial<S>) => void; update: (fn: (s: S) => Partial<S>) => void; setMe: (p: Partial<MyProfile>) => void;
  notify: (kind: NotifKind, icon: string, t: string, to: string, opts?: { push?: boolean }) => void; hiddenIds: string[]; demoAccept: (id: string, name: string) => void;
  applyMe: (m: ServerMe, opts?: { profile?: boolean }) => void; signOut: () => void;
  toast: (m: string, kind?: 'ok' | 'err') => void; toastMsg: { m: string; kind: string } | null; reset: () => void;
};
const C = createContext<Ctx>(null as any);
export const useApp = () => useContext(C);
const toMyProfile = (m: ServerMe, old: MyProfile): MyProfile => ({ ...old, name: m.name, dob: m.dob, gender: m.gender, bio: m.bio, photo: m.photo, photos: m.photos, interests: m.interests, intentions: m.intentions.length ? m.intentions : old.intentions, languages: m.languages.length ? m.languages : old.languages, language: (m.languages[0] || old.language), socials: m.socials, visibility: m.visibility, interestedIn: m.interestedIn });
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<S>(init);
  const [toastMsg, setToast] = useState<{ m: string; kind: string } | null>(null);
  const timer = useRef<any>(null);
  const sRef = useRef(s); sRef.current = s;
  setUnits(s.units);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      const saved = v ? JSON.parse(v) : {};
      setS({ ...init, ...saved, reports: saved.reports || [], alerted: saved.alerted || [], blockedInfo: saved.blockedInfo || {}, face: saved.face || init.face, me: { ...emptyMe, ...(saved.me || {}) }, ready: true });
    }).catch(() => setS({ ...init, ready: true }));
  }, []);
  useEffect(() => { if (!s.ready) return; const t = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, 400); return () => clearTimeout(t); }, [s]);
  const set = useCallback((p: Partial<S>) => setS((x) => ({ ...x, ...p })), []);
  const update = useCallback((fn: (s: S) => Partial<S>) => setS((x) => ({ ...x, ...fn(x) })), []);
  const setMe = useCallback((p: Partial<MyProfile>) => setS((x) => ({ ...x, me: { ...x.me, ...p } })), []);
  const notify = useCallback((kind: NotifKind, icon: string, t: string, to: string, opts?: { push?: boolean }) => {
    const cur = sRef.current;
    if (kind !== 'system' && cur.notifPrefs[kind] === false) return;
    setS((x) => ({ ...x, notifs: [mkNotif(kind, icon, t, to), ...x.notifs].slice(0, 50) }));
    if (opts?.push !== false) showLocal({ kind, body: t, to, quiet: cur.quietHours });
  }, []);
  // Demo mode only: a fictional person accepts your request a few seconds later.
  const demoAccept = useCallback((id: string, name: string) => {
    if (USE_BACKEND || sRef.current.requests[id] !== 'sent') return;
    setS((x) => ({ ...x, requests: { ...x.requests, [id]: 'connected' } }));
    notify('requests', 'checkmark-circle', `${name} accepted your request`, '/(tabs)/messages');
  }, [notify]);
  // Copies the server's version of the account into the app. `profile` also replaces the profile fields (login, signup, reinstall).
  const applyMe = useCallback((m: ServerMe, opts?: { profile?: boolean }) => setS((x) => ({
    ...x, userId: m.id, email: m.email, emailVerified: m.emailVerified, pendingEmail: m.pendingEmail,
    face: { status: m.face.status === 'verified' ? 'verified' : m.face.status === 'rejected' ? 'rejected' : 'none', gender: m.face.gender, age: m.face.age },
    me: opts?.profile ? toMyProfile(m, x.me) : { ...x.me, gender: m.gender || x.me.gender },
    setupDone: opts?.profile ? !!(m.name && m.dob) : x.setupDone,
  })), []);
  const toast = useCallback((m: string, kind: 'ok' | 'err' = 'ok') => { setToast({ m, kind }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2600); }, []);
  // Wipes this person's data from the phone (log out, deleted account, expired session). The next login starts clean.
  const wipe = useCallback((keepAsked = true) => { setToken(null); clearPeople(); setS((x) => ({ ...init, ready: true, onboarded: true, units: x.units, locationAsked: keepAsked && x.locationAsked, notifAsked: keepAsked && x.notifAsked })); }, []);
  const signOut = useCallback(() => wipe(true), [wipe]);
  const reset = useCallback(() => wipe(false), [wipe]);
  useEffect(() => { setUnauthorizedHandler(() => { if (sRef.current.loggedIn) { wipe(true); setTimeout(() => toast('Please log in again.', 'err'), 300); } }); return () => setUnauthorizedHandler(null); }, [wipe, toast]);
  // People you blocked or reported disappear from discovery, search and lists.
  const hiddenIds = React.useMemo(() => [...s.blocked, ...s.reports.map((x) => x.id)], [s.blocked, s.reports]);
  return <C.Provider value={{ ...s, set, update, setMe, notify, hiddenIds, demoAccept, applyMe, signOut, toast, toastMsg, reset }}>{children}</C.Provider>;
}
