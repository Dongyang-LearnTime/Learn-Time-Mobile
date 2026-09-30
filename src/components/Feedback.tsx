import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, type ThemeColors } from '../constants/theme';

export function LoadingView({ label = '불러오는 중...' }: { label?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function MessageBox({ message, error = false }: { message: string; error?: boolean }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.box, error && styles.errorBox]}>
      <Ionicons name={error ? 'alert-circle-outline' : 'information-circle-outline'} color={error ? colors.danger : colors.primary} size={19} />
      <Text style={[styles.message, error && styles.errorText]}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 14, padding: 14, backgroundColor: colors.primarySoft },
  errorBox: { backgroundColor: colors.dangerSoft },
  message: { flex: 1, color: colors.primary, lineHeight: 20 },
  errorText: { color: colors.danger },
});
