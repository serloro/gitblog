import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: typeof MD3LightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    primaryContainer: '#dbeafe',
    secondary: '#64748b',
    secondaryContainer: '#f1f5f9',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#f8fafc',
    onBackground: '#1e293b',
    onSurface: '#1e293b',
    onSurfaceVariant: '#64748b',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60a5fa',
    primaryContainer: '#1e40af',
    secondary: '#94a3b8',
    secondaryContainer: '#475569',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    background: '#0f172a',
    onBackground: '#e2e8f0',
    onSurface: '#e2e8f0',
    onSurfaceVariant: '#cbd5e1',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}