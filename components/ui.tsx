import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, StyleSheet, Modal, Animated, PanResponder, ScrollView, ViewStyle, TextInputProps, Easing, Switch, useWindowDimensions, StyleProp, ImageResizeMode, Platform, KeyboardAvoidingView, AccessibilityState } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, space, radius, type, shadow, glass, gradients, intentOf, interestOf } from '@/constants/theme';
import { useApp } from '@/services/store';
import { AnimatedPressable, usePressScale, Float, FadeIn } from './Motion';

// Tracks open Sheets/Dialogs. A Modal draws above everything, so the app-level Toast hides while one is open
// and the open Modal shows its own Toast instead (otherwise toasts fired from a sheet are invisible).
let overlays = 0; const overlaySubs = new Set<() => void>();
const bumpOverlay = (d: number) => { overlays += d; overlaySubs.forEach((f) => f()); };
const useOverlayOpen = () => useSyncExternalStore((cb) => { overlaySubs.add(cb); return () => { overlaySubs.delete(cb); }; }, () => overlays > 0, () => false);
function useTrackOverlay(visible: boolean) { useEffect(() => { if (!visible) return; bumpOverlay(1); return () => bumpOverlay(-1); }, [visible]); }

export { FadeIn, Pop, Float } from './Motion';

// ------------------------------------------------------------------------------------------
// Layout
// ------------------------------------------------------------------------------------------
export const Screen = ({ children, style, edges = ['top', 'bottom'] as any }: any) => (
  <LinearGradient colors={gradients.bg} style={{ flex: 1 }}>
    <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>{children}</SafeAreaView>
  </LinearGradient>
);

// Android draws the elevation shadow through a translucent fill (grey box), so drop it for rgba() backgrounds.
const flat = (style: StyleProp<ViewStyle>): ViewStyle | undefined => (Platform.OS === 'android' && typeof (StyleSheet.flatten(style) as any)?.backgroundColor === 'string' && /^rgba\(/.test((StyleSheet.flatten(style) as any).backgroundColor) ? { elevation: 0 } : undefined);
export function Card({ children, style, onPress, accessibilityLabel, accessibilityState }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string; accessibilityState?: AccessibilityState }) {
  const p = usePressScale(0.985);
  if (!onPress) return <View style={[s.card, style, flat(style)]}>{children}</View>;
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={accessibilityState} onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} style={[s.card, style, flat(style), { transform: [{ scale: p.scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}

export function IconBtn({ name, onPress, label, color = colors.text, bg = colors.surface, size = 22, badge }: any) {
  const p = usePressScale(0.9);
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} hitSlop={6}
      style={[s.iconBtn, { backgroundColor: bg }, bg === 'transparent' && { borderWidth: 0, elevation: 0, shadowOpacity: 0 }, { transform: [{ scale: p.scale }] }]}>
      <Ionicons name={name} size={size} color={color} />
      {!!badge && <View style={s.dot} />}
    </AnimatedPressable>
  );
}

export function Header({ title, right, back = true, onBack }: { title: string; right?: React.ReactNode; back?: boolean; onBack?: () => void }) {
  const r = useRouter(); const [rw, setRw] = useState(44);
  // Left and right slots always share the same width, so the title stays centred when the right side changes.
  return (
    <View style={s.header}>
      <View style={{ width: rw, alignItems: 'flex-start' }}>{back ? <IconBtn name="chevron-back" label="Go back" onPress={() => (onBack ? onBack() : r.canGoBack() ? r.back() : r.replace('/'))} /> : <View style={{ width: 44 }} />}</View>
      <Text style={[type.section, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title}</Text>
      <View onLayout={(e) => { const w = Math.max(44, Math.ceil(e.nativeEvent.layout.width)); setRw((x) => (x === w ? x : w)); }} style={{ minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' }}>{right}</View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------
// Buttons, inputs, chips
// ------------------------------------------------------------------------------------------
export function Btn({ title, onPress, variant = 'primary', loading, disabled, icon, style, textColor }: any) {
  const v = ({ primary: [colors.violet, '#fff'], secondary: [colors.violetSoft, colors.violet], ghost: ['transparent', colors.muted], danger: ['#FDECEF', colors.error], dark: [colors.navy, '#fff'] } as any)[variant].slice() as string[];
  if (textColor) v[1] = textColor;
  const off = disabled || loading;
  const p = usePressScale(0.96);
  const customBg = !!(StyleSheet.flatten(style) as any)?.backgroundColor; // a caller-set colour (e.g. red) must not be covered by the gradient
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!off }} disabled={off} onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut}
      style={[s.btn, { backgroundColor: v[0], opacity: off ? 0.5 : 1 }, style, { transform: [{ scale: p.scale }] }]}>
      {variant === 'primary' && !customBg && <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {loading ? <ActivityIndicator color={v[1]} /> : (<>{icon && <Ionicons name={icon} size={19} color={v[1]} style={{ marginRight: 8 }} />}<Text maxFontSizeMultiplier={1.25} style={[type.button, { color: v[1], textAlign: 'center' }]}>{title}</Text></>)}
    </AnimatedPressable>
  );
}

export function Field({ label, error, secure, ...p }: TextInputProps & { label: string; error?: string; secure?: boolean }) {
  const [show, setShow] = useState(false);
  const f = useRef(new Animated.Value(0)).current;
  const focus = (to: number) => Animated.timing(f, { toValue: to, duration: 180, useNativeDriver: false }).start();
  const border = error ? colors.error : f.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.violet] });
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.caption, { marginBottom: 6, fontWeight: '700', color: colors.text }]}>{label}</Text>
      <Animated.View style={[s.field, { borderColor: border as any }]}>
        <TextInput {...p} secureTextEntry={secure && !show} placeholderTextColor="#A5A3BA" accessibilityLabel={label}
          onFocus={(e) => { focus(1); p.onFocus?.(e); }} onBlur={(e) => { focus(0); p.onBlur?.(e); }}
          style={{ flex: 1, fontSize: 15.5, color: colors.text, paddingVertical: 13, textAlignVertical: p.multiline ? 'top' : 'center', minHeight: p.multiline ? 84 : undefined }} />
        {secure && <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow(!show)} hitSlop={10}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} /></Pressable>}
      </Animated.View>
      {!!error && <FadeIn y={-4} duration={200}><Text style={{ color: colors.error, fontSize: 12.5, marginTop: 5 }}>{error}</Text></FadeIn>}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Search', autoFocus }: any) {
  return (<View style={[s.field, { backgroundColor: colors.surface }]}><Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} autoFocus={autoFocus} returnKeyType="search" placeholderTextColor="#A5A3BA" style={[{ flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]} accessibilityLabel={placeholder} /></View>);
}

