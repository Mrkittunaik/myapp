import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { USE_BACKEND } from '@/services/config';
import { Screen, Header, Field, Btn, Banner, FadeIn } from '@/components/ui';
import { auth, DEMO_CODE } from '@/services/auth';
import { useApp } from '@/services/store';
import { colors, type } from '@/constants/theme';
export default function Verify() {
  const r = useRouter(); const a = useApp(); const { change } = useLocalSearchParams<{ change?: string }>();
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [wait, setWait] = useState(30);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  const verify = async () => { setBusy(true); setErr(''); const res = await auth.verifyCode(code); setBusy(false); if ('error' in res) return setErr(res.error); if (res.me) a.applyMe(res.me); else a.set({ emailVerified: true }); a.toast(change ? 'New email confirmed' : 'Email verified'); r.replace(change ? '/settings' : '/'); };
  const resend = async () => { const x = await auth.sendCode(a.email); if ('error' in x) return a.toast(x.error, 'err'); setWait(30); a.toast('New code sent'); };
  return (
    <Screen><Header title={change ? 'Confirm new email' : 'Verify your email'} back={!!change} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
          <FadeIn>
            <Text style={[type.secondary, { marginBottom: 16 }]}>We sent a 6-digit code to {(change && a.pendingEmail) || a.email || 'your email'}. Enter it below.</Text>
            {!USE_BACKEND && <Banner icon="flask" tone="warn" text={`Demo mode: use code ${DEMO_CODE}.`} />}
            {!!err && <Banner tone="err" icon="alert-circle" text={err} />}
            <Field label="6-digit code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="123456" />
            <Btn title="Verify" loading={busy} disabled={code.length !== 6} onPress={verify} />
            <Pressable onPress={resend} disabled={wait > 0} style={{ marginTop: 20, alignItems: 'center' }}><Text style={{ color: wait > 0 ? colors.muted : colors.violet, fontWeight: '700' }}>{wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}</Text></Pressable>
            <Pressable onPress={async () => { await auth.logout(); a.signOut(); r.replace('/auth/welcome'); }} style={{ marginTop: 16, alignItems: 'center' }}><Text style={type.secondary}>Wrong email? <Text style={{ color: colors.violet, fontWeight: '700' }}>Log out</Text></Text></Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
