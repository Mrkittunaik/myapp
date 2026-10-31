import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Header, Chip, Btn, Field, Banner, Sheet, FadeIn } from '@/components/ui';
import { HELP_CATS } from '@/components/HelpCard';
import { useApp } from '@/services/store';
import { api, ApiError, HelpQuota } from '@/services/api';
import { colors, type, space } from '@/constants/theme';

// New help post. 2 free posts per calendar month; after that coins will be needed (coming soon).
export default function NewPost() {
  const r = useRouter(); const a = useApp();
  const [cat, setCat] = useState('companion'); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [offer, setOffer] = useState(''); const [pref, setPref] = useState('Anyone');
  const [quota, setQuota] = useState<HelpQuota | null>(null); const [coin, setCoin] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { api.helpMine().then((x) => setQuota(x.quota)).catch(() => {}); }, []);
  const left = quota ? Math.max(quota.limit - quota.used, 0) : null;
  const ok = title.trim().length >= 3 && body.trim().length >= 10;
  const submit = async () => {
    if (left === 0) return setCoin(true);
    setBusy(true); setErr('');
    try { await api.helpCreate({ category: cat, title: title.trim(), body: body.trim(), offer: parseInt(offer.replace(/\D/g, ''), 10) || 0, pref }); a.toast('Posted. Everyone can see it now.'); r.replace('/board?tab=mine'); }
    catch (e) { if (e instanceof ApiError && e.code === 'post_limit') setCoin(true); else setErr(e instanceof ApiError ? e.message : 'Could not post. Try again.'); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={['top']}>
      <Header title="New post" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
          <FadeIn><View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: left === 0 ? '#FDE7EC' : colors.violetSoft, borderRadius: 5, padding: 12, marginBottom: 14 }}>
            <Ionicons name="ticket-outline" size={20} color={left === 0 ? colors.error : colors.violet} />
            <Text style={[type.secondary, { flex: 1, marginLeft: 10, color: colors.text }]}>{left === null ? 'Checking your free posts…' : left === 0 ? 'You have used your 2 free posts this month. Coins are coming soon.' : `${left} of ${quota!.limit} free posts left this month`}</Text></View></FadeIn>
          <Text style={[type.section, { marginBottom: 6 }]}>What kind of help?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>{HELP_CATS.map((c) => <Chip key={c.key} icon={c.icon} label={c.label} color={c.color} selected={cat === c.key} onPress={() => setCat(c.key)} />)}</View>
          <Field label="Title" value={title} onChangeText={setTitle} maxLength={80} placeholder="e.g. Need a friend for a family wedding" />
          <Field label="What exactly do you need?" value={body} onChangeText={setBody} maxLength={500} multiline placeholder="When, where, for how long, and what you expect. Keep it friendly." style={{ minHeight: 110, textAlignVertical: 'top' }} />
          <Field label="I will pay (₹, optional)" value={offer} onChangeText={(t: string) => setOffer(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="e.g. 1500" />
          <Text style={[type.section, { marginBottom: 6 }]}>Who can ask to join?</Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>{['Anyone', 'Women', 'Men'].map((x) => <Chip key={x} label={x} selected={pref === x} onPress={() => setPref(x)} />)}</View>
          <Banner icon="shield-checkmark-outline" text="Your name and photo stay hidden. You see who asks and choose one person. Friendly, non-sexual help only. Do not put phone numbers or addresses in the post." />
          {!!err && <Banner icon="alert-circle" tone="err" text={err} />}
          <Btn style={{ marginTop: 12 }} title="Post" icon="paper-plane" disabled={!ok} loading={busy} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Sheet visible={coin} onClose={() => setCoin(false)}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFF3D1', borderWidth: 3, borderColor: '#F2C14E', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 40, fontWeight: '900', color: '#B8860B' }}>C</Text></View>
          <Text style={[type.title, { marginTop: 14 }]}>Coins are coming soon</Text>
          <Text style={[type.secondary, { textAlign: 'center', marginTop: 6, marginBottom: 16 }]}>Everyone can post 2 times a month for free. Soon you will be able to buy coins to post more. We will let you know when they are ready.</Text>
          <Btn style={{ alignSelf: 'stretch' }} title="Got it" onPress={() => setCoin(false)} />
        </View>
      </Sheet>
    </Screen>);
}
