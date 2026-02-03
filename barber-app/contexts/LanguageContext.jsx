import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/translations';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const { user } = useAuth(); // Optional: sync with user profile if available
    const [language, setLanguage] = useState("English");
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Load Language Preference on Startup
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                // Priority 1: User Profile (if logged in)
                if (user?.language && translations[user.language]) {
                    setLanguage(user.language);
                }
                // Priority 2: Local Storage
                else {
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    if (savedLang && translations[savedLang]) {
                        setLanguage(savedLang);
                    }
                }
            } catch (e) {
                console.log("Failed to load language", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, [user]);

    // 2. Function to Change Language
    const changeLanguage = async (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
            await AsyncStorage.setItem('appLanguage', lang);
            return true;
        }
        return false;
    };

    // 3. Translation Helper Function: t('key')
    const t = (key) => {
        const dict = translations[language] || translations['English'];
        return dict[key] || key; // Fallback to key if missing
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, isLoaded }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
