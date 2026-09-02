import { apiClient } from './client';
import { config } from '../constants/config';
import type { UserSummaryResponse } from '../types/user';
import { mockDelay, mockUserSummary } from './mockData';

export async function getUserSummary(): Promise<UserSummaryResponse> {
  if (config.demoMode) {
    await mockDelay();
    return mockUserSummary;
  }
  const { data } = await apiClient.get<UserSummaryResponse>('/api/user/summary');
  return data;
}
