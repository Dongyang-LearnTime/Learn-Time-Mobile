import { apiClient } from './client';
import { config } from '../constants/config';
import type { CalendarRequest, CalendarResponse } from '../types/calendar';
import { addMockSchedule, getMockSchedules, mockDelay, removeMockSchedule } from './mockData';

export async function getMonthlySchedules(year: number, month: number): Promise<CalendarResponse[]> {
  if (!Number.isInteger(year) || year < 1970 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('유효하지 않은 달력 조회 범위입니다.');
  }
  if (config.demoMode) { await mockDelay(); return getMockSchedules(year, month); }
  const { data } = await apiClient.get<CalendarResponse[]>('/api/user/calendar', { params: { year, month } });
  return data;
}

export async function createSchedule(request: CalendarRequest): Promise<CalendarResponse> {
  if (!request || typeof request.content !== 'string' || request.content.trim().length === 0 || request.content.length > 200
    || typeof request.targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(request.targetDate)
    || typeof request.isImportant !== 'boolean') {
    throw new Error('유효하지 않은 일정 정보입니다.');
  }
  if (config.demoMode) { await mockDelay(300); return addMockSchedule(request); }
  const { data } = await apiClient.post<CalendarResponse>('/api/user/calendar', request);
  return data;
}

export async function deleteSchedule(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) throw new Error('유효하지 않은 일정입니다.');
  if (config.demoMode) { await mockDelay(200); removeMockSchedule(id); return; }
  await apiClient.delete(`/api/user/calendar/${id}`);
}
