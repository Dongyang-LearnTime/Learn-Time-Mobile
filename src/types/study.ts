export interface TodayStudyPlanResponse {
  studyId: number;
  studyTitle: string;
  studyDailyPlanId: number;
  planContent: string;
  progressStatus: string;
}

export interface FocusTimeRequest {
  studyDailyPlanId: number;
  focusTime: string;
}

export interface PersonalFocusRecordRequest {
  focusSeconds: number;
}

export interface PersonalFocusRecordResponse extends PersonalFocusRecordRequest {
  personalFocusRecordId: number;
  createdAt: string;
}
