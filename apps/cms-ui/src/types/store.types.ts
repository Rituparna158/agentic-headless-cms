export type ThemeMode = 'light' | 'dark';

export interface AppState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}
