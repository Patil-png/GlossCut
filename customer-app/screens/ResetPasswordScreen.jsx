import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  Easing,
  Image,
  Keyboard
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from "lucide-react-native";
import api from "../utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

/**
 * Normalizes font size and dimensions
 */
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

// --- OPTIMIZED SUB-COMPONENTS ---

const Header = memo(({ onBack, insets }) => (
  <View 
    style={[styles.headerOuterContainer, { paddingTop: Math.max(insets.top, 16) }]}
    accessibilityRole="header"
  >
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        onPress={onBack} 
        style={styles.backBtn}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Reset Password</Text>
      <View style={{ width: normalize(40) }} />
    </View>
  </View>
));

const CustomToast = memo(({ visible, message, type, animatedValue }) => {
  if (!visible) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const isSuccess = type === "success";
  const iconColor = isSuccess ? "#10B981" : "#EF4444";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.toastContent, { borderLeftColor: iconColor }]}>
        {isSuccess ? <CheckCircle size={20} color={iconColor} /> : <AlertCircle size={20} color={iconColor} />}
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// --- MAIN SCREEN ---

const ResetPasswordScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { email, otp } = route.params || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Animation Refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    // Staggered Entrance Animation
    const animations = itemAnims.map((anim, i) => 
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(itemFades[i], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );

    Animated.stagger(100, animations).start();

    // Floating Loop Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(p => ({ ...p, visible: false })));
    }, 3000);
  }, []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const validateInputs = () => {
    let valid = true;
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Must be at least 6 characters");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmError("Please confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    } else {
      setConfirmError("");
    }

    return valid;
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!validateInputs()) {
      showToast("Please fix the errors above.", "error");
      return;
    }

    setLoading(true);

    try {
      await api.post(
        `/api/password/reset`,
        { email, otp, password },
        { timeout: 10000 }
      );

      showToast("Password reset successfully!", "success");

      setTimeout(() => {
        navigation.popToTop();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Toast Notification */}
      <View style={[styles.toastWrapper, { top: insets.top + 10 }]}>
        <CustomToast visible={toast.visible} message={toast.message} type={toast.type} animatedValue={toastAnim} />
      </View>

      <Header onBack={handleGoBack} insets={insets} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.content}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centeredContentWrapper}>
            {/* 1. Illustration Section */}
            <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
              <Image 
                source={require("../assets/reset_password_cartoon.png")} 
                style={styles.illustration}
                resizeMode="contain"
                accessibilityLabel="Reset Password Illustration"
              />
            </Animated.View>

            {/* 2. Text Header Section */}
            <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
              <Text style={styles.title}>Secure New Password</Text>
              <Text style={styles.subtitle}>
                Create a strong, unique password that you don't use for other accounts.
              </Text>
            </Animated.View>

            {/* 3. Input Section - New Password */}
            <Animated.View style={[styles.inputWrapper, animatedStyle(2)]}>
              <View style={[styles.inputOutline, passwordError ? { borderColor: "#EF4444" } : {}]}>
                <View style={styles.labelBackground}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                </View>
                <View style={styles.inputContent}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (text.length > 0 && text.length < 6) {
                        setPasswordError("Password must be at least 6 characters");
                      } else {
                        setPasswordError("");
                      }
                      if (confirmPassword && text !== confirmPassword) {
                        setConfirmError("Passwords do not match");
                      } else if (confirmPassword && text === confirmPassword) {
                        setConfirmError("");
                      }
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    accessibilityLabel="Enter new password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>
              </View>
              {passwordError ? (
                <View style={styles.inlineErrorContainer}>
                  <AlertCircle size={normalize(12)} color="#EF4444" />
                  <Text style={styles.inlineErrorText}>{passwordError}</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* 3.5 Input Section - Confirm Password */}
            <Animated.View style={[styles.inputWrapper, animatedStyle(3)]}>
              <View style={[styles.inputOutline, confirmError ? { borderColor: "#EF4444" } : {}]}>
                <View style={styles.labelBackground}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                </View>
                <View style={styles.inputContent}>
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (text && password && text !== password) {
                        setConfirmError("Passwords do not match");
                      } else {
                        setConfirmError("");
                      }
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirm}
                    accessibilityLabel="Confirm new password"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>
              </View>
              {confirmError ? (
                <View style={styles.inlineErrorContainer}>
                  <AlertCircle size={normalize(12)} color="#EF4444" />
                  <Text style={styles.inlineErrorText}>{confirmError}</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* 4. Action Section */}
            <Animated.View style={[styles.actionSection, animatedStyle(4)]}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleResetPassword}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Reset Password"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Reset Password</Text>
                    <ArrowRight size={normalize(16)} color="#FFFFFF" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* 5. Requirements Section */}
            <Animated.View style={[styles.usageContainer, animatedStyle(5)]}>
              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <Lock size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Min. 6 Characters</Text>
                  <Text style={styles.usageDesc}>Your password must be at least 6 characters long.</Text>
                </View>
              </View>
              
              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <ShieldCheck size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>High Security</Text>
                  <Text style={styles.usageDesc}>Use a mix of letters, numbers, and symbols for best safety.</Text>
                </View>
              </View>
            </Animated.View>

            {/* 6. Footer Privacy Note */}
            <Animated.View style={[styles.noteContainer, animatedStyle(5)]}>
              <View style={styles.noteHeader}>
                <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.noteTitle}>SECURE PROTOCOL</Text>
              </View>
              <Text style={styles.noteText}>
                We use bank-grade encryption to secure your data. Reset links and codes expire within 15 minutes for your safety.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  content: {
    flex: 1
  },
  headerOuterContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    maxWidth: 500,
    width: "100%",
    alignSelf: "center"
  },
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  scrollContent: {
    paddingTop: normalize(10),
    width: "100%"
  },
  centeredContentWrapper: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: normalize(24)
  },
  illustrationContainer: {
    width: "100%",
    height: normalize(180),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(20)
  },
  illustration: {
    width: "85%",
    height: "100%"
  },
  textContainer: {
    marginBottom: normalize(28)
  },
  title: {
    fontSize: normalize(24),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
    marginBottom: normalize(10),
    textAlign: "center"
  },
  subtitle: {
    fontSize: normalize(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: normalize(20),
    fontWeight: "500",
    paddingHorizontal: normalize(10)
  },
  usageContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: normalize(20),
    padding: normalize(20),
    marginBottom: normalize(30),
    gap: normalize(18),
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(14)
  },
  iconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageTextContent: {
    flex: 1
  },
  usageTitle: {
    fontSize: normalize(13),
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: normalize(2)
  },
  usageDesc: {
    fontSize: normalize(11),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: normalize(16)
  },
  inputWrapper: {
    width: "100%",
    marginBottom: normalize(24)
  },
  inputOutline: {
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  labelBackground: {
    position: "absolute",
    top: normalize(-8),
    left: normalize(12),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: normalize(4),
    zIndex: 1
  },
  inputLabel: {
    fontSize: normalize(9),
    color: "#64748B",
    fontWeight: "900",
    letterSpacing: 1
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1
  },
  textInput: {
    flex: 1,
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3
  },
  inlineErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(8),
    marginLeft: normalize(4),
    gap: normalize(4)
  },
  inlineErrorText: {
    fontSize: normalize(11),
    color: "#EF4444",
    fontWeight: "600"
  },
  actionSection: {
    marginBottom: normalize(30)
  },
  primaryBtn: {
    height: normalize(58),
    borderRadius: normalize(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(12),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  btnText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.2
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: normalize(20)
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    marginBottom: normalize(8)
  },
  noteTitle: {
    fontSize: normalize(11),
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1
  },
  noteText: {
    fontSize: normalize(11),
    color: "#166534",
    lineHeight: normalize(18),
    fontWeight: "500"
  },
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2000,
    alignItems: "center"
  },
  toastContainer: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: "#FFF",
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  toastContent: {
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toastTextContainer: {
    flex: 1
  },
  toastMessage: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  }
});

export default ResetPasswordScreen;
