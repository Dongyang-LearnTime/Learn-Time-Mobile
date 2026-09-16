import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getRecentPersonalFocusRecords, getTodayPlans, registerFocusTime, registerPersonalFocusTime } from '../../src/api/studyApi';
import { MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/constants/theme';
import { useTimerStore } from '../../src/stores/timerStore';
import { formatTime, MAX_FOCUS_SECONDS } from '../../src/utils/formatTime';
import { getApiError } from '../../src/utils/getApiError';
import type { PersonalFocusRecordResponse, TodayStudyPlanResponse } from '../../src/types/study';

export default function TimerScreen() {
  const timer = useTimerStore();
  const [displaySeconds, setDisplaySeconds] = useState(timer.elapsedSeconds());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<TodayStudyPlanResponse[]>([]);
  const [recentPersonalRecords, setRecentPersonalRecords] = useState<PersonalFocusRecordResponse[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const isCompleted = timer.progressStatus === 'COMPLETED';

  useEffect(() => {
    getTodayPlans()
      .then(setPlans)
      .catch((requestError) => setError(getApiError(requestError)))
      .finally(() => setIsLoadingPlans(false));
  }, []);

  useEffect(() => {
    getRecentPersonalFocusRecords(5).then(setRecentPersonalRecords).catch(() => undefined);
  }, []);

  useEffect(() => {
    setDisplaySeconds(timer.elapsedSeconds());
    const id = setInterval(() => setDisplaySeconds(timer.elapsedSeconds()), 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.startedAt, timer.accumulatedSeconds]);

  const save = async () => {
    if (!timer.isPersonal && timer.studyDailyPlanId === null) return;
    if (timer.progressStatus === 'COMPLETED') {
      Alert.alert('저장할 수 없어요', '완료된 계획에는 집중 시간을 추가로 기록할 수 없습니다. 다른 오늘의 계획을 선택해주세요.');
      return;
    }
    let seconds = timer.isRunning ? await timer.pause() : timer.elapsedSeconds();
    setDisplaySeconds(seconds);

    if (seconds < 10) {
      Alert.alert('저장할 수 없어요', '집중 시간은 10초 이상이어야 합니다.');
      return;
    }
    if (seconds > MAX_FOCUS_SECONDS) {
      seconds = MAX_FOCUS_SECONDS;
      Alert.alert('시간 보정', '하루 최대 기록인 12시간으로 저장합니다.');
    }

    const submit = async () => {
      setIsSaving(true);
      setError('');
      try {
        if (timer.isPersonal) {
          const saved = await registerPersonalFocusTime({ focusSeconds: seconds });
          setRecentPersonalRecords((records) => [saved, ...records].slice(0, 5));
        } else {
          await registerFocusTime({ studyDailyPlanId: timer.studyDailyPlanId!, focusTime: formatTime(seconds) });
        }
        await timer.reset();
        setDisplaySeconds(0);
        Alert.alert('저장 완료', timer.isPersonal
          ? '자유 공부 집중 시간이 내 계정에 기록되었습니다.'
          : '집중 시간이 서버에 기록되었습니다. 웹에서도 확인할 수 있습니다.');
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setIsSaving(false);
      }
    };

    await submit();
  };

  const changePlan = (plan: TodayStudyPlanResponse) => {
    if (!timer.isPersonal && plan.studyDailyPlanId === timer.studyDailyPlanId) return;
    const select = () => void timer.selectPlan(plan);
    if (timer.elapsedSeconds() > 0) {
      Alert.alert('계획 변경', '현재 타이머 기록이 초기화됩니다. 다른 계획을 선택할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '변경', style: 'destructive', onPress: select },
      ]);
      return;
    }
    select();
  };

  const changeToPersonal = () => {
    if (timer.isPersonal) return;
    const select = () => void timer.selectPersonal();
    if (timer.elapsedSeconds() > 0) {
      Alert.alert('타이머 변경', '현재 타이머 기록이 초기화됩니다. 자유 공부로 변경할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '변경', style: 'destructive', onPress: select },
      ]);
      return;
    }
    select();
  };

  if (!timer.isPersonal && timer.studyDailyPlanId === null) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.eyebrow}>FOCUS TIMER</Text>
          <Text style={styles.title}>집중할 대상을 선택하세요</Text>
          <Text style={styles.muted}>스터디 계획이 없어도 자유 공부로 시간을 기록할 수 있습니다.</Text>
          <PersonalSubjectButton selected={false} onPress={() => void timer.selectPersonal()} />
          {isLoadingPlans ? <Text style={styles.muted}>과목을 불러오는 중...</Text> : plans.length === 0 ? <MessageBox message="오늘 학습계획은 없지만 위의 자유 공부 타이머는 바로 사용할 수 있습니다." /> : (
            <View style={styles.subjectList}>
              {plans.map((plan) => <SubjectButton key={plan.studyDailyPlanId} plan={plan} onPress={() => void timer.selectPlan(plan)} />)}
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>FOCUS TIMER</Text>
        <Text style={styles.title}>{timer.studyTitle}</Text>
        <Text style={styles.muted}>{timer.planContent}</Text>
      </View>
      <View style={styles.subjectList}>
        <Text style={styles.subjectLabel}>과목 변경</Text>
        <PersonalSubjectButton selected={timer.isPersonal} onPress={changeToPersonal} />
        {plans.map((plan) => <SubjectButton key={plan.studyDailyPlanId} plan={plan} selected={plan.studyDailyPlanId === timer.studyDailyPlanId} onPress={() => changePlan(plan)} />)}
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timer}>{formatTime(displaySeconds)}</Text>
        <Text style={styles.timerHint}>{timer.isRunning ? '집중 시간이 기록되고 있습니다' : '준비되면 시작하세요'}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.primaryButton, styles.flexButton, (isSaving || isCompleted) && styles.disabled]}
            disabled={isSaving || isCompleted}
            onPress={() => void (timer.isRunning ? timer.pause() : timer.start())}
          >
            <Text style={styles.primaryText}>{isCompleted ? '완료됨' : timer.isRunning ? '일시정지' : '시작'}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.flexButton]} disabled={isSaving} onPress={() => void timer.reset()}>
            <Text style={styles.secondaryText}>초기화</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.saveButton, (isSaving || isCompleted) && styles.disabled]} disabled={isSaving || isCompleted} onPress={() => void save()}>
          <Text style={styles.primaryText}>{isCompleted ? '완료된 계획은 저장할 수 없습니다' : isSaving ? '저장 중...' : '집중 시간 서버에 저장'}</Text>
        </Pressable>
      </View>
      {error ? <MessageBox message={error} error /> : null}
      {timer.isPersonal ? (
        <View style={styles.historyCard}>
          <Text style={styles.subjectLabel}>최근 자유 공부 기록</Text>
          {recentPersonalRecords.length === 0 ? <Text style={styles.muted}>아직 저장된 기록이 없습니다.</Text> : recentPersonalRecords.map((record) => (
            <View key={record.personalFocusRecordId} style={styles.historyRow}>
              <Text style={styles.historyTime}>{formatTime(record.focusSeconds)}</Text>
              <Text style={styles.historyDate}>{new Date(record.createdAt).toLocaleString('ko-KR')}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <MessageBox message="타이머는 시작 시각을 저장하므로 앱을 잠시 벗어나도 돌아왔을 때 경과 시간을 복원합니다." />
    </Screen>
  );
}

function PersonalSubjectButton({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.subjectButton, selected && styles.subjectSelected]} onPress={onPress} accessibilityState={{ selected }}>
      <Text style={[styles.subjectText, selected && styles.subjectTextSelected]}>자유 공부</Text>
      <Text style={[styles.subjectContent, selected && styles.subjectTextSelected]}>그룹이나 과목 없이 집중시간만 기록</Text>
    </Pressable>
  );
}

function SubjectButton({ plan, selected = false, onPress }: { plan: TodayStudyPlanResponse; selected?: boolean; onPress: () => void }) {
  const disabled = plan.progressStatus === 'COMPLETED';
  return (
    <Pressable
      style={[styles.subjectButton, selected && styles.subjectSelected, disabled && styles.subjectDisabled]}
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ disabled, selected }}
    >
      <Text style={[styles.subjectText, selected && styles.subjectTextSelected]}>{plan.studyTitle}</Text>
      <Text style={[styles.subjectContent, selected && styles.subjectTextSelected]} numberOfLines={1}>{disabled ? '완료됨 · ' : ''}{plan.planContent}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: { paddingVertical: 10, gap: 8 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  timerCard: { marginTop: 10, backgroundColor: colors.surface, borderRadius: 24, padding: 22, alignItems: 'center', gap: 18 },
  timer: { color: colors.text, fontSize: 49, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  timerHint: { color: colors.muted },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  flexButton: { flex: 1 },
  primaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  secondaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  saveButton: { width: '100%', minHeight: 54, borderRadius: 13, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  empty: { flex: 1, minHeight: 420, justifyContent: 'center', gap: 14 },
  subjectList: { width: '100%', gap: 9 },
  subjectLabel: { color: colors.text, fontWeight: '800' },
  subjectButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, backgroundColor: colors.surface },
  subjectSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  subjectDisabled: { opacity: 0.55 },
  subjectText: { color: colors.text, fontWeight: '800' },
  subjectTextSelected: { color: colors.primary },
  subjectContent: { color: colors.muted, fontSize: 12, marginTop: 4 },
  historyCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 11 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  historyTime: { color: colors.text, fontWeight: '800', fontVariant: ['tabular-nums'] },
  historyDate: { color: colors.muted, fontSize: 12 },
});
