import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
  forwardRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Keyboard,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext.jsx";

// --- 1. MEMOIZED MODERN ALERT (Prevents re-renders during typing) ---
const ModernAlert = memo(
  ({ visible, type, title, message, onClose, theme }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
          handleClose();
        }, 4000);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    const handleClose = useCallback(() => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onClose) onClose();
      });
    }, [onClose, translateY]);

    if (!visible) return null;

    const isSuccess = type === "success";
    const bgColor = theme.colors.card;
    const textColor = theme.colors.text;
    const accentColor = isSuccess ? "#10B981" : "#EF4444";

    return (
      <Animated.View
        style={[styles.alertWrapper, { transform: [{ translateY }] }]}
      >
        <View style={[styles.alertContainer, { backgroundColor: bgColor }]}>
          <View
            style={[styles.accentStrip, { backgroundColor: accentColor }]}
          />
          <View style={styles.alertContent}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isSuccess ? "#D1FAE5" : "#FEE2E2" },
              ]}
            >
              <Icon
                name={isSuccess ? "check" : "alert-triangle"}
                size={20}
                color={accentColor}
              />
            </View>
            <View style={styles.textStack}>
              <Text style={[styles.alertTitle, { color: textColor }]}>
                {title}
              </Text>
              <Text
                style={[
                  styles.alertMessage,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={2}
              >
                {message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Icon name="x" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }
);

// --- 2. MEMOIZED HEADER & TEXT (Static parts won't re-render) ---
const Header = memo(({ navigation, theme }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={[styles.backButton, { backgroundColor: theme.colors.card }]}
      activeOpacity={0.7}
    >
      <Icon name="chevron-left" size={26} color={theme.colors.text} />
    </TouchableOpacity>
  </View>
));

const PageTitle = memo(({ email, theme }) => (
  <>
    <Text style={[styles.title, { color: theme.colors.text }]}>
      OTP Verification
    </Text>
    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
      Enter the 6-digit code sent to{"\n"}
      {email}
    </Text>
  </>
));

// --- 3. MEMOIZED DIGIT INPUT (Crucial for performance) ---
// This ensures that when Input 1 updates, Input 2, 3, 4, 5, 6 do NOT re-render.
const DigitInput = memo(
  forwardRef(
    ({ digit, index, theme, loading, onChangeText, onKeyPress }, ref) => {
      // Memoize dynamic styles
      const inputStyle = useMemo(
        () => [
          styles.otpInput,
          {
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            borderColor: digit ? theme.colors.primary : "transparent",
            borderWidth: 1.5,
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
        />
      );
    }
  )
);

// --- 4. MAIN SCREEN ---
const OTPVerificationScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { email } = route.params || { email: "test@example.com" };

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const [alertState, setAlertState] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const inputs = useRef([]);

  const showAlert = useCallback((type, title, message) => {
    setAlertState({ visible: true, type, title, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  // --- OPTIMIZED HANDLERS (Wrapped in useCallback) ---
  const handleChange = useCallback((text, index) => {
    const cleanedText = text.replace(/[^0-9]/g, "");

    setOtp((prevOtp) => {
      // Functional update to avoid dependency on 'otp' state
      if (cleanedText.length === 0) {
        // Handle clear/backspace logic if text is empty (rare in this flow due to maxLength=1)
        const newOtp = [...prevOtp];
        newOtp[index] = "";
        return newOtp;
      }
      const newOtp = [...prevOtp];
      newOtp[index] = cleanedText.charAt(cleanedText.length - 1);
      return newOtp;
    });

    // Focus logic doesn't trigger state update, so it's safe
    if (cleanedText.length > 0 && index < 5) {
      inputs.current[index + 1]?.focus();
    } else if (cleanedText.length > 0 && index === 5) {
      Keyboard.dismiss();
    }
  }, []); // Empty dependency array = function never recreated

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0) {
      // We need to check current value. Since we are inside callback,
      // we check the ref or we can check state if we include it in deps.
      // For performance, we can just optimistically move back if empty.
      // But to be precise, let's access the latest state via setOtp callback or similar.
      // Simplest effective way for backspace focus:
      setOtp((prevOtp) => {
        if (!prevOtp[index]) {
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
    // We need the latest OTP, so we can't fully memoize without 'otp' dependency
    // But since this is a button press, re-creation is cheap.
    // We can't access 'otp' inside useCallback without adding it to deps unless we use a ref for otp.
    // However, for the button, standard function is fine.

    // To keep it strictly clean, we'll use the 'otp' from closure,
    // but the button only re-renders when OTP changes which is acceptable.
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      showAlert(
        "error",
        "Incomplete Code",
        "Please enter the full 6-digit code sent to your email."
      );
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/password/verify`,
        {
          email,
          otp: otpCode,
        },
        { timeout: 10000 }
      );

      showAlert(
        "success",
        "Verified Successfully",
        "Redirecting to password reset..."
      );
      setTimeout(() => {
        navigation.navigate("ResetPassword", { email, otp: otpCode });
      }, 1500);
    } catch (err) {
      if (err.response) {
        showAlert(
          "error",
          "Verification Failed",
          err.response.data.message || "The OTP entered is incorrect."
        );
      } else if (err.request) {
        showAlert(
          "error",
          "Connection Error",
          "Could not reach the server. Please check your internet connection."
        );
      } else {
        showAlert(
          "error",
          "Something went wrong",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [otp, email, navigation, showAlert]);

  const handleResendOTP = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/password/forgot`,
        { email }
      );
      showAlert(
        "success",
        "Code Resent",
        `A new code has been sent to ${email}`
      );
    } catch (err) {
      if (!err.response) {
        showAlert(
          "error",
          "Network Error",
          "Please check your internet connection."
        );
      } else {
        showAlert(
          "error",
          "Failed",
          "Could not resend OTP. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [email, showAlert]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Alert Layer */}
      <View style={styles.alertLayer}>
        <ModernAlert
          visible={alertState.visible}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
          theme={theme}
        />
      </View>

      <View style={styles.container}>
        {/* Memoized Header */}
        <Header navigation={navigation} theme={theme} />

        <View style={styles.contentContainer}>
          {/* Memoized Title */}
          <PageTitle email={email} theme={theme} />

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

          <TouchableOpacity onPress={!loading ? handleResendOTP : null}>
            <Text
              style={[styles.resendText, { color: theme.colors.textSecondary }]}
            >
              OTP not received?{" "}
              <Text
                style={[styles.resendLink, { color: theme.colors.primary }]}
              >
                RESEND
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleVerifyOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.buttonText, { color: theme.colors.background }]}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // Alert Styles
  alertLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  alertWrapper: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  alertContainer: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 65,
    width: "100%",
  },
  accentStrip: {
    width: 5,
    height: "100%",
  },
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textStack: {
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Page Styles
  header: {
    width: "100%",
    paddingVertical: 15,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    fontSize: 22,
    textAlign: "center",
    borderRadius: 10,
    fontWeight: "700",
  },
  resendText: {
    textAlign: "center",
    fontSize: 15,
    marginBottom: 40,
  },
  resendLink: {
    fontWeight: "bold",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
  },
});

export default OTPVerificationScreen;
