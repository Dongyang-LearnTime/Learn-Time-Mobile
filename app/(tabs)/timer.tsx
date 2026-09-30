import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getTodayPlans, registerFocusTime, startStudyDailyPlan } from '../../src/api/studyApi';
import { MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { useTheme, type ThemeColors, shadows } from '../../src/constants/theme';
import { useTimerStore } from '../../src/stores/timerStore';
import { formatTime } from '../../src/utils/formatTime';
import { getApiError } from '../../src/utils/getApiError';
import type { TodayStudyPlanResponse } from '../../src/types/study';

export default function TimerScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const timer = useTimerStore();
  const [displaySeconds, setDisplaySeconds] = useState(timer.elapsedSeconds());
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<TodayStudyPlanResponse[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const isCompleted = timer.progressStatus === 'COMPLETED';

  useEffect(() => {
    getTodayPlans()
      .then(setPlans)
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setIsLoadingPlans(false));
  }, []);

  useEffect(() => {
    setDisplaySeconds(timer.elapsedSeconds());
    const id = setInterval(() => setDisplaySeconds(timer.elapsedSeconds()), 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.startedAt, timer.accumulatedSeconds]);

  const save = async () => {
    if (saving.current) return;
    const current = useTimerStore.getState();
    if (current.studyDailyPlanId === null) return;
    if (current.progressStatus === 'COMPLETED') {
      Alert.alert('저장할 수 없어요', '완료된 계획에는 집중 시간을 추가로 기록할 수 없습니다. 다른 오늘의 계획을 선택해주세요.');
      return;
    }
    const planId = current.studyDailyPlanId;
    saving.current = true; setIsSaving(true); setError('');
    try {
      const seconds = current.isRunning ? await current.pause() : current.elapsedSeconds();
      setDisplaySeconds(seconds);
      if (seconds < 10) {
        Alert.alert('저장할 수 없어요', '집중 시간은 10초 이상이어야 합니다.'); return;
      }
      await registerFocusTime({ studyDailyPlanId: planId, focusTime: formatTime(seconds) });
      await useTimerStore.getState().reset();
      setDisplaySeconds(0);
      Alert.alert('저장 완료', '집중 시간이 서버에 기록되었습니다. 웹에서도 확인할 수 있습니다.');
    } catch (requestError) { setError(getApiError(requestError)); }
    finally { saving.current = false; setIsSaving(false); }
  };

  const selectAndStartPlan = async (plan: TodayStudyPlanResponse) => {
    if (saving.current) return;
    let selectedPlan = plan;
    if (plan.progressStatus === 'NOT_STARTED') {
      await startStudyDailyPlan(plan.studyDailyPlanId);
      selectedPlan = { ...plan, progressStatus: 'IN_PROGRESS' };
      setPlans((items) => items.map((item) => item.studyDailyPlanId === plan.studyDailyPlanId ? selectedPlan : item));
    }
    await timer.selectPlan(selectedPlan);
  };

  const changePlan = (plan: TodayStudyPlanResponse) => {
    if (saving.current) return;
    if (plan.studyDailyPlanId === timer.studyDailyPlanId) return;
    const select = () => void selectAndStartPlan(plan).catch((requestError) => setError(getApiError(requestError)));
    if (timer.elapsedSeconds() > 0) {
      Alert.alert('계획 변경', '현재 타이머 기록이 초기화됩니다. 다른 계획을 선택할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '변경', style: 'destructive', onPress: select },
      ]);
      return;
    }
    select();
  };

  const toggleTimer = async () => {
    if (saving.current) return;
    setError('');
    try {
      if (timer.isRunning) {
        await timer.pause();
        return;
      }
      if (timer.progressStatus === 'NOT_STARTED' && timer.studyDailyPlanId !== null) {
        await startStudyDailyPlan(timer.studyDailyPlanId);
        const plan = plans.find((item) => item.studyDailyPlanId === timer.studyDailyPlanId);
        if (plan) {
          const updated = { ...plan, progressStatus: 'IN_PROGRESS' as const };
          setPlans((items) => items.map((item) => item.studyDailyPlanId === updated.studyDailyPlanId ? updated : item));
          await timer.selectPlan(updated);
        }
      }
      await useTimerStore.getState().start();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  if (timer.studyDailyPlanId === null) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.eyebrow}>FOCUS TIMER</Text>
          <Text style={styles.title}>집중할 대상을 선택하세요</Text>
          <Text style={styles.muted}>오늘의 공부 일정 중 집중 시간을 기록할 계획을 선택해주세요.</Text>
          {isLoadingPlans ? <Text style={styles.muted}>과목을 불러오는 중...</Text> : plans.length === 0 ? <MessageBox message="오늘 예정된 학습 계획이 없습니다. 홈에서 공부 일정을 확인해주세요." /> : (
            <View style={styles.subjectList}>
              {plans.map((plan) => <SubjectButton key={plan.studyDailyPlanId} plan={plan} onPress={() => void selectAndStartPlan(plan).catch((requestError) => setError(getApiError(requestError)))} />)}
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.eyebrowRow}><Ionicons name="flash" color={colors.primary} size={15} /><Text style={styles.eyebrow}>FOCUS TIMER</Text></View>
        <Text style={styles.title}>{timer.studyTitle}</Text>
        <Text style={styles.muted}>{timer.planContent}</Text>
      </View>
      <View style={styles.subjectList}>
        <Text style={styles.subjectLabel}>과목 변경</Text>
        {plans.map((plan) => <SubjectButton key={plan.studyDailyPlanId} plan={plan} selected={plan.studyDailyPlanId === timer.studyDailyPlanId} saving={isSaving} onPress={() => changePlan(plan)} />)}
      </View>

      <View style={styles.timerCard}>
        <View style={[styles.pulse, timer.isRunning && styles.pulseActive]}><Ionicons name={timer.isRunning ? 'radio-button-on' : 'time-outline'} color={timer.isRunning ? colors.success : colors.primary} size={18} /></View>
        <Text style={styles.timer} adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>{formatTime(displaySeconds)}</Text>
        <Text style={styles.timerHint}>{timer.isRunning ? '집중 시간이 기록되고 있습니다' : '준비되면 시작하세요'}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.primaryButton, styles.flexButton, (isSaving || isCompleted) && styles.disabled]}
            disabled={isSaving || isCompleted}
            onPress={() => void toggleTimer()}
          >
            <Text style={styles.primaryText}>{isCompleted ? '완료됨' : timer.isRunning ? '일시정지' : '시작'}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.flexButton]} disabled={isSaving} onPress={() => void timer.reset().catch((requestError) => setError(getApiError(requestError)))}>
            <Text style={styles.secondaryText}>초기화</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.saveButton, (isSaving || isCompleted) && styles.disabled]} disabled={isSaving || isCompleted} onPress={() => void save()}>
          <Text style={styles.primaryText} numberOfLines={2}>{isCompleted ? '완료된 계획은 저장할 수 없습니다' : isSaving ? '저장 중...' : '집중 시간 저장하기'}</Text>
        </Pressable>
      </View>
      {error ? <MessageBox message={error} error /> : null}
      <MessageBox message="타이머는 시작 시각을 저장하므로 앱을 잠시 벗어나도 돌아왔을 때 경과 시간을 복원합니다." />
    </Screen>
  );
}

