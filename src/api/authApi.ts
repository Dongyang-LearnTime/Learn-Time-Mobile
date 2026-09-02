import { apiClient } from './client';
import { config } from '../constants/config';
import { mockDelay } from './mockData';
import type { LoginRequest, TokenResponse } from '../types/auth';

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/api/auth/login', request);
  return data;
}

export async function logout(): Promise<void> {
  if (config.demoMode) {
    await mockDelay();
    return;
  }
  await apiClient.post('/api/auth/logout');
}