export function Chip({ label, icon, selected, onPress, color = colors.violet }: any) {
  const p = usePressScale(0.94);
  return (
    <AnimatedPressable onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} accessibilityRole="button" accessibilityState={{ selected: !!selected }}
      style={[s.chip, selected && { backgroundColor: color, borderColor: color }, { transform: [{ scale: p.scale }] }]}>
      {!!icon && <Ionicons name={icon} size={16} color={selected ? '#fff' : color} style={{ marginRight: 6 }} />}
      <Text maxFontSizeMultiplier={1.25} style={{ fontWeight: '700', fontSize: 13.5, textAlign: 'center', color: selected ? '#fff' : colors.text }}>{label}</Text>
    </AnimatedPressable>
  );
}

export const Toggle = ({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) => (
  <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ false: '#D5D1EA', true: colors.violet }} thumbColor="#fff" ios_backgroundColor="#D5D1EA" />
);

export const IntentBadge = ({ k }: { k: string }) => { const i = intentOf(k); return (<View style={[s.badge, { backgroundColor: i.color + '1A' }]}><Ionicons name={i.icon as any} size={13} color={i.color} /><Text maxFontSizeMultiplier={1.2} style={{ color: i.color, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{i.short}</Text></View>); };
export const InterestTag = ({ k }: { k: string }) => { const i = interestOf(k); return i ? <View style={s.tag}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={i.icon as any} size={13} color={colors.navy} /><Text style={{ fontSize: 12.5, color: colors.navy, marginLeft: 4, fontWeight: '500' }}>{i.label}</Text></View></View> : null; };

// ------------------------------------------------------------------------------------------
// Images: shimmer while loading, then a soft fade + zoom-settle. Re-animates when `uri` changes,
// so a newly picked photo previews smoothly.
// ------------------------------------------------------------------------------------------
export function FadeImage({ uri, style, resizeMode = 'cover', fallbackIcon = 'person' }: { uri?: string; style?: StyleProp<ViewStyle>; resizeMode?: ImageResizeMode; fallbackIcon?: string }) {
  const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false);
  const o = useRef(new Animated.Value(0)).current;
  const sh = useRef(new Animated.Value(0.35)).current;
  useEffect(() => { o.setValue(0); setLoaded(false); setFailed(false); }, [uri]);
  useEffect(() => {
    if (loaded) return;
    const a = Animated.loop(Animated.sequence([Animated.timing(sh, { toValue: 0.9, duration: 650, useNativeDriver: true }), Animated.timing(sh, { toValue: 0.35, duration: 650, useNativeDriver: true })]));
    a.start(); return () => a.stop();
  }, [loaded, uri]);
  const onLoad = () => { setLoaded(true); Animated.timing(o, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); };
  const showFallback = !uri || failed;
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' }, style]}>
      {!loaded && !showFallback && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#DDD6FA', opacity: sh }]} />}
      {showFallback ? <Ionicons name={fallbackIcon as any} size={32} color={colors.violet} /> : (
        <Animated.Image source={{ uri }} resizeMode={resizeMode} onLoad={onLoad} onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: o, transform: [{ scale: o.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }] }]} />
      )}
    </View>
  );
}

