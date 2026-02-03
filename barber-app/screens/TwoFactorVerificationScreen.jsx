import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Vibration,
  Easing,
  SafeAreaView
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import api from "../utils/api";
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import OtpInput from '../components/OtpInput.jsx';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------
// 1. ISOLATED COMPONENTS (Memoized for Performance)
// ---------------------------------------------------------

const BackgroundDecorations = memo(({ theme }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.blob, {
      backgroundColor: theme.colors.primary,
      opacity: theme.dark ? 0.04 : 0.03,
      top: -120, right: -80, width: 350, height: 350, borderRadius: 175
    }]} />
    <View style={[styles.blob, {
      backgroundColor: theme.colors.primary,
      opacity: theme.dark ? 0.03 : 0.02,
      bottom: -50, left: -50, width: 200, height: 200, borderRadius: 100
    }]} />
  </View>
), (prev, next) => prev.theme.dark === next.theme.dark);

const PremiumHeader = memo(({ onBackPress, theme }) => (
  <View style={styles.topBar}>
    <TouchableOpacity
      onPress={() => {
        // Light haptic only
        Vibration.vibrate(5);
        onBackPress();
      }}
      style={[styles.backButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon name="arrow-left" size={24} color={theme.colors.text} />
    </TouchableOpacity>
  </View>
));

const PremiumTitle = memo(({ theme, userEmail }) => (
  <View style={styles.titleContainer}>
    <View style={[styles.iconContainer, { backgroundColor: theme.colors.card }]}>
      <Icon name="shield" size={32} color={theme.colors.primary} />
      <View style={[styles.iconBadge, { backgroundColor: '#4CAF50', borderColor: theme.colors.card }]}>
        <Icon name="check" size={10} color="#FFF" />
      </View>
    </View>
    <Text allowFontScaling={false} style={[styles.headerTitle, { color: theme.colors.text }]}>
      Verification
    </Text>
    <Text allowFontScaling={false} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
      We've sent a code to <Text style={{ fontWeight: '700', color: theme.colors.text }}>{userEmail}</Text>
    </Text>
  </View>
));

const TopNotification = memo(({ notification, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (notification.visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 50 : 40,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();

      if (notification.type === 'success') {
        Vibration.vibrate([0, 20]);
      } else {
        Vibration.vibrate([0, 50]);
      }

      const timer = setTimeout(() => hideAlert(), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => {
      if (onHide) onHide();
    });
  };

  if (!notification.visible) return null;

  const isError = notification.type === 'error';
  const bgColor = theme.dark ? '#1A1A1A' : '#FFFFFF';
  const textColor = theme.colors.text;
  const accentColor = isError ? '#FF4B4B' : '#00C853';
  const iconName = isError ? 'alert-circle' : 'check-circle';

  return (
    <Animated.View style={[
      styles.notificationWrapper,
      { transform: [{ translateY }] }
    ]}>
      <View style={[styles.notificationContainer, { backgroundColor: bgColor }]}>
        <View style={[styles.notificationIconBox, { backgroundColor: isError ? '#FFEBEE' : '#E8F5E9' }]}>
          <Icon name={iconName} size={24} color={accentColor} />
        </View>
        <View style={styles.notificationContent}>
          <Text allowFontScaling={false} style={[styles.notificationTitle, { color: textColor }]}>
            {isError ? 'Action Required' : 'Success'}
          </Text>
          <Text allowFontScaling={false} style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
            {notification.message}
          </Text>
        </View>
        <TouchableOpacity onPress={hideAlert} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Icon name="x" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const ResendTimer = memo(({ onResend, theme, triggerAlert }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handlePress = () => {
    if (canResend) {
      onResend();
      setTimeLeft(30);
      setCanResend(false);
    } else {
      triggerAlert('error', `Please wait ${timeLeft}s before resending.`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.resendButton}
      onPress={handlePress}
      activeOpacity={canResend ? 0.7 : 1}
    >
      <Text allowFontScaling={false} style={[
        styles.resendButtonText,
        { color: canResend ? theme.colors.primary : theme.colors.textSecondary }
      ]}>
        {canResend ? "Resend Code" : `Resend code in ${timeLeft}s`}
      </Text>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------
// 2. MAIN COMPONENT
// ---------------------------------------------------------

export default function TwoFactorVerificationScreen({ navigation, route }) {
  const userEmail = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyTwoFactorOtp, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Memoized Alert Handlers
  const showAlert = useCallback((type, message) => {
    setNotification({ visible: true, type, message });
  }, []);

  const hideAlert = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    let mounted = true;
    const sendOtp = async () => {
      try {
        await api.post('/api/auth/2fa/send-otp', {}, {
          timeout: 15000 // Increased timeout for production
        });
      } catch (err) {
        if (mounted) {
          // No console.log in production
          const msg = err.response?.data?.msg || "Unable to reach server. Please check your connection.";
          showAlert('error', msg);
        }
      }
    };
    sendOtp();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.poly(4))
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }),
    ]).start();

    return () => { mounted = false; };
  }, []);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  }, [shakeAnim]);

  const handleVerifyOtp = async () => {
    Keyboard.dismiss(); // Ensure keyboard is gone

    if (otp.length !== 6) {
      triggerShake();
      showAlert('error', 'Please enter the complete 6-digit code.');
      return;
    }

    setIsVerifying(true);

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const success = await verifyTwoFactorOtp(userEmail, otp);

      if (success) {
        showAlert('success', 'Verified successfully');
        // Slight delay to allow success animation
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        triggerShake();
        showAlert('error', 'Incorrect code. Please check and try again.');
      }
    } catch (error) {
      triggerShake();
      showAlert('error', 'Verification failed. Please check your internet.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = useCallback(async () => {
    try {
      // Add your API call here if needed
      showAlert('success', 'A new code has been sent.');
    } catch (e) {
      showAlert('error', 'Could not resend code. Try again later.');
    }
  }, [showAlert]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

        <BackgroundDecorations theme={theme} />
        <TopNotification notification={notification} onHide={hideAlert} theme={theme} />

        <SafeAreaView style={styles.safeArea}>
          <PremiumHeader onBackPress={handleBack} theme={theme} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flexContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.contentContainer}>

              <Animated.View style={[styles.animatedContent, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { translateX: shakeAnim }]
              }]}>
                <PremiumTitle theme={theme} userEmail={userEmail} />

                <View style={styles.otpWrapper}>
                  <OtpInput length={6} onComplete={setOtp} />
                </View>

                <ResendTimer onResend={handleResendOtp} theme={theme} triggerAlert={showAlert} />
              </Animated.View>

              <Animated.View style={[styles.bottomContainer, { transform: [{ scale: buttonScale }] }]}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: (otp.length === 6 && !isVerifying && !isLoading) ? 1 : 0.5,
                      shadowColor: theme.colors.primary,
                    }
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 6 || isVerifying || isLoading}
                  activeOpacity={0.9}
                >
                  {isVerifying || isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text allowFontScaling={false} style={styles.primaryButtonText}>Verify & Proceed</Text>
                      <Icon name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flexContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  blob: {
    position: 'absolute',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationWrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    width: width - 32, // More standard margin
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  notificationIconBox: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1, marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14, fontWeight: '700', marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13, lineHeight: 18,
  },
  animatedContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  titleContainer: {
    marginBottom: 35, alignItems: 'center',
  },
  iconContainer: {
    width: 72, height: 72,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 5,
  },
  iconBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', marginBottom: 8,
    letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, lineHeight: 22, textAlign: 'center',
    paddingHorizontal: 10,
  },
  otpWrapper: {
    marginVertical: 10, height: 70, justifyContent: 'center',
  },
  resendButton: {
    paddingVertical: 16, alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14, fontWeight: '600',
  },
  bottomContainer: {
    marginBottom: Platform.OS === 'ios' ? 20 : 30, width: '100%',
  },
  primaryButton: {
    height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 15, elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row', alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.5,
  },
});