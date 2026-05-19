import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import OtpInput from "../components/OtpInput.jsx";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

const Header = memo(({ onBack, insets }) => (
  <View 
    style={[styles.headerOuterContainer, { paddingTop: Math.max(insets.top, 16) }]}
    accessibilityRole="header"
  >
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        onPress={onBack} 
        style={styles.backBtn}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Account Security</Text>
      <View style={{ width: normalize(40) }} />
    </View>
  </View>
));

const CustomToast = memo(({ visible, message, type, animatedValue }) => {
  if (!visible) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const isSuccess = type === "success";
  const iconColor = isSuccess ? "#10B981" : "#EF4444";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.toastContent, { borderLeftColor: iconColor }]}>
        {isSuccess ? <CheckCircle size={20} color={iconColor} /> : <AlertCircle size={20} color={iconColor} />}
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

export default function TwoFactorVerificationScreen({ navigation, route }) {
  const { email: userEmail } = route.params;
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [isDisabling, setIsDisabling] = useState(false);

  const { user, verifyTwoFactorOtp, disableTwoFactor, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(5)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    
    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        if (isMountedRef.current) setToast(p => ({ ...p, visible: false }));
      });
    }, 3000);
  }, []);

  const handleApiError = useCallback(
    (err, defaultMsg) => {
      console.error(err);
      if (!err.response) {
        showToast("No network connection.", "error");
      } else if (err.response.status >= 500) {
        showToast("Server is currently down.", "error");
      } else {
        showToast(err.response.data?.message || defaultMsg, "error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    isMountedRef.current = true;
    
    // Staggered Entrance Animation
    const animations = itemAnims.map((anim, i) => 
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(itemFades[i], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );

    Animated.stagger(100, animations).start();

    // Floating Loop Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSendOtp = useCallback(async () => {
    setIsSending(true);
    try {
      await api.post('/api/auth/2fa/send-otp', {}, { timeout: 8000 });
      showToast(`Verification code sent to ${userEmail}`, "success");
      setOtpSent(true);
    } catch (err) {
      handleApiError(err, "Failed to send verification code.");
    } finally {
      if (isMountedRef.current) setIsSending(false);
    }
  }, [userEmail, showToast, handleApiError]);

  const handleVerifyOtp = useCallback(async () => {
    Keyboard.dismiss();

    if (!otp || otp.length !== 6) {
      showToast("Please enter the complete 6-digit code.", "error");
      return;
    }

    setIsVerifying(true);

    try {
      const success = await verifyTwoFactorOtp(userEmail, otp);
      if (success) {
        showToast("Access Granted. Welcome back.", "success");
        setTimeout(() => {
          if (isMountedRef.current) navigation.goBack();
        }, 1200);
      } else {
        showToast("Invalid verification code.", "error");
      }
    } catch (err) {
      handleApiError(err, "Verification failed.");
    } finally {
      if (isMountedRef.current) setIsVerifying(false);
    }
  }, [otp, userEmail, verifyTwoFactorOtp, navigation, showToast, handleApiError]);

  const handleResendOtp = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post('/api/auth/2fa/send-otp', {}, { timeout: 8000 });
      showToast("A new code has been sent to your inbox.", "success");
    } catch (err) {
      handleApiError(err, "Could not resend code.");
    }
  }, [handleApiError, showToast]);

  const handleDisableTwoFactor = useCallback(async () => {
    setIsDisabling(true);
    try {
      const success = await disableTwoFactor();
      if (success) {
        showToast("Two-Factor Authentication disabled.", "success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showToast("Failed to disable Two-Factor Auth.", "error");
      }
    } catch (err) {
      handleApiError(err, "Failed to disable.");
    } finally {
      if (isMountedRef.current) setIsDisabling(false);
    }
  }, [disableTwoFactor, showToast, handleApiError]);

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Toast Notification */}
      <View style={[styles.toastWrapper, { top: insets.top + 10 }]}>
        <CustomToast visible={toast.visible} message={toast.message} type={toast.type} animatedValue={toastAnim} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Header onBack={() => navigation.goBack()} insets={insets} />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centeredContentWrapper}>
            {/* 1. Illustration Section */}
            <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
              <Image 
                source={require("../assets/two_factor_cartoon.png")} 
                style={styles.illustration}
                resizeMode="contain"
                accessibilityLabel="Verification Illustration"
              />
            </Animated.View>

            {/* 2. Text Header Section */}
            <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
              <Text style={styles.title}>Two-Factor Verification</Text>
              <Text style={styles.subtitle}>
                {user?.twoFactorEnabled ? "Your account is currently secured with Two-Factor Authentication." : !otpSent ? "Click below to receive a 6-digit verification code at" : "Enter the 6-digit verification code sent to"}{'\n'}
                {!user?.twoFactorEnabled && <Text style={{ fontWeight: "700", color: "#0F172A" }}>{userEmail}</Text>}
              </Text>
            </Animated.View>

            {/* 3. Dynamic Flow Section */}
            {user?.twoFactorEnabled ? (
              <Animated.View style={[animatedStyle(2), { marginBottom: normalize(30) }]}>
                <View style={{ backgroundColor: '#F0FDF4', padding: normalize(20), borderRadius: normalize(16), borderWidth: 1, borderColor: '#DCFCE7', alignItems: 'center', width: '100%', marginBottom: normalize(20) }}>
                  <ShieldCheck size={normalize(48)} color="#10B981" style={{ marginBottom: normalize(16) }} />
                  <Text style={{ fontSize: normalize(16), fontWeight: '800', color: '#166534', marginBottom: normalize(8) }}>Two-Factor Auth is Active</Text>
                  <Text style={{ fontSize: normalize(13), color: '#166534', textAlign: 'center', fontWeight: '500' }}>Your account is secured with an extra layer of protection.</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: '#EF4444' },
                    isDisabling && styles.submitBtnDisabled
                  ]}
                  activeOpacity={0.8}
                  onPress={handleDisableTwoFactor}
                  disabled={isDisabling}
                >
                  {isDisabling ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.submitBtnText, { marginLeft: 0 }]}>Disable Two-Factor Auth</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : !otpSent ? (
              <Animated.View style={[animatedStyle(2), { marginBottom: normalize(30) }]}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: theme.colors.primary },
                    isSending && styles.submitBtnDisabled
                  ]}
                  activeOpacity={0.8}
                  onPress={handleSendOtp}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Send Verification Code</Text>
                      <ArrowRight size={normalize(20)} color="#FFFFFF" strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <>
                {/* OTP Input Section */}
                <Animated.View style={[styles.inputWrapper, animatedStyle(2)]}>
                  <View style={styles.otpOuterWrapper}>
                    <OtpInput length={6} onComplete={setOtp} />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.helpLink} 
                    onPress={handleResendOtp}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.helpText}>
                      Code not received? <Text style={styles.resendAction}>RESEND NOW</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Submit Button */}
                <Animated.View style={[animatedStyle(3), { marginBottom: normalize(30) }]}>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { backgroundColor: theme.colors.primary },
                      (isVerifying || authLoading) && styles.submitBtnDisabled
                    ]}
                    activeOpacity={0.8}
                    onPress={handleVerifyOtp}
                    disabled={isVerifying || authLoading}
                  >
                    {isVerifying || authLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>Verify Code</Text>
                        <ArrowRight size={normalize(20)} color="#FFFFFF" strokeWidth={2.5} />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* 5. Footer Privacy Note */}
            <Animated.View style={[styles.noteContainer, animatedStyle(4)]}>
              <View style={styles.noteHeader}>
                <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.noteTitle}>SECURE SESSION</Text>
              </View>
              <Text style={styles.noteText}>
                Your account is protected with end-to-end encryption. We never share your verification codes.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  headerOuterContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    maxWidth: 500,
    width: "100%",
    alignSelf: "center"
  },
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  scrollContent: {
    paddingTop: normalize(10),
    width: "100%"
  },
  centeredContentWrapper: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: normalize(24)
  },
  illustrationContainer: {
    width: "100%",
    height: normalize(180),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(20)
  },
  illustration: {
    width: "85%",
    height: "100%"
  },
  textContainer: {
    marginBottom: normalize(28)
  },
  title: {
    fontSize: normalize(24),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
    marginBottom: normalize(10),
    textAlign: "center"
  },
  subtitle: {
    fontSize: normalize(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: normalize(20),
    fontWeight: "500",
    paddingHorizontal: normalize(10)
  },
  inputWrapper: {
    width: "100%",
    marginBottom: normalize(32)
  },
  otpOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(16),
  },
  helpLink: {
    alignItems: "center",
    marginTop: normalize(8)
  },
  helpText: {
    fontSize: normalize(12),
    color: "#64748B",
    fontWeight: "500"
  },
  resendAction: {
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: 0.3
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    gap: normalize(10),
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  submitBtnDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0
  },
  submitBtnText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7"
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    marginBottom: normalize(8)
  },
  noteTitle: {
    fontSize: normalize(11),
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1
  },
  noteText: {
    fontSize: normalize(11),
    color: "#166534",
    lineHeight: normalize(18),
    fontWeight: "500"
  },
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2000,
    alignItems: "center"
  },
  toastContainer: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: "#FFF",
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  toastContent: {
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toastTextContainer: {
    flex: 1
  },
  toastMessage: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  }
});
