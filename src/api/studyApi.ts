import { apiClient } from './client';
import { config } from '../constants/config';
import type { FocusTimeRequest, PersonalFocusRecordRequest, PersonalFocusRecordResponse, TodayStudyPlanResponse } from '../types/study';
import { mockDelay, mockTodayPlans } from './mockData';
import { MAX_FOCUS_SECONDS } from '../utils/formatTime';

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

export async function registerPersonalFocusTime(request: PersonalFocusRecordRequest): Promise<PersonalFocusRecordResponse> {
  if (!request || !Number.isInteger(request.focusSeconds) || request.focusSeconds < 10 || request.focusSeconds > MAX_FOCUS_SECONDS) {
    throw new Error('유효하지 않은 집중 시간입니다.');
  }
  if (config.demoMode) {
    await mockDelay(400);
    return {
      personalFocusRecordId: Date.now(),
      focusSeconds: request.focusSeconds,
      createdAt: new Date().toISOString(),
    };
  }
  const { data } = await apiClient.post<PersonalFocusRecordResponse>('/api/study/focus-records', request);
  return data;
}

export async function getRecentPersonalFocusRecords(size = 10): Promise<PersonalFocusRecordResponse[]> {
  const safeSize = Number.isInteger(size) ? Math.min(Math.max(size, 1), 100) : 10;
  if (config.demoMode) {
    await mockDelay();
    return [];
  }
  const { data } = await apiClient.get<PersonalFocusRecordResponse[]>('/api/study/focus-records', { params: { size: safeSize } });
  return data;
}
