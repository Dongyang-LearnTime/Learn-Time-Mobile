import { create } from 'zustand';
import { secureStorage } from '../storage/secureStorage';

export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'learntime.theme';

interface ThemeState {
  mode: ThemeMode;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  isHydrating: true,
  hydrate: async () => {
    try {
      const saved = await secureStorage.get(STORAGE_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') set({ mode: saved });
    } catch {
      // Use the device theme if preferences cannot be read.
    } finally {
      set({ isHydrating: false });
    }
  },
  setMode: async (mode) => {
    await secureStorage.set(STORAGE_KEY, mode);
    set({ mode });
  },
}));
