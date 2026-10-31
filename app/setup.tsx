import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Header, Progress, Btn, Field, Chip, Card, Row, Toggle, FadeIn } from '@/components/ui';
import PhotoGrid from '@/components/PhotoGrid';
import CustomInterest from '@/components/CustomInterest';
import ProfilePreview from '@/components/ProfilePreview';
import { useApp } from '@/services/store';
import { useLocation, useAllowLocation } from '@/services/location';
import { ageFrom, dobValid } from '@/services/dob';
import DobField from '@/components/DobField';
import { cleanHandle } from '@/services/extras';
import { colors, type, INTENTS, INTERESTS, SOCIALS, RADII, GENDERS, SHOW_ME } from '@/constants/theme';
import { radiusLabel } from '@/services/geo';
import { saveProfile } from '@/services/profileSave';
import { USE_BACKEND } from '@/services/config';
import { ApiError } from '@/services/api';
const TITLES = ['About you', 'Add your photos', 'Your interests', 'What are you looking for?', 'Social profiles', 'Discovery', 'Preview your profile'];
const LANGS = ['English', 'Hindi', 'Telugu', 'Spanish', 'French'];
const EDIT = ['Basics', 'Photos', 'Interests', 'Intentions', 'Social links', 'Discovery'];

export default function Setup() {
  const r = useRouter(); const a = useApp(); const me = a.me; const loc = useLocation(); const allow = useAllowLocation();
  const [step, setStep] = useState(0); const [fromPreview, setFromPreview] = useState(false); // true after tapping an "Edit ..." link on the preview step
  const toggle = (k: 'interests' | 'intentions', v: string) => a.setMe({ [k]: me[k].includes(v) ? me[k].filter((x) => x !== v) : [...me[k], v] } as any);
  const socialOf = (k: string) => me.socials.find((s) => s.key === k) || { key: k, handle: '', visible: false };
  const setSocial = (k: string, p: any) => a.setMe({ socials: [...me.socials.filter((s) => s.key !== k), { ...socialOf(k), ...p }].filter((s) => s.handle) });
  const valid = [me.name.trim().length >= 2 && dobValid(me.dob), true, me.interests.length >= 1, me.intentions.length >= 1, true, true, true][step];
  const hint = [!me.name.trim() || me.name.trim().length < 2 ? 'Enter your name' : !dobValid(me.dob) ? 'Enter a valid date of birth' : '', '', 'Pick at least one interest', 'Choose at least one option', '', '', ''][step];
  const back = () => { if (fromPreview) { setFromPreview(false); setStep(6); } else if (step === 0) { if (r.canGoBack()) r.back(); } else setStep(step - 1); };
  // Android hardware Back goes one step back instead of leaving the wizard (which would reset it to step 1).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (step > 0 || fromPreview) { back(); return true; } return false; });
    return () => sub.remove();
  }, [step, fromPreview]);
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    setSaving(true);
    try { const saved = await saveProfile(me); if (saved) a.applyMe(saved, { profile: true }); else a.setMe({ photo: me.photos[0] || '' }); a.set({ setupDone: true }); r.replace('/permission'); a.toast("You're all set"); }
    catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not save your profile. Try again.', 'err'); }
    finally { setSaving(false); }
  };
  const next = () => { if (fromPreview && step < 6) { setFromPreview(false); setStep(6); } else if (step < 6) setStep(step + 1); else finish(); };
  const age = ageFrom(me.dob);
  const locText = loc.status === 'granted' ? 'On' : loc.status === 'disabled' ? 'Device location off' : loc.status === 'denied' ? 'Not allowed' : 'Not set';
  return (
    <Screen>
      <Header title={`Step ${step + 1} of 7`} back={step > 0} onBack={back} />
      <View style={{ paddingHorizontal: 24 }}><Progress step={step + 1} total={7} /></View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <FadeIn key={step} y={18}>
            <Text style={[type.title, { marginBottom: 14, fontSize: 22 }]}>{TITLES[step]}</Text>
            {step === 0 && (<>
              <Field label="Display name" value={me.name} onChangeText={(v) => a.setMe({ name: v })} maxLength={30} placeholder="What should people call you?" autoCapitalize="words" />
              <DobField value={me.dob} onChange={(v) => a.setMe({ dob: v })} />
              <Text style={[type.caption, { fontWeight: '700', color: colors.text, marginBottom: 8 }]}>Gender (optional)</Text>
              {a.face.status === 'verified' ? <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}><Ionicons name="shield-checkmark" size={20} color={colors.success} /><Text style={[type.secondary, { marginLeft: 8, flex: 1 }]}>{a.face.gender} · set by your face scan, age about {a.face.age}</Text></View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>{GENDERS.map((g) => <Chip key={g} label={g} selected={me.gender === g} onPress={() => a.setMe({ gender: me.gender === g ? '' : g })} />)}</View>}
              <Text style={[type.caption, { fontWeight: '700', color: colors.text, marginBottom: 8 }]}>Languages you speak</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>{LANGS.map((l) => <Chip key={l} label={l} selected={me.languages.includes(l)} onPress={() => { const n = me.languages.includes(l) ? me.languages.filter((x) => x !== l) : [...me.languages, l]; if (n.length) a.setMe({ language: n[0], languages: n }); }} />)}</View>
              <Field label="Short introduction" value={me.bio} onChangeText={(v) => a.setMe({ bio: v })} multiline maxLength={160} placeholder="A line or two about you" />
            </>)}
            {step === 1 && (<>
              <Text style={[type.secondary, { marginBottom: 16 }]}>Add up to 6 photos. The first one is your main photo. Your card updates below as you add them.</Text>
              <PhotoGrid photos={me.photos} onChange={(p) => a.setMe({ photos: p, photo: p[0] || '' })} />
              <View style={{ height: 22 }} />
              <ProfilePreview name={me.name} age={age} photos={me.photos} bio={me.bio} intentions={me.intentions} interests={me.interests} />
            </>)}
            {step === 2 && (<><Text style={[type.secondary, { marginBottom: 16 }]}>Pick at least one. Three or more make your profile stronger.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{INTERESTS.map((i) => <Chip key={i.key} icon={i.icon} label={i.label} selected={me.interests.includes(i.key)} onPress={() => toggle('interests', i.key)} />)}</View></>)}
            {step === 2 && <CustomInterest interests={me.interests} onChange={(v) => a.setMe({ interests: v })} />}
            {step === 3 && (<><Text style={[type.secondary, { marginBottom: 16 }]}>Choose any that fit. You can change this later.</Text>{INTENTS.map((i) => (
              <Card key={i.key} onPress={() => toggle('intentions', i.key)} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: me.intentions.includes(i.key) ? i.color : 'transparent' }}>
                <Ionicons name={i.icon as any} size={24} color={i.color} style={{ marginRight: 12 }} /><Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{i.label}</Text>
                <Ionicons name={me.intentions.includes(i.key) ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={me.intentions.includes(i.key) ? i.color : colors.border} /></Card>))}</>)}
            {step === 4 && (<><Text style={[type.secondary, { marginBottom: 16 }]}>Optional. Links stay hidden unless you switch visibility on.</Text>{SOCIALS.map((s) => { const v = socialOf(s.key); return (
              <View key={s.key} style={{ marginBottom: 4 }}><Field label={s.label} value={v.handle} onChangeText={(t) => setSocial(s.key, { handle: cleanHandle(t) })} autoCapitalize="none" placeholder="username" />
                {!!v.handle && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 12 }}><Toggle value={v.visible} onValueChange={(x) => setSocial(s.key, { visible: x })} /><Text style={type.secondary}>  Visible on my profile</Text></View>}</View>); })}</>)}
            {step === 5 && (<>
              <Card style={{ marginBottom: 16 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1, paddingRight: 8 }}><Text style={type.section}>Nearby Mode</Text><Text style={type.secondary}>Let people near you find you. Off means you won't appear.</Text></View><Toggle value={a.nearbyMode} onValueChange={(v) => a.set({ nearbyMode: v })} /></View></Card>
              <Card style={{ marginBottom: 8 }}><Row icon="location-outline" title="Location" sub={locText} right={loc.status === 'granted' ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : <Btn style={{ minHeight: 38, paddingHorizontal: 16 }} variant="secondary" title="Allow" onPress={allow} />} /></Card>
              <Text style={[type.section, { marginVertical: 10 }]}>Discovery radius</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{RADII.map((x) => <Chip key={x} label={radiusLabel(x)} selected={a.radius === x} onPress={() => a.set({ radius: x })} />)}</View>
              <Text style={[type.section, { marginVertical: 10 }]}>Show me</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{SHOW_ME.map((x) => <Chip key={x} label={x} selected={me.interestedIn === x} onPress={() => a.setMe({ interestedIn: x })} />)}</View>
              <Text style={[type.section, { marginVertical: 10 }]}>Who can discover me</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{[['everyone', 'Everyone nearby'], ['connections', 'Connections only'], ['nobody', 'Nobody']].map(([k, l]) => <Chip key={k} label={l} selected={me.visibility === k} onPress={() => a.setMe({ visibility: k as any })} />)}</View>
              <Text style={[type.section, { marginVertical: 10 }]}>Notifications</Text>
              {[['nearby', 'Nearby alerts'], ['requests', 'Connection requests'], ['messages', 'Messages']].map(([k, l]) => <Row key={k} icon="notifications-outline" title={l} right={<Toggle value={a.notifPrefs[k]} onValueChange={(v) => a.set({ notifPrefs: { ...a.notifPrefs, [k]: v } })} />} />)}
            </>)}
            {step === 6 && (<>
              <ProfilePreview name={me.name} age={age} photos={me.photos} bio={me.bio} intentions={me.intentions} interests={me.interests} caption="Your profile card" />
              <View style={{ marginTop: 12 }}>{EDIT.map((l, k) => <Pressable key={l} accessibilityRole="button" onPress={() => { setFromPreview(true); setStep(k); }} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="create-outline" size={18} color={colors.violet} /><Text style={{ color: colors.violet, fontWeight: '700', marginLeft: 8, fontSize: 14.5 }}>Edit {l.toLowerCase()}</Text></Pressable>)}</View>
            </>)}
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ padding: 24, paddingTop: 8 }}>
        {!valid && !!hint && <Text style={[type.caption, { textAlign: 'center', marginBottom: 8 }]}>{hint}</Text>}
        <Btn loading={saving} title={step === 6 ? 'Finish and start exploring' : fromPreview ? 'Save and back to preview' : 'Continue'} disabled={!valid} onPress={next} />
      </View>
    </Screen>);
}
