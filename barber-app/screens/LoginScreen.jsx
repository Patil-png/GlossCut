import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. MODERN MONO THEME CONSTANTS
// ============================================================================
const MODERN_THEME = {
  bg: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  inputBg: "#E5E5E5",
  inputPlaceholder: "#999999",
  accent: "#000000",
  error: "#D32F2F",
  success: "#388E3C",
  warning: "#FBC02D",
  border: "#E0E0E0"
};

// ============================================================================
// 2. INPUT COMPONENT (Modern Rounded)
// ============================================================================
const InputItem = React.memo(
  ({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    isSecure = false,
    toggleSecure = null,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={MODERN_THEME.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={isSecure}
        />
        {toggleSecure && (
          <TouchableOpacity onPress={toggleSecure} style={styles.eyeButton}>
            {isSecure ? (
              <EyeOff size={20} color={MODERN_THEME.textSecondary} />
            ) : (
              <Eye size={20} color={MODERN_THEME.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
);

// ============================================================================
// 3. MODERN ALERT (Pill Style)
// ============================================================================
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      const timer = setTimeout(onHide, 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const config = useMemo(() => {
    switch (type) {
      case "error":
        return { bg: "#FFEBEE", text: "#D32F2F", Icon: XCircle };
      case "success":
        return { bg: "#E8F5E9", text: "#388E3C", Icon: CheckCircle };
      case "warning":
        return { bg: "#FFFDE7", text: "#FBC02D", Icon: AlertTriangle };
      default:
        return { bg: "#F5F5F5", text: "#000000", Icon: Info };
    }
  }, [type]);

  if (!visible && translateY.value === -100) return null;

  return (
    <Animated.View style={[styles.alertWrapper, animatedStyle]}>
      <View style={[styles.alertContainer, { backgroundColor: config.bg }]}>
        <config.Icon size={20} color={config.text} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: config.text }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: config.text }]}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================================================
// MAIN LOGIN COMPONENT
// ============================================================================
const LoginScreen = () => {
  const { theme } = useTheme();
  const { login, barberLogin, googleLogin, oauthError, setOauthError } = useAuth();
  const navigation = useNavigation();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" });

  // Animations
  const formTranslateY = useSharedValue(100);

  useEffect(() => {
    formTranslateY.value = withSpring(0, { damping: 15 });
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  const showAlert = (title, message, type) => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => setAlert({ ...alert, visible: false });

  // ============================================================================
  // LOGIC
  // ============================================================================

  const handleGoogleLogin = async () => {
    try {
      const result = await googleLogin({ loginOnly: true, requiredRole: 'barber' });
      if (result.success) {
        showAlert("Success", "Authenticating...", "success");
      } else {
        showAlert("Connection Failed", result.message || "Please try again.", "error");
      }
    } catch (error) {
      showAlert("System Error", "Could not reach Google services.", "error");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Details Required", "Please provide your credentials.", "warning");
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const success = await barberLogin(email, password);
      if (success) {
        setOauthError(null);
        showAlert("Welcome", "Access granted.", "success");
        setTimeout(() => navigation.navigate("Home"), 800);
      } else {
        showAlert("Access Denied", "Credentials do not match our records.", "error");
      }
    } catch (err) {
      showAlert("System Error", "Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // ERROR OVERLAY
  // ============================================================================
  const renderOAuthErrorOverlay = () => {
    if (!oauthError) return null;
    const isRoleError = oauthError === 'role_not_allowed';

    return (
      <View style={styles.errorOverlay}>
        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.springify()} style={styles.errorCard}>
          <View style={styles.errorIconCircle}>
            <AlertTriangle size={32} color={MODERN_THEME.error} />
          </View>
          <Text style={styles.errorTitle}>
            {isRoleError ? "ACCESS DENIED" : "MEMBER NOT FOUND"}
          </Text>
          <Text style={styles.errorMessage}>
            {isRoleError
              ? "This Google account does not have the barber role."
              : "The Google account provided is not on our customer list."}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setOauthError(null)}>
              <Text style={styles.btnTextSecondary}>CLOSE</Text>
            </TouchableOpacity>
            {!isRoleError && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => {
                  setOauthError(null);
                  googleLogin({ loginOnly: false, requiredRole: 'barber' });
                }}
              >
                <Text style={styles.btnTextPrimary}>REGISTER</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Image Repeating Pattern */}
      <ImageBackground
        source={require("../assets/login_background.jpeg")}
        style={styles.backgroundImage}
        resizeMode="repeat"
        imageStyle={{ opacity: 0.8 }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Area */}
            <View style={styles.logoArea}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/LoginLogo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* White Rounded Container */}
            <Animated.View style={[styles.whiteCard, animatedFormStyle]}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>Sign in to continue.</Text>

              <View style={styles.formContent}>
                <InputItem
                  label="Name" // Changed from Email to Name to match image
                  placeholder="Jiara Martins" // Placeholder from image
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <InputItem
                  label="Password"
                  placeholder="******"
                  value={password}
                  onChangeText={setPassword}
                  isSecure={!isPasswordVisible}
                  toggleSecure={() => setIsPasswordVisible(!isPasswordVisible)}
                />

                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={() => navigation.navigate("ForgotPassword")}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Log in</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.orDivider}>
                  <Text style={styles.orText}>OR</Text>
                </View>

                {/* Google Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Not on the list ?{" "}
                    <TouchableWithoutFeedback onPress={() => navigation.navigate("Signup")}>
                      <Text style={styles.signUpText}>REQUEST MEMBERSHIP</Text>
                    </TouchableWithoutFeedback>
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ModernAlert {...alert} onHide={hideAlert} />
        {renderOAuthErrorOverlay()}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backgroundImage: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' }, // Push content to bottom

  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 50,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  logo: { width: 70, height: 70 },

  whiteCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 50,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },

  title: { fontSize: 32, fontWeight: "900", color: "#1A1A1A", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#9E9E9E", textAlign: "center", marginBottom: 32 },

  formContent: { gap: 16 },

  // Inputs
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: "700", color: "#B0B0B0", letterSpacing: 2.5, marginLeft: 4 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCDCDC",
    borderRadius: 20,
    height: 56,
    paddingHorizontal: 20
  },
  input: { flex: 1, height: "100%", fontSize: 16, color: "#3A3A3A", fontWeight: "600" },
  eyeButton: { padding: 8 },

  forgotButton: { alignSelf: "flex-end", marginTop: 4 },
  forgotText: { fontSize: 13, color: "#999999", fontWeight: "600" },

  // Buttons
  loginButton: {
    height: 56,
    backgroundColor: "#2B2B2B",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  loginButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },

  orDivider: { alignItems: 'center', marginVertical: 10 },
  orText: { fontSize: 13, color: "#000", fontWeight: "700" },

  googleButton: {
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0
  },
  googleIcon: { width: 24, height: 24, marginRight: 12 },
  googleButtonText: { fontSize: 15, fontWeight: "700", color: "#333" },

  footer: { alignItems: "center", marginTop: 32 },
  footerText: { fontSize: 12, color: "#000000", fontWeight: "600" },
  signUpText: { color: "#000000", fontWeight: "900", letterSpacing: 0, fontSize: 12, textTransform: 'uppercase' },

  // Alerts & Overlays
  alertWrapper: { position: "absolute", top: 50, alignSelf: "center", width: '90%', zIndex: 99999, elevation: 100 },
  alertContainer: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  alertMessage: { fontSize: 13, fontWeight: "400" },

  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: 24 },
  errorCard: { backgroundColor: "#FFF", width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  errorIconCircle: { marginBottom: 16, backgroundColor: '#FFEBEE', padding: 16, borderRadius: 40 },
  errorTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 8, textAlign: 'center' },
  errorMessage: { fontSize: 15, color: "#666", textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  errorButtons: { width: '100%', gap: 12 },
  btnPrimary: { backgroundColor: "#000", paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnTextPrimary: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  btnSecondary: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: "#F5F5F5" },
  btnTextSecondary: { color: "#333", fontWeight: "700", fontSize: 14 },
});

export default LoginScreen;
