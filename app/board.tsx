import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Chip, Btn, Empty, Sheet, Dialog, Skeleton, Avatar, Pop, Row } from '@/components/ui';
import { HelpCard, HELP_CATS } from '@/components/HelpCard';
import { useApp } from '@/services/store';
import { useSync } from '@/services/sync';
import { api, ApiError, HelpPost, MyHelpPost, MyHelpRequest } from '@/services/api';
import { USE_BACKEND } from '@/services/config';
import { onHint } from '@/services/realtime';
import { rememberPeople } from '@/services/people';
import { ago } from '@/services/time';
import { colors, type, space } from '@/constants/theme';

type Tab = 'explore' | 'mine' | 'requests';
const REASONS = ['Fake profile or spam', 'Inappropriate photos or content', 'Harassment or hate', 'Something else'];
const STATUS: Record<string, { label: string; color: string }> = { pending: { label: 'Waiting for her answer', color: colors.warning }, accepted: { label: 'Accepted', color: colors.success }, declined: { label: 'Not selected', color: colors.muted }, closed: { label: 'Post filled or closed', color: colors.muted } };
const who = (p: HelpPost['poster']) => `${p.gender ? `Verified ${p.gender.toLowerCase()}` : 'Verified'}${p.ageBand ? ' · ' + p.ageBand : ''}`;

