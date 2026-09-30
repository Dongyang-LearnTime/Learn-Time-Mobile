import type { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type ThemeColors, layout } from '../constants/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, scroll = true, refreshing, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? layout.compactScreenPadding : layout.screenPadding;
  const responsiveContent = [styles.content, { paddingHorizontal: horizontalPadding }];
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={responsiveContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.surface} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={responsiveContent}>{children}</View>
  );

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>{content}</SafeAreaView>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
});
