import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  StatusBar,
  Animated,
  Platform,
  Easing,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import api from "../utils/api";
import {
  LogOut,
  ChevronRight,
  User,
  Lock,
  Bell,
  Palette,
  Languages,
  Key,
  Shield,
  Info,
  Clock,
  Star,
  Edit,
  MessageSquare,
  Trash2,
  Sparkles,
  ArrowLeft,
  XCircle,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  Crown,
  RefreshCcw,
  QrCode,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// ============================================================================
// 1. MODERN ALERT (Notifications from TOP)
// ============================================================================

const ModernAlert = React.memo(({ visible, title, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const styles = getStyles(theme);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: STATUSBAR_HEIGHT + 10,
        damping: 12, // More "liquid" feel
        stiffness: 100,
        mass: 0.6,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 400,
      easing: Easing.in(Easing.back(1)),
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const config = useMemo(() => {
    switch (type) {
      case "error":
        return {
          bg: theme.dark ? "#1A1010" : "#FEF2F2",
          border: theme.dark ? "#451A1A" : "#FECACA",
          iconColor: "#EF4444",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: theme.dark ? "#0A1A10" : "#F0FDF4",
          border: theme.dark ? "#1A4525" : "#86EFAC",
          iconColor: "#10B981",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: theme.dark ? "#1A1A10" : "#FFFBEB",
          border: theme.dark ? "#45451A" : "#FDE68A",
          iconColor: "#F59E0B",
          Icon: AlertTriangle,
        };
      case "network":
        return {
          bg: theme.dark ? "#10162A" : "#EFF6FF",
          border: theme.dark ? "#1E293B" : "#BFDBFE",
          iconColor: "#3B82F6",
          Icon: WifiOff,
        };
      default:
        return {
          bg: theme.colors.card,
          border: theme.colors.border,
          iconColor: theme.colors.primary,
          Icon: Info,
        };
    }
  }, [type, theme]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.alertWrapper, { transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleClose} style={[styles.alertContainer, { backgroundColor: config.bg, borderColor: config.border, shadowColor: config.iconColor }]}>
        <LinearGradient colors={[config.iconColor + "20", config.iconColor + "05"]} style={styles.alertIconBox}>
          <config.Icon size={22} color={config.iconColor} />
        </LinearGradient>
        <View style={styles.alertTextBox}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ============================================================================
// 2. ACTION SHEET (Confirmations from BOTTOM)
// ============================================================================

const ActionSheet = ({ visible, title, message, actionLabel, onConfirm, onCancel, isDestructive, theme }) => {
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const styles = getStyles(theme);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height * 0.4, duration: 300, easing: Easing.in(Easing.back(1)), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>
        <Animated.View style={[styles.sheetContainer, { backgroundColor: theme.colors.card, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle} />
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.sheetMessage, { color: theme.colors.textSecondary }]}>{message}</Text>

          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={onCancel} style={[styles.sheetCancelBtn, { backgroundColor: theme.colors.border + '20' }]}>
              <Text style={[styles.sheetCancelText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.sheetConfirmBtn, { backgroundColor: isDestructive ? "#EF4444" : theme.colors.primary }]}>
              <Text style={styles.sheetConfirmText}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================================================
// 3. UI COMPONENTS
// ============================================================================

const ScaleButton = ({ onPress, style, children }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ width: "100%" }, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const PremiumBackButton = ({ navigation, theme }) => (
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={[
      styles.backButton,
      {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
      },
    ]}
  >
    <ArrowLeft size={24} color={theme.colors.text} />
  </TouchableOpacity>
);

const MenuSection = ({ title, children, index, theme }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const styles = getStyles(theme);

  useEffect(() => {
    Animated.stagger(100 * index, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back(1)) }),
        Animated.spring(slideAnim, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {title && <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.card, borderColor: theme.dark ? "#1E293B" : "#F1F5F9", shadowColor: theme.colors.primary }]}>
        {children}
      </View>
    </Animated.View>
  );
};

const MenuItem = ({ icon: Icon, title, subtitle, onPress, theme, isLast, isDestructive }) => {
  const styles = getStyles(theme);
  return (
    <ScaleButton onPress={onPress}>
      <View style={[styles.menuItemInner, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border + "10" }]}>
        <LinearGradient colors={[isDestructive ? "#FEF2F2" : theme.colors.primary + '15', isDestructive ? "#FEE2E2" : theme.colors.primary + '05']} style={styles.iconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon size={20} color={isDestructive ? "#EF4444" : theme.colors.primary} strokeWidth={2.5} />
        </LinearGradient>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: isDestructive ? "#EF4444" : theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {!isDestructive && (
          <View style={[styles.chevronBox, { backgroundColor: theme.colors.primary + '10' }]}>
            <ChevronRight size={16} color={theme.colors.primary} strokeWidth={3} />
          </View>
        )}
      </View>
    </ScaleButton>
  );
};

// ============================================================================
// 4. MAIN SCREEN
// ============================================================================

export default function ProfileScreen({ navigation }) {
  const { theme, isDark, changeTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [barberCardImage, setBarberCardImage] = useState(null);

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    actionLabel: "",
    isDestructive: false,
    onConfirm: () => { },
  });

  // Entrance Animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;



  // Refresh ownership on Focus and when User loads
  useFocusEffect(
    useCallback(() => {
      if (user) {
        checkShopOwnership();
        fetchBarberCardImage();
      }
    }, [user])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  // --- SAFE HANDLERS ---

  const showAlert = useCallback((title, message, type = "info") => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const checkShopOwnership = async () => {
    if (!user) return;
    try {
      const res = await api.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`);
      if (res.status === 200) {
        setIsShopOwner(res.data.owner === user.id);
      }
    } catch (e) {
      ("Ownership check silently failed");
    }
  };



  const triggerLogout = () => {
    setConfirmModal({
      visible: true,
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      actionLabel: "Sign Out",
      isDestructive: true,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        logout();
        // navigation will switch to AuthStack automatically after logout
      },
    });
  };

  const fetchBarberCardImage = async () => {
    try {
      const response = await api.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`
      );

      if (response.status === 200 && response.data && response.data.image) {
        // Process the image URL the same way as CreateBarberCardScreen
        const barberCardImageUri = response.data.image.startsWith("http")
          ? response.data.image
          : `${process.env.EXPO_PUBLIC_API_URL}${response.data.image}`;

        setBarberCardImage(barberCardImageUri);
      }
    } catch (err) {
      // Silently handle errors - barber card might not exist yet
      ('Could not fetch barber card image:', err.message);
    }
  };

  const triggerDelete = () => {
    setConfirmModal({
      visible: true,
      title: "Delete Account",
      message:
        "This will permanently delete all your data, bookings, and history. This action cannot be undone.",
      actionLabel: "Delete Permanently",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        // API Call Logic
        try {
          const res = await api.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/delete-account`);

          if (res.status === 200) {
            showAlert("Goodbye", "Your account has been deleted.", "success");
            setTimeout(() => {
              logout();
              // After logout, AppNavigator will show AuthStack (Login)
            }, 2000);
          } else {
            showAlert("Cannot Delete", res.data?.msg || "Action failed.", "error");
          }
        } catch (e) {
          showAlert(
            "Network Error",
            "Check your internet connection.",
            "network"
          );
        }
      },
    });
  };

  const profileImageSource = barberCardImage
    ? { uri: barberCardImage }
    : require("../assets/SetKarr.png");

  const styles = getStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={styles.bgGlow} />

      {/* Notifications (Top) */}
      <ModernAlert visible={alert.visible} title={alert.title} message={alert.message} type={alert.type} theme={theme} onHide={() => setAlert({ ...alert, visible: false })} />

      {/* Confirmation Sheet (Bottom) */}
      <ActionSheet visible={confirmModal.visible} title={confirmModal.title} message={confirmModal.message} actionLabel={confirmModal.actionLabel} isDestructive={confirmModal.isDestructive} theme={theme} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))} />

      {/* --- PREMIUM HEADER --- */}
      <AnimatedGradient colors={[theme.colors.primary, theme.colors.primary + 'DD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.headerWrapper, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={styles.headerBlob1} />
        <View style={styles.headerBlob2} />
        <View style={styles.headerBlob3} />
        <View style={styles.headerBlob4} />

        <View style={styles.headerTopRow}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft size={22} color="#FFF" strokeWidth={2.5} /></TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}

          <Text style={styles.headerTitleText}>Account Settings</Text>

          <TouchableOpacity onPress={() => navigation.navigate("PersonalInfo")} style={styles.headerEditBtn}>
            <Edit size={16} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </AnimatedGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {/* --- PREMIUM PROFILE CARD --- */}
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <LinearGradient colors={isShopOwner ? ["#1e1e24", "#0F172A"] : [theme.colors.primary, theme.colors.primary + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.profileCard, { shadowColor: isShopOwner ? "#000" : theme.colors.primary }]}>
            <View style={styles.profileContent}>
              <View style={styles.avatarWrapper}>
                <Image source={profileImageSource} style={styles.avatar} />
                <View style={styles.avatarGlow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>{user?.name || "Premium Member"}</Text>
                <Text style={styles.cardEmail} numberOfLines={1}>{user?.email || "Digital Identity Verified"}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  {isShopOwner ? (
                    <LinearGradient colors={['#FFD700', '#FDB931']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgePill}>
                      <Crown size={12} color="#5B4500" strokeWidth={3} />
                      <Text style={[styles.badgeText, { color: "#5B4500" }]}>ESTABLISHMENT OWNER</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
                      <Sparkles size={12} color="#FFF" />
                      <Text style={[styles.badgeText, { color: "#FFF" }]}>VERIFIED MEMBER</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.cardDecoration} />
            <View style={styles.cardDecorationSmall} />
          </LinearGradient>
        </Animated.View>

        <View style={{ height: 24 }} />

        <MenuSection title="General" index={1} theme={theme}>
          <MenuItem
            icon={User}
            title="Personal Info"
            subtitle="Manage your details"
            onPress={() => navigation.navigate("PersonalInfo")}
            theme={theme}
          />
          <MenuItem
            icon={Info}
            title="Shop Info"
            subtitle="Workplace details"
            onPress={() => navigation.navigate("ShopInfo")}
            theme={theme}
          />

          <MenuItem
            icon={QrCode}
            title="QR Standee"
            subtitle="Offline tracking code"
            onPress={() => navigation.navigate("QrStandee")}
            theme={theme}
          />

        </MenuSection>

        <MenuSection title="Security & Privacy" index={2} theme={theme}>
          <MenuItem
            icon={Lock}
            title="Change Password"
            onPress={() => navigation.navigate("ChangePassword")}
            theme={theme}
          />
          <MenuItem
            icon={Key}
            title="Two-Factor Auth"
            onPress={() =>
              navigation.navigate("TwoFactorVerification", {
                email: user?.email,
              })
            }
            theme={theme}
          />

          <MenuItem
            icon={Shield}
            title="Privacy Check-up"
            onPress={() => navigation.navigate("PrivacyCheckup")}
            theme={theme}
            isLast
          />
        </MenuSection>

        <MenuSection title="Preferences" index={3} theme={theme}>
          <MenuItem
            icon={Bell}
            title="Notifications"
            onPress={() => navigation.navigate("ManageNotifications")}
            theme={theme}
          />
          <MenuItem
            icon={Clock}
            title="Appointment Settings"
            onPress={() => navigation.navigate("AppointmentSettings")}
            theme={theme}
          />

          <MenuItem
            icon={Languages}
            title="Language"
            onPress={() => navigation.navigate("LanguageSelection")}
            theme={theme}
            isLast
          />
        </MenuSection>

        <MenuSection title="Support" index={4} theme={theme}>
          <MenuItem
            icon={MessageSquare}
            title="Live Chat"
            subtitle="We typically reply in 5m"
            onPress={() => navigation.navigate("Chat")}
            theme={theme}
          />
          <MenuItem
            icon={RefreshCcw}
            title="Refund Policy"
            subtitle="View our aggregator policy"
            onPress={() => navigation.navigate("RefundPolicy")}
            theme={theme}
            isLast
          />
        </MenuSection>

        <View style={styles.footerActions}>
          <ScaleButton onPress={triggerLogout}>
            <View style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
              <Text style={styles.logoutText}>Sign Out of GlossCut</Text>
            </View>
          </ScaleButton>

          <TouchableOpacity onPress={triggerDelete} style={{ marginTop: 24, opacity: 0.6 }}>
            <Text style={styles.deleteText}>PERMANENTLY DELETE ACCOUNT</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>V 2.4.1 • GlossCut Premium Architecture</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// 5. STYLES
// ============================================================================

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  bgGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: theme.colors.primary + '08',
    top: height * 0.2,
    left: -width * 0.5,
    zIndex: -1,
  },

  // --- ALERT ---
  alertWrapper: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999, alignItems: "center", paddingHorizontal: 20 },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  alertIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 },
  alertTextBox: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  alertMessage: { fontSize: 13, fontWeight: "600", opacity: 0.9 },

  // --- PREMIUM HEADER ---
  headerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: STATUSBAR_HEIGHT + 10,
  },
  headerBlob1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30 },
  headerBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 },
  headerBlob3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', top: 20, left: '30%' },
  headerBlob4: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 40, right: -40 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: '100%' },
  headerTitleText: { fontSize: 20, fontWeight: "900", color: '#FFF', letterSpacing: -0.5 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerEditBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // --- PROFILE CARD ---
  profileCard: {
    borderRadius: 28,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  profileContent: { flexDirection: "row", alignItems: "center", zIndex: 2 },
  avatarWrapper: { position: 'relative', marginRight: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)", zIndex: 2 },
  avatarGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', opacity: 0.2, transform: [{ scale: 1.1 }], zIndex: 1 },
  cardName: { fontSize: 24, fontWeight: "900", color: "#FFF", marginBottom: 2, letterSpacing: -0.5 },
  cardEmail: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: '600', marginBottom: 8 },
  badgePill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  cardDecoration: { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", zIndex: 1 },
  cardDecorationSmall: { position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.03)", zIndex: 1 },

  // --- SECTIONS ---
  sectionContainer: { marginBottom: 28 },
  sectionTitle: { fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, marginLeft: 6 },
  cardContainer: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  // --- MENU ITEM ---
  menuItemInner: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 18 },
  iconContainer: { width: 44, height: 44, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 18 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2, letterSpacing: -0.3 },
  menuSubtitle: { fontSize: 13, fontWeight: "500", opacity: 0.6 },
  chevronBox: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // --- FOOTER ---
  footerActions: { alignItems: "center", marginTop: 12, paddingBottom: 20 },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", paddingVertical: 18, borderRadius: 24, borderWidth: 1.5 },
  logoutText: { fontSize: 16, fontWeight: "800", color: "#EF4444", marginLeft: 10 },
  deleteText: { color: "#9CA3AF", fontSize: 14, fontWeight: "700", opacity: 0.8 },
  versionText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 20, opacity: 0.4 },

  // --- ACTION SHEET ---
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheetContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: Platform.OS === 'ios' ? 44 : 32, alignItems: "center" },
  dragHandle: { width: 40, height: 5, backgroundColor: theme.colors.border, borderRadius: 3, marginBottom: 24, opacity: 0.5 },
  sheetTitle: { fontSize: 22, fontWeight: "900", marginBottom: 8, textAlign: 'center' },
  sheetMessage: { fontSize: 15, textAlign: "center", marginBottom: 28, lineHeight: 22, fontWeight: '500' },
  sheetActions: { flexDirection: "row", width: "100%", gap: 14 },
  sheetCancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  sheetCancelText: { fontSize: 16, fontWeight: "700" },
  sheetConfirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: "center", shadowColor: "#EF4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  sheetConfirmText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});
