import React, { useState } from 'react';
import { View, Text, ScrollView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileChecks } from '@/services/extras';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Avatar, Btn, Card, Row, IntentBadge, InterestTag, Dialog, IconBtn, FadeImage, FadeIn, Pop, Sheet, Progress } from '@/components/ui';
import ProfilePreview from '@/components/ProfilePreview';
import { ageFrom } from '@/services/dob';
import { useApp } from '@/services/store';
import { auth } from '@/services/auth';
import { type, colors, SOCIALS } from '@/constants/theme';
import { radiusLabel } from '@/services/geo';

const Stat = ({ icon, value, label }: any) => (
  <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
    <Ionicons name={icon} size={18} color={colors.violet} /><Text style={[type.section, { marginTop: 2 }]}>{value}</Text><Text style={type.caption}>{label}</Text>
  </Card>);
const Block = ({ title, children, i = 0 }: any) => (<FadeIn delay={120 + i * 70}><Card style={{ marginTop: 12 }}><Text style={[type.section, { marginBottom: 6 }]}>{title}</Text>{children}</Card></FadeIn>);

export default function Profile() {
  const r = useRouter(); const a = useApp(); const insets = useSafeAreaInsets(); const [out, setOut] = useState(false); const [prev, setPrev] = useState(false); const me = a.me;
  const checks = profileChecks(me);
  const done = checks.filter((c) => c[1]).length; const todo = checks.find((c) => !c[1]);
  const share = () => Share.share({ message: 'Join me on Nearby. Meet people around you, on your terms.' }).catch(() => a.toast('Could not open share', 'err'));
  const connected = Object.values(a.requests).filter((v) => v === 'connected').length;
  const age = ageFrom(me.dob);
  const visible = me.socials.filter((s) => s.handle);
  return (
    <Screen edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={['#6C4DF6', '#1B1B4B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112 + insets.top, paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12 }}><IconBtn name="settings-outline" label="Settings" onPress={() => r.push('/settings')} /></View>
        </LinearGradient>
        <View style={{ paddingHorizontal: 12, marginTop: -48 }}>
          <FadeIn style={{ alignItems: 'center' }}>
            <Pop><View style={{ padding: 3, backgroundColor: '#fff', borderRadius: 99 }}><Avatar uri={me.photo} size={96} online={a.nearbyMode} /></View></Pop>
            <Text style={[type.title, { marginTop: 8 }]} numberOfLines={1}>{me.name || 'Add your name'}{age ? `, ${age}` : ''}</Text>
            {a.face.status === 'verified' && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}><Ionicons name="shield-checkmark" size={14} color={colors.success} /><Text style={{ color: colors.success, fontWeight: '700', fontSize: 12.5, marginLeft: 4 }}>Verified {a.face.gender === 'Woman' ? 'she' : 'he'} · age about {a.face.age}</Text></View>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>{me.intentions.map((i) => <IntentBadge key={i} k={i} />)}</View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}><Btn style={{ minHeight: 40, paddingHorizontal: 18, marginRight: 8 }} icon="create-outline" title="Edit" onPress={() => r.push('/edit-profile')} /><Btn style={{ minHeight: 40, paddingHorizontal: 18, marginRight: 8 }} variant="secondary" icon="eye-outline" title="Preview" onPress={() => setPrev(true)} /><Btn style={{ minHeight: 40, paddingHorizontal: 18 }} variant="secondary" icon="share-social-outline" title="Share" onPress={share} /></View>
          </FadeIn>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Stat icon="people-outline" value={connected} label="Connections" />
            <Stat icon="sparkles-outline" value={me.interests.length} label="Interests" />
            <Stat icon="radio-outline" value={radiusLabel(a.radius)} label="Radius" />
          </View>
          {done < checks.length && <Block title={`Profile strength: ${done} of ${checks.length}`} i={0}><Progress step={done} total={checks.length} /><Text style={[type.secondary, { marginTop: 8 }]}>Next: {todo?.[0]}</Text></Block>}
          <Block title="About" i={0}><Text style={me.bio ? type.body : type.secondary}>{me.bio || 'Add a short introduction so people know what you are into.'}</Text></Block>
          <Block title="Interests" i={1}><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -6 }}>{me.interests.length ? me.interests.map((i) => <InterestTag key={i} k={i} />) : <Text style={[type.secondary, { marginTop: 6 }]}>No interests yet.</Text>}</View></Block>
          {me.photos.length > 0 && <Block title="Photos" i={3}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{me.photos.map((p, i) => <Pop key={p} delay={i * 60}><FadeImage uri={p} style={{ width: 88, height: 110, borderRadius: 5, marginRight: 8 }} /></Pop>)}</ScrollView></Block>}
          <Block title="Social links" i={4}>{visible.length === 0 ? <Text style={type.secondary}>No links added.</Text> : visible.map((s) => { const d = SOCIALS.find((x) => x.key === s.key)!; return <Row key={s.key} icon={d.icon} title={d.label} sub={`@${s.handle}`} right={<Text style={type.caption}>{s.visible ? 'Public' : 'Hidden'}</Text>} />; })}</Block>
          <Block title="Account" i={5}>
            <Row icon="notifications-outline" title="Notifications" onPress={() => r.push('/notifications')} />
            <Row icon="shield-checkmark-outline" title="Privacy and safety" onPress={() => r.push('/privacy')} />
            <Row icon="help-buoy-outline" title="Help and support" onPress={() => r.push('/help')} />
            <Row icon="ban-outline" title="Blocked users" onPress={() => r.push('/blocked')} />
            <Row icon="settings-outline" title="Settings" onPress={() => r.push('/settings')} />
            <Row icon="information-circle-outline" title="About Nearby" onPress={() => r.push('/about')} />
            <Row icon="log-out-outline" title="Log out" danger onPress={() => setOut(true)} />
          </Block>
        </View>
      </ScrollView>
      <Sheet visible={prev} onClose={() => setPrev(false)}><ProfilePreview name={me.name} age={age} photos={me.photos} bio={me.bio} intentions={me.intentions} interests={me.interests} caption="This is how people nearby see you" /><View style={{ height: 16 }} /></Sheet>
      <Dialog visible={out} title="Log out?" text="You will stop appearing in Nearby until you log in again." confirm="Log out" danger onCancel={() => setOut(false)}
        onConfirm={async () => { await auth.logout(); setOut(false); a.signOut(); r.replace('/auth/welcome'); }} />
    </Screen>);
}
