import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { usePullRefresh } from '@/services/refresh';
import { useRouter } from 'expo-router';
import { Screen, Chip, Card, Avatar, Btn, IconBtn, IntentBadge, InterestTag, Empty, Skeleton, FadeIn, SearchBar, Sheet, Row, Dialog } from '@/components/ui';
import { ReportSheet } from '@/components/PersonSheet';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { usePeople } from '@/services/people';
import { type, space, colors } from '@/constants/theme';
let connSeen = false;
export default function Connections() {
  const r = useRouter(); const pr = usePullRefresh(); const a = useApp(); const act = useActions(); const people = usePeople();
  const [tab, setTab] = useState<'incoming' | 'sent' | 'connected'>('incoming'); const [loading, setL] = useState(!connSeen); const [q, setQ] = useState('');
  const [menu, setMenuRaw] = useState<string | null>(null); const [lastMenu, setLast] = useState<string | undefined>(undefined); const setMenu = (id: string | null) => { if (id) setLast(id); setMenuRaw(id); }; const [confirm, setConfirm] = useState<{ kind: 'remove' | 'block'; id: string } | null>(null); const [rep, setRep] = useState(false);
  useEffect(() => { if (connSeen) return; const t = setTimeout(() => { connSeen = true; setL(false); }, 500); return () => clearTimeout(t); }, []);
  const term = q.trim().toLowerCase();
  const list = people.all.filter((u) => a.requests[u.id] === tab && !a.hiddenIds.includes(u.id) && (!term || (u.name + ' ' + u.bio).toLowerCase().includes(term)));
  const cnt = (k: string) => people.all.filter((u) => a.requests[u.id] === k && !a.hiddenIds.includes(u.id)).length;
  const EMPTY: any = { incoming: ['No incoming requests', 'When someone wants to connect, you will see them here.'], sent: ['No sent requests', 'Find people on the radar and send a request.'], connected: ['No connections yet', 'Accepted requests appear here.'] };
  const mu = people.all.find((u) => u.id === menu); const cu = people.all.find((u) => u.id === confirm?.id);
  return (
    <Screen edges={['top']}>
      <Text style={[type.display, { padding: space.lg, paddingBottom: 6, textAlign: 'center' }]}>Connections</Text>
      <View style={{ paddingHorizontal: space.lg, marginBottom: 8 }}><SearchBar value={q} onChangeText={setQ} placeholder="Search people" /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.lg }}>
        {([['incoming', 'Incoming'], ['sent', 'Sent'], ['connected', 'Connected']] as const).map(([k, l]) => <Chip key={k} label={`${l} (${cnt(k)})`} selected={tab === k} onPress={() => setTab(k)} />)}</View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.lg }} refreshControl={<RefreshControl refreshing={pr.refreshing} onRefresh={pr.onRefresh} colors={[colors.violet]} />}>
        {loading ? [1, 2, 3].map((i) => <Skeleton key={i} h={110} />) : list.length === 0 ? (term ? <Empty icon="search-outline" title="No matches" text="Try a different name." /> : <Empty icon="people-outline" title={EMPTY[tab][0]} text={EMPTY[tab][1]} action="Open radar" onAction={() => r.navigate('/(tabs)/nearby')} />) :
          list.map((u, idx) => { const shared = u.interests.filter((i) => a.me.interests.includes(i)); return (
            <FadeIn key={tab + u.id} delay={idx * 70} y={16}><Card style={{ marginBottom: 12 }} onPress={() => r.push(`/profiles/${u.id}`)}>
              <View style={{ flexDirection: 'row' }}><Avatar uri={u.photo} size={60} />
                <View style={{ flex: 1, marginLeft: 14 }}><Text style={type.section}>{u.name}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{u.intentions.slice(0, 2).map((i) => <IntentBadge key={i} k={i} />)}</View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{(shared.length ? shared : u.interests).slice(0, 3).map((i) => <InterestTag key={i} k={i} />)}</View></View>
                <IconBtn name="ellipsis-horizontal" label={`More options for ${u.name}`} onPress={() => setMenu(u.id)} size={20} /></View>
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {tab === 'incoming' && <><Btn style={{ flex: 1, minHeight: 44, marginRight: 8 }} title="Accept" onPress={() => act.accept(u.id)} /><Btn style={{ flex: 1, minHeight: 44 }} variant="secondary" title="Decline" onPress={() => act.decline(u.id)} /></>}
                {tab === 'sent' && <><View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: colors.warning, fontWeight: '700' }}>Pending</Text></View><Btn style={{ minHeight: 44 }} variant="secondary" title="Cancel request" onPress={() => act.cancel(u.id)} /></>}
                {tab === 'connected' && <><Btn style={{ flex: 1, minHeight: 44, marginRight: 8 }} icon="chatbubble" title="Message" onPress={() => r.push(`/chat/${u.id}`)} /><Btn style={{ flex: 1, minHeight: 44 }} variant="secondary" title="Profile" onPress={() => r.push(`/profiles/${u.id}`)} /></>}
              </View></Card></FadeIn>); })}
      </ScrollView>
      <Sheet visible={!!menu} onClose={() => setMenu(null)}>
        <Text style={[type.title, { marginBottom: 6 }]}>{mu?.name}</Text>
        {a.requests[menu || ''] === 'connected' && <Row icon="person-remove-outline" title="Remove connection" onPress={() => { setConfirm({ kind: 'remove', id: menu! }); setMenu(null); }} />}
        <Row icon="flag-outline" title="Report" onPress={() => { setMenu(null); setRep(true); }} />
        <Row icon="ban-outline" title="Block" danger onPress={() => { setConfirm({ kind: 'block', id: menu! }); setMenu(null); }} /></Sheet>
      <ReportSheet visible={rep} userId={menu || lastMenu} onClose={() => setRep(false)} />
      <Dialog visible={!!confirm} title={confirm?.kind === 'block' ? `Block ${cu?.name}?` : 'Remove connection?'} text={confirm?.kind === 'block' ? 'They will no longer see you or be able to contact you. You can unblock them in Settings.' : `${cu?.name} will no longer be able to message you.`} confirm={confirm?.kind === 'block' ? 'Block' : 'Remove'} danger onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm) (confirm.kind === 'block' ? act.block : act.remove)(confirm.id); setConfirm(null); }} />
    </Screen>);
}