// Help board: everyone sees what people need WITHOUT their name or photo. Ask to join; the poster picks one person, and only then is she shown to that person.
export default function Board() {
  const r = useRouter(); const a = useApp(); const { sync } = useSync(); const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'mine' || params.tab === 'requests' ? params.tab : 'explore'); const [cat, setCat] = useState<string | null>(null);
  const [feed, setFeed] = useState<HelpPost[]>([]); const [mine, setMine] = useState<MyHelpPost[]>([]); const [reqs, setReqs] = useState<MyHelpRequest[]>([]);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null); const [refreshing, setRefreshing] = useState(false);
  const [sel, setSel] = useState<HelpPost | null>(null); const [note, setNote] = useState(''); const [sending, setSending] = useState(false); const [del, setDel] = useState<MyHelpPost | null>(null); const [rep, setRep] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!USE_BACKEND) { setLoading(false); return; }
    if (!silent) setLoading(true); setErr(null);
    try {
      if (tab === 'explore') setFeed((await api.helpFeed(cat)).posts);
      else if (tab === 'mine') setMine((await api.helpMine()).posts);
      else { const x = await api.helpMyRequests(); x.requests.forEach((q) => q.poster && rememberPeople([q.poster])); setReqs(x.requests); }
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load. Check your connection.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tab, cat]);
  const loadRef = useRef(load); loadRef.current = load;
  useEffect(() => { load(); }, [load]);
  useEffect(() => onHint((h) => { if (h === 'help') loadRef.current(true); }), []); // live: new posts, requests and answers appear without refreshing

  const send = async () => {
    if (!sel) return; setSending(true);
    try { await api.helpRequest(sel.id, note.trim()); setFeed((f) => f.map((p) => (p.id === sel.id ? { ...p, myRequest: 'pending' } : p))); a.toast('Request sent. She will see your profile.'); setSel(null); setNote(''); }
    catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not send. Try again.', 'err'); } finally { setSending(false); }
  };
  const report = async (reason: string) => { const p = sel; setRep(false); if (!p) return; try { await api.helpReport(p.id, reason); setFeed((f) => f.filter((x) => x.id !== p.id)); setSel(null); a.toast('Reported. Thank you.'); } catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not report.', 'err'); } };
  const remove = async () => { const p = del; setDel(null); if (!p) return; try { await api.helpDelete(p.id); setMine((m) => m.filter((x) => x.id !== p.id)); a.toast('Post removed'); } catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not remove.', 'err'); } };
  const message = async (id: string) => { await sync(); r.push(`/chat/${id}`); };

  const data: any[] = tab === 'explore' ? feed : tab === 'mine' ? mine : reqs;
  return (
    <Screen edges={['top']}>
      <Header title="Help board" />
      <View style={{ flexDirection: 'row', paddingHorizontal: space.lg }}>
        {([['explore', 'Explore'], ['mine', 'My posts'], ['requests', 'Requested']] as const).map(([k, l]) => <Chip key={k} label={l} selected={tab === k} onPress={() => { setTab(k); setLoading(true); }} />)}
      </View>
      {tab === 'explore' && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 4 }} contentContainerStyle={{ paddingHorizontal: space.lg }}>
        <Chip label="All" selected={!cat} onPress={() => setCat(null)} />{HELP_CATS.map((c) => <Chip key={c.key} icon={c.icon} label={c.label} color={c.color} selected={cat === c.key} onPress={() => setCat(c.key)} />)}</ScrollView>}
      {!USE_BACKEND ? <Empty icon="cloud-offline-outline" title="Needs the live backend" text="The help board works with real people. Set EXPO_PUBLIC_API_URL to your backend to use it." action="Go back" onAction={() => r.back()} />
      : loading ? <View style={{ padding: space.lg }}>{[1, 2, 3].map((i) => <Skeleton key={i} h={150} />)}</View>
      : err ? <Empty icon="cloud-offline-outline" title="Could not load" text={err} action="Try again" onAction={() => load()} />
      : <FlatList showsVerticalScrollIndicator={false} data={data} keyExtractor={(x) => x.id || x.post.id} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} contentContainerStyle={{ padding: space.lg, paddingBottom: 110, flexGrow: 1 }}
          ListEmptyComponent={tab === 'explore' ? <Empty icon="hand-left-outline" title="Nothing here yet" text="When someone posts what they need, it shows up here instantly. Be the first to post." action="Post something" onAction={() => r.push('/board-new')} />
            : tab === 'mine' ? <Empty icon="document-text-outline" title="No posts yet" text="Post what you need. People send join requests and you choose who to accept." action="New post" onAction={() => r.push('/board-new')} />
            : <Empty icon="paper-plane-outline" title="No requests yet" text="Open a post on Explore and tap Request to join." action="Explore posts" onAction={() => setTab('explore')} />}
          renderItem={({ item, index }) => tab === 'explore' ? (
            <HelpCard index={index} cat={item.category} title={item.title} body={item.body} offer={item.offer} meta={`${who(item.poster)} · ${ago(item.createdAt)}`} onPress={() => { setNote(''); setSel(item); }}
              badge={item.myRequest ? STATUS[item.myRequest] : undefined} />
          ) : tab === 'mine' ? (
            <HelpCard index={index} cat={item.category} title={item.title} body={item.body} offer={item.offer} meta={`Posted ${ago(item.createdAt)} · ${item.total} ${item.total === 1 ? 'request' : 'requests'}`} onPress={() => r.push(`/board-requests/${item.id}`)}
              badge={item.status === 'filled' ? { label: 'You chose someone', color: colors.success } : item.pending ? { label: `${item.pending} new ${item.pending === 1 ? 'request' : 'requests'}. Tap to review`, color: colors.violet } : { label: 'Waiting for requests', color: colors.muted }}>
              <Pressable onPress={() => setDel(item)} accessibilityLabel="Remove post" style={{ alignSelf: 'flex-end', padding: 6, marginTop: 4 }}><Ionicons name="trash-outline" size={20} color={colors.error} /></Pressable>
            </HelpCard>
          ) : (
            <HelpCard index={index} cat={item.post.category} title={item.post.title} body={item.post.body} offer={item.post.offer} meta={`Requested ${ago(item.at)}`} badge={STATUS[item.status]}>
              {item.poster && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Avatar uri={item.poster.photo} size={44} /><View style={{ flex: 1, marginLeft: 10 }}><Text style={type.section}>{item.poster.name}{item.poster.age ? `, ${item.poster.age}` : ''}</Text><Text style={type.caption}>She accepted you</Text></View>
                <Btn style={{ minHeight: 40 }} icon="chatbubble" title="Message" onPress={() => message(item.poster!.id)} /></View>}
            </HelpCard>)} />}
      {USE_BACKEND && <Pop from={0.5} style={{ position: 'absolute', right: 20, bottom: 24 }}>
        <Pressable onPress={() => r.push('/board-new')} accessibilityLabel="New post" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.violet, borderRadius: 5, paddingHorizontal: 18, height: 52, shadowColor: '#3B2AA8', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
          <Ionicons name="add" size={24} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5, marginLeft: 6 }}>New post</Text></Pressable></Pop>}

      <Sheet visible={!!sel} onClose={() => setSel(null)}>
        {!!sel && <>
          <HelpCard cat={sel.category} title={sel.title} body={sel.body} offer={sel.offer} full meta={`${who(sel.poster)} · ${ago(sel.createdAt)}`} />
          <View style={{ flexDirection: 'row', backgroundColor: colors.violetSoft, borderRadius: 5, padding: 12, marginBottom: 12 }}><Ionicons name="lock-closed-outline" size={18} color={colors.violet} style={{ marginRight: 10, marginTop: 1 }} />
            <Text style={[type.secondary, { flex: 1, color: colors.text }]}>Her name, photo and details stay hidden. She sees your profile and chooses one person. Only that person is connected to her.</Text></View>
          {sel.myRequest ? <Btn variant="secondary" disabled title={sel.myRequest === 'pending' ? 'Request sent' : 'You cannot request this again'} />
            : <><TextInput value={note} onChangeText={setNote} placeholder="Add a short note (optional). No phone numbers." multiline maxLength={200} placeholderTextColor="#A5A3BA" style={{ minHeight: 70, textAlignVertical: 'top', backgroundColor: colors.bg, borderRadius: 5, padding: 12, fontSize: 15, marginBottom: 12, color: colors.text }} accessibilityLabel="Note" />
              <Btn title="Request to join" icon="paper-plane" loading={sending} onPress={send} /></>}
          <Btn variant="ghost" title="Report this post" onPress={() => setRep(true)} />
        </>}
      </Sheet>
      <Sheet visible={rep} onClose={() => setRep(false)}><Text style={[type.title, { marginBottom: 8 }]}>Report this post</Text>{REASONS.map((x) => <Row key={x} icon="flag-outline" title={x} onPress={() => report(x)} />)}</Sheet>
      <Dialog visible={!!del} title="Remove this post?" text="People will no longer see it. It still counts toward this month's 2 free posts." confirm="Remove" danger onCancel={() => setDel(null)} onConfirm={remove} />
    </Screen>);
}
