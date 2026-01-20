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
  Dimensions
} from 'react-native';
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
  Fingerprint
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LinearGradient } from 'expo-linear-gradient';

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

// --- 3. OPTIMIZED PRIVACY CARD (MATCHING REFERENCE IMAGE) ---
const PrivacySetting = memo(({ icon: Icon, title, description, isEnabled, onToggle, theme, index }) => {
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

  const handleToggle = useCallback((val) => {
    Vibration.vibrate(10);
    onToggle(val);
  }, [onToggle]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 16 }}>
      <PressableScale activeScale={0.98}>
        {/* Outer Gray Container (The "Frame" from the image) */}
        <View style={[styles.cardOuter, { backgroundColor: '#CFCFCF' }]}>
          {/* Inner White Container (The content area) */}
          <View style={[styles.cardInner, { backgroundColor: '#FFFFFF' }]}>

            {/* Icon Box (Purple Square) */}
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

            {/* Switch */}
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#6366f1' }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E2E8F0"
              onValueChange={handleToggle}
              value={isEnabled}
              style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}, (prev, next) => prev.isEnabled === next.isEnabled && prev.theme.isDark === next.theme.isDark);

// --- 4. MAIN SCREEN ---
export default function PrivacyCheckupScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { biometricsEnabled, toggleBiometrics, biometricsSupported } = useAuth(); // Get Auth State

  // State
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(true);

  // UI State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);

  // Logic
  const performSecureSave = useCallback(async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const isNetworkAvailable = Math.random() > 0.05; // 95% success rate
        if (!isNetworkAvailable) {
          reject({ code: 'NETWORK_ERROR', message: 'Weak internet connection.' });
        } else {
          resolve(true);
        }
      }, 1000);
    });
  }, []);

  const handleSave = useCallback(async () => {
    Vibration.vibrate(20);
    setIsSaving(true);
    try {
      if (!locationEnabled) {
        setIsSaving(false);
        setToast({ visible: true, type: 'error', message: 'Location services are required.' });
        return;
      }
      await performSecureSave();
      setIsSaving(false);
      setToast({ visible: true, type: 'success', message: 'Privacy preferences updated.' });
    } catch (error) {
      setIsSaving(false);
      const isNetworkError = error.code === 'NETWORK_ERROR';
      setToast({ visible: true, type: isNetworkError ? 'offline' : 'error', message: error.message });
    }
  }, [locationEnabled, performSecureSave]);

  const handleHideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle Biometric Toggle
  const handleBiometricToggle = async (value) => {
    Vibration.vibrate(20);
    const success = await toggleBiometrics(value);
    if (!success) {
      setToast({ visible: true, type: 'error', message: 'Authentication failed. App Lock not enabled.' });
    } else {
      setToast({ visible: true, type: 'success', message: value ? 'App Lock Enabled' : 'App Lock Disabled' });
    }
  };

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
            {/* Soft Purple Background for Shield */}
            <View style={styles.shieldBg}>
              <Shield size={48} color="#6366f1" strokeWidth={2} />
            </View>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={styles.statusText}>SECURE</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Data Controls</Text>
          <Text style={styles.sectionSubtitle}>
            Manage how your data is used to ensure a safe and personalized experience.
          </Text>
        </View>

        {/* --- LIST CONTAINER --- */}
        <View style={styles.listContainer}>

          {/* Only show if hardware supports it */}
          {biometricsSupported && (
            <PrivacySetting
              index={0}
              icon={Fingerprint}
              title="App Lock"
              description="Require FaceID/Fingerprint to open the app."
              isEnabled={biometricsEnabled}
              onToggle={handleBiometricToggle}
              theme={theme}
            />
          )}

          <PrivacySetting
            index={1}
            icon={Bell}
            title="Notifications"
            description="Get real-time updates on your ride status and offers."
            isEnabled={notificationEnabled}
            onToggle={setNotificationEnabled}
            theme={theme}
          />
          <PrivacySetting
            index={2}
            icon={MapPin}
            title="Location Services"
            description="Required for accurate pickup points and tracking."
            isEnabled={locationEnabled}
            onToggle={setLocationEnabled}
            theme={theme}
          />
          <PrivacySetting
            index={3}
            icon={Mic}
            title="Microphone"
            description="Allow audio recording during trips for safety."
            isEnabled={microphoneEnabled}
            onToggle={setMicrophoneEnabled}
            theme={theme}
          />
          <PrivacySetting
            index={4}
            icon={Camera}
            title="Camera"
            description="For profile picture and identity verification."
            isEnabled={cameraEnabled}
            onToggle={setCameraEnabled}
            theme={theme}
          />
          <PrivacySetting
            index={5}
            icon={Users}
            title="Contacts"
            description="Share ride details with friends & family easily."
            isEnabled={contactsEnabled}
            onToggle={setContactsEnabled}
            theme={theme}
          />
        </View>
      </ScrollView>

      {/* --- FOOTER --- */}
      <View style={styles.footer}>
        <PressableScale onPress={handleSave} disabled={isSaving}>
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, { opacity: isSaving ? 0.8 : 1 }]}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Text>
          </LinearGradient>
        </PressableScale>
      </View>

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
    backgroundColor: '#E2E8F0', // Light Gray Square from image
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
    backgroundColor: '#F3E8FF', // Very light purple circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -14, // Overlap effect
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D1FAE5', // Light green pill
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

  // --- CARD STYLES (THE GRAY FRAME EFFECT) ---
  listContainer: {
    gap: 0,
  },
  cardOuter: {
    borderRadius: 20,
    padding: 5, // Creates the gray "border/frame" effect
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

  // --- FOOTER ---
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
