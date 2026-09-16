import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';
import type { TokenResponse } from '../types/auth';

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const authClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = authClient
      .post<TokenResponse>('/api/auth/refresh')
      .then(async ({ data }) => {
        await useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((request) => {
  const token = useAuthStore.getState().accessToken;
  if (token && token !== 'DEMO') request.headers.Authorization = `Bearer ${token}`;
  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config as RetryableRequest | undefined;
    const isAuthRequest = request?.url?.startsWith('/api/auth/') ?? false;

    if (!request || request._retry || isAuthRequest || !useAuthStore.getState().accessToken) {
      await useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return apiClient(request);
    } catch (refreshError) {
      await useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError instanceof AxiosError ? refreshError : error);
    }
  },
);
