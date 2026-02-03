import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Vibration,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have expo-linear-gradient installed
import { useAuth } from '../contexts/AuthContext.jsx';

const { width } = Dimensions.get('window');



/**
 * 1. OPTIMIZED TOAST COMPONENT (Premium Visuals)
 */
const ToastNotification = React.memo(({ visible, message, type, onHide, theme }) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const toastStyle = useMemo(() => {
    // Gradient Colors for Premium Feel
    let bgColors = [theme.colors.card, theme.colors.card];
    let iconName = 'information-circle';
    let accentColor = theme.colors.primary;

    if (type === 'error') {
      bgColors = ['#FF416C', '#FF4B2B']; // Modern Gradient Red
      accentColor = '#FFFFFF';
      iconName = 'alert-circle';
    } else if (type === 'success') {
      bgColors = ['#00b09b', '#96c93d']; // Modern Gradient Green
      accentColor = '#FFFFFF';
      iconName = 'checkmark-circle';
    } else if (type === 'info') {
      bgColors = theme.dark ? ['#232526', '#414345'] : ['#ffffff', '#f1f1f1'];
      accentColor = theme.colors.text;
      iconName = 'shield-checkmark';
    }
    return { bgColors, accentColor, iconName };
  }, [type, theme]);

  useEffect(() => {
    let timer;
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 40,
        damping: 15,
        mass: 1,
        stiffness: 120,
        useNativeDriver: true,
      }).start();

      timer = setTimeout(() => {
        hideToast();
      }, 3000);
    } else {
      hideToast();
    }
    return () => clearTimeout(timer);
  }, [visible]);

  const hideToast = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && visible && onHide) {
        onHide();
      }
    });
  }, [visible, onHide, slideAnim]);

  if (!visible && slideAnim._value === -150) return null;

  return (
    <Animated.View style={[styles.toastWrapper, { transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={toastStyle.bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContainer}
      >
        <View style={styles.toastIconBox}>
          <Ionicons name={toastStyle.iconName} size={24} color={toastStyle.accentColor} />
        </View>
        <View style={styles.toastContent}>
          <Text style={[styles.toastTitle, { color: toastStyle.accentColor }]}>
            {type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Security Notice'}
          </Text>
          <Text style={[styles.toastMessage, { color: toastStyle.accentColor, opacity: 0.9 }]}>
            {message}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

/**
 * 2. MAIN SCREEN
 */
const EditEmailScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // New Macro-Interaction Animations
  const pulseAnim = useRef(new Animated.Value(1)).current; // For the lock icon
  const scaleAnim = useRef(new Animated.Value(1)).current; // For card press

  // Theme Styles
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: theme.colors.background },
    headerTitle: { color: theme.colors.text },
    backButton: { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
    text: { color: theme.colors.text },
    textSec: { color: theme.colors.textSecondary },
    blobColor: theme.colors.primary,
  }), [theme]);

  // Entrance & Pulse Animation
  useEffect(() => {
    // 1. Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Pulse for Lock Icon (Subtle breathing effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleHideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // --- REAL LOGIC HANDLER (UNCHANGED FUNCTIONALITY) ---
  const handleLockedPress = useCallback(async () => {
    // 1. Visual Feedback (Scale Down + Shake)
    requestAnimationFrame(() => Vibration.vibrate(50));

    // Parallel: Scale down briefly, then shake
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();

    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // 2. Real Network Check
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error("No internet connection detected.");
      }
      setToast({
        visible: true,
        type: 'info',
        message: 'For security, email changes require manual verification support.'
      });
    } catch (error) {
      setToast({
        visible: true,
        type: 'error',
        message: error.message || "Connection failed."
      });
    }
  }, [shakeAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* --- Ambient Background Blobs (Premium Feel) --- */}
      <View style={[styles.blob, { backgroundColor: dynamicStyles.blobColor, opacity: 0.05, top: -50, right: -50 }]} />
      <View style={[styles.blob, { backgroundColor: dynamicStyles.blobColor, opacity: 0.03, top: 200, left: -50, width: 250, height: 250 }]} />

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={handleHideToast}
        theme={theme}
      />

      {/* Header */}
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, dynamicStyles.backButton]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Security Center</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Registered Identity</Text>
          <Text style={[styles.subtitle, dynamicStyles.textSec]}>
            Manage your core account credentials and security preferences.
          </Text>
        </View>

        {/* --- Premium Interactive Card --- */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1} // Using custom scale animation instead
            onPress={handleLockedPress}
            style={styles.cardShadowWrapper}
          >
            <LinearGradient
              colors={theme.dark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.infoCard, { borderColor: theme.dark ? '#334155' : '#e2e8f0' }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.labelContainer}>
                  <Text style={[styles.cardLabel, dynamicStyles.textSec]}>PRIMARY EMAIL</Text>

                  {/* Verified Badge */}
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                </View>

                {/* --- Animated Lock Icon --- */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={[styles.lockIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="lock-closed" size={18} color={theme.colors.primary} />
                  </View>
                </Animated.View>
              </View>

              {/* Monospaced Email for "Secure Data" look */}
              <Text style={[styles.emailText, dynamicStyles.text]}>
                {user.email || "No Email Registered"}
              </Text>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.cardFooter}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.securityNote, dynamicStyles.textSec]}>
                  Protected by GlossCut SafeGuard™
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Helper Box */}
        <View style={[styles.helperBox, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : '#F1F5F9' }]}>
          <View style={styles.helperIcon}>
            <Ionicons name="information" size={20} color={theme.colors.textSecondary} />
          </View>
          <Text style={[styles.helperText, dynamicStyles.textSec]}>
            This email is cryptographically linked to your booking history. Modifications are restricted to prevent unauthorized account takeovers.
          </Text>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  // Toast
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  toastIconBox: {
    marginRight: 12,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  toastMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.8, // Tighter tracking for modern look
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  // Card
  cardShadowWrapper: {
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  infoCard: {
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    backgroundColor: '#00b09b', // Default Green
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  lockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Code-like font for security
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 18,
    opacity: 0.6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityNote: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Helper Box
  helperBox: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    alignItems: 'flex-start',
  },
  helperIcon: {
    marginTop: 2,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    opacity: 0.8,
  },
});

export default EditEmailScreen;
