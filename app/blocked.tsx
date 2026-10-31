import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Header, Card, Avatar, Btn, Empty, FadeIn } from '@/components/ui';
import { useApp } from '@/services/store';
import { useActions } from '@/services/actions';
import { findPerson } from '@/services/people';
import { type } from '@/constants/theme';
export default function Blocked() {
  const a = useApp(); const act = useActions();
  const list = a.blocked.map((id) => ({ id, name: a.blockedInfo[id]?.name || findPerson(id)?.name || 'Blocked user', photo: a.blockedInfo[id]?.photo || findPerson(id)?.photo || '' }));
  return (
    <Screen><Header title="Blocked users" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}>
        <Text style={[type.secondary, { marginBottom: 12 }]}>Blocked people cannot see you or contact you. Unblocking does not restore past connections.</Text>
        {list.length === 0 ? <Empty icon="ban-outline" title="No blocked users" text="People you block will appear here." />
          : list.map((u, i) => (
            <FadeIn key={u.id} delay={i * 60}><Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={u.photo} size={48} /><View style={{ flex: 1, marginHorizontal: 12 }}><Text style={type.section}>{u.name}</Text></View>
              <Btn style={{ minHeight: 40 }} variant="secondary" title="Unblock" onPress={() => act.unblock(u.id)} /></Card></FadeIn>))}
      </ScrollView>
    </Screen>);
}
