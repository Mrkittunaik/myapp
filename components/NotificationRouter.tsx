import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/services/store';
import { setupNotifications } from '@/services/notifications';

// Opens the right screen when the person taps a notification (app running, in background, or closed).
// Phone notifications do not exist in a browser, so on web this does nothing.
export default function NotificationRouter() { return Platform.OS === 'web' ? null : <Router />; }
function Router() {
  const r = useRouter(); const a = useApp(); const last = Notifications.useLastNotificationResponse(); const done = useRef<string | null>(null);
  useEffect(() => { setupNotifications(); }, []);
  useEffect(() => {
    if (!last || !a.ready || !a.loggedIn || !a.setupDone) return;
    if (last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = last.notification.request.identifier;
    if (done.current === id) return; done.current = id;
    const to = last.notification.request.content.data?.to;
    if (typeof to === 'string' && to.startsWith('/')) setTimeout(() => r.navigate(to as any), 150);
  }, [last, a.ready, a.loggedIn, a.setupDone]);
  return null;
}
