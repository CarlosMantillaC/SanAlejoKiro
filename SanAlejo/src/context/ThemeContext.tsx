import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, resolveTheme } from '../theme';

const ThemeContext = createContext<Theme | undefined>(undefined);

/** Provides the active theme to all descendant components. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = resolveTheme(colorScheme);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the active theme from any component.
 * Must be used inside the ThemeProvider tree.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === undefined) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return theme;
}
