import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FadeIn } from '@/components/ui';
import { Float, PulseRing } from '@/components/Motion';
import { type } from '@/constants/theme';
export default function Welcome() {
  const r = useRouter();
  return (
    <LinearGradient colors={['#6C4DF6', '#1B1B4B']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}><PulseRing size={160} color="#fff" /><PulseRing size={160} color="#fff" delay={1200} /><Float amp={6}><View style={{ width: 96, height: 96, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="navigate-circle" size={64} color="#6C4DF6" /></View></Float></View>
          <FadeIn delay={150}><Text style={{ ...type.display, fontSize: 42, color: '#fff', marginTop: 8, textAlign: 'center' }}>Nearby</Text></FadeIn>
          <FadeIn delay={260}><Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 17, textAlign: 'center', marginTop: 8 }}>Meet people around you, on your terms.</Text></FadeIn>
        </View>
        <FadeIn delay={400} y={24}>
          <Btn title="Create account" variant="secondary" style={{ backgroundColor: '#fff' }} onPress={() => r.push('/auth/signup')} />
          <View style={{ height: 12 }} />
          <Btn title="I already have an account" variant="ghost" textColor="#fff" style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' }} onPress={() => r.push('/auth/login')} />
          <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 12, marginTop: 16 }}>Email sign-in is the only method available right now.</Text>
        </FadeIn>
      </SafeAreaView>
    </LinearGradient>
  );
}
