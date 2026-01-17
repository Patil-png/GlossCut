import React, { useState, useEffect, useCallback } from "react";
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
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  WifiOff
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. BACKGROUND & DECORATIONS
// ============================================================================

const BackgroundDecorations = React.memo(() => (
  <View style={styles.backgroundDecoration}>
    <View style={styles.blob1} />
    <View style={styles.blob2} />
    <View style={styles.blob3} />
  </View>
));

// ============================================================================
// 2. HEADER & FOOTER
// ============================================================================

const LoginHeader = React.memo(({ animatedIconStyle }) => (
  <View style={styles.header}>
    <Animated.View style={animatedIconStyle}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../assets/SetKarr.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
    <Text style={styles.title}>Welcome Back</Text>
    <Text style={styles.subtitle}>
      Delivering confidence with every appointment. Log in to manage your chair.
    </Text>
  </View>
));

const LoginFooter = React.memo(({ onSignupPress }) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      Don't have an account?{" "}
      <TouchableOpacity onPress={onSignupPress}>
        <Text style={styles.signUpText}>Sign up</Text>
      </TouchableOpacity>
    </Text>
  </View>
));

// ============================================================================
// 3. TIER-1 STARTUP STYLE ALERT (Zomato/Blinkit Vibe)
// ============================================================================

