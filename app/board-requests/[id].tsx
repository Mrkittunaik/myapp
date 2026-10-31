import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Btn, Card, Avatar, IntentBadge, Empty, Skeleton, FadeIn } from '@/components/ui';
import { HelpCard } from '@/components/HelpCard';
import { useApp } from '@/services/store';
import { useSync } from '@/services/sync';
import { api, ApiError, HelpRequester } from '@/services/api';
import { onHint } from '@/services/realtime';
import { rememberPeople } from '@/services/people';
import { ago } from '@/services/time';
import { colors, type, space } from '@/constants/theme';

// The poster's view of one post: who asked to join, with their profiles. She accepts one; only that person is then connected to her.
export default function BoardRequests() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const a = useApp(); const { sync } = useSync();
  const [post, setPost] = useState<any>(null); const [list, setList] = useState<HelpRequester[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const x = await api.helpRequestsFor(id!); rememberPeople(x.requests.map((q) => q.profile)); setPost(x.post); setList(x.requests); setErr(null); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load.'); } finally { setLoading(false); }
  }, [id]);
  const ref = useRef(load); ref.current = load;
  useEffect(() => { load(); }, [load]);
  useEffect(() => onHint((h) => { if (h === 'help') ref.current(true); }), []);
  const act = async (uid: string, kind: 'accept' | 'decline') => {
    setBusy(uid + kind);
    try { await (kind === 'accept' ? api.helpAccept(id!, uid) : api.helpDecline(id!, uid)); a.toast(kind === 'accept' ? 'Accepted. You can chat now.' : 'Declined'); await load(true); if (kind === 'accept') sync(); }
    catch (e) { a.toast(e instanceof ApiError ? e.message : 'Something went wrong. Try again.', 'err'); } finally { setBusy(null); }
  };
  const open = post?.status === 'open';
  return (
    <Screen edges={['top']}>
      <Header title="Join requests" />
      {loading ? <View style={{ padding: space.lg }}>{[1, 2].map((i) => <Skeleton key={i} h={130} />)}</View>
      : err ? <Empty icon="cloud-offline-outline" title="Could not load" text={err} action="Try again" onAction={() => load()} />
      : <FlatList showsVerticalScrollIndicator={false} data={list} keyExtractor={(x) => x.userId} contentContainerStyle={{ padding: space.lg, paddingBottom: 40, flexGrow: 1 }}
          ListHeaderComponent={post ? <HelpCard cat={post.category} title={post.title} body={post.body} offer={post.offer} meta={open ? 'Open. Choose one person to accept.' : 'You chose someone for this post.'} full /> : null}
          ListEmptyComponent={<Empty icon="hourglass-outline" title="No requests yet" text="You will see who asks to join here, live, with their profiles." />}
          renderItem={({ item, index }) => { const p = item.profile; return (
            <FadeIn delay={index * 70} y={14}><Card style={{ marginBottom: 12 }} onPress={() => r.push(`/profiles/${p.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar uri={p.photo} size={60} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={type.section}>{p.name}{p.age ? `, ${p.age}` : ''}</Text>{p.verified && <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 6 }} />}</View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{p.intentions.slice(0, 2).map((i) => <IntentBadge key={i} k={i} />)}</View>
                  <Text style={type.caption}>Asked {ago(item.at)}</Text></View>
              </View>
              {!!item.note && <Text style={[type.body, { marginTop: 10, fontStyle: 'italic' }]}>“{item.note}”</Text>}
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {item.status === 'pending' && open ? <><Btn style={{ flex: 1, minHeight: 44, marginRight: 8 }} title="Accept" loading={busy === item.userId + 'accept'} onPress={() => act(item.userId, 'accept')} /><Btn style={{ flex: 1, minHeight: 44 }} variant="secondary" title="Decline" loading={busy === item.userId + 'decline'} onPress={() => act(item.userId, 'decline')} /></>
                : item.status === 'accepted' ? <><Btn style={{ flex: 1, minHeight: 44, marginRight: 8 }} icon="chatbubble" title="Message" onPress={() => r.push(`/chat/${item.userId}`)} /><Btn style={{ flex: 1, minHeight: 44 }} variant="secondary" title="Profile" onPress={() => r.push(`/profiles/${item.userId}`)} /></>
                : <Text style={{ color: colors.muted, fontWeight: '700' }}>{item.status === 'declined' ? 'Declined' : 'Closed'}</Text>}
              </View></Card></FadeIn>); }} />}
    </Screen>);
}
