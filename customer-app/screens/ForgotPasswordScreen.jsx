import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  KeyRound,
  Lock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react-native";
import api from "../utils/api";

const { width } = Dimensions.get("window");

/**
 * ------------------------------------------------------------------
 * 1. OPTIMIZED STATIC COMPONENTS (Defined outside to prevent re-renders)
 * ------------------------------------------------------------------
 */

// Memoized Header: Never re-renders on typing
const Header = React.memo(({ onBack }) => (
  <View style={styles.navBar}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <ChevronLeft size={24} color="#000" />
    </TouchableOpacity>
  </View>
));

// Memoized Illustration: SVGs are heavy, this locks them from re-rendering
const Illustration = React.memo(({ primaryColor }) => (
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

// Memoized Footer: Pure static text
const Footer = React.memo(() => (
  <View style={styles.footer}>
    <ShieldCheck size={16} color="#10B981" />
    <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
  </View>
));

// Memoized Alert: Prevents layout thrashing
const ModernAlert = React.memo(
  ({ visible, config, onClose, topInset = 50 }) => {
    const translateY = useRef(new Animated.Value(-200)).current;

    useEffect(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: topInset,
          useNativeDriver: true,
          friction: 9,
          tension: 50,
        }).start();

        const timer = setTimeout(() => handleClose(), 3500);
        return () => clearTimeout(timer);
      } else {
        translateY.setValue(-200);
      }
    }, [visible]); // Only runs when 'visible' changes

    const handleClose = () => {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        if (visible) onClose();
      });
    };

    if (!visible && translateY._value === -200) return null;

    const stylesConfig = {
      success: {
        bg: "#F0FDF4",
        border: "#22C55E",
        icon: <CheckCircle size={24} color="#22C55E" fill="#DCFCE7" />,
      },
      error: {
        bg: "#FEF2F2",
        border: "#EF4444",
        icon: <XCircle size={24} color="#EF4444" fill="#FEE2E2" />,
      },
      warning: {
        bg: "#FFFBEB",
        border: "#F59E0B",
        icon: <AlertTriangle size={24} color="#F59E0B" fill="#FEF3C7" />,
      },
      info: {
        bg: "#EFF6FF",
        border: "#3B82F6",
        icon: <Info size={24} color="#3B82F6" fill="#DBEAFE" />,
      },
    };

    const currentStyle = stylesConfig[config.type] || stylesConfig.info;

    return (
      <Animated.View
        style={[styles.alertWrapper, { transform: [{ translateY }] }]}
      >
        <View
          style={[
            styles.alertContainer,
            { borderLeftColor: currentStyle.border },
          ]}
        >
          <View style={styles.alertIconArea}>{currentStyle.icon}</View>
          <View style={styles.alertTextArea}>
            <Text style={styles.alertTitle}>{config.title}</Text>
            <Text style={styles.alertMsg} numberOfLines={2}>
              {config.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
);

/**
 * ------------------------------------------------------------------
 * 2. MAIN COMPONENT
 * ------------------------------------------------------------------
 */
const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();

  // State
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [alert, setAlert] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  // Animations
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Run only once on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Optimized Callbacks (Stable Identity) ---

  const showAlert = useCallback((type, title, message) => {
    setAlert({ visible: true, type, title, message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSupport = useCallback(() => {
    showAlert("info", "Support", "Please contact support@gloss.cut");
  }, [showAlert]);

  const validateEmail = useCallback((text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError("Email address is required");
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  }, []);

  const handleSendOTP = useCallback(async () => {
    Keyboard.dismiss();

    const isValid = validateEmail(email);
    if (!isValid) {
      showAlert(
        "error",
        "Invalid Input",
        "Please fix the errors highlighted below."
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.post(
        `/api/password/forgot`,
        { email }
      );

      showAlert(
        "success",
        "OTP Sent!",
        "Check your inbox for the verification code."
      );

      setTimeout(() => {
        navigation.navigate("OTPVerification", { email });
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.msg || "Unable to connect to server.";
      showAlert("error", "Request Failed", msg);
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, showAlert, navigation]);

  // Optimized Handlers for Input
  const handleInputFocus = useCallback(() => setIsFocused(true), []);
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    validateEmail(email);
  }, [email, validateEmail]);
  const handleInputChange = useCallback(
    (text) => {
      setEmail(text);
      if (emailError) setEmailError("");
    },
    [emailError]
  );

  // Memoized Input Styles to prevent recalc during render
  const inputStyle = useMemo(() => {
    let borderColor = "#F7F8F9";
    let bg = "#F7F8F9";

    if (emailError) {
      borderColor = "#EF4444";
      bg = "#FEF2F2";
    } else if (isFocused) {
      borderColor = theme.colors.primary;
      bg = "#ffffff";
    }

    return [
      styles.inputWrapper,
      { backgroundColor: bg, borderColor, borderWidth: 2 },
    ];
  }, [emailError, isFocused, theme.colors.primary]);

  const buttonStyle = useMemo(
    () => [styles.submitBtn, { backgroundColor: theme.colors.primary }],
    [theme.colors.primary]
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Alert is now memoized */}
      <ModernAlert visible={alert.visible} config={alert} onClose={hideAlert} />

      <SafeAreaView style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          {/* Static Header */}
          <Header onBack={handleGoBack} />

          <View style={styles.contentContainer}>
            {/* Static Illustration */}
            <Illustration primaryColor={theme.colors.primary} />

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <Text style={styles.heading}>Forgot Password?</Text>
              <Text style={styles.subHeading}>
                Don't worry! It happens. Please enter the address associated
                with your account.
              </Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Email Address</Text>

                <View style={inputStyle}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="glosscut@company.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={handleInputChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    cursorColor={theme.colors.primary}
                  />
                </View>

                {emailError ? (
                  <View style={styles.inlineErrorContainer}>
                    <AlertCircle size={12} color="#EF4444" />
                    <Text style={styles.inlineErrorText}>{emailError}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendOTP}
                style={buttonStyle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Send OTP</Text>
                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpLink} onPress={handleSupport}>
                <Text
                  style={[
                    styles.helpText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Having trouble?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Static Footer */}
          <Footer />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#ffffff" },
  flexOne: { flex: 1 },

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
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    height: "100%",
  },

  inlineErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 4,
    gap: 4,
  },
  inlineErrorText: { fontSize: 13, color: "#EF4444", fontWeight: "500" },

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
  btnText: { fontSize: 17, fontWeight: "700", color: "#fff" },

  helpLink: { alignItems: "center", marginTop: 24 },
  helpText: { fontSize: 14, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8,
  },
  footerText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  alertContainer: {
    width: width - 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  alertIconArea: { marginRight: 12, marginTop: 2 },
  alertTextArea: { flex: 1, marginRight: 8 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  alertMsg: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 18,
  },
});

export default ForgotPasswordScreen;
