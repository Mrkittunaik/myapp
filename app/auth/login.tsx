import React, { useState } from 'react';
import { Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Btn, Banner, FadeIn } from '@/components/ui';
import { auth, validEmail } from '@/services/auth';
import { useApp } from '@/services/store';
import { colors, type } from '@/constants/theme';
export default function Login() {
  const r = useRouter(); const a = useApp();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [touched, setT] = useState(false);
  const ok = validEmail(email) && pw.length > 0;
  const submit = async () => { setBusy(true); setErr(''); const res = await auth.login(email, pw); setBusy(false);
    if ('error' in res) return setErr(res.error); a.set({ loggedIn: true, email: email.trim() }); if (res.me) a.applyMe(res.me, { profile: true }); else a.set({ emailVerified: true }); a.toast('Welcome back'); r.replace('/'); };
  return (
    <Screen><Header title="" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <FadeIn>
          <Text style={type.display}>Welcome back</Text><Text style={[type.secondary, { marginBottom: 24, marginTop: 6 }]}>Log in to see who's around.</Text>
          {!!err && <Banner tone="err" icon="alert-circle" text={err} />}
          <Field label="Email" value={email} onChangeText={setEmail} onBlur={() => setT(true)} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" error={touched && email && !validEmail(email) ? 'Enter a valid email address' : undefined} />
          <Field label="Password" secure value={pw} onChangeText={setPw} placeholder="Your password" autoCapitalize="none" autoComplete="password" />
          <Pressable onPress={() => r.push('/auth/forgot')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}><Text style={{ color: colors.violet, fontWeight: '700' }}>Forgot password?</Text></Pressable>
          <Btn title="Log in" onPress={submit} loading={busy} disabled={!ok} />
          <Pressable onPress={() => r.replace('/auth/signup')} style={{ marginTop: 20, alignItems: 'center' }}><Text style={type.secondary}>New here? <Text style={{ color: colors.violet, fontWeight: '700' }}>Create account</Text></Text></Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
