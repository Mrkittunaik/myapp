import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeIn } from './ui';
import { colors, glass, type } from '@/constants/theme';

export const HELP_CATS = [
  { key: 'help', label: 'Need help', icon: 'help-buoy-outline', color: '#6C4DF6' },
  { key: 'companion', label: 'Friend / companion', icon: 'people-outline', color: '#E0488B' },
  { key: 'rent', label: 'Rent / room', icon: 'home-outline', color: '#2B8CE6' },
  { key: 'task', label: 'Task / errand', icon: 'checkbox-outline', color: '#E8A317' },
  { key: 'other', label: 'Other', icon: 'sparkles-outline', color: '#6B6B85' },
] as const;
export const catOf = (k: string) => HELP_CATS.find((c) => c.key === k) || HELP_CATS[4];

type Props = { cat: string; title: string; body: string; offer: number; meta?: string; badge?: { label: string; color: string }; index?: number; onPress?: () => void; children?: React.ReactNode; full?: boolean };
// Glass card: a soft tint from the category colour, press-in spring, and a staggered fade-up when the list appears.
export function HelpCard({ cat, title, body, offer, meta, badge, index = 0, onPress, children, full }: Props) {
  const c = catOf(cat); const sc = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(sc, { toValue: v, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <FadeIn delay={Math.min(index, 8) * 70} y={18}>
      <Animated.View style={{ transform: [{ scale: sc }], marginBottom: 14 }}>
        <Pressable disabled={!onPress} onPress={onPress} onPressIn={() => to(0.97)} onPressOut={() => to(1)} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${c.label}: ${title}`}>
          <View style={[s.card, { borderColor: c.color + '40' }]}>
            <LinearGradient pointerEvents="none" colors={[c.color + '26', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.pill, { backgroundColor: c.color + '1F' }]}><Ionicons name={c.icon as any} size={14} color={c.color} /><Text style={[s.pillT, { color: c.color }]}>{c.label}</Text></View>
              <View style={{ flex: 1 }} />
              {offer > 0 ? <View style={[s.pill, { backgroundColor: '#1FA9711F' }]}><Text style={[s.pillT, { color: '#138A59', marginLeft: 0 }]}>Offers ₹{offer.toLocaleString('en-IN')}</Text></View> : <Text style={type.caption}>No payment offered</Text>}
            </View>
            <Text style={[type.section, { marginTop: 10, fontSize: 17 }]}>{title}</Text>
            <Text style={[type.secondary, { marginTop: 4, color: colors.text }]} numberOfLines={full ? undefined : 3}>{body}</Text>
            {!!meta && <Text style={[type.caption, { marginTop: 8 }]}>{meta}</Text>}
            {!!badge && <View style={[s.badge, { backgroundColor: badge.color + '1F' }]}><Text style={{ color: badge.color, fontWeight: '800', fontSize: 12.5 }}>{badge.label}</Text></View>}
            {children}
          </View>
        </Pressable>
      </Animated.View>
    </FadeIn>);
}
const s = StyleSheet.create({
  card: { ...glass, borderRadius: 5, padding: 16, overflow: 'hidden' },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 5 },
  pillT: { fontSize: 12.5, fontWeight: '800', marginLeft: 5 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 5, marginTop: 10 },
});
