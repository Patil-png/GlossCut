import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
  Vibration,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  ChevronRight,
  MailOpen
} from 'lucide-react-native';
import api from "../utils/api";
import * as Animatable from 'react-native-animatable';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 44;

// --- 1. SKELETON LOADER ---
const SkeletonItem = ({ theme }) => (
  <Animatable.View
    animation="pulse"
    easing="ease-out"
    iterationCount="infinite"
    duration={1500}
    style={[styles.skeletonCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
  >
    <View style={[styles.skeletonIcon, { backgroundColor: theme.dark ? '#333' : '#f4f4f5' }]} />
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={[styles.skeletonBar, { width: '40%', height: 14, backgroundColor: theme.dark ? '#333' : '#f4f4f5' }]} />
        <View style={[styles.skeletonBar, { width: '15%', height: 12, backgroundColor: theme.dark ? '#333' : '#f4f4f5' }]} />
      </View>
      <View style={[styles.skeletonBar, { width: '80%', height: 10, backgroundColor: theme.dark ? '#333' : '#f4f4f5' }]} />
    </View>
  </Animatable.View>
);

// --- 2. PREMIUM NOTIFICATION CARD (Flat UI - No Shadows) ---
const NotificationItem = memo(({ item, theme, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isRead = item.read || item.isRead;

  // --- ANIMATION ---
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : 'Now';

  // --- COLOR & STYLE LOGIC ---
  const cardBackground = isRead
    ? theme.colors.card
    : (theme.dark ? 'rgba(100, 50, 255, 0.15)' : theme.colors.primary + '09');

  const cardBorder = isRead ? theme.colors.border : theme.colors.primary + '25';

  // Shadow styles removed here

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 60}
      useNativeDriver
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onPress(item)}
          style={[styles.cardBase, {
            backgroundColor: cardBackground,
            borderColor: cardBorder,
            // Shadow styles removed from here
          }]}
        >
          {/* Accent Bar */}
          {!isRead && (
            <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
          )}

          {/* Icon */}
          <View style={[styles.iconContainer, {
            backgroundColor: isRead ? (theme.dark ? '#333' : '#F3F4F6') : theme.colors.background,
            borderColor: isRead ? 'transparent' : theme.colors.primary + '15'
          }]}>
            {isRead ? (
              <MailOpen color={theme.colors.textSecondary} size={20} />
            ) : (
              <Bell color={theme.colors.primary} size={22} fill={theme.colors.primary + '15'} />
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.title, {
                  color: theme.colors.text,
                  fontWeight: isRead ? '600' : '700',
                  opacity: isRead ? 0.8 : 1
                }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.dateText, { color: isRead ? theme.colors.textSecondary : theme.colors.primary }]}>
                {formattedDate}
              </Text>
            </View>

            <Text
              style={[styles.message, {
                color: theme.colors.textSecondary,
                fontWeight: isRead ? '400' : '500',
                opacity: isRead ? 0.9 : 1
              }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>

          {/* Chevron */}
          {!isRead && (
            <ChevronRight size={18} color={theme.colors.primary} style={styles.chevron} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animatable.View>
  );
});

// --- 3. TOAST ALERT ---
const TopToast = ({ message, type, show }) => {
  if (!show) return null;
  return (
    <Animatable.View
      animation="slideInDown"
      duration={500}
      easing="ease-out-back"
      style={[
        styles.toastContainer,
        { backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }
      ]}
    >
      {type === 'success' ? <CheckCircle2 color="#fff" size={20} /> : <AlertTriangle color="#fff" size={20} />}
      <Text style={styles.toastText}>{message}</Text>
    </Animatable.View>
  );
};

// --- MAIN SCREEN ---
const NotificationsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'success' });
  const [isOffline, setIsOffline] = useState(false);

  const triggerAlert = useCallback((msg, type = 'success') => {
    if (type === 'error') Vibration.vibrate(50);
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications', {
        timeout: 8000
      });

      setNotifications(res.data || []);
      setIsOffline(false);
    } catch (err) {
      console.log("Fetch Error:", err);
      if (!err.response) {
        setIsOffline(true);
        triggerAlert("You're offline. Showing cached updates.", "error");
      } else {
        triggerAlert("Couldn't update notifications.", "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [triggerAlert]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePress = useCallback((item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications(prev =>
      prev.map(doc => doc._id === item._id ? { ...doc, read: true, isRead: true } : doc)
    );
    navigation.navigate('NotificationDetail', { notification: item });
  }, [navigation]);

  const markAllRead = async () => {
    // Optimistic Update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    triggerAlert("All marked as read", "success");
    Vibration.vibrate(20);

    try {
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.log("Failed to sync mark all read", error);
      // Optional: Revert state if critical, but for read status it's usually fine to fail silently or show small toast
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <TopToast message={alert.msg} type={alert.type} show={alert.show} />

      {/* HEADER */}
      <View style={[styles.headerWrapper, { paddingTop: STATUSBAR_HEIGHT + 10, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerEyebrow, { color: theme.colors.primary }]}>
              {unreadCount > 0 ? `${unreadCount} NEW UPDATES` : 'NOTIFICATIONS'}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Inbox</Text>
          </View>

          <TouchableOpacity
            style={[styles.markReadBtn, {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              opacity: unreadCount === 0 ? 0.5 : 1
            }]}
            onPress={unreadCount > 0 ? markAllRead : null}
            activeOpacity={0.7}
          >
            <CheckCircle2 color={unreadCount > 0 ? theme.colors.primary : theme.colors.textSecondary} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} theme={theme} />)}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item, index }) => (
            <NotificationItem item={item} theme={theme} onPress={handlePress} index={index} />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressViewOffset={STATUSBAR_HEIGHT + 20}
            />
          }
          ListEmptyComponent={() => (
            <Animatable.View animation="fadeIn" duration={800} style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.card }]}>
                {isOffline ? (
                  <WifiOff size={40} color={theme.colors.error || '#EF4444'} />
                ) : (
                  <MailOpen size={40} color={theme.colors.textSecondary} />
                )}
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {isOffline ? "No Connection" : "All Caught Up!"}
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                {isOffline
                  ? "Check your internet settings."
                  : "You have no new notifications."}
              </Text>
            </Animatable.View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // --- HEADER ---
  headerWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  markReadBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // Shadows removed
  },

  // --- LIST ---
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },

  // --- CARD STYLES (Flat Base) ---
  cardBase: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1.5, // Slightly thicker border for premium feel
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // Shadows removed
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    marginRight: 16,
    borderWidth: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16.5,
    flex: 1,
    letterSpacing: -0.3,
    marginRight: 12,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  chevron: {
    marginLeft: 12,
    opacity: 0.6,
  },

  // --- TOAST ---
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : STATUSBAR_HEIGHT + 15,
    alignSelf: 'center',
    width: '90%',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    // Shadows removed
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },

  // --- SKELETON ---
  skeletonCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    opacity: 0.6,
  },
  skeletonIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    marginRight: 16,
  },
  skeletonBar: { borderRadius: 6 },

  // --- EMPTY STATE ---
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 50,
    lineHeight: 22,
    opacity: 0.6,
  },
});

export default NotificationsScreen;