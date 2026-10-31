import { Linking } from 'react-native';
import { SUPPORT_EMAIL } from '@/constants/theme';
// Opens the mail app addressed to support. Returns false (and the caller shows a message) when it cannot.
export async function emailSupport(subject?: string, body?: string): Promise<'ok' | 'not-set' | 'no-app'> {
  if (!SUPPORT_EMAIL) return 'not-set';
  const q = [subject ? `subject=${encodeURIComponent(subject)}` : '', body ? `body=${encodeURIComponent(body)}` : ''].filter(Boolean).join('&');
  try { await Linking.openURL(`mailto:${SUPPORT_EMAIL}${q ? '?' + q : ''}`); return 'ok'; } catch { return 'no-app'; }
}
export const supportMessage = (r: 'not-set' | 'no-app') => (r === 'not-set' ? 'Support email is not set up yet' : 'No email app found');
