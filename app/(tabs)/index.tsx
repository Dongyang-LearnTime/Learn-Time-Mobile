import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { completeStudyDailyPlan, getMyStudyProgresses, getStudyDailyPlans, getStudyTotalInfo, getTodayPlans, startStudyDailyPlan } from '../../src/api/studyApi';
import { getUserSummary } from '../../src/api/userApi';
import { LoadingView, MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { PlanContent } from '../../src/components/PlanContent';
import { getBadgeImage, getTierImage } from '../../src/constants/gamificationAssets';
import { useTheme, type ThemeColors, shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useTimerStore } from '../../src/stores/timerStore';
import type { CompletionStatus, StudyDailyPlanResponse, StudyProgressIndicatorResponse, StudyTotalInfoResponse, TodayStudyPlanResponse } from '../../src/types/study';
import type { UserSummaryResponse } from '../../src/types/user';
import { getApiError } from '../../src/utils/getApiError';

const statusLabel = { NOT_STARTED: '시작 전', IN_PROGRESS: '진행 중', COMPLETED: '완료' } as const;

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const userName = useAuthStore((state) => state.userName);
  const selectPlan = useTimerStore((state) => state.selectPlan);
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null);
  const [plans, setPlans] = useState<TodayStudyPlanResponse[]>([]);
  const [schedules, setSchedules] = useState<Record<number, StudyDailyPlanResponse[]>>({});
  const [studies, setStudies] = useState<StudyProgressIndicatorResponse[]>([]);
  const [studyTotals, setStudyTotals] = useState<Record<number, StudyTotalInfoResponse>>({});
  const [expandedStudy, setExpandedStudy] = useState<number | null>(null);
  const [completionTarget, setCompletionTarget] = useState<number | null>(null);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('SUCCESS');
  const [understandingScore, setUnderstandingScore] = useState(3);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError('');
    try {
      const [nextSummary, nextPlans, nextStudies] = await Promise.all([getUserSummary(), getTodayPlans(), getMyStudyProgresses()]);
      setSummary(nextSummary);
      setPlans(nextPlans);
      setStudies(nextStudies);
      const results = await Promise.all(nextStudies.map(async (study) => {
        try { return [study.studyId, await getStudyDailyPlans(study.studyId)] as const; }
        catch { return [study.studyId, []] as const; }
      }));
      const totals = await Promise.all(nextStudies.map(async (study) => {
        try { return [study.studyId, await getStudyTotalInfo(study.studyId)] as const; }
        catch { return [study.studyId, { studyCompletionRate: 0, studySuccessRate: 0, quizCorrectRate: null, totalFocusedTime: null }] as const; }
      }));
      setSchedules(Object.fromEntries(results)); setStudyTotals(Object.fromEntries(totals));
    } catch (requestError) { setError(getApiError(requestError)); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const counts = useMemo(() => ({
    completed: plans.filter((plan) => plan.progressStatus === 'COMPLETED').length,
    inProgress: plans.filter((plan) => plan.progressStatus === 'IN_PROGRESS').length,
    waiting: plans.filter((plan) => plan.progressStatus === 'NOT_STARTED').length,
  }), [plans]);

  const openTimerForPlan = async (plan: TodayStudyPlanResponse) => { await selectPlan(plan); router.push('/timer'); };

  const startPlan = async (plan: TodayStudyPlanResponse) => {
    setBusyPlanId(plan.studyDailyPlanId); setError('');
    try {
      await startStudyDailyPlan(plan.studyDailyPlanId);
      const updated = { ...plan, progressStatus: 'IN_PROGRESS' as const };
      setPlans((items) => items.map((item) => item.studyDailyPlanId === plan.studyDailyPlanId ? updated : item));
      await selectPlan(updated);
    } catch (requestError) { setError(getApiError(requestError)); }
    finally { setBusyPlanId(null); }
  };

  const completePlan = async (plan: TodayStudyPlanResponse) => {
    setBusyPlanId(plan.studyDailyPlanId); setError('');
    try {
      await completeStudyDailyPlan({ studyDailyPlanId: plan.studyDailyPlanId, completionStatus, understandingScore });
      const completedPlan = { ...plan, progressStatus: 'COMPLETED' as const };
      setPlans((items) => items.map((item) => item.studyDailyPlanId === plan.studyDailyPlanId ? completedPlan : item));
      if (useTimerStore.getState().studyDailyPlanId === plan.studyDailyPlanId) await selectPlan(completedPlan);
      setSummary(await getUserSummary());
      setCompletionTarget(null);
    } catch (requestError) { setError(getApiError(requestError)); }
    finally { setBusyPlanId(null); }
  };

  return <Screen refreshing={isRefreshing} onRefresh={() => void load(true)}>
    <View style={styles.header}>
      <View style={styles.brandRow}><View style={styles.brandIcon}><Ionicons name="sparkles" color={colors.primary} size={16} /></View><Text style={styles.eyebrow}>LEARN · GROW · REPEAT</Text></View>
      <Text style={styles.title}>{userName ? `${userName}님, 반가워요` : '오늘도 성장해볼까요?'}</Text>
      <Text style={styles.subtitle}>공부 일정과 오늘의 진도를 한눈에 관리해요.</Text>
    </View>

    {isLoading ? <LoadingView /> : null}
    {!isLoading && error ? <MessageBox message={error} error /> : null}

    {!isLoading && summary ? <>
      <View style={styles.tierCard}>
        <View style={styles.tierCopy}><Text style={styles.cardCaption}>나의 현재 티어</Text><Text style={styles.tier}>{summary.tierName}</Text><Text style={styles.points}>{summary.point.toLocaleString()} P</Text>{summary.nextMinPoint > summary.point ? <Text style={styles.nextTier}>다음 티어까지 {(summary.nextMinPoint - summary.point).toLocaleString()}P</Text> : null}</View>
        <Image source={getTierImage(summary.tierName)} style={styles.tierImage} resizeMode="contain" accessibilityLabel={`${summary.tierName} 티어 이미지`} />
      </View>
      <View style={styles.badgeCard}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>획득 배지</Text><Text style={styles.planCount}>{summary.badges.length}개</Text></View>
        {summary.badges.length === 0 ? <Text style={styles.emptyText}>진도를 완료하고 첫 배지를 획득해보세요.</Text> : <View style={styles.badgeList}>{summary.badges.slice(0, 5).map((badge) => <View key={`${badge.badgeType}-${badge.acquiredAt}`} style={styles.badgeItem}><Image source={getBadgeImage(badge.badgeType)} style={styles.badgeImage} resizeMode="contain" /><Text style={styles.badgeName} numberOfLines={2}>{badge.displayName}</Text></View>)}</View>}
      </View>
    </> : null}

    {!isLoading ? <>
      <ProgressOverview total={plans.length} {...counts} />
      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>오늘의 공부 진도</Text><Text style={styles.planCount}>{plans.length}개</Text></View>
        {plans.length === 0 ? <MessageBox message="오늘 예정된 학습 계획이 없습니다." /> : plans.map((plan) => {
          const isCompleted = plan.progressStatus === 'COMPLETED';
          const isBusy = busyPlanId === plan.studyDailyPlanId;
          const isCompleting = completionTarget === plan.studyDailyPlanId;
          return <View key={plan.studyDailyPlanId} style={[styles.planCard, isCompleted && styles.completedCard]}>
            <View style={styles.planTop}><View style={styles.planTitleRow}><View style={styles.planIcon}><Ionicons name={isCompleted ? 'checkmark' : 'book-outline'} color={isCompleted ? colors.success : colors.primary} size={18} /></View><Text style={styles.planTitle}>{plan.studyTitle}</Text></View><Text style={[styles.status, isCompleted && styles.statusComplete]}>{statusLabel[plan.progressStatus]}</Text></View>
            <PlanContent content={plan.planContent} />
            {isCompleting ? <View style={styles.completionPanel}>
              <Text style={styles.controlLabel}>학습 결과</Text><View style={styles.optionRow}>{(['SUCCESS', 'FAILURE'] as const).map((status) => <Pressable key={status} style={[styles.optionButton, completionStatus === status && styles.optionSelected]} onPress={() => setCompletionStatus(status)}><Text style={[styles.optionText, completionStatus === status && styles.optionTextSelected]}>{status === 'SUCCESS' ? '목표 달성' : '목표 미달'}</Text></Pressable>)}</View>
              <Text style={styles.controlLabel}>이해도</Text><View style={styles.scoreRow}>{[1, 2, 3, 4, 5].map((score) => <Pressable key={score} style={[styles.scoreButton, understandingScore === score && styles.scoreSelected]} onPress={() => setUnderstandingScore(score)}><Text style={[styles.scoreText, understandingScore === score && styles.scoreTextSelected]}>{score}</Text></Pressable>)}</View>
              <View style={styles.actionButtons}><Pressable style={styles.cancelButton} onPress={() => setCompletionTarget(null)}><Text style={styles.cancelText}>취소</Text></Pressable><Pressable style={[styles.completeButton, isBusy && styles.disabled]} disabled={isBusy} onPress={() => void completePlan(plan)}><Text style={styles.buttonText}>{isBusy ? '저장 중...' : '진도 완료'}</Text></Pressable></View>
            </View> : <View style={styles.actionButtons}>
              {plan.progressStatus === 'NOT_STARTED' ? <Pressable style={[styles.startButton, isBusy && styles.disabled]} disabled={isBusy} onPress={() => void startPlan(plan)}><Ionicons name="play" color="#FFF" size={16} /><Text style={styles.buttonText}>{isBusy ? '시작 중...' : '진도 시작'}</Text></Pressable> : null}
              {plan.progressStatus === 'IN_PROGRESS' ? <><Pressable style={styles.timerButton} onPress={() => void openTimerForPlan(plan)}><Ionicons name="timer-outline" color={colors.primary} size={17} /><Text style={styles.timerButtonText}>타이머</Text></Pressable><Pressable style={styles.completeButton} onPress={() => setCompletionTarget(plan.studyDailyPlanId)}><Text style={styles.buttonText}>완료하기</Text></Pressable></> : null}
              {isCompleted ? <View style={styles.finishedRow}><Ionicons name="checkmark-circle" color={colors.success} size={18} /><Text style={styles.finishedText}>오늘의 진도를 완료했어요</Text></View> : null}
            </View>}
          </View>;
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>공부 일정</Text><Ionicons name="calendar-outline" color={colors.primary} size={20} /></View>
        {studies.length === 0 ? <MessageBox message="진행 중인 공부 일정이 없습니다." /> : studies.map((study) => {
          const schedule = schedules[study.studyId] ?? []; const expanded = expandedStudy === study.studyId;
          return <View key={study.studyId} style={styles.scheduleCard}>
            <Pressable style={styles.scheduleHeader} onPress={() => setExpandedStudy(expanded ? null : study.studyId)}><View style={styles.scheduleTitleCopy}><Text style={styles.scheduleTitle}>{study.studyTitle}</Text><Text style={styles.scheduleMeta}>전체 {schedule.length}일 · 진도율 {Math.round(studyTotals[study.studyId]?.studyCompletionRate ?? 0)}%</Text><View style={styles.studyProgressTrack}><View style={[styles.studyProgressFill, { width: `${Math.min(100, Math.max(0, studyTotals[study.studyId]?.studyCompletionRate ?? 0))}%` }]} /></View></View><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={20} /></Pressable>
            {(expanded ? schedule : schedule.slice(0, 3)).map((item) => <View key={item.studyDailyPlanId} style={styles.scheduleRow}><View style={styles.dayBadge}><Text style={styles.dayText}>{item.dayNumber}일</Text></View><View style={styles.scheduleCopy}><Text style={styles.scheduleDate}>{item.planDate}</Text><PlanContent content={item.planContent} /></View></View>)}
          </View>;
        })}
      </View>
    </> : null}
  </Screen>;
}

function ProgressOverview({ total, completed, inProgress, waiting }: { total: number; completed: number; inProgress: number; waiting: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return <View style={styles.progressCard}><View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>오늘의 진도율</Text><Text style={styles.progressCaption}>{completed}/{total}개 완료</Text></View><Text style={styles.progressValue}>{rate}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rate}%` }]} /></View><View style={styles.legendRow}><Legend color={colors.success} label="완료" value={completed} /><Legend color={colors.primary} label="진행 중" value={inProgress} /><Legend color={colors.muted} label="시작 전" value={waiting} /></View></View>;
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors); return <View style={styles.legend}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendLabel}>{label} {value}</Text></View>; }

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { paddingTop: 6, paddingBottom: 8 }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: '900', marginTop: 12, letterSpacing: -0.7 }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 7, lineHeight: 21 },
  tierCard: { minHeight: 166, flexDirection: 'row', overflow: 'hidden', backgroundColor: colors.primaryDark, borderRadius: 24, padding: 20, ...shadows.card }, tierCopy: { flex: 1, zIndex: 1 }, cardCaption: { color: '#D9D6FE', fontSize: 12, fontWeight: '700' }, tier: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 5 }, points: { color: '#FFF', fontSize: 17, fontWeight: '800', marginTop: 5 }, nextTier: { color: '#D9D6FE', fontSize: 11, marginTop: 8 }, tierImage: { width: 132, height: 142, marginRight: -12, marginTop: -8 },
  badgeCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 17, borderWidth: 1, borderColor: colors.border }, badgeList: { flexDirection: 'row', gap: 8, marginTop: 12 }, badgeItem: { flex: 1, alignItems: 'center', minWidth: 0 }, badgeImage: { width: 48, height: 48 }, badgeName: { color: colors.muted, fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 4 }, emptyText: { color: colors.muted, fontSize: 13, marginTop: 10 },
  progressCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card }, progressCaption: { color: colors.muted, fontSize: 12, marginTop: 4 }, progressValue: { color: colors.primary, fontSize: 28, fontWeight: '900' }, progressTrack: { height: 11, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.surfaceMuted }, progressFill: { height: '100%', borderRadius: 8, backgroundColor: colors.success }, legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 }, legend: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  section: { gap: 12 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' }, planCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  planCard: { backgroundColor: colors.surface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border, ...shadows.card }, completedCard: { backgroundColor: colors.successSoft }, planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, planTitleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, planIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }, planTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' }, status: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 11, fontWeight: '800' }, statusComplete: { color: colors.success, backgroundColor: colors.successSoft }, planContent: { color: colors.muted, lineHeight: 21, marginTop: 12 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 15 }, startButton: { flex: 1, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 13, backgroundColor: colors.primary }, timerButton: { flex: 1, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, backgroundColor: colors.primarySoft }, timerButtonText: { color: colors.primary, fontWeight: '800' }, completeButton: { flex: 1, minHeight: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.success }, buttonText: { color: '#FFF', fontWeight: '800' }, cancelButton: { flex: 1, minHeight: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.border }, cancelText: { color: colors.muted, fontWeight: '800' }, disabled: { opacity: 0.55 }, finishedRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, finishedText: { color: colors.success, fontSize: 13, fontWeight: '800' },
  completionPanel: { marginTop: 15, paddingTop: 14, gap: 10, borderTopWidth: 1, borderTopColor: colors.border }, controlLabel: { color: colors.text, fontSize: 12, fontWeight: '800' }, optionRow: { flexDirection: 'row', gap: 8 }, optionButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceMuted }, optionSelected: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }, optionText: { color: colors.muted, fontWeight: '700' }, optionTextSelected: { color: colors.primary }, scoreRow: { flexDirection: 'row', gap: 7 }, scoreButton: { flex: 1, aspectRatio: 1, maxHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceMuted }, scoreSelected: { backgroundColor: colors.primary }, scoreText: { color: colors.muted, fontWeight: '900' }, scoreTextSelected: { color: '#FFF' },
  scheduleCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 2, borderWidth: 1, borderColor: colors.border }, scheduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 54 }, scheduleTitleCopy: { flex: 1, marginRight: 12 }, scheduleTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, scheduleMeta: { color: colors.muted, fontSize: 11, marginTop: 3 }, studyProgressTrack: { height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.surfaceMuted, marginTop: 8 }, studyProgressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary }, scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }, dayBadge: { width: 42, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.primarySoft }, dayText: { color: colors.primary, fontSize: 11, fontWeight: '900' }, scheduleCopy: { flex: 1 }, scheduleContent: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '700' }, scheduleDate: { color: colors.muted, fontSize: 10, marginTop: 3 },
});
