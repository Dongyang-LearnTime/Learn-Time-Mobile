import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { logout } from '../../src/api/authApi';
import { Screen } from '../../src/components/Screen';
import { config, hasApiBaseUrl } from '../../src/constants/config';
import { colors } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';

export default function SettingsScreen() {
  const { userName, email, role, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      Alert.alert('안내', '서버 로그아웃에는 실패했지만 기기의 로그인 정보는 삭제합니다.');
    } finally {
      await clearAuth();
      setIsLoggingOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>앱 설정</Text>
      </View>

      <View style={styles.card}>
        <Row label="사용자" value={userName ?? '-'} />
        <Row label="이메일" value={email ?? '-'} />
        <Row label="권한" value={role ?? '-'} />
        <Row label="앱 버전" value="1.0.0" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API 서버</Text>
        <Text style={[styles.server, !hasApiBaseUrl && styles.serverError]}>
          {hasApiBaseUrl ? config.apiBaseUrl : '설정되지 않음'}
        </Text>
        <Text style={styles.help}>현재 모드: {config.demoMode ? '데모 데이터' : '실제 API'}</Text>
        <Text style={styles.help}>`.env`의 EXPO_PUBLIC_API_BASE_URL에서 변경할 수 있습니다.</Text>
      </View>

      <Pressable style={[styles.logout, isLoggingOut && styles.disabled]} disabled={isLoggingOut} onPress={() => void handleLogout()}>
        <Text style={styles.logoutText}>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</Text>
      </Pressable>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { paddingVertical: 10, gap: 7 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  card: { backgroundColor: colors.surface, padding: 18, borderRadius: 18, gap: 14 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 4 },
  label: { color: colors.muted, fontSize: 14 },
  value: { flex: 1, color: colors.text, fontWeight: '700', textAlign: 'right' },
  server: { color: colors.success, fontWeight: '700' },
  serverError: { color: colors.danger },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  logout: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: '#FDA29B', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF3F2' },
  logoutText: { color: colors.danger, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
