import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Animated,
  Platform,
  Easing,
} from "react-native";
import {
  ChevronLeft,
  Bell,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
} from "lucide-react-native";
import * as Haptics from "expo-haptics"; // Premium addition for Store quality
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

// --- OPTIMIZATION: Memoized Components to lock re-renders ---
const HeaderIllustration = React.memo(({ primaryColor }) => (
  <View style={styles.illustrationArea}>
    <View style={[styles.circleBack, { backgroundColor: `${primaryColor}15` }]}>
      <View
        style={[styles.circleFront, { backgroundColor: `${primaryColor}25` }]}
      >
        <Bell size={40} color={primaryColor} />
      </View>
    </View>
  </View>
));

const ModernToast = React.memo(({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback when toast appears
      if (type === "success")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => hide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toastWrapper, { transform: [{ translateY }], opacity }]}
    >
      <View style={styles.toastInner}>
        {type === "error" ? (
          <AlertTriangle size={18} color="#EF4444" />
        ) : type === "offline" ? (
          <WifiOff size={18} color="#6B7280" />
        ) : (
          <CheckCircle2 size={18} color="#10B981" />
        )}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

export default function ManageNotificationsScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const triggerToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  const handleToggleNotifications = useCallback(
    async (newValue) => {
      // Light haptic tick when clicking the switch (UX Gold)
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
          triggerToast("Settings updated", "success");
        } else {
          throw new Error();
        }
      } catch (e) {
        setNotificationsEnabled(originalValue);
        triggerToast(
          e.message === "timeout" ? "Network timeout" : "Update failed",
          "error"
        );
      } finally {
        setIsSaving(false);
      }
    },
    [notificationsEnabled, updateProfile, triggerToast]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ModernToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={useCallback(
          () => setToast((prev) => ({ ...prev, visible: false })),
          []
        )}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              Haptics.selectionAsync(); // Subtle vibration on back
              navigation.goBack();
            }}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <HeaderIllustration primaryColor={theme.colors.primary} />

          <Text style={styles.heading}>Alert Settings</Text>
          <Text style={styles.subHeading}>
            Stay informed about your appointments and exclusive grooming deals.
          </Text>

          <View style={styles.optionCard}>
            <View style={styles.textStack}>
              <Text style={styles.optionTitle}>App Notifications</Text>
              <Text style={styles.optionSub}>Push alerts and reminders</Text>
            </View>
            <Switch
              trackColor={{ false: "#E5E7EB", true: theme.colors.primary }}
              thumbColor={Platform.OS === "ios" ? undefined : "#fff"}
              ios_backgroundColor="#E5E7EB"
              onValueChange={handleToggleNotifications}
              value={notificationsEnabled}
              disabled={isSaving}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  toastWrapper: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  navBar: { paddingHorizontal: 20, paddingTop: 10 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 60,
  },
  illustrationArea: { alignItems: "center", marginBottom: 35 },
  circleBack: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  circleFront: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 35,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  textStack: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  optionSub: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 30,
  },
  footerText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
});
