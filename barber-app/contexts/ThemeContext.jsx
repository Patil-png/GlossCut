import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

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

export const ThemeProvider = ({ children }) => {
  // Automatically detect system theme preference
  const [isDark, setIsDark] = useState(() => {
    const systemTheme = Appearance.getColorScheme();
    return systemTheme === 'dark';
  });

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const changeTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
