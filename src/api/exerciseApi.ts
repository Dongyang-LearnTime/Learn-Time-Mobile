import { apiClient } from './client';
import { config } from '../constants/config';
import type { ExerciseRequest, ExerciseResponse, WeightRequest, WeightResponse } from '../types/exercise';
import { addMockExercise, addMockWeight, getMockExercises, getMockWeights, mockDelay } from './mockData';

export async function saveExercise(request: ExerciseRequest): Promise<ExerciseResponse> {
  if (config.demoMode) { await mockDelay(400); return addMockExercise(request); }
  const { data } = await apiClient.post<ExerciseResponse>('/api/exercise/save', request);
  return data;
}

export async function getExercises(): Promise<ExerciseResponse[]> {
  if (config.demoMode) { await mockDelay(); return getMockExercises(); }
  const { data } = await apiClient.get<ExerciseResponse[]>('/api/exercise');
  return data;
}

export async function saveWeight(request: WeightRequest): Promise<WeightResponse> {
  if (config.demoMode) {
    await mockDelay(400);
    return addMockWeight(request);
  }
  const { data } = await apiClient.post<WeightResponse>('/api/exercise/weight/save', request);
  return data;
}

export async function getRecentWeights(): Promise<WeightResponse[]> {
  if (config.demoMode) {
    await mockDelay();
    return getMockWeights();
  }
  const { data } = await apiClient.get<WeightResponse[]>('/api/exercise/weight');
  return data;
}
