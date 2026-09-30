import { create } from 'zustand';

import { secureStorage } from '../storage/secureStorage';
import type { TodayStudyPlanResponse } from '../types/study';
import { MAX_FOCUS_SECONDS } from '../utils/formatTime';

const TIMER_KEY = 'learntime.timer';

interface PersistedTimer {
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
  elapsedSeconds: () => number;
}

const initialTimer: PersistedTimer = {
  studyDailyPlanId: null,
  studyTitle: null,
  planContent: null,
  progressStatus: null,
  isRunning: false,
  startedAt: null,
  accumulatedSeconds: 0,
};

async function persist(state: PersistedTimer): Promise<void> {
  await secureStorage.set(TIMER_KEY, JSON.stringify(state));
}

function snapshot(state: TimerState): PersistedTimer {
  const { studyDailyPlanId, studyTitle, planContent, progressStatus, isRunning, startedAt, accumulatedSeconds } = state;
  return { studyDailyPlanId, studyTitle, planContent, progressStatus, isRunning, startedAt, accumulatedSeconds };
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
      typeof value.isRunning !== 'boolean'
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

export const useTimerStore = create<TimerState>((set, get) => ({
  ...initialTimer,
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await secureStorage.get(TIMER_KEY);
      if (raw) {
        const stored = parsePersistedTimer(raw);
        if (!stored) {
          await secureStorage.remove(TIMER_KEY);
          set({ ...initialTimer, isHydrated: true });
          return;
        }
        set({ ...stored, isHydrated: true });
      }
      else set({ isHydrated: true });
    } catch {
      set({ ...initialTimer, isHydrated: true });
    }
  },

  selectPlan: async (plan) => {
    const next: PersistedTimer = {
      ...initialTimer,
      studyDailyPlanId: plan.studyDailyPlanId,
      studyTitle: plan.studyTitle,
      planContent: plan.planContent,
      progressStatus: plan.progressStatus,
    };
    set(next);
    await persist(next);
  },

  start: async () => {
    if (get().isRunning || get().studyDailyPlanId === null) return;
    const next = { ...snapshot(get()), isRunning: true, startedAt: Date.now() };
    set(next);
    await persist(next);
  },

  pause: async () => {
    const current = get();
    const total = elapsed(current);
    const next = { ...snapshot(current), isRunning: false, startedAt: null, accumulatedSeconds: total };
    set(next);
    await persist(next);
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
    set(next);
    await persist(next);
  },

  elapsedSeconds: () => elapsed(get()),
}));
