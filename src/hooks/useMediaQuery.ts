// Hook para detectar breakpoints responsivos
import { useSyncExternalStore } from 'react';

const getMatch = (query: string) => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(query).matches;
};

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const media = window.matchMedia(query);
      const listener = () => callback();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    },
    () => getMatch(query),
    () => false
  );
}

// Hook específico para mobile
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

