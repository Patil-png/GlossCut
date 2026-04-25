import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  InteractionManager,
  Platform
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User as UserIcon,
  Lock,
  Bell,
  Shield,
  Palette,
  Languages,
  Key,
  MessageSquare,
  LogOut,
  ChevronRight,
  Heart,
  Star,
  Sparkles,
  QrCode,
  Edit2,
  ArrowLeft,
  CheckCircle,
  Calendar as CalendarIcon,
  AlertTriangle,
  XCircle,
  Info,
  WifiOff,
  RefreshCcw
} from "lucide-react-native";
import api, { API_URL } from "../utils/api";

const { width } = Dimensions.get("window");

// --- 1. OPTIMIZED ANIMATED TOUCHABLE (MEMOIZED) ---
const AnimatedTouchable = React.memo(({ onPress, style, children }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
      tension: 200
    }).start();
  }, [scaleValue]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200
    }).start();
  }, [scaleValue]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- 2. OPTIMIZED ALERT COMPONENT ---
const TopActionAlert = React.memo(
  ({ config, onHide, onConfirm, topInset }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (config.visible) {
        Animated.spring(translateY, {
          toValue: topInset,
          useNativeDriver: true,
          friction: 6,
          tension: 80
        }).start();

        if (config.type !== "action") {
          const timer = setTimeout(handleClose, 3000);
          return () => clearTimeout(timer);
        }
      } else {
        handleClose();
      }
    }, [config.visible]);

    const handleClose = () => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => {
        if (config.visible) setTimeout(onHide, 100);
      });
    };

    if (!config.visible && translateY._value === -150) return null;

    let bg = "#FFFFFF";
    let accent = "#2ED573";
    let IconComp = CheckCircle;

    if (config.type === "error") {
      accent = "#FF4757";
      IconComp = XCircle;
    } else if (config.type === "warning" || config.type === "action") {
      accent = "#FFA502";
      IconComp = AlertTriangle;
    } else if (config.type === "info") {
      accent = "#3742FA";
      IconComp = Info;
    } else if (config.type === "offline") {
      accent = "#57606F";
      IconComp = WifiOff;
    }

    const isDark = config.isDark;

    return (
      <Animated.View
        style={[
          styles.alertContainer,
          {
            transform: [{ translateY }],
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            shadowColor: accent,
            shadowOpacity: 0.15
          },
        ]}
      >
        <View style={[styles.alertStripe, { backgroundColor: accent }]} />
        <View style={styles.alertContent}>
          <View
            style={[styles.alertIconCircle, { backgroundColor: `${accent}15` }]}
          >
            <IconComp size={22} color={accent} strokeWidth={2.5} />
          </View>
          <View style={styles.alertTextWrapper}>
            <Text
              style={[styles.alertTitle, { color: isDark ? "#FFF" : "#000" }]}
            >
              {config.title}
            </Text>
            <Text
              style={[styles.alertMessage, { color: isDark ? "#AAA" : "#555" }]}
              numberOfLines={2}
            >
              {config.message}
            </Text>
          </View>
        </View>

        {config.type === "action" && (
          <View style={styles.alertActionRow}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? "#AAA" : "#666" },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleClose();
                onConfirm();
              }}
              style={[styles.confirmBtn, { backgroundColor: "#FF4757" }]}
            >
              <Text style={styles.confirmBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  },
  (prev, next) => prev.config === next.config
); // Only re-render if config changes

// --- 3. OPTIMIZED MENU ITEM ---
const MenuItem = React.memo(
  ({ icon: Icon, title, onPress, theme, isLast, subtitle, showBadge }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.menuItem,
        !isLast && styles.menuItemBorder,
        { borderColor: theme.colors.border },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isLast
              ? "#FFF5F5"
              : theme.dark
                ? "#1F1F1F"
                : "#F2F4F8"
          },
        ]}
      >
        <Icon
          size={20}
          color={isLast ? "#FF4757" : theme.colors.primary}
          strokeWidth={2}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text
          style={[
            styles.menuItemText,
            { color: isLast ? "#FF4757" : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.menuItemSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.rightContainer}>
        {showBadge && <View style={styles.notificationDot} />}
        <ChevronRight
          size={16}
          color={theme.colors.textSecondary}
          opacity={0.4}
        />
      </View>
    </TouchableOpacity>
  )
);

