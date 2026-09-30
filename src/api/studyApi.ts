import { apiClient } from './client';
import { config } from '../constants/config';
import type { FocusTimeRequest, PlanCompleteRequest, StudyDailyPlanResponse, StudyProgressIndicatorResponse, StudyTotalInfoResponse, TodayStudyPlanResponse } from '../types/study';
import { mockDelay, mockTodayPlans } from './mockData';

export async function getTodayPlans(): Promise<TodayStudyPlanResponse[]> {
  if (config.demoMode) {
    await mockDelay();
    return mockTodayPlans;
  }
  const { data } = await apiClient.get<TodayStudyPlanResponse[]>('/api/study/daily/today-plans');
  return data;
}

export async function registerFocusTime(request: FocusTimeRequest): Promise<void> {
  if (!request || !Number.isInteger(request.studyDailyPlanId) || request.studyDailyPlanId <= 0
    || typeof request.focusTime !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(request.focusTime)) {
    throw new Error('유효하지 않은 집중 시간입니다.');
  }
  if (config.demoMode) {
    await mockDelay(400);
    return;
  }
  await apiClient.patch('/api/study/daily/focus-time', request);
}

export async function startStudyDailyPlan(studyDailyPlanId: number): Promise<void> {
  if (!Number.isInteger(studyDailyPlanId) || studyDailyPlanId <= 0) throw new Error('유효하지 않은 학습 계획입니다.');
  if (config.demoMode) {
    await mockDelay(300);
    const plan = mockTodayPlans.find((item) => item.studyDailyPlanId === studyDailyPlanId);
    if (plan) plan.progressStatus = 'IN_PROGRESS';
    return;
  }
  await apiClient.patch(`/api/study/daily/${studyDailyPlanId}/start`);
}

export async function completeStudyDailyPlan(request: PlanCompleteRequest): Promise<string> {
  if (!Number.isInteger(request.studyDailyPlanId) || request.studyDailyPlanId <= 0
    || !['SUCCESS', 'FAILURE'].includes(request.completionStatus)
    || !Number.isInteger(request.understandingScore) || request.understandingScore < 1 || request.understandingScore > 5) {
    throw new Error('완료 정보를 확인해주세요.');
  }
  if (config.demoMode) {
    await mockDelay(350);
    const plan = mockTodayPlans.find((item) => item.studyDailyPlanId === request.studyDailyPlanId);
    if (plan) plan.progressStatus = 'COMPLETED';
    return '포인트 10 지급 완료!';
  }
  const { data } = await apiClient.patch<string>('/api/study/daily/completion', request);
  return data;
}

export async function getStudyDailyPlans(studyId: number): Promise<StudyDailyPlanResponse[]> {
  if (!Number.isInteger(studyId) || studyId <= 0) throw new Error('유효하지 않은 공부 정보입니다.');
  if (config.demoMode) {
    await mockDelay();
    return mockTodayPlans.filter((item) => item.studyId === studyId).map((item, index) => ({
      studyDailyPlanId: item.studyDailyPlanId,
      dayNumber: index + 1,
      planDate: new Date(Date.now() + index * 86_400_000).toISOString().slice(0, 10),
      planContent: item.planContent,
    }));
  }
  const { data } = await apiClient.get<StudyDailyPlanResponse[]>(`/api/study/daily/${studyId}/plan`);
  return data;
}

export async function getMyStudyProgresses(): Promise<StudyProgressIndicatorResponse[]> {
  if (config.demoMode) {
    await mockDelay();
    return [...new Map(mockTodayPlans.map((plan) => [plan.studyId, { studyId: plan.studyId, studyTitle: plan.studyTitle, hasTodayPlan: true }])).values()];
  }
  const { data } = await apiClient.get<StudyProgressIndicatorResponse[]>('/api/study/progress');
  return data;
}

export async function getStudyTotalInfo(studyId: number): Promise<StudyTotalInfoResponse> {
  if (!Number.isInteger(studyId) || studyId <= 0) throw new Error('유효하지 않은 공부 정보입니다.');
  if (config.demoMode) {
    await mockDelay();
    return { studyCompletionRate: studyId % 2 === 0 ? 42 : 68, studySuccessRate: 80, quizCorrectRate: 75, totalFocusedTime: 7200 };
  }
  const { data } = await apiClient.get<StudyTotalInfoResponse>(`/api/study/${studyId}/total`);
  return data;
}
