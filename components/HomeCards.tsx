import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, FadeIn, Progress } from './ui';
import { colors, type } from '@/constants/theme';
import { tipOfDay } from '@/services/extras';

// Three tappable numbers at the top of Home.
export function StatsRow({ items }: { items: { icon: string; value: number | string; label: string; onPress: () => void }[] }) {
  return (
    <FadeIn delay={120}><View style={{ flexDirection: 'row', marginTop: 4, marginBottom: 4 }}>
      {items.map((x, i) => (
        <Card key={x.label} onPress={x.onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, marginRight: i < items.length - 1 ? 8 : 0 }}>
          <Ionicons name={x.icon as any} size={20} color={colors.violet} />
          <Text style={[type.title, { marginTop: 2 }]} accessibilityLabel={`${x.value} ${x.label}`}>{x.value}</Text>
          <Text style={type.caption} numberOfLines={1}>{x.label}</Text>
        </Card>))}
    </View></FadeIn>
  );
}

// Shows the next missing profile step. Hidden when the profile is complete.
export function ProfileStrengthCard({ done, total, next }: { done: number; total: number; next?: string }) {
  const r = useRouter();
  if (done >= total) return null;
  return (
    <FadeIn delay={160}><Card onPress={() => r.push('/edit-profile')} style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flex: 1 }}><Text style={type.section}>Finish your profile</Text><Text style={type.secondary}>{done} of {total} done. Next: {next}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
      <Progress step={done} total={total} />
    </Card></FadeIn>
  );
}

// One safety tip per day, links to the Safety center.
export function SafetyTipCard() {
  const r = useRouter();
  return (
    <FadeIn delay={100}><Card onPress={() => r.push('/safety')} style={{ backgroundColor: 'rgba(31,169,113,0.10)', borderColor: 'rgba(31,169,113,0.25)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 38, height: 38, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Ionicons name="shield-checkmark" size={20} color={colors.success} /></View>
        <View style={{ flex: 1 }}><Text style={type.section}>Safety tip</Text><Text style={[type.secondary, { color: colors.text, marginTop: 2 }]}>{tipOfDay()}</Text>
          <Text style={{ color: colors.success, fontWeight: '800', marginTop: 8, fontSize: 13.5 }}>Open Safety center</Text></View>
      </View>
    </Card></FadeIn>
  );
}

// Tap a starter to drop it into the message box.
export function Icebreakers({ items, onPick }: { items: string[]; onPick: (t: string) => void }) {
  return (
    <View style={{ backgroundColor: '#fff', paddingTop: 10, paddingHorizontal: 12 }}>
      <Text style={[type.caption, { marginBottom: 6 }]}>Not sure what to say? Tap one</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((t) => (
          <Pressable key={t} onPress={() => onPick(t)} accessibilityRole="button" accessibilityLabel={`Use starter: ${t}`}
            style={{ backgroundColor: colors.violetSoft, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8, maxWidth: '100%' }}>
            <Text style={{ color: colors.violet, fontWeight: '600', fontSize: 13.5 }}>{t}</Text>
          </Pressable>))}
      </View>
    </View>
  );
}
