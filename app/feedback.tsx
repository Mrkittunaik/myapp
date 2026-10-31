import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Chip, Btn } from '@/components/ui';
import { useApp } from '@/services/store';
import { type } from '@/constants/theme';
import { emailSupport, supportMessage } from '@/services/support';
import { USE_BACKEND } from '@/services/config';
import { api, ApiError } from '@/services/api';
const KINDS = ['Bug', 'Idea', 'Safety concern', 'Other'];
export default function Feedback() {
  const r = useRouter(); const a = useApp();
  const [kind, setKind] = useState('Idea'); const [msg, setMsg] = useState('');
  const send = async () => {
    if (USE_BACKEND) { try { await api.feedback(`[${kind}] ${msg.trim()}`); a.toast('Thanks. Your feedback was sent.'); r.back(); } catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not send.', 'err'); } return; }
    const res = await emailSupport('Nearby feedback: ' + kind, msg.trim());
    if (res !== 'ok') return a.toast(supportMessage(res), 'err');
    a.toast('Opening your email app. Press send there to finish.'); r.back(); // the mail app is where it is actually sent
  };
  return (
    <Screen><Header title="Send feedback" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}>
          <Text style={[type.secondary, { marginBottom: 12 }]}>Tell us what is working and what is not. </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>{KINDS.map((k) => <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />)}</View>
          <Field label="Your message" value={msg} onChangeText={setMsg} multiline maxLength={800} placeholder="Write here" />
          <Btn title="Send" disabled={msg.trim().length < 5} onPress={send} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);
}
