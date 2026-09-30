import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '../src/api/authApi';
import { config, hasApiBaseUrl } from '../src/constants/config';
import { useTheme, type ThemeColors, shadows } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/authStore';
import { getApiError } from '../src/utils/getApiError';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const startDemo = useAuthStore((state) => state.startDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (config.demoMode) {
      setIsSubmitting(true);
      await startDemo();
      setIsSubmitting(false);
      router.replace('/');
      return;
    }
    if (!hasApiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL을 먼저 설정해주세요.');
      return;
    }
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await login({ email: email.trim(), password });
      await setAccessToken(response.accessToken);
      router.replace('/');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logo}><Ionicons name="hourglass" color="#FFF" size={24} /></View>
            <Text style={styles.brand}>LearnTime</Text>
            <Text style={styles.title}>오늘의 성장을{`\n`}기록하세요</Text>
            <Text style={styles.subtitle}>공부와 운동, 매일의 성장을 한곳에서 관리해요.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>다시 만나서 반가워요</Text>
            <Text style={styles.cardSubtitle}>계정에 로그인하고 오늘의 기록을 이어가세요.</Text>
            {config.demoMode ? <Text style={styles.demo}>DEMO MODE · 백엔드 없이 화면을 확인합니다.</Text> : null}
            <Text style={styles.label}>이메일</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="user@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!isSubmitting} />
            <Text style={styles.label}>비밀번호</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="비밀번호" placeholderTextColor={colors.muted} secureTextEntry editable={!isSubmitting} onSubmitEditing={() => void handleLogin()} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed, isSubmitting && styles.disabled]} disabled={isSubmitting} onPress={() => void handleLogin()}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{config.demoMode ? '데모로 시작하기' : '로그인'}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  hero: { marginBottom: 30, alignItems: 'center' },
  logo: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, marginBottom: 12, transform: [{ rotate: '-4deg' }] },
  brand: { color: colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: 0.4, marginBottom: 12 },
  title: { color: colors.text, fontSize: 31, lineHeight: 39, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 10, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  cardSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 5 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 15, fontSize: 16, color: colors.text },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  demo: { color: colors.warning, backgroundColor: colors.warningSoft, padding: 10, borderRadius: 9, fontSize: 12, fontWeight: '700' },
  button: { marginTop: 10, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
