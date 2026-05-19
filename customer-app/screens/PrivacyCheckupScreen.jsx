import React, { useState, useEffect, useCallback, useRef, memo } from "react";
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
  InteractionManager,
  Dimensions,
  Image,
  Alert,
  Linking
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Bell,
  MapPin,
  Users,
  Camera as CameraIcon,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  ArrowRight
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { usePrivacy } from "../contexts/PrivacyContext.jsx";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Calendar from "expo-calendar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

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
      <Text style={styles.headerTitle}>Account Security</Text>
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
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]} accessibilityLiveRegion="polite">
      <View style={[styles.toastContent, { borderLeftColor: iconColor }]}>
        {isSuccess ? <CheckCircle size={20} color={iconColor} /> : <AlertCircle size={20} color={iconColor} />}
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const PrivacySetting = React.memo(
  ({ title, description, isEnabled, onToggle, primaryColor, disabled, icon: IconComponent }) => (
    <View style={styles.usageItem}>
      <View style={styles.iconCircle}>
        <IconComponent size={normalize(16)} color={primaryColor} />
      </View>
      <View style={styles.usageTextContent}>
        <Text style={styles.usageTitle}>{title}</Text>
        <Text style={styles.usageDesc}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#E2E8F0", true: primaryColor }}
        thumbColor={"#FFFFFF"}
        ios_backgroundColor="#E2E8F0"
        onValueChange={onToggle}
        value={isEnabled}
        disabled={disabled}
        style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.8 : 1 }] }}
      />
    </View>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.isEnabled === nextProps.isEnabled &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.primaryColor === nextProps.primaryColor
    );
  }
);

