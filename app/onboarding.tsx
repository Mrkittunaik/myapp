import React, { useEffect, useRef, useState } from 'react';
import { useAppWidth } from '@/services/layout';
import { View, Text, FlatList, useWindowDimensions, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FadeIn } from '@/components/ui';
import { Float } from '@/components/Motion';
import { useApp } from '@/services/store';
import { colors, type, INTENTS } from '@/constants/theme';

// Local avatars (no network needed on first launch): a tinted circle with a person icon.
const TINTS = ['#C9BDFB', '#F6B8D4', '#B7D4F7', '#B8E6D0', '#FBE2A8'];
const Av = ({ n, size, style }: any) => <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#fff', position: 'absolute', backgroundColor: TINTS[n % TINTS.length], alignItems: 'center', justifyContent: 'center' }, style]}><Ionicons name="person" size={size * 0.55} color="#fff" /></View>;
const Vis1 = () => (<View style={{ width: 280, height: 280 }}>
  <Svg width={280} height={280}>{[130, 90, 50].map((r) => <Circle key={r} cx={140} cy={140} r={r} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} fill="none" />)}<Circle cx={140} cy={140} r={14} fill="#fff" /></Svg>
  <Float><Av n={44} size={56} style={{ left: 20, top: 40 }} /></Float><Float delay={300}><Av n={32} size={50} style={{ right: 10, top: 70 }} /></Float>
  <Float delay={600}><Av n={65} size={48} style={{ left: 70, bottom: 14 }} /></Float><Float delay={200}><Av n={75} size={44} style={{ right: 44, bottom: 40 }} /></Float></View>);
const Vis2 = () => (<View style={{ width: 280, height: 280 }}>
  <Svg width={280} height={280}><Circle cx={140} cy={140} r={120} stroke="#fff" strokeWidth={3} fill="rgba(255,255,255,0.1)" />
    <Path d="M140 40 L152 140 L140 240 L128 140 Z" fill="#fff" fillOpacity={0.9} /><Line x1={30} y1={140} x2={250} y2={140} stroke="#fff" strokeOpacity={0.4} /><Circle cx={140} cy={140} r={8} fill={colors.navy} /></Svg>
  <Text style={{ position: 'absolute', top: 4, alignSelf: 'center', color: '#fff', fontWeight: '800', fontSize: 18 }}>N</Text>
  <Float><View style={{ position: 'absolute', right: 20, top: 50 }}><Av n={12} size={46} style={{ position: 'relative' }} /><Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>120 m</Text></View></Float>
  <Float delay={400}><View style={{ position: 'absolute', left: 14, bottom: 60 }}><Av n={52} size={46} style={{ position: 'relative' }} /><Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>350 m</Text></View></Float></View>);
const Vis3 = () => (<View style={{ width: 280, height: 280, justifyContent: 'center' }}>
  {[{ i: 0, g: 'women', n: 90, r: '-8deg', y: 0 }, { i: 3, g: 'men', n: 75, r: '5deg', y: 6 }, { i: 2, g: 'women', n: 65, r: '-3deg', y: 6 }].map((c, k) => { const it = INTENTS[c.i]; return (
    <Float key={k} delay={k * 250}><View style={{ backgroundColor: '#fff', borderRadius: 5, padding: 10, marginTop: c.y, flexDirection: 'row', alignItems: 'center', transform: [{ rotate: c.r }] }}>
      <Av n={c.n} size={40} style={{ position: 'relative' }} /><Ionicons name={it.icon as any} size={18} color={it.color} style={{ marginLeft: 10 }} /><Text style={{ marginLeft: 12, fontWeight: '800', color: it.color }}>{it.label}</Text></View></Float>); })}</View>);
const Vis4 = () => (<View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
  <Svg width={200} height={230} viewBox="0 0 200 230"><Path d="M100 10 L180 40 V110 C180 165 145 205 100 222 C55 205 20 165 20 110 V40 Z" fill="#fff" /></Svg>
  <Float><Ionicons name="lock-closed" size={64} color={colors.violet} style={{ position: 'absolute', top: 70 }} /></Float>
  <View style={{ position: 'absolute', bottom: 14, backgroundColor: '#fff', borderRadius: 5, padding: 6, flexDirection: 'row', alignItems: 'center' }}><Text style={{ marginHorizontal: 10, fontWeight: '700', color: colors.navy }}>Discoverable</Text><View style={{ width: 52, height: 30, borderRadius: 5, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 3 }}><View style={{ width: 24, height: 24, borderRadius: 5, backgroundColor: '#fff' }} /></View></View></View>);
const SLIDES = [
  { V: Vis1, t: 'Meet People Around You', d: 'Discover people nearby who are open to making new connections.', g: ['#6C4DF6', '#3B2AA8'] },
  { V: Vis2, t: "See Who's Nearby", d: 'Explore nearby profiles with exact direction and distance.', g: ['#2B5BE6', '#1B1B4B'] },
  { V: Vis3, t: 'Friendship, Connections & Dating', d: "Choose what you're looking for and discover people with similar intentions.", g: ['#E0488B', '#6C4DF6'] },
  { V: Vis4, t: "You're in Control", d: "Choose when you're discoverable and what information you share.", g: ['#1B1B4B', '#6C4DF6'] },
];
export default function Onboarding() {
  const width = useAppWidth(); const { height } = useWindowDimensions(); const k = height < 700 ? 0.74 : height < 780 ? 0.88 : 1; /* shrink the artwork on short screens */ const r = useRouter(); const { set } = useApp();
  const [i, setI] = useState(0); const list = useRef<FlatList>(null);
  const finish = () => { set({ onboarded: true }); r.replace('/auth/welcome'); };
  const go = (n: number) => { list.current?.scrollToIndex({ index: n, animated: true }); setI(n); };
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={SLIDES[i].g as any} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, minHeight: 56 }}>
          {i > 0 ? <Pressable onPress={() => go(i - 1)} accessibilityLabel="Back" hitSlop={10}><Ionicons name="chevron-back" size={26} color="#fff" /></Pressable> : <View />}
          {i < 3 && <Pressable onPress={finish} hitSlop={14}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Skip</Text></Pressable>}
        </View>
        <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} ref={list} data={SLIDES} horizontal pagingEnabled  keyExtractor={(x) => x.t}
          onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (<ScrollView style={{ width }} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><View style={{ width: 280 * k, height: 280 * k, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 280, height: 280, transform: [{ scale: k }] }}><item.V /></View></View><FadeIn delay={120}><Text style={{ ...type.display, fontSize: 30, color: '#fff', textAlign: 'center', marginTop: 28 }}>{item.t}</Text></FadeIn><FadeIn delay={220}><Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16.5, textAlign: 'center', marginTop: 10, lineHeight: 24 }}>{item.d}</Text></FadeIn></ScrollView>)} />
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>{SLIDES.map((_, k) => <View key={k} style={{ height: 8, width: k === i ? 28 : 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: '#fff', opacity: k === i ? 1 : 0.4 }} />)}</View>
          <Btn variant="secondary" style={{ backgroundColor: "#fff" }} title={i === 3 ? 'Get started' : 'Next'} onPress={() => (i === 3 ? finish() : go(i + 1))} />
        </View>
      </SafeAreaView>
    </View>
  );
}
