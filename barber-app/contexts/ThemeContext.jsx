import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  dark: false,
  colors: {
    primary: '#6A1B9A',       // Brand Yellow
    secondary: '#03dac6',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#000000',
    border: '#c7c7c7',
    notification: '#ff3b30',
    textSecondary: '#666666',
    success: '#00C853',       // Emerald Green
    warning: '#ffc107',
    error: '#dc3545',
    iconBackground: '#F3E5F5',
  },
};

const darkTheme = {
  dark: true,
  colors: {
    primary: '#6A1B9A',       // <--- FIXED: Kept Yellow (Matches Light Mode)
    secondary: '#03dac6',
    background: '#121212',    // True Black
    card: '#1e1e1e',          // Dark Grey for cards
    text: '#E0E0E0',          // <--- FIXED: Off-white (Easier on eyes than #ffffff)
    border: '#333333',        // Subtle border
    notification: '#ff453a',
    textSecondary: '#A0A0A0', // Lighter grey for dark mode subtitles
    success: '#00E676',       // <--- FIXED: Neon Green (Visible on Black)
    warning: '#FFD600',       // Brighter Yellow/Orange for warnings
    error: '#CF6679',         // <--- FIXED: Soft Red (Standard Red vibrates on black backgrounds)
    iconBackground: '#F3E5F5',
  },
};

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        // User has a saved preference
        setIsDark(savedTheme === 'dark');
      } else {
        // No saved preference, use system theme
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system theme
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const changeTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    // Save preference to AsyncStorage
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