export default function PrivacyCheckupScreen({ navigation }) {
  const { theme } = useTheme();
  const { privacySettings = {}, updatePrivacySettings = () => {} } = usePrivacy() || {};
  const insets = useSafeAreaInsets();
  const primaryColor = theme?.colors?.primary || "#000000";

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  const showToast = useCallback((message, type = "error") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(p => ({ ...p, visible: false })));
    }, 3000);
  }, [toastAnim]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const results = await Promise.allSettled([
          Location.getForegroundPermissionsAsync(),
          Contacts.getPermissionsAsync(),
          Notifications.getPermissionsAsync(),
          Camera.getCameraPermissionsAsync(),
          ImagePicker.getMediaLibraryPermissionsAsync(),
          Calendar.getCalendarPermissionsAsync()
        ]);
        const locStatus = results[0].status === "fulfilled" ? results[0].value.status : "undetermined";
        const conStatus = results[1].status === "fulfilled" ? results[1].value.status : "undetermined";
        const notStatus = results[2].status === "fulfilled" ? results[2].value.status : "undetermined";
        const camStatus = results[3].status === "fulfilled" ? results[3].value.status : "undetermined";
        const medStatus = results[4].status === "fulfilled" ? results[4].value.status : "undetermined";
        const calStatus = results[5].status === "fulfilled" ? results[5].value.status : "undetermined";

        const updates = {};
        if ((locStatus === "granted") !== privacySettings.locationEnabled) updates.locationEnabled = locStatus === "granted";
        if ((conStatus === "granted") !== privacySettings.contactsEnabled) updates.contactsEnabled = conStatus === "granted";
        if ((notStatus === "granted") !== privacySettings.notificationEnabled) updates.notificationEnabled = notStatus === "granted";
        if ((camStatus === "granted") !== privacySettings.cameraEnabled) updates.cameraEnabled = camStatus === "granted";
        if ((medStatus === "granted") !== privacySettings.mediaEnabled) updates.mediaEnabled = medStatus === "granted";
        if ((calStatus === "granted") !== privacySettings.calendarEnabled) updates.calendarEnabled = calStatus === "granted";

        if (Object.keys(updates).length > 0) {
          updatePrivacySettings(updates);
        }
      } catch (error) {
        console.log("Permission sync minor error", error);
      }
    });

    const animations = itemAnims.map((anim, i) => 
      Animated.parallel([
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
        Animated.timing(itemFades[i], { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    );
    Animated.stagger(100, animations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();

    return () => {
      task.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSafeAction = useCallback(async (actionName, asyncCallback) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await asyncCallback();
    } catch (error) {
      if (error.message && (error.message.includes("Network") || error.message.includes("fetch"))) {
        showToast("Internet seems to be down. Changes saved locally.", "error");
      } else {
        showToast("We couldn't update your settings. Please try again.", "error");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, showToast]);

  const promptForSettings = useCallback((type) => {
    Alert.alert(
      `${type} Access Required`,
      `GlossCut needs ${type} access to enable this feature. Please go to your device settings to grant permission.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() }
      ]
    );
  }, []);

  const handleToggle = useCallback((value, type, internalKey, requestFunc) => {
    handleSafeAction(`${type} Toggle`, async () => {
      if (value) {
        // Turning ON
        const { status } = await requestFunc();
        if (status === "granted") {
          updatePrivacySettings({ [internalKey]: true });
        } else {
          promptForSettings(type);
          updatePrivacySettings({ [internalKey]: false });
        }
      } else {
        // Turning OFF (OS limitation: cannot programmatically revoke permissions)
        Alert.alert(
          `Revoke ${type} Access`,
          `To completely disable ${type} access, you must turn it off in your device settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              onPress: () => {
                updatePrivacySettings({ [internalKey]: false });
                Linking.openSettings();
              } 
            }
          ]
        );
      }
    });
  }, [updatePrivacySettings, promptForSettings, handleSafeAction]);

  const handleNotificationToggle = useCallback((v) => handleToggle(v, "Notification", "notificationEnabled", Notifications.requestPermissionsAsync), [handleToggle]);
  const handleLocationToggle = useCallback((v) => handleToggle(v, "Location", "locationEnabled", Location.requestForegroundPermissionsAsync), [handleToggle]);
  const handleContactsToggle = useCallback((v) => handleToggle(v, "Contacts", "contactsEnabled", Contacts.requestPermissionsAsync), [handleToggle]);
  const handleCameraToggle = useCallback((v) => handleToggle(v, "Camera", "cameraEnabled", Camera.requestCameraPermissionsAsync), [handleToggle]);
  const handleMediaToggle = useCallback((v) => handleToggle(v, "Photo Library", "mediaEnabled", ImagePicker.requestMediaLibraryPermissionsAsync), [handleToggle]);
  const handleCalendarToggle = useCallback((v) => handleToggle(v, "Calendar", "calendarEnabled", Calendar.requestCalendarPermissionsAsync), [handleToggle]);

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.toastWrapper, { top: insets.top + 10 }]}>
        <CustomToast visible={toast.visible} message={toast.message} type={toast.type} animatedValue={toastAnim} />
      </View>

      <Header onBack={() => navigation.goBack()} insets={insets} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centeredContentWrapper}>
            {/* 1. Hero Visual */}
            <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
              <Image 
                source={require("../assets/privacy_cartoon.png")} 
                style={styles.illustration}
                resizeMode="contain"
                accessibilityLabel="Privacy Checkup Illustration"
              />
            </Animated.View>

            {/* 2. Text Header */}
            <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
              <Text style={styles.title}>Privacy Checkup</Text>
              <Text style={styles.subtitle}>
                Control how your data is accessed. We value your privacy and only use data you explicitly approve.
              </Text>
            </Animated.View>

            {/* 3. Privacy Settings Cards */}
            <Animated.View style={[styles.usageContainer, animatedStyle(2)]}>
              <PrivacySetting
                title="Notifications"
                description="Get important security alerts and updates."
                isEnabled={!!privacySettings.notificationEnabled}
                onToggle={handleNotificationToggle}
                primaryColor={primaryColor}
                disabled={isProcessing}
                icon={Bell}
              />
              <View style={styles.divider} />
              <PrivacySetting
                title="Location Services"
                description="For location-based features only."
                isEnabled={!!privacySettings.locationEnabled}
                onToggle={handleLocationToggle}
                primaryColor={primaryColor}
                disabled={isProcessing}
                icon={MapPin}
              />
              <View style={styles.divider} />
              <PrivacySetting
                title="Camera"
                description="To take photos for your profile or reviews."
                isEnabled={!!privacySettings.cameraEnabled}
                onToggle={handleCameraToggle}
                primaryColor={primaryColor}
                disabled={isProcessing}
                icon={CameraIcon}
              />
              <View style={styles.divider} />
              <PrivacySetting
                title="Photo Library"
                description="To select images for your profile or shop reviews."
                isEnabled={!!privacySettings.mediaEnabled}
                onToggle={handleMediaToggle}
                primaryColor={primaryColor}
                disabled={isProcessing}
                icon={ImageIcon}
              />
              <View style={styles.divider} />
              <PrivacySetting
                title="Calendar"
                description="To save your upcoming appointments directly."
                isEnabled={!!privacySettings.calendarEnabled}
                onToggle={handleCalendarToggle}
                primaryColor={primaryColor}
                disabled={isProcessing}
                icon={CalendarIcon}
              />

            </Animated.View>

            {/* 4. Footer Privacy Note */}
            <Animated.View style={[styles.noteContainer, animatedStyle(3)]}>
              <View style={styles.noteHeader}>
                <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.noteTitle}>BANK-GRADE ENCRYPTION</Text>
              </View>
              <Text style={styles.noteText}>
                By enabling these settings, you consent to the collection and processing of data as described in our Privacy Policy.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1 },
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
    height: normalize(140),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(20)
  },
  illustration: {
    width: "85%",
    height: "100%"
  },
  textContainer: { marginBottom: normalize(28) },
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
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(14)
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: normalize(16)
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
  usageTextContent: { flex: 1 },
  usageTitle: {
    fontSize: normalize(14),
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: normalize(4)
  },
  usageDesc: {
    fontSize: normalize(12),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: normalize(18)
  },
  actionSection: { marginBottom: normalize(30) },
  primaryBtn: {
    height: normalize(58),
    borderRadius: normalize(16),
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
  toastTextContainer: { flex: 1 },
  toastMessage: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  }
});
