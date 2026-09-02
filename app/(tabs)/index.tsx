import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getTodayPlans } from '../../src/api/studyApi';
import { getUserSummary } from '../../src/api/userApi';
import { LoadingView, MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import type { TodayStudyPlanResponse } from '../../src/types/study';
import type { UserSummaryResponse } from '../../src/types/user';
import { getApiError } from '../../src/utils/getApiError';

const statusLabel: Record<string, string> = {
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

export default function HomeScreen() {
  const router = useRouter();
  const userName = useAuthStore((state) => state.userName);
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null);
  const [plans, setPlans] = useState<TodayStudyPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError('');
    try {
      const [nextSummary, nextPlans] = await Promise.all([getUserSummary(), getTodayPlans()]);
      setSummary(nextSummary);
      setPlans(nextPlans);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return (
    <Screen refreshing={isRefreshing} onRefresh={() => void load(true)}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LEARN · GROW · REPEAT</Text>
        <Text style={styles.title}>{userName ? `${userName}님, 반가워요` : '오늘도 성장해볼까요?'}</Text>
        <Text style={styles.subtitle}>앱의 기록은 LearnTime 웹에도 바로 반영됩니다.</Text>
      </View>

      {isLoading ? <LoadingView /> : null}
      {!isLoading && error ? <MessageBox message={error} error /> : null}

      {!isLoading && !error && summary ? (
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.cardCaption}>현재 티어</Text>
            <Text style={styles.tier}>{summary.tierName}</Text>
          </View>
          <View style={styles.pointBox}>
            <Text style={styles.cardCaption}>보유 포인트</Text>
            <Text style={styles.points}>{summary.point.toLocaleString()} P</Text>
          </View>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 학습 계획</Text>
          {plans.length === 0 ? (
            <MessageBox message="오늘 예정된 학습 계획이 없습니다. 웹에서 계획을 먼저 생성해주세요." />
          ) : plans.map((plan) => (
            <View key={plan.studyDailyPlanId} style={styles.planCard}>
              <View style={styles.planTop}>
                <Text style={styles.planTitle}>{plan.studyTitle}</Text>
                <Text style={styles.status}>{statusLabel[plan.progressStatus] ?? plan.progressStatus}</Text>
              </View>
              <Text style={styles.planContent} numberOfLines={3}>{plan.planContent}</Text>
            </View>
          ))}
          <Pressable style={styles.timerButton} onPress={() => router.push('/timer')}><Text style={styles.timerButtonText}>과목을 선택해 타이머 시작</Text></Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 10 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 27, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 7 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primary, borderRadius: 20, padding: 20 },
  cardCaption: { color: '#D9D6FE', fontSize: 12, fontWeight: '700' },
  tier: { color: '#FFF', fontSize: 25, fontWeight: '800', marginTop: 6 },
  pointBox: { alignItems: 'flex-end' },
  points: { color: '#FFF', fontSize: 21, fontWeight: '800', marginTop: 8 },
  section: { gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 4 },
  planCard: { backgroundColor: colors.surface, padding: 18, borderRadius: 17, borderWidth: 1, borderColor: colors.border },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  planTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800' },
  status: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  planContent: { color: colors.muted, lineHeight: 21, marginTop: 10 },
  action: { color: colors.primary, fontWeight: '800', marginTop: 14 },
  pressed: { opacity: 0.72 },
  timerButton: { backgroundColor: colors.primary, borderRadius: 14, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  timerButtonText: { color: '#FFF', fontWeight: '800' },
});
