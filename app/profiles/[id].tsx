import React, { useState } from 'react';
import { View, Text, ScrollView, Image, FlatList, Linking, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Header, Btn, Card, IntentBadge, InterestTag, Empty, Dialog, IconBtn, SectionTitle, FadeImage, FadeIn, Sheet, Row } from '@/components/ui';
import { ReportSheet } from '@/components/PersonSheet';
import { findPerson, usePeople, rememberPeople } from '@/services/people';
import VerifiedCard from '@/components/VerifiedCard';
import { api } from '@/services/api';
import { useAppWidth } from '@/services/layout';
import { USE_BACKEND } from '@/services/config';
import { useApp } from '@/services/store';
import { useNearby } from '@/services/discovery';
import { approxDistance, compassLabel } from '@/services/geo';
import { useActions } from '@/services/actions';
import { colors, type, space, SOCIALS } from '@/constants/theme';
export default function FullProfile() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const insets = useSafeAreaInsets(); const a = useApp(); const act = useActions(); const width = useAppWidth(); const nb = useNearby(); usePeople();
  React.useEffect(() => { if (USE_BACKEND && id && !findPerson(id)) api.person(id).then((x) => rememberPeople([x.person])).catch(() => {}); }, [id]);
  const [menu, setMenu] = useState(false); const [report, setReport] = useState(false); const [block, setBlock] = useState(false); const [rm, setRm] = useState(false); const [viewer, setViewer] = useState<string | null>(null); const [idx, setIdx] = useState(0);
  const u = findPerson(id);
  if (!u || a.hiddenIds.includes(u.id)) return <Screen><Header title="Profile" /><Empty icon="person-remove-outline" title="Profile unavailable" text="This person may no longer be discoverable." action="Go back" onAction={() => r.back()} /></Screen>;
  const near = nb.all.find((n) => n.user.id === u.id); const st = act.state(u.id); const shared = u.interests.filter((i) => a.me.interests.includes(i));
  return (
    <Screen edges={['top']}>
      <Header title={u.name} right={<IconBtn name="ellipsis-horizontal" label="More options" onPress={() => setMenu(true)} />} />
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <FlatList horizontal pagingEnabled data={u.photos} keyExtractor={(p) => p} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <Pressable onPress={() => setViewer(item)}><FadeImage uri={item} style={{ width, height: width * 1.05 }} /></Pressable>} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>{u.photos.map((_, k) => <View key={k} style={{ width: k === idx ? 22 : 7, height: 7, borderRadius: 4, marginHorizontal: 3, backgroundColor: k === idx ? colors.violet : colors.border }} />)}</View>
        <FadeIn delay={100}><View style={{ padding: space.lg }}>
          <Text style={type.display}>{u.name}{u.age ? `, ${u.verified ? '~' : ''}${u.age}` : ''}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{u.intentions.map((i) => <IntentBadge key={i} k={i} />)}</View>
          {near && <Text style={[type.distance, { color: colors.violet, marginTop: 6 }]}>{approxDistance(near.distance)} · {compassLabel(near.bearing)}</Text>}
          <View style={{ marginVertical: space.lg }}>
            {st === 'none' && <Btn icon="person-add" title="Send connection request" onPress={() => act.send(u.id)} />}
            {st === 'sent' && <Btn variant="secondary" icon="time" title="Request sent. Tap to cancel" onPress={() => act.cancel(u.id)} />}
            {st === 'incoming' && <View style={{ flexDirection: 'row' }}><Btn style={{ flex: 1, marginRight: 8 }} title="Accept" onPress={() => act.accept(u.id)} /><Btn style={{ flex: 1 }} variant="secondary" title="Decline" onPress={() => act.decline(u.id)} /></View>}
            {st === 'connected' && <View style={{ flexDirection: 'row' }}><Btn style={{ flex: 1, marginRight: 8 }} icon="chatbubble" title="Message" onPress={() => r.push(`/chat/${u.id}`)} /><Btn style={{ flex: 1 }} variant="secondary" title="Remove" onPress={() => setRm(true)} /></View>}
          </View>
          <SectionTitle title="About" /><VerifiedCard u={u} /><Text style={type.body}>{u.bio}</Text>
          <SectionTitle title={shared.length ? `Interests (${shared.length} shared)` : 'Interests'} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{u.interests.map((i) => <InterestTag key={i} k={i} />)}</View>
          <SectionTitle title="Languages" /><Text style={type.body}>{u.languages.join(', ')}</Text>
          {u.socials.some((s) => s.visible) && <><SectionTitle title="Social profiles" />{u.socials.filter((s) => s.visible).map((s) => { const d = SOCIALS.find((x) => x.key === s.key)!; return (
            <Card key={s.key} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }} onPress={() => Linking.openURL(d.url(encodeURIComponent(s.handle))).catch(() => a.toast('Could not open link', 'err'))}>
              <Ionicons name={d.icon as any} size={24} color={colors.violet} /><Text style={[type.body, { flex: 1, marginLeft: 12, fontWeight: '600' }]}>{d.label}</Text><Ionicons name="open-outline" size={18} color={colors.muted} /></Card>); })}</>}
          <View style={{ flexDirection: 'row', marginTop: 24 }}><Btn style={{ flex: 1 }} variant="ghost" title="Report" onPress={() => setReport(true)} /><Btn style={{ flex: 1 }} variant="danger" title="Block" onPress={() => setBlock(true)} /></View>
        </View></FadeIn>
      </ScrollView>
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent><Pressable style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }} onPress={() => setViewer(null)}>{viewer && <Image source={{ uri: viewer }} resizeMode="contain" style={{ width, height: width * 1.4 }} />}
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={() => setViewer(null)} hitSlop={10} style={{ position: 'absolute', top: insets.top + 12, right: 16, width: 44, height: 44, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={26} color="#fff" /></Pressable></Pressable></Modal>
      <Sheet visible={menu} onClose={() => setMenu(false)}><Row icon="flag-outline" title="Report" onPress={() => { setMenu(false); setReport(true); }} /><Row icon="ban-outline" title="Block" danger onPress={() => { setMenu(false); setBlock(true); }} /></Sheet>
      <ReportSheet visible={report} userId={u.id} onClose={() => setReport(false)} onDone={() => r.back()} />
      <Dialog visible={block} title={`Block ${u.name}?`} text="They won't see you or be able to contact you." confirm="Block" danger onCancel={() => setBlock(false)} onConfirm={() => { act.block(u.id); setBlock(false); r.back(); }} />
      <Dialog visible={rm} title="Remove connection?" text={`${u.name} will no longer be able to message you.`} confirm="Remove" danger onCancel={() => setRm(false)} onConfirm={() => { act.remove(u.id); setRm(false); }} />
    </Screen>);
}
