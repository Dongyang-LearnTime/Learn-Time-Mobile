import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/authStore';
import { useTimerStore } from '../src/stores/timerStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateTimer = useTimerStore((state) => state.hydrate);

  useEffect(() => {
    void Promise.all([hydrateAuth(), hydrateTimer()]);
  }, [hydrateAuth, hydrateTimer]);

  useEffect(() => {
    if (isHydrating) return;
    const firstSegment = segments[0] as string | undefined;
    const isLoginRoute = firstSegment === 'login';

    if (!isAuthenticated && !isLoginRoute) router.replace('/login');
    if (isAuthenticated && isLoginRoute) router.replace('/');
  }, [isAuthenticated, isHydrating, router, segments]);

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
