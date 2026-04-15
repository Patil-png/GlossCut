import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing,
  Keyboard} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  WifiOff} from "lucide-react-native";

const { width } = Dimensions.get("window");

// ====================================================================
// OPTIMIZED SUB-COMPONENTS (Defined outside to prevent re-creation)
// ====================================================================

// 1. Toast Notification (Memoized)
const ToastNotification = React.memo(
  ({ visible, type, title, message, onHide, topOffset = 60 }) => {
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const colors = {
      success: { bg: "#ECFDF5", border: "#10B981", icon: "#059669" },
      error: { bg: "#FEF2F2", border: "#EF4444", icon: "#DC2626" },
      info: { bg: "#EFF6FF", border: "#3B82F6", icon: "#2563EB" },
      warning: { bg: "#FFFBEB", border: "#F59E0B", icon: "#D97706" }};

    const activeColor = colors[type] || colors.info;

    let IconComponent = Info;
    if (type === "success") IconComponent = CheckCircle2;
    if (type === "error") IconComponent = AlertCircle;
    if (type === "warning") IconComponent = WifiOff;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: topOffset,
            friction: 6,
            tension: 50,
            useNativeDriver: true}),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true}),
        ]).start();

        const timer = setTimeout(() => handleClose(), 3500);
        return () => clearTimeout(timer);
      }
    }, [visible, topOffset]);

    const handleClose = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true}),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true}),
      ]).start(() => {
        if (onHide) onHide();
      });
    };

    if (!visible) return null;

    return (
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [{ translateY }],
            opacity,
            shadowColor: activeColor.border},
        ]}
      >
        <View
          style={[styles.toastContent, { borderLeftColor: activeColor.border }]}
        >
          <View style={[styles.iconBox, { backgroundColor: activeColor.bg }]}>
            <IconComponent
              size={20}
              color={activeColor.icon}
              strokeWidth={2.5}
            />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.toastTitle}>{title}</Text>
            <Text style={styles.toastMessage}>{message}</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  },
  (prev, next) => prev.visible === next.visible && prev.title === next.title
);

// 2. Static Header (Memoized)
const Header = React.memo(({ onBack }) => (
  <View style={styles.navBar}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <ChevronLeft size={24} color="#000" />
    </TouchableOpacity>
  </View>
));

// 3. Static Illustration (Memoized)
const Illustration = React.memo(({ primaryColor }) => (
  <View style={styles.illustrationArea}>
    <View style={[styles.circleBack, { backgroundColor: primaryColor + "15" }]}>
      <View
        style={[styles.circleFront, { backgroundColor: primaryColor + "25" }]}
      >
        <KeyRound size={48} color={primaryColor} />
        <View style={styles.lockBadge}>
          <Lock size={14} color="#fff" strokeWidth={3} />
        </View>
      </View>
    </View>
  </View>
));

// 4. Static Text Content (Memoized)
const TextSection = React.memo(() => (
  <View>
    <Text style={styles.heading}>Forgot Password?</Text>
    <Text style={styles.subHeading}>
      Don't worry! It happens. Please enter the address associated with your
      account.
    </Text>
  </View>
));

// 5. Static Footer (Memoized)
const Footer = React.memo(() => (
  <View style={styles.footer}>
    <ShieldCheck size={16} color="#10B981" />
    <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
  </View>
));

// ====================================================================
// MAIN COMPONENT
// ====================================================================

const ChangePasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Alert State
  const [toast, setToast] = useState({
    visible: false,
    type: "",
    title: "",
    message: ""});

  // Animation Refs
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Mount Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true}),
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true}),
    ]).start();
  }, []);

  // Handlers
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const triggerToast = useCallback((type, title, message) => {
    setToast({ visible: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSupport = useCallback(() => {
    triggerToast("info", "Support", "Please email us at support@gloss.cut");
  }, [triggerToast]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handleSendOTP = useCallback(async () => {
    Keyboard.dismiss();

    if (!email || email.trim() === "") {
      triggerToast(
        "error",
        "Email Required",
        "Please enter your email address to proceed."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      triggerToast(
        "error",
        "Invalid Format",
        "The email address you entered is invalid."
      );
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      triggerToast(
        "success",
        "Email Sent",
        "We sent a 6-digit code to your inbox."
      );

      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate("OTPVerification", { email });
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      triggerToast(
        "warning",
        "Connection Failed",
        "Could not reach the server. Please check your internet."
      );
    }
  }, [email, navigation, triggerToast]);

  // Memoized Styles for Input/Button to avoid calculation on render
  const inputContainerStyle = useMemo(
    () => ({
      ...styles.inputWrapper,
      backgroundColor: isFocused ? "#fff" : "#F7F8F9",
      borderColor: isFocused ? theme.colors.primary : "#F7F8F9",
      borderWidth: 2}),
    [isFocused, theme.colors.primary]
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onHide={hideToast}
        topOffset={Platform.OS === "android" ? 30 : 50}
      />

      <SafeAreaView style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          <Header onBack={handleGoBack} />

          <View style={styles.contentContainer}>
            <Illustration primaryColor={theme.colors.primary} />

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <TextSection />

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="glosscut@company.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    cursorColor={theme.colors.primary}
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendOTP}
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Submit</Text>
                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpLink} onPress={handleSupport}>
                <Text
                  style={[
                    styles.helpText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Having trouble?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Footer />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff"},
  flexOne: {
    flex: 1},
  // Toast Styles
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8},
  toastContent: {
    backgroundColor: "#fff",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    gap: 12},
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"},
  textBox: {
    flex: 1},
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2},
  toastMessage: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500"},
  // UI Styles
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start"},
  backBtn: {
    marginTop: 26,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5"},
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 80},
  illustrationArea: {
    alignItems: "center",
    marginBottom: 40},
  circleBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center"},
  circleFront: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"},
  lockBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff"},
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5},
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: "500"},
  inputSection: {
    marginBottom: 24},
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5},
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center"},
  textInput: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    height: "100%"},
  submitBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8},
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff"},
  helpLink: {
    alignItems: "center",
    marginTop: 24},
  helpText: {
    fontSize: 14,
    fontWeight: "600"},
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8},
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500"}});

export default ChangePasswordScreen;
