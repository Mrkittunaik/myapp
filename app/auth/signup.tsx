import React, { useState } from 'react';
import { Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Btn, Banner, FadeIn } from '@/components/ui';
import { auth, validEmail, validPassword } from '@/services/auth';
import { useApp } from '@/services/store';
import { colors, type } from '@/constants/theme';
export default function Signup() {
  const r = useRouter(); const a = useApp();
  const [pw2, setPw2] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [agree, setAgree] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [t, setT] = useState(false);
  const ok = validEmail(email) && validPassword(pw) && pw === pw2 && agree;
  const submit = async () => { setBusy(true); setErr(''); const res = await auth.signUp(email, pw); setBusy(false); if ('error' in res) return setErr(res.error); a.set({ loggedIn: true, emailVerified: false, email: email.trim() }); if (res.me) a.applyMe(res.me, { profile: true }); if (res.devCode) a.toast('Dev code: ' + res.devCode); a.toast('Account created'); r.replace('/'); };
  return (
    <Screen><Header title="" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <FadeIn>
          <Text style={type.display}>Create your account</Text><Text style={[type.secondary, { marginBottom: 24, marginTop: 6 }]}>It takes about two minutes.</Text>
          {!!err && <Banner tone="err" icon="alert-circle" text={err} />}
          <Field label="Email" value={email} onChangeText={setEmail} onBlur={() => setT(true)} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" error={t && email && !validEmail(email) ? 'Enter a valid email address' : undefined} />
          <Field label="Password" secure value={pw} onChangeText={setPw} autoCapitalize="none" autoComplete="new-password" placeholder="8+ characters with a number" error={pw && !validPassword(pw) ? 'Use at least 8 characters including a number' : undefined} />
          <Field label="Confirm password" secure value={pw2} onChangeText={setPw2} autoCapitalize="none" placeholder="Type it again" error={pw2 && pw2 !== pw ? 'Passwords do not match' : undefined} />
          <Pressable onPress={() => setAgree(!agree)} accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={26} color={agree ? colors.violet : colors.muted} />
            <Text style={[type.secondary, { flex: 1, marginLeft: 10 }]}>I am 18 or older and agree to the <Text style={{ color: colors.violet, fontWeight: '700' }} onPress={() => r.push('/info?doc=terms')}>Terms</Text> and <Text style={{ color: colors.violet, fontWeight: '700' }} onPress={() => r.push('/info?doc=privacy')}>Privacy Policy</Text>.</Text>
          </Pressable>
          <Btn title="Create account" onPress={submit} loading={busy} disabled={!ok} />
          <Pressable onPress={() => r.replace('/auth/login')} style={{ marginTop: 20, alignItems: 'center' }}><Text style={type.secondary}>Have an account? <Text style={{ color: colors.violet, fontWeight: '700' }}>Log in</Text></Text></Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
