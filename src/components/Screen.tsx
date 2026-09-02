import type { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, scroll = true, refreshing, onRefresh }: Props) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 20, gap: 16 },
});
