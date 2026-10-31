import { Message } from '@/types';
import { MSG_KEEP, MSG_TTL_MS } from './config';

// Same rule as the server: a message lives 3 hours, and a chat keeps its newest 10. Unsent (pending / failed) ones are never dropped here.
let skew = 0; // server clock minus phone clock, so a wrong phone clock cannot hide or keep messages
export const noteServerTime = (t: number) => { if (t > 0) skew = t - Date.now(); };
export const expiresAt = (m: Message) => m.at + MSG_TTL_MS;

// Returns the SAME object when nothing needs to go, so callers can skip a state update.
export function trimMessages(all: Record<string, Message[]>): Record<string, Message[]> {
  const now = Date.now() + skew; let changed = false; const out: Record<string, Message[]> = {};
  for (const [peer, list] of Object.entries(all)) {
    let next = list.filter((m) => m.pending || m.failed || now - m.at < MSG_TTL_MS);
    const settled = next.filter((m) => !m.pending && !m.failed).sort((a, b) => a.at - b.at);
    if (settled.length > MSG_KEEP) { const drop = new Set(settled.slice(0, settled.length - MSG_KEEP).map((m) => m.id)); next = next.filter((m) => !drop.has(m.id)); }
    if (next.length !== list.length) changed = true;
    out[peer] = next;
  }
  return changed ? out : all;
}
