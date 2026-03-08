import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'atalaia-pastoral-tour-done';

interface PastoralTourContextValue {
  isOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
  resetTour: () => void;
}

export const PastoralTourContext = createContext<PastoralTourContextValue>({
  isOpen: false,
  openTour: () => {},
  closeTour: () => {},
  resetTour: () => {},
});

export function usePastoralTourProvider() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
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

export function usePastoralTour() {
  return useContext(PastoralTourContext);
}