export function Avatar({ uri, size = 48, online }: { uri?: string; size?: number; online?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <FadeImage uri={uri} style={{ width: size, height: size, borderRadius: size / 2 }} />
      {online && <View style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.26, height: size * 0.26, borderRadius: 99, backgroundColor: colors.online, borderWidth: 2, borderColor: '#fff' }} />}
    </View>
  );
}

// ------------------------------------------------------------------------------------------
// Content blocks
// ------------------------------------------------------------------------------------------
export const SectionTitle = ({ title, action, onAction }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md, marginTop: space.xl }}>
    <Text style={type.section}>{title}</Text>{!!action && <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button"><Text style={{ color: colors.violet, fontWeight: '700', fontSize: 14 }}>{action}</Text></Pressable>}
  </View>
);

export function Empty({ icon = 'compass-outline', title, text, action, onAction }: any) {
  return (
    <FadeIn style={{ alignItems: 'center', padding: space.xxl }}>
      <Float amp={5}><View style={s.emptyIcon}><Ionicons name={icon} size={36} color={colors.violet} /></View></Float>
      <Text style={[type.section, { marginTop: space.lg, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.secondary, { textAlign: 'center', marginTop: 6, marginBottom: space.lg }]}>{text}</Text>
      {!!action && <Btn title={action} onPress={onAction} variant="secondary" />}
    </FadeIn>
  );
}

export function Skeleton({ h = 72, style }: { h?: number; style?: ViewStyle }) {
  const o = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 0.4, duration: 700, useNativeDriver: true })])); a.start(); return () => a.stop(); }, []);
  return <Animated.View style={[{ height: h, borderRadius: 5, backgroundColor: '#E7E4F5', opacity: o, marginBottom: space.md }, style]} />;
}

export const Banner = ({ icon = 'information-circle', text, tone = 'info', action, onAction }: any) => {
  const c = tone === 'warn' ? colors.warning : tone === 'err' ? colors.error : colors.violet;
  return (
    <FadeIn y={-6} duration={260}>
      <View style={[s.banner, { backgroundColor: c + '16', borderColor: c + '33' }]}>
        <Ionicons name={icon} size={20} color={c} /><Text style={[type.secondary, { flex: 1, marginHorizontal: 10, color: colors.text }]}>{text}</Text>
        {!!action && <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button"><Text style={{ color: tone === 'warn' ? '#8A5A00' : c, fontWeight: '800' }}>{action}</Text></Pressable>}
      </View>
    </FadeIn>
  );
};

export const Row = ({ icon, title, sub, right: r0, onPress, danger }: any) => {
  const right = React.isValidElement(r0) && (r0 as any).type === Toggle && !(r0 as any).props.label ? React.cloneElement(r0 as any, { label: title }) : r0;
  return (
  <Pressable onPress={onPress} disabled={!onPress} accessible={!!onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.violetSoft }]} accessibilityRole={onPress ? 'button' : undefined}>
    <View style={[s.rowIcon, danger && { backgroundColor: '#FDECEF' }]}><Ionicons name={icon} size={20} color={danger ? colors.error : colors.violet} /></View>
    <View style={{ flex: 1, paddingRight: 8 }}><Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.error }]}>{title}</Text>{!!sub && <Text style={type.caption}>{sub}</Text>}</View>
    {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
  </Pressable>  );
};

