import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Avatar, Empty, Banner, FadeIn, SearchBar, Sheet, Row, Dialog } from '@/components/ui';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { usePeople } from '@/services/people';
import { USE_BACKEND } from '@/services/config';
import { api } from '@/services/api';
import { usePullRefresh } from '@/services/refresh';
import { stamp } from '@/services/time';
import { type, space, colors } from '@/constants/theme';
export default function Messages() {
  const r = useRouter(); const pr = usePullRefresh(); const a = useApp(); const act = useActions(); const people = usePeople();
  const [q, setQ] = useState(''); const [menu, setMenu] = useState<string | null>(null); const [clr, setClr] = useState<string | null>(null); const [blk, setBlk] = useState<string | null>(null);
  const term = q.trim().toLowerCase();
  const lastAt = (id: string) => (a.messages[id] || []).slice(-1)[0]?.at || 0;
  const convos = people.all.filter((u) => a.requests[u.id] === 'connected' && !a.hiddenIds.includes(u.id)).sort((x, y) => lastAt(y.id) - lastAt(x.id)).filter((u) => !term || (u.name + ' ' + (a.messages[u.id] || []).map((m) => m.text).join(' ')).toLowerCase().includes(term));
  const mu = people.all.find((u) => u.id === menu); const isMuted = !!menu && a.muted.includes(menu);
  return (
    <Screen edges={['top']}>
      <Text style={[type.display, { padding: space.lg, paddingBottom: 6, textAlign: 'center' }]}>Messages</Text>
      <View style={{ paddingHorizontal: space.lg, marginBottom: 4 }}><SearchBar value={q} onChangeText={setQ} placeholder="Search conversations" /></View>
      <FlatList showsVerticalScrollIndicator={false} refreshing={pr.refreshing} onRefresh={pr.onRefresh} data={convos} keyExtractor={(u) => u.id} contentContainerStyle={{ padding: space.lg }}
        ListHeaderComponent={USE_BACKEND ? undefined : <Banner icon="flask" tone="warn" text="Demo messages. Connect the backend for real chat. Press and hold a chat for options." />}
        ListEmptyComponent={term ? <Empty icon="search-outline" title="No matches" text="Try a different name or word." /> : <Empty icon="chatbubbles-outline" title="No conversations yet" text="You can message people once a connection request is accepted." action="See requests" onAction={() => r.navigate('/(tabs)/connections')} />}
        renderItem={({ item, index }) => {
          const list = a.messages[item.id] || []; const last = list.slice(-1)[0]; const readAt = a.readChats[item.id] || 0; const muted = a.muted.includes(item.id);
          const unread = muted ? 0 : list.filter((m) => !m.mine && m.at > readAt).length;
          return (
            <FadeIn delay={index * 70}><Pressable onPress={() => r.push(`/chat/${item.id}`)} onLongPress={() => setMenu(item.id)} delayLongPress={300} accessibilityLabel={`${item.name}. ${muted ? 'Muted. ' : ''}${unread ? unread + ' unread. ' : ''}`} accessibilityActions={[{ name: 'more', label: 'More options' }]} onAccessibilityAction={() => setMenu(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <Avatar uri={item.photo} size={56} /><View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={type.section}>{item.name}</Text>{muted && <Ionicons name="volume-mute" size={14} color={colors.muted} style={{ marginLeft: 6 }} />}</View>
                <Text style={[type.secondary, unread > 0 && { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>{last ? (last.image && !last.text ? 'Photo' : last.text) : 'Say hello'}</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={type.caption}>{last ? stamp(last.at) : ''}</Text>
                {unread > 0 && <View style={{ backgroundColor: colors.violet, borderRadius: 5, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginTop: 4, paddingHorizontal: 5 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread}</Text></View>}</View></Pressable></FadeIn>);
        }} />
      <Sheet visible={!!menu} onClose={() => setMenu(null)}>
        <Row icon={isMuted ? 'volume-high-outline' : 'volume-mute-outline'} title={isMuted ? 'Unmute' : 'Mute'} onPress={() => { const id = menu!; setMenu(null); const was = a.muted.includes(id); a.set({ muted: was ? a.muted.filter((x) => x !== id) : [...a.muted, id] }); a.toast(was ? 'Unmuted' : 'Muted'); }} />
        <Row icon="trash-outline" title="Delete conversation" onPress={() => { setClr(menu); setMenu(null); }} />
        <Row icon="ban-outline" title="Block" danger onPress={() => { const id = menu!; setMenu(null); setBlk(id); }} /></Sheet>
      <Dialog visible={!!blk} title={`Block ${people.all.find((u) => u.id === blk)?.name || ''}?`} text="They will no longer see you or be able to contact you. This also removes the connection." confirm="Block" danger onCancel={() => setBlk(null)} onConfirm={() => { const id = blk!; setBlk(null); act.block(id); }} />
      <Dialog visible={!!clr} title={`Delete chat with ${people.all.find((u) => u.id === clr)?.name || ''}?`} text="Messages are removed from this device. You stay connected." confirm="Delete" danger onCancel={() => setClr(null)} onConfirm={() => { const id = clr!; if (USE_BACKEND) api.clearChat(id).catch(() => {}); a.update((s) => ({ messages: { ...s.messages, [id]: [] } })); setClr(null); a.toast('Conversation deleted'); }} />
    </Screen>);
}
