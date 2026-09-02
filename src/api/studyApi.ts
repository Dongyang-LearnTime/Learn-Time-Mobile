import { apiClient } from './client';
import { config } from '../constants/config';
import type { FocusTimeRequest, TodayStudyPlanResponse } from '../types/study';
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
  if (config.demoMode) {
    await mockDelay(400);
    return;
  }
  await apiClient.patch('/api/study/daily/focus-time', request);
}
