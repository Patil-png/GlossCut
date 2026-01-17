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
  Keyboard,
  Modal,
  Platform,
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
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  WifiOff,
  User,
  Lock,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. BACKGROUND & DECORATIONS (Golden Hour Glow)
// ============================================================================

const BackgroundDecorations = React.memo(() => (
  <View style={styles.backgroundDecoration}>
    {/* Amber Glow (Top Right) */}
    <View style={styles.glowTopRight} />
    {/* Deep Leather Shadow (Bottom Left) */}
    <View style={styles.glowBottomLeft} />
  </View>
));

// ============================================================================
// 2. HEADER & FOOTER
// ============================================================================

const LoginHeader = React.memo(({ animatedIconStyle }) => (
  <View style={styles.header}>
    <Animated.View style={[styles.logoWrapper, animatedIconStyle]}>
      <View style={styles.logoBorderRing}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/SetKarr.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </Animated.View>
    <Text style={styles.title}>WELCOME SIR</Text>
    <View style={styles.titleUnderline} />
    <Text style={styles.subtitle}>
      Excellence in grooming. Sign in to your chair.
    </Text>
  </View>
));

const LoginFooter = React.memo(({ onSignupPress }) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      Not on the list?{" "}
      <TouchableOpacity onPress={onSignupPress} style={{ top: 3 }}>
        <Text style={styles.signUpText}>REQUEST MEMBERSHIP</Text>
      </TouchableOpacity>
    </Text>
  </View>
));

// ============================================================================
// 3. MODERN ALERT COMPONENT (Ticket Style)
// ============================================================================

