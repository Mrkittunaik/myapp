import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, USE_BACKEND } from './config';
import { getToken } from './api';

// One live WebSocket to the server. The server only sends a tiny hint ("sync" or "nearby") the moment something changes for this person;
// the app then fetches the real data over its normal calls. Auto-reconnects, and the old polling stays on as a slow safety net.
export type Hint = 'sync' | 'nearby';
const hints = new Set<(h: Hint) => void>(); const states = new Set<(on: boolean) => void>();
let ws: WebSocket | null = null; let live = false; let want = false; let tries = 0;
let retryT: any = null; let dogT: any = null; let unsub: (() => void)[] = [];

export const onHint = (fn: (h: Hint) => void) => { hints.add(fn); return () => { hints.delete(fn); }; };
export type PeerEvent = { t: 'typing' | 'read'; from: string; at: number };
const peerSubs = new Set<(e: PeerEvent) => void>();
export const onPeerEvent = (fn: (e: PeerEvent) => void) => { peerSubs.add(fn); return () => { peerSubs.delete(fn); }; };
// Tell the other person I am typing / have read the chat. Dropped silently when the live channel is down.
export const sendLive = (o: { t: 'typing' | 'read'; to: string }) => { if (ws && live && ws.readyState === 1) { try { ws.send(JSON.stringify(o)); } catch { /* closing */ } } };
export const isLive = () => live;
export const onLiveChange = (fn: (on: boolean) => void) => { states.add(fn); return () => { states.delete(fn); }; };
export function useLive() { const [on, setOn] = useState(live); useEffect(() => { setOn(live); states.add(setOn); return () => { states.delete(setOn); }; }, []); return on; }
const setLive = (v: boolean) => { if (live !== v) { live = v; states.forEach((f) => f(v)); } };
const fire = (h: Hint) => hints.forEach((f) => { try { f(h); } catch { /* one bad listener must not stop the rest */ } });

function drop(sock: WebSocket) { // forget this socket and try again soon
  if (ws === sock) { ws = null; setLive(false); }
  clearTimeout(dogT); try { sock.close(); } catch { /* already closed */ }
  schedule();
}
function schedule(now = false) {
  if (!want || retryT || ws) return;
  const wait = now ? 0 : Math.min(10000, 500 * 2 ** Math.min(tries++, 5)) + Math.random() * 400;
  retryT = setTimeout(() => { retryT = null; open(); }, wait);
}
async function open() {
  if (!want || ws || !USE_BACKEND || AppState.currentState !== 'active') return;
  const tk = await getToken(); if (!tk || !want || ws) return;
  let sock: WebSocket; try { sock = new WebSocket(API_URL.replace(/^http/, 'ws') + '/ws'); } catch { return schedule(); }
  ws = sock;
  const watch = () => { clearTimeout(dogT); dogT = setTimeout(() => drop(sock), 50000); }; // the server beats every 20 s
  sock.onopen = () => { watch(); sock.send(JSON.stringify({ t: 'auth', token: tk })); };
  sock.onmessage = (e) => {
    watch(); let m: any; try { m = JSON.parse(String(e.data)); } catch { return; }
    if (m.t === 'ready') { tries = 0; setLive(true); fire('sync'); fire('nearby'); } // catch up on anything missed while offline
    else if (m.t === 'sync' || m.t === 'nearby') fire(m.t);
    else if ((m.t === 'typing' || m.t === 'read') && typeof m.from === 'string') peerSubs.forEach((f) => f(m));
  };
  sock.onclose = (e: any) => { if (ws === sock) { ws = null; setLive(false); } clearTimeout(dogT); if (e?.code !== 4003) schedule(); };
  sock.onerror = () => {};
}
export function startRealtime() {
  if (!USE_BACKEND || want) return; want = true; tries = 0; open();
  const app = AppState.addEventListener('change', (s) => { if (s === 'active') schedule(true); else if (ws) { const x = ws; ws = null; setLive(false); clearTimeout(dogT); try { x.close(); } catch { /* ignore */ } } });
  const net = NetInfo.addEventListener((n) => { if (n.isConnected && !ws) schedule(true); });
  unsub = [() => app.remove(), net];
}
export function stopRealtime() {
  want = false; clearTimeout(retryT); retryT = null; clearTimeout(dogT); unsub.forEach((f) => f()); unsub = [];
  if (ws) { const x = ws; ws = null; try { x.close(); } catch { /* ignore */ } } setLive(false);
}
