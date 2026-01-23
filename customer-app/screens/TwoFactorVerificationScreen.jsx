import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Easing,
  Keyboard,
} from "react-native";

import api from "../utils/api";
import {
  ChevronLeft,
  ShieldCheck,
  KeyRound,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  WifiOff,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import OtpInput from "../components/OtpInput.jsx";

// --- OPTIMIZATION: Extract Screen Width once ---
const { width } = Dimensions.get("window");

/**
 * ------------------------------------------------------------------
 * COMPONENT: TopToast (MEMOIZED)
 * Prevents re-rendering the alert system when user types in Input.
 * ------------------------------------------------------------------
 */
const TopToast = memo(({ visible, message, type, translateY }) => {
  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 size={24} color="#10B981" fill="#D1FAE5" />,
          border: "#10B981",
          bg: "#FFFFFF",
        };
      case "error":
        return {
          icon: <XCircle size={24} color="#EF4444" fill="#FEE2E2" />,
          border: "#EF4444",
          bg: "#FFFFFF",
        };
      case "warning":
        return {
          icon: <AlertCircle size={24} color="#F59E0B" fill="#FEF3C7" />,
          border: "#F59E0B",
          bg: "#FFFFFF",
        };
      case "offline":
        return {
          icon: <WifiOff size={24} color="#6B7280" />,
          border: "#374151",
          bg: "#F3F4F6",
        };
      default:
        return {
          icon: <CheckCircle2 size={24} color="#10B981" />,
          border: "#10B981",
          bg: "#FFFFFF",
        };
    }
  };

  const themeStyle = getTheme();

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.toastContent,
          {
            borderLeftColor: themeStyle.border,
            backgroundColor: themeStyle.bg,
          },
        ]}
      >
        <View style={styles.toastIcon}>{themeStyle.icon}</View>
        <Text style={styles.toastText} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
});

/**
 * ------------------------------------------------------------------
 * COMPONENT: IllustrationView (MEMOIZED)
 * Heavy SVG logic isolated here so it doesn't re-render on keystrokes.
 * ------------------------------------------------------------------
 */
const IllustrationView = memo(({ primaryColor }) => (
  <View style={styles.illustrationArea}>
    <View style={[styles.circleBack, { backgroundColor: primaryColor + "15" }]}>
      <View
        style={[styles.circleFront, { backgroundColor: primaryColor + "25" }]}
      >
        <KeyRound size={48} color={primaryColor} />
        <View style={styles.lockBadge}>
          <Lock size={14} color="#fff" strokeWidth={3} />
        </View>
      </View>
    </View>
  </View>
));

/**
 * ------------------------------------------------------------------
 * COMPONENT: FooterView (MEMOIZED)
 * Static footer text isolated to prevent unnecessary updates.
 * ------------------------------------------------------------------
 */
const FooterView = memo(() => (
  <View style={styles.footer}>
    <ShieldCheck size={16} color="#10B981" />
    <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
  </View>
));

/**
 * ------------------------------------------------------------------
 * MAIN SCREEN
 * ------------------------------------------------------------------
 */
