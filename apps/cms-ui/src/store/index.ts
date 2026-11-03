import { create } from 'zustand';
import type { AppState } from '../types/store.types';

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
