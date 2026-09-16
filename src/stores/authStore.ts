import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';

import { config } from '../constants/config';
import { secureStorage } from '../storage/secureStorage';
import type { AccessTokenPayload } from '../types/auth';

const ACCESS_TOKEN_KEY = 'learntime.accessToken';
const EXPIRY_SKEW_MS = 30_000;

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
    if (token.split('.').length !== 3) return null;
    const payload = jwtDecode<AccessTokenPayload>(token);
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

function isExpired(payload: AccessTokenPayload): boolean {
  return payload.exp! * 1000 <= Date.now() + EXPIRY_SKEW_MS;
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
      const token = await secureStorage.get(ACCESS_TOKEN_KEY);
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
        await secureStorage.remove(ACCESS_TOKEN_KEY);
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
    await secureStorage.set(ACCESS_TOKEN_KEY, token);
    set(authenticatedState(token, payload));
  },

  startDemo: async () => {
    if (!config.demoMode) throw new Error('데모 모드는 개발 빌드에서만 사용할 수 있습니다.');
    await secureStorage.set(ACCESS_TOKEN_KEY, 'DEMO');
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
    await secureStorage.remove(ACCESS_TOKEN_KEY);
    set(emptyAuthState);
  },
}));
