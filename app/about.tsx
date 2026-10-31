import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Row, FadeIn } from '@/components/ui';
import { colors, type } from '@/constants/theme';
export default function About() {
  const r = useRouter(); const v = Constants.expoConfig?.version || '1.0.0';
  return (
    <Screen><Header title="About Nearby" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <FadeIn><View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={[type.display, { color: colors.violet }]}>Nearby</Text>
          <Text style={type.secondary}>Meet people around you, on your terms.</Text>
          <Text style={[type.caption, { marginTop: 8 }]}>Version {v}</Text></View></FadeIn>
        <Card>
          <Row icon="reader-outline" title="Terms of service" onPress={() => r.push('/info?doc=terms')} />
          <Row icon="document-text-outline" title="Privacy policy" onPress={() => r.push('/info?doc=privacy')} />
          <Row icon="people-circle-outline" title="Community guidelines" onPress={() => r.push('/info?doc=guidelines')} />
          <Row icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => r.push('/feedback')} />
        </Card>
        <Text style={[type.caption, { textAlign: 'center', marginTop: 16 }]}>Icons by Ionicons (MIT).</Text>
      </ScrollView>
    </Screen>);
}
