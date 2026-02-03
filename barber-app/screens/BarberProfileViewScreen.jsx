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
  Image,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  Easing,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Tag,
  MessageCircle,
  Clock,
  Share2,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trophy,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import CancelSwipeButton from "../components/CancelSwipeButton";

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;

const COLORS = {
  primary: "#6366F1",
  accent: "#10B981",
  dark: "#0F172A",
  text: "#1E293B",
  textSecondary: "#64748B",
  lightGray: "#F8FAFC",
  white: "#FFFFFF",
  red: "#EF4444",
  gold: "#F59E0B",
  border: "#E2E8F0",
  successBg: "#ECFDF5",
  successText: "#065F46",
  errorBg: "#FEF2F2",
  errorText: "#991B1B",
  warnBg: "#FFFBEB",
  warnText: "#92400E",
};

// --- OPTIMIZED SUB-COMPONENTS (Memoized to prevent re-renders) ---

// --- HELPER FUNCTIONS ---
const getProcessedImageUri = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.EXPO_PUBLIC_API_URL}${imagePath}`;
};

const InfoRow = React.memo(
  ({ icon: Icon, label, value, color = COLORS.primary }) => (
    <View style={styles.infoRow}>
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "N/A"}</Text>
      </View>
    </View>
  )
);

const StatItem = React.memo(({ icon: Icon, value, label, color }) => (
  <View style={styles.statItem}>
    <Icon size={18} color={color} />
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLab}>{label}</Text>
  </View>
));

const ServiceItem = React.memo(({ service }) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.durationTag}>
        <Clock size={12} color={COLORS.textSecondary} />
        <Text style={styles.durationText}>{service.time} min</Text>
      </View>
    </View>
    <View style={styles.priceContainer}>
      <Text style={styles.currency}>₹</Text>
      <Text style={styles.priceText}>{service.price}</Text>
    </View>
  </View>
));

const ToastAlert = React.memo(
  ({ visible, message, type = "success", onHide }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        const timer = setTimeout(() => {
          handleHide();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        handleHide();
      }
    }, [visible]);

    const handleHide = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide && visible) onHide();
      });
    };

    const getStyles = () => {
      switch (type) {
        case "error":
          return {
            bg: COLORS.errorBg,
            text: COLORS.errorText,
            icon: XCircle,
            iconColor: COLORS.red,
          };
        case "warning":
          return {
            bg: COLORS.warnBg,
            text: COLORS.warnText,
            icon: AlertCircle,
            iconColor: COLORS.gold,
          };
        default:
          return {
            bg: COLORS.successBg,
            text: COLORS.successText,
            icon: CheckCircle,
            iconColor: COLORS.accent,
          };
      }
    };

    const styleConfig = getStyles();
    const Icon = styleConfig.icon;

    return (
      <Animated.View
        style={[
          styles.toastContainer,
          { transform: [{ translateY }], opacity },
        ]}
      >
        <View
          style={[
            styles.toastContent,
            {
              backgroundColor: styleConfig.bg,
              borderColor: styleConfig.iconColor + "30",
            },
          ]}
        >
          <Icon size={20} color={styleConfig.iconColor} />
          <Text style={[styles.toastText, { color: styleConfig.text }]}>
            {message}
          </Text>
        </View>
      </Animated.View>
    );
  }
);

// --- MAIN SCREEN ---
const BarberProfileViewScreen = ({ navigation, route }) => {
  const { barberId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();

  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellationDone, setCancellationDone] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // Use useRef for animations to avoid state re-renders
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Optimized Toast Handler
  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchBarberProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/api/shop/barber/${barberId}`,
          {
            timeout: 10000,
          }
        );

        if (isMounted && res.data) {
          setShopData(res.data);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch Error:", err);
          if (!err.response) {
            showToast(
              "Network error. Check your internet connection.",
              "error"
            );
          } else {
            showToast("Unable to load profile details.", "error");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBarberProfile();
    return () => {
      isMounted = false;
    };
  }, [barberId, showToast]);

  const handleCancelListing = useCallback(async () => {
    try {
      await api.put(
        `/api/shop/barber/cancel-listing/${barberId}`,
        {}
      );

      showToast("Listing deactivated successfully!", "success");
      setCancellationDone(true);

      setTimeout(() => {
        if (navigation.canGoBack()) navigation.goBack();
      }, 2000);
    } catch (err) {
      if (!err.response) {
        showToast("Connection failed. Please try again.", "error");
      } else {
        showToast("Failed to cancel listing. Try again.", "error");
      }
    }
  }, [barberId, navigation, showToast]);

  const handleSwipeSuccess = useCallback(() => {
    showToast("Processing deactivation...", "warning");
    setTimeout(handleCancelListing, 500);
  }, [handleCancelListing, showToast]);

  // Derived Values (Memoized to prevent calculation on every render)
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Curating Profile...</Text>
        <ToastAlert
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.stickyHeaderContent}>
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
            {shopData?.name}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.topNavIcons}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navCircle}
        >
          <ArrowLeft size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navCircle}
          onPress={() => showToast("Shared successfully!", "success")}
        >
          <Share2 size={22} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <ToastAlert
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Performance boost for long lists
      >


        <Animated.View
          style={[styles.heroContainer, { transform: [{ scale: imageScale }] }]}
        >
          {shopData?.image || (user?.id === barberId && user?.profilePicture) ? (
            <Image
              source={{ uri: getProcessedImageUri(shopData?.image || (user?.id === barberId ? user?.profilePicture : null)) }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.placeholderHero]}>
              <Text style={{ color: COLORS.white }}>No Image Available</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroBadgeRow}>
            <View style={styles.premiumBadge}>
              <ShieldCheck size={14} color="#fff" />
              <Text style={styles.premiumBadgeText}>Verified Partner</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.mainCard}>
            <View style={styles.titleSection}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.barberName}>
                  {shopData?.name || "Unknown Shop"}
                </Text>
                <View style={styles.locationRow}>
                  <MapPin size={14} color={COLORS.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={2}>
                    {shopData?.address || "Location unavailable"}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingValue}>
                  {shopData?.rating || "New"}
                </Text>
                <Star size={14} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatItem
                icon={MessageCircle}
                value={shopData?.reviews || 0}
                label="Reviews"
                color={COLORS.primary}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon={Star}
                value={shopData?.rating && shopData.rating > 0 ? shopData.rating.toFixed(1) : "New"}
                label="Rating"
                color={COLORS.gold}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon={Trophy}
                value={shopData?.selectedListingPlace?.place || "N/A"}
                label="Position"
                color={COLORS.accent}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Insights</Text>
            <View style={styles.detailsCard}>
              <InfoRow
                icon={Phone}
                label="Contact Support"
                value={shopData?.phone}
              />
              <View style={styles.innerDivider} />
              <InfoRow
                icon={Tag}
                label="Specialization"
                value={shopData?.category}
                color={COLORS.accent}
              />
            </View>
          </View>


        </Animated.View>
      </Animated.ScrollView>

      {!cancellationDone && user?.id === barberId && (
        <View style={styles.footer}>
          <CancelSwipeButton
            onSwipeSuccess={handleSwipeSuccess}
            title="Slide to Deactivate Listing"
            theme={theme}
            backgroundColor={COLORS.red}
            color={COLORS.white}
          />
        </View>
      )}

      {cancellationDone && (
        <View style={styles.footer}>
          <View style={styles.deactivatedBadge}>
            <Text style={styles.deactivatedText}>Listing Deactivated</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    minWidth: "80%",
    justifyContent: "center",
  },
  toastText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  heroContainer: { height: 320, width: width },
  heroImage: { width: "100%", height: "100%" },
  placeholderHero: {
    backgroundColor: COLORS.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroBadgeRow: { position: "absolute", bottom: 60, left: 20 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  premiumBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
    textTransform: "uppercase",
  },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: STATUSBAR_HEIGHT + 50,
    backgroundColor: COLORS.white,
    zIndex: 10,
    paddingTop: STATUSBAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: "center",
  },
  stickyHeaderContent: { alignItems: "center", paddingBottom: 10 },
  stickyHeaderTitle: { fontSize: 16, fontWeight: "700", color: COLORS.dark },
  topNavIcons: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 10,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 11,
  },
  navCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  scrollContent: { paddingBottom: 120 },
  mainCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: -40,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  barberName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 4,
    flex: 1,
  },
  ratingBox: {
    backgroundColor: COLORS.dark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingValue: {
    color: COLORS.white,
    fontWeight: "700",
    marginRight: 4,
    fontSize: 14,
  },

  statsGrid: {
    flexDirection: "row",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: COLORS.border,
    alignSelf: "center",
  },
  statVal: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginTop: 4,
  },
  statLab: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  section: { marginTop: 32, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  serviceCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  innerDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },

  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "600", color: COLORS.dark },
  durationTag: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  durationText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  priceContainer: { flexDirection: "row", alignItems: "flex-start" },
  currency: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  priceText: { fontSize: 20, fontWeight: "800", color: COLORS.dark },

  infoRow: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  infoValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
    marginTop: 1,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deactivatedBadge: {
    backgroundColor: COLORS.red + "10",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.red + "20",
  },
  deactivatedText: { color: COLORS.red, fontWeight: "700", fontSize: 15 },
});

export default BarberProfileViewScreen;
