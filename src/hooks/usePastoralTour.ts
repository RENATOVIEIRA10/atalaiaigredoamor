import { useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'atalaia-pastoral-tour-done';

export function usePastoralTour() {
  const [isOpen, setIsOpen] = useState(false);

  // On mount, check if tour was completed
  useEffect(() => {
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
      // Small delay so dashboard renders first
      const t = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const openTour = useCallback(() => setIsOpen(true), []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  return { isOpen, openTour, closeTour, resetTour };
}