function SubjectButton({ plan, selected = false, saving = false, onPress }: { plan: TodayStudyPlanResponse; selected?: boolean; saving?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const completed = plan.progressStatus === 'COMPLETED';
  const disabled = saving || completed;
  return (
    <Pressable
      style={[styles.subjectButton, selected && styles.subjectSelected, disabled && styles.subjectDisabled]}
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ disabled, selected }}
    >
      <View style={styles.subjectTitleRow}><Ionicons name="book-outline" color={selected ? colors.primary : colors.muted} size={17} /><Text style={[styles.subjectText, selected && styles.subjectTextSelected]} numberOfLines={1}>{plan.studyTitle}</Text></View>
      <Text style={[styles.subjectContent, selected && styles.subjectTextSelected]} numberOfLines={1}>{completed ? '완료됨 · ' : ''}{plan.planContent}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: { paddingTop: 6, paddingBottom: 2, gap: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  timerCard: { marginTop: 4, backgroundColor: colors.surface, borderRadius: 28, paddingHorizontal: 18, paddingVertical: 24, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  pulse: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  pulseActive: { backgroundColor: colors.successSoft },
  timer: { width: '100%', color: colors.text, textAlign: 'center', fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -1.5 },
  timerHint: { color: colors.muted },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  flexButton: { flex: 1 },
  primaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 13, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  secondaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  saveButton: { width: '100%', minHeight: 54, borderRadius: 13, backgroundColor: colors.successSolid, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  empty: { flex: 1, minHeight: 420, justifyContent: 'center', gap: 14 },
  subjectList: { width: '100%', gap: 9 },
  subjectLabel: { color: colors.text, fontWeight: '800' },
  subjectButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 14, backgroundColor: colors.surface },
  subjectSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  subjectDisabled: { opacity: 0.55 },
  subjectTitleRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectText: { flexShrink: 1, color: colors.text, fontWeight: '800' },
  subjectTextSelected: { color: colors.primary },
  subjectContent: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
