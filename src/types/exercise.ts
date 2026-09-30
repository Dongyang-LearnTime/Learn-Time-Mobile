export interface WeightRequest {
  weight: number;
  bodyFat: number;
}

export interface WeightResponse {
  id: number;
  weight: number;
  bodyFat: number;
  createdAt: string;
}

export interface ExerciseRequest {
  bodyParts: string[];
  duration: number;
  content: string;
  weight: number | null;
}

export interface ExerciseResponse extends ExerciseRequest {
  id: number;
  calories: number | null;
  createdAt: string;
}

export interface WeeklyWeightStatResponse {
  date: string;
  dailyTotalWeight: number;
}
