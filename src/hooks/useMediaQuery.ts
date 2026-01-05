// Hook para detectar breakpoints responsivos
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Verifica o estado inicial
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Cria listener
    const listener = () => setMatches(media.matches);
    
    // Adiciona listener
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Hook específico para mobile
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}