export default function TwoFactorVerificationScreen({ navigation, route }) {
  const { email: userEmail } = route.params;
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // OPTIMIZATION: Destructure only what's needed to avoid effect firing
  const { verifyTwoFactorOtp, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();

  // Animation Refs (Created once, never re-created)
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(-150)).current;

  // State for Toast
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const toastTimeout = useRef(null);

  // --- LOGIC: Toast Handler (Memoized) ---
  const showToast = useCallback(
    (message, type = "success") => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);

      setToast({ visible: true, message, type });

      Animated.spring(toastAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true, // GPU Acceleration
      }).start();

      toastTimeout.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: -150,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setToast((prev) => ({ ...prev, visible: false })));
      }, 3500);
    },
    [toastAnim]
  );

  // --- LOGIC: Error Handling (Crash Proofing) ---
  const handleApiError = useCallback(
    (err, defaultMsg) => {
      console.error(err);
      if (!err.response) {
        showToast(
          "No internet connection. Please check your network.",
          "offline"
        );
      } else if (err.response.status >= 500) {
        showToast("Server is currently down. Please try again later.", "error");
      } else {
        showToast(err.response.data?.message || defaultMsg, "error");
      }
    },
    [showToast]
  );

  // --- EFFECT: Initialize (Mount Only) ---
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // 1. Run Animations (Native Driver)
      Animated.parallel([
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Send OTP
      try {
        await api.post('/api/auth/2fa/send-otp', {}, { timeout: 8000 });
      } catch (err) {
        if (isMounted) handleApiError(err, "Failed to send verification code.");
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []); // Empty dependency array = Runs once

  // --- ACTION: Verify ---
  const handleVerifyOtp = useCallback(async () => {
    Keyboard.dismiss();

    if (!otp || otp.length !== 6) {
      showToast("Please enter the complete 6-digit code.", "warning");
      return;
    }

    setIsVerifying(true);

    try {
      const success = await verifyTwoFactorOtp(userEmail, otp);
      if (success) {
        showToast("Verification Successful!", "success");
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        showToast("Invalid Code. Please check and try again.", "error");
      }
    } catch (err) {
      handleApiError(err, "Verification failed. Please try again.");
    } finally {
      if (isMountedRef.current) setIsVerifying(false);
    }
  }, [
    otp,
    userEmail,
    verifyTwoFactorOtp,
    navigation,
    showToast,
    handleApiError,
  ]);

  // --- ACTION: Resend ---
  const handleResendOtp = useCallback(async () => {
    try {
      await api.post(
        '/api/auth/2fa/send-otp',
        {},
        { timeout: 8000 }
      );
      showToast("New code sent successfully!", "success");
    } catch (err) {
      handleApiError(err, "Could not resend code.");
    }
  }, [handleApiError, showToast]);

  // Ref to track mount status for async state updates
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Toast is absolutely positioned, so placement here is fine */}
      <TopToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        translateY={toastAnim}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {/* Optimized Illustration Component */}
            <IllustrationView primaryColor={theme.colors.primary} />

            {/* Animated Form Content */}
            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <Text style={styles.heading}>Two-Factor Authentication</Text>
              <Text style={styles.subHeading}>
                Enter the 6-digit code sent to {userEmail}
              </Text>

              <View style={styles.inputSection}>
                <View style={styles.otpWrapper}>
                  {/* Ensure OtpInput is optimized internally if possible, but here we just pass the handler */}
                  <OtpInput length={6} onComplete={setOtp} />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleVerifyOtp}
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.colors.primary },
                  (isVerifying || authLoading) && styles.disabledBtn,
                ]}
                disabled={isVerifying || authLoading}
              >
                {isVerifying || authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpLink}
                onPress={handleResendOtp}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.helpText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Didn't receive code?{" "}
                  <Text style={{ color: theme.colors.primary }}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Optimized Footer Component */}
          <FooterView />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  // --- TOAST ---
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 40 + StatusBar.currentHeight : 50,
  },
  toastContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIcon: { marginRight: 12 },
  toastText: { fontSize: 14, fontWeight: "600", color: "#1F2937", flex: 1 },

  // --- LAYOUT ---
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  backBtn: {
    marginTop: 26,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 80,
  },
  // --- ILLUSTRATION ---
  illustrationArea: { alignItems: "center", marginBottom: 40 },
  circleBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  circleFront: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  lockBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  // --- TEXT & INPUT ---
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: "500",
  },
  inputSection: { marginBottom: 24 },
  otpWrapper: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#F7F8F9",
    borderColor: "#F7F8F9",
  },
  // --- BUTTONS ---
  submitBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledBtn: { opacity: 0.7 },
  btnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  helpLink: { alignItems: "center", marginTop: 24 },
  helpText: { fontSize: 14, fontWeight: "600" },
  // --- FOOTER ---
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8,
  },
  footerText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
});
