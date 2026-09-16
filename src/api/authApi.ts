import { apiClient } from './client';
import { config } from '../constants/config';
import { mockDelay } from './mockData';
import type { LoginRequest, TokenResponse } from '../types/auth';

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/api/auth/login', request);
  if (!data || typeof data.accessToken !== 'string' || data.accessToken.length === 0) {
    throw new Error('서버가 유효하지 않은 인증 토큰을 반환했습니다.');
  }
  return data;
}

export async function logout(): Promise<void> {
  if (config.demoMode) {
    await mockDelay();
    return;
  }
  await apiClient.post('/api/auth/logout');
}
