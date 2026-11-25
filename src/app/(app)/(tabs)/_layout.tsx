import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { TabBar } from '@/ui/TabBar';

type TabBarRenderer = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;

export default function TabsLayout() {
  const renderTabBar: TabBarRenderer = (props) => (
    <TabBar
      state={props.state}
      navigation={props.navigation as unknown as Parameters<typeof TabBar>[0]['navigation']}
    />
  );

  // Create sits between Watch and Grapevine in the bar but opens a modal, so it isn't a tab route.
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="watch" />
      <Tabs.Screen name="grapevine" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
