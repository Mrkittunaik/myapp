import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '@/services/store';
import { USE_BACKEND } from '@/services/config';
export default function Gate() {
  const a = useApp();
  if (!a.ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#6C4DF6" /></View>;
  if (!a.onboarded) return <Redirect href="/onboarding" />;
  if (!a.loggedIn) return <Redirect href="/auth/welcome" />;
  if (!a.emailVerified) return <Redirect href="/auth/verify" />;
  if (USE_BACKEND && a.face.status !== 'verified') return <Redirect href="/face-scan" />;
  if (!a.setupDone) return <Redirect href="/setup" />;
  if (!a.locationAsked) return <Redirect href="/permission" />;
  if (!a.notifAsked) return <Redirect href="/notif-permission" />;
  return <Redirect href="/(tabs)/home" />;
}
