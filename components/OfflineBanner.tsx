import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Banner } from './ui';
// Slides in at the top whenever the phone has no internet. Tap for details, or hide it (it comes back next time you go offline).
export default function OfflineBanner() {
  const net = useNetInfo(); const insets = useSafeAreaInsets(); const r = useRouter();
  const [hidden, setHidden] = useState(false); const offline = net.isConnected === false;
  useEffect(() => { if (!offline) setHidden(false); }, [offline]);
  if (!offline || hidden) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="No internet connection. Details" onPress={() => r.push('/status?kind=network')} style={{ position: 'absolute', left: 12, right: 12, top: insets.top + 4, zIndex: 50 }}><Banner icon="cloud-offline-outline" tone="err" text="No internet connection. Some things may not work." action="Hide" onAction={() => setHidden(true)} /></Pressable>;
}
