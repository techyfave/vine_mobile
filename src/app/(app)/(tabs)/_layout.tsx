import { useQuery } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { TabBar } from '@/ui/TabBar';

type TabBarRenderer = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;

export default function TabsLayout() {
  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => unwrap(await api.GET('/api/v1/notifications/unread-count/')).unread,
    refetchInterval: 60_000,
  });

  const renderTabBar: TabBarRenderer = (props) => (
    <TabBar
      state={props.state}
      navigation={props.navigation as unknown as Parameters<typeof TabBar>[0]['navigation']}
      badges={{ notifications: unread.data ?? 0 }}
    />
  );

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="live" />
    </Tabs>
  );
}
