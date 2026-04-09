import React, { createContext, useState, useContext } from 'react';

import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';

const lightTheme = {
  dark: false,
  colors: {
    primary: Colors.LIME_PRIMARY,
    background: Colors.BG_PAGE,
    card: Colors.BG_CARD,
    text: Colors.TEXT_PRIMARY,
    textSecondary: Colors.TEXT_SECONDARY,
    border: Colors.BORDER_LIGHT,
    notification: Colors.DANGER,
    success: Colors.SUCCESS,
    warning: Colors.LIME_DEEP, // Using deep lime for warning contrast
    error: Colors.DANGER,
    
    // Paytin Specific
    limePrimary: Colors.LIME_PRIMARY,
    limeDark: Colors.LIME_DARK,
    limeMuted: Colors.LIME_MUTED,
    limeDeep: Colors.LIME_DEEP,
    charcoal: Colors.CHARCOAL,
    charcoalSoft: Colors.CHARCOAL_SOFT,
    charcoalMuted: Colors.CHARCOAL_MUTED,
    textOnLime: Colors.TEXT_ON_LIME,
    textOnDark: Colors.TEXT_ON_DARK,
    limeOnDark: Colors.LIME_ON_DARK,
    headerBg: Colors.BG_HERO,
    badgeBg: Colors.LIME_MUTED,
    hover: '#E4F2E4', // Fallback for now
  },
  typography: Typography,
  spacing: {
    horizontal: 20,
    cardGap: 12,
    sectionTop: 24,
    internal: 14,
  },
  radius: {
    small: 14, // Adjusted to Paytin style
    medium: 18,
    large: 24,
    full: 28,
  }
};

const darkTheme = {
  dark: true,
  colors: {
    primary: '#bb86fc',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#272727',
    notification: '#ff453a',
    textSecondary: '#adb5bd',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545', // Added error color
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

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
