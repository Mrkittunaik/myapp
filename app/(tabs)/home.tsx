import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Avatar, IconBtn, Card, Btn, SectionTitle, Empty, Skeleton, Banner, Row, FadeIn } from '@/components/ui';
import LocationBanner from '@/components/LocationBanner';
import PersonCard from '@/components/PersonCard';
import PersonSheet from '@/components/PersonSheet';
import { useApp } from '@/services/store';
import { useNearby } from '@/services/discovery';
import { useActions } from '@/services/actions';
import { usePeople } from '@/services/people';
import FaceBanner from '@/components/FaceBanner';
import { USE_BACKEND } from '@/services/config';
import { useSync } from '@/services/sync';
import { ago } from '@/services/time';
import { colors, type, space } from '@/constants/theme';
import { radiusLabel } from '@/services/geo';
import { IntentBadge } from '@/components/ui';
import { StatsRow, ProfileStrengthCard, SafetyTipCard } from '@/components/HomeCards';
import { profileChecks } from '@/services/extras';
let nearbyAlertSent = false; // demo nearby alert: at most one per app session
let skeletonSeen = false; // the placeholder is only shown the first time Home opens, not on every visit
export default function Home() {
  const r = useRouter(); const a = useApp(); const act = useActions(); const nb = useNearby(); const people = usePeople();
  const { sync } = useSync(); const [sel, setSel] = useState<any>(null); const [loading, setLoading] = useState(!skeletonSeen); const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await Promise.allSettled([sync({ full: true }), nb.refresh()]); setRefreshing(false); if (nb.status === 'granted') a.toast('Updated'); else a.toast(USE_BACKEND ? 'Location is off. Turn it on to see people near you.' : 'Location is off. Showing sample people.', 'err'); };
  useEffect(() => { if (skeletonSeen) return; const t = setTimeout(() => { skeletonSeen = true; setLoading(false); }, 500); return () => clearTimeout(t); }, []);
  const hr = new Date().getHours(); const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const incoming = people.all.filter((u) => a.requests[u.id] === 'incoming' && !a.hiddenIds.includes(u.id));
  const suggested = nb.eligible.filter((n) => n.user.interests.some((i) => a.me.interests.includes(i)) && a.requests[n.user.id] !== 'connected').slice(0, 3);
  // Demo: one "someone is nearby" alert per new person with shared interests (respects the Nearby alerts toggle).
  const alertTarget = suggested.find((n) => !a.alerted.includes(n.user.id));
  useEffect(() => {
    if (USE_BACKEND || !a.ready || loading || !alertTarget || nearbyAlertSent) return; // with a backend, nearby alerts come from the server
    nearbyAlertSent = true;
    const n = alertTarget; const shared = n.user.interests.filter((i) => a.me.interests.includes(i)).length;
    a.update((s) => ({ alerted: [...s.alerted, n.user.id] }));
    a.notify('nearby', 'navigate', `${n.user.name} is nearby and shares ${shared} interest${shared > 1 ? 's' : ''}`, '/(tabs)/nearby');
  }, [alertTarget?.user.id, loading, a.ready]);
  const checks = profileChecks(a.me); const done = checks.filter((c) => c[1]).length; const todo = checks.find((c) => !c[1]);
  const connected = people.all.filter((u) => a.requests[u.id] === 'connected' && !a.hiddenIds.includes(u.id)).length;
  return (
    <Screen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: space.lg, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.violet]} />}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar uri={a.me.photo} size={44} online={a.nearbyMode} />
          <View style={{ flex: 1, marginLeft: 10 }}><Text style={type.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{a.me.name ? `Hi, ${a.me.name.split(' ')[0]}` : greet}</Text>
            <Text style={type.caption}>{greet} · {a.nearbyMode ? 'Nearby Mode is on' : 'Nearby Mode is off'}</Text></View>
          <IconBtn name="search-outline" label="Search" onPress={() => r.push('/search')} /><View style={{ width: 8 }} /><IconBtn name="notifications-outline" label="Notifications" badge={a.notifs.some((n) => !n.read)} onPress={() => r.push('/notifications')} />
        </View>
        <LocationBanner />
        <FaceBanner />
        {!USE_BACKEND && <Banner icon="flask" tone="warn" text="Demo mode: the people shown are fictional sample profiles." />}
        <FadeIn delay={80}><Card style={{ backgroundColor: 'rgba(27,27,75,0.94)', borderColor: 'rgba(255,255,255,0.15)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{!a.nearbyMode ? 'You are hidden' : a.me.visibility === 'nobody' ? 'Hidden from everyone' : a.me.visibility === 'connections' ? 'Visible to connections only' : 'You are discoverable'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Radius {radiusLabel(a.radius)} · Location {nb.status === 'granted' ? 'on' : nb.status === 'loading' ? 'checking' : nb.status === 'denied' ? 'not allowed' : 'off'}</Text></View>
            <Ionicons name={a.nearbyMode ? 'radio' : 'eye-off'} size={34} color="#fff" />
          </View>
          <Btn style={{ marginTop: 10, backgroundColor: '#fff', minHeight: 40 }} variant="secondary" title="Open radar" icon="navigate" onPress={() => r.navigate('/(tabs)/nearby')} />
        </Card></FadeIn>
        <FadeIn delay={120}><Card onPress={() => r.push('/discover')} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="heart" size={22} color={colors.dating} /></View>
          <View style={{ flex: 1, marginHorizontal: 12 }}><Text style={type.section}>Find friends your age</Text><Text style={type.secondary}>Swipe photo cards. A heart sends a chat request.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} /></Card></FadeIn>
        <StatsRow items={[{ icon: 'people', value: nb.eligible.length, label: 'Nearby now', onPress: () => r.navigate('/(tabs)/nearby') }, { icon: 'person-add', value: incoming.length, label: 'Requests', onPress: () => r.navigate('/(tabs)/connections') }, { icon: 'people-circle', value: connected, label: 'Connections', onPress: () => r.navigate('/(tabs)/connections') }]} />
        <ProfileStrengthCard done={done} total={checks.length} next={todo?.[0]} />
        <SectionTitle title="People nearby" action="See all" onAction={() => r.navigate('/(tabs)/nearby')} />
        {loading ? <View style={{ flexDirection: 'row' }}><Skeleton h={220} style={{ width: 160, marginRight: 12 }} /><Skeleton h={220} style={{ width: 160 }} /></View>
          : nb.eligible.length === 0 ? <Card><Empty title={a.nearbyMode ? 'No one nearby right now' : 'Nearby Mode is off'} text={a.nearbyMode ? 'Try a larger radius to find more people.' : 'Turn it on to discover people around you.'} action={a.nearbyMode ? 'Change radius' : 'Turn on'} onAction={() => (a.nearbyMode ? r.navigate('/(tabs)/nearby') : a.set({ nearbyMode: true }))} /></Card>
          : <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} horizontal  data={nb.eligible} keyExtractor={(n) => n.user.id} renderItem={({ item, index }) => <PersonCard compact index={index} n={item} onOpen={() => setSel(item)} />} />}
        <SectionTitle title={`Connection requests (${incoming.length})`} action={incoming.length ? 'View all' : ''} onAction={() => r.navigate('/(tabs)/connections')} />
        {incoming.length === 0 ? <Text style={type.secondary}>No pending requests.</Text> : incoming.slice(0, 2).map((u, i) => (
          <FadeIn key={u.id} delay={i * 80}><Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => r.push(`/profiles/${u.id}`)}>
            <Avatar uri={u.photo} size={48} /><View style={{ flex: 1, marginHorizontal: 12 }}><Text style={type.section}>{u.name}</Text><IntentBadge k={u.intentions[0]} /></View>
            <IconBtn name="checkmark" label={`Accept ${u.name}`} color="#fff" bg={colors.violet} onPress={() => act.accept(u.id)} /></Card></FadeIn>))}
        <SectionTitle title="Suggested for you" />
        {suggested.length === 0 ? <Text style={type.secondary}>Add interests to your profile to get suggestions.</Text> : suggested.map((n, i) => <PersonCard key={n.user.id} index={i} n={n} onOpen={() => setSel(n)} />)}
        <SectionTitle title="Stay safe" />
        <SafetyTipCard />
        <SectionTitle title="Recent activity" />
        <FadeIn><Card>{a.notifs.length === 0 ? <Text style={type.secondary}>No activity yet.</Text> : a.notifs.slice(0, 3).map((x) => <Row key={x.id} icon={x.icon} title={x.t} sub={ago(x.at)} onPress={() => r.navigate(x.to as any)} />)}</Card></FadeIn>
      </ScrollView>
      <PersonSheet item={sel} onClose={() => setSel(null)} />
    </Screen>);
}
