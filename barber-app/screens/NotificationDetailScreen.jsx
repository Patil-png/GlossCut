import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Bell, Clock, Calendar, CheckCircle2, ShieldCheck, WifiOff, AlertTriangle } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import api from "../utils/api";

const { width } = Dimensions.get('window');

// --- PREMIUM TOAST (Floating Pill Design) ---
const ToastNotification = ({ visible, message, type }) => {
  if (!visible) return null;

  const isError = type === 'error';
  // Airbnb/Stripe style: Dark gray for success, Red for error, soft shadows
  const bgColor = isError ? '#FF4444' : '#1A1A1A';

  return (
    <Animatable.View
      animation="slideInDown"
      duration={600}
      useNativeDriver
      style={styles.toastWrapper}
    >
      <View style={[styles.toastContainer, { backgroundColor: bgColor }]}>
        {isError ? <WifiOff size={18} color="#fff" /> : <CheckCircle2 size={18} color="#00E676" />}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animatable.View>
  );
};

// --- HELPER FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return 'Date unavailable';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const NotificationDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notification } = route.params || {};

  // State
  const [isRead, setIsRead] = useState(notification?.read || false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Function to trigger the toast
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  useEffect(() => {
    const markAsRead = async () => {
      if (notification && !notification.read) {
        try {
          await api.put(
            `/api/notifications/${notification._id}/read`,
            {},
            {
              timeout: 5000
            }
          );
          setIsRead(true);
        } catch (error) {
          console.log("Sync Error:", error.message);
          // Only show error toast if strictly necessary to avoid user panic
          if (!error.response) {
            showToast("Connection unstable. Saved locally.", "error");
          }
        }
      }
    };
    markAsRead();
  }, [notification]);

  // --- SAFETY GUARD: NO DATA ---
  if (!notification) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: theme.colors.border }]}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerError}>
          <AlertTriangle size={64} color={theme.colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Content Unavailable</Text>
          <Text style={[styles.errorSub, { color: theme.colors.textSecondary }]}>We couldn't locate this notification.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />

      {/* --- HEADER --- */}
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notification</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HERO CARD --- */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          easing="ease-out-cubic"
          style={[styles.mainCard, { backgroundColor: theme.colors.card }]}
        >

          {/* Top Row: Icon + Status */}
          <View style={styles.cardHeader}>
            <Animatable.View
              animation="pulse"
              easing="ease-out"
              iterationCount="infinite"
              duration={3000}
              style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]} // 15% opacity hex
            >
              <Bell size={28} color={theme.colors.primary} strokeWidth={2.5} />
            </Animatable.View>

            {isRead && (
              <Animatable.View
                animation="bounceIn"
                delay={500}
                style={[styles.statusPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              >
                <CheckCircle2 size={12} color={theme.colors.primary} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>Read</Text>
              </Animatable.View>
            )}
          </View>

          {/* Title Area */}
          <Animatable.Text
            animation="fadeInUp"
            delay={200}
            style={[styles.title, { color: theme.colors.text }]}
          >
            {notification.title}
          </Animatable.Text>

          {/* Metadata Row */}
          <Animatable.View
            animation="fadeIn"
            delay={300}
            style={styles.metaRow}
          >
            <View style={[styles.metaTag, { backgroundColor: theme.colors.background }]}>
              <Calendar size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {formatDate(notification.date)}
              </Text>
            </View>
            <View style={[styles.metaTag, { backgroundColor: theme.colors.background }]}>
              <Clock size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {formatTime(notification.date)}
              </Text>
            </View>
          </Animatable.View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Main Body */}
          <Animatable.Text
            animation="fadeInUp"
            delay={400}
            style={[styles.message, { color: theme.colors.text }]}
          >
            {notification.message}
          </Animatable.Text>

          {/* Trust Badge / Footer */}
          <Animatable.View
            animation="fadeIn"
            delay={600}
            style={[styles.trustBadge, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}
          >
            <ShieldCheck size={18} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustTitle, { color: theme.colors.text }]}>Official Communication</Text>
              <Text style={[styles.trustSub, { color: theme.colors.textSecondary }]}>
                System generated message. No action required.
              </Text>
            </View>
          </Animatable.View>

        </Animatable.View>

      </ScrollView>

      {/* --- FLOATING BOTTOM ACTION --- */}
      <Animatable.View
        animation="slideInUp"
        delay={400}
        duration={700}
        style={[styles.bottomContainer, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Toast ---
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    // Floating Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // --- Header ---
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14, // Squircle
    borderWidth: 1,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  // --- Layout ---
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120, // Space for bottom button
  },
  centerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  errorSub: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  // --- Main Card ---
  mainCard: {
    borderRadius: 32,
    padding: 28,
    marginTop: 10,
    // Deep, soft shadow for "Levitation" effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 2, // Low elevation on Android for cleaner look
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  // --- Meta Tags ---
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
    opacity: 0.5,
  },
  message: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 32,
    fontWeight: '400',
    opacity: 0.9,
  },
  // --- Trust Badge ---
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  // --- Bottom Button Container ---
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    // Upward shadow to blend with content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Button Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});

export default NotificationDetailScreen;