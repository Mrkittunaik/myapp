import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FadeIn } from '@/components/ui';
import { PulseRing, Float } from '@/components/Motion';
import { useApp } from '@/services/store';
import { useNotifPermission } from '@/services/notifications';
import { gradients, type } from '@/constants/theme';

const POINTS: [string, string][] = [
  ['person-add-outline', 'Know right away when someone accepts your request'],
  ['chatbubble-outline', 'Get messages even when the app is closed'],
  ['options-outline', 'Pick what you get, or turn it off anytime in Settings'],
];
export default function NotifPermission() {
  const r = useRouter(); const a = useApp(); const np = useNotifPermission(); const [busy, setBusy] = useState(false);
  const go = () => { a.set({ notifAsked: true }); r.replace('/(tabs)/home'); };
  const ask = async () => {
    if (np.status === 'granted') return go();
    setBusy(true); const res = await np.allow(); setBusy(false);
    if (res === 'granted') { a.toast('Notifications are on'); go(); }
    else if (res === 'denied') { a.toast('No problem. You can turn them on later in Settings.'); go(); }
  };
  const blocked = np.status === 'denied' && !np.canAskAgain;
  return (
    <LinearGradient colors={gradients.hero} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center' }}>
            <PulseRing size={180} color="#fff" />
            <Float amp={6}><View style={{ width: 92, height: 92, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="notifications" size={48} color="#6C4DF6" /></View></Float>
          </View>
          <FadeIn delay={150}><Text style={{ ...type.display, color: '#fff', textAlign: 'center' }}>Stay in the loop</Text></FadeIn>
          {/* Preview of what a notification will look like on the phone */}
          <FadeIn delay={300} style={{ alignSelf: 'stretch', marginTop: 18 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 5, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 5, backgroundColor: '#6C4DF6', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="radio-button-on" size={20} color="#fff" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 12, color: '#6B6B85' }}>Nearby  ·  now</Text><Text style={{ fontSize: 14.5, fontWeight: '700', color: '#15152B' }}>Meera accepted your request</Text></View>
            </View>
          </FadeIn>
        </View>
        <View>
          {POINTS.map(([ic, t], i) => (
            <FadeIn key={t} delay={400 + i * 100} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={ic as any} size={20} color="#fff" /></View>
              <Text style={{ flex: 1, color: '#fff', marginLeft: 14, fontSize: 14.5, lineHeight: 20 }}>{t}</Text>
            </FadeIn>))}
          {blocked && <FadeIn><Text style={{ color: '#FFD9A0', textAlign: 'center', marginBottom: 10, fontSize: 13.5 }}>Notifications are blocked in phone settings.</Text></FadeIn>}
          <Btn variant="secondary" style={{ backgroundColor: '#fff' }} icon="notifications" loading={busy}
            title={np.status === 'granted' ? 'Continue' : blocked ? 'Open settings' : 'Allow notifications'} onPress={ask} />
          <View style={{ height: 6 }} />
          {np.status !== 'granted' && <Btn variant="ghost" textColor="#fff" title="Not now" onPress={go} />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
