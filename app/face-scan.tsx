import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Platform, Pressable, ActivityIndicator, Animated, Easing } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FaceDetection from '@react-native-ml-kit/face-detection';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn } from '@/components/ui';
import { useApp } from '@/services/store';
import { api, ApiError } from '@/services/api';
import { auth } from '@/services/auth';
import { colors, type } from '@/constants/theme';

type Step = 'center' | 'left' | 'right' | 'up' | 'down';
type Phase = 'intro' | 'scan' | 'sending' | 'done' | 'error';
const TEXT: Record<Step, string> = { center: 'Look straight at the camera', left: 'Slowly turn your head to the LEFT', right: 'Slowly turn your head to the RIGHT', up: 'Slowly look UP', down: 'Slowly look DOWN' };
const ICON: Record<Step, string> = { center: 'scan-outline', left: 'arrow-back', right: 'arrow-forward', up: 'arrow-up', down: 'arrow-down' };
// Head angles from ML Kit, in degrees. Y = turn left/right, X = look up/down.
const TURN = 20, TILT = 12, FRONT_Y = 12, FRONT_X = 12, HOLD = 2, STEP_TIMEOUT_MS = 30000;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function FaceScan() {
  const r = useRouter(); const a = useApp(); const [perm, askPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null); const alive = useRef(true);
  const [phase, setPhase] = useState<Phase>('intro'); const [steps, setSteps] = useState<Step[]>([]); const [idx, setIdx] = useState(0); const [msg, setMsg] = useState('');
  const [agree, setAgree] = useState(false); const [seen, setSeen] = useState(false); const [pose, setPose] = useState({ x: 0, y: 0 }); const [ready, setReady] = useState(false);
  const run = useRef({ session: '', steps: [] as Step[], idx: 0, hold: 0, frames: [] as string[], firstSign: 0, leftSign: 1, started: 0 });
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => { Animated.timing(prog, { toValue: steps.length ? idx / steps.length : 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [idx, steps.length]);

  const begin = useCallback(async () => {
    if (!perm?.granted) { const p = await askPerm(); if (!p.granted) { setMsg('Camera permission is needed for the face scan. Allow it in phone settings.'); setPhase('error'); return; } }
    try {
      const s = await api.faceStart(true);
      run.current = { session: s.sessionId, steps: s.steps, idx: 0, hold: 0, frames: [], firstSign: 0, leftSign: 1, started: Date.now() };
      setSteps(s.steps); setIdx(0); setSeen(false); setPose({ x: 0, y: 0 }); setPhase('scan');
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not start the scan.'); setPhase('error'); }
  }, [perm?.granted, askPerm]);

  const submit = useCallback(async () => {
    setPhase('sending');
    try {
      const frames: { uri: string }[] = [];
      for (const uri of run.current.frames) { const m = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 540 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }); frames.push({ uri: m.uri }); }
      const res = await api.faceVerify(run.current.session, frames);
      a.update((s) => ({ face: { status: 'verified', gender: res.face.gender, age: res.face.age }, me: { ...s.me, gender: res.face.gender || s.me.gender } }));
      setPhase('done');
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not reach the server.'); setPhase('error'); }
    finally { run.current.frames = []; } // the photos only ever lived in the app's cache; the server keeps none either
  }, [a]);

  // Live tracking loop: take a small photo, ask ML Kit where the head is, move the dot, advance when the pose is held.
  useEffect(() => {
    if (phase !== 'scan' || !ready) return; let stop = false;
    const tick = async () => {
      while (!stop && alive.current) {
        const R = run.current; const step = R.steps[R.idx]; if (!step) return;
        if (Date.now() - R.started > STEP_TIMEOUT_MS * R.steps.length) { setMsg('This took too long. Try again in good light.'); setPhase('error'); return; }
        try {
          const pic: any = await cam.current?.takePictureAsync({ quality: 0.5, shutterSound: false, skipProcessing: false } as any);
          if (!pic || stop) continue;
          const faces = await FaceDetection.detect(pic.uri, { performanceMode: 'fast', landmarkMode: 'none', classificationMode: 'none', minFaceSize: 0.25 });
          if (stop) return;
          if (!faces.length) { setSeen(false); R.hold = 0; continue; }
          if (faces.length > 1) { setSeen(false); setMsg('Only one face please.'); R.hold = 0; continue; }
          setMsg(''); setSeen(true);
          const f: any = faces[0]; const y = f.rotationY ?? f.headEulerAngleY ?? 0, x = f.rotationX ?? f.headEulerAngleX ?? 0, z = f.rotationZ ?? f.headEulerAngleZ ?? 0;
          setPose({ x: clamp(x / 30, -1, 1), y: clamp((y * R.leftSign * -1) / 35, -1, 1) });
          let ok = false;
          if (step === 'center') ok = Math.abs(y) < FRONT_Y && Math.abs(x) < FRONT_X && Math.abs(z) < 15;
          else if (step === 'up') ok = x > TILT && Math.abs(y) < 30;
          else if (step === 'down') ok = x < -TILT && Math.abs(y) < 30;
          else { // left / right: the first side may be either sign, the second side must be the opposite one
            const sign = Math.sign(y); const turned = Math.abs(y) > TURN && Math.abs(x) < 25;
            ok = turned && (R.firstSign === 0 || sign === -R.firstSign);
            if (ok && R.firstSign === 0) { R.firstSign = sign; R.leftSign = step === 'left' ? sign : -sign; } // calibrates which direction the dot should move
          }
          R.hold = ok ? R.hold + 1 : 0;
          if (R.hold >= HOLD) {
            R.frames.push(pic.uri); R.hold = 0; R.idx += 1; setIdx(R.idx);
            if (R.idx >= R.steps.length) { stop = true; submit(); return; }
          }
        } catch { await new Promise((res) => setTimeout(res, 300)); }
      }
    };
    tick(); return () => { stop = true; };
  }, [phase, ready, submit]);

  const step = steps[idx]; const dot = 70;
  if (phase === 'intro' || phase === 'error' || phase === 'done') {
    return (
      <LinearGradient colors={['#6C4DF6', '#1B1B4B']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={{ width: 104, height: 104, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={phase === 'done' ? 'shield-checkmark' : phase === 'error' ? 'alert-circle' : 'scan'} size={60} color={phase === 'done' ? colors.success : phase === 'error' ? colors.error : colors.violet} /></View>
            <Text style={{ ...type.display, color: '#fff', textAlign: 'center', marginTop: 20 }}>{phase === 'done' ? "You're verified" : phase === 'error' ? 'Scan not completed' : 'Verify your face'}</Text>
            {phase === 'intro' && <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>A quick live scan keeps Nearby real. You will turn your head left, right, up and down while we track your face. Our server then works out whether you are a man or a woman and your age, and shows that on your profile.</Text>}
            {phase === 'error' && <Text style={{ color: '#FFD9A0', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>{msg || 'Something went wrong.'}</Text>}
            {phase === 'done' && <Text style={{ color: '#fff', fontSize: 17, textAlign: 'center', marginTop: 12, lineHeight: 26 }}>{a.face.gender === 'Woman' ? 'She' : 'He'} · {a.face.gender} · age about {a.face.age}{'\n'}<Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>This is how other people will see you.</Text></Text>}
            {phase === 'intro' && [['lock-closed-outline', 'Photos are checked and deleted. We keep only the result.'], ['bulb-outline', 'Use good light, no hat or sunglasses, nobody else in view.']].map(([ic, t]) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}><Ionicons name={ic as any} size={20} color="#fff" /><Text style={{ color: '#fff', marginLeft: 12, flex: 1, fontSize: 14 }}>{t}</Text></View>))}
            {phase === 'intro' && <Pressable onPress={() => setAgree(!agree)} accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 }}>
              <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={26} color="#fff" />
              <Text style={{ color: '#fff', flex: 1, marginLeft: 12, fontSize: 13.5, lineHeight: 20 }}>I agree that my face photos are analysed once, on this app's server, to estimate my gender and age for verification, and are deleted right after. Only the result is kept, and I can delete it by deleting my account.</Text></Pressable>}
          </View>
          <View>
            {phase === 'done' ? <Btn variant="secondary" style={{ backgroundColor: '#fff' }} title="Continue" onPress={() => r.replace('/')} />
              : <Btn variant="secondary" style={{ backgroundColor: '#fff' }} icon="scan" title={phase === 'error' ? 'Try again' : 'Start face scan'} disabled={phase === 'intro' && !agree} onPress={begin} />}
            {phase !== 'done' && <Btn variant="ghost" textColor="#fff" title={a.face.status === 'verified' ? 'Cancel' : 'Log out'} onPress={async () => { if (a.face.status === 'verified') return r.back(); await auth.logout(); a.signOut(); r.replace('/auth/welcome'); }} />}
          </View>
        </SafeAreaView>
      </LinearGradient>);
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing="front" onCameraReady={() => setReady(true)} animateShutter={false} />
      <SafeAreaView pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'space-between' }}>
        <View style={{ padding: 16 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}><Animated.View style={{ height: 6, backgroundColor: colors.success, width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>
          <Text style={{ color: '#fff', marginTop: 8, textAlign: 'center', fontWeight: '700' }}>Step {Math.min(idx + 1, steps.length)} of {steps.length}</Text>
        </View>
        {/* head tracker: the dot follows your head left, right, up and down */}
        <View pointerEvents="none" style={{ alignItems: 'center' }}>
          <View style={{ width: 230, height: 300, borderRadius: 115, borderWidth: 4, borderColor: seen ? colors.success : '#fff', alignItems: 'center', justifyContent: 'center', opacity: 0.95 }}>
            {step && step !== 'center' && <Ionicons name={ICON[step] as any} size={64} color="rgba(255,255,255,0.9)" />}
            <View style={{ position: 'absolute', width: dot, height: dot, borderRadius: dot / 2, backgroundColor: seen ? 'rgba(31,169,113,0.55)' : 'rgba(255,255,255,0.35)', borderWidth: 2, borderColor: '#fff', transform: [{ translateX: pose.y * 80 }, { translateY: -pose.x * 100 }] }} />
          </View>
          <Text style={{ color: seen ? '#9CF0C8' : '#FFD9A0', marginTop: 10, fontWeight: '700' }}>{seen ? 'Face tracked' : 'Looking for your face…'}</Text>
        </View>
        <View style={{ padding: 20, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          {!ready ? <ActivityIndicator color="#fff" /> : <Text accessibilityLiveRegion="polite" style={{ color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{phase === 'sending' ? 'Checking with the server…' : step ? TEXT[step] : ''}</Text>}
          {!!msg && phase === 'scan' && <Text style={{ color: '#FFD9A0', textAlign: 'center', marginTop: 6 }}>{msg}</Text>}
          {phase === 'sending' && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
          {phase === 'scan' && <Pressable onPress={() => { setPhase('intro'); }} style={{ marginTop: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text></Pressable>}
        </View>
      </SafeAreaView>
    </View>);
}
