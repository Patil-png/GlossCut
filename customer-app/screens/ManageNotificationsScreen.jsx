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
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Bell,
  Smartphone,
  ShieldAlert
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

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
      <Text style={styles.headerTitle}>Account Settings</Text>
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

export default function ManageNotificationsScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [isSaving, setIsSaving] = useState(false);

  // Animation Refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(5)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

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
    
    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(p => ({ ...p, visible: false })));
    }, 3000);
  }, []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleToggleNotifications = useCallback(
    async (newValue) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const originalValue = notificationsEnabled;
      setNotificationsEnabled(newValue);
      setIsSaving(true);

      try {
        const result = await Promise.race([
          updateProfile({ notificationsEnabled: newValue }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 7000)
          ),
        ]);

        if (result) {
          showToast("Settings updated successfully.", "success");
        } else {
          throw new Error();
        }
      } catch (e) {
        setNotificationsEnabled(originalValue);
        showToast(
          e.message === "timeout" ? "Network timeout" : "Update failed",
          "error"
        );
      } finally {
        setIsSaving(false);
      }
    },
    [notificationsEnabled, updateProfile, showToast]
  );

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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(40) }]}
      >
        <View style={styles.centeredContentWrapper}>
          {/* 1. Illustration Section */}
          <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
            <Image 
              source={require("../assets/notifications_cartoon.png")} 
              style={styles.illustration}
              resizeMode="contain"
              accessibilityLabel="Settings Illustration"
            />
          </Animated.View>

          {/* 2. Text Header Section */}
          <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
            <Text style={styles.title}>Alert Settings</Text>
            <Text style={styles.subtitle}>
              Stay informed about your appointments, reminders, and exclusive grooming deals.
            </Text>
          </Animated.View>

          {/* 3. Toggle Section */}
          <Animated.View style={[styles.inputWrapper, animatedStyle(2)]}>
            <View style={styles.optionCard}>
              <View style={styles.textStack}>
                <Text style={styles.optionTitle}>Push Notifications</Text>
                <Text style={styles.optionSub}>Receive updates and reminders</Text>
              </View>
              <Switch
                trackColor={{ false: "#E2E8F0", true: theme.colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#FFFFFF"}
                ios_backgroundColor="#E2E8F0"
                onValueChange={handleToggleNotifications}
                value={notificationsEnabled}
                disabled={isSaving}
              />
            </View>
          </Animated.View>

          {/* 4. Usage Benefits Section */}
          <Animated.View style={[styles.usageContainer, animatedStyle(3)]}>
            <View style={styles.usageItem}>
              <View style={styles.iconCircle}>
                <Bell size={normalize(16)} color={theme.colors.primary} />
              </View>
              <View style={styles.usageTextContent}>
                <Text style={styles.usageTitle}>Real-time Updates</Text>
                <Text style={styles.usageDesc}>Get instant alerts for your appointment confirmations.</Text>
              </View>
            </View>
            
            <View style={styles.usageItem}>
              <View style={styles.iconCircle}>
                <Smartphone size={normalize(16)} color={theme.colors.primary} />
              </View>
              <View style={styles.usageTextContent}>
                <Text style={styles.usageTitle}>Exclusive Deals</Text>
                <Text style={styles.usageDesc}>Never miss out on limited-time discounts and offers.</Text>
              </View>
            </View>

            <View style={styles.usageItem}>
              <View style={styles.iconCircle}>
                <ShieldAlert size={normalize(16)} color={theme.colors.primary} />
              </View>
              <View style={styles.usageTextContent}>
                <Text style={styles.usageTitle}>Account Security</Text>
                <Text style={styles.usageDesc}>Receive immediate alerts for any suspicious activity.</Text>
              </View>
            </View>
          </Animated.View>

          {/* 5. Footer Privacy Note */}
          <Animated.View style={[styles.noteContainer, animatedStyle(4)]}>
            <View style={styles.noteHeader}>
              <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.noteTitle}>PRIVACY PROMISE</Text>
            </View>
            <Text style={styles.noteText}>
              We only send essential updates. You can manage or disable your notification preferences at any time.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
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
  inputWrapper: {
    width: "100%",
    marginBottom: normalize(24)
  },
  optionCard: {
    height: normalize(72),
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(20),
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    justifyContent: "space-between"
  },
  textStack: {
    flex: 1
  },
  optionTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: normalize(2)
  },
  optionSub: {
    fontSize: normalize(12),
    color: "#64748B",
    fontWeight: "500"
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
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7"
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
