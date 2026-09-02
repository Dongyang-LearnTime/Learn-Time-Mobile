import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { config } from '../constants/config';
import type { AccessTokenPayload } from '../types/auth';

const ACCESS_TOKEN_KEY = 'learntime.accessToken';

const tokenStorage = {
  get: () => Platform.OS === 'web'
    ? AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    : SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  set: (value: string) => Platform.OS === 'web'
    ? AsyncStorage.setItem(ACCESS_TOKEN_KEY, value)
    : SecureStore.setItemAsync(ACCESS_TOKEN_KEY, value),
  remove: () => Platform.OS === 'web'
    ? AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
    : SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
};

interface AuthState {
  accessToken: string | null;
  userId: number | null;
  userName: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  startDemo: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

function parseToken(token: string): AccessTokenPayload | null {
  try {
    return jwtDecode<AccessTokenPayload>(token);
  } catch {
    return null;
  }
}

function isExpired(payload: AccessTokenPayload): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
}

function authenticatedState(token: string, payload: AccessTokenPayload) {
  return {
    accessToken: token,
    userId: payload.userId ?? null,
    userName: payload.name ?? null,
    email: payload.sub ?? null,
    role: payload.role ?? null,
    isAuthenticated: true,
  };
}

const emptyAuthState = {
  accessToken: null,
  userId: null,
  userName: null,
  email: null,
  role: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...emptyAuthState,
  isHydrating: true,

  hydrate: async () => {
    try {
      const token = await tokenStorage.get();
      if (!token) {
        set({ ...emptyAuthState, isHydrating: false });
        return;
      }

      if (token === 'DEMO' && config.demoMode) {
        set({
          accessToken: 'DEMO',
          userId: 1,
          userName: '데모 사용자',
          email: 'demo@learn-time.kr',
          role: 'ROLE_USER',
          isAuthenticated: true,
          isHydrating: false,
        });
        return;
      }

      const payload = parseToken(token);
      if (!payload || isExpired(payload)) {
        await tokenStorage.remove();
        set({ ...emptyAuthState, isHydrating: false });
        return;
      }

      set({ ...authenticatedState(token, payload), isHydrating: false });
    } catch {
      set({ ...emptyAuthState, isHydrating: false });
    }
  },

  setAccessToken: async (token) => {
    const payload = parseToken(token);
    if (!payload || isExpired(payload)) {
      throw new Error('유효하지 않거나 만료된 토큰입니다.');
    }
    await tokenStorage.set(token);
    set(authenticatedState(token, payload));
  },

  startDemo: async () => {
    await tokenStorage.set('DEMO');
    set({
      accessToken: 'DEMO',
      userId: 1,
      userName: '데모 사용자',
      email: 'demo@learn-time.kr',
      role: 'ROLE_USER',
      isAuthenticated: true,
    });
  },

  clearAuth: async () => {
    await tokenStorage.remove();
    set(emptyAuthState);
  },
}));
