import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useApp } from './store';
import { api, ApiError, SyncMsg } from './api';
import { USE_BACKEND } from './config';
import { rememberPeople } from './people';
import { showLocal } from './notifications';
import { startRealtime, stopRealtime, onHint, onLiveChange, isLive } from './realtime';
import { trimMessages, noteServerTime } from './retention';
import { Message, Notif, ReqState } from '@/types';

// Keeps connection state, messages, notifications, blocked list and my own account state live.
// The server pings the open WebSocket the moment anything changes, and we fetch at once. Polling stays on as a slow safety net
// (30 s while live; 5 s, or 2 s inside a chat, when the live channel is down). `full` = hard refresh: rebuild all chats from the server.
// Nothing here runs in demo mode.
type SyncOpts = { full?: boolean };
const C = createContext<{ sync: (o?: SyncOpts) => Promise<void>; fast: (on: boolean) => void }>({ sync: async () => {}, fast: () => {} });
export const useSync = () => useContext(C);
const toMsg = (m: SyncMsg): Message => ({ id: m.id, mine: m.mine, text: m.text, image: m.image || undefined, at: m.at });

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const app = useApp(); const ref = useRef(app); ref.current = app;
  const inflight = useRef<Promise<void> | null>(null); const again = useRef<false | 'part' | 'full'>(false); const first = useRef(true); const fastOn = useRef(false); const timer = useRef<any>(null);

  const pass = useCallback(async (full: boolean) => {
    try {
      let more = true; let guard = 0;
      while (more && guard++ < 10) {
        const cur = ref.current;
        const firstPage = guard === 1; const r = await api.sync(full && firstPage ? 0 : cur.msgRev, cur.notifSeq); more = r.more; noteServerTime(r.serverTime);
        rememberPeople(r.relations.map((x) => x.profile));
        const fresh: Notif[] = r.notifications.map((n) => ({ id: 's' + n.seq, kind: n.kind, icon: n.icon, t: n.t, at: n.at, read: false, to: n.to }));
        app.update((st) => {
          const requests: Record<string, ReqState> = {}; r.relations.forEach((x) => { requests[x.id] = x.state; });
          const messages: Record<string, Message[]> = {};
          if (full && firstPage) { for (const [p, l] of Object.entries(st.messages)) messages[p] = l.filter((x) => x.pending || x.failed); } else Object.assign(messages, st.messages);
          for (const m of r.messages) {
            const list = (messages[m.peer] || []).filter((x) => x.id !== m.id);
            messages[m.peer] = m.deleted ? list : [...list, toMsg(m)].sort((a, b) => a.at - b.at);
          }
          for (const [peer, t] of Object.entries(r.cleared)) if (messages[peer]) messages[peer] = messages[peer].filter((x) => x.at > t);
          const have = new Set(st.notifs.map((n) => n.id));
          return {
            requests, messages: trimMessages(messages), msgRev: r.msgRev, notifSeq: r.notifSeq, reports: r.reports,
            blocked: r.blocked.map((b) => b.id), blockedInfo: Object.fromEntries(r.blocked.map((b) => [b.id, { name: b.name, photo: b.photo }])),
            notifs: [...fresh.filter((n) => !have.has(n.id)), ...st.notifs].slice(0, 50),
          };
        });
        app.applyMe(r.me);
        // Phone banner for things the server could not push (no token, app open). Not on the very first sync after login, and not for old items.
        if (!first.current) for (const n of r.notifications) {
          if (n.pushed) continue;
          if (n.kind === 'messages' && cur.muted.some((id) => n.to === `/chat/${id}`)) continue;
          if (cur.notifPrefs[n.kind] === false) continue;
          showLocal({ kind: n.kind, body: n.t, to: n.to, quiet: cur.quietHours });
        }
        first.current = false;
      }
    } catch (e) { /* offline or server down: try again on the next tick */ if (e instanceof ApiError && e.status === 403 && e.code === 'face_required') app.update((st) => ({ face: { ...st.face, status: 'none' } })); }
  }, [app.update, app.applyMe]);

  // One run at a time. A hint that arrives mid-run is not lost: it schedules another run right after.
  const sync = useCallback((o?: SyncOpts): Promise<void> => {
    const s = ref.current; if (!USE_BACKEND || !s.ready || !s.loggedIn) return Promise.resolve();
    if (inflight.current) { again.current = o?.full ? 'full' : again.current || 'part'; return inflight.current; }
    inflight.current = (async () => {
      let full = !!o?.full;
      try { let next: false | 'part' | 'full'; do { again.current = false; await pass(full); next = again.current as false | 'part' | 'full'; full = next === 'full'; } while (next); }
      finally { inflight.current = null; }
    })();
    return inflight.current;
  }, [pass]);

  const loop = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(async () => { if (AppState.currentState === 'active') await sync(); loop(); }, isLive() ? 30000 : fastOn.current ? 2000 : 5000); }, [sync]);
  useEffect(() => { if (!USE_BACKEND || !app.ready || !app.loggedIn) { first.current = true; return; } sync(); loop(); return () => clearTimeout(timer.current); }, [app.ready, app.loggedIn, sync, loop]);
  useEffect(() => { const sub = AppState.addEventListener('change', (s) => { if (s === 'active') { sync(); sweep(); } }); return () => sub.remove(); }, [sync]);
  // Live channel: connect while logged in; every hint from the server triggers an immediate fetch.
  useEffect(() => { if (!USE_BACKEND || !app.ready || !app.loggedIn) return; startRealtime(); const off = onHint((h) => { if (h === 'sync') sync(); });
    const offLive = onLiveChange((on) => { if (!on) sync(); loop(); }); // channel dropped: fetch now and go back to quick polling
    return () => { off(); offLive(); stopRealtime(); }; }, [app.ready, app.loggedIn, sync, loop]);
  // Messages disappear 3 hours after they were sent (and beyond the newest 10): remove them on screen without waiting for the server.
  const sweep = useCallback(() => { const m = trimMessages(ref.current.messages); if (m !== ref.current.messages) app.set({ messages: m }); }, [app.set]);
  useEffect(() => { if (!USE_BACKEND || !app.ready || !app.loggedIn) return; sweep(); const t = setInterval(sweep, 20000); return () => clearInterval(t); }, [app.ready, app.loggedIn, sweep]);
  // My discovery and notification settings live on the server too (so alerts respect them when the app is closed).
  useEffect(() => {
    if (!USE_BACKEND || !app.ready || !app.loggedIn || !app.setupDone) return;
    const t = setTimeout(() => { api.putMe({ visibility: app.me.visibility, interestedIn: app.me.interestedIn, prefs: { ...app.notifPrefs, quietHours: app.quietHours, tz: new Date().getTimezoneOffset() } }).catch(() => {}); }, 900);
    return () => clearTimeout(t);
  }, [app.me.visibility, app.me.interestedIn, app.notifPrefs, app.quietHours, app.setupDone, app.ready, app.loggedIn]);

  return <C.Provider value={{ sync, fast: (on) => { fastOn.current = on; } }}>{children}</C.Provider>;
}
