import { apiClient } from './client';
import { config } from '../constants/config';
import type { CalendarRequest, CalendarResponse } from '../types/calendar';
import { addMockSchedule, getMockSchedules, mockDelay, removeMockSchedule } from './mockData';

export async function getMonthlySchedules(year: number, month: number): Promise<CalendarResponse[]> {
  if (config.demoMode) { await mockDelay(); return getMockSchedules(year, month); }
  const { data } = await apiClient.get<CalendarResponse[]>('/api/user/calendar', { params: { year, month } });
  return data;
}

export async function createSchedule(request: CalendarRequest): Promise<CalendarResponse> {
  if (config.demoMode) { await mockDelay(300); return addMockSchedule(request); }
  const { data } = await apiClient.post<CalendarResponse>('/api/user/calendar', request);
  return data;
}

export async function deleteSchedule(id: number): Promise<void> {
  if (config.demoMode) { await mockDelay(200); removeMockSchedule(id); return; }
  await apiClient.delete(`/api/user/calendar/${id}`);
}
