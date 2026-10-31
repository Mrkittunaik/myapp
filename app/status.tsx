import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Empty } from '@/components/ui';
import { useApp } from '@/services/store';
import NetInfo from '@react-native-community/netinfo';
// Reusable full-screen states: /status?kind=network|session|suspended
export default function Status() {
  const { kind } = useLocalSearchParams<{ kind: string }>(); const r = useRouter(); const a = useApp();
  const M: any = {
    network: ['cloud-offline-outline', 'No connection', 'Check your internet connection and try again.', 'Retry', async () => { const n = await NetInfo.fetch().catch(() => null); if (n?.isConnected !== false) { a.toast('Back online'); r.canGoBack() ? r.back() : r.replace('/'); } else a.toast('Still offline. Check your connection.', 'err'); }],
    session: ['time-outline', 'Session expired', 'For your security, please log in again.', 'Log in', () => { a.set({ loggedIn: false }); r.replace('/auth/login'); }],
    suspended: ['ban-outline', 'Account suspended', 'Your account was suspended for breaking our community guidelines. Contact support to appeal.', 'Contact support', () => r.push('/help')],
  };
  const m = M[kind || 'network'] || M.network;
  return <Screen><View style={{ flex: 1, justifyContent: 'center' }}><Empty icon={m[0]} title={m[1]} text={m[2]} action={m[3]} onAction={m[4]} /></View></Screen>;
}
