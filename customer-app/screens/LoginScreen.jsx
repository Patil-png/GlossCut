import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  StatusBar,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ChevronLeft
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withDelay,
  FadeIn,
  FadeOut,
  withRepeat,
  Easing
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../src/theme/colors";
import { Layout } from "../src/theme/layout";
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- RESPONSIVE HELPERS ---
const isSmallDevice = SCREEN_WIDTH < 375;
const scaleFont = (size) => Math.round(size * (SCREEN_WIDTH / 375));
const adaptiveHeight = (size) => Math.round(size * (SCREEN_HEIGHT / 812));

// --- VALIDATION HELPERS ---
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ==========================================
// 1. PROFESSIONAL SUB-COMPONENTS
// ==========================================

// Interactive Input Component with Real-time Validation
const CustomInput = memo(({
  placeholder,
  value,
  onChangeText,
  icon: Icon,
  isPassword,
  secureTextEntry,
  toggleSecure,
  index,
  isValid,
  showValidation,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputOpacity = useSharedValue(0);
  const inputTranslateY = useSharedValue(20);

  // Floating Label Animation
  const labelTranslateY = useSharedValue(0);
  const labelScale = useSharedValue(1);
  const labelColor = useSharedValue("#9CA3AF");

  useEffect(() => {
    inputOpacity.value = withDelay(100 * index, withTiming(1, { duration: 500 }));
    inputTranslateY.value = withDelay(100 * index, withTiming(0, { duration: 500 }));
  }, []);

  useEffect(() => {
    const isActive = isFocused || value.length > 0;
    labelTranslateY.value = withTiming(isActive ? -28 : 0, { duration: 250 });
    labelScale.value = withTiming(isActive ? 0.75 : 1, { duration: 250 });
    labelColor.value = withTiming(isActive ? "#E21D25" : "#6B7280", { duration: 200 });
  }, [isFocused, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }]
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(isFocused ? "#E21D25" : "#D1D5DB", { duration: 200 }),
    borderWidth: withTiming(isFocused ? 1.5 : 1, { duration: 200 }),
    backgroundColor: "#FFFFFF",
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelTranslateY.value },
      { scale: labelScale.value },
    ],
    color: labelColor.value,
    backgroundColor: (isFocused || value.length > 0) ? "#FFFFFF" : "transparent",
    paddingHorizontal: (isFocused || value.length > 0) ? 8 : 0,
    marginLeft: -4,
  }));

  return (
    <Animated.View style={[styles.inputContainer, animatedStyle, borderStyle]}>
      <View style={styles.inputIconWrapper}>
        <Icon size={18} color={isFocused ? "#E21D25" : "#9CA3AF"} />
      </View>

      <View style={styles.inputWrapper}>
        <Animated.Text style={[styles.floatingLabel, labelStyle]}>
          {placeholder}
        </Animated.Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          placeholder=""
          {...props}
        />
      </View>

      <View style={styles.rightIconContainer}>
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleSecure();
            }}
          >
            {secureTextEntry ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// Premium Animated Loader
const AnimatedLoader = memo(({ size = 24, color = "#FFFFFF" }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
});

// Interactive Primary Button with Press Scale
const PrimaryButton = memo(({ onPress, title, isLoading, disabled }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        activeOpacity={1}
      >
        <View style={styles.loginButton}>
          {isLoading ? (
            <AnimatedLoader size={24} color="#FFFFFF" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.loginButtonText}>{title}</Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Brand Decoration (Integrated from Splash Screen)
const BrandDecor = memo(() => (
  <View style={styles.brandDecorContainer}>
    <View style={styles.redLine} />
    <View style={styles.dotsWrapper}>
      <View style={styles.decorDot} />
      <View style={styles.decorDot} />
    </View>
  </View>
));

// Header Component
const LoginHeader = memo(({ insets, onBackPress, onRegisterPress }) => (
  <View style={[styles.header, { paddingTop: insets.top + adaptiveHeight(20) }]}>
    <View style={styles.topNav}>
      <View />
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRegisterPress();
        }}
        style={styles.pillButton}
      >
        <Text style={styles.pillButtonText}>Register</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.animationContainer}>
      <LottieView
        source={require("../assets/mens_grooming_animation.json")}
        autoPlay
        loop
        style={[
          styles.lottieAnimation,
          { width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.65 }
        ]}
      />
    </View>

    <View style={styles.headerTextContainer}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>
        Experience India's premier grooming destination. Precision in every cut.
      </Text>
    </View>
    <BrandDecor />
  </View>
));

// Modern Alert
const ModernAlert = memo(({ visible, title, message, type, onHide }) => {
  const translateY = useSharedValue(-150);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    translateY.value = withTiming(-150, { duration: 300 }, (finished) => {
      if (finished && onHide) {
        runOnJS(onHide)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return { bg: "#FEF2F2", border: "#FECACA", iconColor: "#DC2626", Icon: AlertCircle };
      case "success":
        return { bg: "#F0FDF4", border: "#86EFAC", iconColor: "#16A34A", Icon: CheckCircle };
      case "warning":
        return { bg: "#FFFBEB", border: "#FDE68A", iconColor: "#D97706", Icon: AlertTriangle };
      default:
        return { bg: "#FFFFFF", border: "#E5E7EB", iconColor: "#4B5563", Icon: Info };
    }
  };

  const { bg, border, iconColor, Icon } = getAlertStyle();

  if (!visible && translateY.value === -150) return null;

  return (
    <Animated.View style={[styles.alertWrapper, animatedStyle]}>
      <View style={[styles.alertContainer, { backgroundColor: bg, borderColor: border }]}>
        <View style={[styles.alertIconBox, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: iconColor }]}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ==========================================
// 2. MAIN LOGIN SCREEN
// ==========================================
const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, googleLogin, oauthError, setOauthError, oauthLoginOnly, setOauthLoginOnly } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info"
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withTiming(0, { duration: 600 });

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const showAlert = useCallback((title, message, type) => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert("Missing Fields", "Please fill in both email and password.", "warning");
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert("Success", "Welcome back to GlossCut!", "success");
        setTimeout(() => {
          navigation.replace("Onboarding");
        }, 1000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert("Login Failed", "Incorrect email or password.", "error");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let msg = "Something went wrong. Please try again.";
      if (error.response && error.response.status === 400) {
        msg = "Invalid email or password. Please try again.";
      }
      showAlert("Error", msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await googleLogin({ loginOnly: true });
      if (result.success) {
        showAlert("Success", "Opening Google authentication...", "success");
      } else {
        showAlert("Error", result.message || "Failed to initiate Google login", "error");
      }
    } catch (error) {
      showAlert("Error", "Failed to initiate Google login", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* OAuth Denied Modal */}
        <Modal
          visible={oauthError === 'signup_not_allowed' || oauthError === 'role_not_allowed'}
          transparent
          animationType="fade"
          onRequestClose={() => { setOauthError(null); setOauthLoginOnly(false); }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {oauthError === 'role_not_allowed' ? 'Access Denied' : 'Account not found'}
              </Text>
              <Text style={styles.modalText}>
                {oauthError === 'role_not_allowed'
                  ? 'This Google account does not have the required role for this login flow.'
                  : 'The email returned by Google does not match any existing account. Please sign up first.'}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => { setOauthError(null); setOauthLoginOnly(false); }}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Alert Overlay */}
        <View style={[styles.alertOverlay, { paddingTop: insets.top }]}>
          <ModernAlert
            visible={alert.visible}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            onHide={hideAlert}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LoginHeader
            insets={insets}
            onBackPress={() => navigation.goBack()}
            onRegisterPress={() => navigation.navigate("Signup")}
          />

          <Animated.View style={[styles.card, animatedCardStyle]}>
            <View style={styles.form}>
              <CustomInput
                index={0}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                isValid={validateEmail(email)}
                showValidation={email.length > 0}
              />

              <View style={styles.inputGroup}>
                <CustomInput
                  index={1}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  icon={Lock}
                  isPassword
                  secureTextEntry={!isPasswordVisible}
                  toggleSecure={() => setIsPasswordVisible(!isPasswordVisible)}
                  isValid={password.length >= 6}
                  showValidation={password.length > 0}
                />
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("ForgotPassword");
                  }}
                  style={styles.forgotButton}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <PrimaryButton
                title="Enter GlossCut"
                onPress={handleLogin}
                isLoading={isLoading}
              />
            </View>

            <View style={styles.socialSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                activeOpacity={0.7}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.socialIconContainer}>
                    <Image
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                      style={styles.socialIcon}
                    />
                  </View>
                  <Text style={styles.socialButtonText}>Google Account</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
        {!isKeyboardVisible && <Text style={styles.branding}>© 2026 GLOSSCUT Inc.</Text>}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3EEEB" },

  // --- ALERT ---
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999
  },
  alertWrapper: {
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%"
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    padding: 16,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  alertIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14
  },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 2
  },
  alertMessage: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: "PlusJakartaSans_500Medium",
    lineHeight: 18
  },

  // --- LAYOUT ---
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  brandDecorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  redLine: {
    width: 40,
    height: 4,
    backgroundColor: "#E21D25",
    borderRadius: 2,
    marginRight: 10,
  },
  dotsWrapper: { flexDirection: "row" },
  decorDot: {
    width: 4,
    height: 4,
    backgroundColor: "#000000",
    borderRadius: 2,
    marginHorizontal: 2,
    opacity: 0.2,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingRight: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  pillButton: {
    backgroundColor: "#fac71eff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillButtonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  animationContainer: {
    height: adaptiveHeight(140),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: adaptiveHeight(5),
  },
  lottieAnimation: {
    // Width and Height now controlled dynamically in JS
  },
  headerTextContainer: { marginTop: 0 },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: scaleFont(28),
    color: "#1A1A1A",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: scaleFont(13),
    color: "#4B5563",
    lineHeight: scaleFont(18),
    opacity: 0.7,
  },
  card: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: adaptiveHeight(28),
    paddingTop: adaptiveHeight(40),
    paddingBottom: adaptiveHeight(40),
    marginTop: adaptiveHeight(10),
    borderWidth: 1,
    borderColor: "#F1E9E6",
  },
  form: { gap: 24 },
  inputGroup: { gap: 12 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  inputWrapper: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },
  floatingLabel: {
    position: "absolute",
    left: 0,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    zIndex: 999,
    borderRadius: 4,
  },
  inputIconWrapper: {
    marginRight: 12,
  },
  rightIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#111827",
    marginTop: 2,
  },
  eyeButton: { padding: 4 },
  forgotButton: { alignSelf: "flex-end", marginTop: -8 },
  forgotText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#000000ff"
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonContent: { flexDirection: "row", alignItems: "center" },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.5,
  },
  socialSection: { marginTop: 32, gap: 20 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  socialButton: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  socialIconContainer: { marginRight: 12 },
  socialIcon: { width: 24, height: 24 },
  socialButtonText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A1A",
  },
  branding: {
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#D1D5DB",
    textTransform: "uppercase",
    letterSpacing: 2,
    backgroundColor: "#FFFFFF",
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: "#1A1A1A",
    marginBottom: 10
  },
  modalText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 20
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#E21D25",
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14
  }
});

export default LoginScreen;
