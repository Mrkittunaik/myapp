import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, FadeImage, IntentBadge, InterestTag, Pop, FadeIn } from './ui';
import { colors, radius, type } from '@/constants/theme';

type Props = { name: string; age?: number | null; photos: string[]; bio?: string; intentions: string[]; interests: string[]; caption?: string };
// Live profile card. Updates instantly (with a smooth fade) when photos / details change,
// so people see exactly how their card looks while they edit.
export default function ProfilePreview({ name, age, photos, bio, intentions, interests, caption = 'This is how people nearby see you' }: Props) {
  const [idx, setIdx] = useState(0); const prev = useRef(photos.length);
  useEffect(() => {
    if (photos.length > prev.current) setIdx(photos.length - 1); // jump to the photo that was just added
    else if (idx > photos.length - 1) setIdx(Math.max(photos.length - 1, 0));
    prev.current = photos.length;
  }, [photos.length]);
  const cur = photos[idx];
  return (
    <FadeIn>
      <Text style={[type.caption, { marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }]}>{caption}</Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ height: 300, backgroundColor: colors.violetSoft }}>
          {cur ? <FadeImage uri={cur} style={{ flex: 1 }} /> : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={44} color={colors.violet} />
              <Text style={[type.secondary, { marginTop: 8 }]}>Add a photo to see your card</Text>
            </View>)}
          {!!cur && <LinearGradient colors={['transparent', 'rgba(21,21,43,0.75)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }} pointerEvents="none" />}
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }} pointerEvents="none">
            <Text style={{ color: cur ? '#fff' : colors.text, fontSize: 24, fontWeight: '800' }} numberOfLines={1}>{name?.trim() || 'Your name'}{age ? `, ${age}` : ''}</Text>
          </View>
          {photos.length > 1 && <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(21,21,43,0.6)', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{idx + 1}/{photos.length}</Text></View>}
        </View>
        {photos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10 }}>
            {photos.map((u, i) => (
              <Pop key={u}><Pressable onPress={() => setIdx(i)} accessibilityLabel={`Show photo ${i + 1}`} style={{ marginRight: 8, borderRadius: 5, borderWidth: 2, borderColor: i === idx ? colors.violet : 'transparent', padding: 1 }}>
                <FadeImage uri={u} style={{ width: 52, height: 64, borderRadius: 5 }} />
              </Pressable></Pop>))}
          </ScrollView>)}
        <View style={{ padding: 16, paddingTop: photos.length > 1 ? 4 : 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -6 }}>{intentions.map((i) => <IntentBadge key={i} k={i} />)}</View>
          {!!bio?.trim() && <Text style={[type.body, { marginTop: 10 }]}>{bio}</Text>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>{interests.map((i) => <InterestTag key={i} k={i} />)}</View>
        </View>
      </Card>
    </FadeIn>
  );
}
