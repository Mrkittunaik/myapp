import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, USE_BACKEND } from './config';
import { FaceState, MyProfile, Profile, Report } from '@/types';

// One thin client for the whole backend (see backend/README.md). Every call throws ApiError on network or HTTP errors.
const TOKEN_KEY = 'nearby.token.v1';
let token: string | null = null;
export const getToken = async () => token || (token = await AsyncStorage.getItem(TOKEN_KEY));
export const setToken = async (t: string | null) => { token = t; if (t) await AsyncStorage.setItem(TOKEN_KEY, t); else await AsyncStorage.removeItem(TOKEN_KEY); };

export class ApiError extends Error { constructor(public status: number, msg: string, public code?: string) { super(msg); } }
// The store registers this so an expired or revoked session sends the person back to the login screen.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

async function req<T>(method: string, path: string, body?: any, o: { form?: FormData; timeoutMs?: number } = {}): Promise<T> {
  if (!USE_BACKEND) throw new ApiError(0, 'No backend configured');
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), o.timeoutMs ?? 12000);
  try {
    const tk = await getToken();
    const headers: Record<string, string> = { ...(tk ? { Authorization: `Bearer ${tk}` } : {}), ...(o.form || body === undefined ? {} : { 'Content-Type': 'application/json' }) };
    let res: Response;
    try { res = await fetch(API_URL + path, { method, signal: ctl.signal, headers, body: o.form ?? (body === undefined ? undefined : JSON.stringify(body)) }); }
    catch { throw new ApiError(0, 'Cannot reach the server. Check your internet connection.', 'network'); }
    const text = await res.text(); let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON error page */ }
    if (!res.ok) {
      if (tk && ((res.status === 401 && json.code === 'unauthorized') || json.code === 'banned')) onUnauthorized?.(); // expired, or suspended by the owner
      throw new ApiError(res.status, json.error || `Server error (${res.status})`, json.code);
    }
    return json as T;
  } finally { clearTimeout(t); }
}

export type ServerMe = {
  id: string; email: string; emailVerified: boolean; pendingEmail: string | null; name: string; dob: string; gender: string; bio: string; photo: string; photos: string[];
  interests: string[]; intentions: string[]; languages: string[]; socials: { key: string; handle: string; visible: boolean }[]; visibility: 'everyone' | 'connections' | 'nobody'; interestedIn: string;
  face: { status: FaceState['status'] | 'review'; gender: string | null; age: number | null };
};
export type Session = { token: string; me: ServerMe; devCode?: string };
export type ApiNearby = Profile & { distance: number; bearing: number; accuracy?: number; updatedAt?: number };
export type Fix = { lat: number; lng: number; accuracy?: number | null };
export type SyncMsg = { id: string; peer: string; mine: boolean; text: string; image: string; at: number; deleted: boolean; rev: number };
export type SyncResult = {
  serverTime: number; me: ServerMe; relations: { id: string; state: 'sent' | 'incoming' | 'connected'; profile: Profile }[];
  blocked: { id: string; name: string; photo: string }[]; reports: Report[]; cleared: Record<string, number>;
  messages: SyncMsg[]; more: boolean; msgRev: number; notifications: { seq: number; kind: any; icon: string; t: string; to: string; at: number; pushed: boolean }[]; notifSeq: number;
};
export type DiscoverPerson = Profile & { likedYou: boolean; distanceKm?: number };
export type FaceFrame = { uri: string };

