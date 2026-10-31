import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, SearchBar, Card, Avatar, IntentBadge, Chip, Empty, FadeIn } from '@/components/ui';
import { useApp } from '@/services/store';
import { useNearby } from '@/services/discovery';
import { usePeople } from '@/services/people';
import { USE_BACKEND } from '@/services/config';
import { approxDistance } from '@/services/geo';
import { INTERESTS, intentOf, interestOf, colors, type } from '@/constants/theme';
export default function Search() {
  const r = useRouter(); const a = useApp(); const nb = useNearby(); const people = usePeople(); const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const want = a.me.interestedIn === 'Women' ? 'Woman' : a.me.interestedIn === 'Men' ? 'Man' : null;
  // Follows the same rules as discovery: hidden people stay hidden, "Show me" applies, and strangers must be inside your radius.
  // People you already have a connection state with stay searchable.
  const allowed = (u: any) => !a.hiddenIds.includes(u.id) && (!want || u.gender === want) && ((a.requests[u.id] || 'none') !== 'none' || (nb.all.find((x) => x.user.id === u.id)?.distance ?? Infinity) <= a.radius);
  const pool = USE_BACKEND ? [...new Map([...nb.all.map((n) => n.user), ...people.all.filter((p) => (a.requests[p.id] || 'none') !== 'none')].map((u) => [u.id, u])).values()] : people.all;
  const res = term ? pool.filter((u) => allowed(u) && [u.name, u.bio, ...u.interests.map((i) => interestOf(i)?.label || i), ...u.intentions.map((i) => intentOf(i).label)].join(' ').toLowerCase().includes(term)) : [];
  return (
    <Screen><Header title="Search" />
      <View style={{ paddingHorizontal: 16 }}><SearchBar value={q} onChangeText={setQ} placeholder="Name, interest or what they want" autoFocus /></View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}>
        {!term ? (<>{!a.nearbyMode && <Text style={[type.caption, { marginBottom: 10 }]}>Nearby Mode is off, so only your connections show up in search.</Text>}<Text style={[type.secondary, { marginBottom: 10 }]}>Try an interest:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{INTERESTS.slice(0, 8).map((i) => <Chip key={i.key} icon={i.icon} label={i.label} onPress={() => setQ(i.label)} />)}</View></>)
          : res.length === 0 ? <Empty icon="search-outline" title="No one found" text="Try a different name or interest." />
          : res.map((u, i) => { const n = nb.all.find((x) => x.user.id === u.id); return (
            <FadeIn key={u.id} delay={i * 50}><Card onPress={() => r.push(`/profiles/${u.id}`)} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={u.photo} size={52} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={type.section}>{u.name}{u.age ? `, ${u.age}` : ''}</Text>
                {n && <Text style={[type.distance, { color: colors.violet }]}>{approxDistance(n.distance)}</Text>}<View style={{ flexDirection: 'row' }}><IntentBadge k={u.intentions[0]} /></View></View></Card></FadeIn>); })}
      </ScrollView>
    </Screen>);
}
