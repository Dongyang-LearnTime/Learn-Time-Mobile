import type { ExerciseRequest, ExerciseResponse, WeightRequest, WeightResponse } from '../types/exercise';
import type { CalendarRequest, CalendarResponse } from '../types/calendar';
import type { TodayStudyPlanResponse } from '../types/study';
import type { UserSummaryResponse } from '../types/user';

export const mockUserSummary: UserSummaryResponse = {
  point: 1_280,
  tierName: '자동차',
  nextMinPoint: 2_000,
  badges: [
    { badgeType: 'FIRST_STEP', displayName: '첫걸음', description: '첫 공부 계획 완료', acquiredAt: new Date().toISOString() },
    { badgeType: 'EARLY_BIRD', displayName: '얼리버드', description: '아침 공부 완료', acquiredAt: new Date().toISOString() },
  ],
};

export const mockTodayPlans: TodayStudyPlanResponse[] = [
  {
    studyId: 1,
    studyTitle: '정보처리기사 준비',
    studyDailyPlanId: 101,
    planContent: '데이터베이스 정규화와 트랜잭션 복습',
    progressStatus: 'IN_PROGRESS',
  },
  {
    studyId: 2,
    studyTitle: '알고리즘 스터디',
    studyDailyPlanId: 102,
    planContent: '그래프 탐색 문제 3개 풀이',
    progressStatus: 'NOT_STARTED',
  },
];

let mockWeights: WeightResponse[] = [
  { id: 1, weight: 70.5, bodyFat: 18.2, createdAt: new Date().toISOString() },
];
let mockExercises: ExerciseResponse[] = [];
let mockSchedules: CalendarResponse[] = [
  { calendarRecordId: 1, content: '알고리즘 스터디', targetDate: `${new Date().toISOString().slice(0, 10)}T19:00:00`, isImportant: true, createdAt: new Date().toISOString() },
];

export async function mockDelay(milliseconds = 250): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function addMockWeight(request: WeightRequest): WeightResponse {
  const record: WeightResponse = {
    id: Date.now(),
    ...request,
    createdAt: new Date().toISOString(),
  };
  mockWeights = [record, ...mockWeights];
  return record;
}

export function getMockWeights(): WeightResponse[] {
  return [...mockWeights];
}

export function addMockExercise(request: ExerciseRequest): ExerciseResponse {
  const record = { id: Date.now(), ...request, calories: null, createdAt: new Date().toISOString() };
  mockExercises = [record, ...mockExercises];
  return record;
}

export function getMockExercises(): ExerciseResponse[] { return [...mockExercises]; }

export function getMockSchedules(year: number, month: number): CalendarResponse[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return mockSchedules.filter((item) => item.targetDate.startsWith(prefix));
}

export function addMockSchedule(request: CalendarRequest): CalendarResponse {
  const record = { calendarRecordId: Date.now(), ...request, createdAt: new Date().toISOString() };
  mockSchedules = [...mockSchedules, record];
  return record;
}

export function removeMockSchedule(id: number): void {
  mockSchedules = mockSchedules.filter((item) => item.calendarRecordId !== id);
}
