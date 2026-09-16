import { apiClient } from './client';
import { config } from '../constants/config';
import type { ExerciseRequest, ExerciseResponse, WeightRequest, WeightResponse } from '../types/exercise';
import { addMockExercise, addMockWeight, getMockExercises, getMockWeights, mockDelay } from './mockData';

export async function saveExercise(request: ExerciseRequest): Promise<ExerciseResponse> {
  if (!request || !Array.isArray(request.bodyParts) || request.bodyParts.length === 0 || request.bodyParts.length > 7
    || request.bodyParts.some((part) => typeof part !== 'string' || part.length > 30)
    || !Number.isInteger(request.duration) || request.duration <= 0 || request.duration > 1440
    || typeof request.content !== 'string' || request.content.length > 1000
    || (request.weight !== null && (!Number.isFinite(request.weight) || request.weight < 0 || request.weight > 1000))) {
    throw new Error('유효하지 않은 운동 기록입니다.');
  }
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
  if (!request || !Number.isFinite(request.weight) || request.weight <= 0 || request.weight > 500
    || !Number.isFinite(request.bodyFat) || request.bodyFat < 0 || request.bodyFat > 100) {
    throw new Error('유효하지 않은 신체 기록입니다.');
  }
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
