import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '../../src/constants/theme';

const icons = {
  index: ['home-outline', 'home'],
  timer: ['timer-outline', 'timer'],
  record: ['add-circle-outline', 'add-circle'],
  schedule: ['calendar-outline', 'calendar'],
  settings: ['settings-outline', 'settings'],
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 8 },
        tabBarIcon: ({ color, size, focused }) => {
          const pair = icons[route.name as keyof typeof icons] ?? icons.index;
          return <Ionicons name={pair[focused ? 1 : 0]} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="timer" options={{ title: '타이머' }} />
      <Tabs.Screen name="record" options={{ title: '기록' }} />
      <Tabs.Screen name="schedule" options={{ title: '일정' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
