import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  InteractionManager,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
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
  AlertTriangle,
  XCircle,
  Info,
  WifiOff,
  RefreshCcw,
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
      tension: 200,
    }).start();
  }, [scaleValue]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
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
  ({ config, onHide, onConfirm }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (config.visible) {
        Animated.spring(translateY, {
          toValue: 40,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
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
        easing: Easing.out(Easing.quad),
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
            shadowOpacity: 0.15,
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
                : "#F2F4F8",
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
            friction: 7,
          }),
          Animated.spring(statsAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.spring(listAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start();
      });
    }, []);

    const headerTranslate = headerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });
    const statsTranslate = statsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });
    const listTranslate = listAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={true}
        removeClippedSubviews={true} // PERFORMANCE KEY: Unmounts offscreen views
        scrollEventThrottle={16}
      >
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
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
              transform: [{ translateY: headerTranslate }],
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
                {(() => {
                  const tier = getMembershipTier(user);
                  const tierStyle = getTierStyling(tier);
                  return (
                    <View style={[styles.membershipBadge, { backgroundColor: tierStyle.bgColor }]}>
                      <Star size={10} color={tierStyle.iconColor} fill={tierStyle.iconColor} />
                      <Text style={[styles.membershipText, { color: tierStyle.color }]}>
                        {tierStyle.text}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <TouchableOpacity
                onPress={() => onNavigate("PersonalInfo")}
                style={styles.editBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Edit2 size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text
                  style={[
                    styles.walletLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  GlossCut Balance
                </Text>
                <Text
                  style={[styles.walletValue, { color: theme.colors.primary }]}
                >
                  ₹{stats.points}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.qrButton}
                onPress={showComingSoon}
              >
                <QrCode size={20} color="#FFF" />
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
            icon={Sparkles}
            value={stats.points}
            label="Points"
            theme={theme}
            color="#2ED573"
          />
        </Animated.View>

        {/* --- MENUS --- */}
        <Animated.View
          style={{
            opacity: listAnim,
            transform: [{ translateY: listTranslate }],
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
                  email: user?.email || "",
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
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [stats, setStats] = useState({
    favorites: user?.likedBarbers?.length || 0,
    points: user?.setkarCoins || 0,
    notifications: 0,
  });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
    isDark: false,
  });

  // Safe Stats Fetching
  useEffect(() => {
    let isMounted = true;
    const fetchStatsSafe = async () => {
      if (user) {
        setStats((prev) => ({
          ...prev,
          favorites: user.likedBarbers?.length || 0,
          points: user.setkarCoins || 0,
        }));
      }
      try {
        const res = await api.get(`/api/notifications`); // interceptor handles token
        if (isMounted && res.status === 200) {
          setStats((prev) => ({ ...prev, notifications: res.data.length }));
        }
      } catch (error) {
        if (
          error.code !== "ECONNABORTED" &&
          !error.message.includes("Network Error")
        ) {
          console.log("Background fetch minor error");
        }
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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F5F7FA" },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Alert Overlay - Independent Render Tree */}
      <View style={styles.alertOverlay}>
        <TopActionAlert
          config={alertConfig}
          onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
          onConfirm={confirmLogout}
        />
      </View>

      {/* Heavy Content - Memoized to prevent re-renders when Alert toggles */}
      <ProfileScrollContent
        user={user}
        stats={stats}
        theme={theme}
        isDark={isDark}
        onNavigate={handleNavigate}
        onLogout={handleLogoutPress}
        onChangeTheme={handleChangeTheme}
        showComingSoon={handleShowComingSoon}
      />
    </SafeAreaView>
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
    justifyContent: "center",
  },
  alertContainer: {
    width: width - 32,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
    overflow: "hidden",
  },
  alertStripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  alertContent: { flexDirection: "row", alignItems: "center" },
  alertIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  alertTextWrapper: { flex: 1 },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  alertMessage: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  alertActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  confirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  // Content
  scrollContainer: { paddingBottom: 40, paddingTop: 20 },
  backButtonContainer: { paddingHorizontal: 20, marginBottom: 10 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerWrapper: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  membershipCard: {
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#F5F7FA",
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
    borderColor: "#FFF",
  },
  cardInfo: { flex: 1, marginLeft: 16 },
  welcomeText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    opacity: 0.8,
  },
  userName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(184, 134, 11, 0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  membershipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8860B",
    marginLeft: 4,
  },
  editBtn: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 18,
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.7,
  },
  walletValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  qrButton: { backgroundColor: "#000", padding: 12, borderRadius: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  statWidget: {
    width: (width - 40 - 20) / 3,
    padding: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
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
    opacity: 0.4,
  },
  menuGroup: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 18 },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
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
    marginRight: 8,
  },
  logoutWrapper: { marginTop: 25, paddingHorizontal: 20, alignItems: "center" },
  logoutLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.8,
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
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  logoutText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  versionText: { fontSize: 11, marginTop: 20, opacity: 0.4, fontWeight: "500" },
});
