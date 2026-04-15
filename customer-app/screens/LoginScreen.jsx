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
  Modal} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Colors } from "../src/theme/colors";
import { Layout } from "../src/theme/layout";

const { width, height } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENTS (Memoized) ---

// 1. Background Decoration (Static)
const BackgroundDecorations = React.memo(() => (
  <View style={styles.backgroundDecoration}>
    <View style={styles.blob1} />
    <View style={styles.blob2} />
    <View style={styles.blob3} />
  </View>
));

// 2. Header Component
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
      Precision grooming starts here, delivering confidence with every
      appointment.
    </Text>
  </View>
));

// 3. Footer Component
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

// 4. Modern Alert (Memoized)
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
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
    transform: [{ translateY: translateY.value }]}));

  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return {
          bg: "#FEF2F2",
          border: "#FECACA",
          iconColor: "#DC2626",
          Icon: AlertCircle};
      case "success":
        return {
          bg: "#F0FDF4",
          border: "#86EFAC",
          iconColor: "#16A34A",
          Icon: CheckCircle};
      case "warning":
        return {
          bg: "#FFFBEB",
          border: "#FDE68A",
          iconColor: "#D97706",
          Icon: AlertTriangle};
      default:
        return {
          bg: "#FFFFFF",
          border: "#E5E7EB",
          iconColor: "#4B5563",
          Icon: Info};
    }
  };

  const { bg, border, iconColor, Icon } = getAlertStyle();

  if (!visible && translateY.value === -150) return null;

  return (
    <Animated.View style={[styles.alertWrapper, animatedStyle]}>
      <View
        style={[
          styles.alertContainer,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <View
          style={[styles.alertIconBox, { backgroundColor: `${iconColor}15` }]}
        >
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

// --- MAIN LOGIN SCREEN ---
const LoginScreen = () => {
  const { theme } = useTheme();
  const { login, googleLogin, oauthError, setOauthError, oauthLoginOnly, setOauthLoginOnly } = useAuth();
  const navigation = useNavigation();
  // Modal visibility derived from oauthError
  const oauthModalVisible = oauthError === 'signup_not_allowed';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info"});

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withTiming(0, { duration: 600 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  // Debug: log oauthError presence so we can see if the Login screen sees the state
  useEffect(() => {
    try { console.log('LoginScreen (customer) oauthError changed:', oauthError); } catch (e) {}
  }, [oauthError]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }]}));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }]}));

  // Show a modal immediately when oauthError is present
  const OAuthDeniedModal = () => (
    <Modal visible={oauthModalVisible} transparent animationType="fade" onRequestClose={() => { setOauthError(null); setOauthLoginOnly(false); }}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '86%', backgroundColor:'#fff', padding:20, borderRadius:12 }}>
          <Text style={{ fontSize:18, fontWeight:'800', marginBottom:8 }}>Account not found</Text>
          <Text style={{ color:'#374151', marginBottom:16 }}>The email returned by Google does not match any existing account. Please SignUp from the SignUp page for new account creation.</Text>
          <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
            <TouchableOpacity style={{ paddingVertical:10, paddingHorizontal:12 }} onPress={() => { setOauthError(null); setOauthLoginOnly(false); }}>
              <Text style={{ color:'#6b7280' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Stable Handlers
  const showAlert = useCallback((title, message, type) => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleSignupNavigation = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate("ForgotPassword");
  }, [navigation]);

  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    // Clear alert if user starts typing again
    setAlert((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const handlePasswordChange = useCallback((text) => {
    setPassword(text);
    setAlert((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  // Validation
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      showAlert(
        "Missing Fields",
        "Please fill in both email and password.",
        "warning"
      );
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning"
      );
      return false;
    }
    return true;
  };

  // Google OAuth Handler
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

  // --- SAFE LOGIN HANDLER (Fixes 400 Error Crash) ---
  const handleLogin = async () => {
    if (!validateInputs()) return;

    Keyboard.dismiss(); // Close keyboard for better UI
    setIsLoading(true);

    try {
      // We await the login. If it's a 400 error, Axios throws, and we catch it below.
      const success = await login(email, password);

      if (success) {
        // Clear any OAuth error state when user signs in normally
        try { setOauthError && setOauthError(null); } catch(e){}
        showAlert("Success", "Welcome back to GlossCut!", "success");
        setTimeout(() => {
          navigation.replace("Onboarding");
        }, 800);
      } else {
        // Fallback for non-throwing failures
        showAlert("Login Failed", "Incorrect email or password.", "error");
      }
    } catch (error) {
      // This block handles the Axios 400 Error silently
      if (error.response && error.response.status === 400) {
        // Specific message for 400 Bad Request (Wrong Data)
        showAlert(
          "Access Denied",
          "Invalid email or password. Please try again.",
          "error"
        );
      } else if (error.code === "ERR_NETWORK") {
        showAlert(
          "Network Error",
          "Please check your internet connection.",
          "warning"
        );
      } else {
        // Generic error
        showAlert("Error", "Something went wrong. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.BG_PAGE }]}>
      <StatusBar barStyle="dark-content" />

      {/* OAuth Denied Modal (appears when oauthError is set) */}
      <Modal visible={oauthModalVisible} transparent animationType="fade" onRequestClose={() => { setOauthError(null); setOauthLoginOnly(false); }}>
        <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '86%', backgroundColor:'#fff', padding:20, borderRadius:12 }} >
            <Text style={{ fontSize:18, fontWeight:'800', marginBottom:8 }}>{oauthError === 'role_not_allowed' ? 'Access Denied' : 'Account not found'}</Text>
            <Text style={{ color:'#374151', marginBottom:16 }}>{oauthError === 'role_not_allowed' ? 'This Google account does not have the required role for this login flow. Please sign in with an account that has the correct role or contact support.' : (oauthLoginOnly ? 'The email returned by Google does not match any existing account. Signup via Google is disabled for this login flow. Please sign in with a different Google account or contact support.' : 'The email returned by Google does not match any existing account. You can sign up to create a new account.')}</Text>
            <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
              {!oauthLoginOnly && oauthError !== 'role_not_allowed' && (
                <TouchableOpacity style={{ paddingVertical:10, paddingHorizontal:12 }} onPress={() => { setOauthError(null); setOauthLoginOnly(false); navigation.navigate('Signup'); }}>
                  <Text style={{ color:'#7C3AED', fontWeight:'700' }}>Go to Signup</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={{ paddingVertical:10, paddingHorizontal:12 }} onPress={() => { setOauthError(null); setOauthLoginOnly(false); }}>
                <Text style={{ color:'#6b7280' }}>{oauthLoginOnly ? 'Close' : 'Dismiss'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert Overlay */}
      <View style={styles.alertOverlay}>
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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        <BackgroundDecorations />

        <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
          <LoginHeader animatedIconStyle={animatedIconStyle} />

          {/* OAuth login-only error: show persistent message with CTA to Signup */}
          {/* This appears when returning from Google with ?error=signup_not_allowed */}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {/**/}
          {oauthError && (
            <View style={styles.oauthErrorCard}>
              <Text style={styles.oauthErrorTitle}>{oauthError === 'role_not_allowed' ? 'ACCESS DENIED' : 'Account not found'}</Text>
              <Text style={styles.oauthErrorMessage}>{oauthError === 'role_not_allowed' ? 'This Google account does not have the required role for this login flow. Please sign in with the correct account or contact support.' : 'The email returned by Google does not match any existing account. Please SignUp from the SignUp page for new account creation.'}</Text>
              <View style={styles.oauthErrorActions}>
                <TouchableOpacity style={styles.oauthErrorButton} onPress={() => setOauthError(null)}>
                  <Text style={styles.oauthErrorButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.loginButton}>
              <TouchableOpacity
                style={styles.loginButtonTouchable}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={24} color={Colors.TEXT_ON_DARK} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.loginButtonText}>Login</Text>
                    <ArrowRight size={20} color={Colors.TEXT_ON_DARK} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <LoginFooter onSignupPress={handleSignupNavigation} />
        </Animated.View>
      </ScrollView>
      <Text style={styles.branding}>© 2024 GLOSSCUT Inc.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // --- MODERN ALERT STYLES ---
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999},
  alertWrapper: {
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%"},
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    padding: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    ...Layout.noShadow},
  alertIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14},
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2},
  alertMessage: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
    lineHeight: 18},

  // --- APP STYLES ---
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center"},
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0},
  blob1: {
    position: "absolute",
    top: -height * 0.24,
    right: -width * 0.24,
    width: width * 0.64,
    height: width * 0.64,
    borderRadius: width * 0.32,
    backgroundColor: "rgba(240, 239, 233, 0.5)",
    opacity: 0.5},
  blob2: {
    position: "absolute",
    bottom: -height * 0.24,
    left: -width * 0.24,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(240, 239, 233, 0.45)",
    opacity: 0.45},
  blob3: {
    position: "absolute",
    top: height * 0.3,
    left: -width * 0.3,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "rgba(232, 231, 226, 0.35)",
    opacity: 0.35},
  contentContainer: {
    width: "90%",
    maxWidth: 400,
    paddingVertical: 32,
    paddingHorizontal: 16},
  header: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  iconContainer: {
    width: 120,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
    ...Layout.noShadow},
  logoImage: { width: 233, height: 100, borderRadius: 12 },
  title: {
    fontFamily: "Syne_700Bold",
    fontSize: 28,
    letterSpacing: -0.02,
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: "center"},
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: Colors.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280},
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: Colors.TEXT_MUTED,
    marginLeft: 4,
    letterSpacing: 0},
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
    ...Layout.noShadow},
  passwordContainer: { position: "relative" },
  eyeButton: { position: "absolute", right: 16, top: 16 },
  forgotButton: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.TEXT_SECONDARY},
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.CTA_BUTTON,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    ...Layout.noShadow},
  loginButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"},
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"},
  loginButtonText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    marginRight: 8},
  footer: { alignItems: "center", marginTop: 32 },
  footerText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.TEXT_SECONDARY},
  signUpText: {
    color: Colors.TEXT_PRIMARY,
    fontFamily: "DMSans_700Bold",
    textDecorationLine: "underline"},
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
    letterSpacing: 2},

  // --- GOOGLE OAUTH STYLES ---
  googleButton: {
    height: 52,
    backgroundColor: Colors.BG_CARD,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_INPUT,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    ...Layout.noShadow},
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"},
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12},
  googleButtonText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.TEXT_PRIMARY},
  oauthErrorCard: {
    backgroundColor: Colors.BG_CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.STATUS_ERROR,
    marginBottom: 12,
    marginTop: 8},
  oauthErrorTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
    color: Colors.STATUS_ERROR,
    marginBottom: 6},
  oauthErrorMessage: { color: Colors.TEXT_SECONDARY, marginBottom: 10, fontFamily: "DMSans_400Regular", fontSize: 13 },
  oauthErrorActions: { flexDirection: 'row', alignItems: 'center' },
  oauthErrorButton: {
    backgroundColor: Colors.CTA_BUTTON,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14},
  oauthErrorButtonText: { color: Colors.TEXT_ON_DARK, fontFamily: "DMSans_700Bold", fontSize: 13 },
  oauthErrorDismiss: { color: '#6b7280' },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8},
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.DIVIDER},
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.TEXT_MUTED}});

export default LoginScreen;
