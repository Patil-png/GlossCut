import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrivacyContext = createContext();

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

export const PrivacyProvider = ({ children }) => {
  const [privacySettings, setPrivacySettings] = useState({
    notificationEnabled: true,
    locationEnabled: true,
    contactsEnabled: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('privacySettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setPrivacySettings(prev => ({ ...prev, ...settings }));
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updatePrivacySettings = async (newSettings) => {
    try {
      const updatedSettings = { ...privacySettings, ...newSettings };
      setPrivacySettings(updatedSettings);
      await AsyncStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const isPermissionEnabled = (permission) => {
    return privacySettings[permission] || false;
  };

  const value = {
    privacySettings,
    updatePrivacySettings,
    isPermissionEnabled,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
};
