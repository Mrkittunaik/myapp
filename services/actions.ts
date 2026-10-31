import { useApp } from './store';
import { findPerson } from './people';
import { USE_BACKEND } from './config';
import { api, ApiError } from './api';
import { ReqState } from '@/types';
const nameOf = (id: string) => findPerson(id)?.name || 'Someone';
export function useActions() {
  const a = useApp();
  const setReq = (id: string, v: ReqState) => a.update((s) => ({ requests: { ...s.requests, [id]: v } }));
  // The "X wants to connect" notification is stale once you answer the request.
  const clearInvite = (id: string) => a.update((s) => ({ notifs: s.notifs.filter((n) => n.t !== `${nameOf(id)} wants to connect`) }));
  const fail = (e: unknown) => a.toast(e instanceof ApiError ? e.message : 'Something went wrong. Try again.', 'err');
  // Backend mode: change the screen right away, ask the server, and undo if the server says no.
  const remote = async (id: string, next: ReqState, call: () => Promise<{ state: string } | unknown>, ok: string, after?: () => void) => {
    const prev = a.requests[id] || 'none'; setReq(id, next);
    try { const r: any = await call(); if (r && typeof r.state === 'string') setReq(id, r.state === 'pending' ? 'sent' : r.state); a.toast(ok); after?.(); }
    catch (e) { setReq(id, prev); fail(e); }
  };
  const blockedInfo = (id: string) => { const p = findPerson(id); return { name: p?.name || 'Someone', photo: p?.photo || '' }; };
  return {
    state: (id: string) => a.requests[id] || 'none',
    send: (id: string) => {
      if ((a.requests[id] || 'none') !== 'none') return a.toast('Request already sent');
      if (USE_BACKEND) return remote(id, 'sent', () => api.connect(id, 'request'), 'Connection request sent');
      setReq(id, 'sent'); a.toast('Connection request sent');
      a.notify('requests', 'person-add', `You sent a request to ${nameOf(id)}`, '/(tabs)/connections', { push: false });
      setTimeout(() => a.demoAccept(id, nameOf(id)), 8000);
    },
    cancel: (id: string) => (USE_BACKEND ? remote(id, 'none', () => api.connect(id, 'cancel'), 'Request cancelled') : (setReq(id, 'none'), a.toast('Request cancelled'))),
    accept: (id: string) => {
      if (USE_BACKEND) return remote(id, 'connected', () => api.connect(id, 'accept'), 'Connected', () => clearInvite(id));
      setReq(id, 'connected'); clearInvite(id); a.toast('Connected'); a.notify('requests', 'people', `You and ${nameOf(id)} are now connected`, '/(tabs)/messages', { push: false });
    },
    decline: (id: string) => (USE_BACKEND ? remote(id, 'none', () => api.connect(id, 'decline'), 'Request declined', () => clearInvite(id)) : (setReq(id, 'none'), clearInvite(id), a.toast('Request declined'))),
    remove: (id: string) => (USE_BACKEND ? remote(id, 'none', () => api.connect(id, 'remove'), 'Connection removed') : (setReq(id, 'none'), a.toast('Connection removed'))),
    block: async (id: string) => {
      const info = blockedInfo(id); const prev = a.requests[id] || 'none';
      a.update((s) => ({ blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id], blockedInfo: { ...s.blockedInfo, [id]: info }, requests: { ...s.requests, [id]: 'none' } }));
      if (USE_BACKEND) { try { await api.block(id); } catch (e) { a.update((s) => ({ blocked: s.blocked.filter((b) => b !== id), requests: { ...s.requests, [id]: prev } })); return fail(e); } }
      a.toast('User blocked');
    },
    unblock: async (id: string) => {
      if (USE_BACKEND) { try { await api.unblock(id); } catch (e) { return fail(e); } }
      a.update((s) => ({ blocked: s.blocked.filter((b) => b !== id) })); a.toast('User unblocked');
    },
    wave: async (id: string) => {
      if (a.waved.includes(id)) return a.toast('You already said hi');
      if (USE_BACKEND) { try { await api.wave(id); } catch (e) { return fail(e); } }
      a.update((s) => (s.waved.includes(id) ? {} : { waved: [...s.waved, id] })); a.toast(`You said hi to ${nameOf(id)}`);
    },
    report: async (id: string, reason: string) => {
      if (USE_BACKEND) { try { await api.report(id, reason); } catch (e) { return fail(e); } }
      a.update((s) => ({ reports: [...s.reports, { id, reason, at: Date.now() }], requests: { ...s.requests, [id]: 'none' } })); a.toast('Report sent. They are hidden from you.');
    },
  };
}
