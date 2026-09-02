import axios from 'axios';

import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);
