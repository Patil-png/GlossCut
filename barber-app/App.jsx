import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/RootNavigation';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator.jsx';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';

// Configure Notification Handler (Show alerts when app is open)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading, user, updateProfile } = useAuth(); // Lock logic is now handled inside AuthProvider

  const [expoPushToken, setExpoPushToken] = React.useState(null);

  // 1. Get Push Token ONCE
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          // console.log('Failed to get push token for push notification!');
          return;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

        if (isMounted) {
          // console.log('Push Token:', tokenData.data);
          setExpoPushToken(tokenData.data);
        }
      } catch (e) {
        // console.error("Error fetching push token:", e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // 2. Sync with Backend (Only when User or Token changes)
  useEffect(() => {
    const syncToken = async () => {
      if (user && expoPushToken && user.pushToken !== expoPushToken) {
        // console.log('Syncing Push Token...');
        await updateProfile({ pushToken: expoPushToken });
        // console.log('✅ Push Token synced with backend');
      }
    };
    syncToken();
  }, [user?.id, expoPushToken]); // Depend on ID, not full user object to prevent loops

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
