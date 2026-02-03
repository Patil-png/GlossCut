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

// Dark theme is now identical to light theme as per user request to enforce light mode always.
const darkTheme = lightTheme;

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always false for Light Mode
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // We no longer load preference or system theme to enforce Light Mode
  useEffect(() => {
    // loadThemePreference(); // Disabled
  }, []);

  const theme = lightTheme; // Always use light theme

  const changeTheme = async () => {
    // Disabled switching
    console.log("Theme switching is disabled.");
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

