import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { login } from '../src/api/authApi';
import { config, hasApiBaseUrl } from '../src/constants/config';
import { colors } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/authStore';
import { getApiError } from '../src/utils/getApiError';

export default function LoginScreen() {
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
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.brand}>LearnTime</Text>
        <Text style={styles.title}>오늘의 성장을 기록하세요</Text>
        <Text style={styles.subtitle}>웹에서 사용하던 계정으로 로그인합니다.</Text>
      </View>

      <View style={styles.card}>
        {config.demoMode ? <Text style={styles.demo}>DEMO MODE · 백엔드 없이 화면을 확인합니다.</Text> : null}
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="user@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!isSubmitting}
        />
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          editable={!isSubmitting}
          onSubmitEditing={() => void handleLogin()}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed, isSubmitting && styles.disabled]}
          disabled={isSubmitting}
          onPress={() => void handleLogin()}
        >
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{config.demoMode ? '데모로 입장' : '로그인'}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  hero: { marginBottom: 28 },
  brand: { color: colors.primary, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 10 },
  label: { color: colors.text, fontWeight: '700', marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  demo: { color: colors.warning, backgroundColor: '#FFFAEB', padding: 10, borderRadius: 9, fontSize: 12, fontWeight: '700' },
  button: { marginTop: 8, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
