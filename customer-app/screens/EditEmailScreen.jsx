import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENTS (Defined outside to prevent re-creation) ---

const Header = memo(({ onBack }) => (
  <View style={styles.navBar}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backBtn}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Easier to tap
    >
      <ChevronLeft size={24} color="#000" />
    </TouchableOpacity>
  </View>
));

const Illustration = memo(({ primaryColor }) => (
  <View style={styles.illustrationArea}>
    <View style={[styles.circleBack, { backgroundColor: primaryColor + "15" }]}>
      <View
        style={[styles.circleFront, { backgroundColor: primaryColor + "25" }]}
      >
        <Mail size={48} color={primaryColor} />
      </View>
    </View>
  </View>
));

const Footer = memo(() => (
  <View style={styles.footer}>
    <ShieldCheck size={16} color="#10B981" />
    <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
  </View>
));

/**
 * Modern Custom Alert Component
 * Slides from top (marginTop: 40)
 */
const CustomToast = ({ visible, message, type, animatedValue }) => {
  if (!visible) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0], // Slides from -100 to 0 (relative to container)
  });

  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle : AlertCircle;
  const iconColor = isSuccess ? "#10B981" : "#EF4444";
  const borderColor = isSuccess ? "#10B981" : "#EF4444";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.toastContent, { borderLeftColor: borderColor }]}>
        <Icon size={24} color={iconColor} strokeWidth={2.5} />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>
            {isSuccess ? "Success" : "Support Info"}
          </Text>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---

const EditEmailScreen = ({ navigation }) => {
  // Safe Fallbacks for Contexts to prevent crashes if context is missing
  const { theme } = useTheme() || { theme: { colors: { primary: "#000000", textSecondary: "#666" } } };
  const { user } = useAuth() || { user: {} };

  // --- ANIMATION REFS ---
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;
  
  // Alert Animation Refs
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // --- MOUNT ANIMATION ---
  useEffect(() => {
    // Run enter animation
    const enterAnim = Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);
    
    enterAnim.start();

    return () => {
        // Cleanup timers on unmount to prevent leaks
        if (timerRef.current) clearTimeout(timerRef.current);
        enterAnim.stop();
    };
  }, []);

  // --- HANDLERS ---

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // NEW: Custom Alert Handler replacing standard Alert
  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ visible: true, message, type });

    // Spring animation for "bouncy" feel like modern apps
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Auto hide after 3 seconds
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast((prev) => ({ ...prev, visible: false })));
    }, 3000);
  }, []);

  const handleSupport = useCallback(() => {
    // Replaced standard Alert with Custom Toast
    showToast("Contact support@gloss.cut for assistance.", "info");
  }, [showToast]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Modern Toast Notification Overlay */}
      <View style={styles.toastWrapper}>
        <CustomToast 
            visible={toast.visible} 
            message={toast.message} 
            type={toast.type}
            animatedValue={toastAnim} 
        />
      </View>

      <SafeAreaView style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          {/* Header */}
          <Header onBack={handleGoBack} />

          <View style={styles.contentContainer}>
            {/* Illustration */}
            <Illustration primaryColor={theme.colors.primary} />

            <Animated.View
              style={{
                opacity: fade,
                transform: [{ translateY: slideUp }],
              }}
            >
              {/* Text Header */}
              <View>
                <Text style={styles.heading}>Email Address</Text>
                <Text style={styles.subHeading}>
                  Your email address is used for notifications and account recovery. It cannot be changed directly from here.
                </Text>
              </View>

              {/* Email Display (Read Only) */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.emailDisplayContainer}>
                  <Text style={styles.emailText} numberOfLines={1}>
                    {user?.email || "thakurthansen@gmail.com"}
                  </Text>
                  <Mail size={20} color="#9CA3AF" />
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSupport}
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.btnText}>Contact Support</Text>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Help Link */}
              <TouchableOpacity style={styles.helpLink} onPress={handleSupport}>
                <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                  Having trouble?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer */}
          <Footer />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flexOne: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start",
    zIndex: 1,
  },
  backBtn: {
    marginTop: 26,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 60, // Slightly reduced for better center optical balance
  },
  
  // --- TOAST STYLES ---
  toastWrapper: {
    position: 'absolute',
    top: 0, // We will use margin inside the toast component
    left: 0,
    right: 0,
    zIndex: 100, // Ensure it floats above everything
    alignItems: 'center',
  },
  toastContainer: {
    marginTop: 50, // Matches the requested "marginTop: 40" area (+ status bar buffer)
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 4,
    borderRadius: 4, // Inner radius to match border curve
  },
  toastTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toastTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // --- ILLUSTRATION ---
  illustrationArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  circleBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  circleFront: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- TEXT ---
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: "500",
  },

  // --- INPUT DISPLAY ---
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emailDisplayContainer: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#F7F8F9",
    borderColor: "#E5E7EB", // Added slight border for definition
    borderWidth: 1,
  },
  emailText: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },

  // --- BUTTONS ---
  submitBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  helpLink: {
    alignItems: "center",
    marginTop: 24,
    padding: 10, // Increased touch area
  },
  helpText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // --- FOOTER ---
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default EditEmailScreen;