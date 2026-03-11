import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'padrao' | 'amor' | 'claro';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_CLASSES: Record<Theme, string> = {
  padrao: '',
  amor: 'theme-amor',
  claro: 'theme-claro',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'amor' || saved === 'claro') return saved;
    return 'padrao';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = document.documentElement;
    // Remove all theme classes
    Object.values(THEME_CLASSES).forEach(cls => {
      if (cls) root.classList.remove(cls);
    });
    // Add current theme class
    const cls = THEME_CLASSES[theme];
    if (cls) root.classList.add(cls);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () =>
    setThemeState(prev => {
      if (prev === 'padrao') return 'claro';
      if (prev === 'claro') return 'amor';
      return 'padrao';
    });

  const isDark = theme !== 'claro';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
