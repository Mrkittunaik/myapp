import React from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Row, SectionTitle, Chip, Toggle } from '@/components/ui';
import { useApp } from '@/services/store';
import { type } from '@/constants/theme';
import { USE_BACKEND } from '@/services/config';
import { api } from '@/services/api';
const VIS: [string, string][] = [['everyone', 'Everyone nearby'], ['connections', 'Connections only'], ['nobody', 'Nobody']];
export default function Privacy() {
  const r = useRouter(); const a = useApp();
  const exportData = async () => { if (USE_BACKEND) { try { const d = await api.exportData(); return Share.share({ title: 'My Nearby data', message: JSON.stringify(d, null, 2) }); } catch { return a.toast('Could not get your data. Try again.', 'err'); } } return localExport(); };
  const localExport = () => Share.share({ title: 'My Nearby data', message: JSON.stringify({ email: a.email, profile: a.me, connections: Object.keys(a.requests).filter((k) => a.requests[k] === 'connected'), blocked: a.blocked, reports: a.reports }, null, 2) }).catch(() => a.toast('Could not share your data', 'err'));
  return (
    <Screen><Header title="Privacy and safety" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SectionTitle title="Visibility" />
        <Card>
          <Row icon="radio-outline" title="Nearby Mode" sub="Turn off to disappear from discovery" right={<Toggle value={a.nearbyMode} onValueChange={(v) => a.set({ nearbyMode: v })} />} />
          <Text style={[type.caption, { marginVertical: 6, marginLeft: 4 }]}>Who can discover me</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{VIS.map(([k, l]) => <Chip key={k} label={l} selected={a.me.visibility === k} onPress={() => a.setMe({ visibility: k as any })} />)}</View>
          <Text style={[type.caption, { padding: 6 }]}>Distance is shown to the metre. Other people never see your coordinates.</Text>
        </Card>
        <SectionTitle title="Safety" />
        <Card>
          <Row icon="shield-checkmark-outline" title="Safety center" sub="Tips and safety tools" onPress={() => r.push('/safety')} />
          <Row icon="ban-outline" title="Blocked users" sub={`${a.blocked.length} blocked`} onPress={() => r.push('/blocked')} />
          <Row icon="people-circle-outline" title="Community guidelines" onPress={() => r.push('/info?doc=guidelines')} />
        </Card>
        <SectionTitle title="Your data" />
        <Card>
          <Row icon="download-outline" title="Download my data" sub="Share a copy of your profile details" onPress={exportData} />
          <Row icon="document-text-outline" title="Privacy policy" onPress={() => r.push('/info?doc=privacy')} />
        </Card>
      </ScrollView>
    </Screen>);
}
