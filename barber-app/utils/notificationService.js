import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * Notification Service
 * Handles all notification-related functionality including:
 * - Channel configuration
 * - Token registration
 * - Deep linking
 * - Local notifications
 */

// ==================== NOTIFICATION CHANNELS ====================

/**
 * Configure Android Notification Channels
 * Different channels for different priority levels
 */
export const setupNotificationChannels = async () => {
    if (Platform.OS === 'android') {
        // HIGH PRIORITY: Bookings, Queue Updates, Urgent
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

        // DEFAULT PRIORITY: General notifications
        await Notifications.setNotificationChannelAsync('default', {
            name: 'General Notifications',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#231F7C',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });

        // LOW PRIORITY: Promotional, Tips
        await Notifications.setNotificationChannelAsync('low_priority', {
            name: 'Promotional',
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: [0],
            sound: null,
            enableVibrate: false,
            showBadge: false,
        });
    }
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Get Expo Push Token
 * Returns the device push token for sending notifications
 */
export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
};

// ==================== NOTIFICATION CATEGORIES ====================

/**
 * Notification Type Definitions
 * Each type has specific behavior and routing
 */
export const NotificationTypes = {
    BOOKING_NEW: 'booking_new',
    BOOKING_CANCELLED: 'booking_cancelled',
    QUEUE_JOINED: 'queue_joined',
    QUEUE_YOUR_TURN: 'queue_your_turn',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    SUBSCRIPTION_EXPIRING: 'subscription_expiring',
    STAFF_REQUEST: 'staff_request',
    CUSTOMER_MESSAGE: 'customer_message',
    GENERAL: 'general',
};

/**
 * Get channel ID based on notification type
 */
export const getChannelForType = (type) => {
    const highPriorityTypes = [
        NotificationTypes.BOOKING_NEW,
        NotificationTypes.QUEUE_JOINED,
        NotificationTypes.QUEUE_YOUR_TURN,
        NotificationTypes.PAYMENT_RECEIVED,
        NotificationTypes.STAFF_REQUEST,
    ];

    const lowPriorityTypes = [
        NotificationTypes.SUBSCRIPTION_EXPIRING,
        NotificationTypes.GENERAL,
    ];

    if (highPriorityTypes.includes(type)) {
        return 'high_priority';
    } else if (lowPriorityTypes.includes(type)) {
        return 'low_priority';
    }
    return 'default';
};

// ==================== DEEP LINKING ====================

/**
 * Handle Navigation from Notification Tap
 * Routes to appropriate screen based on notification data
 */
export const handleNotificationNavigation = (notification, navigation) => {
    if (!notification || !navigation) return;

    const data = notification.request.content.data;
    const type = data?.type;

    switch (type) {
        case NotificationTypes.BOOKING_NEW:
        case NotificationTypes.BOOKING_CANCELLED:
            // Navigate to Bookings/Queue Management
            if (data.bookingId) {
                navigation.navigate('QueueManagement');
            }
            break;

        case NotificationTypes.QUEUE_JOINED:
        case NotificationTypes.QUEUE_YOUR_TURN:
            // Navigate to Queue Management
            navigation.navigate('QueueManagement');
            break;

        case NotificationTypes.PAYMENT_RECEIVED:
        case NotificationTypes.PAYMENT_FAILED:
            // Navigate to Earnings
            if (data.paymentId) {
                navigation.navigate('Earnings');
            }
            break;

        case NotificationTypes.SUBSCRIPTION_EXPIRING:
            // Navigate to Boost Visibility (Subscriptions)
            navigation.navigate('BoostVisibility');
            break;

        case NotificationTypes.STAFF_REQUEST:
            // Navigate to Listed Card (Staff Management)
            navigation.navigate('ListedCard');
            break;

        case NotificationTypes.CUSTOMER_MESSAGE:
            // Navigate to Chat
            if (data.customerId) {
                navigation.navigate('Chat', { customerId: data.customerId });
            }
            break;

        default:
            // Navigate to Home for general notifications
            navigation.navigate('Home');
            break;
    }
};

// ==================== LOCAL NOTIFICATIONS ====================

/**
 * Schedule a Local Notification
 * Useful for testing and offline scenarios
 */
export const scheduleLocalNotification = async ({
    title,
    body,
    data = {},
    trigger = null, // null = immediate, or { seconds: 5 }
    channelId = 'default',
}) => {
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                vibrate: [0, 250, 250, 250],
                ...(Platform.OS === 'android' && { channelId }),
            },
            trigger,
        });

        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId) => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.error('Error canceling all notifications:', error);
    }
};

// ==================== BADGE MANAGEMENT ====================

/**
 * Set app badge count (iOS mainly)
 */
export const setBadgeCount = async (count) => {
    try {
        await Notifications.setBadgeCountAsync(count);
    } catch (error) {
        console.error('Error setting badge count:', error);
    }
};

/**
 * Clear app badge
 */
export const clearBadge = async () => {
    try {
        await Notifications.setBadgeCountAsync(0);
    } catch (error) {
        console.error('Error clearing badge:', error);
    }
};

// ==================== NOTIFICATION TEMPLATES ====================

/**
 * Pre-defined notification templates
 * These would typically be sent from the backend
 */
export const NotificationTemplates = {
    newBooking: (customerName, serviceName) => ({
        title: '💈 New Booking!',
        body: `${customerName} booked ${serviceName}`,
        data: { type: NotificationTypes.BOOKING_NEW },
        channelId: 'high_priority',
    }),

    queueJoined: (customerName, position) => ({
        title: '👥 Customer in Queue',
        body: `${customerName} joined the queue (Position ${position})`,
        data: { type: NotificationTypes.QUEUE_JOINED },
        channelId: 'high_priority',
    }),

    paymentReceived: (amount) => ({
        title: '💰 Payment Received',
        body: `You received ₹${amount}`,
        data: { type: NotificationTypes.PAYMENT_RECEIVED },
        channelId: 'high_priority',
    }),

    subscriptionExpiring: (daysLeft) => ({
        title: '⚠️ Subscription Expiring',
        body: `Your premium plan expires in ${daysLeft} days`,
        data: { type: NotificationTypes.SUBSCRIPTION_EXPIRING },
        channelId: 'low_priority',
    }),

    staffRequest: (staffName) => ({
        title: '👨‍💼 New Staff Request',
        body: `${staffName} wants to join your shop`,
        data: { type: NotificationTypes.STAFF_REQUEST },
        channelId: 'high_priority',
    }),
};

export default {
    setupNotificationChannels,
    registerForPushNotificationsAsync,
    handleNotificationNavigation,
    scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    setBadgeCount,
    clearBadge,
    NotificationTypes,
    NotificationTemplates,
};
