import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, glass, radius } from '@/constants/theme';

// Short names so every label fits on a 320 px wide phone.
const LABEL: Record<string, string> = { connections: 'People' };
const ICONS: Record<string, string> = { home: 'home', nearby: 'navigate', connections: 'people', messages: 'chatbubbles', profile: 'person' };
// Animated bottom bar: a sliding pill follows the active tab, the icon springs up and the label fades in.
export default function TabBar({ state, descriptors, emitter, navigateToTab, navigation }: any) {
  const insets = useSafeAreaInsets(); const [w, setW] = useState(0);
  const n = state.routes.length, cell = w / n;
  const x = useRef(new Animated.Value(0)).current; const six = useRef(new Animated.Value(6)).current;
  const [kb, setKb] = useState(false);
  // Hide the bar while the keyboard is open so it does not ride above the keyboard and eat screen space.
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKb(true));
    const b = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  useEffect(() => { if (cell) Animated.spring(x, { toValue: state.index * cell, useNativeDriver: true, damping: 16, stiffness: 180, mass: 0.8 }).start(); }, [state.index, cell]);
  if (kb) return null;
  return (
    <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.bar} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {!!cell && <Animated.View style={[s.pill, { width: cell - 12, transform: [{ translateX: Animated.add(x, six) }] }]} />}
        {state.routes.map((route: any, i: number) => <Item key={route.key} route={route} focused={state.index === i} opts={descriptors[route.key].options} emitter={emitter} go={navigateToTab} nav={navigation} />)}
      </View>
    </View>);
}
function Item({ route, focused, opts, emitter, go, nav }: any) {
  const up = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { Animated.spring(up, { toValue: focused ? 1 : 0, useNativeDriver: true, damping: 12, stiffness: 200 }).start(); }, [focused]);
  // expo-router's tabBar gets `emitter` + `navigateToTab` (older React Navigation gave `navigation`); support both.
  const press = () => {
    const ev = { type: 'tabPress', target: route.key, canPreventDefault: true };
    const e = emitter?.emit ? emitter.emit(ev) : nav?.emit ? nav.emit(ev) : { defaultPrevented: false };
    if (focused || e?.defaultPrevented) return;
    if (go) go(route.key); else if (nav?.navigate) nav.navigate(route.name);
  };
  const name = ICONS[route.name] || 'ellipse';
  return (
    <Pressable onPress={press} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={opts.tabBarBadge ? `${opts.title}, ${opts.tabBarBadge} new` : opts.title} style={s.item}>
      <Animated.View style={{ transform: [{ translateY: up.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }, { scale: up.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}>
        <Ionicons name={(focused ? name : name + '-outline') as any} size={21} color={focused ? colors.violet : colors.muted} />
        {!!opts.tabBarBadge && <View style={s.badge}><Text style={s.bt}>{opts.tabBarBadge}</Text></View>}
      </Animated.View>
      <Animated.Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[s.label, { color: focused ? colors.violet : colors.muted, opacity: up.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }]}>{LABEL[route.name] || opts.title}</Animated.Text>
    </Pressable>);
}
const s = StyleSheet.create({
  wrap: { paddingHorizontal: 10, backgroundColor: 'transparent' },
  bar: { flexDirection: 'row', height: 60, borderRadius: 5, ...glass, backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255,255,255,0.88)' },
  pill: { position: 'absolute', top: 6, bottom: 6, left: 0, borderRadius: 5, backgroundColor: colors.violetSoft },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  badge: { position: 'absolute', top: -5, right: -10, backgroundColor: colors.dating, borderRadius: 8, minWidth: 15, height: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bt: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
