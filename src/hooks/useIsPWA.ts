import { useState, useEffect } from 'react';

/**
 * Detects if the app is running as an installed PWA (standalone mode).
 * Returns true ONLY when:
 * - display-mode is standalone (Android / desktop PWA)
 * - OR navigator.standalone is true (iOS Safari "Add to Home Screen")
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isPWA;
}
