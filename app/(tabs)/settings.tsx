import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { logout } from '../../src/api/authApi';
import { Screen } from '../../src/components/Screen';
import { config, hasApiBaseUrl } from '../../src/constants/config';
import { useTheme, type ThemeColors, shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore, type ThemeMode } from '../../src/stores/themeStore';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userName, email, role, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { mode, setMode } = useThemeStore();
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const changeTheme = async (next: ThemeMode) => {
    setIsChangingTheme(true);
    try { await setMode(next); }
    catch { Alert.alert('설정 저장 실패', '화면 모드를 저장하지 못했습니다. 다시 시도해주세요.'); }
    finally { setIsChangingTheme(false); }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      Alert.alert('안내', '서버 로그아웃에는 실패했지만 기기의 로그인 정보는 삭제합니다.');
    } finally {
      try { await clearAuth(); }
      catch { Alert.alert('기기 저장소 오류', '저장된 로그인 정보를 삭제하지 못했습니다. 앱을 다시 열기 전에 기기 저장소 상태를 확인해주세요.'); }
      finally { setIsLoggingOut(false); }
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.eyebrowRow}><Ionicons name="settings-outline" color={colors.primary} size={16} /><Text style={styles.eyebrow}>SETTINGS</Text></View>
        <Text style={styles.title}>앱 설정</Text>
        <Text style={styles.subtitle}>계정과 연결 정보를 확인할 수 있어요.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.serverTitle}><Ionicons name="moon-outline" color={colors.primary} size={20} /><Text style={styles.cardTitle}>화면 모드</Text></View>
        <View style={styles.themeOptions}>
          {([{ value: 'system', label: '기기 설정' }, { value: 'light', label: '라이트' }, { value: 'dark', label: '다크' }] as const).map((option) => (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: mode === option.value, disabled: isChangingTheme }} disabled={isChangingTheme} style={[styles.themeOption, mode === option.value && styles.themeSelected]} onPress={() => void changeTheme(option.value)}>
              <Text style={[styles.themeText, mode === option.value && styles.themeSelectedText]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.help}>기기 설정을 선택하면 휴대폰의 다크모드를 따라갑니다.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.profile}><View style={styles.avatar}><Ionicons name="person" color={colors.primary} size={24} /></View><View style={styles.profileCopy}><Text style={styles.profileName} numberOfLines={1}>{userName ?? '사용자'}</Text><Text style={styles.profileEmail} numberOfLines={1}>{email ?? '-'}</Text></View></View>
        <Row label="사용자" value={userName ?? '-'} />
        <Row label="이메일" value={email ?? '-'} />
        <Row label="권한" value={role ?? '-'} />
        <Row label="앱 버전" value="1.0.0" />
      </View>

      <View style={styles.card}>
        <View style={styles.serverTitle}><View style={styles.statusDot} /><Text style={styles.cardTitle}>API 서버</Text></View>
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  themeOptions: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  themeSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  themeText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  themeSelectedText: { color: colors.primary },
  heading: { paddingTop: 6, paddingBottom: 2, gap: 7 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.surface, padding: 18, borderRadius: 22, gap: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  profileCopy: { flex: 1, minWidth: 0 }, profileName: { color: colors.text, fontSize: 17, fontWeight: '900' }, profileEmail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  serverTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 }, statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 4 },
  label: { color: colors.muted, fontSize: 14 },
  value: { flex: 1, color: colors.text, fontWeight: '700', textAlign: 'right' },
  server: { color: colors.success, fontWeight: '700' },
  serverError: { color: colors.danger },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  logout: { minHeight: 54, borderRadius: 15, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
  logoutText: { color: colors.danger, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
