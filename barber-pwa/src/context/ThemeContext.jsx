import React, { createContext, useState, useContext, useEffect } from 'react';

// Replicating the exact theme object from the mobile app
// Note: The comment in native app said "Brand Yellow" but code had purple.
// However, the visual app uses Gold/Yellow standard.
// usage in HomeScreen.jsx suggests: primary is used for some icons, but hardcoded gold is used for others.
// We will use the object EXACTLY as provided to ensure "same colour template" as requested,
// but we might need to override if it looks wrong compared to the "Gold" aesthetic we built.
// Actually, looking at the native code:
// primary: '#6A1B9A' -> This is purple.
// But the app is "GlossCut" (implies Gold/Black/Premium).
// In HomeScreen.jsx line 36: `import { useTheme } from "../contexts/ThemeContext.jsx";`
// In HomeScreen.jsx line 103: `color={theme.colors.primary}`
// In HomeScreen.jsx line 724: `backgroundColor: isDark ? theme.colors.primary : '#FFC107'`
// Wait, if `isDark` is false (default), it uses `#FFC107` (Yellow).
// If `isDark` is true, it uses `theme.colors.primary` (#6A1B9A).
// But `isDark` is hardcoded to `false` in the Context!
// So effectively `theme.colors.primary` is rarely used for background if the logic prefers the hardcoded '#FFC107'.
// However, `ActivityItem` uses `color={theme.colors.primary}`.
// Let's stick to the code provided.

const lightTheme = {
    dark: false,
    colors: {
        primary: '#6A1B9A',       // Brand "Yellow" (Logic mismatch in native, but copying source)
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

const darkTheme = lightTheme; // Enforcing light mode as per native app

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    // We are not persisting theme preference since it's hardcoded to light,
    // but if we were, we'd use localStorage here instead of AsyncStorage.

    const theme = lightTheme;

    const changeTheme = () => {
        console.log("Theme switching is disabled.");
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