export const api = {
  // account
  signup: (email: string, password: string) => req<Session>('POST', '/auth/signup', { email, password }),
  login: (email: string, password: string) => req<Session>('POST', '/auth/login', { email, password }),
  verifyEmail: (code: string) => req<{ me: ServerMe }>('POST', '/auth/verify', { code }),
  resend: () => req<{ ok: true; devCode?: string }>('POST', '/auth/resend', {}),
  forgot: (email: string) => req<{ ok: true; devCode?: string }>('POST', '/auth/forgot', { email }),
  resetCheck: (email: string, code: string) => req<{ ok: true }>('POST', '/auth/reset-check', { email, code }),
  reset: (email: string, code: string, password: string) => req<{ ok: true }>('POST', '/auth/reset', { email, code, password }),
  changePassword: (current: string, next: string) => req<Session>('POST', '/auth/change-password', { current, next }),
  changeEmail: (email: string, password: string) => req<{ ok: true; devCode?: string }>('POST', '/auth/change-email', { email, password }),
  deleteAccount: () => req<{ ok: true }>('DELETE', '/me'),
  exportData: () => req<any>('GET', '/export'),
  feedback: (text: string) => req<{ ok: true }>('POST', '/feedback', { text }),
  // profile
  me: () => req<{ me: ServerMe }>('GET', '/me'),
  putMe: (me: Record<string, any>) => req<{ me: ServerMe }>('PUT', '/me', me),
  upload: async (uri: string): Promise<string> => {
    const f = new FormData(); const ext = (uri.split('?')[0].match(/\.(png|webp)$/i)?.[1] || 'jpg').toLowerCase();
    f.append('file', { uri, name: `photo.${ext}`, type: ext === 'jpg' ? 'image/jpeg' : `image/${ext}` } as any);
    return (await req<{ url: string }>('POST', '/upload', undefined, { form: f, timeoutMs: 60000 })).url;
  },
  // face scan
  faceStart: (consent = false) => req<{ sessionId: string; steps: ('center' | 'left' | 'right' | 'up' | 'down')[]; expiresInSec: number }>('POST', '/face/start', { consent }),
  faceVerify: (sessionId: string, frames: FaceFrame[]) => {
    const f = new FormData(); f.append('sessionId', sessionId);
    frames.forEach((fr, i) => f.append('frames', { uri: fr.uri, name: `f${i}.jpg`, type: 'image/jpeg' } as any));
    return req<{ ok: true; face: ServerMe['face'] }>('POST', '/face/verify', undefined, { form: f, timeoutMs: 60000 });
  },
  // discovery
  postLocation: (f: Fix) => req<{ ok: true }>('POST', '/location', f),
  setVisible: (visible: boolean) => req<{ ok: true }>('POST', '/visibility', { visible }),
  nearby: (radius: number) => req<{ people: ApiNearby[]; serverTime: number }>('GET', `/nearby?radius=${Math.round(radius)}`),
  person: (id: string) => req<{ person: Profile; state: string }>('GET', `/people/${id}`),
  registerPush: (pushToken: string) => req<{ ok: true }>('POST', '/push-token', { token: pushToken }),
  unregisterPush: () => req<{ ok: true }>('DELETE', '/push-token'),
  // discover (photo cards by age)
  discover: (ageMin: number, ageMax: number) => req<{ people: DiscoverPerson[] }>('GET', `/discover?ageMin=${ageMin}&ageMax=${ageMax}`),
  like: (id: string) => req<{ state: 'sent' | 'connected'; match: boolean }>('POST', `/discover/${id}/like`, {}),
  unpass: (id: string) => req<{ ok: true }>('DELETE', `/discover/${id}/pass`),
  pass: (id: string) => req<{ ok: true }>('POST', `/discover/${id}/pass`, {}),
  // social
  sync: (msgRev: number, notifSeq: number) => req<SyncResult>('GET', `/sync?msgRev=${msgRev}&notifSeq=${notifSeq}`),
  connect: (id: string, action: 'request' | 'cancel' | 'accept' | 'decline' | 'remove') => req<{ state: string }>('POST', `/connections/${id}/${action}`, {}),
  wave: (id: string) => req<{ ok: true }>('POST', `/wave/${id}`, {}),
  block: (id: string) => req<{ ok: true }>('POST', `/blocks/${id}`, {}),
  unblock: (id: string) => req<{ ok: true }>('DELETE', `/blocks/${id}`),
  report: (target: string, reason: string) => req<{ ok: true }>('POST', '/reports', { target, reason }),
  // chat
  sendMessage: (peer: string, m: { id: string; text?: string; image?: string }) => req<{ message: SyncMsg }>('POST', `/messages/${peer}`, m),
  deleteMessage: (peer: string, id: string) => req<{ ok: true }>('DELETE', `/messages/${peer}/${id}`),
  clearChat: (peer: string) => req<{ ok: true }>('POST', `/chats/${peer}/clear`, {}),
};