const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useSharedValue(-200); // Start further up to hide completely

  useEffect(() => {
    if (visible) {
      // Bouncy Spring Animation (The "Premium" Feel)
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 1,
      });

      // Auto-hide
      const timer = setTimeout(() => {
        handleClose();
      }, 4000); // Slightly longer read time
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    translateY.value = withTiming(-200, { duration: 300 }, (finished) => {
      if (finished && onHide) {
        runOnJS(onHide)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Design System for Alerts
  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return {
          bg: "#FEF2F2", // Soft Red
          border: "#FECACA",
          iconColor: "#DC2626",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: "#F0FDF4", // Soft Green
          border: "#86EFAC",
          iconColor: "#16A34A",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "#FFFBEB", // Soft Yellow
          border: "#FDE68A",
          iconColor: "#D97706",
          Icon: AlertTriangle,
        };
      case "network":
        return {
          bg: "#EFF6FF", // Soft Blue
          border: "#BFDBFE",
          iconColor: "#2563EB",
          Icon: WifiOff,
        };
      default:
        return {
          bg: "#FFFFFF",
          border: "#E5E7EB",
          iconColor: "#4B5563",
          Icon: Info,
        };
    }
  };

  const { bg, border, iconColor, Icon } = getAlertStyle();

  return (
    <Animated.View style={[styles.alertWrapper, animatedStyle]}>
      <View
        style={[
          styles.alertContainer,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <View style={[styles.alertIconBox, { backgroundColor: `${iconColor}10` }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: iconColor }]}>{title}</Text>
          <Text style={styles.alertMessage} numberOfLines={2}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================================================
// 4. MAIN LOGIN SCREEN (Optimized & Crash Proof)
// ============================================================================

const LoginScreen = () => {
  const { theme } = useTheme();
  const { barberLogin, googleLogin } = useAuth();
  const navigation = useNavigation();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // Entrance Animations
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withTiming(0, { duration: 600 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // --- HANDLERS (Memoized for Performance) ---

  const showAlert = useCallback((title, message, type) => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    if(alert.visible) hideAlert(); // Clear alert when user corrects input
  }, [alert.visible]);

  const handlePasswordChange = useCallback((text) => {
    setPassword(text);
    if(alert.visible) hideAlert();
  }, [alert.visible]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate("ForgotPassword");
  }, [navigation]);

  const handleSignupNavigation = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      // This is the LOGIN screen; do not allow account creation via Google here
      const result = await googleLogin({ loginOnly: true });
      if (result.success) {
        showAlert("Success", "Opening Google authentication in browser. Complete the login and return to the app.", "success");
      } else {
        showAlert("Error", result.message || "Failed to initiate Google login", "error");
      }
    } catch (error) {
      showAlert("Error", "Failed to initiate Google login", "error");
    }
  }, [googleLogin, showAlert]);

  // --- VALIDATION LAYER (Prevents Bad API Calls) ---
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Missing Details", "Please enter both your email and password.", "warning");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "The email address format is incorrect.", "warning");
      return false;
    }
    return true;
  };

  // --- CRASH-PROOF LOGIN LOGIC ---
  const handleLogin = async () => {
    // 1. Validate locally first
    if (!validateInputs()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // 2. Attempt Login
      const success = await barberLogin(email, password);

      if (success) {
        showAlert("Success", "Welcome back!", "success");
        setTimeout(() => {
          navigation.navigate("Home");
        }, 800);
      } else {
        // Fallback if the hook returns false but doesn't throw
        showAlert("Access Denied", "Incorrect email or password.", "error");
      }
    } catch (error) {
      // 3. Graceful Error Handling (No Red Screen of Death)
      console.log("Login Error:", error);

      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        showAlert("No Connection", "Please check your internet settings.", "network");
      } 
      else if (error.response && error.response.status === 400) {
        showAlert("Invalid Credentials", "The email or password you entered is incorrect.", "error");
      } 
      else if (error.response && error.response.status === 404) {
        showAlert("Account Not Found", "No barber account exists with this email.", "warning");
      } 
      else if (error.response && error.response.status >= 500) {
        showAlert("Server Issue", "Our servers are having trouble. Try again later.", "warning");
      } 
      else {
        showAlert("Error", "Something went wrong. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#fff", "#fff", "#b8c2cc"]}
      locations={[0, 0.3, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* --- FLOATING ALERT (Zomato Style) --- */}
      {/* Placed outside ScrollView to float over everything */}
      <ModernAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onHide={hideAlert}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <BackgroundDecorations />

        <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
          <LoginHeader animatedIconStyle={animatedIconStyle} />

          <View style={styles.form}>
            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <View style={styles.googleButtonContent}>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="glosscut@company.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <TouchableOpacity
                style={styles.loginButtonTouchable}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={24} color="white" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.loginButtonText}>Login</Text>
                    <ArrowRight size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <LoginFooter onSignupPress={handleSignupNavigation} />
        </Animated.View>
      </ScrollView>
      <Text style={styles.branding}>© 2026 GlossCut Inc.</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // --- ALERT STYLES (Fixed Top Position) ---
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Guaranteed on top
    alignItems: "center",
    marginTop: 45, // Safe area margin
    paddingHorizontal: 20,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    // Deep, Soft Shadow for "Floating" effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
    lineHeight: 18,
  },

  // --- MAIN LAYOUT ---
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
  blob1: {
    position: "absolute",
    top: -height * 0.24,
    right: -width * 0.24,
    width: width * 0.64,
    height: width * 0.64,
    borderRadius: width * 0.32,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    opacity: 0.6,
  },
  blob2: {
    position: "absolute",
    bottom: -height * 0.24,
    left: -width * 0.24,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
    opacity: 0.5,
  },
  blob3: {
    position: "absolute",
    top: height * 0.3,
    left: -width * 0.3,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    opacity: 0.4,
  },
  contentContainer: {
    width: "90%",
    maxWidth: 400,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  
  // --- HEADER ---
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  iconContainer: {
    width: 120,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
    backgroundColor: 'white'
  },
  logoImage: { width: 100, height: 60 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },

  // --- FORM ---
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 56,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: { position: "relative" },
  eyeButton: { position: "absolute", right: 16, top: 16 },
  forgotButton: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { fontSize: 14, color: "#6366f1", fontWeight: "600" },
  
  // --- BUTTONS ---
  loginButton: {
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  loginButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },

  // --- FOOTER ---
  footer: { alignItems: "center", marginTop: 32 },
  footerText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  signUpText: {
    color: "#6366f1",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  branding: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // --- GOOGLE OAUTH STYLES ---
  googleButton: {
    height: 56,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});

export default LoginScreen;
