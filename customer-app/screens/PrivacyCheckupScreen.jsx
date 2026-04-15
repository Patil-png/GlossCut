import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo} from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  InteractionManager} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  X,
  WifiOff,
  Lock} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { usePrivacy } from "../contexts/PrivacyContext.jsx";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";

// --- 1. OPTIMIZED ALERT COMPONENT (Memoized) ---
const ModernTopAlert = React.memo(
  ({ visible, title, message, type, onClose }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: Platform.OS === "ios" ? 50 : 40,
          useNativeDriver: true, // CRITICAL: Runs on UI Thread
          damping: 15,
          mass: 1,
          stiffness: 120}).start();

        const timer = setTimeout(() => {
          handleClose();
        }, 4000);
        return () => clearTimeout(timer);
      } else {
        handleClose();
      }
    }, [visible]);

    const handleClose = useCallback(() => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true}).start(() => {
        if (visible && onClose) onClose();
      });
    }, [visible, onClose, translateY]);

    if (!visible) return null;

    // Render logic...
    const isError = type === "error";
    const isNetwork = type === "network";

    let accentColor = "#10B981";
    let IconComponent = CheckCircle;
    let bgColor = "#ECFDF5";

    if (isError) {
      accentColor = "#EF4444";
      IconComponent = AlertCircle;
      bgColor = "#FEF2F2";
    } else if (isNetwork) {
      accentColor = "#F59E0B";
      IconComponent = WifiOff;
      bgColor = "#FFFBEB";
    }

    return (
      <Animated.View
        style={[styles.alertWrapper, { transform: [{ translateY }] }]}
      >
        <View style={styles.alertCard}>
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <IconComponent size={24} color={accentColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMessage} numberOfLines={2}>
              {message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
);

// --- 2. HIGH PERFORMANCE LIST ITEM ---
// Optimization: Accepts 'primaryColor' (string) instead of 'theme' (object) to prevent re-renders
const PrivacySetting = React.memo(
  ({ title, description, isEnabled, onToggle, primaryColor, disabled }) => (
    <View style={[styles.settingItem, disabled && { opacity: 0.6 }]}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#E5E7EB", true: primaryColor }}
        thumbColor={isEnabled ? "#fff" : "#9CA3AF"}
        ios_backgroundColor="#E5E7EB"
        onValueChange={onToggle}
        value={isEnabled}
        disabled={disabled}
      />
    </View>
  ),
  (prevProps, nextProps) => {
    // Custom comparison for maximum performance
    return (
      prevProps.isEnabled === nextProps.isEnabled &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.primaryColor === nextProps.primaryColor
    );
  }
);

export default function PrivacyCheckupScreen({ navigation }) {
  const { theme } = useTheme();
  const { privacySettings = {}, updatePrivacySettings = () => {} } =
    usePrivacy() || {};

  // Extract color string to ensure prop stability for React.memo
  const primaryColor = theme?.colors?.primary || "#000000";

  // Animations
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"});
  const [isProcessing, setIsProcessing] = useState(false);

  const showAlert = useCallback((title, message, type = "error") => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // --- 3. ROBUST & MEMOIZED ACTION HANDLER ---
  const handleSafeAction = useCallback(
    async (actionName, asyncCallback) => {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        await asyncCallback();
      } catch (error) {
        console.error(`Error in ${actionName}:`, error);
        if (
          error.message &&
          (error.message.includes("Network") || error.message.includes("fetch"))
        ) {
          showAlert(
            "Connection Failed",
            "Internet seems to be down. Changes saved locally.",
            "network"
          );
        } else {
          showAlert(
            "Something went wrong",
            "We couldn't update your settings. Please try again.",
            "error"
          );
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, showAlert]
  );

  // --- 4. PARALLEL PERMISSION SYNC (Performance Fix) ---
  useEffect(() => {
    // InteractionManager ensures this heavy check runs AFTER the screen transition finishes
    // This makes the navigation feel instant.
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        // Run checks in PARALLEL using Promise.allSettled instead of sequential await
        const results = await Promise.allSettled([
          Location.getForegroundPermissionsAsync(),
          Contacts.getPermissionsAsync(),
          Notifications.getPermissionsAsync(),
        ]);

        const locStatus =
          results[0].status === "fulfilled"
            ? results[0].value.status
            : "undetermined";
        const conStatus =
          results[1].status === "fulfilled"
            ? results[1].value.status
            : "undetermined";
        const notStatus =
          results[2].status === "fulfilled"
            ? results[2].value.status
            : "undetermined";

        const updates = {};
        if ((locStatus === "granted") !== privacySettings.locationEnabled)
          updates.locationEnabled = locStatus === "granted";
        if ((conStatus === "granted") !== privacySettings.contactsEnabled)
          updates.contactsEnabled = conStatus === "granted";
        if ((notStatus === "granted") !== privacySettings.notificationEnabled)
          updates.notificationEnabled = notStatus === "granted";

        if (Object.keys(updates).length > 0) {
          updatePrivacySettings(updates);
        }
      } catch (error) {
        console.log("Permission sync minor error", error);
      }
    });

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

    return () => task.cancel();
  }, []);

  // --- TOGGLE HANDLERS (Stable Dependencies) ---

  const handleNotificationToggle = useCallback(
    (value) => {
      handleSafeAction("Notification Toggle", async () => {
        if (value) {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === "granted") {
            updatePrivacySettings({ notificationEnabled: true });
          } else {
            showAlert(
              "Permission Required",
              "Please enable notifications in your device settings.",
              "error"
            );
          }
        } else {
          updatePrivacySettings({ notificationEnabled: false });
        }
      });
    },
    [updatePrivacySettings, showAlert, handleSafeAction]
  );

  const handleLocationToggle = useCallback(
    (value) => {
      handleSafeAction("Location Toggle", async () => {
        if (value) {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            updatePrivacySettings({ locationEnabled: true });
          } else {
            showAlert(
              "Permission Required",
              "Please enable location access in device settings.",
              "error"
            );
          }
        } else {
          updatePrivacySettings({ locationEnabled: false });
        }
      });
    },
    [updatePrivacySettings, showAlert, handleSafeAction]
  );



  const handleContactsToggle = useCallback(
    (value) => {
      handleSafeAction("Contacts Toggle", async () => {
        if (value) {
          const { status } = await Contacts.getPermissionsAsync();
          if (status === "granted") {
            updatePrivacySettings({ contactsEnabled: true });
          } else {
            showAlert(
              "Permission Required",
              "Please enable contacts access in device settings.",
              "error"
            );
          }
        } else {
          updatePrivacySettings({ contactsEnabled: false });
        }
      });
    },
    [updatePrivacySettings, showAlert, handleSafeAction]
  );

  const handleSave = useCallback(() => {
    handleSafeAction("Save Settings", async () => {
      showAlert(
        "Settings Saved",
        "Your privacy preferences have been updated successfully.",
        "success"
      );
      setTimeout(() => navigation.goBack(), 1500);
    });
  }, [navigation, showAlert, handleSafeAction]);

  // Pure styles for back button to prevent re-creation
  const backBtnStyle = useMemo(
    () => [styles.backBtn, { backgroundColor: "#f5f5f5" }],
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ModernTopAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={backBtnStyle}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false} // Better for short lists to prevent glitching
          >
            <View style={styles.contentContainer}>
              <View style={styles.illustrationArea}>
                <View
                  style={[
                    styles.circleBack,
                    { backgroundColor: primaryColor + "15" },
                  ]}
                >
                  <View
                    style={[
                      styles.circleFront,
                      { backgroundColor: primaryColor + "25" },
                    ]}
                  >
                    <Shield size={48} color={primaryColor} />
                  </View>
                </View>
              </View>

              <Animated.View
                style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
              >
                <Text style={styles.heading}>Privacy Check-up</Text>
                <Text style={styles.subHeading}>
                  Control how your data is accessed. We value your privacy and
                  only use data you explicitly approve.
                </Text>

                <View style={styles.settingsSection}>
                  <PrivacySetting
                    title="Notifications"
                    description="Get important security alerts and updates."
                    isEnabled={!!privacySettings.notificationEnabled}
                    onToggle={handleNotificationToggle}
                    primaryColor={primaryColor}
                    disabled={isProcessing}
                  />
                  <PrivacySetting
                    title="Location Services"
                    description="For location-based features only."
                    isEnabled={!!privacySettings.locationEnabled}
                    onToggle={handleLocationToggle}
                    primaryColor={primaryColor}
                    disabled={isProcessing}
                  />

                  <PrivacySetting
                    title="Contacts"
                    description="To find friends. We never spam your contacts."
                    isEnabled={!!privacySettings.contactsEnabled}
                    onToggle={handleContactsToggle}
                    primaryColor={primaryColor}
                    disabled={isProcessing}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSave}
                  style={[styles.submitBtn, { backgroundColor: primaryColor }]}
                >
                  <Text style={styles.btnText}>Save Preferences</Text>
                </TouchableOpacity>

                <View style={styles.legalSection}>
                  <Text style={styles.legalText}>
                    By enabling these settings, you consent to the collection
                    and processing of data as described in our{" "}
                    <Text style={styles.linkText}>Privacy Policy</Text>. You may
                    revoke these permissions at any time.
                  </Text>
                </View>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <View style={styles.trustBadge}>
                <Lock size={14} color="#059669" />
                <Text style={styles.footerText}>
                  Bank-Grade 256-bit Encryption
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff"},
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    Index: 9999,
    paddingHorizontal: 16,
    alignItems: "center"},
  alertCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6"},
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12},
  textContainer: {
    flex: 1,
    marginRight: 8},
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2},
  alertMessage: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 18},
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start"},
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"},
  scrollContainer: {
    paddingBottom: 40},
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40},
  illustrationArea: {
    alignItems: "center",
    marginVertical: 20},
  circleBack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"},
  circleFront: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center"},
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.5},
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 30,
    fontWeight: "500"},
  settingsSection: {
    marginBottom: 24},
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6"},
  settingTextContainer: {
    flex: 1,
    marginRight: 16},
  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4},
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18},
  submitBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20},
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff"},
  legalSection: {
    paddingHorizontal: 4,
    marginBottom: 30},
  legalText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18},
  linkText: {
    color: "#6B7280",
    textDecorationLine: "underline",
    fontWeight: "600"},
  footer: {
    alignItems: "center",
    paddingBottom: 20},
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6},
  footerText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600"}});
