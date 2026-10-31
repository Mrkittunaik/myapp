import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Empty } from '@/components/ui';
export default function AccountDeleted() {
  const r = useRouter();
  return <Screen><View style={{ flex: 1, justifyContent: 'center' }}><Empty icon="checkmark-circle-outline" title="Your account was deleted" text="Your profile, connections and messages were removed from this device. Thanks for trying Nearby." action="Back to start" onAction={() => r.replace('/auth/welcome')} /></View></Screen>;
}
