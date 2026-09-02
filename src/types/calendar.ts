export interface CalendarRequest {
  content: string;
  targetDate: string;
  isImportant: boolean;
}

export interface CalendarResponse extends CalendarRequest {
  calendarRecordId: number;
  createdAt: string;
}
