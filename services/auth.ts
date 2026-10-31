import { USE_BACKEND } from './config';
import { api, ApiError, ServerMe, setToken } from './api';

// With EXPO_PUBLIC_API_URL set, every call goes to the backend. Without it the app runs in demo mode (no real accounts).
export type AuthResult = { ok: true; me?: ServerMe; devCode?: string } | { ok: false; error: string };
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
export const DEMO_CODE = '123456'; // demo mode only
const fail = (e: unknown): AuthResult => ({ ok: false, error: e instanceof ApiError ? e.message : 'Something went wrong. Try again.' });
const run = async (fn: () => Promise<Partial<{ me: ServerMe; devCode: string }> | void>): Promise<AuthResult> => { try { const r = (await fn()) || {}; return { ok: true, me: (r as any).me, devCode: (r as any).devCode }; } catch (e) { return fail(e); } };

export const auth = {
  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(); return email.includes('taken') ? { ok: false, error: 'This email is already registered. Try logging in.' } : { ok: true }; }
    return run(async () => { const s = await api.signup(email.trim(), password); await setToken(s.token); return { me: s.me, devCode: s.devCode }; });
  },
  async login(email: string, password: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(); return password === 'wrongpass' ? { ok: false, error: 'Incorrect email or password.' } : { ok: true }; }
    return run(async () => { const s = await api.login(email.trim(), password); await setToken(s.token); return { me: s.me }; });
  },
  async requestReset(email: string): Promise<AuthResult> { if (!USE_BACKEND) { await wait(); return { ok: true }; } return run(async () => ({ devCode: (await api.forgot(email.trim())).devCode })); },
  // Checks the emailed code (reset flow, step 2) without using it up.
  async checkResetCode(email: string, code: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(500); return code === DEMO_CODE ? { ok: true } : { ok: false, error: 'That code is not right. Try again.' }; }
    return run(async () => { await api.resetCheck(email.trim(), code); });
  },
  async resetPassword(email: string, code: string, next: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(); return code === DEMO_CODE ? { ok: true } : { ok: false, error: 'That code has expired. Start again.' }; }
    return run(async () => { await api.reset(email.trim(), code, next); });
  },
  async sendCode(_email: string): Promise<AuthResult> { if (!USE_BACKEND) { await wait(500); return { ok: true }; } return run(async () => ({ devCode: (await api.resend()).devCode })); },
  async verifyCode(code: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(500); return code === DEMO_CODE ? { ok: true } : { ok: false, error: 'That code is not right. Try again.' }; }
    return run(async () => ({ me: (await api.verifyEmail(code)).me }));
  },
  async changePassword(current: string, next: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(); if (current === 'wrongpass') return { ok: false, error: 'Current password is incorrect.' }; if (current === next) return { ok: false, error: 'Choose a password you have not used just now.' }; return { ok: true }; }
    return run(async () => { const s = await api.changePassword(current, next); await setToken(s.token); return { me: s.me }; });
  },
  async changeEmail(email: string, password: string): Promise<AuthResult> {
    if (!USE_BACKEND) { await wait(); if (password === 'wrongpass') return { ok: false, error: 'Password is incorrect.' }; return email.includes('taken') ? { ok: false, error: 'This email is already registered.' } : { ok: true }; }
    return run(async () => ({ devCode: (await api.changeEmail(email.trim(), password)).devCode }));
  },
  async deleteAccount(): Promise<AuthResult> { if (!USE_BACKEND) { await wait(500); return { ok: true }; } const r = await run(async () => { await api.deleteAccount(); }); if (r.ok) await setToken(null); return r; },
  async logout() { if (!USE_BACKEND) return wait(200); try { await api.unregisterPush(); } catch { /* offline: the token is cleared locally anyway */ } await setToken(null); },
};
export const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());
export const validPassword = (p: string) => p.length >= 8 && /\d/.test(p);
