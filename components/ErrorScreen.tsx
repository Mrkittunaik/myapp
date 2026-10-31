import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn } from './ui';
import { colors, type } from '@/constants/theme';
// Plain screen (no app state or router needed) so it still works if the crash came from those.
export function ErrorScreen({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.bg }}>
      <View style={{ width: 72, height: 72, borderRadius: 5, backgroundColor: colors.violetSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="alert-circle-outline" size={36} color={colors.violet} /></View>
      <Text style={[type.title, { marginTop: 16, textAlign: 'center' }]}>Something went wrong</Text>
      <Text style={[type.secondary, { textAlign: 'center', marginTop: 6, marginBottom: 20 }]}>The app hit an unexpected problem. Try again, and if it keeps happening, restart the app.</Text>
      {!!retry && <Btn title="Try again" onPress={retry} />}
      {__DEV__ && !!error && <Text style={[type.caption, { marginTop: 16, textAlign: 'center' }]}>{String(error.message)}</Text>}
    </View>
  );
}
