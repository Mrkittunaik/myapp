import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Empty } from '@/components/ui';
// Shown for a bad deep link or a notification that points at a screen that does not exist.
export default function NotFound() {
  const r = useRouter();
  return <Screen><View style={{ flex: 1, justifyContent: 'center' }}><Empty icon="compass-outline" title="Page not found" text="That link does not lead anywhere in Nearby." action="Go home" onAction={() => r.replace('/')} /></View></Screen>;
}
