export interface TodayStudyPlanResponse {
  studyId: number;
  studyTitle: string;
  studyDailyPlanId: number;
  planContent: string;
  progressStatus: ProgressStatus;
}

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type CompletionStatus = 'SUCCESS' | 'FAILURE';

export interface StudyDailyPlanResponse {
  studyDailyPlanId: number;
  dayNumber: number;
  planDate: string;
  planContent: string;
}

export interface StudyProgressIndicatorResponse {
  studyId: number;
  studyTitle: string;
  hasTodayPlan: boolean;
}

export interface StudyTotalInfoResponse {
  studyCompletionRate: number;
  studySuccessRate: number;
  quizCorrectRate: number | null;
  totalFocusedTime: number | null;
}

export interface PlanCompleteRequest {
  studyDailyPlanId: number;
  completionStatus: CompletionStatus;
  understandingScore: number;
}

export interface FocusTimeRequest {
  studyDailyPlanId: number;
  focusTime: string;
}
