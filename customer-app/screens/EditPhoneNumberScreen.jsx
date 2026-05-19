import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  TextInput,
  Easing,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ShieldAlert,
  Fingerprint,
  BellRing,
  MessagesSquare
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

/**
 * Normalizes font size and dimensions based on screen width
 * Industry standard approach for responsive React Native UIs
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
      <Text style={styles.headerTitle}>Display Identity</Text>
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
  const iconColor = isSuccess ? "#10B981" : "#F59E0B";

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

const EditPhoneNumberScreen = ({ navigation }) => {
  const { user } = useAuth() || { user: {} };
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState("");

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Staggered Animation Refs
  const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (user?.phone) {
      const number = user.phone.startsWith("+91") ? user.phone.slice(3) : user.phone;
      setPhoneNumber(number);
    }

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

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(100, animations)
    ]).start();

    // Floating Loop Animation for illustration
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
  }, [user]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

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
          scrollEventThrottle={16}
        >
          <View style={styles.centeredContentWrapper}>
            {/* 1. Illustration Section */}
            <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
              <Image
                source={require("../assets/phone_verification_illustration_1778294935586.png")}
                style={styles.illustration}
                resizeMode="contain"
                accessibilityLabel="Identity Verification Illustration"
              />
            </Animated.View>

            {/* 2. Text Header Section */}
            <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
              <Text style={styles.title}>Identity Verification</Text>
              <Text style={styles.subtitle}>
                Your phone number is more than just contact info—it's your secure gateway to the GLOSSCUT ecosystem.
              </Text>
            </Animated.View>

            {/* 3. Input Section (Moved up) */}
            <Animated.View style={[styles.inputWrapper, animatedStyle(2)]}>
              <View style={styles.inputOutline}>
                <View style={styles.labelBackground}>
                  <Text style={styles.inputLabel}>VERIFIED MOBILE</Text>
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  <View style={styles.verticalDivider} />
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    editable={false}
                    accessibilityLabel="Registered phone number"
                    accessibilityHint="This number is verified and cannot be edited directly."
                  />
                  <CheckCircle size={18} color="#10B981" />
                </View>
              </View>
            </Animated.View>

            {/* 4. Usage Benefits Section */}
            <Animated.View style={[styles.usageContainer, animatedStyle(3)]}>
              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <Fingerprint size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Secure Authentication</Text>
                  <Text style={styles.usageDesc}>Used for encrypted two-factor security protocols.</Text>
                </View>
              </View>

              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <BellRing size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Smart Notifications</Text>
                  <Text style={styles.usageDesc}>Real-time status updates on your bookings & queue.</Text>
                </View>
              </View>

              <View style={styles.usageItem}>
                <View style={styles.iconCircle}>
                  <MessagesSquare size={normalize(16)} color={theme.colors.primary} />
                </View>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>Studio Access</Text>
                  <Text style={styles.usageDesc}>Direct encrypted communication with your stylist.</Text>
                </View>
              </View>
            </Animated.View>


            {/* 5. Security Protocol Note */}
            <Animated.View style={[styles.noteContainer, animatedStyle(4)]}>
              <View style={styles.noteHeader}>
                <ShieldAlert size={16} color="#B91C1C" strokeWidth={2.5} />
                <Text style={styles.noteTitle}>SECURITY PROTOCOL</Text>
              </View>
              <Text style={styles.noteText}>
                For your account safety, identity-linked contact details are locked. If you no longer have access to this number, please contact our <Text style={{ fontWeight: '700' }}>Administrative Support</Text> with valid ID proof to initiate a manual identity recovery and update process.
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
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2
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
    marginBottom: normalize(30)
  },
  inputOutline: {
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    backgroundColor: "#F8FAFC"
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
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.8
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  countryCode: {
    fontSize: normalize(15),
    color: "#0F172A",
    fontWeight: "800"
  },
  verticalDivider: {
    width: 2,
    height: normalize(24),
    backgroundColor: "#E2E8F0",
    marginHorizontal: normalize(16),
    borderRadius: 1
  },
  textInput: {
    flex: 1,
    fontSize: normalize(16),
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: 1
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#FEF2F2",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#FEE2E2"
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
    color: "#B91C1C",
    letterSpacing: 1
  },
  noteText: {
    fontSize: normalize(11),
    color: "#991B1B",
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

export default EditPhoneNumberScreen;