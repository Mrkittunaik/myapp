import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, Pressable, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen, Header, IconBtn, Btn, Chip, Empty, Sheet, FadeImage, IntentBadge, Skeleton } from '@/components/ui';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { api, ApiError, DiscoverPerson } from '@/services/api';
import { useAppWidth } from '@/services/layout';
import { USE_BACKEND } from '@/services/config';
import { rememberPeople } from '@/services/people';
import { DEMO_USERS } from '@/services/demoData';
import { ageFrom } from '@/services/dob';
import { colors, type, space } from '@/constants/theme';

const LIKE = colors.dating; const MIN = 18, MAX = 80;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

// Photo cards of people in your age range. Swipe right or tap the heart = send a chat (connection) request; swipe left or tap the cross = skip.
export default function Discover() {
  const r = useRouter(); const a = useApp(); const act = useActions(); const width = useAppWidth(); const { height } = useWindowDimensions();
  const myAge = ageFrom(a.me.dob); const range: [number, number] = a.ageRange || [clamp((myAge ?? 25) - 4, MIN, MAX), clamp((myAge ?? 25) + 4, MIN, MAX)];
  const [deck, setDeck] = useState<DiscoverPerson[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false); const [draft, setDraft] = useState<[number, number]>(range); const [match, setMatch] = useState<DiscoverPerson | null>(null);
  const [last, setLast] = useState<{ p: DiscoverPerson; liked: boolean } | null>(null); const seen = useRef(new Set<string>()); const busy = useRef(false); const loadId = useRef(0);
  const key = range.join('-');

  const load = useCallback(async (reset: boolean) => {
    if (busy.current && !reset) return; busy.current = true; const my = ++loadId.current; if (reset) { setLoading(true); seen.current.clear(); setDeck([]); } setErr(null);
    try {
      let list: DiscoverPerson[];
      if (USE_BACKEND) list = (await api.discover(range[0], range[1])).people;
      else list = DEMO_USERS.filter((u) => u.age! >= range[0] && u.age! <= range[1] && !a.hiddenIds.includes(u.id) && (a.requests[u.id] || 'none') === 'none' && !passedDemo.has(u.id)).map((u) => ({ ...u, likedYou: a.requests[u.id] === 'incoming' }));
      if (my !== loadId.current) return;
      rememberPeople(list);
      setDeck((d) => { const fresh = list.filter((p) => !seen.current.has(p.id)); fresh.forEach((p) => seen.current.add(p.id)); return reset ? fresh : [...d, ...fresh]; });
    } catch (e) { if (my === loadId.current) setErr(e instanceof ApiError && e.code === 'face_required' ? 'Verify your face first to find people.' : e instanceof ApiError ? e.message : 'Could not load people. Check your connection.'); }
    finally { busy.current = false; if (my === loadId.current) setLoading(false); }
  }, [key]);
  useEffect(() => { load(true); }, [key]);
  useEffect(() => { if (!loading && deck.length > 0 && deck.length < 3) load(false); }, [deck.length]);

  const top = deck[0]; const next = deck[1];
  const finish = (p: DiscoverPerson, liked: boolean) => {
    setDeck((d) => d.filter((x) => x.id !== p.id)); setLast({ p, liked });
    if (!liked) { if (USE_BACKEND) api.pass(p.id).catch(() => {}); else passedDemo.add(p.id); return; }
    if (!USE_BACKEND) { act.send(p.id); return; }
    api.like(p.id).then((res) => {
      a.update((s) => ({ requests: { ...s.requests, [p.id]: res.state === 'connected' ? 'connected' : 'sent' } }));
      if (res.match) setMatch(p); else a.toast(`Chat request sent to ${p.name}`);
    }).catch((e) => { setDeck((d) => [p, ...d.filter((x) => x.id !== p.id)]); a.toast(e instanceof ApiError ? e.message : 'Could not send. Try again.', 'err'); });
  };

  // Undo the last swipe: a skip is un-skipped, a heart is taken back (the request is cancelled) unless they already accepted.
  const undo = async () => {
    const l = last; if (!l) return; setLast(null);
    try {
      if (USE_BACKEND) { if (l.liked) { if (a.requests[l.p.id] === 'connected') { a.toast('They already accepted, so this cannot be undone.', 'err'); return; } await api.connect(l.p.id, 'cancel'); a.update((s) => ({ requests: { ...s.requests, [l.p.id]: 'none' } })); } else await api.unpass(l.p.id); }
      else if (l.liked) act.cancel(l.p.id); else passedDemo.delete(l.p.id);
      seen.current.add(l.p.id); setDeck((d) => [l.p, ...d.filter((x) => x.id !== l.p.id)]);
    } catch (e) { setLast(l); a.toast(e instanceof ApiError ? e.message : 'Could not undo. Try again.', 'err'); }
  };
  // Card position. Swipe past 110 px (or a quick flick) to decide.
  const pos = useRef(new Animated.ValueXY()).current; const cur = useRef<DiscoverPerson | undefined>(undefined); cur.current = top;
  const fly = (dir: 1 | -1) => Animated.timing(pos, { toValue: { x: dir * width * 1.3, y: 20 }, duration: 220, useNativeDriver: true }).start(() => { const p = cur.current; pos.setValue({ x: 0, y: 0 }); if (p) finish(p, dir === 1); });
  const flyRef = useRef(fly); flyRef.current = fly;
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => { if (g.dx > 110 || g.vx > 0.9) flyRef.current(1); else if (g.dx < -110 || g.vx < -0.9) flyRef.current(-1); else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start(); },
  }), []);
  const rot = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-14deg', '0deg', '14deg'] });
  const likeO = pos.x.interpolate({ inputRange: [20, 120], outputRange: [0, 1], extrapolate: 'clamp' }); const nopeO = pos.x.interpolate({ inputRange: [-120, -20], outputRange: [1, 0], extrapolate: 'clamp' });
  const cw = width - 40; const ch = Math.min(height * 0.62, cw * 1.35);

  const card = (p: DiscoverPerson, front: boolean) => (
    <Pressable key={p.id} disabled={!front} onPress={() => r.push(`/profiles/${p.id}`)} accessibilityLabel={`${p.name}, ${p.age}. Open profile`} style={{ width: cw, height: ch, borderRadius: 5, overflow: 'hidden', backgroundColor: '#fff' }}>
      <FadeImage uri={p.photo} style={{ width: cw, height: ch }} />
      <LinearGradient colors={['transparent', 'rgba(10,10,30,0.82)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>{p.name}</Text><Text style={{ color: '#fff', fontSize: 24, marginLeft: 8 }}>{p.age}</Text>
          {p.verified && <Ionicons name="checkmark-circle" size={20} color="#7CD7A8" style={{ marginLeft: 8 }} />}
        </View>
        {!!p.bio && <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 4, fontSize: 14 }} numberOfLines={2}>{p.bio}</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>{p.distanceKm != null && <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginTop: 4, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="location" size={12} color="#fff" /><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 3 }}>about {p.distanceKm} km away</Text></View>}{p.intentions.slice(0, 2).map((i) => <IntentBadge key={i} k={i} />)}</View>
      </LinearGradient>
      {p.likedYou && <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: LIKE, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Wants to connect with you</Text></View>}
      {front && <><Animated.View style={{ position: 'absolute', top: 40, left: 20, opacity: likeO, borderWidth: 3, borderColor: '#1FA971', borderRadius: 5, paddingHorizontal: 10, transform: [{ rotate: '-12deg' }] }}><Text style={{ color: '#1FA971', fontSize: 30, fontWeight: '900' }}>HI!</Text></Animated.View>
        <Animated.View style={{ position: 'absolute', top: 40, right: 20, opacity: nopeO, borderWidth: 3, borderColor: colors.error, borderRadius: 5, paddingHorizontal: 10, transform: [{ rotate: '12deg' }] }}><Text style={{ color: colors.error, fontSize: 30, fontWeight: '900' }}>SKIP</Text></Animated.View></>}
    </Pressable>);

  return (
    <Screen edges={['top']}>
      <Header title="Find friends" right={<IconBtn name="options-outline" label="Age range" onPress={() => { setDraft(range); setSheet(true); }} />} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}><Chip icon="calendar-outline" label={`Ages ${range[0]} to ${range[1]}`} selected onPress={() => { setDraft(range); setSheet(true); }} />
        {deck.some((p) => p.likedYou) && <Chip icon="heart" color={LIKE} label={`${deck.filter((p) => p.likedYou).length} liked you`} selected />}</View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {loading ? <Skeleton h={ch} style={{ width: cw }} />
        : err ? <Empty icon="cloud-offline-outline" title="Could not load people" text={err} action="Try again" onAction={() => load(true)} />
        : !top ? <Empty icon="people-outline" title="No more people in this age range" text="Widen the age range or check back later. New people join all the time." action="Change age range" onAction={() => { setDraft(range); setSheet(true); }} />
        : <View style={{ width: cw, height: ch }}>
            {next && <View style={{ position: 'absolute', transform: [{ scale: 0.94 }], top: 10, opacity: 0.9 }}>{card(next, false)}</View>}
            <Animated.View {...pan.panHandlers} style={{ position: 'absolute', transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate: rot }] }}>{card(top, true)}</Animated.View>
          </View>}
      </View>
      {!!top && !loading && !err && <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18 }}>
        <Pressable onPress={undo} disabled={!last} accessibilityLabel="Undo last swipe" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginRight: 22, opacity: last ? 1 : 0.35 }}><Ionicons name="arrow-undo" size={22} color={colors.violet} /></Pressable>
        <Pressable onPress={() => fly(-1)} accessibilityLabel={`Skip ${top.name}`} style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}><Ionicons name="close" size={32} color={colors.error} /></Pressable>
        <Pressable onPress={() => fly(1)} accessibilityLabel={`Send a chat request to ${top.name}`} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: LIKE, alignItems: 'center', justifyContent: 'center', marginLeft: 28 }}><Ionicons name="heart" size={34} color="#fff" /></Pressable>
      </View>}
      <Sheet visible={sheet} onClose={() => setSheet(false)}>
        <Text style={[type.title, { marginBottom: 4 }]}>Age range</Text><Text style={[type.secondary, { marginBottom: 14 }]}>Only people in this range appear as cards.</Text>
        {(['Youngest', 'Oldest'] as const).map((lab, i) => (
          <View key={lab} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[type.section, { flex: 1 }]}>{lab}</Text>
            <IconBtn name="remove" label={`Lower ${lab} age`} onPress={() => setDraft((d) => (i === 0 ? [clamp(d[0] - 1, MIN, d[1]), d[1]] : [d[0], clamp(d[1] - 1, d[0], MAX)]))} />
            <Text style={[type.title, { width: 56, textAlign: 'center' }]}>{draft[i]}</Text>
            <IconBtn name="add" label={`Raise ${lab} age`} onPress={() => setDraft((d) => (i === 0 ? [clamp(d[0] + 1, MIN, d[1]), d[1]] : [d[0], clamp(d[1] + 1, d[0], MAX)]))} />
          </View>))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {([[18, 24], [25, 30], [31, 40], [41, 60]] as [number, number][]).map((x) => <Chip key={x.join()} label={`${x[0]} to ${x[1]}`} selected={draft[0] === x[0] && draft[1] === x[1]} onPress={() => setDraft(x)} />)}
          {myAge != null && <Chip label="Around my age" selected={draft[0] === clamp(myAge - 4, MIN, MAX) && draft[1] === clamp(myAge + 4, MIN, MAX)} onPress={() => setDraft([clamp(myAge - 4, MIN, MAX), clamp(myAge + 4, MIN, MAX)])} />}
        </View>
        <Btn title="Show people" onPress={() => { setSheet(false); a.set({ ageRange: draft }); }} />
      </Sheet>
      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)} statusBarTranslucent>
        <LinearGradient colors={['#E0488B', '#7C2BD9']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', marginBottom: 24 }}>It's a Match!</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' }}><FadeImage uri={a.me.photo} style={{ width: 120, height: 120 }} /></View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginHorizontal: -14, zIndex: 2 }}><Ionicons name="heart" size={22} color={LIKE} /></View>
            <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' }}><FadeImage uri={match?.photo} style={{ width: 120, height: 120 }} /></View>
          </View>
          <Text style={{ color: '#fff', fontSize: 16, marginBottom: 28 }}>{match?.name} wants to connect with you too!</Text>
          <Btn style={{ alignSelf: 'stretch', backgroundColor: '#fff' }} textColor={LIKE} title="Say something interesting" icon="chatbubble" onPress={() => { const id = match!.id; setMatch(null); r.push(`/chat/${id}`); }} />
          <Pressable onPress={() => setMatch(null)} style={{ padding: 16 }} accessibilityRole="button"><Text style={{ color: '#fff', fontWeight: '700' }}>Keep swiping</Text></Pressable>
        </LinearGradient>
      </Modal>
    </Screen>);
}
const passedDemo = new Set<string>(); // demo mode only: skipped people stay hidden until the app restarts
