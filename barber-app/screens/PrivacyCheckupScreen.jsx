import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  Vibration,
  Easing,
  Dimensions,
  Linking, // Added Linking
  AppState
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // For auto-refresh
import {
  ChevronLeft,
  Shield,
  Bell,
  MapPin,
  Mic,
  Camera,
  Users,
  CheckCircle2,
  XCircle,
  WifiOff,
  Fingerprint,
  Settings, // Added Settings Icon
  ArrowRight
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LinearGradient } from 'expo-linear-gradient';

// --- PERMISSION IMPORTS ---
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

// --- CONSTANTS ---
const TOAST_TOP_OFFSET = Platform.OS === 'ios' ? 60 : 40;
const { width } = Dimensions.get('window');

// --- 1. OPTIMIZED PRESSABLE SCALE (Memoized) ---
const PressableScale = memo(({ children, onPress, style, activeScale = 0.97, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleValue, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [activeScale, disabled, scaleValue]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [disabled, scaleValue]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={style}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- 2. OPTIMIZED TOAST COMPONENT ---
const ToastMessage = memo(({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: TOAST_TOP_OFFSET,
          useNativeDriver: true,
          friction: 6,
          tension: 50
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => onHide && onHide());
  }, [onHide, translateY, opacity]);

  const getStyles = useCallback(() => {
    switch (type) {
      case 'success':
        return {
          bg: '#FFFFFF',
          border: '#10B981',
          icon: <CheckCircle2 size={24} color="#10B981" />
        };
      case 'error':
        return {
          bg: '#FFFFFF',
          border: '#EF4444',
          icon: <XCircle size={24} color="#EF4444" />
        };
      case 'offline':
        return {
          bg: '#FFFFFF',
          border: '#F59E0B',
          icon: <WifiOff size={24} color="#F59E0B" />
        };
      default:
        return {
          bg: '#FFFFFF',
          border: '#6366f1',
          icon: <Bell size={24} color="#6366f1" />
        };
    }
  }, [type]);

  if (!visible) return null;
  const styleConfig = getStyles();

  return (
    <Animated.View style={[
      styles.toastContainer,
      {
        transform: [{ translateY }],
        opacity,
        backgroundColor: styleConfig.bg,
        borderLeftColor: styleConfig.border,
      }
    ]}>
      <View style={styles.toastContent}>
        <View style={styles.toastIconContainer}>{styleConfig.icon}</View>
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>
            {type === 'error' ? 'Error' : type === 'offline' ? 'No Internet' : 'Success'}
          </Text>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// --- 3. OPTIMIZED PRIVACY CARD (Interactive vs Read-Only) ---
const PrivacySetting = memo(({
  icon: Icon,
  title,
  description,
  isEnabled, // If null, means "Loading"
  isToggle, // True = Switch, False = Read-Only Badge
  onAction, // Toggle or Open Settings
  theme,
  index
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [index, slideAnim, fadeAnim]);

  const handlePress = useCallback(() => {
    // If it's a toggle, the switch handles it.
    // If it's read-only, touching the card opens settings.
    if (!isToggle) {
      Vibration.vibrate(10);
      onAction();
    }
  }, [isToggle, onAction]);

  const handleToggle = useCallback((val) => {
    if (isToggle) {
      Vibration.vibrate(10);
      onAction(val);
    }
  }, [isToggle, onAction]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 16 }}>
      <PressableScale activeScale={isToggle ? 0.98 : 0.96} onPress={handlePress} disabled={isToggle}>
        {/* Outer Gray Container */}
        <View style={[styles.cardOuter, { backgroundColor: '#CFCFCF' }]}>
          {/* Inner White Container */}
          <View style={[styles.cardInner, { backgroundColor: '#FFFFFF' }]}>

            {/* Icon Box */}
            <View style={[styles.iconBox, { backgroundColor: theme.colors.iconBackground }]}>
              <Icon size={22} color="#6366f1" strokeWidth={2} />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardRefDescription} numberOfLines={2}>
                {description}
              </Text>
            </View>

            {/* ACTION AREA: Switch OR Status Badge */}
            {isToggle ? (
              <Switch
                trackColor={{ false: '#E2E8F0', true: '#6366f1' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#E2E8F0"
                onValueChange={handleToggle}
                value={isEnabled}
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            ) : (
              // READ-ONLY BADGE
              <View style={styles.readOnlyContainer}>
                <View style={[styles.statusBadgeSmall, {
                  backgroundColor: isEnabled ? '#D1FAE5' : '#FEE2E2',
                  borderColor: isEnabled ? '#10B981' : '#EF4444'
                }]}>
                  {isEnabled ? (
                    <CheckCircle2 size={14} color="#059669" />
                  ) : (
                    <XCircle size={14} color="#B91C1C" />
                  )}
                  <Text style={[styles.statusTextSmall, {
                    color: isEnabled ? '#065F46' : '#991B1B'
                  }]}>
                    {isEnabled ? 'ALLOWED' : 'DENIED'}
                  </Text>
                </View>
                <ArrowRight size={16} color="#94A3B8" style={{ marginLeft: 8 }} />
              </View>
            )}

          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}, (prev, next) => prev.isEnabled === next.isEnabled && prev.theme.isDark === next.theme.isDark);

// --- 4. MAIN SCREEN ---
export default function PrivacyCheckupScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const {
    user,
    biometricsEnabled,
    toggleBiometrics,
    biometricsSupported
  } = useAuth();

  // --- REAL OS PERMISSION STATES ---
  const [notificationStatus, setNotificationStatus] = useState(false);
  const [locationStatus, setLocationStatus] = useState(false);
  const [micStatus, setMicStatus] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // UI State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // --- CHECK PERMISSIONS FUNCTION ---
  const checkPermissions = useCallback(async () => {
    try {
      // 1. Notifications
      const notifSettings = await Notifications.getPermissionsAsync();
      setNotificationStatus(notifSettings.granted);

      // 2. Location - Just check, don't request
      const locSettings = await Location.getForegroundPermissionsAsync();
      setLocationStatus(locSettings.granted === true);

      // 3. Microphone - Just check, don't request
      const micSettings = await Audio.getPermissionsAsync();
      setMicStatus(micSettings.granted === true);

      setLoadingPermissions(false);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setLoadingPermissions(false);
    }
  }, []);

  // Use FocusEffect to check permissions every time the screen comes into focus
  // (e.g. returning from Settings app)
  useFocusEffect(
    useCallback(() => {
      checkPermissions();
      // Listen for app state changes (background -> foreground)
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          checkPermissions();
        }
      });
      return () => {
        subscription.remove();
      };
    }, [checkPermissions])
  );

  // --- ACTION HANDLERS ---

  // Opens OS Settings
  const openSettings = () => {
    Vibration.vibrate(10);
    Linking.openSettings();
  };

  // Handles App Lock Toggle (Still Logic-Based)
  const handleBiometricToggle = async (value) => {
    Vibration.vibrate(20);
    const success = await toggleBiometrics(value);
    if (!success) {
      setToast({ visible: true, type: 'error', message: 'Authentication failed.' });
    } else {
      setToast({ visible: true, type: 'success', message: value ? 'App Lock Enabled' : 'App Lock Disabled' });
    }
  };

  // For Toast
  const handleHideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={{ height: StatusBar.currentHeight || 44 }} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1E293B" strokeWidth={2.5} />
        </PressableScale>
        <Text style={styles.headerTitle}>Privacy Check-up</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
      >
        {/* --- HERO SECTION --- */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <View style={styles.shieldBg}>
              <Shield size={48} color="#6366f1" strokeWidth={2} />
            </View>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={styles.statusText}>PROTECTED</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Device Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Review permissions granted to this device. These are controlled by your phone's OS settings.
          </Text>
        </View>

        {/* --- LIST CONTAINER --- */}
        <View style={styles.listContainer}>

          {/* 1. App Lock (Interactive Toggle) */}
          {biometricsSupported && (
            <PrivacySetting
              index={0}
              icon={Fingerprint}
              title="App Lock"
              description="Require FaceID/Fingerprint to open the app."
              isEnabled={biometricsEnabled}
              isToggle={true}
              onAction={handleBiometricToggle}
              theme={theme}
            />
          )}

          {/* 2. Notifications (Read-Only) */}
          <PrivacySetting
            index={1}
            icon={Bell}
            title="Notifications"
            description="Status of push notifications for this device."
            isEnabled={notificationStatus}
            isToggle={false}
            onAction={openSettings}
            theme={theme}
          />

          {/* 3. Location (Read-Only) */}
          <PrivacySetting
            index={2}
            icon={MapPin}
            title="Location Services"
            description="Status of location access for tracking."
            isEnabled={locationStatus}
            isToggle={false}
            onAction={openSettings}
            theme={theme}
          />

          {/* 4. Microphone (Read-Only) */}
          <PrivacySetting
            index={3}
            icon={Mic}
            title="Microphone"
            description="Status of microphone access for safety features."
            isEnabled={micStatus}
            isToggle={false}
            onAction={openSettings}
            theme={theme}
          />

        </View>

        {/* --- INSTRUCTION FOOTER --- */}
        <View style={styles.instructionContainer}>
          <Settings size={20} color="#64748B" style={{ marginBottom: 8 }} />
          <Text style={styles.instructionTitle}>How to fix denied permissions?</Text>
          <Text style={styles.instructionText}>
            If a permission shows as DENIED, you need to manually enable it in your device settings.{'\n\n'}
            <Text style={{ fontWeight: '700' }}>Steps:</Text>{'\n'}
            1. Tap "Open Device Settings" below{'\n'}
            2. Find "GlossCut Partner" in the app list{'\n'}
            3. Tap "Permissions"{'\n'}
            4. Enable Location and Microphone{'\n'}
            5. Return to this screen to see the updated status
          </Text>

          <TouchableOpacity onPress={openSettings} style={styles.openSettingsButton}>
            <Text style={styles.openSettingsText}>Open Device Settings</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Toast */}
      <ToastMessage
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        theme={theme}
        onHide={handleHideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  // --- HERO SECTION ---
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  heroIconWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#64748B',
    maxWidth: '85%',
    lineHeight: 22,
  },

  // --- CARD STYLES ---
  listContainer: {
    gap: 0,
  },
  cardOuter: {
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardRefDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },

  // --- STATUS BADGE (READ-ONLY) ---
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // --- INSTRUCTION FOOTER ---
  instructionContainer: {
    marginVertical: 40,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#F1F5F9', // Slate 100
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  openSettingsButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  openSettingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // --- TOAST ---
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIconContainer: { marginRight: 12 },
  toastTextContainer: { flex: 1 },
  toastTitle: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
  toastMessage: { fontSize: 13, color: '#64748b' },
});
