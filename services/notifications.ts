import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { NotifKind } from '@/types';
import { api } from './api';

export type NotifPerm = 'loading' | 'undetermined' | 'granted' | 'denied';
const COLOR = '#6C4DF6';
const A = Notifications.AndroidImportance;
// One Android channel per kind, so the person can also mute each kind from phone settings.
const CHANNELS: Record<NotifKind, { name: string; description: string; importance: Notifications.AndroidImportance }> = {
  requests: { name: 'Connection requests', description: 'When someone wants to connect or accepts your request', importance: A.HIGH },
  messages: { name: 'Messages', description: 'New messages from your connections', importance: A.HIGH },
  nearby: { name: 'Nearby alerts', description: 'When someone with shared interests is close', importance: A.DEFAULT },
  system: { name: 'Account and safety', description: 'Account, security and app updates', importance: A.DEFAULT },
};
const TITLES: Record<NotifKind, string> = { requests: 'Connections', messages: 'New message', nearby: 'Someone is nearby', system: 'Nearby' };

let ready = false;
// Call once at app start. Android 13+ only shows the permission dialog after a channel exists.
export async function setupNotifications() {
  if (ready) return; ready = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      for (const [id, c] of Object.entries(CHANNELS)) {
        await Notifications.setNotificationChannelAsync(id, { name: c.name, description: c.description, importance: c.importance, vibrationPattern: [0, 200, 100, 200], lightColor: COLOR });
      }
    }
  } catch { ready = false; }
}

type Read = { status: Exclude<NotifPerm, 'loading'>; canAskAgain: boolean };
async function readPerm(): Promise<Read> {
  const p = await Notifications.getPermissionsAsync();
  return { status: p.granted ? 'granted' : p.status === 'undetermined' ? 'undetermined' : 'denied', canAskAgain: p.canAskAgain };
}
async function askPerm(): Promise<Read> {
  await setupNotifications();
  const p = await Notifications.requestPermissionsAsync();
  return { status: p.granted ? 'granted' : p.status === 'undetermined' ? 'undetermined' : 'denied', canAskAgain: p.canAskAgain };
}

// Permission state + one-tap fix. Re-checks when the person comes back from phone Settings.
export function useNotifPermission() {
  const [st, setSt] = useState<{ status: NotifPerm; canAskAgain: boolean }>({ status: 'loading', canAskAgain: true });
  const refresh = useCallback(async () => { try { setSt(await readPerm()); } catch { setSt({ status: 'denied', canAskAgain: false }); } }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);
  // 'settings' = the system dialog can no longer be shown, so we sent the person to phone Settings.
  const allow = useCallback(async (): Promise<'granted' | 'denied' | 'settings'> => {
    if (st.status === 'denied' && !st.canAskAgain) { Linking.openSettings(); return 'settings'; }
    try { const r = await askPerm(); setSt(r); return r.status === 'granted' ? 'granted' : 'denied'; } catch { return 'denied'; }
  }, [st]);
  return { ...st, refresh, allow, openSettings: () => Linking.openSettings() };
}

export const isQuietNow = (d = new Date()) => d.getHours() >= 22 || d.getHours() < 7; // matches "10 PM to 7 AM" in Settings

// Shows a real system notification (only if the person allowed it, and not during quiet hours).
export async function showLocal(o: { kind: NotifKind; body: string; to: string; quiet?: boolean }) {
  try {
    if (o.quiet && isQuietNow()) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: TITLES[o.kind], body: o.body, data: { to: o.to }, color: COLOR },
      trigger: Platform.OS === 'android' ? { channelId: o.kind } : null,
    });
  } catch {}
}

// Settings > "Send a test notification": arrives in 5 seconds so the person can close the app and see it.
export async function sendTestNotification() {
  await setupNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Nearby', body: 'This is how notifications will look. Tap to open the app.', data: { to: '/notifications' }, color: COLOR },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, ...(Platform.OS === 'android' ? { channelId: 'system' } : {}) } as any,
  });
}

// Registers this phone for remote push (backend sends "someone is nearby" etc. even when the app is closed).
// Needs a development/production build with a projectId: Expo Go on Android cannot receive remote push.
export async function registerForPush() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return null;
  const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId || (Constants as any).easConfig?.projectId;
  if (!projectId) return null;
  await setupNotifications();
  if (!(await Notifications.getPermissionsAsync()).granted) return null;
  const t = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.registerPush(t.data);
  return t.data;
}
