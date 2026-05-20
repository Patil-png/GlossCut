import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

const getBlinkitProgressBar = (title = '', message = '') => {
  const t = title.toLowerCase();
  const m = message.toLowerCase();

  // If it's a booking/queue update, generate progress bar (20 units total inside brackets)
  if (t.includes('confirmed') || t.includes('secured')) {
    return '\n[🟢●------------------] Confirmed';
  }
  if (m.includes('queue') || m.includes('line') || m.includes('ahead')) {
    const match = m.match(/(\d+)/);
    const num = match ? parseInt(match[0], 10) : null;

    if (num !== null) {
      if (num >= 4) {
        return `\n[----●---------------] In Queue (${num} ahead)`;
      }
      if (num === 3) {
        return '\n[--------●-----------] In Queue (3rd)';
      }
      if (num === 2) {
        return '\n[------------●-------] Next In Line (2nd)';
      }
      if (num === 1) {
        return '\n[----------------●---] Next In Line (1st)';
      }
    }
    return '\n[--------●-----------] In Queue';
  }
  if (t.includes('ready') || t.includes('start') || t.includes('otp') || m.includes('otp') || m.includes('ready')) {
    return '\n[-------------------🟢] Ready! Your Turn';
  }
  return '';
};

const getBlinkitProgressDetails = (title = '', message = '') => {
  const t = title.toLowerCase();
  const m = message.toLowerCase();

  if (t.includes('confirmed') || t.includes('secured')) {
    return {
      progress: 0.15,
      timeText: 'Arriving in 30 mins',
      statusText: 'Slot Secured',
      iconType: 'calendar',
      illustrationText: 'Booking Confirmed!',
      subMessage: 'John is scheduled for your visit.'
    };
  }
  if (m.includes('queue') || m.includes('line') || m.includes('ahead')) {
    const match = m.match(/(\d+)/);
    const num = match ? parseInt(match[0], 10) : null;

    if (num !== null) {
      if (num >= 4) {
        return {
          progress: 0.30,
          timeText: `Arriving in ${num * 5} mins`,
          statusText: `In Queue (${num} ahead)`,
          iconType: 'clock',
          illustrationText: 'Queue is moving',
          subMessage: `There are ${num} people ahead of you.`
        };
      }
      if (num === 3) {
        return {
          progress: 0.55,
          timeText: 'Arriving in 15 mins',
          statusText: 'In Queue (3rd)',
          iconType: 'clock',
          illustrationText: 'Almost your turn',
          subMessage: '3 people ahead. Get ready!'
        };
      }
      if (num === 2) {
        return {
          progress: 0.75,
          timeText: 'Arriving in 10 mins',
          statusText: 'Next In Line (2nd)',
          iconType: 'walk',
          illustrationText: 'Start heading over',
          subMessage: 'You are 2nd in queue. Please head to the shop.'
        };
      }
      if (num === 1) {
        return {
          progress: 0.90,
          timeText: 'Arriving in 5 mins',
          statusText: 'Next up (1st)',
          iconType: 'walk',
          illustrationText: 'Be ready at counter',
          subMessage: 'You are next! Keep your entry OTP ready.'
        };
      }
    }
    return {
      progress: 0.50,
      timeText: 'Arriving in 15 mins',
      statusText: 'In Queue',
      iconType: 'clock',
      illustrationText: 'Queue is active',
      subMessage: 'Tracking your live position.'
    };
  }
  if (t.includes('ready') || t.includes('start') || t.includes('otp') || m.includes('otp') || m.includes('ready')) {
    return {
      progress: 1.0,
      timeText: 'Session Starting Now',
      statusText: 'Your Turn!',
      iconType: 'scissors',
      illustrationText: 'Ready at Salon!',
      subMessage: 'Please take your seat and share OTP.'
    };
  }
  
  return {
    progress: 0.5,
    timeText: 'Update received',
    statusText: 'GlossCut Live',
    iconType: 'bell',
    illustrationText: title,
    subMessage: message
  };
};

const triggerLocalNotification = async (title, body) => {
  try {
    const isExpoGo = Constants.appOwnership === 'expo' || 
                     Constants.executionEnvironment === 'storeClient';

    if (Platform.OS === 'android' && !isExpoGo) {
      try {
        const notifeeModule = require('@notifee/react-native');
        const notifee = notifeeModule.default;
        const { AndroidImportance, AndroidStyle } = notifeeModule;

        await notifee.requestPermission();

        const details = getBlinkitProgressDetails(title, body);
        const progressValue = Math.round(details.progress * 100);

        const channelId = await notifee.createChannel({
          id: 'glosscut-tracking',
          name: 'GlossCut Live Tracking',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: title,
          body: body,
          android: {
            channelId,
            smallIcon: 'notification_icon',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            style: {
              type: AndroidStyle.CUSTOM,
              layout: 'custom_notification',
            },
            progress: {
              max: 100,
              current: progressValue,
              indeterminate: false,
            }
          },
        });
        return; // Success, do not fall back
      } catch (notifeeErr) {
        console.log("Notifee native module missing or running in Expo Go. Falling back to system notification...");
      }
    }

    // Fallback: Use standard Expo notifications (which work everywhere, including inside Expo Go!)
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      const progressBar = getBlinkitProgressBar(title, body);
      const finalBody = body + progressBar;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: finalBody,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn("Error triggering local notification:", err);
  }
};

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const connectSocket = async () => {
      if (user && user._id) {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const newSocket = io(process.env.EXPO_PUBLIC_API_URL, {
              query: { token },
              transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
              console.log('Connected to notification socket');
            });

            newSocket.on('disconnect', () => {
              console.log('Disconnected from notification socket');
            });

            newSocket.on('notification', (notification) => {
              console.log('Received notification:', notification);
              setNotifications(prev => [notification, ...prev]);

              triggerLocalNotification(
                notification.title || "GlossCut Update",
                notification.message || notification.body || ""
              );
            });

            setSocket(newSocket);
          }
        } catch (error) {
          console.error('Failed to connect to notification socket:', error);
        }
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const value = {
    notifications,
    socket,
    markAsRead,
    triggerLocalNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
