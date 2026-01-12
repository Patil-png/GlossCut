import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle, AlertCircle, X } from 'lucide-react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Popup Notification Component
const PopupNotification = ({ visible, notification, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && notification) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 50,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      hideNotification();
    }
  }, [visible, notification]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible || !notification) return null;

  const isError = notification.title?.toLowerCase().includes('cancelled') ||
                  notification.title?.toLowerCase().includes('declined');
  const bgColor = isError ? '#FEF2F2' : '#F0FDF4';
  const borderColor = isError ? '#EF4444' : '#22C55E';
  const textColor = isError ? '#991B1B' : '#166534';
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <Animated.View
      style={[
        styles.popupContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
      ]}
    >
      <View style={styles.popupContent}>
        <View style={[styles.iconContainer, { backgroundColor: isError ? '#FECACA' : '#DCFCE7' }]}>
          <Icon size={20} color={borderColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.popupTitle, { color: textColor }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.popupMessage, { color: textColor }]} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
          <X size={16} color={textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    const connectSocket = async () => {
      if (user && user._id) {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const newSocket = io(process.env.EXPO_PUBLIC_API_URL, {
              query: { token },
              transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
              console.log('Connected to notification socket');
            });

            newSocket.on('disconnect', () => {
              console.log('Disconnected from notification socket');
            });

            // Listen for new notifications
            newSocket.on('notification', (notification) => {
              console.log('Received notification:', notification);

              // Add to notifications list
              setNotifications(prev => [notification, ...prev]);

              // Show popup for important notifications (cancellations, etc.)
              if (notification.title?.toLowerCase().includes('booking') &&
                  (notification.title?.toLowerCase().includes('cancelled') ||
                   notification.title?.toLowerCase().includes('declined') ||
                   notification.message?.toLowerCase().includes('coins'))) {
                setCurrentNotification(notification);
                setShowPopup(true);
              }
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

  const hidePopup = () => {
    setShowPopup(false);
    setCurrentNotification(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      // Update local state
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <PopupNotification
        visible={showPopup}
        notification={currentNotification}
        onHide={hidePopup}
        theme={{}} // Pass theme if needed
      />
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  popupContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  popupMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
