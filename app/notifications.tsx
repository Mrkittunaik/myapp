import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Header, Empty, Card, FadeIn, IconBtn, Banner } from '@/components/ui';
import { useNotifPermission } from '@/services/notifications';
import { useApp } from '@/services/store';
import { ago } from '@/services/time';
import { colors, type } from '@/constants/theme';
export default function Notifs() {
  const r = useRouter(); const a = useApp(); const np = useNotifPermission(); const items = a.notifs;
  const unread = items.filter((x) => !x.read).length;
  const markAll = () => a.update((s) => ({ notifs: s.notifs.map((x) => ({ ...x, read: true })) }));
  const remove = (id: string) => a.update((s) => ({ notifs: s.notifs.filter((x) => x.id !== id) }));
  return (
    <Screen><Header title="Notifications" right={unread > 0 ? <Pressable onPress={markAll} accessibilityRole="button" accessibilityLabel="Mark all read" hitSlop={8} style={{ minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={{ color: colors.violet, fontWeight: '700', fontSize: 13.5 }}>Mark all read</Text></Pressable> : undefined} />
      <FlatList showsVerticalScrollIndicator={false} data={items} keyExtractor={(n) => n.id} contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={np.status === 'undetermined' || np.status === 'denied' ? <Banner icon="notifications-off" tone="warn" text="Phone notifications are off, so you will not hear about requests or messages when the app is closed." action={np.status === 'denied' && !np.canAskAgain ? 'Fix' : 'Allow'} onAction={np.allow} /> : null}
        ListEmptyComponent={<Empty icon="notifications-off-outline" title="You're all caught up" text="New activity will show up here." />}
        ListFooterComponent={<View style={{ alignItems: 'center', marginTop: 12 }}>
          {items.length > 0 && <Pressable onPress={() => a.set({ notifs: [] })} hitSlop={8} accessibilityRole="button"><Text style={{ color: colors.error, fontWeight: '700', marginBottom: 14 }}>Clear all</Text></Pressable>}
          <Pressable onPress={() => r.push('/settings')} hitSlop={8} accessibilityRole="button"><Text style={{ color: colors.violet, fontWeight: '700' }}>Notification preferences</Text></Pressable></View>}
        renderItem={({ item, index }) => (<FadeIn delay={index * 50}><Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: item.read ? '#fff' : colors.violetSoft }} onPress={() => { a.update((s) => ({ notifs: s.notifs.map((x) => (x.id === item.id ? { ...x, read: true } : x)) })); r.navigate(item.to as any); }}>
          <View style={{ width: 40, height: 40, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon as any} size={20} color={colors.violet} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={[type.body, { fontWeight: item.read ? '500' : '700' }]}>{item.t}</Text><Text style={type.caption}>{ago(item.at)}</Text></View>
          {!item.read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.dating, marginRight: 6 }} />}
          <IconBtn name="close" label="Delete notification" size={18} bg="transparent" color={colors.muted} onPress={() => remove(item.id)} /></Card></FadeIn>)} />
    </Screen>);
}
