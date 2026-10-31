import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Screen, Header, Card, FadeIn, Banner } from '@/components/ui';
import { type, colors } from '@/constants/theme';

type Doc = { title: string; draft?: boolean; intro: string; sections: [string, string][] };
// DRAFT TEXT: written to match what the app does today. Have a lawyer review and complete these before release.
const DOCS: Record<string, Doc> = {
  terms: { title: 'Terms of service', draft: true, intro: 'By using Nearby you agree to these terms.', sections: [
    ['Who can use Nearby', 'You must be 18 or older. You must give true information about yourself, including your date of birth.'],
    ['How to behave', 'Be respectful. No harassment, hate, threats, impersonation, spam, or illegal content. Do not share other people\'s private details.'],
    ['Meeting people', 'Nearby helps you find people. It does not check anyone\'s identity. You are responsible for your own safety when you meet someone. See the Safety center.'],
    ['Your content', 'You own your photos and text. You allow Nearby to show them to other users as set in your privacy settings.'],
    ['Ending your access', 'We may suspend accounts that break these terms. You can delete your account at any time in Settings.'],
  ] },
  privacy: { title: 'Privacy policy', draft: true, intro: 'What Nearby collects and why.', sections: [
    ['Location', 'Used to work out the exact distance and direction to people near you, and in the background if you turn on Run in background. Other users never see your coordinates. You can turn location off in Settings.'],
    ['Profile information', 'Name, date of birth, photos, bio, interests and optional social links. Visibility is controlled by you in Privacy and safety.'],
    ['Messages', 'Messages are stored on our server so they reach the other person. You can delete a message you sent, or clear a chat from your own view.'],
    ['Notifications', 'Only sent if you allow them. You can choose which kinds you receive, and set quiet hours.'],
    ['Your choices', 'You can hide yourself, block people, download your data, and delete your account at any time.'],
  ] },
  guidelines: { title: 'Community guidelines', intro: 'Nearby works when everyone feels safe and respected.', sections: [
    ['Be kind', 'Treat people the way you want to be treated. A no is a no.'],
    ['Be real', 'Use your own photos and real details. No fake profiles or impersonation.'],
    ['Respect privacy', 'Never share someone else\'s photos, number, or location without their permission.'],
    ['Keep it safe', 'No threats, harassment, hate speech, or illegal activity. No asking for money.'],
    ['Report problems', 'If something feels wrong, block and report. It is quick and the other person is not told who reported.'],
  ] },
};
export default function Info() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  if (!doc || doc === 'help' || !DOCS[doc]) return <Redirect href="/help" />;
  const d = DOCS[doc];
  return <Screen><Header title={d.title} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    {d.draft && <Banner icon="document-text-outline" tone="warn" text="Draft text. Have a lawyer review it before you release." />}
    <FadeIn><Text style={[type.secondary, { marginVertical: 8 }]}>{d.intro}</Text></FadeIn>
    {d.sections.map(([h, t], i) => (
      <FadeIn key={h} delay={i * 50}><Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ width: 24, height: 24, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}><Text style={{ color: colors.violet, fontWeight: '800', fontSize: 12 }}>{i + 1}</Text></View>
          <Text style={[type.section, { flex: 1 }]}>{h}</Text>
        </View>
        <Text style={type.body}>{t}</Text></Card></FadeIn>))}
  </ScrollView></Screen>;
}
