import React from 'react';
import { View, Text } from 'react-native';
import { Card, Btn, IntentBadge, FadeImage, FadeIn } from './ui';
import { colors, radius, type } from '@/constants/theme';
import { Nearby } from '@/types';
import { approxDistance, compassLabel } from '@/services/geo';
import { useActions } from '@/services/actions';
import { useApp } from '@/services/store';
import { VerifiedPill } from './VerifiedCard';
export default function PersonCard({ n, onOpen, compact, index = 0 }: { n: Nearby; onOpen: () => void; compact?: boolean; index?: number }) {
  const act = useActions(); const { me } = useApp(); const st = act.state(n.user.id);
  const shared = n.user.interests.filter((i) => me.interests.includes(i)).length;
  if (compact) return (
    <FadeIn delay={index * 80} y={18}>
      <Card onPress={onOpen} style={{ width: 164, marginRight: 12, padding: 0, overflow: 'hidden' }}>
        <FadeImage uri={n.user.photo} style={{ width: 164, height: 158 }} />
        <View style={{ padding: 12 }}>
          <Text style={[type.section, { fontSize: 17 }]} numberOfLines={1}>{n.user.name}</Text><VerifiedPill u={n.user} />
          <Text style={[type.distance, { color: colors.violet }]}>{approxDistance(n.distance)} · {compassLabel(n.bearing)}</Text>
          <View style={{ flexDirection: 'row' }}><IntentBadge k={n.user.intentions[0]} /></View>
        </View>
      </Card>
    </FadeIn>);
  return (
    <FadeIn delay={index * 70} y={16}>
      <Card onPress={onOpen} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          <FadeImage uri={n.user.photo} style={{ width: 76, height: 76, borderRadius: 5 }} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={type.section}>{n.user.name}</Text><VerifiedPill u={n.user} />
            <Text style={[type.distance, { color: colors.violet }]}>{approxDistance(n.distance)} · {compassLabel(n.bearing)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{n.user.intentions.slice(0, 2).map((i) => <IntentBadge key={i} k={i} />)}</View>
            {shared > 0 && <Text style={[type.caption, { marginTop: 6 }]}>{shared} shared interest{shared > 1 ? 's' : ''}</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <Btn style={{ flex: 1, minHeight: 46, marginRight: 8 }} variant="secondary" title="View profile" onPress={onOpen} />
          <Btn style={{ flex: 1, minHeight: 46 }} title={st === 'none' ? 'Connect' : st === 'sent' ? 'Requested' : st === 'connected' ? 'Connected' : 'Accept'}
            disabled={st === 'sent' || st === 'connected'} onPress={() => (st === 'incoming' ? act.accept(n.user.id) : act.send(n.user.id))} />
        </View>
      </Card>
    </FadeIn>);
}
