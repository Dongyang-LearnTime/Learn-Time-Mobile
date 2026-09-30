import { create } from 'zustand';

import { secureStorage } from '../storage/secureStorage';
import type { TodayStudyPlanResponse } from '../types/study';
import { MAX_FOCUS_SECONDS } from '../utils/formatTime';
import { useAuthStore } from './authStore';

const TIMER_KEY = 'learntime.timer';

interface PersistedTimer {
  ownerId: number | null;
  studyDailyPlanId: number | null;
  studyTitle: string | null;
  planContent: string | null;
  progressStatus: string | null;
  isRunning: boolean;
  startedAt: number | null;
  accumulatedSeconds: number;
}

interface TimerState extends PersistedTimer {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  selectPlan: (plan: TodayStudyPlanResponse) => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<number>;
  reset: () => Promise<void>;
  clear: () => Promise<void>;
  elapsedSeconds: () => number;
}

const initialTimer: PersistedTimer = {
  ownerId: null,
  studyDailyPlanId: null,
  studyTitle: null,
  planContent: null,
  progressStatus: null,
  isRunning: false,
  startedAt: null,
  accumulatedSeconds: 0,
};

function snapshot(state: TimerState): PersistedTimer {
  const { ownerId, studyDailyPlanId, studyTitle, planContent, progressStatus, isRunning, startedAt, accumulatedSeconds } = state;
  return { ownerId, studyDailyPlanId, studyTitle, planContent, progressStatus, isRunning, startedAt, accumulatedSeconds };
}

function elapsed(state: PersistedTimer): number {
  const additionalSeconds = state.isRunning && state.startedAt !== null
    ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
    : 0;
  return Math.min(state.accumulatedSeconds + additionalSeconds, MAX_FOCUS_SECONDS);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parsePersistedTimer(raw: string): PersistedTimer | null {
  try {
    const value = JSON.parse(raw) as Partial<PersistedTimer>;
    const hasValidPlanId = value.studyDailyPlanId === null
      || (Number.isInteger(value.studyDailyPlanId) && value.studyDailyPlanId! > 0);
    const hasValidStartedAt = value.startedAt === null
      || (typeof value.startedAt === 'number' && Number.isFinite(value.startedAt) && value.startedAt <= Date.now());
    const hasValidSeconds = typeof value.accumulatedSeconds === 'number'
      && Number.isInteger(value.accumulatedSeconds)
      && value.accumulatedSeconds >= 0
      && value.accumulatedSeconds <= MAX_FOCUS_SECONDS;

    if (
      !Number.isSafeInteger(value.ownerId) || value.ownerId! <= 0
      || typeof value.isRunning !== 'boolean'
      || !hasValidPlanId
      || !hasValidStartedAt
      || !hasValidSeconds
      || !isNullableString(value.studyTitle)
      || !isNullableString(value.planContent)
      || !isNullableString(value.progressStatus)
    ) return null;

    if (value.studyDailyPlanId === null) return null;
    if (value.isRunning !== (value.startedAt !== null)) return null;
    return value as PersistedTimer;
  } catch {
    return null;
  }
}

export const useTimerStore = create<TimerState>((set, get) => {
  const commit = async (next: PersistedTimer) => {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || !auth.userId) throw new Error('로그인이 필요합니다.');
    await secureStorage.set(TIMER_KEY, JSON.stringify({ ...next, ownerId: auth.userId }));
    if (useAuthStore.getState().sessionVersion !== auth.sessionVersion
      || useAuthStore.getState().userId !== auth.userId) throw new Error('로그인 세션이 변경되었습니다.');
    set({ ...next, ownerId: auth.userId });
  };
  return {
  ...initialTimer,
  isHydrated: false,

  hydrate: async () => {
    const auth = useAuthStore.getState();
    try {
      const raw = await secureStorage.get(TIMER_KEY);
      if (useAuthStore.getState().sessionVersion !== auth.sessionVersion) return;
      if (raw) {
        const stored = parsePersistedTimer(raw);
        if (!stored || !auth.isAuthenticated || stored.ownerId !== auth.userId) {
          await secureStorage.remove(TIMER_KEY);
          if (useAuthStore.getState().sessionVersion !== auth.sessionVersion) return;
          set({ ...initialTimer, isHydrated: true });
          return;
        }
        set({ ...stored, isHydrated: true });
      }
      else set({ isHydrated: true });
    } catch {
      if (useAuthStore.getState().sessionVersion === auth.sessionVersion) set({ ...initialTimer, isHydrated: true });
    }
  },

  selectPlan: async (plan) => {
    const current = get();
    const preserve = current.studyDailyPlanId === plan.studyDailyPlanId
      && current.ownerId === useAuthStore.getState().userId;
    const next: PersistedTimer = {
      ...(preserve ? snapshot(current) : initialTimer),
      studyDailyPlanId: plan.studyDailyPlanId,
      studyTitle: plan.studyTitle,
      planContent: plan.planContent,
      progressStatus: plan.progressStatus,
    };
    if (plan.progressStatus === 'COMPLETED') {
      next.accumulatedSeconds = preserve ? elapsed(current) : 0;
      next.isRunning = false; next.startedAt = null;
    }
    await commit(next);
  },

  start: async () => {
    if (get().isRunning || get().studyDailyPlanId === null || get().progressStatus === 'COMPLETED') return;
    const next = { ...snapshot(get()), isRunning: true, startedAt: Date.now() };
    await commit(next);
  },

  pause: async () => {
    const current = get();
    const total = elapsed(current);
    const next = { ...snapshot(current), isRunning: false, startedAt: null, accumulatedSeconds: total };
    await commit(next);
    return total;
  },

  reset: async () => {
    const current = get();
    const next: PersistedTimer = {
      ...initialTimer,
      studyDailyPlanId: current.studyDailyPlanId,
      studyTitle: current.studyTitle,
      planContent: current.planContent,
      progressStatus: current.progressStatus,
    };
    await commit(next);
  },

  clear: async () => {
    set({ ...initialTimer, isHydrated: true });
    await secureStorage.remove(TIMER_KEY);
  },

  elapsedSeconds: () => elapsed(get()),
  };
});

useAuthStore.subscribe((next, previous) => {
  if (previous.isAuthenticated && (!next.isAuthenticated || next.userId !== previous.userId)) {
    void useTimerStore.getState().clear().catch(() => undefined);
  }
});
