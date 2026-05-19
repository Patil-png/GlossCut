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
  Platform,
  ImageBackground
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
  RefreshCcw,
  Settings,
  CreditCard,
  Target,
  Trophy,
  Activity,
  Zap
} from "lucide-react-native";
import api, { API_URL } from "../utils/api";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// --- 1. OPTIMIZED ANIMATED TOUCHABLE ---
const PremiumTouchable = React.memo(({ onPress, style, children }) => {
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

// --- 2. ALERT COMPONENT (IMPROVED) ---
const TopActionAlert = React.memo(
  ({ config, onHide, onConfirm, topInset }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (config.visible) {
        Animated.spring(translateY, {
          toValue: topInset + 10,
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

    let accent = "#C8FF00";
    let IconComp = CheckCircle;

    if (config.type === "error") {
      accent = "#FF4444";
      IconComp = XCircle;
    } else if (config.type === "warning" || config.type === "action") {
      accent = "#FFA502";
      IconComp = AlertTriangle;
    } else if (config.type === "info") {
      accent = "#C8FF00";
      IconComp = Info;
    }

    const isDark = config.isDark;

    return (
      <Animated.View
        style={[
          styles.alertContainer,
          {
            transform: [{ translateY }],
            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.1,
            borderColor: isDark ? "#333" : "#EEE",
            borderWidth: 1
          },
        ]}
      >
        <View style={styles.alertContent}>
          <View
            style={[styles.alertIconCircle, { backgroundColor: `${accent}15` }]}
          >
            <IconComp size={20} color={accent} strokeWidth={2.5} />
          </View>
          <View style={styles.alertTextWrapper}>
            <Text
              style={[styles.alertTitle, { color: isDark ? "#FFF" : "#1A1A1A" }]}
            >
              {config.title}
            </Text>
            <Text
              style={[styles.alertMessage, { color: isDark ? "#A0A09A" : "#606058" }]}
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
                  { color: isDark ? "#A0A09A" : "#606058" },
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
              style={[styles.confirmBtn, { backgroundColor: "#1A1A1A" }]}
            >
              <Text style={styles.confirmBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }
);

// --- 3. MENU ITEM (PREMIUM) ---
const MenuItem = React.memo(
  ({ icon: Icon, title, onPress, theme, isLast, subtitle, showBadge, danger }) => (
    <TouchableOpacity
      activeOpacity={0.6}
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
            backgroundColor: danger
              ? "#FFF5F5"
              : theme.dark
                ? "#252525"
                : "#F8F8F6"
          },
        ]}
      >
        <Icon
          size={18}
          color={danger ? "#FF4444" : theme.colors.text}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text
          style={[
            styles.menuItemText,
            { color: danger ? "#FF4444" : theme.colors.text },
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
          opacity={0.3}
        />
      </View>
    </TouchableOpacity>
  )
);

// --- 4. STAT CARD ---
const StatCard = React.memo(({ icon: Icon, label, value, theme, color }) => (
  <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}10` }]}>
      <Icon size={16} color={color} strokeWidth={2.5} />
    </View>
    <View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  </View>
));

// Tier Helper Logic
const getTierInfo = (coins = 0) => {
  if (coins >= 2500) return { name: "Diamond", color: "#00BFFF", gradient: ["#00BFFF", "#0080FF"], icon: Trophy };
  if (coins >= 1000) return { name: "Platinum", color: "#E5E4E2", gradient: ["#E5E4E2", "#B8B8B8"], icon: Sparkles };
  if (coins >= 500) return { name: "Gold", color: "#FFD700", gradient: ["#FFD700", "#DAA520"], icon: Trophy };
  if (coins >= 100) return { name: "Silver", color: "#C0C0C0", gradient: ["#C0C0C0", "#A0A0A0"], icon: Target };
  return { name: "Bronze", color: "#D2691E", gradient: ["#D2691E", "#8B4513"], icon: Activity };
};

// --- 5. MAIN SCROLL CONTENT ---
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
    const scrollY = useRef(new Animated.Value(0)).current;
    const tier = getTierInfo(user?.setkarCoins || 0);

    // Animation entry
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1)) })
      ]).start();
    }, []);

    const headerHeight = 320;
    const headerScale = scrollY.interpolate({
      inputRange: [-headerHeight, 0],
      outputRange: [2, 1],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.fill}>
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            maxWidth: 500,
            alignSelf: 'center',
            width: '100%'
          }}
        >
          {/* --- RESPONSIVE PROFESSIONAL TOP BAR --- */}
          <View style={[styles.responsiveTopBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topBarContent}>
              <TouchableOpacity
                onPress={() => onNavigate("BACK")}
                style={styles.topBarBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.topBarTitleWrapper}>
                <Text style={styles.topBarTitle}>PROFILE</Text>
              </View>

              <TouchableOpacity
                onPress={() => onNavigate("ManageNotifications")}
                style={styles.topBarBtn}
                activeOpacity={0.7}
              >
                <Bell size={18} color="#1A1A1A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- CONTENT CARD --- */}
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: theme.colors.background,
                marginTop: 0,
              },
            ]}
          >
            {/* Elite Integrated Member Pass */}
            <View style={styles.passContainer}>
              <LinearGradient
                colors={["#FFFFFF", "#F5F7F8", "#E8ECF0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eliteMemberPass}
              >
                {/* Abstract Industrial Watermark */}
                <View style={styles.passWatermark}>
                  <Text style={styles.watermarkText}>GC</Text>
                </View>

                {/* Premium Identity Strip */}
                <View style={styles.passIdentityStrip} />

                <View style={styles.passMainRow}>
                  <View style={styles.passAvatarSide}>
                    <View style={styles.eliteAvatarBorder}>
                      <Image
                        source={
                          user?.profilePicture
                            ? { uri: user.profilePicture }
                            : require("../assets/GlossCut.png")
                        }
                        style={styles.eliteAvatarImg}
                      />
                    </View>
                    <View style={styles.passEditIndicator}>
                      <Edit2 size={8} color="#FFF" strokeWidth={4} />
                    </View>
                  </View>

                  <View style={styles.passInfoSide}>
                    <View style={styles.passIdentityRow}>
                      <Text style={styles.eliteNameText} numberOfLines={1}>
                        {(user?.name || "GUEST MEMBER").toUpperCase()}
                      </Text>
                      <View style={styles.eliteVerifiedBadge}>
                        <CheckCircle size={8} color="#FFF" strokeWidth={4} />
                      </View>
                    </View>

                    <Text style={styles.eliteEmailText}>{user?.email || "MEMBER@GLOSSCUT.COM"}</Text>

                    <View style={styles.passStatusRow}>
                      <View style={[styles.eliteTierBadge, { backgroundColor: "#1A1A1A" }]}>
                        <tier.icon size={10} color={tier.color} strokeWidth={3} />
                        <Text style={[styles.eliteTierText, { color: "#FFF" }]}>{tier.name} ACCESS</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.passSecurityRow}>
                  <View style={styles.securityItem}>
                    <Text style={styles.securityLabel}>MEMBER SERIAL</Text>
                    <Text style={styles.securityValue}>GC-{user?._id?.substring(0, 8).toUpperCase() || "8829-PX"}</Text>
                  </View>
                  <View style={[styles.securityItem, { alignItems: "flex-end" }]}>
                    <Text style={styles.securityLabel}>PASS VALIDITY</Text>
                    <Text style={styles.securityValue}>PERMANENT ELITE</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Performance Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon={CalendarIcon}
                value={stats.bookings}
                label="Total Bookings"
                theme={theme}
                color="#C8FF00"
              />
              <StatCard
                icon={Heart}
                value={stats.favorites}
                label="Liked Studios"
                theme={theme}
                color="#FF4444"
              />
            </View>



            {/* Account Settings */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Settings</Text>
            </View>
            <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
              <MenuItem
                icon={UserIcon}
                title="Personal Information"
                subtitle="Edit your name, phone and bio"
                onPress={() => onNavigate("PersonalInfo")}
                theme={theme}
              />
              <MenuItem
                icon={Lock}
                title="Security & Password"
                onPress={() => onNavigate("ChangePassword")}
                theme={theme}
              />
              <MenuItem
                icon={Key}
                title="Two-Factor Auth"
                subtitle={user?.twoFactorEnabled ? "Active" : "Not enabled"}
                showBadge={!user?.twoFactorEnabled}
                onPress={() => onNavigate("TwoFactorVerification", { email: user?.email || "" })}
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

            {/* Discover & Activity */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Discover & Activity</Text>
            </View>
            <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
              <MenuItem
                icon={Sparkles}
                title="AI Style Suggestor"
                subtitle="Find your perfect look"
                onPress={() => onNavigate("FaceSuggestor")}
                theme={theme}
              />
              <MenuItem
                icon={Heart}
                title="Your Favorites"
                subtitle="Quick access to liked studios"
                onPress={() => onNavigate("LikedBarbers")}
                theme={theme}
              />
              <MenuItem
                icon={Bell}
                title="Notification Settings"
                onPress={() => onNavigate("ManageNotifications")}
                theme={theme}
                isLast
              />
            </View>

            {/* Promotions & Referrals */}


            {/* More */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Support & Legal</Text>
            </View>
            <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
              <MenuItem
                icon={MessageSquare}
                title="Help & Support"
                onPress={() => onNavigate("Chat")}
                theme={theme}
              />
              <MenuItem
                icon={RefreshCcw}
                title="Booking Policy"
                onPress={() => onNavigate("RefundPolicy")}
                theme={theme}
              />
              <MenuItem
                icon={Info}
                title="About GlossCut"
                onPress={() => onNavigate("AboutGlossCut")}
                theme={theme}
              />
              <MenuItem
                icon={LogOut}
                title="Log Out"
                onPress={onLogout}
                theme={theme}
                danger
                isLast
              />
            </View>

            {/* App Version */}
            <View style={styles.footer}>
              <Text style={styles.versionText}>GLOSSCUT • VERSION 1.0.0</Text>
              <Text style={styles.legalText}>Designed with precision in Amravati</Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>

        {/* Floating Action Button (Optional) */}
        {/* <PremiumTouchable style={styles.fab} onPress={showComingSoon}>
          <Sparkles size={24} color="#000" />
        </PremiumTouchable> */}
      </View>
    );
  }
);

// --- 6. MAIN CONTROLLER ---
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

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [notifRes, historyRes] = await Promise.all([
          api.get(`/api/notifications`),
          api.get(`/api/booking/history`)
        ]);

        if (isMounted) {
          setStats({
            favorites: user?.likedBarbers?.length || 0,
            notifications: notifRes.status === 200 ? notifRes.data.length : 0,
            bookings: historyRes.status === 200 ? historyRes.data.length : 0
          });
        }
      } catch (error) {
        console.log("Stats fetch error:", error.message);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [user]);

  const showAlert = useCallback(
    (title, message, type = "success") => {
      setAlertConfig({ visible: true, title, message, type, isDark });
    },
    [isDark]
  );

  const handleLogoutPress = useCallback(() => {
    showAlert("Sign Out", "Are you sure you want to log out?", "action");
  }, [showAlert]);

  const confirmLogout = useCallback(async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
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
  }, [changeTheme]);

  const handleShowComingSoon = useCallback(() => {
    showAlert("Stay Tuned", "This feature is arriving in the next update.", "info");
  }, [showAlert]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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
        onHide={() => setAlertConfig(p => ({ ...p, visible: false }))}
        onConfirm={confirmLogout}
        topInset={insets.top}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1 },

  // Responsive Professional Top Bar
  responsiveTopBar: {
    backgroundColor: "#FBFBFA",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  topBarBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topBarTitleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 14,
    color: "#1A1A1A",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Elite Integrated Member Pass
  passContainer: {
    marginBottom: 25,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 12,
  },
  eliteMemberPass: {
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  passWatermark: {
    position: "absolute",
    top: -20,
    right: -10,
    opacity: 0.03,
  },
  watermarkText: {
    fontSize: 120,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: "#000",
  },
  passIdentityStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#C8FF00",
  },
  passMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  eliteAvatarBorder: {
    padding: 3,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  eliteAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  passEditIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#1A1A1A",
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  passInfoSide: {
    flex: 1,
  },
  passIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  eliteNameText: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 18,
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  eliteVerifiedBadge: {
    backgroundColor: "#1A1A1A",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  eliteEmailText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#606058",
    letterSpacing: 1,
    marginBottom: 10,
    opacity: 0.6,
  },
  passStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eliteTierBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  eliteTierText: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  passSecurityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  securityItem: {
    flex: 1,
  },
  securityLabel: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 7,
    color: "#1A1A1A",
    opacity: 0.3,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  securityValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    flexDirection: "column",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    marginBottom: 0,
  },
  statLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 10,
  },

  // Sections
  sectionHeader: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
  },
  menuContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
  },
  menuItemSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4444",
    marginRight: 8,
  },

  // Referral Card
  referralCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    flexDirection: "column",
    gap: 12,
  },
  referralContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referralIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(200, 255, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFF",
    marginBottom: 2,
  },
  referralDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 16,
  },
  referralBtn: {
    backgroundColor: "#C8FF00",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  referralBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#1A1A1A",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  versionText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    color: "#A0A09A",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  legalText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "#B0AFA8",
  },

  // Alert
  alertContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 16,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 15,
      },
      android: { elevation: 12 },
    }),
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  alertTextWrapper: { flex: 1 },
  alertTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    marginBottom: 2,
  },
  alertMessage: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  alertActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFF",
  },
});
