import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl } from 'react-native';
import { useSync } from '@/services/sync';
import { useLive } from '@/services/realtime';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, IconBtn, Chip, Sheet, Card, Btn, Empty, Banner, Skeleton, IntentBadge, Toggle, FadeIn, SearchBar } from '@/components/ui';
import LocationBanner from '@/components/LocationBanner';
import Radar from '@/components/Radar';
import PersonCard from '@/components/PersonCard';
import PersonSheet from '@/components/PersonSheet';
import { useNearby } from '@/services/discovery';
import { useApp } from '@/services/store';
import { approxDistance, compassLabel } from '@/services/geo';
import { colors, type, space, RADII, INTENTS, interestOf } from '@/constants/theme';
import { radiusLabel } from '@/services/geo';
import { Nearby } from '@/types';
const lab = (m: number) => (radiusLabel(m));
export default function NearbyScreen() {
  const a = useApp(); const nb = useNearby(); const { sync } = useSync(); const live = useLive();
  // Keep only ids, and look the person up each render, so a radius change or block never leaves a stale card.
  const [selId, setSelId] = useState<string | null>(null); const [openId, setOpenId] = useState<string | null>(null); const [focused, setFocused] = useState(true);
  const sel = nb.eligible.find((n) => n.user.id === selId) || null; const open = nb.eligible.find((n) => n.user.id === openId) || null;
  const [radiusSheet, setRS] = useState(false); const [filterSheet, setFS] = useState(false); const [list, setList] = useState(false);
  const [q, setQ] = useState(''); const [sort, setSort] = useState<'close' | 'shared'>('close'); const [refreshing, setRef] = useState(false);
  useFocusEffect(useCallback(() => { nb.setHeadingActive(true); setFocused(true); return () => { nb.setHeadingActive(false); setFocused(false); }; }, []));
  const refresh = async () => { setRef(true); await Promise.allSettled([sync({ full: true }), nb.refresh()]); setTimeout(() => setRef(false), 600); if (nb.status === 'granted') a.toast('Nearby updated'); else a.toast(nb.backend ? 'Location is off. Turn it on to see people near you.' : 'Location is off. Showing sample people.', 'err'); };
  const sorted = [...nb.eligible].filter((n) => !q.trim() || (n.user.name + ' ' + n.user.bio + ' ' + n.user.interests.map((i) => interestOf(i)?.label || i).join(' ')).toLowerCase().includes(q.trim().toLowerCase())).sort((x, y) => sort === 'close' ? x.distance - y.distance : y.user.interests.filter((i) => a.me.interests.includes(i)).length - x.user.interests.filter((i) => a.me.interests.includes(i)).length);
  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: space.lg }}>
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={type.display}>Nearby</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: nb.status === 'granted' ? colors.success : colors.warning }} />
            <Text style={type.caption}>{nb.status === 'granted' ? (refreshing ? 'Updating…' : live ? 'Live · Location on' : 'Location on') : nb.status === 'loading' ? 'Locating…' : nb.status === 'undetermined' ? 'Location not allowed yet' : 'Location unavailable'}{nb.heading === null && nb.status === 'granted' ? ' · Compass unavailable' : ''}</Text></View></View>
        <IconBtn name="options-outline" label="Filters" badge={!!a.intentFilter} onPress={() => setFS(true)} />
        <View style={{ width: 8 }} /><IconBtn name={list ? 'radio-outline' : 'list'} label={list ? 'Show radar' : 'Open list'} onPress={() => setList(!list)} bg={list ? colors.violetSoft : '#fff'} color={list ? colors.violet : colors.text} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, alignItems: 'center' }}>
        <Chip label={`Radius ${lab(a.radius)}`} onPress={() => setRS(true)} selected />
        <View style={{ flex: 1 }} /><Text style={[type.caption, { marginRight: 8 }]}>Nearby Mode</Text><Toggle label="Nearby Mode" value={a.nearbyMode} onValueChange={(v) => a.set({ nearbyMode: v })} />
      </View>
      <View style={{ paddingHorizontal: space.lg }}><LocationBanner /></View>
      {!a.nearbyMode ? <Empty icon="eye-off-outline" title="Nearby Mode is off" text="You are hidden and discovery is paused. Turn it on to see people around you." action="Turn on" onAction={() => a.set({ nearbyMode: true })} />
      : nb.status === 'loading' ? <View style={{ padding: space.lg }}><Skeleton h={300} /></View>
      : list ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: space.lg, marginBottom: 8 }}><SearchBar value={q} onChangeText={setQ} placeholder="Search name or interest" /></View>
          <View style={{ flexDirection: 'row', paddingHorizontal: space.lg }}><Chip label="Closest first" selected={sort === 'close'} onPress={() => setSort('close')} /><Chip label="Shared interests" selected={sort === 'shared'} onPress={() => setSort('shared')} /></View>
          <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} data={sorted} keyExtractor={(n) => n.user.id} contentContainerStyle={{ padding: space.lg }} refreshing={refreshing} onRefresh={refresh}
            ListEmptyComponent={<Empty title="No one in range" text="Try a larger radius or clear your filters." action="Change radius" onAction={() => setRS(true)} />}
            renderItem={({ item, index }) => <PersonCard n={item} index={index} onOpen={() => setOpenId(item.user.id)} />} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.violet]} />}>
          <Radar people={nb.eligible} radius={a.radius} heading={nb.heading} selectedId={selId || undefined} onSelect={(n) => setSelId(n.user.id)} active={a.nearbyMode && focused} />
          <Text style={[type.caption, { textAlign: 'center', marginTop: 4 }]}>Exact distance from GPS (about 5 to 15 m outdoors, less accurate indoors).</Text>
          <View style={{ padding: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[type.section, { flex: 1 }]}>{nb.eligible.length} {nb.eligible.length === 1 ? 'person' : 'people'} nearby</Text>
              <Btn style={{ minHeight: 40 }} variant="secondary" title="Refresh" icon="refresh" onPress={refresh} />
            </View>
            {nb.eligible.length === 0 ? <Empty title="No one nearby" text="Nobody is within your radius right now." action="Increase radius" onAction={() => setRS(true)} />
            : sel ? <FadeIn key={sel.user.id} y={10}><Card onPress={() => setOpenId(sel.user.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}><Text style={type.section}>{sel.user.name}</Text><Text style={[type.distance, { color: colors.violet }]}>{approxDistance(sel.distance)} · {compassLabel(sel.bearing)}</Text><IntentBadge k={sel.user.intentions[0]} /></View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} /></Card></FadeIn>
            : <Text style={type.secondary}>Tap a profile on the radar to preview it.</Text>}
            <Btn style={{ marginTop: 12 }} variant="ghost" title="Open nearby list" onPress={() => setList(true)} />
          </View>
        </ScrollView>)}
      <Sheet visible={radiusSheet} onClose={() => setRS(false)}>
        <Text style={[type.title, { marginBottom: 8 }]}>Discovery radius</Text><Text style={[type.secondary, { marginBottom: 12 }]}>People beyond this distance won't appear.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{RADII.map((x) => <Chip key={x} label={lab(x)} selected={a.radius === x} onPress={() => { a.set({ radius: x }); setRS(false); }} />)}</View></Sheet>
      <Sheet visible={filterSheet} onClose={() => setFS(false)}>
        <Text style={[type.title, { marginBottom: 12 }]}>Filter by intention</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><Chip label="Everyone" selected={!a.intentFilter} onPress={() => { a.set({ intentFilter: null }); setFS(false); }} />
          {INTENTS.map((i) => <Chip key={i.key} icon={i.icon} label={i.short} selected={a.intentFilter === i.key} color={i.color} onPress={() => { a.set({ intentFilter: i.key }); setFS(false); }} />)}</View></Sheet>
      <PersonSheet item={open} onClose={() => setOpenId(null)} />
    </Screen>);
}
