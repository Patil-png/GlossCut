import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
  forwardRef
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
  Mail,
  KeyRound,
  Lock,
  RefreshCw
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
      <Text style={styles.headerTitle}>OTP Verification</Text>
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

// Memoized Digit Input for performance
const DigitInput = memo(
  forwardRef(
    ({ digit, index, theme, loading, onChangeText, onKeyPress }, ref) => {
      const inputStyle = useMemo(
        () => [
          styles.otpInput,
          {
            borderColor: digit ? theme.colors.primary : "#E2E8F0",
            borderWidth: digit ? 2 : 1.5,
            backgroundColor: "#FFFFFF",
            color: "#0F172A"
          },
        ],
        [theme, digit]
      );

      return (
        <TextInput
          ref={ref}
          style={inputStyle}
          maxLength={1}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          onKeyPress={(e) => onKeyPress(e, index)}
          onChangeText={(text) => onChangeText(text, index)}
          value={digit}
          editable={!loading}
          cursorColor={theme.colors.primary}
        />
      );
    }
  )
);

// --- MAIN SCREEN ---

const OTPVerificationScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { email } = route.params || { email: "test@example.com" };

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // Animation Refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const inputs = useRef([]);

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

  const handleChange = useCallback((text, index) => {
    const cleanedText = text.replace(/[^0-9]/g, "");

    if (cleanedText.length > 1) {
      // Handle Paste
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        for (let i = 0; i < cleanedText.length; i++) {
          if (index + i < 6) {
            newOtp[index + i] = cleanedText.charAt(i);
          }
        }
        return newOtp;
      });
      
      // Focus the last filled input or dismiss keyboard
      const lastIndex = Math.min(index + cleanedText.length - 1, 5);
      if (lastIndex === 5) {
        Keyboard.dismiss();
      } else {
        inputs.current[lastIndex + 1]?.focus();
      }
      return;
    }

    setOtp((prevOtp) => {
      const newOtp = [...prevOtp];
      if (cleanedText.length === 0) {
        newOtp[index] = "";
        return newOtp;
      }
      newOtp[index] = cleanedText.charAt(cleanedText.length - 1);
      return newOtp;
    });

    if (cleanedText.length > 0 && index < 5) {
      inputs.current[index + 1]?.focus();
    } else if (cleanedText.length > 0 && index === 5) {
      Keyboard.dismiss();
    }
  }, []);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      setOtp((prevOtp) => {
        if (!prevOtp[index] && index > 0) {
          inputs.current[index - 1]?.focus();
          const newOtp = [...prevOtp];
          newOtp[index - 1] = "";
          return newOtp;
        }
        return prevOtp;
      });
    }
  }, []);

  const handleVerifyOTP = useCallback(async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      showToast("Please enter the full 6-digit code.", "error");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      await api.post(
        `/api/password/verify`,
        { email, otp: otpCode },
        { timeout: 10000 }
      );

      showToast("OTP verified successfully!", "success");
      setTimeout(() => {
        navigation.navigate("ResetPassword", { email, otp: otpCode });
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "The OTP entered is incorrect.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [otp, email, navigation, showToast]);

  const handleResendOTP = useCallback(async () => {
    setLoading(true);
    try {
      await api.post(
        `/api/password/forgot`,
        { email }
      );
      showToast(`A new code has been sent to ${email}`, "success");
    } catch (err) {
      showToast("Could not resend OTP. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  }, [email, showToast]);

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
                source={require("../assets/otp_verification_cartoon.png")} 
                style={styles.illustration}
                resizeMode="contain"
                accessibilityLabel="OTP Verification Illustration"
              />
            </Animated.View>

            {/* 2. Text Header Section */}
            <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
              <Text style={styles.title}>Verification Code</Text>
              <Text style={styles.subtitle}>
                We have sent a 6-digit access code to{"\n"}
                <Text style={{ fontWeight: "700", color: "#0F172A" }}>{email}</Text>
              </Text>
            </Animated.View>

            {/* 3. OTP Input Section */}
            <Animated.View style={[styles.inputWrapper, animatedStyle(2)]}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <DigitInput
                    key={index}
                    index={index}
                    digit={digit}
                    theme={theme}
                    loading={loading}
                    onChangeText={handleChange}
                    onKeyPress={handleKeyPress}
                    ref={(el) => (inputs.current[index] = el)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* 5. Action Section */}
            <Animated.View style={[styles.actionSection, animatedStyle(4)]}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Verify OTP"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Verify OTP</Text>
                    <ArrowRight size={normalize(16)} color="#FFFFFF" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* 4. Resend Section */}
            <Animated.View style={[styles.resendWrapper, animatedStyle(3)]}>
              <TouchableOpacity onPress={!loading ? handleResendOTP : null}>
                <Text style={styles.resendText}>
                  Didn't receive code?{" "}
                  <Text style={[styles.resendLink, { color: theme.colors.primary }]}>RESEND</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 6. Helpful Tips Section */}
            <Animated.View style={[styles.usageContainer, animatedStyle(5)]}>
              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <Mail size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Check Inbox</Text>
                  <Text style={styles.usageDesc}>Look for the email from GLOSSCUT in your inbox.</Text>
                </View>
              </View>
              
              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <RefreshCw size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Check Spam</Text>
                  <Text style={styles.usageDesc}>Sometimes codes end up in the junk or spam folder.</Text>
                </View>
              </View>

              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <ShieldCheck size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Secure Channel</Text>
                  <Text style={styles.usageDesc}>This code is for your eyes only. Never share it with anyone.</Text>
                </View>
              </View>
            </Animated.View>

            {/* 7. Footer Privacy Note */}
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    alignSelf: "center"
  },
  otpInput: {
    width: normalize(42),
    height: normalize(52),
    fontSize: normalize(20),
    textAlign: "center",
    borderRadius: normalize(12),
    fontWeight: "800",
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  resendWrapper: {
    marginBottom: normalize(15),
    alignItems: "center"
  },
  resendText: {
    fontSize: normalize(11),
    color: "#475569",
    fontWeight: "600"
  },
  resendLink: {
    fontWeight: "800",
    letterSpacing: 0.3
  },
  actionSection: {
    marginBottom: normalize(15)
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

export default OTPVerificationScreen;
