import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

export function LoadingView({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function MessageBox({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <View style={[styles.box, error && styles.errorBox]}>
      <Text style={[styles.message, error && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  box: { borderRadius: 12, padding: 14, backgroundColor: colors.primarySoft },
  errorBox: { backgroundColor: '#FEF3F2' },
  message: { color: colors.primary, lineHeight: 20 },
  errorText: { color: colors.danger },
});