const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useSharedValue(-200);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 14,
        stiffness: 120,
        mass: 1,
      });
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
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

  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return {
          bg: "#4A1010",
          border: "#8B2E2E",
          iconColor: "#E57373",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: "#102818",
          border: "#2E5C3A",
          iconColor: "#81C784",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "#3E2700",
          border: "#8F6B1F",
          iconColor: "#FFD54F",
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: "#232323",
          border: "#444",
          iconColor: "#E0E0E0",
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
        <View style={styles.alertIconBox}>
          <Icon size={22} color={iconColor} strokeWidth={2} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>
            <Text style={{ color: iconColor }}>{title}</Text>
          </Text>
          <Text style={styles.alertMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================================================
// 4. MAIN LOGIN SCREEN
// ============================================================================

const LoginScreen = () => {
  const { theme } = useTheme();
  const { login, barberLogin, googleLogin, oauthError, setOauthError } =
    useAuth();
  const navigation = useNavigation();
  const oauthModalVisible = oauthError === "signup_not_allowed" || oauthError === "role_not_allowed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 900 });
    cardTranslateY.value = withTiming(0, { duration: 900 });
    iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const showAlert = useCallback((title, message, type) => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleEmailChange = useCallback(
    (text) => {
      setEmail(text);
      if (alert.visible) hideAlert();
    },
    [alert.visible],
  );

  const handlePasswordChange = useCallback(
    (text) => {
      setPassword(text);
      if (alert.visible) hideAlert();
    },
    [alert.visible],
  );

  const handleForgotPassword = useCallback(() => {
    navigation.navigate("ForgotPassword");
  }, [navigation]);

  const handleSignupNavigation = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      const result = await googleLogin({ loginOnly: true, requiredRole: 'barber' });
      if (result.success) {
        showAlert("Success", "Authenticating...", "success");
      } else {
        showAlert(
          "Connection Failed",
          result.message || "Please try again.",
          "error",
        );
      }
    } catch (error) {
      showAlert("System Error", "Could not reach Google services.", "error");
    }
  }, [googleLogin, showAlert]);

  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      showAlert(
        "DETAILS REQUIRED",
        "Please provide your credentials.",
        "warning",
      );
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("INVALID FORMAT", "The email address is incorrect.", "warning");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const success = await barberLogin(email, password);
      if (success) {
        try {
          setOauthError && setOauthError(null);
        } catch (e) {}
        showAlert("WELCOME", "Access granted.", "success");
        setTimeout(() => {
          navigation.navigate("Home");
        }, 800);
      } else {
        showAlert(
          "ACCESS DENIED",
          "Credentials do not match our records.",
          "error",
        );
      }
    } catch (error) {
      console.log("Login Error:", error);
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        showAlert("OFFLINE", "Please check your connection.", "network");
      } else if (error.response && error.response.status === 400) {
        showAlert("INVALID DATA", "Incorrect credentials.", "error");
      } else if (error.response && error.response.status === 404) {
        showAlert("UNKNOWN MEMBER", "Account does not exist.", "warning");
      } else {
        showAlert("SYSTEM ERROR", "Please try again later.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      // Vintage Gradient: Warm Cream -> Heavy Paper
      colors={["#FAF7F2", "#F0EAD6", "#E6DCCA"]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <Modal
        visible={oauthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOauthError(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBg}>
              <AlertTriangle size={28} color="#8B5A2B" />
            </View>
            <Text style={styles.modalTitle}>{oauthError === 'role_not_allowed' ? 'ACCESS DENIED' : 'MEMBER NOT FOUND'}</Text>
            <Text style={styles.modalText}>
              {oauthError === 'role_not_allowed' ? 'This Google account does not have the barber role. Please sign in with a barber account or use email/password.' : 'The Google account provided is not on our guest list. Please register for membership first.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setOauthError(null)}
              >
                <Text style={styles.modalBtnSecText}>CLOSE</Text>
              </TouchableOpacity>
              {oauthError !== 'role_not_allowed' && (
                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={() => {
                    setOauthError(null);
                    navigation.navigate("Signup");
                  }}
                >
                  <Text style={styles.modalBtnPriText}>REGISTER</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

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

          {oauthError && (
            <View style={styles.oauthErrorCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.oauthErrorTitle}>ACCESS DENIED</Text>
                <Text style={styles.oauthErrorMessage}>
                  {oauthError === 'role_not_allowed' ? 'This Google account does not have the barber role. Please sign in with a barber account or use email/password.' : 'Google authentication failed. No account found.'}
                </Text>
              </View>
              {oauthError === 'signup_not_allowed' && (
                <TouchableOpacity
                  style={styles.oauthErrorButton}
                  onPress={() => {
                    setOauthError(null);
                    navigation.navigate("Signup");
                  }}
                >
                  <Text style={styles.oauthErrorButtonText}>JOIN</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.formCard}>
            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            {/* Elegant Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <User size={18} color="#8B5A2B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#BCAAA4"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={18} color="#8B5A2B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#BCAAA4"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeOff size={20} color="#8B5A2B" />
                  ) : (
                    <Eye size={20} color="#8B5A2B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* STITCHED LEATHER BUTTON */}
            <TouchableOpacity
              style={styles.leatherButtonContainer}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#8B4513", "#5D4037"]} // Saddle Brown -> Espresso
                style={styles.leatherGradient}
              >
                {/* The "Stitch" Line */}
                <View style={styles.stitchLine}>
                  {isLoading ? (
                    <Loader2 size={24} color="#F5F5F5" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.loginButtonText}>LOG IN</Text>
                      <ArrowRight size={18} color="#F5F5F5" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <LoginFooter onSignupPress={handleSignupNavigation} />
        </Animated.View>
      </ScrollView>
      <Text style={styles.branding}>GlossCut Inc. Est. 2026</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // --- ALERT (Ticket Style) ---
  alertWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 45,
    alignSelf: "center",
    zIndex: 9999,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderLeftWidth: 4, // Ticket accent
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width * 0.92,
  },
  alertIconBox: { marginRight: 14 },
  alertContent: { flexShrink: 1 },
  alertTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 14,
    color: "#DDD",
    fontWeight: "500",
  },

  // --- BACKGROUND & LAYOUT ---
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  glowTopRight: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: "rgba(212, 175, 55, 0.08)", // Gold Faint
    transform: [{ scale: 1.2 }],
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(93, 64, 55, 0.08)", // Brown Faint
    transform: [{ scale: 1.2 }],
  },
  contentContainer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // --- HEADER ---
  header: { alignItems: "center", marginBottom: 32, marginTop: height * 0.06 },
  logoWrapper: {
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBorderRing: {
    borderRadius: 30,
    padding: 3,
    backgroundColor: "#D4AF37", // Brass Ring
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#E6DCCA",
  },
  logoImage: { width: 65, height: 65 },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3E2723",
    marginTop: 24,
    textAlign: "center",
    letterSpacing: 2, // Expensive spacing
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: "#D4AF37", // Gold underline
    marginVertical: 10,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    color: "#6D4C41",
    textAlign: "center",
    maxWidth: 260,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 22,
  },

  // --- FORM CARD ---
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EFEBE9",
    shadowColor: "#8D6E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 18,
  },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5D4037",
    marginLeft: 4,
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF9", // Very light cream
    borderWidth: 1,
    borderColor: "#D7CCC8",
    borderRadius: 8,
    height: 54,
  },
  inputIcon: { paddingLeft: 16, paddingRight: 12 },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#3E2723",
    fontWeight: "600",
    paddingRight: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  forgotButton: { alignSelf: "flex-end", marginTop: -6 },
  forgotText: { fontSize: 13, color: "#8B5A2B", fontWeight: "700" },

  // --- BUTTONS ---
  leatherButtonContainer: {
    marginTop: 8,
    height: 60,
    borderRadius: 12,
    shadowColor: "#3E2723",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  leatherGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 3, // Space for the stitch
  },
  stitchLine: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  loginButtonText: {
    color: "#F5F5F5",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },

  // --- GOOGLE & DIVIDER ---
  googleButton: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7CCC8",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 14, fontWeight: "700", color: "#5D4037" },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: "#D4AF37",
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 12,
  },

  // --- FOOTER ---
  footer: { alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 13, color: "#8D6E63", fontWeight: "600" },
  signUpText: {
    color: "#8B4513",
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  branding: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    fontSize: 10,
    color: "#A1887F",
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // --- MODALS ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44, 24, 16, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#FAF7F2",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5A2B",
  },
  modalIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFEBE9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D7CCC8",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#3E2723",
    marginBottom: 10,
    letterSpacing: 1,
  },
  modalText: {
    fontSize: 14,
    color: "#5D4037",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: { flexDirection: "row", width: "100%", gap: 12 },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#8B5A2B",
    alignItems: "center",
  },
  modalBtnSecText: { color: "#8B5A2B", fontWeight: "700", fontSize: 12 },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#8B4513",
    alignItems: "center",
  },
  modalBtnPriText: { color: "#F5F5F5", fontWeight: "700", fontSize: 12 },

  oauthErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E1A1A",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#E57373",
    marginBottom: 20,
  },
  oauthErrorTitle: {
    fontWeight: "900",
    fontSize: 12,
    color: "#FFCDD2",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  oauthErrorMessage: { color: "#EF9A9A", fontSize: 12 },
  oauthErrorButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  oauthErrorButtonText: { color: "#FFEBEE", fontWeight: "700", fontSize: 11 },
});

export default LoginScreen;
