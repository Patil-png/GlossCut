import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Modal,
  ScrollView,
  KeyboardAvoidingView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import {
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Lock,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Briefcase // Used in Signup header
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. VINTAGE THEME CONSTANTS (Matching SignupScreen)
// ============================================================================
const VINTAGE_COLORS = {
  bgLight: "#FAF7F2",
  bgMid: "#F0EAD6",
  bgDark: "#E6DCCA",
  brownDark: "#3E2723",
  brownMid: "#5D4037",
  brownLight: "#8B4513",
  gold: "#D4AF37",
  textPrimary: "#3E2723",
  textSecondary: "#6D4C41",
  inputBg: "#FFFCF9",
  border: "#D7CCC8"
};

// ============================================================================
// 2. BACKGROUND & DECORATIONS
// ============================================================================
const BackgroundDecorations = React.memo(() => (
  <View style={styles.backgroundDecoration}>
    <View style={styles.glowTopRight} />
    <View style={styles.glowBottomLeft} />
  </View>
));

// ============================================================================
// 3. HEADER SECTION
// ============================================================================
const HeaderSection = React.memo(({ animatedScale }) => (
  <View style={styles.header}>
    <Animated.View style={[styles.logoWrapper, animatedScale]}>
      <View style={styles.logoBorderRing}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/SetKarr.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </Animated.View>
    <View style={styles.headerTextStack}>
      <Text style={styles.preTitle}>WELCOME BACK</Text>
      <Text style={styles.title}>GLOSSCUT SUITE</Text>
      <View style={styles.titleUnderline} />
    </View>
    <Text style={styles.subtitle}>
      Excellence in grooming. Sign in to your chair.
    </Text>
  </View>
));

// ============================================================================
// 4. INPUT COMPONENT (Matching SignupScreen)
// ============================================================================
const InputItem = React.memo(
  ({
    icon: Icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    isSecure = false,
    toggleSecure = null,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{placeholder.toUpperCase()}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.iconWrapper}>
          <Icon size={18} color="#8B5A2B" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Enter ${placeholder}`}
          placeholderTextColor="#BCAAA4"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={isSecure}
        />
        {toggleSecure && (
          <TouchableOpacity onPress={toggleSecure} style={styles.eyeButton}>
            {isSecure ? (
              <EyeOff size={20} color="#8B5A2B" />
            ) : (
              <Eye size={20} color="#8B5A2B" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  ),
);

// ============================================================================
// 5. MODERN ALERT (Ticket Style)
// ============================================================================
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  // Animation Logic
  const translateY = useSharedValue(-200);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      const timer = setTimeout(onHide, 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-200, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const config = useMemo(() => {
    switch (type) {
      case "error":
        return { bg: "#4A1010", border: "#8B2E2E", iconColor: "#E57373", Icon: XCircle };
      case "success":
        return { bg: "#102818", border: "#2E5C3A", iconColor: "#81C784", Icon: CheckCircle };
      case "warning":
        return { bg: "#3E2700", border: "#8F6B1F", iconColor: "#FFD54F", Icon: AlertTriangle };
      default:
        return { bg: "#232323", border: "#444", iconColor: "#E0E0E0", Icon: Info };
    }
  }, [type]);

  if (!visible && translateY.value === -200) return null;

  return (
    <Animated.View style={[styles.alertWrapper, animatedStyle]}>
      <View style={[styles.alertContainer, { backgroundColor: config.bg, borderColor: config.border }]}>
        <View style={styles.alertIconBox}>
          <config.Icon size={22} color={config.iconColor} strokeWidth={2} />
        </View>
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: config.iconColor }]}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
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
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 800 });
    formTranslateY.value = withSpring(0, { damping: 12 });
    iconScale.value = withSpring(1, { damping: 12 });
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
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
      // 1. Initial Login Attempt (Login Only)
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
  // CRITICAL OAUTH ERROR OVERLAY (Vintage Style)
  // ============================================================================
  const renderOAuthErrorOverlay = () => {
    if (!oauthError) return null;

    const isRoleError = oauthError === 'role_not_allowed';

    return (
      <View style={styles.errorOverlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Card */}
        <Animated.View entering={FadeIn.springify()} style={styles.errorCardVintage}>
          {/* Card Header Strip */}
          <View style={styles.cardGoldStrip} />

          <View style={styles.errorCardContent}>
            <View style={[styles.errorIconCircle, isRoleError ? {} : { backgroundColor: '#3E2700' }]}>
              <AlertTriangle size={32} color={isRoleError ? "#D32F2F" : VINTAGE_COLORS.gold} />
            </View>

            <Text style={styles.errorTitleVintage}>
              {isRoleError ? "ACCESS DENIED" : "MEMBER NOT FOUND"}
            </Text>

            <View style={styles.dividerDiamondContainer}>
              <View style={styles.dividerLineShort} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLineShort} />
            </View>

            <Text style={styles.errorMessageVintage}>
              {isRoleError
                ? "This Google account does not have the barber role. Please sign in with a barber account or use email/password."
                : "The Google account provided is not on our guest list. Please register for membership first."}
            </Text>

            <View style={styles.errorButtons}>
              <TouchableOpacity
                style={styles.btnVintageSecondary}
                onPress={() => setOauthError(null)}
              >
                <Text style={styles.btnTextVintageSecondary}>CLOSE</Text>
              </TouchableOpacity>

              {!isRoleError && (
                <TouchableOpacity
                  style={styles.btnVintagePrimary}
                  onPress={() => {
                    setOauthError(null);
                    // 2. Retry with Registration Allowed (Creates Account)
                    googleLogin({ loginOnly: false, requiredRole: 'barber' });
                  }}
                >
                  <Text style={styles.btnTextVintagePrimary}>REGISTER WITH GOOGLE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[VINTAGE_COLORS.bgLight, VINTAGE_COLORS.bgMid, VINTAGE_COLORS.bgDark]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <BackgroundDecorations />



      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.mainContent, animatedFormStyle]}>
            <HeaderSection animatedScale={animatedIconStyle} />

            <View style={styles.formCard}>
              <View style={styles.cardGoldStrip} />

              <View style={styles.cardPadding}>
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

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerDiamond} />
                  <View style={styles.dividerLine} />
                </View>

                {/* Inputs */}
                <InputItem
                  icon={User}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <InputItem
                  icon={Lock}
                  placeholder="Password"
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

                {/* Leather Button */}
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
                    <View style={styles.stitchLine}>
                      {isLoading ? (
                        <ActivityIndicator color="#F5F5F5" />
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
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Not on the list?{" "}
                <TouchableWithoutFeedback onPress={() => navigation.navigate("Signup")}>
                  <Text style={styles.signUpText}>REQUEST MEMBERSHIP</Text>
                </TouchableWithoutFeedback>
              </Text>
            </View>

          </Animated.View>
        </ScrollView>

      </KeyboardAvoidingView>

      {/* Floating Alert (Bottom Render + High Elevation) */}
      <ModernAlert {...alert} onHide={hideAlert} />

      {/* Blocking OAuth Error */}
      {renderOAuthErrorOverlay()}

    </LinearGradient >
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40, justifyContent: 'center' },
  mainContent: { paddingHorizontal: 24, paddingVertical: 20, width: '100%', maxWidth: 420, alignSelf: 'center' },

  // Background
  backgroundDecoration: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  glowTopRight: { position: "absolute", top: -120, right: -100, width: 450, height: 450, borderRadius: 225, backgroundColor: "rgba(212, 175, 55, 0.08)", transform: [{ scale: 1.2 }] },
  glowBottomLeft: { position: "absolute", bottom: -80, left: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: "rgba(93, 64, 55, 0.08)", transform: [{ scale: 1.2 }] },

  // Header
  header: { alignItems: "center", marginBottom: 32, marginTop: height * 0.05 },
  logoWrapper: { shadowColor: "#5D4037", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, margin: 10 },
  logoBorderRing: { borderRadius: 30, padding: 3, backgroundColor: "#D4AF37" },
  logoContainer: { width: 90, height: 90, borderRadius: 27, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F2", borderWidth: 1, borderColor: "#E6DCCA" },
  logo: { width: 65, height: 65 },
  headerTextStack: { alignItems: 'center', marginTop: 24 },
  preTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: VINTAGE_COLORS.brownLight, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "900", color: "#3E2723", letterSpacing: 2 },
  titleUnderline: { width: 40, height: 3, backgroundColor: "#D4AF37", marginVertical: 10, borderRadius: 2 },
  subtitle: { fontSize: 15, color: "#6D4C41", textAlign: "center", maxWidth: 260, fontWeight: "500", fontStyle: "italic", lineHeight: 22 },

  // Form Card
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#EFEBE9", shadowColor: "#8D6E63", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  cardGoldStrip: { height: 4, backgroundColor: VINTAGE_COLORS.gold, width: '100%' },
  cardPadding: { padding: 24, gap: 18 },

  // Inputs
  inputGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: "800", color: "#5D4037", marginLeft: 4, letterSpacing: 1.2 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFCF9", borderWidth: 1, borderColor: "#D7CCC8", borderRadius: 8, height: 54 },
  iconWrapper: { paddingLeft: 16, paddingRight: 12 },
  input: { flex: 1, height: "100%", fontSize: 16, color: "#3E2723", fontWeight: "600", paddingRight: 16 },
  eyeButton: { paddingHorizontal: 16, height: "100%", justifyContent: "center" },

  // Buttons
  forgotButton: { alignSelf: "flex-end", marginTop: -6 },
  forgotText: { fontSize: 13, color: "#8B5A2B", fontWeight: "700" },

  leatherButtonContainer: { marginTop: 8, height: 60, borderRadius: 12, shadowColor: "#3E2723", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  leatherGradient: { flex: 1, borderRadius: 12, padding: 3 },
  stitchLine: { flex: 1, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", borderRadius: 9, justifyContent: "center", alignItems: "center" },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  loginButtonText: { color: "#F5F5F5", fontSize: 16, fontWeight: "800", letterSpacing: 2 },

  // Google
  googleButton: { height: 52, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7CCC8", borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 14, fontWeight: "700", color: "#5D4037" },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  dividerLineShort: { width: 40, height: 1, backgroundColor: "#D7CCC8" },
  dividerDiamond: { width: 6, height: 6, backgroundColor: "#D4AF37", transform: [{ rotate: "45deg" }], marginHorizontal: 12 },
  dividerDiamondContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },

  // Footer
  footer: { alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 13, color: "#8D6E63", fontWeight: "600" },
  signUpText: { color: "#8B4513", fontWeight: "900", letterSpacing: 0.5, marginTop: 4, textDecorationLine: "underline" },

  // Alerts
  alertWrapper: { position: "absolute", top: Platform.OS === "ios" ? 60 : 45, alignSelf: "center", zIndex: 99999, elevation: 100 },
  alertContainer: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 8, borderLeftWidth: 4, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 100, maxWidth: width * 0.92, backgroundColor: '#333' },
  alertIconBox: { marginRight: 14 },
  alertContent: { flexShrink: 1 },
  alertTitle: { fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  alertMessage: { fontSize: 14, color: "#DDD", fontWeight: "500" },

  // ERROR OVERLAY
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: 24 },
  errorCardVintage: { backgroundColor: "#FFF", width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: "#3E2723", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20 },
  errorCardContent: { padding: 32, alignItems: 'center' },
  errorIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFEBEE", justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  errorTitleVintage: { fontSize: 20, fontWeight: "900", color: "#3E2723", letterSpacing: 2, textAlign: 'center' },
  errorMessageVintage: { fontSize: 14, color: "#5D4037", textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  errorButtons: { width: '100%', gap: 12 },
  btnVintagePrimary: { backgroundColor: "#8B4513", paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: "#5D4037" },
  btnTextVintagePrimary: { color: "#F5F5F5", fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  btnVintageSecondary: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: "#EFEBE9" },
  btnTextVintageSecondary: { color: "#5D4037", fontWeight: "700", fontSize: 13 },
});

export default LoginScreen;
