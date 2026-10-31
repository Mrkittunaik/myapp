import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { USE_BACKEND } from '@/services/config';
import TabBar from '@/components/TabBar';
import { useApp } from '@/services/store';
export default function TabsLayout() {
  const a = useApp(); const { requests, messages, hiddenIds, readChats, muted } = a;
  const incoming = Object.keys(requests).filter((id) => requests[id] === 'incoming' && !hiddenIds.includes(id)).length;
  const unread = Object.keys(messages).filter((id) => requests[id] === 'connected' && !hiddenIds.includes(id) && (() => { const l = (messages[id] || []).slice(-1)[0]; return !!l && !l.mine && l.at > (readChats[id] || 0) && !muted.includes(id); })()).length;
  if (USE_BACKEND && a.ready && a.loggedIn && a.face.status !== 'verified') return <Redirect href="/face-scan" />;
  return (
    <Tabs id={undefined} tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, lazy: false, sceneStyle: { backgroundColor: 'transparent' } } as any}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="nearby" options={{ title: 'Nearby' }} />
      <Tabs.Screen name="connections" options={{ title: 'Connections', tabBarBadge: incoming || undefined }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarBadge: unread || undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>);
}
