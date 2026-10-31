import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Row, SectionTitle, FadeIn, Dialog } from '@/components/ui';
import { useApp } from '@/services/store';
import { SAFETY_TIPS } from '@/services/extras';
import { colors, type } from '@/constants/theme';

const MEET: [string, string, string][] = [
  ['people-outline', 'Meet in public', 'Pick a busy, well-lit place for the first meeting. Cafes, markets and malls work well.'],
  ['chatbubble-ellipses-outline', 'Tell someone you trust', 'Share who you are meeting, where, and when you expect to be back.'],
  ['car-outline', 'Control your own travel', 'Arrange your own transport so you can leave whenever you want.'],
  ['lock-closed-outline', 'Keep private things private', 'Do not share your home address, workplace, OTPs, or money details with someone new.'],
];
export default function Safety() {
  const r = useRouter(); const a = useApp(); const [stop, setStop] = useState(false);
  return (
    <Screen><Header title="Safety center" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionTitle title="Meeting someone new" />
        {MEET.map(([ic, t, d], i) => (
          <FadeIn key={t} delay={i * 60}><Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 38, height: 38, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name={ic as any} size={20} color={colors.violet} /></View>
            <View style={{ flex: 1 }}><Text style={type.section}>{t}</Text><Text style={[type.secondary, { marginTop: 2 }]}>{d}</Text></View>
          </Card></FadeIn>))}

        <SectionTitle title="Your safety tools" />
        <Card>
          <Row icon="eye-off-outline" title="Go invisible" sub={a.nearbyMode ? 'Hide yourself from discovery now' : 'You are hidden. Tap to show again'} onPress={() => { a.set({ nearbyMode: !a.nearbyMode }); a.toast(a.nearbyMode ? 'You are hidden' : 'You are discoverable'); }} />
          <Row icon="hand-left-outline" title="Stop sharing location" sub={a.nearbyMode ? 'Also turns off Nearby Mode' : 'Stopped. Turn Nearby Mode on to share again'} onPress={() => (a.nearbyMode ? setStop(true) : a.toast('Location sharing is already stopped'))} />
          <Row icon="ban-outline" title="Blocked users" sub={`${a.blocked.length} blocked`} onPress={() => r.push('/blocked')} />
          <Row icon="flag-outline" title="How to report someone" sub="Open their profile, tap the menu, choose Report" onPress={() => r.push('/(tabs)/connections')} />
        </Card>

        <SectionTitle title="More tips" />
        <Card>{SAFETY_TIPS.map((t, i) => <View key={t} style={{ flexDirection: 'row', marginBottom: i < SAFETY_TIPS.length - 1 ? 10 : 0 }}><Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 2 }} /><Text style={[type.body, { flex: 1, marginLeft: 8 }]}>{t}</Text></View>)}</Card>

        <SectionTitle title="Read more" />
        <Card><Row icon="people-circle-outline" title="Community guidelines" onPress={() => r.push('/info?doc=guidelines')} /><Row icon="help-buoy-outline" title="Help center" onPress={() => r.push('/help')} /></Card>
      </ScrollView>
      <Dialog visible={stop} title="Stop sharing location?" text="You will be hidden from discovery until you turn Nearby Mode back on." confirm="Stop sharing" danger onCancel={() => setStop(false)} onConfirm={() => { a.set({ nearbyMode: false }); setStop(false); a.toast('Location sharing stopped'); }} />
    </Screen>);
}
