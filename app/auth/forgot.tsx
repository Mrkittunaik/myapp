import React, { useEffect, useState } from 'react';
import { Text, ScrollView, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Btn, Banner } from '@/components/ui';
import { auth, validEmail, validPassword, DEMO_CODE } from '@/services/auth';
import { type } from '@/constants/theme';
import { useApp } from '@/services/store';
import { USE_BACKEND } from '@/services/config';
export default function Forgot() {
  const r = useRouter(); const { toast } = useApp();
  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email'); const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  // Back goes to the previous step first, and only leaves the flow from the first step.
  const stepBack = () => { if (step === 'reset') setStep('code'); else if (step === 'code') setStep('email'); else return false; setErr(''); return true; };
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', stepBack); return () => sub.remove(); }, [step]);
  return (
    <Screen><Header title="Reset password" onBack={() => { if (!stepBack()) (r.canGoBack() ? r.back() : r.replace('/auth/login')); }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {!!err && <Banner tone="err" icon="alert-circle" text={err} />}
          {step === 'email' && (<><Text style={[type.secondary, { marginBottom: 20 }]}>Enter your email and we will send a 6-digit code.</Text>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Btn title="Send code" loading={busy} disabled={!validEmail(email)} onPress={async () => { setBusy(true); setErr(''); await auth.requestReset(email); setBusy(false); setStep('code'); }} /></>)}
          {step === 'code' && (<><Text style={[type.secondary, { marginBottom: 12 }]}>If an account exists for {email}, a code is on its way.</Text>
            {!USE_BACKEND && <Banner icon="flask" tone="warn" text={`Demo mode: use code ${DEMO_CODE}.`} />}
            <Field label="6-digit code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
            <Btn title="Continue" loading={busy} disabled={code.length !== 6} onPress={async () => { setBusy(true); setErr(''); const res = await auth.checkResetCode(email, code); setBusy(false); if ('error' in res) return setErr(res.error); setStep('reset'); }} /></>)}
          {step === 'reset' && (<><Field label="New password" secure value={pw} onChangeText={setPw} autoCapitalize="none" error={pw && !validPassword(pw) ? 'Use at least 8 characters including a number' : undefined} />
            <Btn title="Save new password" loading={busy} disabled={!validPassword(pw)} onPress={async () => { setBusy(true); setErr(''); const res = await auth.resetPassword(email, code, pw); setBusy(false); if ('error' in res) return setErr(res.error); toast('Password updated. Log in with your new password.'); r.replace('/auth/login'); }} /></>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
