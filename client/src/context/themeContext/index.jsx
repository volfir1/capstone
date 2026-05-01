import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const THEME_MODE_KEY = 'sola-theme-mode';

const ThemeModeContext = createContext(null);

const getInitialThemeMode = () => {
  if (typeof window === 'undefined') return 'light';

  const storedMode = window.localStorage.getItem(THEME_MODE_KEY);
  if (storedMode === 'light' || storedMode === 'dark') return storedMode;

  return 'light';
};

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialThemeMode);

  const setThemeMode = useCallback((nextMode) => {
    if (nextMode !== 'light' && nextMode !== 'dark') return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_MODE_KEY, nextMode);
    }
    setMode(nextMode);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_MODE_KEY, nextMode);
      }
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, isDarkMode: mode === 'dark', setThemeMode, toggleThemeMode }),
    [mode, setThemeMode, toggleThemeMode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return context;
}
