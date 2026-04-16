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
  Platform,
  Keyboard, // Added for better UX
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  withDelay
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../src/theme/colors";
import { Layout } from "../src/theme/layout";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Info
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import api from "../utils/api";

const { width, height } = Dimensions.get("window");

// ==========================================
// 1. MEMOIZED COMPONENTS (PREVENTS LAG)
// ==========================================

// Heavy Background Blobs - Memoized to render ONCE
const BackgroundDecoration = memo(() => (
  <View style={styles.backgroundDecoration}>
    <View style={styles.blob1} />
    <View style={styles.blob2} />
  </View>
));

// Static Header/Logo - Memoized to render ONCE
const Header = memo(({ insets }) => (
  <View style={[styles.header, { marginTop: Math.max(insets.top, 20) }]}>
    <View style={styles.iconContainer}>
      <Image
        source={require("../assets/SetKarr.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.title}>Create Account</Text>
    <Text style={styles.subtitle}>Join us and start your grooming journey</Text>
  </View>
));

// Modern Alert - Memoized to prevent re-renders on typing
const ModernAlert = memo(({ visible, message, type, onHide, insets }) => {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const shakeTranslateX = useSharedValue(0);

  const topOffset = Math.max(insets.top, 24) + 10;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(topOffset, {
        damping: 14,
        stiffness: 120,
        mass: 1
      });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1);

      // Physics Animations based on type
      if (type === "error") {
        shakeTranslateX.value = withDelay(
          300,
          withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
          )
        );
      } else if (type === "success") {
        scale.value = withDelay(
          300,
          withSequence(
            withTiming(1.05, { duration: 100 }),
            withTiming(1, { duration: 100 })
          )
        );
      }

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
    transform: [
      { translateY: translateY.value },
      { translateX: shakeTranslateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value
  }));

  const getTheme = () => {
    switch (type) {
      case "success":
        return { bg: "#10B981", icon: Check };
      case "error":
        return { bg: "#EF4444", icon: AlertCircle };
      default:
        return { bg: "#1F2937", icon: Info };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <Animated.View
      style={[styles.alertPill, { backgroundColor: theme.bg }, animatedStyle]}
    >
      <View style={styles.alertIconBubble}>
        <Icon size={18} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.alertText}>{message}</Text>
    </Animated.View>
  );
});

// ==========================================
// 2. MAIN OPTIMIZED SCREEN
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

  // Alert State
  const [alertState, setAlertState] = useState({
    visible: false,
    message: "",
    type: "info"
  });

  // --- OPTIMIZED HANDLERS ---

  const handleNameChange = useCallback((text) => {
    const cleanText = text.replace(/[^a-zA-Z\s]/g, "");
    setName(cleanText);
  }, []);

  const handlePhoneChange = useCallback((text) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    if (cleanText.length <= 10) {
      setPhone(cleanText);
    }
  }, []);

  const handleHideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlertState((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setAlertState({ visible: true, message, type });
    }, 100);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);



  // Entry Animations
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withTiming(0, { duration: 600 });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }]
  }));

  const handleSignup = useCallback(async () => {
    // 1. Dismiss Keyboard for better visibility
    Keyboard.dismiss();

    // 2. Strict Validation Checks
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      showAlert("error", "Please fill all fields");
      return;
    }

    if (name.length < 3) {
      showAlert("error", "Name must be at least 3 letters");
      return;
    }

    if (phone.length !== 10) {
      showAlert("error", "Phone number must be 10 digits");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("error", "Please enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post(
        `/api/auth/register`,
        { name, phone, email, password }
      );

      showAlert("success", "Account Created Successfully!");

      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (err) {
      let msg = err.response ? err.response.data.msg : "Network request failed";
      // Handle the 400 specifically if needed, but the generic catch works too
      showAlert("error", msg);
    }
    setIsLoading(false);
  }, [name, phone, email, password, navigation, showAlert]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.BG_PAGE }]}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <ModernAlert
        visible={alertState.visible}
        message={alertState.message}
        type={alertState.type}
        onHide={handleHideAlert}
        insets={insets}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <BackgroundDecoration />

        <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
          <Header insets={insets} />

          <View style={styles.form}>

            {/* NAME INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Gloss Cut"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={handleNameChange}
              />
            </View>

            {/* PHONE INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="glosscut@company.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* PASSWORD INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                >
                  {isPasswordVisible ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.loginButton}>
              <TouchableOpacity
                style={styles.loginButtonTouchable}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={24} color={Colors.TEXT_ON_DARK} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.loginButtonText}>Sign Up</Text>
                    <ArrowRight size={20} color={Colors.TEXT_ON_DARK} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signUpText}>Login</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      <Text style={styles.branding}>© 2024 GLOSSCUT Inc.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center"
  },
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
    maxWidth: "92%"
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
    fontWeight: "700",
    flexShrink: 1,
    letterSpacing: 0.3
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  blob1: {
    position: "absolute",
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(240, 239, 233, 0.5)"
  },
  blob2: {
    position: "absolute",
    bottom: -height * 0.2,
    left: -width * 0.2,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(240, 239, 233, 0.45)"
  },
  contentContainer: { width: "90%", maxWidth: 400, paddingVertical: 32 },
  header: { alignItems: "center", marginBottom: 32 },
  iconContainer: {
    width: 120,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  logoImage: { width: 233, height: 100, borderRadius: 12 },
  title: {
    fontFamily: "Syne_700Bold",
    fontSize: 28,
    letterSpacing: -0.02,
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22
  },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.TEXT_MUTED,
    marginLeft: 4,
    letterSpacing: 0
  },
  input: {
    height: 52,
    backgroundColor: Colors.BG_CARD,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_INPUT,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.TEXT_PRIMARY,
    ...Layout.noShadow
  },
  passwordContainer: { position: "relative" },
  eyeButton: { position: "absolute", right: 16, top: 16 },
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.CTA_BUTTON,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    ...Layout.noShadow
  },
  loginButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  loginButtonText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    marginRight: 8
  },
  footer: { alignItems: "center", marginTop: 32 },
  footerText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.TEXT_SECONDARY,
  },
  signUpText: {
    color: Colors.TEXT_PRIMARY,
    fontFamily: "DMSans_700Bold",
    textDecorationLine: "underline"
  },
  branding: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    marginLeft: 39,
    textAlign: "left",
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    color: Colors.TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 2
  },

  // --- GOOGLE OAUTH STYLES ---
  googleButton: {
    height: 56,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151"
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb"
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500"
  }
});

export default SignupScreen;
