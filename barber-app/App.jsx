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
  const { isLoading, user, updateProfile } = useAuth();
  const [expoPushToken, setExpoPushToken] = React.useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // 1. Setup Notification Channels & Get Push Token
  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      try {
        // Setup Android Notification Channels
        if (Platform.OS === 'android') {
          // HIGH PRIORITY: Bookings, Queue, Urgent
          await Notifications.setNotificationChannelAsync('high_priority', {
            name: 'Important Updates',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#231F7C',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });

          // DEFAULT PRIORITY
          await Notifications.setNotificationChannelAsync('default', {
            name: 'General Notifications',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#231F7C',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          });

          // LOW PRIORITY: Promotional
          await Notifications.setNotificationChannelAsync('low_priority', {
            name: 'Promotional',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: [0],
            sound: null,
            enableVibrate: false,
            showBadge: false,
          });
        }

        // Request Permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return;
        }

        // Get Push Token
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

        if (isMounted) {
          setExpoPushToken(tokenData.data);
        }
      } catch (e) {
        console.error("Error setting up notifications:", e);
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sync Push Token with Backend
  useEffect(() => {
    const syncToken = async () => {
      if (user && expoPushToken && user.pushToken !== expoPushToken) {
        await updateProfile({ pushToken: expoPushToken });
      }
    };
    syncToken();
  }, [user?.id, expoPushToken]);

  // 3. Listen for Notifications (when app is OPEN/FOREGROUND)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // This fires when notification arrives while app is open
      // The notification banner is already shown by setNotificationHandler
      // You can add custom logic here if needed
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, []);

  // 4. Handle Notification Taps (DEEP LINKING)
  // This works in ALL states: Open, Background, Killed
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const type = data?.type;

      // Navigate based on notification type
      // Using navigationRef for navigation when app starts from killed state
      if (navigationRef.isReady()) {
        handleDeepLink(type, data);
      } else {
        // Wait for navigation to be ready
        const timeout = setTimeout(() => {
          if (navigationRef.isReady()) {
            handleDeepLink(type, data);
          }
        }, 1000);
        return () => clearTimeout(timeout);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Deep Link Handler
  const handleDeepLink = (type, data) => {
    switch (type) {
      case 'booking_new':
      case 'booking_cancelled':
      case 'queue_joined':
      case 'queue_your_turn':
        navigationRef.navigate('QueueManagement');
        break;

      case 'payment_received':
      case 'payment_failed':
        navigationRef.navigate('Earnings');
        break;

      case 'subscription_expiring':
        navigationRef.navigate('BoostVisibility');
        break;

      case 'staff_request':
        navigationRef.navigate('ListedCard');
        break;

      case 'customer_message':
        if (data.customerId) {
          navigationRef.navigate('Chat', { customerId: data.customerId });
        }
        break;

      default:
        navigationRef.navigate('Home');
        break;
    }
  };

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
