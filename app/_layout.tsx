import React from 'react';
import { View } from 'react-native';
import { MAX_APP_WIDTH } from '@/services/layout';
import { useApp } from '@/services/store';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/services/background'; // registers the background location task at app start
import { AppProvider } from '@/services/store';
import { NearbyProvider } from '@/services/discovery';
import { SyncProvider } from '@/services/sync';
import { LocationProvider } from '@/services/location';
import { Toast } from '@/components/ui';
import OfflineBanner from '@/components/OfflineBanner';
import NotificationRouter from '@/components/NotificationRouter';
import { ErrorScreen } from '@/components/ErrorScreen';
// Any crash while rendering a screen lands here instead of a blank or default error page.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) { return <ErrorScreen error={error} retry={retry} />; }
// Nothing is shown until the saved data is loaded, so a refreshed browser tab never opens a blank form that could overwrite the profile.
function Ready({ children }: { children: React.ReactNode }) { const a = useApp(); return a.ready ? <>{children}</> : null; }
export default function Root() {
  return (
    <SafeAreaProvider><AppProvider><LocationProvider><NearbyProvider><SyncProvider><Ready>
      <View style={{ flex: 1, backgroundColor: '#E4DEFB' }}><View style={{ flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center', overflow: 'hidden', backgroundColor: '#F6F5FB' }}>
      <StatusBar style="dark" />
      <Stack id={undefined} screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280, contentStyle: { backgroundColor: '#F6F5FB' } }}>
        <Stack.Screen name="permission" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="notif-permission" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="face-scan" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
      <NotificationRouter />
      <Toast />
      <OfflineBanner />
      </View></View>
    </Ready></SyncProvider></NearbyProvider></LocationProvider></AppProvider></SafeAreaProvider>
  );
}