// --- 4. OPTIMIZED STAT WIDGET ---
const StatWidget = React.memo(({ icon: Icon, label, value, theme, color }) => (
  <View style={[styles.statWidget, { backgroundColor: theme.colors.card }]}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <Icon size={18} color={color} strokeWidth={2.5} />
    </View>
    <Text style={[styles.statValue, { color: theme.colors.text }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
  </View>
));

// Helper function to determine membership tier based on Setkar coins (same as SetkarCoinHistoryScreen)
const getMembershipTier = (user) => {
  if (!user) return "Bronze";

  const coins = Math.max(0, user.setkarCoins || 0);

  // Use same tier calculation as SetkarCoinHistoryScreen
  if (coins >= 2500) {
    return "Diamond";
  } else if (coins >= 1000) {
    return "Platinum";
  } else if (coins >= 500) {
    return "Gold";
  } else if (coins >= 100) {
    return "Silver";
  } else {
    return "Bronze";
  }
};

// Helper function to get tier color and styling (same as SetkarCoinHistoryScreen)
const getTierStyling = (tier) => {
  switch (tier) {
    case "Diamond":
      return {
        color: "#00BFFF",
        bgColor: "rgba(0, 191, 255, 0.2)",
        iconColor: "#00BFFF",
        text: "GlossCut Diamond"
      };
    case "Platinum":
      return {
        color: "#E5E4E2",
        bgColor: "rgba(229, 228, 226, 0.25)",
        iconColor: "#E5E4E2",
        text: "GlossCut Platinum"
      };
    case "Gold":
      return {
        color: "#FFD700",
        bgColor: "rgba(255, 215, 0, 0.25)",
        iconColor: "#FFD700",
        text: "GlossCut Gold"
      };
    case "Silver":
      return {
        color: "#C0C0C0",
        bgColor: "rgba(192, 192, 192, 0.25)",
        iconColor: "#C0C0C0",
        text: "GlossCut Silver"
      };
    default:
      return {
        color: "#D2691E",
        bgColor: "rgba(210, 105, 30, 0.25)",
        iconColor: "#D2691E",
        text: "GlossCut Bronze"
      };
  }
};

// --- 5. HEAVY CONTENT COMPONENT (ISOLATED RENDERING) ---
// This component holds all the "heavy" UI. It will NOT re-render when Alert Config changes.
const ProfileScrollContent = React.memo(
  ({
    user,
    stats,
    theme,
    isDark,
    onNavigate,
    onLogout,
    onChangeTheme,
    showComingSoon,
    insets,
  }) => {
    // Animation Refs local to this component
    const headerAnim = useRef(new Animated.Value(0)).current;
    const statsAnim = useRef(new Animated.Value(0)).current;
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Run animations after interactions to prevent frame drops
      InteractionManager.runAfterInteractions(() => {
        Animated.stagger(100, [
          Animated.spring(headerAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7
          }),
          Animated.spring(statsAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7
          }),
          Animated.spring(listAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7
          }),
        ]).start();
      });
    }, []);

    const headerTranslate = headerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0]
    });
    const statsTranslate = statsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0]
    });
    const listTranslate = listAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0]
    });

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 60 }]}
        bounces={true}
        removeClippedSubviews={true} // PERFORMANCE KEY: Unmounts offscreen views
        scrollEventThrottle={16}
      >
        {/* Back Button */}
        <View style={[styles.backButtonContainer, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity
            onPress={() => onNavigate("BACK")}
            style={[styles.backButton, { backgroundColor: theme.colors.card }]}
          >
            <ArrowLeft size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* --- HEADER --- */}
        <Animated.View
          style={[
            styles.headerWrapper,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerTranslate }]
            },
          ]}
        >
          <View
            style={[
              styles.membershipCard,
              { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF" },
            ]}
          >
            <View
              style={[
                styles.decorativeCircle,
                { backgroundColor: theme.colors.primary, opacity: 0.05 },
              ]}
            />

            <View style={styles.cardHeader}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    user?.profilePicture
                      ? { uri: user.profilePicture }
                      : require("../assets/GlossCut.png")
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.activeBadge} />
              </View>

              <View style={styles.cardInfo}>
                <Text
                  style={[
                    styles.welcomeText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Welcome back,
                </Text>
                <Text
                  style={[styles.userName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {user?.name || "Guest User"}
                </Text>
                <View style={styles.membershipBadge}>
                  <CheckCircle size={10} color="#059669" />
                  <Text style={styles.membershipText}>
                    Member Since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => onNavigate("PersonalInfo")}
                style={styles.editBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Edit2 size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>

        {/* --- STATS --- */}
        <Animated.View
          style={[
            styles.statsRow,
            { opacity: statsAnim, transform: [{ translateY: statsTranslate }] },
          ]}
        >
          <StatWidget
            icon={Heart}
            value={stats.favorites}
            label="Favorites"
            theme={theme}
            color="#FF4757"
          />
          <StatWidget
            icon={Bell}
            value={stats.notifications}
            label="Notifications"
            theme={theme}
            color="#3742FA"
          />
          <StatWidget
            icon={CalendarIcon}
            value={stats.bookings}
            label="Bookings"
            theme={theme}
            color="#059669"
          />
        </Animated.View>

        {/* --- MENUS --- */}
        <Animated.View
          style={{
            opacity: listAnim,
            transform: [{ translateY: listTranslate }]
          }}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            ACCOUNT & SECURITY
          </Text>
          <View
            style={[styles.menuGroup, { backgroundColor: theme.colors.card }]}
          >
            <MenuItem
              icon={UserIcon}
              title="Profile Information"
              subtitle="Name, Phone, Bio"
              onPress={() => onNavigate("PersonalInfo")}
              theme={theme}
            />
            <MenuItem
              icon={Lock}
              title="Login & Security"
              onPress={() => onNavigate("ChangePassword")}
              theme={theme}
            />
            <MenuItem
              icon={Key}
              title="Two-Factor Auth"
              showBadge={!user?.twoFactorEnabled}
              onPress={() =>
                onNavigate("TwoFactorVerification", {
                  email: user?.email || ""
                })
              }
              theme={theme}
            />
            <MenuItem
              icon={Shield}
              title="Privacy Check-up"
              onPress={() => onNavigate("PrivacyCheckup")}
              theme={theme}
              isLast
            />
          </View>

          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            PREFERENCES
          </Text>
          <View
            style={[styles.menuGroup, { backgroundColor: theme.colors.card }]}
          >
            <MenuItem
              icon={Bell}
              title="Notifications"
              onPress={() => onNavigate("ManageNotifications")}
              theme={theme}
            />
            <MenuItem
              icon={Palette}
              title="Appearance"
              subtitle={isDark ? "Dark Mode" : "Light Mode"}
              onPress={onChangeTheme}
              theme={theme}
            />
            <MenuItem
              icon={Languages}
              title="App Language"
              onPress={() => onNavigate("LanguageSelection")}
              theme={theme}
              isLast
            />
          </View>

          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            HELP & MORE
          </Text>
          <View
            style={[styles.menuGroup, { backgroundColor: theme.colors.card }]}
          >
            <MenuItem
              icon={Sparkles}
              title="AI Style Suggestor"
              subtitle="Get personalized haircut advice"
              onPress={() => onNavigate("FaceSuggestor")}
              theme={theme}
            />
            <MenuItem
              icon={Heart}
              title="Your Favorites"
              onPress={() => onNavigate("LikedBarbers")}
              theme={theme}
            />
            <MenuItem
              icon={MessageSquare}
              title="Support Chat"
              onPress={() => onNavigate("Chat")}
              theme={theme}
            />
            <MenuItem
              icon={RefreshCcw}
              title="Refund Policy"
              onPress={() => onNavigate("RefundPolicy")}
              theme={theme}
              isLast
            />
          </View>

          {/* --- NEW: REFERRAL / PROMO CARD --- */}
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Sparkles size={24} color="#FFF" />
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Invite & Earn</Text>
                <Text style={styles.promoDesc}>Refer friends and get exclusive rewards on your next visit!</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.promoBtn} onPress={showComingSoon}>
              <Text style={styles.promoBtnText}>Invite Now</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <View style={styles.logoutWrapper}>
            <Text style={styles.logoutLabel}>Account Actions</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={onLogout}>
              <View style={styles.logoutButton}>
                <LogOut size={20} color="#FF4757" />
              </View>
            </TouchableOpacity>
            <Text style={styles.logoutText}>Log Out</Text>
            <Text
              style={[
                styles.versionText,
                { color: theme.colors.textSecondary },
              ]}
            >
              v2.4.0 • GlossCut Technologies
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }
);

// --- 6. MAIN CONTROLLER COMPONENT ---
export default function ProfileScreen() {
  const { theme, isDark, changeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [stats, setStats] = useState({
    favorites: user?.likedBarbers?.length || 0,
    bookings: 0,
    notifications: 0
  });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
    isDark: false
  });

  // Safe Stats Fetching
  useEffect(() => {
    let isMounted = true;
    const fetchStatsSafe = async () => {
      if (user) {
        setStats((prev) => ({
          ...prev,
          favorites: user.likedBarbers?.length || 0
        }));
      }
      try {
        const [notifRes, historyRes] = await Promise.all([
          api.get(`/api/notifications`),
          api.get(`/api/booking/history`)
        ]);

        if (isMounted) {
          setStats((prev) => ({
            ...prev,
            notifications: notifRes.status === 200 ? notifRes.data.length : 0,
            bookings: historyRes.status === 200 ? historyRes.data.length : 0
          }));
        }
      } catch (error) {
        console.log("Stats fetch error:", error.message);
      }
    };
    fetchStatsSafe();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // --- MEMOIZED HANDLERS (CRITICAL FOR PERFORMANCE) ---
  const showAlert = useCallback(
    (title, message, type = "success") => {
      setAlertConfig({ visible: true, title, message, type, isDark });
    },
    [isDark]
  );

  const handleLogoutPress = useCallback(() => {
    showAlert("Sign Out?", "Are you sure you want to log out?", "action");
  }, [showAlert]);

  const confirmLogout = useCallback(async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      // Fallback navigation if logout fails
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  }, [logout, navigation]);

  const handleNavigate = useCallback(
    (screen, params) => {
      if (screen === "BACK") navigation.goBack();
      else navigation.navigate(screen, params);
    },
    [navigation]
  );

  const handleChangeTheme = useCallback(() => {
    changeTheme();
    // Use timeout to allow theme to switch before showing alert (smoother UI)
    setTimeout(
      () =>
        showAlert(
          "Theme Changed",
          `Switched to ${!isDark ? "Dark" : "Light"} mode`,
          "success"
        ),
      100
    );
  }, [changeTheme, isDark, showAlert]);

  const handleShowComingSoon = useCallback(() => {
    showAlert(
      "Upcoming Feature",
      "QR Payments will be available in the next update.",
      "info"
    );
  }, [showAlert]);

  // --- RENDER ---
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.card}
      />

      <ProfileScrollContent
        user={user}
        stats={stats}
        theme={theme}
        isDark={isDark}
        onNavigate={handleNavigate}
        onLogout={handleLogoutPress}
        onChangeTheme={handleChangeTheme}
        showComingSoon={handleShowComingSoon}
        insets={insets}
      />

      <TopActionAlert
        config={alertConfig}
        onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={confirmLogout}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Alert
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center"
  },
  alertContainer: {
    width: width - 32,
    left: 16,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
    position: "absolute",
    zIndex: 9999,
    overflow: "hidden"
  },
  alertStripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  alertContent: { flexDirection: "row", alignItems: "center" },
  alertIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  alertTextWrapper: { flex: 1 },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
    letterSpacing: 0.3
  },
  alertMessage: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  alertActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, marginRight: 12 },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  confirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  // Content
  scrollContainer: { paddingTop: 20 },
  backButtonContainer: { paddingHorizontal: 20, marginBottom: 10 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center"
  },
  headerWrapper: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  membershipCard: {
    borderRadius: 24,
    padding: 22,
    overflow: "hidden"
  },
  decorativeCircle: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#F5F7FA"
  },
  activeBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    backgroundColor: "#2ED573",
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#FFF"
  },
  cardInfo: { flex: 1, marginLeft: 16 },
  welcomeText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    opacity: 0.8
  },
  userName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.15)"
  },
  membershipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 4
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 22,
    marginTop: -10,
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE'
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  trustTextWrapper: {
    gap: 1
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1'
  },
  trustSubtitle: {
    fontSize: 11,
    color: '#0EA5E9',
    opacity: 0.8
  },
  verifiedBadge: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5
  },
  promoCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'column',
    gap: 15
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  promoTextContainer: {
    flex: 1
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800'
  },
  promoDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2
  },
  promoBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  promoBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800'
  },
  editBtn: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.1)'
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    opacity: 0.8
  },
  completenessWrapper: {
    alignItems: 'flex-end',
    gap: 4
  },
  completenessText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1'
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0EA5E9'
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 18
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.7
  },
  walletValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  qrButton: { backgroundColor: "#000", padding: 12, borderRadius: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 25
  },
  statWidget: {
    width: (width - 40 - 20) / 3,
    padding: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  statValue: { fontSize: 17, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: "600" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginLeft: 32,
    marginBottom: 12,
    marginTop: 15,
    opacity: 0.4
  },
  menuGroup: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 15,
    overflow: "hidden"
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 18 },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)"
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  menuTextContainer: { flex: 1 },
  menuItemText: { fontSize: 15, fontWeight: "600" },
  menuItemSubtitle: { fontSize: 12, marginTop: 3, opacity: 0.7 },
  rightContainer: { flexDirection: "row", alignItems: "center" },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4757",
    marginRight: 8
  },
  logoutWrapper: { marginTop: 25, paddingHorizontal: 20, alignItems: "center" },
  logoutLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.8
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8F8",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    marginBottom: 8
  },
  logoutText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  versionText: { fontSize: 11, marginTop: 20, opacity: 0.4, fontWeight: "500" }
});
