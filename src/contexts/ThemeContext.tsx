// ThemeContext – theme switcher persisted in localStorage
import { useEffect, useState } from 'react';
import { ThemeContext } from '@/contexts/theme-context';
import type { ResolvedTheme, Theme } from '@/contexts/theme-context';

const getSystemPreference = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [forcedTheme, setForcedTheme] = useState<ResolvedTheme | null>(null);
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (
        savedTheme === 'light'
        || savedTheme === 'dark'
        || savedTheme === 'purple'
        || savedTheme === 'system'
      ) {
        return savedTheme;
      }
      return 'light';
    } catch {
      return 'light';
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => getSystemPreference());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
  const activeTheme = forcedTheme ?? resolvedTheme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', activeTheme === 'dark' || activeTheme === 'purple');
    root.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* noop */
    }
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, setForcedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
