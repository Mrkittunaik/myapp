import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Sheet, Btn, IntentBadge, InterestTag, Dialog, Row, FadeImage } from './ui';
import { colors, space, type, radius } from '@/constants/theme';
import { Nearby } from '@/types';
import { approxDistance, compassLabel } from '@/services/geo';
import { useActions } from '@/services/actions';
import { useApp } from '@/services/store';
import { VerifiedPill } from './VerifiedCard';

export const REASONS = ['Fake profile or spam', 'Inappropriate photos or content', 'Harassment or hate', 'Underage user', 'Something else'];
export function ReportSheet({ visible, userId, onClose, onDone }: { visible: boolean; userId?: string; onClose: () => void; onDone?: () => void }) {
  const act = useActions();
  return (<Sheet visible={visible} onClose={onClose}><Text style={[type.title, { marginBottom: 8 }]}>Report this person</Text>
    <Text style={[type.secondary, { marginBottom: 12 }]}>Pick the closest reason. Our team reviews every report.</Text>
    {REASONS.map((r) => <Row key={r} icon="flag-outline" title={r} onPress={() => { if (!userId) return; act.report(userId, r); onClose(); onDone?.(); }} />)}</Sheet>);
}
export default function PersonSheet({ item, onClose }: { item: Nearby | null; onClose: () => void }) {
  const r = useRouter(); const act = useActions(); const { me, waved } = useApp();
  const [report, setReport] = useState(false); const [block, setBlock] = useState(false);
  if (!item) return null;
  const u = item.user, st = act.state(u.id);
  const shared = u.interests.filter((i) => me.interests.includes(i));
  return (
    <>
      <Sheet visible={!report && !block} onClose={onClose}>
        <View style={{ flexDirection: 'row' }}>
          <FadeImage uri={u.photo} style={{ width: 104, height: 104, borderRadius: 5 }} />
          <View style={{ flex: 1, marginLeft: space.lg }}>
            <Text style={type.title}>{u.name}{u.age ? `, ${u.verified ? '~' : ''}${u.age}` : ''}</Text><VerifiedPill u={u} />
            <Text style={[type.distance, { color: colors.violet, marginTop: 2 }]}>{approxDistance(item.distance)} · {compassLabel(item.bearing)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{u.intentions.map((i) => <IntentBadge key={i} k={i} />)}</View>
          </View>
        </View>
        <Text style={[type.body, { marginTop: space.md }]}>{u.bio}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: space.lg }}>{u.interests.map((i) => <InterestTag key={i} k={i} />)}</View>
        {shared.length > 0 && <Text style={[type.caption, { marginBottom: 8 }]}>{shared.length} shared interest{shared.length > 1 ? 's' : ''} with you</Text>}
        <Btn title="View full profile" onPress={() => { onClose(); r.push(`/profiles/${u.id}`); }} />
        <View style={{ height: 8 }} />
        {st === 'none' && <><Btn variant="secondary" icon="person-add" title="Send connection request" onPress={() => act.send(u.id)} /><View style={{ height: 6 }} /><Btn variant="ghost" icon="hand-left-outline" title={waved.includes(u.id) ? 'Hi sent' : 'Say hi'} disabled={waved.includes(u.id)} onPress={() => act.wave(u.id)} /></>}
        {st === 'sent' && <Btn variant="secondary" icon="time" title="Request sent. Tap to cancel" onPress={() => act.cancel(u.id)} />}
        {st === 'incoming' && <Btn variant="secondary" icon="checkmark" title="Accept request" onPress={() => act.accept(u.id)} />}
        {st === 'connected' && <Btn variant="secondary" icon="chatbubble" title="Message" onPress={() => { onClose(); r.push(`/chat/${u.id}`); }} />}
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Btn style={{ flex: 1, paddingHorizontal: 8 }} variant="ghost" title="Dismiss" onPress={onClose} />
          <Btn style={{ flex: 1, paddingHorizontal: 8 }} variant="ghost" title="Report" onPress={() => setReport(true)} />
          <Btn style={{ flex: 1, paddingHorizontal: 8 }} variant="ghost" title="Block" onPress={() => setBlock(true)} />
        </View>
      </Sheet>
      <ReportSheet visible={report} userId={u.id} onClose={() => setReport(false)} onDone={onClose} />
      <Dialog visible={block} title={`Block ${u.name}?`} text="They will no longer see you or be able to contact you. You can unblock them in Settings." confirm="Block" danger
        onCancel={() => setBlock(false)} onConfirm={() => { act.block(u.id); setBlock(false); onClose(); }} />
    </>
  );
}
