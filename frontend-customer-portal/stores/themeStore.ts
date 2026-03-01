import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeColor = 'zinc' | 'blue' | 'green' | 'violet' | 'rose' | 'orange' | 'amber' | 'teal';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  color: ThemeColor;
  mode: ThemeMode;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      color: 'zinc',
      mode: 'system',
      setColor: (color) => set({ color }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const themeColors: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'zinc', label: 'Zinc', color: 'bg-zinc-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'violet', label: 'Violet', color: 'bg-violet-500' },
  { value: 'rose', label: 'Rose', color: 'bg-rose-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-500' },
  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
];
