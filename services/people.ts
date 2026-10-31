import { useSyncExternalStore } from 'react';
import { Profile } from '@/types';
import { DEMO_USERS } from './demoData';
import { USE_BACKEND } from './config';

// Every person the app has seen (nearby, connections, requests). Demo people are only added when no backend is configured,
// so connecting a backend clears all sample data automatically.
const known = new Map<string, Profile>();
let version = 0; const subs = new Set<() => void>();
const bump = () => { version++; subs.forEach((f) => f()); };
if (!USE_BACKEND) DEMO_USERS.forEach((u) => known.set(u.id, u));
export const rememberPeople = (list: Profile[]) => { if (!list.length) return; list.forEach((p) => known.set(p.id, p)); bump(); };
export const clearPeople = () => { known.clear(); if (!USE_BACKEND) DEMO_USERS.forEach((u) => known.set(u.id, u)); bump(); };
export const findPerson = (id?: string | null): Profile | undefined => (id ? known.get(id) : undefined);
// Re-renders the screen when new people are learned.
export function usePeople() {
  useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => version);
  return { all: [...known.values()], find: findPerson };
}
