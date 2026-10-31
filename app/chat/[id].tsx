import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { persistPhoto } from '@/services/photoStore';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, IconBtn, Empty, Banner, Dialog, Pop, Sheet, Row } from '@/components/ui';
import { ReportSheet } from '@/components/PersonSheet';
import { findPerson, usePeople } from '@/services/people';
import { USE_BACKEND } from '@/services/config';
import { api, ApiError } from '@/services/api';
import { uploadImage } from '@/services/profileSave';
import { useSync } from '@/services/sync';
import { usePullRefresh } from '@/services/refresh';
import { onPeerEvent, sendLive } from '@/services/realtime';
import { MSG_KEEP } from '@/services/config';
import VerifiedCard from '@/components/VerifiedCard';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { Message } from '@/types';
import { Icebreakers } from '@/components/HomeCards';
import { icebreakers } from '@/services/extras';
import { hm, dayLabel, sameDay } from '@/services/time';
import { colors, type } from '@/constants/theme';
const EMOJI = ['😀', '😂', '😍', '👍', '🙏', '🎉', '🔥', '😊', '😢', '👋'];
const REPLIES = ['Haha, nice!', 'That sounds great.', 'Tell me more?', 'Same here!', 'Want to grab a coffee sometime?', 'Ha, I was just thinking that.'];
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>(); const a = useApp(); const act = useActions(); const r = useRouter(); usePeople(); const { fast, sync } = useSync(); const pr = usePullRefresh();
  const u = findPerson(id);
  const [text, setText] = useState(''); const [rep, setRep] = useState(false); const [blk, setBlk] = useState(false); const [menu, setMenu] = useState(false); const [clr, setClr] = useState(false);
  const [emoji, setEmoji] = useState(false); const [sel, setSel] = useState<Message | null>(null); const [typing, setTyping] = useState(false);
  const msgs = a.messages[id!] || []; const ref = useRef<FlatList>(null); const timer = useRef<any>(null); const here = useRef(true); const mutedRef = useRef(false);
  const muted = a.muted.includes(id!); mutedRef.current = muted;
  useEffect(() => { if (id) a.set({ readChats: { ...a.readChats, [id]: Date.now() } }); }, [id, msgs.length]);
  // The pending demo reply is kept if you leave: it then arrives as a message notification.
  // Live typing + read receipts (backend mode, over the live channel; nothing is stored).
  const [peerRead, setPeerRead] = useState(0); const typingT = useRef<any>(null); const lastTypingSent = useRef(0);
  useEffect(() => onPeerEvent((e) => {
    if (e.from !== id) return;
    if (e.t === 'read') setPeerRead(e.at);
    else { setTyping(true); clearTimeout(typingT.current); typingT.current = setTimeout(() => setTyping(false), 4000); }
  }), [id]);
  useEffect(() => { if (USE_BACKEND && id && msgs.some((m) => !m.mine)) sendLive({ t: 'read', to: id }); }, [id, msgs.length]);
  useEffect(() => { if (USE_BACKEND) setTyping(false); }, [msgs.length]); // they sent it, so they stopped typing
  const onType = (t: string) => { setText(t); if (USE_BACKEND && t && Date.now() - lastTypingSent.current > 2500) { lastTypingSent.current = Date.now(); sendLive({ t: 'typing', to: id! }); } };
  useEffect(() => { here.current = true; fast(true); return () => { here.current = false; fast(false); }; }, []);
  if (!u || a.requests[u.id] !== 'connected') return <Screen><Header title="Chat" /><Empty icon="lock-closed-outline" title="Not connected" text="You can message people after a connection request is accepted." action="Go back" onAction={() => r.back()} /></Screen>;
  const cid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const patch = (mid: string, p: Partial<Message>) => a.update((s) => ({ messages: { ...s.messages, [id!]: (s.messages[id!] || []).map((x) => (x.id === mid ? { ...x, ...p } : x)) } }));
  // Backend: show the message at once, then send it. Failed ones can be tapped to retry.
  const deliver = async (m: Message, localImage?: string) => {
    try { const image = localImage ? await uploadImage(localImage) : undefined; await api.sendMessage(id!, { id: m.id, text: m.text || undefined, image }); patch(m.id, { pending: false, failed: false }); sync(); }
    catch (e) { patch(m.id, { pending: false, failed: true }); a.toast(e instanceof ApiError ? e.message : 'Could not send. Tap the message to retry.', 'err'); }
  };
  const push = (m: Message) => a.update((s) => ({ messages: { ...s.messages, [id!]: [...(s.messages[id!] || []), m] } }));
  const scroll = () => setTimeout(() => ref.current?.scrollToEnd(), 60);
  // Demo only: the fictional person "types" and answers. Real chat needs the backend.
  const reply = () => { if (USE_BACKEND) return; clearTimeout(timer.current); setTyping(true); timer.current = setTimeout(() => {
    const text = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    setTyping(false); push({ id: 'r' + Date.now(), mine: false, text, at: Date.now() }); scroll();
    if (!here.current && !mutedRef.current) a.notify('messages', 'chatbubble', `${u!.name}: ${text}`, `/chat/${id}`);
  }, 1700); };
  const send = () => { const t = text.trim(); if (!t) return; const m: Message = { id: USE_BACKEND ? cid() : String(Date.now()), mine: true, text: t, at: Date.now(), pending: USE_BACKEND }; push(m); setText(''); setEmoji(false); scroll(); if (USE_BACKEND) deliver(m); else reply(); };
  const sendImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (res.canceled) return;
      const local = persistPhoto(res.assets[0].uri); const m: Message = { id: USE_BACKEND ? cid() : String(Date.now()), mine: true, text: '', image: local, at: Date.now(), pending: USE_BACKEND }; push(m); scroll(); if (USE_BACKEND) deliver(m, local); else reply();
    } catch { a.toast('Could not open your photos. Check photo permission in Settings.', 'err'); }
  };
  const del = (m: Message) => { if (USE_BACKEND && m.mine && !m.pending && !m.failed) api.deleteMessage(id!, m.id).catch(() => {}); a.update((s) => ({ messages: { ...s.messages, [id!]: (s.messages[id!] || []).filter((x) => x.id !== m.id) } })); };
  const lastMine = msgs.map((m) => m.mine).lastIndexOf(true);
  const lastRead = USE_BACKEND ? [...msgs].reverse().find((m) => m.mine && !m.pending && !m.failed && m.at <= peerRead) : undefined;
  const seenId = USE_BACKEND ? (lastRead?.id ?? null) : lastMine >= 0 && msgs.slice(lastMine + 1).some((m) => !m.mine) ? msgs[lastMine].id : null;
  return (
    <Screen><Header title={u.name + (muted ? ' (muted)' : '')} right={<View style={{ flexDirection: 'row' }}><IconBtn name="person-circle-outline" label={`View ${u.name}'s profile`} onPress={() => r.push(`/profiles/${u.id}`)} /><View style={{ width: 8 }} /><IconBtn name="ellipsis-horizontal" label="Options" onPress={() => setMenu(true)} /></View>} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList showsVerticalScrollIndicator={false} ref={ref} refreshing={pr.refreshing} onRefresh={pr.onRefresh} data={msgs} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 16, flexGrow: 1 }} onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={<>{USE_BACKEND && <Banner icon="time-outline" text={`Messages disappear 3 hours after they are sent. Only the latest ${MSG_KEEP} are kept.`} />}{!USE_BACKEND && <Banner icon="flask" tone="warn" text="Demo chat. Messages are stored on this device only and replies are automatic." />}<VerifiedCard u={u} /></>}
          ListEmptyComponent={<Empty icon="chatbubble-outline" title="Say hello" text={`Start the conversation with ${u.name}.`} />}
          ListFooterComponent={typing ? <Text style={[type.caption, { marginTop: 4 }]}>{u.name} is typing…</Text> : null}
          renderItem={({ item, index }) => (<>
            {(index === 0 || !sameDay(msgs[index - 1].at, item.at)) && <Text style={[type.caption, { textAlign: 'center', marginVertical: 10, fontWeight: '700' }]}>{dayLabel(item.at)}</Text>}
            <Pop from={0.85} style={{ alignSelf: item.mine ? 'flex-end' : 'flex-start', maxWidth: '78%', marginBottom: 8 }}>
            <Pressable onPress={() => { if (item.failed) { patch(item.id, { failed: false, pending: true }); deliver(item, item.image && !/^https?:/.test(item.image) ? item.image : undefined); } }} onLongPress={() => setSel(item)} delayLongPress={300} accessibilityLabel={item.failed ? 'Not sent. Tap to retry' : 'Message. Long press for options'}>
              <View style={{ backgroundColor: item.mine ? colors.violet : '#fff', padding: item.image ? 4 : 12, borderRadius: 5, borderBottomRightRadius: 5, borderBottomLeftRadius: 5 }}>
                {!!item.image && <Image source={{ uri: item.image }} style={{ width: 200, height: 240, borderRadius: 5 }} resizeMode="cover" />}
                {!!item.text && <Text style={{ color: item.mine ? '#fff' : colors.text, fontSize: 15 }}>{item.text}</Text>}
              </View></Pressable>
            <Text style={[type.caption, { alignSelf: item.mine ? 'flex-end' : 'flex-start', marginTop: 2 }]}>{item.failed ? 'Not sent. Tap to retry' : item.pending ? 'Sending…' : hm(item.at)}{item.id === seenId && !item.failed ? ' · Seen' : ''}</Text></Pop></>)} />
        {msgs.length < 3 && !text && !typing && <Icebreakers items={icebreakers(u, a.me)} onPick={setText} />}
        {emoji && <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 48, backgroundColor: '#fff' }} contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}>
          {EMOJI.map((e) => <Pressable key={e} onPress={() => setText(text + e)} accessibilityLabel={`Add ${e}`} style={{ padding: 8 }}><Text style={{ fontSize: 24 }}>{e}</Text></Pressable>)}</ScrollView>}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable onPress={sendImage} accessibilityLabel="Send a photo" hitSlop={6} style={{ padding: 6 }}><Ionicons name="image-outline" size={24} color={colors.violet} /></Pressable>
          <Pressable onPress={() => setEmoji(!emoji)} accessibilityLabel="Emoji" hitSlop={6} style={{ padding: 6 }}><Ionicons name={emoji ? 'happy' : 'happy-outline'} size={24} color={colors.violet} /></Pressable>
          <TextInput value={text} onChangeText={onType} placeholder="Message" multiline maxLength={1000} style={{ flex: 1, maxHeight: 100, backgroundColor: 'rgba(246,245,251,0.9)', borderRadius: 5, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15.5, marginLeft: 4 }} accessibilityLabel="Message" />
          <Pressable onPress={send} disabled={!text.trim()} accessibilityLabel="Send" style={{ width: 44, height: 44, borderRadius: 5, backgroundColor: text.trim() ? colors.violet : colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}><Ionicons name="send" size={20} color="#fff" /></Pressable>
        </View></KeyboardAvoidingView>
      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <Row icon={muted ? 'volume-high-outline' : 'volume-mute-outline'} title={muted ? 'Unmute conversation' : 'Mute conversation'} onPress={() => { setMenu(false); a.set({ muted: muted ? a.muted.filter((x) => x !== id) : [...a.muted, id!] }); a.toast(muted ? 'Unmuted' : 'Muted'); }} />
        <Row icon="trash-outline" title="Clear chat" onPress={() => { setMenu(false); setClr(true); }} />
        <Row icon="flag-outline" title="Report" onPress={() => { setMenu(false); setRep(true); }} />
        <Row icon="ban-outline" title="Block" danger onPress={() => { setMenu(false); setBlk(true); }} /></Sheet>
      <Sheet visible={!!sel} onClose={() => setSel(null)}>
        {!!sel?.text && <Row icon="copy-outline" title="Copy text" onPress={async () => { const t = sel.text; setSel(null); await Clipboard.setStringAsync(t); a.toast('Copied'); }} />}
        <Row icon="trash-outline" title="Delete message" danger onPress={() => { const m = sel!; setSel(null); del(m); a.toast('Message deleted'); }} /></Sheet>
      <ReportSheet visible={rep} userId={u.id} onClose={() => setRep(false)} onDone={() => r.back()} />
      <Dialog visible={clr} title="Clear this chat?" text="All messages in this conversation are removed from this device." confirm="Clear chat" danger onCancel={() => setClr(false)} onConfirm={() => { if (USE_BACKEND) api.clearChat(id!).catch(() => {}); a.update((s) => ({ messages: { ...s.messages, [id!]: [] } })); setClr(false); a.toast('Chat cleared'); }} />
      <Dialog visible={blk} title={`Block ${u.name}?`} text="This ends the conversation and removes the connection." confirm="Block" danger onCancel={() => setBlk(false)} onConfirm={() => { act.block(u.id); setBlk(false); r.back(); }} />
    </Screen>);
}
