import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, Easing, Text } from 'react-native';
import { useAppWidth } from '@/services/layout';
import Svg, { Circle, Line, Path, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, intentOf } from '@/constants/theme';
import { Nearby } from '@/types';
import { approxDistance, radiusLabel } from '@/services/geo';
import { FadeImage, Pop } from './ui';
import { PulseRing, useReduceMotion } from './Motion';

const LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
type Props = { people: Nearby[]; radius: number; heading: number | null; selectedId?: string; onSelect: (n: Nearby) => void; active: boolean };

// Angle that never "spins the long way round" when the compass crosses 359 -> 0.
function useSmoothAngle(target: number) {
  const v = useRef(new Animated.Value(target)).current; const last = useRef(target);
  useEffect(() => {
    const d = ((target - (last.current % 360)) + 540) % 360 - 180; const next = last.current + d; last.current = next;
    Animated.timing(v, { toValue: next, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [target]);
  return v;
}

// One person on the radar. Glides to its new spot when you turn or move instead of jumping.
function Marker({ n, x, y, selected, onSelect }: { n: Nearby; x: number; y: number; selected: boolean; onSelect: (n: Nearby) => void }) {
  const sz = 44; const half = (sz + 6) / 2; // the circle is sz + 6 wide (photo plus 3 px border each side)
  const xy = useRef(new Animated.ValueXY({ x: x - half, y: y - half })).current;
  const sc = useRef(new Animated.Value(selected ? 1.25 : 1)).current;
  useEffect(() => { Animated.timing(xy, { toValue: { x: x - half, y: y - half }, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [x, y]);
  useEffect(() => { Animated.spring(sc, { toValue: selected ? 1.25 : 1, useNativeDriver: true, damping: 12, stiffness: 200 }).start(); }, [selected]);
  const col = intentOf(n.user.intentions[0]).color;
  return (
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, zIndex: selected ? 5 : 1, transform: [...xy.getTranslateTransform()] }}>
      <Pop delay={Math.min(n.distance, 600) / 4}>
        <Pressable onPress={() => onSelect(n)} accessibilityRole="button" accessibilityLabel={`${n.user.name}, ${approxDistance(n.distance)}`} style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: sc }] }}>
            <View style={{ width: sz + 6, height: sz + 6, borderRadius: (sz + 6) / 2, borderWidth: 3, borderColor: selected ? colors.navy : col, backgroundColor: '#fff', overflow: 'hidden' }}>
              <FadeImage uri={n.user.photo} style={{ width: sz, height: sz }} />
            </View>
          </Animated.View>
          <View style={{ backgroundColor: '#fff', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1, marginTop: 3, elevation: 2 }}><Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.navy }}>{approxDistance(n.distance).replace('~', '')}</Text></View>
        </Pressable>
      </Pop>
    </Animated.View>
  );
}

export default function Radar({ people, radius, heading, selectedId, onSelect, active }: Props) {
  const width = useAppWidth(); const reduce = useReduceMotion();
  const size = Math.min(width - 32, 380), c = size / 2, R = c - 30, S = R - 24; // S = radius of the scale: a person at the full radius sits on the outer labelled ring
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduce) return;
    spin.setValue(0);
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true }));
    a.start(); return () => a.stop();
  }, [active, reduce]);
  const ang = useSmoothAngle(heading ?? 0); // compass dial turns against device heading; north-up when unavailable
  const ringRot = ang.interpolate({ inputRange: [-7200, 7200], outputRange: ['7200deg', '-7200deg'] });
  const upRot = ang.interpolate({ inputRange: [-7200, 7200], outputRange: ['-7200deg', '7200deg'] });
  const pos = (n: Nearby) => { const r = Math.min(n.distance / radius, 1) * S; const a = (n.rel * Math.PI) / 180; return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) }; };
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Defs><RadialGradient id="g" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={colors.violet} stopOpacity="0.16" /><Stop offset="1" stopColor={colors.violet} stopOpacity="0.03" /></RadialGradient></Defs>
        <Circle cx={c} cy={c} r={R} fill="url(#g)" stroke={colors.violet} strokeOpacity={0.35} strokeWidth={1.5} />
        <Circle cx={c} cy={c} r={S} fill="none" stroke={colors.violet} strokeOpacity={0.3} strokeDasharray="4 6" />
        <Circle cx={c} cy={c} r={S * 0.66} fill="none" stroke={colors.violet} strokeOpacity={0.2} strokeDasharray="4 6" />
        <Circle cx={c} cy={c} r={S * 0.33} fill="none" stroke={colors.violet} strokeOpacity={0.2} strokeDasharray="4 6" />
        {/* distance scale, so the rings can be read */}
        {[0.33, 0.66, 1].map((f) => <SvgText key={f} x={c + 5} y={c - S * f - 3} fontSize={9.5} fontWeight="700" fill={colors.muted}>{radiusLabel(Math.round(radius * f))}</SvgText>)}
        <Line x1={c - R} y1={c} x2={c + R} y2={c} stroke={colors.violet} strokeOpacity={0.12} />
        <Line x1={c} y1={c - R} x2={c} y2={c + R} stroke={colors.violet} strokeOpacity={0.12} />
      </Svg>
      {/* expanding pulse rings */}
      {active && <View pointerEvents="none" style={{ position: 'absolute', left: c - R, top: c - R, width: R * 2, height: R * 2 }}><PulseRing size={R * 2} /><PulseRing size={R * 2} delay={1200} /></View>}
      {/* compass dial: rotates smoothly, letters stay upright */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, transform: [{ rotate: ringRot }] }}>
        {LABELS.map((l, i) => { const a = (i * 45 * Math.PI) / 180; const r = R + 16; return (
          <Animated.Text key={l} style={{ position: 'absolute', left: c + r * Math.sin(a) - 14, top: c - r * Math.cos(a) - 10, width: 28, textAlign: 'center', fontSize: l === 'N' ? 15 : 11.5, fontWeight: '800', color: l === 'N' ? colors.dating : colors.muted, transform: [{ rotate: upRot }] }}>{l}</Animated.Text>); })}
      </Animated.View>
      {/* sweep */}
      {active && !reduce && <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <Svg width={size} height={size}><Path d={`M ${c} ${c} L ${c} ${c - R} A ${R} ${R} 0 0 1 ${c + R * Math.sin(0.6)} ${c - R * Math.cos(0.6)} Z`} fill={colors.violet} fillOpacity={0.16} /></Svg>
      </Animated.View>}
      {/* me */}
      <View style={{ position: 'absolute', left: c - 12, top: c - 12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.navy, borderWidth: 4, borderColor: '#fff', elevation: 4 }} />
      {/* people */}
      {people.map((n) => { const p = pos(n); return <Marker key={n.user.id} n={n} x={p.x} y={p.y} selected={selectedId === n.user.id} onSelect={onSelect} />; })}
    </View>
  );
}
