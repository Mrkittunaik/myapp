import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Row, SectionTitle, Chip, Dialog, Sheet, Btn, Field, Avatar, Empty, Toggle, Banner } from '@/components/ui';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { useLocation, useAllowLocation } from '@/services/location';
import { auth, validPassword } from '@/services/auth';
import { colors, RADII, type } from '@/constants/theme';
import { emailSupport, supportMessage } from '@/services/support';
import { radiusLabel } from '@/services/geo';
import { useNotifPermission, sendTestNotification } from '@/services/notifications';
import { startBackground } from '@/services/background';
import { USE_BACKEND } from '@/services/config';
const sw = (v: boolean, f: (v: boolean) => void) => <Toggle value={v} onValueChange={f} />;
export default function Settings() {
  const r = useRouter(); const a = useApp(); const act = useActions(); const loc = useLocation(); const allow = useAllowLocation(); const nperm = useNotifPermission();
  const [del, setDel] = useState(false); const [pw, setPw] = useState(false); const [np, setNp] = useState(''); const [cp, setCp] = useState(''); const [pwErr, setPwErr] = useState(''); const [busy, setBusy] = useState(false); const [out, setOut] = useState(false); const [confirmDel, setConfirmDel] = useState(''); const [cp2, setCp2] = useState(''); const [stop, setStop] = useState(false);
  const blocked = a.blocked;
  return (
    <Screen><Header title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionTitle title="Discovery" />
        <Card><Row icon="radio-outline" title="Nearby Mode" sub="Turn off to disappear from new discovery results" right={sw(a.nearbyMode, (v) => a.set({ nearbyMode: v }))} />
          <Text style={[type.caption, { marginVertical: 6, marginLeft: 4 }]}>Radius</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{RADII.map((x) => <Chip key={x} label={radiusLabel(x)} selected={a.radius === x} onPress={() => a.set({ radius: x })} />)}</View>
          <Text style={[type.caption, { marginVertical: 6, marginLeft: 4 }]}>Who can discover me</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{[['everyone', 'Everyone'], ['connections', 'Connections'], ['nobody', 'Nobody']].map(([k, l]) => <Chip key={k} label={l} selected={a.me.visibility === k} onPress={() => a.setMe({ visibility: k as any })} />)}</View></Card>
        <SectionTitle title="Preferences" /><Card><Text style={[type.caption, { marginVertical: 6, marginLeft: 4 }]}>Distance units</Text><View style={{ flexDirection: 'row' }}><Chip label="Kilometres" selected={a.units === 'km'} onPress={() => a.set({ units: 'km' })} /><Chip label="Miles" selected={a.units === 'mi'} onPress={() => a.set({ units: 'mi' })} /></View></Card>
        <SectionTitle title="Location" />
        <Card><Row icon="location-outline" title="Location permission" sub={loc.status === 'granted' ? 'Allowed. Used only while the app is open' : loc.status === 'disabled' ? 'Device location is off' : 'Not allowed. Tap to allow'} onPress={loc.status === 'granted' ? loc.openSettings : allow} />
          <Row icon="hand-left-outline" title="Stop sharing location" sub={a.nearbyMode ? 'Also turns off Nearby Mode' : 'Stopped. Turn Nearby Mode on to share again'} onPress={() => (a.nearbyMode ? setStop(true) : a.toast('Location sharing is already stopped'))} />
          <Row icon="walk-outline" title="Run in background" sub={USE_BACKEND ? 'Keep finding people and alert me when someone is near, even when the app is closed' : 'Needs the backend. Set EXPO_PUBLIC_API_URL first'} right={sw(a.background, async (v) => {
            if (!v) return a.set({ background: false });
            if (!USE_BACKEND) return a.toast('Connect the backend first (EXPO_PUBLIC_API_URL)', 'err');
            const res = await startBackground();
            if (res.ok) { a.set({ background: true }); return a.toast('Running in background'); }
            const why = (res as any).reason; a.toast(why === 'needs-dev-build' ? 'Background needs a development build, not Expo Go' : why === 'background-denied' ? 'Choose "Allow all the time" for location' : 'Could not start background mode', 'err');
          })} />
          <Text style={[type.caption, { padding: 8 }]}>Distance is measured from GPS and shown to the metre (usually within 5 to 15 m outdoors, worse indoors). Direction is a compass bearing. Other people never see your coordinates.</Text></Card>
        <SectionTitle title="Notifications" /><Text style={[type.caption, { marginBottom: 8 }]}>Choose what you get. Quiet hours (10 PM to 7 AM) mute phone alerts.</Text>
        <Card><Row icon="phone-portrait-outline" title="Phone notifications" sub={nperm.status === 'granted' ? 'Allowed. Tap to manage in phone settings' : nperm.status === 'denied' && !nperm.canAskAgain ? 'Blocked in phone settings. Tap to fix' : 'Not allowed. Tap to allow'} onPress={() => (nperm.status === 'granted' ? nperm.openSettings() : nperm.allow())} />
          <Row icon="paper-plane-outline" title="Send a test notification" sub="Arrives in 5 seconds. Close the app to see it" onPress={async () => { if (nperm.status !== 'granted') { const x = await nperm.allow(); if (x !== 'granted') return; } await sendTestNotification(); a.toast('Test sent. Close the app and wait a few seconds.'); }} />
          {[['nearby', 'Nearby alerts'], ['requests', 'Connection requests'], ['messages', 'Messages']].map(([k, l]) => <Row key={k} icon="notifications-outline" title={l} right={sw(a.notifPrefs[k], (v) => a.set({ notifPrefs: { ...a.notifPrefs, [k]: v } }))} />)}
          <Row icon="moon-outline" title="Quiet hours" sub="10 PM to 7 AM" right={sw(a.quietHours, (v) => a.set({ quietHours: v }))} /></Card>
        <SectionTitle title="Privacy and safety" />
        <Card>{USE_BACKEND && <Row icon="scan-outline" title="Face verification" sub={a.face.status === 'verified' ? `Verified · ${a.face.gender} · age about ${a.face.age}. Tap to scan again` : 'Not verified. Tap to scan your face'} onPress={() => r.push('/face-scan')} />}<Row icon="shield-checkmark-outline" title="Safety center" sub="Tips and safety tools" onPress={() => r.push('/safety')} /><Row icon="lock-closed-outline" title="Privacy and data" sub="Visibility and download my data" onPress={() => r.push('/privacy')} /><Row icon="ban-outline" title="Blocked users" sub={`${blocked.length} blocked`} onPress={() => r.push('/blocked')} /><Row icon="document-text-outline" title="Privacy policy" onPress={() => r.push('/info?doc=privacy')} />
          <Row icon="people-circle-outline" title="Community guidelines" onPress={() => r.push('/info?doc=guidelines')} /><Row icon="reader-outline" title="Terms of service" onPress={() => r.push('/info?doc=terms')} /><Row icon="help-buoy-outline" title="Help center" onPress={() => r.push('/help')} /></Card>
        <SectionTitle title="Support" /><Card><Row icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => r.push('/feedback')} /><Row icon="mail-outline" title="Contact support" onPress={async () => { const x = await emailSupport(); if (x !== 'ok') a.toast(supportMessage(x), 'err'); }} /><Row icon="information-circle-outline" title="About Nearby" onPress={() => r.push('/about')} /></Card>
        <SectionTitle title="Account" />
        <Card><Row icon="mail-outline" title="Change email" sub={a.email || undefined} onPress={() => r.push('/change-email')} /><Row icon="key-outline" title="Change password" onPress={() => setPw(true)} /><Row icon="log-out-outline" title="Log out" onPress={() => setOut(true)} /><Row icon="trash-outline" title="Delete account" danger onPress={() => setDel(true)} /></Card>
      </ScrollView>
      
      <Sheet visible={pw} onClose={() => { setPw(false); setPwErr(''); setCp(''); setNp(''); setCp2(''); }}><Text style={[type.title, { marginBottom: 12 }]}>Change password</Text>
        {!!pwErr && <Banner tone="err" icon="alert-circle" text={pwErr} />}
        <Field label="Current password" secure value={cp} onChangeText={setCp} autoCapitalize="none" />
        <Field label="New password" secure value={np} onChangeText={setNp} autoCapitalize="none" error={np && !validPassword(np) ? 'Use at least 8 characters including a number' : undefined} />
        <Field label="Confirm new password" secure value={cp2} onChangeText={setCp2} autoCapitalize="none" error={cp2 && cp2 !== np ? 'Passwords do not match' : undefined} />
        <Btn title="Update password" loading={busy} disabled={!cp || !validPassword(np) || cp2 !== np} onPress={async () => { setBusy(true); setPwErr(''); const res = await auth.changePassword(cp, np); setBusy(false); if ('error' in res) return setPwErr(res.error); setPw(false); setNp(''); setCp(''); setCp2(''); a.toast('Password updated'); a.notify('system', 'shield-checkmark', 'Your password was changed', '/settings'); }} /></Sheet>
      <Sheet visible={del} onClose={() => { setDel(false); setConfirmDel(''); }}><Text style={[type.title, { marginBottom: 8 }]}>Delete your account?</Text>
        <Text style={[type.secondary, { marginBottom: 12 }]}>This permanently removes your profile, connections and messages. This cannot be undone. Type DELETE to confirm.</Text>
        <Field label="Type DELETE" value={confirmDel} onChangeText={setConfirmDel} autoCapitalize="characters" />
        <Btn variant="danger" title="Delete account" loading={busy} disabled={confirmDel.trim() !== 'DELETE'} onPress={async () => { setBusy(true); const res = await auth.deleteAccount(); setBusy(false); if ('error' in res) return a.toast(res.error, 'err'); setDel(false); setConfirmDel(''); a.reset(); r.replace('/account-deleted'); }} /></Sheet>
      <Dialog visible={stop} title="Stop sharing location?" text="You will be hidden from discovery until you turn Nearby Mode back on." confirm="Stop sharing" danger onCancel={() => setStop(false)} onConfirm={() => { a.set({ nearbyMode: false }); setStop(false); a.toast('Location sharing stopped'); }} />
      <Dialog visible={out} title="Log out?" text="You will stop appearing in Nearby until you log in again." confirm="Log out" danger onCancel={() => setOut(false)} onConfirm={async () => { await auth.logout(); setOut(false); a.signOut(); r.replace('/auth/welcome'); }} />
    </Screen>);
}
