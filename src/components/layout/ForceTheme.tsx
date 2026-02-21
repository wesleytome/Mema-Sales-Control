import { useEffect } from 'react';
import { useTheme } from '@/contexts/useTheme';
import type { ResolvedTheme } from '@/contexts/theme-context';

interface ForceThemeProps {
  theme: ResolvedTheme;
  children: React.ReactNode;
}

export function ForceTheme({ theme, children }: ForceThemeProps) {
  const { setForcedTheme } = useTheme();

  useEffect(() => {
    setForcedTheme(theme);
    return () => setForcedTheme(null);
  }, [setForcedTheme, theme]);

  return <>{children}</>;
}
