import { useCallback, useState } from 'react';
import { useSync } from './sync';
import { useDiscoveryRefresh } from './discovery';

// Pull-down "hard refresh": re-reads everything from the server (all chats rebuilt, connections, notifications, account) and my position + the Nearby list.
export function usePullRefresh() {
  const { sync } = useSync(); const refreshNearby = useDiscoveryRefresh(); const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.allSettled([sync({ full: true }), refreshNearby()]); } finally { setTimeout(() => setRefreshing(false), 400); }
  }, [sync, refreshNearby]);
  return { refreshing, onRefresh };
}
