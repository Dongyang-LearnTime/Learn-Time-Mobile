import axios, { type InternalAxiosRequestConfig } from 'axios';

import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';
import type { TokenResponse } from '../types/auth';

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number };
const options = {
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
};
const authClient = axios.create(options);
export const apiClient = axios.create(options);
let refreshRequest: { sessionVersion: number; promise: Promise<string> } | null = null;

function sessionChanged() { return new Error('로그인 세션이 변경되었습니다.'); }

async function refreshAccessToken(sessionVersion: number): Promise<string> {
  if (refreshRequest?.sessionVersion === sessionVersion) return refreshRequest.promise;
  const promise = authClient.post<TokenResponse>('/api/auth/refresh').then(async ({ data }) => {
    await useAuthStore.getState().setAccessToken(data.accessToken, sessionVersion);
    return data.accessToken;
  });
  refreshRequest = { sessionVersion, promise };
  try { return await promise; }
  finally { if (refreshRequest?.promise === promise) refreshRequest = null; }
}

apiClient.interceptors.request.use((request: RetryableRequest) => {
  if (!config.apiBaseUrl || request.baseURL !== config.apiBaseUrl || !request.url?.startsWith('/api/')) {
    throw new Error('유효한 API 서버 주소가 필요합니다.');
  }
  const state = useAuthStore.getState();
  if (request._sessionVersion !== undefined && request._sessionVersion !== state.sessionVersion) throw sessionChanged();
  request._sessionVersion = state.sessionVersion;
  const isPublicAuth = request.url === '/api/auth/login' || request.url === '/api/auth/refresh';
  if (state.accessToken && state.accessToken !== 'DEMO' && !isPublicAuth) {
    request.headers.Authorization = `Bearer ${state.accessToken}`;
  } else request.headers.delete('Authorization');
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    const request = response.config as RetryableRequest;
    if (request._sessionVersion !== useAuthStore.getState().sessionVersion) throw sessionChanged();
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error);
    const request = error.config as RetryableRequest | undefined;
    const state = useAuthStore.getState();
    // Responses belonging to a previous account must not refresh or clear the new session.
    if (!request || request._sessionVersion !== state.sessionVersion) return Promise.reject(error);
    if (request.url?.startsWith('/api/auth/')) return Promise.reject(error);
    if (request._retry || !state.accessToken || state.accessToken === 'DEMO') {
      await state.clearAuth().catch(() => undefined);
      return Promise.reject(error);
    }
    request._retry = true;
    const version = state.sessionVersion;
    try {
      // A parallel 401 may arrive after another request already refreshed the token.
      const token = request.headers.Authorization !== `Bearer ${state.accessToken}`
        ? state.accessToken : await refreshAccessToken(version);
      if (useAuthStore.getState().sessionVersion !== version) throw sessionChanged();
      request.headers.Authorization = `Bearer ${token}`;
      return apiClient(request);
    } catch (refreshError) {
      if (useAuthStore.getState().sessionVersion === version) {
        await useAuthStore.getState().clearAuth().catch(() => undefined);
      }
      return Promise.reject(refreshError);
    }
  },
);
