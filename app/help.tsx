import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { Screen, Header, Card, Row, SectionTitle, Btn, FadeIn } from '@/components/ui';
import { useApp } from '@/services/store';
import { useLocation, useAllowLocation } from '@/services/location';
import { useNotifPermission } from '@/services/notifications';
import { colors, type } from '@/constants/theme';
import { emailSupport, supportMessage } from '@/services/support';
import { USE_BACKEND, API_URL } from '@/services/config';

const FAQ: [string, string][] = [
  ['Nobody shows up nearby', 'Check that location is allowed, Nearby Mode is on, and your radius is big enough (try 1 km).'],
  ['The radar does not rotate', 'Your phone compass may need calibrating. Move the phone in a figure eight. If it still fails, the radar stays north-up and says so.'],
  ['I am not getting notifications', 'Allow notifications for Nearby in phone settings, check the toggles in Settings, and make sure Quiet hours is not on. Some phones also limit background apps to save battery.'],
  ['What do other people see?', 'Your profile, plus your distance and direction from them (for example 37 m, NE). Your coordinates are never shown.'],
  ['How do I block or report someone?', 'Open their profile or chat, tap the menu, then choose Block or Report. You can undo a block in Settings, Blocked users.'],
  ['How do I delete my account?', 'Settings, Account, Delete account. You will need to type DELETE to confirm.'],
];
const Status = ({ ok, label, fix, onFix }: any) => (
  <Row icon={ok ? 'checkmark-circle' : 'alert-circle'} title={label} sub={ok ? 'Looks good' : 'Needs attention'} right={ok || !fix ? undefined : <Pressable onPress={onFix} hitSlop={8} accessibilityRole="button"><Text style={{ color: colors.violet, fontWeight: '800' }}>{fix}</Text></Pressable>} />
);
export default function Help() {
  const r = useRouter(); const a = useApp(); const loc = useLocation(); const allow = useAllowLocation(); const np = useNotifPermission(); const net = useNetInfo();
  const [open, setOpen] = useState<number | null>(null);
  const online = net.isConnected !== false;
  const [server, setServer] = useState<boolean | null>(null);
  const checkServer = () => { setServer(null); fetch(API_URL + '/health').then((x) => setServer(x.ok)).catch(() => setServer(false)); };
  useEffect(() => { if (USE_BACKEND) checkServer(); }, []);
  return (
    <Screen><Header title="Help center" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionTitle title="Quick check" />
        <FadeIn><Card>
          <Status ok={loc.status === 'granted'} label="Location" fix="Fix" onFix={allow} />
          <Status ok={np.status === 'granted'} label="Notifications" fix="Allow" onFix={np.allow} />
          <Status ok={a.nearbyMode} label="Nearby Mode" fix="Turn on" onFix={() => a.set({ nearbyMode: true })} />
          <Status ok={online} label="Internet connection" fix="" onFix={() => {}} />
          {USE_BACKEND && <Status ok={server === true} label={server === null ? 'Server (checking...)' : 'Server connection'} fix="Retry" onFix={checkServer} />}
          {USE_BACKEND && <Status ok={a.face.status === 'verified'} label="Face verification" fix="Scan" onFix={() => r.push('/face-scan')} />}
        </Card></FadeIn>

        <SectionTitle title="Common questions" />
        {FAQ.map(([q, ans], i) => (
          <FadeIn key={q} delay={i * 40}><Card style={{ marginBottom: 10 }} accessibilityLabel={q} accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[type.section, { flex: 1, fontSize: 15 }]}>{q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
            </View>
            {open === i && <Text style={[type.secondary, { marginTop: 8 }]}>{ans}</Text>}
          </Card></FadeIn>))}

        <SectionTitle title="Still stuck?" />
        <Btn icon="mail-outline" title="Email support" onPress={async () => { const x = await emailSupport(); if (x !== 'ok') a.toast(supportMessage(x), 'err'); }} />
        <View style={{ height: 10 }} />
        <Btn variant="secondary" icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => r.push('/feedback')} />
        <View style={{ height: 10 }} />
        <Btn variant="secondary" icon="shield-checkmark-outline" title="Safety center" onPress={() => r.push('/safety')} />
      </ScrollView>
    </Screen>);
}
