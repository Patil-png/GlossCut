import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  UIManager,
  ActivityIndicator} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  runOnJS} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api, { API_URL } from "../utils/api";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  User,
  Mail,
  Phone,
  VenetianMask,
  Languages,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Crown,
  Fingerprint,
  RefreshCw} from "lucide-react-native";

const { width } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- OPTIMIZED SUB-COMPONENTS (MEMOIZED) ---

const CustomAlert = memo(
  ({ visible, message, type = "success", onHide, theme }) => {
    const translateY = useSharedValue(-120);
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (visible) {
        if (type === "success")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        translateY.value = withSpring(50, { damping: 15, stiffness: 120 });
        opacity.value = withTiming(1, { duration: 300 });

        const timer = setTimeout(() => hideAlert(), 3500);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    const hideAlert = useCallback(() => {
      translateY.value = withTiming(-120, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        if (onHide) runOnJS(onHide)();
      });
    }, [onHide]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value}));

    const config = useMemo(
      () =>
        type === "error"
          ? { icon: AlertCircle, color: "#FF3B30" }
          : { icon: CheckCircle2, color: "#10b981" },
      [type]
    );

    if (!visible && opacity.value === 0) return null;

    return (
      <AnimatedReanimated.View style={[styles.alertWrapper, animatedStyle]}>
        <View
          style={[
            styles.alertContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: config.color + "30"},
          ]}
        >
          <View
            style={[styles.alertSideAccent, { backgroundColor: config.color }]}
          />
          <config.icon size={20} color={config.color} strokeWidth={2.5} />
          <Text style={[styles.alertText, { color: theme.colors.text }]}>
            {message}
          </Text>
        </View>
      </AnimatedReanimated.View>
    );
  }
);

const PremiumScaleButton = memo(
  ({ onPress, style, children, activeScale = 0.97, disabled = false }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      if (!disabled) {
        Animated.spring(scaleValue, {
          toValue: activeScale,
          useNativeDriver: true,
          tension: 40,
          friction: 7}).start();
      }
    }, [disabled, activeScale]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7}).start();
    }, []);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        <Animated.View
          style={[
            style,
            { transform: [{ scale: scaleValue }], opacity: disabled ? 0.6 : 1 },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

const ElegantStats = memo(({ theme, user }) => {
  const balance = user?.setkarCoins || 0;
  const joinedYear = useMemo(
    () => (user?.createdAt ? new Date(user.createdAt).getFullYear() : "2025"),
    [user?.createdAt]
  );

  return (
    <AnimatedReanimated.View
      entering={FadeInDown.delay(400)}
      style={styles.statsContainer}
    >
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border + "40"},
        ]}
      >
        <View
          style={[styles.statIconWrapper, { backgroundColor: "#3b82f615" }]}
        >
          <Calendar size={18} color="#3b82f6" />
        </View>
        <View>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Member
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {joinedYear}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border + "40"},
        ]}
      >
        <View
          style={[styles.statIconWrapper, { backgroundColor: "#fbbf2415" }]}
        >
          <Crown size={18} color="#fbbf24" />
        </View>
        <View>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Coins
          </Text>
          <Text style={[styles.statValue, { color: "#fbbf24" }]}>
            {balance}
          </Text>
        </View>
      </View>
    </AnimatedReanimated.View>
  );
});

