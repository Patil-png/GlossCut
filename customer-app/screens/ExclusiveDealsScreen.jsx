import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  StatusBar,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  ChevronDown,
  Copy,
  Coins,
  Zap,
  Gift,
  Star,
  CheckCircle,
  AlertCircle,
  Check,
  Info,
} from "lucide-react-native";
import { format } from "date-fns";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 1. OPTIMIZED COMPONENTS (MEMOIZED) ---

// Custom Alert Component (Modern "Toast" Style)
const CustomAlert = ({ visible, type, message, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 40, // Margin Top 40 as requested
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideAlert();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideAlert();
    }
  }, [visible]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const getStyle = () => {
    switch (type) {
      case "success":
        return { bg: "#10B981", icon: <Check size={20} color="#FFF" /> };
      case "error":
        return { bg: "#EF4444", icon: <AlertCircle size={20} color="#FFF" /> };
      default:
        return { bg: "#3B82F6", icon: <Info size={20} color="#FFF" /> };
    }
  };

  const styleConfig = getStyle();

  return (
    <Animated.View
      style={[styles.alertContainer, { transform: [{ translateY }] }]}
    >
      <View style={[styles.alertPill, { backgroundColor: styleConfig.bg }]}>
        <View style={styles.alertIconBubble}>{styleConfig.icon}</View>
        <Text style={styles.alertText} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Memoized Deal Card to prevent list lag
const DealCard = memo(({ item, index, theme, onCopy }) => {
  // Helper for colors
  const getCardColors = (i) => {
    const colors = [
      { bg: "#FFF1F2", border: "#FECDD3", text: "#BE123C", accent: "#E11D48" },
      { bg: "#ECFDF5", border: "#A7F3D0", text: "#047857", accent: "#10B981" },
      { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", accent: "#3B82F6" },
      { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C", accent: "#F97316" },
    ];
    return colors[i % colors.length];
  };

  const themeColors = getCardColors(index);
  const discountText =
    item.discountPercentage > 0 ? `${item.discountPercentage}%` : null;
  const displayCode =
    (item.title ? item.title.substring(0, 4).toUpperCase() : "CODE") +
    (item.discountPercentage || "20");

  return (
    <View
      style={[
        styles.ticketContainer,
        { backgroundColor: themeColors.bg, borderColor: themeColors.border },
      ]}
    >
      <View style={styles.ticketLeft}>
        <View style={styles.ticketHeaderRow}>
          <Text
            style={[styles.ticketTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.minimumPurchase > 0 && (
            <View style={styles.minBadge}>
              <Text style={styles.minBadgeText}>
                Min ₹{item.minimumPurchase}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.ticketDesc, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={styles.ticketFooter}>
          <Text
            style={[styles.validityText, { color: theme.colors.textSecondary }]}
          >
            Valid till{" "}
            {item.validUntil
              ? format(new Date(item.validUntil), "MMM dd")
              : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.ticketSeparator}>
        <View
          style={[
            styles.halfCircle,
            styles.halfCircleTop,
            { backgroundColor: theme.colors.background },
          ]}
        />
        <View
          style={[styles.dashedLine, { borderColor: themeColors.border }]}
        />
        <View
          style={[
            styles.halfCircle,
            styles.halfCircleBottom,
            { backgroundColor: theme.colors.background },
          ]}
        />
      </View>

      <View style={styles.ticketRight}>
        <Text style={[styles.discountBig, { color: themeColors.text }]}>
          {discountText || "OFFER"}
        </Text>
        <Text style={[styles.offLabel, { color: themeColors.text }]}>OFF</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.copyBtn, { borderColor: themeColors.accent }]}
          onPress={() => onCopy(displayCode)}
        >
          <Text style={[styles.copyBtnText, { color: themeColors.accent }]}>
            {displayCode}
          </Text>
          <Copy
            size={12}
            color={themeColors.accent}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Memoized Advantage Card for Dropdown Optimization
const AdvantageCard = memo(
  ({ adv, isExpanded, onToggle, theme }) => {
    return (
      <Pressable
        onPress={() => onToggle(adv.id)}
        style={[
          styles.gridItem,
          { backgroundColor: theme.colors.card },
          isExpanded && styles.gridItemExpanded,
        ]}
      >
        <View style={styles.gridHeader}>
          <View style={[styles.gridIcon, { backgroundColor: adv.bg }]}>
            {adv.icon}
          </View>
          <View style={styles.gridTitleContainer}>
            <Text style={[styles.gridTitle, { color: theme.colors.text }]}>
              {adv.title}
            </Text>
            <View
              style={{
                transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
              }}
            >
              <ChevronDown size={16} color={theme.colors.textSecondary} />
            </View>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.dropdownContent}>
            <Text
              style={[
                styles.dropdownText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {adv.desc}
            </Text>
          </View>
        )}
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.theme === nextProps.theme
    );
  }
);

// --- 2. MAIN SCREEN ---

const ExclusiveDealsScreen = () => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation();

  // Data States
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // UI States
  const [expandedId, setExpandedId] = useState(null);
  const [alertState, setAlertState] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  const [loyaltyData, setLoyaltyData] = useState({
    completedBookings: 0,
    progress: 0,
    nextMilestone: 10,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const coinScaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- TRIGGER ALERT ---
  const triggerAlert = useCallback((type, message) => {
    setAlertState({ visible: true, type, message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  // --- API LOGIC (Optimized & Robust) ---
  const fetchDeals = useCallback(async () => {
    try {
      // Check if URL is valid
      if (!process.env.EXPO_PUBLIC_API_URL) throw new Error("API URL missing");

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/exclusive-deals`,
        { timeout: 10000 } // 10s timeout to prevent infinite hang
      );

      if (response.data?.success) {
        setDeals(response.data.deals || []);
        setError(null);
      } else {
        // Don't crash, just show empty or previous data
        // Only set error if we have no deals to show
        if (deals.length === 0) setError("Failed to fetch deals");
        triggerAlert("error", "Could not load latest deals.");
      }
    } catch (err) {
      console.error("Error fetching deals:", err);
      if (deals.length === 0) {
        setError("Unable to connect to server.");
      }
      triggerAlert("error", "Network issue: Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deals.length, triggerAlert]);

  const fetchUserData = useCallback(async () => {
    if (!user || !token) return;
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`,
        {
          headers: { "x-auth-token": token },
          timeout: 8000,
        }
      );
      if (response.data) {
        const completedBookings = response.data.completedBookings || 0;
        const currentMilestone = Math.floor(completedBookings / 10) * 10;
        const nextMilestone = currentMilestone + 10;
        const progressInCurrentCycle = completedBookings - currentMilestone;
        const progressPercentage = (progressInCurrentCycle / 10) * 100;

        setLoyaltyData({
          completedBookings,
          progress: Math.min(progressPercentage, 100),
          nextMilestone,
        });
      }
    } catch (err) {
      console.log("Silent error fetching user data");
      // Silent fail for user data is better than disturbing UI
    }
  }, [user, token]);

  // Initial Load
  useEffect(() => {
    fetchDeals();
    fetchUserData();

    // Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Coin Loop Animation
    const coinLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coinScaleAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coinScaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    coinLoop.start();

    return () => coinLoop.stop();
  }, [fetchDeals, fetchUserData]);

  // Progress Bar Animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loyaltyData.progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Width property doesn't support native driver
    }).start();
  }, [loyaltyData.progress]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeals();
    fetchUserData();
  }, [fetchDeals, fetchUserData]);

  const handleCopyCode = useCallback(
    (code) => {
      // Replace Alert.alert with Custom Alert
      triggerAlert("success", `${code} copied to clipboard!`);
    },
    [triggerAlert]
  );

  // Optimized Dropdown Logic
  const toggleExpand = useCallback((id) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setExpandedId((prevId) => (prevId === id ? null : id));
  }, []);

  const advantages = [
    {
      id: 0,
      icon: <Zap size={24} color="#FFFFFF" />,
      title: "Instant Checkout",
      bg: "#6366F1",
      desc: "Skip the queue! Pay instantly with GlossCut Coins and walk out in style.",
    },
    {
      id: 1,
      icon: <Gift size={24} color="#FFFFFF" />,
      title: "Exclusive Deals",
      bg: "#EC4899",
      desc: "Access secret menus and special discounts only available to coin holders.",
    },
    {
      id: 2,
      icon: <Star size={24} color="#FFFFFF" />,
      title: "Priority Booking",
      bg: "#F59E0B",
      desc: "Get first dibs on weekend slots and popular barbers. No more waiting.",
    },
    {
      id: 3,
      icon: <CheckCircle size={24} color="#FFFFFF" />,
      title: "Premium Service",
      bg: "#10B981",
      desc: "Unlock complimentary head massages and premium grooming products.",
    },
  ];

  // Loading State
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6200EA" />
        </View>
      </SafeAreaView>
    );
  }

  // Error State (Full Page - only if strictly necessary)
  if (error && deals.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
          >
            <ChevronLeft size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDeals}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <CustomAlert
          visible={alertState.visible}
          type={alertState.type}
          message={alertState.message}
          onHide={hideAlert}
          theme={theme}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Exclusive Deals
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6200EA"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* 1. HERO WALLET SECTION */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={["#240b36", "#c31432"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View>
                <Text style={styles.heroLabel}>GlossCut Balance</Text>
                <Text style={styles.heroBalance}>
                  {user?.setkarCoins?.toFixed(2) || "0.00"}
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.coinIconWrapper,
                  { transform: [{ scale: coinScaleAnim }] },
                ]}
              >
                <Coins size={40} color="#FFD700" fill="#FFD700" />
              </Animated.View>
            </LinearGradient>
          </View>

          {/* 2. LOYALTY PROGRESS */}
          <View
            style={[styles.loyaltyCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.loyaltyHeader}>
              <Text style={[styles.loyaltyTitle, { color: theme.colors.text }]}>
                Loyalty Program
              </Text>
              <Text style={styles.loyaltyCount}>
                {loyaltyData.completedBookings}/{loyaltyData.nextMilestone}{" "}
                Bookings
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: "#F59E0B",
                  },
                ]}
              >
                <LinearGradient
                  colors={["#F59E0B", "#FBBF24"]}
                  style={{ flex: 1, borderRadius: 4 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            <Text style={styles.loyaltySubtext}>
              {loyaltyData.nextMilestone - loyaltyData.completedBookings} more
              bookings to unlock VIP Status & 10 coins
            </Text>
          </View>

          {/* 3. CURRENT OFFERS LIST */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Current Offers
            </Text>
            {deals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  No active deals available.
                </Text>
              </View>
            ) : (
              <View style={styles.dealsList}>
                {deals.map((item, index) => (
                  <DealCard
                    key={item._id || index}
                    item={item}
                    index={index}
                    theme={theme}
                    onCopy={handleCopyCode}
                  />
                ))}
              </View>
            )}
          </View>

          {/* 4. WHY CHOOSE GRID (WITH DROPDOWNS) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Why Choose GlossCut?
            </Text>
            <View style={styles.gridContainer}>
              {advantages.map((adv) => (
                <AdvantageCard
                  key={adv.id}
                  adv={adv}
                  isExpanded={expandedId === adv.id}
                  onToggle={toggleExpand}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* CUSTOM ALERT LAYER (On Top of Everything) */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        message={alertState.message}
        onHide={hideAlert}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  backIcon: { padding: 5 },

  // HERO CARD
  heroSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#c31432",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroBalance: { color: "#FFF", fontSize: 36, fontWeight: "800" },
  coinIconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 50,
  },

  // LOYALTY CARD
  loyaltyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  loyaltyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  loyaltyTitle: { fontSize: 16, fontWeight: "700" },
  loyaltyCount: { fontSize: 14, fontWeight: "600", color: "#666" },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  loyaltySubtext: { fontSize: 12, color: "#9CA3AF" },

  // SECTIONS
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 20,
    marginBottom: 15,
  },

  // TICKET STYLES
  dealsList: { paddingHorizontal: 20 },
  ticketContainer: {
    flexDirection: "row",
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  ticketLeft: { flex: 2, padding: 16, justifyContent: "space-between" },
  ticketHeaderRow: { flexDirection: "row", alignItems: "center" },
  ticketTitle: { fontSize: 16, fontWeight: "800", marginRight: 8, flex: 1 },
  minBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  minBadgeText: { fontSize: 10, color: "#666", fontWeight: "600" },
  ticketDesc: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  ticketFooter: { marginTop: 8 },
  validityText: { fontSize: 11, fontWeight: "500" },
  ticketSeparator: {
    width: 20,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dashedLine: {
    height: "80%",
    width: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  halfCircle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    left: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: "transparent",
  },
  halfCircleTop: { top: -10 },
  halfCircleBottom: { bottom: -10 },
  ticketRight: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 0,
  },
  discountBig: { fontSize: 22, fontWeight: "900" },
  offLabel: { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  copyBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  copyBtnText: { fontSize: 10, fontWeight: "700" },

  // GRID & DROPDOWN STYLES
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  gridItem: {
    width: (width - 50) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  gridItemExpanded: {
    shadowOpacity: 0.1,
    elevation: 4,
  },
  gridHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  gridTitleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    marginRight: 4,
  },
  dropdownContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    width: "100%",
  },
  dropdownText: {
    fontSize: 12,
    lineHeight: 18,
  },

  // CUSTOM ALERT STYLES
  alertContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999, // Ensure it's on top
  },
  alertPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxWidth: width * 0.9,
    minWidth: width * 0.8,
  },
  alertIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  // ERRORS
  errorText: { marginBottom: 10, fontSize: 16 },
  retryBtn: { padding: 10, backgroundColor: "#6200EA", borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyContainer: { padding: 20, alignItems: "center" },
});

export default ExclusiveDealsScreen;
