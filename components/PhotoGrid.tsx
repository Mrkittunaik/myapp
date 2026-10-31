import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Sheet, Row, FadeImage, Pop } from './ui';
import { colors, radius, type } from '@/constants/theme';
import { useApp } from '@/services/store';
import { persistPhoto } from '@/services/photoStore';

export const MAX_PHOTOS = 6;
// Photo picker grid: add from gallery or camera, make a photo the main one, remove. New photos pop in.
export default function PhotoGrid({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const { toast } = useApp(); const [menu, setMenu] = useState(false);
  const left = MAX_PHOTOS - photos.length;
  const addUris = (uris: string[]) => onChange([...photos, ...uris.map(persistPhoto).filter((u) => !photos.includes(u))].slice(0, MAX_PHOTOS));
  const gallery = async () => {
    setMenu(false);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: left > 1, selectionLimit: Math.max(left, 1) });
      if (!res.canceled) addUris(res.assets.map((a) => a.uri));
    } catch { toast('Could not open your photos. Check photo permission in Settings.', 'err'); }
  };
  const camera = async () => {
    setMenu(false);
    try {
      let perm = await ImagePicker.getCameraPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        if (perm.canAskAgain) return toast('Camera permission is needed to take a photo', 'err');
        return Alert.alert('Camera is blocked', 'Allow the camera for Nearby in phone settings to take a photo. You can still choose from your gallery.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Open settings', onPress: () => Linking.openSettings() }]);
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 5] });
      if (!res.canceled) addUris(res.assets.map((a) => a.uri));
    } catch { toast('Could not open the camera', 'err'); }
  };
  const move = (i: number) => { const p = [...photos]; [p[i - 1], p[i]] = [p[i], p[i - 1]]; onChange(p); };
  const makeMain = (i: number) => { const p = [...photos]; const [x] = p.splice(i, 1); onChange([x, ...p]); toast('Main photo updated'); };
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {photos.map((u, i) => (
          <Pop key={u} style={{ width: '33.33%', padding: 5 }}>
            <View style={{ aspectRatio: 0.8 }}>
              <FadeImage uri={u} style={{ flex: 1, borderRadius: 5 }} />
              {i > 0 && <Pressable accessibilityLabel="Move photo earlier" hitSlop={8} onPress={() => move(i)} style={{ position: 'absolute', right: 6, bottom: 6, backgroundColor: '#fff', borderRadius: 5, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="arrow-back" size={16} color={colors.violet} /></Pressable>}
              {i === 0 && <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: colors.navy, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Main</Text></View>}
              <Pressable accessibilityLabel="Remove photo" hitSlop={8} onPress={() => onChange(photos.filter((_, k) => k !== i))} style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#fff', borderRadius: 5, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={18} color={colors.error} /></Pressable>
              {i > 0 && <Pressable accessibilityLabel="Make main photo" hitSlop={8} onPress={() => makeMain(i)} style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#fff', borderRadius: 5, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="star" size={15} color={colors.violet} /></Pressable>}
            </View>
          </Pop>))}
        {left > 0 && (
          <View style={{ width: '33.33%', padding: 5 }}>
            <Pressable onPress={() => setMenu(true)} accessibilityLabel="Add photo" style={{ aspectRatio: 0.8, borderRadius: 5, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.violet, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft }}>
              <Ionicons name="add" size={32} color={colors.violet} /><Text style={{ color: colors.violet, fontWeight: '700', fontSize: 12, marginTop: 2 }}>Add photo</Text>
            </Pressable>
          </View>)}
      </View>
      <Text style={[type.caption, { marginTop: 8 }]}>{photos.length} of {MAX_PHOTOS} photos. Tap the star for your main photo, or the arrow to move it earlier.</Text>
      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <Text style={[type.title, { marginBottom: 8 }]}>Add a photo</Text>
        <Row icon="images-outline" title="Choose from gallery" sub={left > 1 ? `Pick up to ${left} photos` : 'Pick 1 photo'} onPress={gallery} />
        <Row icon="camera-outline" title="Take a photo" onPress={camera} />
      </Sheet>
    </View>
  );
}
