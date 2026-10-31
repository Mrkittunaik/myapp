import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Field, Chip, Btn, Dialog, SectionTitle, Toggle, FadeIn } from '@/components/ui';
import PhotoGrid from '@/components/PhotoGrid';
import CustomInterest from '@/components/CustomInterest';
import ProfilePreview from '@/components/ProfilePreview';
import { useApp } from '@/services/store';
import { ageFrom, dobValid } from '@/services/dob';
import DobField from '@/components/DobField';
import { cleanHandle } from '@/services/extras';
import { Ionicons } from '@expo/vector-icons';
import { saveProfile } from '@/services/profileSave';
import { ApiError } from '@/services/api';
import { INTENTS, INTERESTS, SOCIALS, type, GENDERS, SHOW_ME, LANGS, colors } from '@/constants/theme';
export default function Edit() {
  const r = useRouter(); const a = useApp(); const [d, setD] = useState(a.me); const [warn, setWarn] = useState(false); const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(a.me); const nameErr = d.name.trim().length < 2 ? 'Name must be at least 2 characters' : undefined;
  const tog = (k: 'interests' | 'intentions', v: string) => setD({ ...d, [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] });
  const soc = (k: string) => d.socials.find((s) => s.key === k) || { key: k, handle: '', visible: false };
  const setSoc = (k: string, p: any) => setD({ ...d, socials: [...d.socials.filter((s) => s.key !== k), { ...soc(k), ...p }].filter((s) => s.handle) });
  const save = async () => {
    setBusy(true);
    try { const saved = await saveProfile({ ...d, photo: d.photos[0] || '' }); if (saved) a.applyMe(saved, { profile: true }); else { await new Promise((x) => setTimeout(x, 300)); a.setMe({ ...d, photo: d.photos[0] || '' }); } a.toast('Profile saved'); r.back(); }
    catch (e) { a.toast(e instanceof ApiError ? e.message : 'Could not save. Try again.', 'err'); }
    finally { setBusy(false); }
  };
  const leave = () => (dirty ? setWarn(true) : r.back());
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (dirty) { setWarn(true); return true; } return false; }); return () => sub.remove(); }, [dirty]);
  return (
    <Screen><Header title="Edit profile" onBack={leave} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ProfilePreview name={d.name} age={ageFrom(d.dob)} photos={d.photos} bio={d.bio} intentions={d.intentions} interests={d.interests} caption="Live preview" />
        <View style={{ height: 24 }} />
        <Field label="Display name" value={d.name} onChangeText={(v) => setD({ ...d, name: v })} error={nameErr} maxLength={30} />
        <Field label="About" value={d.bio} onChangeText={(v) => setD({ ...d, bio: v })} multiline maxLength={160} />
        {/* Once a valid date of birth is saved it is locked, so the 18+ check cannot be bypassed by editing it later. */}
        <DobField value={d.dob} onChange={(v) => setD({ ...d, dob: v })} editable={!dobValid(a.me.dob)} hint="Enter your date of birth to save" />
        {dobValid(a.me.dob) && <Text style={[type.caption, { marginTop: -8, marginBottom: 16 }]}>Date of birth cannot be changed. Contact support if it is wrong.</Text>}
        <Text style={[type.caption, { fontWeight: '700', color: colors.text, marginBottom: 8 }]}>Gender (optional)</Text>
        {a.face.status === 'verified' ? <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}><Ionicons name="shield-checkmark" size={20} color={colors.success} /><Text style={[type.secondary, { marginLeft: 8, flex: 1 }]}>{a.face.gender} · set by your face scan, age about {a.face.age}</Text></View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>{GENDERS.map((g) => <Chip key={g} label={g} selected={d.gender === g} onPress={() => setD({ ...d, gender: d.gender === g ? '' : g })} />)}</View>}
        <Text style={[type.caption, { fontWeight: '700', color: colors.text, marginBottom: 8 }]}>Languages you speak</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{LANGS.map((l) => <Chip key={l} label={l} selected={d.languages.includes(l)} onPress={() => { const n = d.languages.includes(l) ? d.languages.filter((x) => x !== l) : [...d.languages, l]; if (n.length) setD({ ...d, language: n[0], languages: n }); }} />)}</View>
        <SectionTitle title="Photos" /><PhotoGrid photos={d.photos} onChange={(p) => setD({ ...d, photos: p, photo: p[0] || '' })} />
        <SectionTitle title="Interests" /><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{INTERESTS.map((i) => <Chip key={i.key} icon={i.icon} label={i.label} selected={d.interests.includes(i.key)} onPress={() => tog('interests', i.key)} />)}</View>
        <CustomInterest interests={d.interests} onChange={(v) => setD({ ...d, interests: v })} />
        <SectionTitle title="Connection intentions" /><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{INTENTS.map((i) => <Chip key={i.key} icon={i.icon} label={i.short} color={i.color} selected={d.intentions.includes(i.key)} onPress={() => tog('intentions', i.key)} />)}</View>
        <SectionTitle title="Social links" />{SOCIALS.map((s) => <View key={s.key}><Field label={s.label} value={soc(s.key).handle} autoCapitalize="none" onChangeText={(t) => setSoc(s.key, { handle: cleanHandle(t) })} />
          {!!soc(s.key).handle && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 12 }}><Toggle value={soc(s.key).visible} onValueChange={(v) => setSoc(s.key, { visible: v })} /><Text style={type.secondary}>  Visible on my profile</Text></View>}</View>)}
        <SectionTitle title="Show me" /><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{SHOW_ME.map((x) => <Chip key={x} label={x} selected={d.interestedIn === x} onPress={() => setD({ ...d, interestedIn: x })} />)}</View>
        <SectionTitle title="Profile visibility" /><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{[['everyone', 'Everyone nearby'], ['connections', 'Connections only'], ['nobody', 'Nobody']].map(([k, l]) => <Chip key={k} label={l} selected={d.visibility === k} onPress={() => setD({ ...d, visibility: k as any })} />)}</View>
        <View style={{ height: 20 }} />
        {(() => { const why = nameErr ? 'Enter a name with at least 2 characters.' : !dobValid(d.dob) ? 'Enter a valid date of birth.' : d.interests.length === 0 ? 'Pick at least one interest.' : d.intentions.length === 0 ? 'Pick at least one intention.' : ''; return !!why && dirty ? <Text style={[type.caption, { textAlign: 'center', marginBottom: 8 }]}>{why}</Text> : null; })()}
        <Btn title="Save changes" loading={busy} disabled={!dirty || !!nameErr || !dobValid(d.dob) || d.interests.length === 0 || d.intentions.length === 0} onPress={save} />
        <View style={{ height: 6 }} /><Btn variant="ghost" title="Cancel" onPress={leave} />
      </ScrollView>
      <Dialog visible={warn} title="Discard changes?" text="You have unsaved changes." confirm="Discard" danger onCancel={() => setWarn(false)} onConfirm={() => { setWarn(false); r.back(); }} />
    </Screen>);
}
