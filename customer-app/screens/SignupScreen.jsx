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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import * as Haptics from 'expo-haptics';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Info,
  ChevronLeft,
  CheckCircle
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
  FadeInUp,
  Easing,
  withRepeat
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../src/theme/colors";
import { Layout } from "../src/theme/layout";
import { LinearGradient } from 'expo-linear-gradient';
import api from "../utils/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- RESPONSIVE HELPERS ---
const scaleFont = (size) => Math.round(size * (SCREEN_WIDTH / 375));
const adaptiveHeight = (size) => Math.round(size * (SCREEN_HEIGHT / 812));

// --- VALIDATION HELPERS ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => phone.length === 10;

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
  error,
  onBlur,
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
    borderColor: withTiming(error ? "#EF4444" : isFocused ? "#E21D25" : "#D1D5DB", { duration: 200 }),
    borderWidth: withTiming(isFocused || error ? 1.5 : 1, { duration: 200 }),
    backgroundColor: "#FFFFFF",
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelTranslateY.value },
      { scale: labelScale.value },
    ],
    color: error ? "#EF4444" : labelColor.value,
    backgroundColor: (isFocused || value.length > 0) ? "#FFFFFF" : "transparent",
    paddingHorizontal: (isFocused || value.length > 0) ? 8 : 0,
    marginLeft: -4,
  }));

  return (
    <View style={styles.inputSectionContainer}>
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
            onBlur={() => {
              setIsFocused(false);
              if (onBlur) onBlur();
            }}
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

      {error ? (
        <Animated.Text
          entering={FadeInUp.duration(300)}
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
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
        <View style={styles.signupButton}>
          {isLoading ? (
            <AnimatedLoader size={24} color="#FFFFFF" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.signupButtonText}>{title}</Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Brand Decoration
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
const Header = memo(({ insets, onBackPress, onLoginPress }) => (
  <View style={[styles.header, { paddingTop: insets.top + adaptiveHeight(20) }]}>
    <View style={styles.topNav}>
      <View />
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onLoginPress();
        }}
        style={styles.pillButton}
      >
        <Text style={styles.pillButtonText}>Login</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.animationContainer}>
      <LottieView
        source={require("../assets/mens_grooming_animation.json")}
        autoPlay
        loop
        style={[
          styles.lottieAnimation,
          { width: SCREEN_WIDTH * 0.6, height: SCREEN_WIDTH * 0.6 }
        ]}
      />
    </View>

    <View style={styles.headerTextContainer}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>
        Join India's smartest grooming destination today.
      </Text>
    </View>
    <BrandDecor />
  </View>
));

// Modern Alert
const ModernAlert = memo(({ visible, message, type, onHide, insets }) => {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  const topOffset = Math.max(insets.top, 24) + 10;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(topOffset, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });
      const timer = setTimeout(() => {
        handleHide();
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      handleHide();
    }
  }, [visible, topOffset]);

  const handleHide = useCallback(() => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(-150, { duration: 300 }, (finished) => {
      if (finished && onHide) {
        runOnJS(onHide)();
      }
    });
  }, [onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  const getTheme = () => {
    switch (type) {
      case "success": return { bg: "#10B981", icon: Check };
      case "error": return { bg: "#EF4444", icon: AlertCircle };
      default: return { bg: "#1F2937", icon: Info };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <Animated.View style={[styles.alertPill, { backgroundColor: theme.bg }, animatedStyle]}>
      <View style={styles.alertIconBubble}>
        <Icon size={18} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.alertText}>{message}</Text>
    </Animated.View>
  );
});

// ==========================================
// 2. MAIN SIGNUP SCREEN
// ==========================================
const SignupScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  // State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const [alertState, setAlertState] = useState({
    visible: false,
    message: "",
    type: "info"
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withTiming(0, { duration: 600 });

    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const showAlert = useCallback((type, message) => {
    setAlertState({ visible: true, message, type });
  }, []);

  const checkEmailExists = async () => {
    if (!email || !validateEmail(email)) return;

    setIsCheckingEmail(true);
    setEmailError("");
    try {
      const res = await api.get(`/api/auth/check-exists?email=${encodeURIComponent(email.trim())}`);
      if (res.data.exists) {
        setEmailError(res.data.msg || "Email already registered");
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkPhoneExists = async () => {
    if (!phone || phone.length < 10) return;

    setIsCheckingPhone(true);
    setPhoneError("");
    try {
      const res = await api.get(`/api/auth/check-exists?phone=${encodeURIComponent(phone.trim())}`);
      if (res.data.exists) {
        setPhoneError(res.data.msg || "Phone number already registered");
      }
    } catch (err) {
      console.error("Error checking phone:", err);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert("error", "Please fill all fields");
      return;
    }

    if (phone.length !== 10) {
      showAlert("error", "Phone number must be 10 digits");
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await api.post(`/api/auth/register`, { name, phone, email, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert("success", "Account Created Successfully!");
      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let msg = err.response ? err.response.data.msg : "Registration failed";
      showAlert("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <ModernAlert
          visible={alertState.visible}
          message={alertState.message}
          type={alertState.type}
          onHide={() => setAlertState(p => ({ ...p, visible: false }))}
          insets={insets}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Header
            insets={insets}
            onBackPress={() => navigation.goBack()}
            onLoginPress={() => navigation.navigate("Login")}
          />

          <Animated.View style={[styles.card, animatedCardStyle]}>
            <View style={styles.form}>
              <CustomInput
                index={0}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                icon={User}
                isValid={name.length >= 3}
                showValidation={name.length > 0}
              />

              <CustomInput
                index={1}
                placeholder="Phone Number"
                value={phone}
                onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, "")); setPhoneError(""); }}
                onBlur={checkPhoneExists}
                icon={Phone}
                keyboardType="number-pad"
                maxLength={10}
                error={phoneError}
              />

              <CustomInput
                index={2}
                placeholder="Email Address"
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                onBlur={checkEmailExists}
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              <CustomInput
                index={3}
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

              <PrimaryButton
                title="Create Account"
                onPress={handleSignup}
                isLoading={isLoading}
              />
            </View>

            <View style={styles.socialSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR JOIN WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
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
  alertPill: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 99999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    minWidth: "65%",
    maxWidth: "92%",
    elevation: 10,
  },
  alertIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  alertText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    flexShrink: 1,
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
    color: "#111827",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  animationContainer: {
    height: adaptiveHeight(120),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: adaptiveHeight(5),
  },
  lottieAnimation: {
    // Controlled dynamically
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
  form: { gap: 12 },
  inputSectionContainer: {
    width: "100%",
    marginBottom: 0,
  },
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
  },
  inputIconWrapper: {
    marginRight: 12,
  },
  rightIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#111827",
    marginTop: 2,
  },
  errorText: {
    color: "#5e2001ff",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    marginTop: 4,
    marginLeft: 4,
  },
  eyeButton: { padding: 4 },
  signupButton: {
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
  signupButtonText: {
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
});

export default SignupScreen;
