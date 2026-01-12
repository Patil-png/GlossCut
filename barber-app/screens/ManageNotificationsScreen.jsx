import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch, 
  StatusBar, 
  Dimensions, 
  Animated, 
  Easing, 
  Platform, 
  ActivityIndicator,
  InteractionManager
} from 'react-native';
import { ChevronLeft, Bell, CheckCircle, AlertTriangle, X, ShieldCheck, Zap } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics'; 

const { width: screenWidth } = Dimensions.get('window');

// --- OPTIMIZATION 1: Static Components Moved Outside (Prevents Re-Creation) ---
// Wrapped in React.memo so it ONLY re-renders if its specific props change
const InfoCard = React.memo(({ icon: Icon, title, desc, theme, isDark }) => (
  <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
    <View style={[styles.miniIcon, { backgroundColor: theme.colors.iconBackground }]}>
      <Icon size={18} color={theme.colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.infoDesc, { color: theme.colors.textSecondary }]}>{desc}</Text>
    </View>
  </View>
));

// --- OPTIMIZATION 2: Optimized Toast Component (Native Driver Enforced) ---
const CustomToast = React.memo(({ visible, type, title, message, onClose, theme, topInset }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeout;
    if (visible) {
      // Parallel execution on UI Thread
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 40 + (Platform.OS === 'android' ? 10 : topInset),
          duration: 400,
          useNativeDriver: true, // GPU Acceleration
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      timeout = setTimeout(() => {
        handleClose();
      }, 3000);
    } else {
      handleClose();
    }
    return () => clearTimeout(timeout);
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true, // GPU Acceleration
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Only call onClose if it's actually visible to avoid state loop
      if (visible && onClose) onClose();
    });
  }, [visible, onClose, translateY, opacity]);

  // Early return optimization: Don't render if invisible and fully transparent
  if (!visible && opacity._value === 0) return null;

  const isSuccess = type === 'success';
  const borderColor = isSuccess ? '#4ADE80' : '#EF4444';
  const Icon = isSuccess ? CheckCircle : AlertTriangle;
  const iconColor = isSuccess ? '#4ADE80' : '#EF4444';

  return (
    <Animated.View style={[
      styles.toastContainer, 
      { 
        transform: [{ translateY }], 
        opacity,
        backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF',
        shadowColor: theme.isDark ? '#000' : '#888',
      }
    ]}>
      <View style={[styles.toastStrip, { backgroundColor: borderColor }]} />
      <View style={styles.toastContent}>
        <View style={[styles.toastIconBox, { backgroundColor: isSuccess ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
          <Icon size={24} color={iconColor} strokeWidth={2.5} />
        </View>
        <View style={styles.toastTextContainer}>
          <Text style={[styles.toastTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.toastMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default function ManageNotificationsScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { theme, isDark } = useTheme();

  // State
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  // Refs for Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- OPTIMIZATION 3: Memoized Helpers & Styles ---
  // Reduces calculation overhead on every render
  const statusColors = useMemo(() => ({
    activeStart: isDark ? '#4ADE80' : '#4ADE80',
    activeEnd: isDark ? '#22C55E' : '#22C55E',
    inactiveStart: isDark ? '#64748B' : '#CBD5E1',
    inactiveEnd: isDark ? '#475569' : '#94A3B8',
    dotActive: '#22C55E',
    dotInactive: '#EF4444'
  }), [isDark]);

  const showToast = useCallback((type, title, message) => {
    setToast({ visible: true, type, title, message });
    const feedbackType = type === 'success' 
      ? Haptics.NotificationFeedbackType.Success 
      : Haptics.NotificationFeedbackType.Error;
    Haptics.notificationAsync(feedbackType).catch(() => {});
  }, []);

  const closeToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  // --- OPTIMIZATION 4: Optimized Handler with InteractionManager ---
  const handleToggleNotifications = useCallback(async (newValue) => {
    if (isSaving) return;

    // 1. Immediate Haptic & Visual Update (Optimistic UI)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setNotificationsEnabled(newValue);
    setIsSaving(true);

    // 2. Defer heavy API/Server logic until animation frame is free
    InteractionManager.runAfterInteractions(async () => {
      try {
        const success = await updateProfile({ notificationsEnabled: newValue });
        
        if (success) {
          showToast(
            'success', 
            newValue ? 'Notifications Active' : 'Notifications Paused', 
            newValue ? 'You will now receive real-time updates.' : 'You won\'t receive updates for now.'
          );
        } else {
          throw new Error("Update failed");
        }
      } catch (error) {
        console.error("Toggle Error:", error);
        // Revert safely
        setNotificationsEnabled(!newValue); 
        showToast('error', 'Connection Error', 'Could not save settings. Please check your internet.');
      } finally {
        setIsSaving(false);
      }
    });
  }, [isSaving, updateProfile, showToast]);

  // --- OPTIMIZATION 5: Efficient Animation Loop ---
  useEffect(() => {
    let animation;
    
    if (notificationsEnabled) {
      // Only create the animation object if needed
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { 
            toValue: 1.08, 
            duration: 1500, 
            useNativeDriver: true, // CRITICAL for performance
            easing: Easing.inOut(Easing.ease) 
          }),
          Animated.timing(pulseAnim, { 
            toValue: 1, 
            duration: 1500, 
            useNativeDriver: true, // CRITICAL for performance
            easing: Easing.inOut(Easing.ease) 
          }),
        ])
      );
      animation.start();
    } else {
      // Immediately reset without loop if disabled
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [notificationsEnabled]); // Removed pulseAnim from dep array as it's a ref

  // Render Helpers
  const currentGradient = notificationsEnabled 
    ? [statusColors.activeStart, statusColors.activeEnd]
    : [statusColors.inactiveStart, statusColors.inactiveEnd];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent" // Transparent for modern look
        translucent={true}
      />
      
      {/* Header - Optimized padding calculation */}
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.iconButton, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notification Settings</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={currentGradient}
              style={styles.gradientCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Bell size={48} color="#FFF" fill={notificationsEnabled ? "#FFF" : "transparent"} />
            </LinearGradient>
            
            <View style={[styles.statusDot, { 
              backgroundColor: notificationsEnabled ? statusColors.dotActive : statusColors.dotInactive,
              borderColor: theme.colors.background 
            }]} />
          </Animated.View>

          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            {notificationsEnabled ? "You're all set!" : "Notifications Paused"}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
            {notificationsEnabled 
              ? "You will receive instant updates about your rides, deliveries, and security alerts."
              : "Turn on notifications to ensure you don't miss important updates regarding your orders."}
          </Text>
        </View>

        {/* Main Control Card */}
        <View style={[styles.controlCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.textStack}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Allow Notifications</Text>
              <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                Enable push notifications for this device
              </Text>
            </View>
            
            <View style={styles.switchWrapper}>
               {isSaving ? (
                 <ActivityIndicator size="small" color={theme.colors.primary} />
               ) : (
                 <Switch
                  trackColor={{ false: isDark ? '#475569' : '#E2E8F0', true: '#4ADE80' }}
                  thumbColor={'#FFFFFF'}
                  ios_backgroundColor={isDark ? '#475569' : '#E2E8F0'}
                  onValueChange={handleToggleNotifications}
                  value={notificationsEnabled}
                  style={Platform.OS === 'ios' ? { transform: [{ scale: 0.9 }] } : {}} 
                />
               )}
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.infoContainer}>
             <InfoCard 
               icon={ShieldCheck} 
               title="Ride Security" 
               desc="Get instant alerts for ride start, end, and safety OTPs."
               theme={theme}
               isDark={isDark}
             />
             <InfoCard 
               icon={Zap} 
               title="Smart Offers" 
               desc="Be the first to know about price drops and discounts."
               theme={theme}
               isDark={isDark}
             />
          </View>
        </View>
      </View>

      <CustomToast 
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={closeToast}
        theme={{ ...theme, isDark }}
        topInset={0} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth without lag
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  bellContainer: {
    width: 100,
    height: 100,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#4ADE80",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  statusDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  controlCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: '#fff', // fallback
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textStack: {
    flex: 1,
    marginRight: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  switchWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
    opacity: 0.5,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom: 8,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  // --- Toast Styles ---
  toastContainer: {
    position: 'absolute',
    top: 0, 
    alignSelf: 'center',
    width: screenWidth * 0.92,
    maxWidth: 400,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    zIndex: 9999, 
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  toastStrip: {
    width: 6,
    height: '100%',
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toastIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});