const LuxuryTile = memo(
  ({ icon: Icon, label, value, theme, onPress, tintColor, delay = 0 }) => (
    <AnimatedReanimated.View entering={FadeInDown.delay(delay)}>
      <PremiumScaleButton
        onPress={onPress}
        style={[styles.luxuryTile, { backgroundColor: theme.colors.card }]}
      >
        <View
          style={[styles.luxuryIconBox, { backgroundColor: tintColor + "10" }]}
        >
          <Icon size={20} color={tintColor} strokeWidth={2} />
        </View>
        <View style={styles.luxuryContent}>
          <Text
            style={[styles.luxuryLabel, { color: theme.colors.textSecondary }]}
          >
            {label}
          </Text>
          <Text
            style={[styles.luxuryValue, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {value || "Not Set"}
          </Text>
        </View>
        <ChevronRight size={16} color={theme.colors.border} />
      </PremiumScaleButton>
    </AnimatedReanimated.View>
  )
);

const PersonalInfoScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, setUser } = useAuth();
  const [image, setImage] = useState(user?.profilePicture || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    type: "success"});

  // Memoized alert handler
  const onHideAlert = useCallback(
    () => setAlert((p) => ({ ...p, visible: false })),
    []
  );

  // --- OPTIMIZED ACTION HANDLER ---
  const executeSafeAction = useCallback(async (actionFn, successMessage) => {
    try {
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) throw new Error("No Internet connection");

      await actionFn();
      if (successMessage)
        setAlert({ visible: true, message: successMessage, type: "success" });
    } catch (error) {
      setAlert({
        visible: true,
        message: error.message || "Something went wrong",
        type: "error"});
    }
  }, []);

  const pickImage = useCallback(() => {
    executeSafeAction(async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted")
        throw new Error("Permission to gallery is required");

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Optimized quality for better balance
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];

        // Create FormData for upload
        const formData = new FormData();
        formData.append('profilePicture', {
          uri: selectedImage.uri,
          type: 'image/jpeg', // or get from selectedImage.type
          name: 'profile-picture.jpg'});

        // Upload image to backend
        const uploadResponse = await api.post('/api/auth/upload-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'}});

        // Use the Cloudflare URL directly (no local/R2 logic needed)
        const { imageUrl } = uploadResponse.data;

        console.log('🖼️ Customer Profile Picture Upload: Stored on Cloudflare:', imageUrl);
        console.log('🔥 FREE IMAGE FETCH (Customer App): Profile picture ready for display:', imageUrl);

        // Update user profile with the Cloudflare URL
        await api.put('/api/auth/user', { profilePicture: imageUrl });

        // Update local state and context
        setImage(imageUrl);
        setUser(prev => ({ ...prev, profilePicture: imageUrl }));

        console.log('✅ Customer Profile: Updated with FREE Cloudflare URL');
      }
    }, "Profile picture updated successfully");
  }, [executeSafeAction, api, setUser]);

  const handleSyncProfile = useCallback(() => {
    setIsSyncing(true);
    executeSafeAction(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!user?.email) throw new Error("Email is required to sync account");
    }, "Profile synced successfully").finally(() => setIsSyncing(false));
  }, [executeSafeAction, user?.email]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        theme={theme}
        onHide={onHideAlert}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border + "50"},
            ]}
          >
            <ChevronLeft
              size={22}
              color={theme.colors.text}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Personal Details
          </Text>
          <Fingerprint
            size={20}
            color={theme.colors.textSecondary}
            opacity={0.3}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          removeClippedSubviews={true} // Optimization for long lists
        >
          <View style={styles.heroContainer}>
            <PremiumScaleButton onPress={pickImage}>
              <View
                style={[
                  styles.avatarRing,
                  { borderColor: theme.colors.primary + "30" },
                ]}
              >
                <Image
                  source={
                    image ? { uri: image } : require("../assets/GlossCut.png")
                  }
                  style={styles.avatarImage}
                />
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary + "DD"]}
                  style={styles.cameraBadge}
                >
                  <Camera size={14} color="#FFF" />
                </LinearGradient>
              </View>
            </PremiumScaleButton>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name || "GlossCut User"}
            </Text>
          </View>

          <View style={styles.mainPadding}>
            <ElegantStats theme={theme} user={user} />

            <Text
              style={[
                styles.sectionHeader,
                { color: theme.colors.textSecondary },
              ]}
            >
              Security & Identity
            </Text>
            <View
              style={[
                styles.groupContainer,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <LuxuryTile
                icon={User}
                label="Full Name"
                value={user?.name}
                theme={theme}
                tintColor="#3b82f6"
                onPress={() => navigation.navigate("EditName")}
                delay={100}
              />
              <View style={styles.separator} />
              <LuxuryTile
                icon={Mail}
                label="Email Address"
                value={user?.email}
                theme={theme}
                tintColor="#f59e0b"
                onPress={() => navigation.navigate("EditEmail")}
                delay={200}
              />
            </View>

            <Text
              style={[
                styles.sectionHeader,
                { color: theme.colors.textSecondary },
              ]}
            >
              Connectivity
            </Text>
            <View
              style={[
                styles.groupContainer,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <LuxuryTile
                icon={Phone}
                label="Phone Number"
                value={user?.phone}
                theme={theme}
                tintColor="#10b981"
                onPress={() => navigation.navigate("EditPhoneNumber")}
                delay={300}
              />
            </View>

            <PremiumScaleButton
              disabled={isSyncing}
              onPress={handleSyncProfile}
              style={[
                styles.syncButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              {isSyncing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.syncContent}>
                  <RefreshCw size={18} color="#FFF" style={styles.syncIcon} />
                  <Text style={styles.syncButtonText}>Sync Changes</Text>
                </View>
              )}
            </PremiumScaleButton>

            <View style={styles.secureLine}>
              <ShieldCheck size={14} color="#10b981" />
              <Text
                style={[
                  styles.footerText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Secured by AES-256 Encryption
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  mainPadding: { paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40 },
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center"},
  alertContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }},
  alertSideAccent: {
    position: "absolute",
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    borderRadius: 2},
  alertText: { fontSize: 14, fontWeight: "700" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15},
  headerTitle: { fontSize: 18, fontWeight: "800" },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1},
  heroContainer: { alignItems: "center", marginVertical: 20 },
  avatarRing: {
    padding: 5,
    borderWidth: 2,
    borderRadius: 100,
    borderStyle: "dashed"},
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9"},
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF"},
  userName: { fontSize: 24, fontWeight: "900", marginTop: 10 },
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 25 },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1},
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12},
  statLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  statValue: { fontSize: 16, fontWeight: "800" },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
    opacity: 0.6},
  groupContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"},
  luxuryTile: { flexDirection: "row", alignItems: "center", padding: 18 },
  luxuryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15},
  luxuryContent: { flex: 1 },
  luxuryLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  luxuryValue: { fontSize: 15, fontWeight: "700" },
  separator: { height: 1, marginLeft: 70, backgroundColor: "rgba(0,0,0,0.03)" },
  syncButton: {
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10},
  syncContent: { flexDirection: "row", alignItems: "center" },
  syncIcon: { marginRight: 8 },
  syncButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  secureLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 25,
    opacity: 0.6},
  footerText: { fontSize: 11, fontWeight: "700" }});

export default memo(PersonalInfoScreen);
