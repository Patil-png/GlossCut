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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;

// ============================================================================
// 1. MODERN ALERT (Notifications from TOP)
// ============================================================================

const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        mass: 1,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-150);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const config = useMemo(() => {
    switch (type) {
      case "error":
        return {
          bg: "#FEF2F2",
          border: "#FECACA",
          iconColor: "#DC2626",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: "#F0FDF4",
          border: "#86EFAC",
          iconColor: "#16A34A",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "#FFFBEB",
          border: "#FDE68A",
          iconColor: "#D97706",
          Icon: AlertTriangle,
        };
      case "network":
        return {
          bg: "#EFF6FF",
          border: "#BFDBFE",
          iconColor: "#2563EB",
          Icon: WifiOff,
        };
      default:
        return {
          bg: "#FFFFFF",
          border: "#E5E7EB",
          iconColor: "#4B5563",
          Icon: Info,
        };
    }
  }, [type]);

  if (!visible && translateY._value === -150) return null;

  return (
    <Animated.View
      style={[styles.alertWrapper, { transform: [{ translateY }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClose}
        style={[
          styles.alertContainer,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <View
          style={[
            styles.alertIconBox,
            { backgroundColor: config.iconColor + "15" },
          ]}
        >
          <config.Icon size={24} color={config.iconColor} />
        </View>
        <View style={styles.alertTextBox}>
          <Text style={[styles.alertTitle, { color: config.iconColor }]}>
            {title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ============================================================================
// 2. ACTION SHEET (Confirmations from BOTTOM)
// ============================================================================

const ActionSheet = ({
  visible,
  title,
  message,
  actionLabel,
  onConfirm,
  onCancel,
  isDestructive,
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.sheetMessage}>{message}</Text>

          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={onCancel} style={styles.sheetCancelBtn}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.sheetConfirmBtn,
                { backgroundColor: isDestructive ? "#EF4444" : "#4f46e5" },
              ]}
            >
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

  useEffect(() => {
    Animated.stagger(100 * index, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 15,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {title && (
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
        >
          {title}
        </Text>
      )}
      <View
        style={[styles.cardContainer, { backgroundColor: theme.colors.card }]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const MenuItem = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  theme,
  isLast,
  isDestructive,
}) => (
  <ScaleButton onPress={onPress}>
    <View
      style={[
        styles.menuItemInner,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border + "30",
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDestructive
              ? "#FEF2F2"
              : theme.colors.iconBackground,
          },
        ]}
      >
        <Icon
          size={20}
          color={isDestructive ? "#EF4444" : theme.colors.primary}
          strokeWidth={2.5}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text
          style={[
            styles.menuTitle,
            { color: isDestructive ? "#EF4444" : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {!isDestructive && (
        <ChevronRight size={18} color={theme.colors.textSecondary + "60"} />
      )}
    </View>
  </ScaleButton>
);

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
    onConfirm: () => {},
  });

  // Entrance Animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true }),
    ]).start();

    checkShopOwnership();
    fetchBarberCardImage();
  }, []);

  // --- SAFE HANDLERS ---

  const showAlert = useCallback((title, message, type = "info") => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const checkShopOwnership = async () => {
    if (!user) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, {
        headers: { "x-auth-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setIsShopOwner(data.owner === user.id);
      }
    } catch (e) {
      console.log("Ownership check silently failed");
    }
  };

  const handleListingTierNavigation = async () => {
    if (!user?.shopCategory) {
      showAlert(
        "Missing Info",
        "Please set your shop category first.",
        "warning"
      );
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("Session Expired", "Please log in again.", "error");
        return;
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error("Network response failed");

      const data = await res.json();
      if (data.owner !== user.id) {
        showAlert(
          "Access Denied",
          "Only the shop owner can manage listing tiers.",
          "warning"
        );
        return;
      }
      switch (user.shopCategory) {
        case "Barber":
          navigation.navigate("ListingTier");
          break;
        case "Women's Salon":
          navigation.navigate("WomenSalonListingTier");
          break;
        case "Pet Care":
          navigation.navigate("PetCareListingTier");
          break;
        default:
          showAlert("Category Error", "Unknown shop category.", "error");
      }
    } catch (error) {
      showAlert(
        "Connection Error",
        "Check your internet connection.",
        "network"
      );
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
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.image) {
          // Process the image URL the same way as CreateBarberCardScreen
          const barberCardImageUri = data.image.startsWith("http")
            ? data.image
            : `${process.env.EXPO_PUBLIC_API_URL}${data.image}`;

          setBarberCardImage(barberCardImageUri);
        }
      }
    } catch (err) {
      // Silently handle errors - barber card might not exist yet
      console.log('Could not fetch barber card image:', err.message);
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
          const token = await AsyncStorage.getItem("token");
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/auth/delete-account`,
            {
              method: "DELETE",
              headers: {
                "x-auth-token": token,
                "Content-Type": "application/json",
              },
            }
          );
          if (res.ok) {
            showAlert("Goodbye", "Your account has been deleted.", "success");
            setTimeout(() => {
              logout();
              // After logout, AppNavigator will show AuthStack (Login)
            }, 2000);
          } else {
            const errData = await res.json();
            showAlert(
              "Cannot Delete",
              errData.msg || "Action failed.",
              "error"
            );
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Notifications (Top) */}
      <ModernAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onHide={() => setAlert({ ...alert, visible: false })}
      />

      {/* Confirmation Sheet (Bottom) */}
      <ActionSheet
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        actionLabel={confirmModal.actionLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal((prev) => ({ ...prev, visible: false }))
        }
      />

      {/* --- HEADER --- */}
      <Animated.View
        style={[
          styles.headerWrapper,
          { opacity: headerFade, transform: [{ translateY: headerSlide }] },
        ]}
      >
        <View style={styles.headerTopRow}>
          {/* Universal Back Button */}
          {navigation.canGoBack() ? (
            <PremiumBackButton navigation={navigation} theme={theme} />
          ) : (
            <View style={{ width: 44 }} />
          )}

          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Profile
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("PersonalInfo")}
            style={[styles.editButton, { borderColor: theme.colors.border }]}
          >
            <Edit
              size={14}
              color={theme.colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.editButtonText, { color: theme.colors.text }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {/* --- PREMIUM PROFILE CARD --- */}
        <Animated.View
          style={{
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          }}
        >
          <LinearGradient
            colors={
              isShopOwner ? ["#1e1e24", "#2d2d3a"] : ["#4f46e5", "#7c3aed"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.profileContent}>
              <Image source={profileImageSource} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {user?.name || "Guest User"}
                </Text>
                <Text style={styles.cardEmail} numberOfLines={1}>
                  {user?.email || "Sign in to view details"}
                </Text>

                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isShopOwner
                        ? "#FFD700"
                        : "rgba(255,255,255,0.2)",
                    },
                  ]}
                >
                  {isShopOwner ? (
                    <Crown size={12} color="#000" />
                  ) : (
                    <Sparkles size={12} color="#FFF" />
                  )}
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isShopOwner ? "#000" : "#FFF" },
                    ]}
                  >
                    {isShopOwner ? "Owner Account" : "Member"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardDecoration} />
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
          {isShopOwner && (
            <MenuItem
              icon={Star}
              title="Listing Tier"
              subtitle="Boost your visibility"
              onPress={handleListingTierNavigation}
              theme={theme}
            />
          )}
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
            icon={Palette}
            title="Theme"
            subtitle={isDark ? "Dark Mode" : "Light Mode"}
            onPress={changeTheme}
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
            isLast
          />
        </MenuSection>

        <View style={styles.footerActions}>
          <ScaleButton onPress={triggerLogout}>
            <View
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <LogOut size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </ScaleButton>

          <TouchableOpacity onPress={triggerDelete} style={{ marginTop: 12 }}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 2.4.0 • GlossCut Inc.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// 5. STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // --- ALERT ---
  alertWrapper: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 10,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  alertTextBox: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  alertMessage: { fontSize: 13, color: "#4B5563", fontWeight: "500" },

  // --- HEADER ---
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? STATUSBAR_HEIGHT + 10 : 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: -1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // --- PROFILE CARD ---
  profileCard: {
    borderRadius: 24,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  cardDecoration: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.1)",
    zIndex: 1,
  },

  // --- SECTIONS ---
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
    opacity: 0.5,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // --- MENU ITEM ---
  menuItemInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.6,
  },

  // --- FOOTER ---
  footerActions: {
    alignItems: "center",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginLeft: 8,
  },
  deleteText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  versionText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 16,
  },

  // --- ACTION SHEET ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 10,
  },
  sheetMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  sheetActions: {
    flexDirection: "row",
    width: "100%",
    gap: 16,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  sheetConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