// ------------------------------------------------------------------------------------------
// Overlays
// ------------------------------------------------------------------------------------------
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const y = useRef(new Animated.Value(700)).current;
  const insets = useSafeAreaInsets(); const { height } = useWindowDimensions();
  const closeRef = useRef(onClose); closeRef.current = onClose; const hRef = useRef(height); hRef.current = height;
  useTrackOverlay(visible);
  useEffect(() => { if (visible) { y.setValue(hRef.current); Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 190, mass: 0.9 }).start(); } }, [visible]);
  const close = () => Animated.timing(y, { toValue: hRef.current, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => closeRef.current());
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
    onPanResponderMove: (_, g) => g.dy > 0 && y.setValue(g.dy),
    onPanResponderRelease: (_, g) => (g.dy > 100 ? Animated.timing(y, { toValue: hRef.current, duration: 160, useNativeDriver: true }).start(() => closeRef.current()) : Animated.spring(y, { toValue: 0, useNativeDriver: true }).start()),
  })).current;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={close} accessibilityLabel="Dismiss" />
      {/* lifts the sheet above the keyboard so text fields inside it stay visible */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[s.sheet, { transform: [{ translateY: y }], paddingBottom: insets.bottom + space.lg }]}>
          <View {...pan.panHandlers} style={{ alignItems: 'center', paddingVertical: 10 }}><View style={s.handle} /></View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} style={{ maxHeight: height * 0.82 }}>{children}</ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      <Toast inModal />
    </Modal>
  );
}

export function Dialog({ visible, title, text, confirm, danger, onConfirm, onCancel }: any) {
  const v = useRef(new Animated.Value(0)).current;
  useTrackOverlay(!!visible);
  useEffect(() => { if (visible) { v.setValue(0); Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 220 }).start(); } }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[s.backdrop, { justifyContent: 'center', padding: space.xxl }]}>
        <Animated.View style={{ backgroundColor: '#fff', borderRadius: 5, padding: space.xl, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
          <Text style={[type.title, { textAlign: 'center' }]}>{title}</Text><Text style={[type.secondary, { marginVertical: space.md, textAlign: 'center' }]}>{text}</Text>
          <Btn title={confirm} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} /><View style={{ height: 8 }} /><Btn title="Cancel" variant="ghost" onPress={onCancel} />
        </Animated.View>
      </View>
      <Toast inModal />
    </Modal>
  );
}

export function Toast({ inModal }: { inModal?: boolean }) {
  const { toastMsg } = useApp(); const insets = useSafeAreaInsets(); const overlay = useOverlayOpen();
  const [shown, setShown] = useState(toastMsg);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (toastMsg) { setShown(toastMsg); Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }).start(); }
    else Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => finished && setShown(null));
  }, [toastMsg]);
  if (!shown || (!inModal && overlay)) return null; // while a Sheet/Dialog is open, only its own copy shows
  const err = shown.kind === 'err';
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, ...(inModal ? { top: insets.top + 12 } : { bottom: insets.bottom + 90 }), zIndex: 100, alignItems: 'center', opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [inModal ? -20 : 20, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: err ? colors.error : colors.navy, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 5, ...shadow }}>
        <Ionicons name={err ? 'alert-circle' : 'checkmark-circle'} size={19} color="#fff" /><Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 14 }}>{shown.m}</Text>
      </View>
    </Animated.View>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  const w = useRef(new Animated.Value(step / total)).current;
  useEffect(() => { Animated.timing(w, { toValue: step / total, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [step]);
  return <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}><Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: colors.violet, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>;
}

const s = StyleSheet.create({
  card: { ...glass, borderRadius: 5, padding: space.lg },
  iconBtn: { width: 44, height: 44, borderRadius: 5, alignItems: 'center', justifyContent: 'center', ...glass },
  dot: { position: 'absolute', top: 11, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.dating, borderWidth: 1.5, borderColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm },
  btn: { minHeight: 50, borderRadius: 5, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, minHeight: 44, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, marginRight: 6, marginTop: 6 },
  tag: { backgroundColor: colors.violetSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, marginRight: 6, marginTop: 6 },
  emptyIcon: { width: 72, height: 72, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: space.md, borderRadius: 5, marginVertical: space.sm, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 5, minHeight: 58 },
  rowIcon: { width: 38, height: 38, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(21,21,43,0.5)' },
  sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#fff', borderTopLeftRadius: 5, borderTopRightRadius: 5, paddingHorizontal: space.xl },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
});
