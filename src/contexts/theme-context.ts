import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'purple' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'purple';

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  setForcedTheme: (theme: ResolvedTheme | null) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
