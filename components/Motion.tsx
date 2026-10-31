import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo, Pressable, StyleProp, ViewStyle } from 'react-native';

// ---- Reduce motion (respects the phone's accessibility setting) -----------------------------
let reduceCache: boolean | null = null;
export function useReduceMotion() {
  const [r, setR] = useState(reduceCache ?? false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceCache = v; setR(v); }).catch(() => {});
  }, []);
  return r;
}

// ---- Fade + slide up on mount. Use `delay` to stagger lists --------------------------------
export function FadeIn({ children, delay = 0, y = 14, duration = 380, style }: { children?: React.ReactNode; delay?: number; y?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduce]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ---- Springy scale-in (new photo, chat bubble, map marker) ---------------------------------
export function Pop({ children, delay = 0, from = 0.6, style }: { children?: React.ReactNode; delay?: number; from?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.spring(v, { toValue: 1, delay: reduce ? 0 : delay, useNativeDriver: true, damping: 13, stiffness: 170, mass: 0.8 });
    a.start();
    return () => a.stop();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ---- Gentle endless float (icons, hero illustrations) --------------------------------------
export function Float({ children, amp = 6, duration = 1800, delay = 0, style }: { children?: React.ReactNode; amp?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: duration + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: duration + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduce]);
  return <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] }) }] }]}>{children}</Animated.View>;
}

// ---- Expanding ring (location / radar pulse) -----------------------------------------------
export function PulseRing({ size, color = '#6C4DF6', delay = 0, duration = 2400 }: { size: number; color?: string; delay?: number; duration?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduce]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color,
      opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.45, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
    }} />
  );
}

// ---- Pressable with a springy press-scale. Layout styles (flex, margin) go on `style` ------
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function usePressScale(to = 0.96) {
  const v = useRef(new Animated.Value(1)).current;
  const go = (x: number) => Animated.spring(v, { toValue: x, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return { scale: v, onPressIn: () => go(to), onPressOut: () => go(1) };
}
