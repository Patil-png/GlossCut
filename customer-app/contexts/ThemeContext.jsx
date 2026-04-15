import React, { createContext, useState, useContext } from 'react';

import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import { Layout } from '../src/theme/layout';

const lightTheme = {
  dark: false,
  colors: {
    primary: Colors.CTA_BUTTON,
    accent: Colors.ACCENT_PROGRESS,
    background: Colors.BG_PAGE,
    card: Colors.BG_CARD,
    text: Colors.TEXT_PRIMARY,
    textSecondary: Colors.TEXT_SECONDARY,
    border: Colors.BORDER_CARD,
    notification: Colors.DANGER,
    success: Colors.SUCCESS,
    warning: Colors.TEXT_MUTED,
    error: Colors.DANGER,

    limePrimary: Colors.ACCENT_PROGRESS,
    limeDark: Colors.CTA_PRESSED,
    limeMuted: Colors.BG_TAG,
    limeDeep: Colors.TEXT_SECONDARY,
    charcoal: Colors.CTA_BUTTON,
    charcoalSoft: Colors.CTA_PRESSED,
    charcoalMuted: Colors.TEXT_SECONDARY,
    textOnLime: Colors.TEXT_PRIMARY,
    textOnDark: Colors.TEXT_ON_DARK,
    limeOnDark: Colors.TEXT_ON_DARK,
    headerBg: Colors.BG_PAGE,
    badgeBg: Colors.BG_TAG,
    hover: Colors.BG_HOVER,
    navBackground: Colors.NAV_BG,
    inputBorder: Colors.BORDER_INPUT,
    divider: Colors.DIVIDER,
    /** Legacy SearchScreen list heading */
    greenDark: Colors.TEXT_PRIMARY,
  },
  typography: Typography,
  spacing: {
    horizontal: Layout.screenPadding,
    cardGap: Layout.cardGap,
    sectionTop: Layout.sectionGap,
    internal: Layout.cardPadding,
  },
  radius: {
    small: Layout.radiusTag,
    medium: Layout.radiusInput,
    large: Layout.radiusCard,
    full: Layout.radiusSheet,
  },
  layout: Layout,
};

const darkTheme = {
  dark: true,
  colors: {
    primary: Colors.CTA_BUTTON,
    accent: Colors.ACCENT_PROGRESS,
    background: Colors.DEEP_BLACK,
    card: '#1E1E1E',
    text: Colors.TEXT_ON_DARK,
    border: '#2A2A2A',
    notification: '#FF4444',
    textSecondary: '#A0A09A',
    success: '#606058',
    warning: '#A0A09A',
    error: '#FF4444',
    greenDark: '#FFFFFF',
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
