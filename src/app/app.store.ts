import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  cycleThemeMode: () => void;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('bp6-dark', resolveIsDark(mode));
}

const themeCycle: ThemeMode[] = ['light', 'dark', 'system'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      setThemeMode: (mode: ThemeMode) => {
        applyTheme(mode);
        set({ themeMode: mode });
      },
      cycleThemeMode: () => {
        const current = get().themeMode;
        const next = themeCycle[(themeCycle.indexOf(current) + 1) % themeCycle.length];
        applyTheme(next);
        set({ themeMode: next });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);

export function useIsDark(): boolean {
  const themeMode = useAppStore((state) => state.themeMode);
  return resolveIsDark(themeMode);
}

// Re-apply theme when OS preference changes (for system mode)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useAppStore.getState().themeMode === 'system') {
    applyTheme('system');
  }
});
