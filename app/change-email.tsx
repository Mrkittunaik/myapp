import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Btn, Banner } from '@/components/ui';
import { auth, validEmail } from '@/services/auth';
import { useApp } from '@/services/store';
import { USE_BACKEND } from '@/services/config';
import { type } from '@/constants/theme';
export default function ChangeEmail() {
  const r = useRouter(); const a = useApp();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const same = email.trim().toLowerCase() === a.email.toLowerCase();
  const submit = async () => {
    setBusy(true); setErr(''); const res = await auth.changeEmail(email.trim(), pw); setBusy(false);
    if ('error' in res) return setErr(res.error);
    a.set(USE_BACKEND ? { pendingEmail: email.trim() } : { email: email.trim(), emailVerified: false }); a.toast('Check your new email for a code'); r.replace(USE_BACKEND ? '/auth/verify?change=1' : '/auth/verify');
  };
  return (
    <Screen><Header title="Change email" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}>
          <Text style={[type.secondary, { marginBottom: 16 }]}>Current email: {a.email || 'not set'}. We will send a code to the new address to confirm it.</Text>
          {!!err && <Banner tone="err" icon="alert-circle" text={err} />}
          <Field label="New email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={email && !validEmail(email) ? 'Enter a valid email address' : same ? 'This is already your email' : undefined} />
          <Field label="Password" secure value={pw} onChangeText={setPw} autoCapitalize="none" />
          <Btn title="Send code" loading={busy} disabled={!validEmail(email) || same || !pw} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
