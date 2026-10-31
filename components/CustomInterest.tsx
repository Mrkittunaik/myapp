import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Chip, Btn } from './ui';
import { colors, space, type, INTERESTS } from '@/constants/theme';
// Lets people add up to 3 interests of their own (stored as "custom:Name").
export default function CustomInterest({ interests, onChange }: { interests: string[]; onChange: (v: string[]) => void }) {
  const [t, setT] = useState('');
  const customs = interests.filter((i) => i.startsWith('custom:'));
  const add = () => {
    const v = t.trim().replace(/\s+/g, ' ').slice(0, 20); if (!v) return;
    const k = 'custom:' + v; const low = v.toLowerCase();
    // no duplicates that differ only by case, and no copies of the built-in interests
    const dupe = customs.some((c) => c.slice(7).toLowerCase() === low) || INTERESTS.some((i) => i.label.toLowerCase() === low);
    if (!dupe && customs.length < 3) onChange([...interests, k]);
    setT('');
  };
  return (
    <View style={{ marginTop: space.md }}>
      <Text style={[type.caption, { fontWeight: '700', color: colors.text, marginBottom: 6 }]}>Add your own (up to 3)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput value={t} onChangeText={setT} onSubmitEditing={add} placeholder={customs.length >= 3 ? 'Limit reached' : 'e.g. Chess'} editable={customs.length < 3} maxLength={20} placeholderTextColor="#A5A3BA" accessibilityLabel="Add your own interest"
          style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.text }} />
        <Btn style={{ minHeight: 46, marginLeft: 8, paddingHorizontal: 18 }} variant="secondary" title="Add" disabled={!t.trim() || customs.length >= 3} onPress={add} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {customs.map((k) => <Chip key={k} icon="close" selected label={k.slice(7)} onPress={() => onChange(interests.filter((x) => x !== k))} />)}
      </View>
    </View>
  );
}
