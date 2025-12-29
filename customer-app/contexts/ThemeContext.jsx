import React, { createContext, useState, useContext } from 'react';

const lightTheme = {
  dark: false,
  colors: {
    primary: '#6200ee',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#000000',
    border: '#c7c7c7',
    notification: '#ff3b30',
    textSecondary: '#000000',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545', // Added error color
  },
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
