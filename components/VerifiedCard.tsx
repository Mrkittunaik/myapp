import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './ui';
import { colors, type } from '@/constants/theme';
import { Profile } from '@/types';

const objPron = (p?: string) => (p === 'she' ? 'her' : p === 'he' ? 'him' : '');
// "About her / him": the gender and age come from the backend face scan, not from what the person typed.
export default function VerifiedCard({ u, style }: { u: Profile; style?: any }) {
  const v = !!u.verified; const who = objPron(u.pronoun) || u.name;
  return (
    <Card style={[{ marginBottom: 14, borderWidth: 1, borderColor: v ? 'rgba(31,169,113,0.35)' : colors.border, backgroundColor: v ? 'rgba(31,169,113,0.08)' : '#fff' }, style]}>
      <View accessible accessibilityLabel={v ? `About ${who}. Verified by face scan. ${u.pronoun === 'she' ? 'She' : 'He'}, about ${u.age} years old.` : `About ${u.name}. Not face verified.`} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={v ? 'shield-checkmark' : 'help-circle-outline'} size={24} color={v ? colors.success : colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.section}>About {who}</Text>
          {v ? <Text style={[type.body, { marginTop: 2 }]}>{u.pronoun === 'she' ? 'She' : 'He'} · {u.gender}{u.age ? ` · age about ${u.age}` : ''}</Text> : <Text style={[type.secondary, { marginTop: 2 }]}>This person has not been face verified.</Text>}
          <Text style={[type.caption, { marginTop: 2, color: v ? colors.success : colors.muted }]}>{v ? 'Verified by face scan on our server' : 'Details are what they typed'}</Text>
        </View>
      </View>
    </Card>
  );
}
// Small line for cards and sheets, e.g. "she · 26".
export const VerifiedPill = ({ u }: { u: Profile }) => u.verified ? (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}><Ionicons name="shield-checkmark" size={13} color={colors.success} /><Text style={{ color: colors.success, fontSize: 12.5, fontWeight: '700', marginLeft: 4 }}>{u.pronoun === 'she' ? 'She' : 'He'}{u.age ? ` · ${u.age}` : ''}</Text></View>) : null;
