import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FadeIn } from '@/components/ui';
import { PulseRing, Float } from '@/components/Motion';
import { useApp } from '@/services/store';
import { useLocation, useAllowLocation } from '@/services/location';
import { gradients, type } from '@/constants/theme';

const POINTS: [string, string][] = [
  ['navigate-outline', 'Shows how far and in which direction people are'],
  ['eye-off-outline', 'Others see your distance and direction, never your coordinates'],
  ['time-outline', 'Used only while the app is open. Change it anytime in Settings'],
];
export default function Permission() {
  const r = useRouter(); const a = useApp(); const loc = useLocation(); const allow = useAllowLocation();
  const [busy, setBusy] = useState(false); const { height } = useWindowDimensions();
  const art = height < 700 ? 150 : 220; // smaller artwork on short phones so the buttons stay on screen
  const go = () => { a.set({ locationAsked: true }); r.replace(a.notifAsked ? '/(tabs)/home' : '/notif-permission'); };
  const ask = async () => {
    setBusy(true); const res = await allow(); setBusy(false);
    if (res === 'granted') { a.toast('Location is on'); go(); }
  };
  const blocked = loc.status === 'denied' || loc.status === 'disabled';
  return (
    <LinearGradient colors={gradients.hero} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
       {/* scrolls when the screen is too short for everything */}
       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: height < 700 ? 8 : 40 }}>
          <View style={{ width: art, height: art, alignItems: 'center', justifyContent: 'center' }}>
            <PulseRing size={art} color="#fff" /><PulseRing size={art} color="#fff" delay={1200} />
            <Float amp={7}><View style={{ width: 104, height: 104, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="location" size={56} color="#6C4DF6" /></View></Float>
          </View>
          <FadeIn delay={150}><Text style={{ ...type.display, color: '#fff', textAlign: 'center', marginTop: 8 }}>Find people around you</Text></FadeIn>
          <FadeIn delay={250}><Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 24 }}>Nearby needs your location to work. You stay in control.</Text></FadeIn>
        </View>
        <View style={{ marginTop: 16 }}>
          {POINTS.map(([ic, t], i) => (
            <FadeIn key={t} delay={350 + i * 100} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={ic as any} size={20} color="#fff" /></View>
              <Text style={{ flex: 1, color: '#fff', marginLeft: 14, fontSize: 14.5, lineHeight: 20 }}>{t}</Text>
            </FadeIn>))}
          {blocked && <FadeIn><Text style={{ color: '#FFD9A0', textAlign: 'center', marginBottom: 10, fontSize: 13.5 }}>{loc.status === 'disabled' ? 'Device location is turned off.' : loc.canAskAgain ? 'Location was not allowed.' : 'Location is blocked in phone settings.'}</Text></FadeIn>}
          <Btn variant="secondary" style={{ backgroundColor: '#fff' }} icon="location" loading={busy}
            title={loc.status === 'denied' && !loc.canAskAgain ? 'Open settings' : loc.status === 'disabled' ? 'Turn on location' : 'Allow location'} onPress={ask} />
          <View style={{ height: 6 }} />
          <Btn variant="ghost" textColor="#fff" title={blocked ? 'Continue without location' : 'Not now'} onPress={go} />
          <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 12, marginTop: 4 }}>Without location you will not see people nearby.</Text>
        </View>
       </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
