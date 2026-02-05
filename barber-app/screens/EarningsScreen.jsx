import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  InteractionManager,
  Easing,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useFocusEffect } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

// --- THEME COLORS (Dark Mode Optimized) ---
const getThemeColors = (theme) => {
  const isDark = theme.dark;
  return {
    primary: theme.colors.primary || "#6366F1",
    primaryDark: isDark ? "#4F46E5" : "#4338CA",
    primaryLight: "#818CF8",
    bg: isDark ? "#0F172A" : "#F8FAFC", // Deep Blue-Grey for Dark Mode
    surface: isDark ? "#1E293B" : "#FFFFFF", // Lighter Blue-Grey for Cards
    textHeading: isDark ? "#F1F5F9" : "#0F172A",
    textBody: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    success: "#10B981",
    successBg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
    error: "#EF4444",
    errorBg: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
    iconBg: isDark ? "#334155" : "#E0E7FF",
    chartGradientStart: theme.colors.primary,
    chartGradientEnd: isDark ? "#1E293B" : "#FFFFFF",
  };
};

// --- CHART CONFIG (No Dots) ---
const getChartConfig = (theme, COLORS) => ({
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => COLORS.textBody,
  // NO DOTS CONFIGURATION
  propsForDots: { r: "0", strokeWidth: "0", stroke: "transparent" },
  propsForBackgroundLines: {
    strokeDasharray: "4",
    stroke: theme.dark ? "#334155" : "#F1F5F9",
  },
  fillShadowGradientFrom: COLORS.primary,
  fillShadowGradientTo: COLORS.surface,
  fillShadowGradientFromOpacity: 0.3,
  fillShadowGradientToOpacity: 0.05,
});

const useThemeColors = () => {
  const { theme } = useTheme();
  return getThemeColors(theme);
};

// --- COMPONENTS ---

const ShimmerBlock = ({ width, height, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#CBD5E1",
          borderRadius: 12,
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonLoader = () => (
  <View style={{ padding: 20 }}>
    <ShimmerBlock
      width="100%"
      height={220}
      style={{ borderRadius: 24, marginBottom: 24 }}
    />
    <ShimmerBlock
      width="100%"
      height={48}
      style={{ borderRadius: 16, marginBottom: 24 }}
    />
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
      <ShimmerBlock style={{ flex: 1 }} height={110} />
      <ShimmerBlock style={{ flex: 1 }} height={110} />
    </View>
  </View>
);

const CountUp = ({ value, style, prefix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
    const listener = animatedValue.addListener(({ value: v }) =>
      setDisplayValue(v)
    );
    return () => animatedValue.removeListener(listener);
  }, [value]);
  return (
    <Text style={style}>
      {prefix}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </Text>
  );
};

const ScaleButton = React.memo(({ onPress, children, style, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    !disabled &&
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    !disabled &&
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={[{ width: style?.width, flex: style?.flex }, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

const TopToast = React.memo(
  ({ visible, message, type, onHide, styles, COLORS }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    useEffect(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: Platform.OS === "ios" ? 60 : 40,
          useNativeDriver: true,
        }).start();
        const timer = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => onHide && onHide());
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [visible]);
    if (!visible) return null;
    const isError = type === "error";
    return (
      <Animated.View
        style={[styles.toastWrapper, { transform: [{ translateY }] }]}
      >
        <View
          style={[
            styles.toastContainer,
            isError ? styles.toastError : styles.toastSuccess,
            { backgroundColor: COLORS.surface },
          ]}
        >
          <View
            style={[
              styles.toastIcon,
              { backgroundColor: isError ? COLORS.errorBg : COLORS.successBg },
            ]}
          >
            <Feather
              name={isError ? "alert-circle" : "check"}
              size={18}
              color={isError ? COLORS.error : COLORS.success}
            />
          </View>
          <Text style={[styles.toastText, { color: COLORS.textHeading }]}>
            {message}
          </Text>
        </View>
      </Animated.View>
    );
  }
);

const TransactionItem = React.memo(({ transaction }) => {
  const COLORS = useThemeColors();
  return (
    <View
      style={[
        stylesLocal.transItem,
        { backgroundColor: COLORS.surface, borderColor: COLORS.border },
      ]}
    >
      <View style={stylesLocal.transLeft}>
        <View
          style={[stylesLocal.transIconBox, { backgroundColor: COLORS.iconBg }]}
        >
          <MaterialCommunityIcons
            name="arrow-bottom-left"
            size={22}
            color={COLORS.primary}
          />
        </View>
        <View>
          <Text
            style={[stylesLocal.transTitle, { color: COLORS.textHeading }]}
            numberOfLines={1}
          >
            {transaction.description || "Service Booking"}
          </Text>
          <Text style={[stylesLocal.transDate, { color: COLORS.textBody }]}>
            {format(new Date(transaction.date), "MMM d, h:mm a")}
          </Text>
        </View>
      </View>
      <View style={stylesLocal.transRight}>
        <Text style={[stylesLocal.transAmount, { color: COLORS.success }]}>
          +₹{transaction.amount.toFixed(0)}
        </Text>
        <View
          style={[
            stylesLocal.transStatusDot,
            { backgroundColor: COLORS.success },
          ]}
        />
      </View>
    </View>
  );
});

// --- GOAL WIDGET COMPONENT ---
const GoalWidget = React.memo(({ currentEarnings, target = 50000, COLORS }) => {
  const progress = Math.min(Math.max((currentEarnings / target) * 100, 0), 100);
  const remaining = Math.max(target - currentEarnings, 0);

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.surface]} // Or a subtle gradient
        style={{
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textHeading }}>
            Monthly Goal 🎯
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textBody }}>
            {progress.toFixed(0)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
          <View style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: COLORS.primary,
            borderRadius: 5
          }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: COLORS.textBody }}>
            {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} to reach target` : "Target smashed! 🔥"}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textHeading }}>
            ₹{target.toLocaleString('en-IN')}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
});

// --- STAFF EARNINGS COMPONENT (Leaderboard Style) ---
const StaffEarningsList = React.memo(({ data, COLORS, styles }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Sort by earnings (Desc) to ensure #1 is at top
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [data]);

  const maxEarnings = sortedData.length > 0 ? sortedData[0].totalEarnings : 0;

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderDateItem = (dateItem) => (
    <View key={dateItem.date} style={stylesLocal.staffDateRow}>
      <View style={{ flex: 1 }}>
        <Text style={[stylesLocal.staffDateText, { color: COLORS.textHeading }]}>
          {format(new Date(dateItem.date), "MMM d, yyyy")}
        </Text>
        <Text style={[stylesLocal.staffServicesText, { color: COLORS.textBody }]}>
          {dateItem.services.join(", ")}
        </Text>
      </View>
      <Text style={[stylesLocal.staffDateAmount, { color: COLORS.success }]}>
        ₹{dateItem.amount}
      </Text>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginBottom: 16 }}>
        Staff Leaderboard 🏆
      </Text>

      {sortedData.map((staff, index) => {
        const isExpanded = expandedId === staff.id;
        const progress = maxEarnings > 0 ? (staff.totalEarnings / maxEarnings) * 100 : 0;
        const isTopPerformer = index === 0 && staff.totalEarnings > 0;

        return (
          <TouchableOpacity
            key={staff.id}
            activeOpacity={0.9}
            onPress={() => toggleExpand(staff.id)}
            style={[
              stylesLocal.staffCard,
              {
                backgroundColor: COLORS.surface,
                borderColor: isExpanded ? COLORS.primary : COLORS.border,
                marginBottom: 16
              },
            ]}
          >
            <View style={stylesLocal.staffHeader}>
              {/* Rank / Avatar */}
              <View style={[stylesLocal.staffInfo, { flex: 1 }]}>
                <View
                  style={[
                    stylesLocal.staffAvatar,
                    {
                      backgroundColor: isTopPerformer ? '#FFD700' : COLORS.iconBg,
                      borderWidth: isTopPerformer ? 2 : 0,
                      borderColor: '#B8860B'
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16, fontWeight: "700", color: isTopPerformer ? '#FFF' : COLORS.primary }}>
                    {staff.name.charAt(0)}
                  </Text>
                  {isTopPerformer && (
                    <View style={{ position: 'absolute', bottom: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10, padding: 2 }}>
                      <Text style={{ fontSize: 10 }}>🏆</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[stylesLocal.staffName, { color: COLORS.textHeading }]}>
                    {staff.name} {isTopPerformer && <Text style={{ color: '#F59E0B', fontSize: 12 }}> (Top Earner)</Text>}
                  </Text>
                  <Text style={[stylesLocal.staffRole, { color: COLORS.textBody }]}>
                    {staff.role}
                  </Text>
                </View>
              </View>

              {/* Total & Chevron */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[stylesLocal.staffTotal, { color: COLORS.textHeading }]}>
                  ₹{staff.totalEarnings.toLocaleString("en-IN")}
                </Text>
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.textBody}
                  style={{ marginTop: 4 }}
                />
              </View>
            </View>

            {/* PROGRESS BAR */}
            <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
              <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: isTopPerformer ? '#F59E0B' : COLORS.primary,
                  borderRadius: 3
                }} />
              </View>
            </View>

            {/* PROJECTION & STATS */}
            <View style={{ marginTop: 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: COLORS.textBody }}>
                Avg/Day: <Text style={{ fontWeight: '600' }}>₹{Math.round(staff.totalEarnings / Math.max(1, new Date().getDate()))}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textBody }}>
                Projected: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>₹{staff.projectedEarnings?.toLocaleString('en-IN') || 0}</Text>
              </Text>
            </View>

            {isExpanded && (
              <View style={stylesLocal.staffDetails}>
                <View style={[stylesLocal.divider, { backgroundColor: COLORS.border }]} />
                <Text style={[stylesLocal.detailLabel, { color: COLORS.textBody }]}>
                  Daily Breakdown
                </Text>
                {staff.dailyBreakdown.map(renderDateItem)}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const EarningsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const COLORS = getThemeColors(theme);
  const styles = createStyles(COLORS);
  const STATIC_CHART_CONFIG = getChartConfig(theme, COLORS);

  // States
  const [filter, setFilter] = useState("month");
  const [earningsData, setEarningsData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // Staff Earnings State
  const [viewMode, setViewMode] = useState("personal"); // 'personal' | 'staff'
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [staffEarnings, setStaffEarnings] = useState([]);

  const contentFade = useRef(new Animated.Value(0)).current;

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === "android") {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
    checkShopOwnership();
  }, []);

  const checkShopOwnership = async () => {
    if (!user) return;
    try {
      // Check if user is owner via API or User Context if available
      // For now, fetching shop details to be robust
      const res = await api.get('/api/shop/my-shop');
      if (res.status === 200 && (res.data.owner === user.id || res.data.isMainOwner)) {
        setIsShopOwner(true);
      }
    } catch (e) {
      console.log("Not a shop owner or error checking");
    }
  };

  const fetchStaffEarnings = useCallback(async (currentFilter = 'month') => {
    // Fetch actual data from API with Filter
    setLoading(true);
    try {
      const res = await api.get(`/api/earnings/staff?filter=${currentFilter}`);
      if (res.status === 200) {
        setStaffEarnings(res.data);
      }
    } catch (e) {
      console.log("Error fetching staff earnings", e);
      showToast("Failed to load staff earnings", "error");
    } finally {
      setLoading(false);
    }
  }, []);


  // Actions
  const showToast = useCallback(
    (msg, type = "success") => setToast({ visible: true, message: msg, type }),
    []
  );
  const hideToast = useCallback(
    () => setToast((prev) => ({ ...prev, visible: false })),
    []
  );

  // Fetch Logic
  const fetchEarningsData = useCallback(
    async (currentFilter, pageNum = 1, isLoadMore = false) => {
      if (!isLoadMore && !refreshing) setLoading(true);
      try {
        const res = await api.get(
          `/api/earnings?filter=${currentFilter}&page=${pageNum}`
        );
        if (res && res.data) {
          if (isLoadMore) {
            setRecentTransactions((prev) => [
              ...prev,
              ...res.data.recentTransactions,
            ]);
          } else {
            setEarningsData(res.data);
            setRecentTransactions(res.data.recentTransactions);
            Animated.timing(contentFade, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          }
          setHasMore(res.data.pagination?.hasNext || false);
        }
      } catch (err) {
        if (!isLoadMore) showToast("Connection Error", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.token) {
        InteractionManager.runAfterInteractions(() => {
          if (viewMode === 'staff') {
            fetchStaffEarnings(filter);
          } else {
            setPage(1);
            fetchEarningsData(filter, 1, false);
          }
        });
      }
    }, [filter, user?.token, viewMode, fetchStaffEarnings, fetchEarningsData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchEarningsData(filter, 1, false);
  }, [filter, fetchEarningsData]);

  const loadMoreTransactions = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEarningsData(filter, nextPage, true);
  };

  const chartData = useMemo(() => {
    const defaultData = [0, 0, 0, 0, 0, 0];
    let rawData = defaultData;
    if (filter === "day" && Array.isArray(earningsData?.dailyEarnings))
      rawData = earningsData.dailyEarnings;
    else if (filter === "week" && Array.isArray(earningsData?.weeklyEarnings))
      rawData = earningsData.weeklyEarnings;
    else if (Array.isArray(earningsData?.monthlyEarnings))
      rawData = earningsData.monthlyEarnings;

    if (rawData.length === 0) rawData = defaultData;
    const sanitizedData = rawData.map((val) => {
      const num = Number(val);
      return Number.isFinite(num) ? num : 0;
    });

    return {
      labels:
        filter === "day"
          ? ["12a", "4a", "8a", "12p", "4p", "8p"]
          : filter === "week"
            ? ["S", "M", "T", "W", "T", "F", "S"]
            : ["1", "5", "10", "15", "20", "25"],
      datasets: [{ data: sanitizedData, strokeWidth: 3 }], // No dots configured in chartConfig
    };
  }, [filter, earningsData]);

  const currentTotalLabel =
    filter === "day"
      ? "Today's Income"
      : filter === "week"
        ? "Weekly Income"
        : "Monthly Income";

  // --- SUBSCRIPTION GATING ---
  const isSubscribed = user?.isSubscribed || user?.subscriptionStatus === 'active';

  if (!loading && !isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
        <View style={{ backgroundColor: COLORS.iconBg, padding: 30, borderRadius: 100, marginBottom: 24 }}>
          <MaterialCommunityIcons name="lock-percent" size={80} color={COLORS.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: COLORS.textHeading, fontSize: 24, textAlign: 'center' }]}>Unlock Analytics</Text>
        <Text style={[styles.errorSubtitle, { color: COLORS.textBody, textAlign: 'center', marginTop: 12, fontSize: 16, lineHeight: 22 }]}>
          You need an active subscription to access detailed earnings, performance metrics, and growth analytics.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('SubscriptionScreen')}
          style={[styles.retryBtn, { backgroundColor: COLORS.primary, width: '100%', marginTop: 32, height: 56, borderRadius: 16 }]}
        >
          <Text style={[styles.retryBtnText, { color: '#FFF', fontSize: 18, fontWeight: '700' }]}>View Subscription Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: COLORS.textBody, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // ---------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <TopToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        styles={styles}
        COLORS={COLORS}
      />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ScaleButton
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Feather name="arrow-left" size={24} color={COLORS.textHeading} />
        </ScaleButton>

        {/* Title / Toggle */}
        {isShopOwner ? (
          <View style={stylesLocal.toggleContainer}>
            <TouchableOpacity
              onPress={() => {
                if (viewMode !== 'personal') {
                  setViewMode('personal');
                  fetchEarningsData(filter, 1, false);
                }
              }}
              style={[stylesLocal.toggleBtn, viewMode === 'personal' && { backgroundColor: COLORS.surface, elevation: 2 }]}
            >
              <Text style={[stylesLocal.toggleText, { color: viewMode === 'personal' ? COLORS.primary : COLORS.textBody }]}>My Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (viewMode !== 'staff') {
                  setViewMode('staff');
                  // Triggered by effect when viewMode changes
                }
              }}
              style={[stylesLocal.toggleBtn, viewMode === 'staff' && { backgroundColor: COLORS.surface, elevation: 2 }]}
            >
              <Text style={[stylesLocal.toggleText, { color: viewMode === 'staff' ? COLORS.primary : COLORS.textBody }]}>Staff Income</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.headerTitle}>Financial Overview</Text>
        )}

        {viewMode === 'personal' && (
          <ScaleButton onPress={onRefresh} style={styles.iconButton}>
            <Ionicons name="sync-outline" size={22} color={COLORS.textHeading} />
          </ScaleButton>
        )}
        {viewMode === 'staff' && <View style={{ width: 40 }} />}
      </View>

      {/* GOAL WIDGET (Only in Monthly View) */}
      {filter === 'month' && !loading && (
        <GoalWidget
          currentEarnings={earningsData?.totalEarnings || 0}
          target={50000} // Default target, could be dynamic
          COLORS={COLORS}
        />
      )}

      {/* CONTENT */}
      {viewMode === 'staff' ? (
        loading ? (
          <SkeletonLoader />
        ) : (
          <StaffEarningsList data={staffEarnings} COLORS={COLORS} styles={styles} />
        )
      ) : loading && !refreshing && !earningsData ? (
        <SkeletonLoader />
      ) : !earningsData && !loading ? (
        <View style={styles.centerState}>
          <View style={styles.errorIconBox}>
            <Feather name="wifi-off" size={32} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Offline Mode</Text>
          <ScaleButton onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </ScaleButton>
        </View>
      ) : (
        <FlatList
          data={[{ type: "content" }, ...recentTransactions]}
          keyExtractor={(item, index) =>
            item.type === "content" ? "content" : item.id
          }
          renderItem={({ item, index }) => {
            if (item.type === "content") {
              return (
                <Animated.View
                  style={{
                    opacity: contentFade,
                    paddingHorizontal: 20,
                    paddingTop: 10,
                  }}
                >
                  {/* 1. HERO */}
                  <View style={styles.heroContainer}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.heroCard}
                    >
                      <View
                        style={[
                          styles.orb,
                          {
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            opacity: 0.15,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.orb,
                          {
                            bottom: -30,
                            left: -30,
                            width: 120,
                            height: 120,
                            opacity: 0.1,
                          },
                        ]}
                      />
                      <View style={styles.heroTop}>
                        <View>
                          <Text style={styles.heroLabel}>{currentTotalLabel}</Text>
                          <CountUp
                            value={earningsData?.totalEarnings || 0}
                            prefix="₹"
                            style={styles.heroAmount}
                          />
                        </View>
                        <View style={styles.glassBadge}>
                          <MaterialCommunityIcons
                            name="finance"
                            size={20}
                            color="#FFF"
                          />
                        </View>
                      </View>
                      <View style={styles.heroBottom}>
                        <View style={styles.growthContainer}>
                          {earningsData?.growth !== undefined && (
                            <View
                              style={[
                                styles.growthPill,
                                {
                                  backgroundColor:
                                    earningsData.growth >= 0
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(239, 68, 68, 0.2)",
                                },
                              ]}
                            >
                              <Feather
                                name={
                                  earningsData.growth >= 0
                                    ? "trending-up"
                                    : "trending-down"
                                }
                                size={14}
                                color={
                                  earningsData.growth >= 0 ? "#6EE7B7" : "#FCA5A5"
                                }
                              />
                              <Text
                                style={[
                                  styles.growthText,
                                  {
                                    color:
                                      earningsData.growth >= 0
                                        ? "#6EE7B7"
                                        : "#FCA5A5",
                                  },
                                ]}
                              >
                                {Math.abs(earningsData.growth)}%
                              </Text>
                            </View>
                          )}
                          <Text style={styles.heroSub}>vs previous {filter}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>

                  {/* QUICK INSIGHTS (Static/Mock for now) */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, flexDirection: 'row', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1 }}>
                      <Text style={{ fontSize: 13, color: COLORS.textBody }}>🔥 Busiest: <Text style={{ fontWeight: '700', color: COLORS.textHeading }}>6 PM</Text></Text>
                    </View>
                    <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, flexDirection: 'row', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1 }}>
                      <Text style={{ fontSize: 13, color: COLORS.textBody }}>💎 Top Svc: <Text style={{ fontWeight: '700', color: COLORS.textHeading }}>Haircut</Text></Text>
                    </View>
                    <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, flexDirection: 'row', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1 }}>
                      <Text style={{ fontSize: 13, color: COLORS.textBody }}>⚡ Avg Ticket: <Text style={{ fontWeight: '700', color: COLORS.textHeading }}>₹450</Text></Text>
                    </View>
                  </ScrollView>

                  {/* 2. TABS */}
                  <View style={styles.tabsContainer}>
                    {["day", "week", "month"].map((f) => (
                      <TouchableOpacity
                        key={f}
                        activeOpacity={0.7}
                        style={[styles.tabBtn, filter === f && styles.tabBtnActive]}
                        onPress={() => setFilter(f)}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            filter === f && styles.tabTextActive,
                          ]}
                        >
                          {f === "day" ? "Today" : f === "week" ? "Week" : "Month"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* 3. METRICS */}
                  <View style={styles.gridContainer}>
                    <ScaleButton
                      style={styles.gridItem}
                      onPress={() =>
                        navigation.navigate("CustomersServed", {
                          totalCustomers: earningsData?.totalCustomers,
                          filter,
                          customers: earningsData?.customersServedList,
                        })
                      }
                    >
                      <View style={styles.metricCard}>
                        <View
                          style={[
                            styles.metricIcon,
                            { backgroundColor: COLORS.iconBg },
                          ]}
                        >
                          <Feather name="users" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.metricValue}>
                          {earningsData ? earningsData.totalCustomers : 0}
                        </Text>
                        <Text style={styles.metricLabel}>Active Customers</Text>
                      </View>
                    </ScaleButton>
                    <View style={styles.gridItem}>
                      <View style={styles.metricCard}>
                        <View
                          style={[
                            styles.metricIcon,
                            { backgroundColor: COLORS.successBg },
                          ]}
                        >
                          <Feather name="calendar" size={20} color={COLORS.success} />
                        </View>
                        <Text style={styles.metricValue}>
                          {earningsData ? earningsData.totalBookings : 0}
                        </Text>
                        <Text style={styles.metricLabel}>Total Bookings</Text>
                      </View>
                    </View>
                  </View>

                  {/* 4. FORECAST */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>AI Projection</Text>
                      <LinearGradient
                        colors={["#6366F1", "#818CF8"]}
                        style={styles.proBadge}
                      >
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.card}>
                      <View style={styles.forecastRow}>
                        <View>
                          <Text style={styles.forecastLabel}>Next 7 Days</Text>
                          <Text style={styles.forecastValue}>
                            ₹
                            {earningsData?.forecast7Days?.toLocaleString("en-IN") ||
                              0}
                          </Text>
                        </View>
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: "45%", backgroundColor: COLORS.primary },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.forecastRow}>
                        <View>
                          <Text style={styles.forecastLabel}>Next 30 Days</Text>
                          <Text style={styles.forecastValue}>
                            ₹
                            {earningsData?.forecast30Days?.toLocaleString("en-IN") ||
                              0}
                          </Text>
                        </View>
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: "75%", backgroundColor: COLORS.secondary },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 5. CHART (NO DOTS) */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                      Growth Trends
                    </Text>
                    <View style={styles.chartWrapper}>
                      <LineChart
                        data={chartData}
                        width={screenWidth - 48}
                        height={240}
                        yAxisLabel="₹"
                        yAxisInterval={1}
                        fromZero={true}
                        segments={4}
                        withDots={false} // DOTS REMOVED HERE
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                        chartConfig={STATIC_CHART_CONFIG}
                        bezier
                        style={styles.chart}
                      />
                    </View>
                  </View>

                  {/* 6. RECENT TRANSACTIONS (Fixed Height with Internal Scroll) */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Transactions</Text>
                      <TouchableOpacity
                        onPress={() => {
                          /* Navigate */
                        }}
                      >
                        <Text style={styles.seeAllText}>See All</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Fixed Height Container with Internal Scroll */}
                    <View style={styles.fixedTransactionsContainer}>
                      {recentTransactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>No recent transactions</Text>
                        </View>
                      ) : (
                        <FlatList
                          data={recentTransactions}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => <TransactionItem transaction={item} />}
                          scrollEnabled={false} // Let main page handle scrolling
                          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
                        />
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            }
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={{ height: 24 }} />
            )
          }
          ListEmptyComponent={
            recentTransactions.length === 0 ? (
              <View style={[styles.emptyContainer, { paddingHorizontal: 20 }]}>
                <Text style={styles.emptyText}>No recent transactions</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

// --- STYLES ---
const stylesLocal = StyleSheet.create({
  transItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
  },

  transLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  transIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  transTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  transDate: { fontSize: 12, fontWeight: "500" },
  transRight: { alignItems: "flex-end" },
  transAmount: { fontSize: 16, fontWeight: "700" },
  transStatusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },

  // NEW STYLES FOR STAFF
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toggleText: {
    fontWeight: '600',
    fontSize: 13,
  },
  staffCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  staffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  staffInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  staffName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  staffRole: { fontSize: 12 },
  staffTotal: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  staffDetails: { marginTop: 0 },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  detailLabel: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  staffDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  staffDateText: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  staffServicesText: { fontSize: 12 },
  staffDateAmount: { fontSize: 14, fontWeight: "700" },
});

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: COLORS.bg,
      zIndex: 10,
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textHeading },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 2,
    },

    centerState: {
      marginTop: 100,
      alignItems: "center",
      paddingHorizontal: 40,
    },
    errorIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: COLORS.errorBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: COLORS.textHeading,
      marginBottom: 8,
    },
    errorSub: {
      fontSize: 14,
      color: COLORS.textBody,
      textAlign: "center",
      marginBottom: 24,
    },
    retryBtn: {
      backgroundColor: COLORS.textHeading,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 16,
    },
    retryBtnText: { color: COLORS.bg, fontWeight: "700", fontSize: 14 },

    heroContainer: {
      marginBottom: 24,
      borderRadius: 28,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    heroCard: {
      borderRadius: 28,
      padding: 24,
      overflow: "hidden",
      minHeight: 180,
    },
    orb: { position: "absolute", borderRadius: 999, backgroundColor: "#FFF" },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 32,
    },
    heroLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    heroAmount: {
      fontSize: 36,
      fontWeight: "800",
      color: "#FFF",
      letterSpacing: -0.5,
    },
    glassBadge: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroBottom: { flexDirection: "row", alignItems: "flex-end" },
    growthContainer: { flexDirection: "row", alignItems: "center" },
    growthPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 10,
    },
    growthText: { fontSize: 13, fontWeight: "700", marginLeft: 4 },
    heroSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.6)",
      fontWeight: "500",
    },

    tabsContainer: {
      flexDirection: "row",
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      padding: 6,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
    },
    tabBtnActive: {
      backgroundColor: COLORS.textHeading,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textBody },
    tabTextActive: { color: COLORS.bg, fontWeight: "700" },

    gridContainer: { flexDirection: "row", gap: 16, marginBottom: 24 },
    gridItem: { flex: 1 },
    metricCard: {
      backgroundColor: COLORS.surface,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 8,
      elevation: 1,
    },
    metricIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: "800",
      color: COLORS.textHeading,
      marginBottom: 2,
    },
    metricLabel: { fontSize: 13, color: COLORS.textBody, fontWeight: "500" },

    section: { marginBottom: 24 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: COLORS.textHeading,
      letterSpacing: -0.5,
    },
    seeAllText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
    proBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    proBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFF" },

    card: {
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    forecastRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 0,
    },
    forecastLabel: {
      fontSize: 13,
      color: COLORS.textBody,
      fontWeight: "600",
      marginBottom: 4,
    },
    forecastValue: {
      fontSize: 18,
      color: COLORS.textHeading,
      fontWeight: "800",
    },
    progressContainer: {
      width: 100,
      height: 8,
      backgroundColor: COLORS.bg,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBar: { height: "100%", borderRadius: 4 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },

    chartWrapper: {
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
    },
    chart: { borderRadius: 16, paddingRight: 0 },

    // Fixed Height Transactions Container
    // Flexible Height Transactions Container
    fixedTransactionsContainer: {
      minHeight: 200, // Minimum height to show empty state nicely
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    emptyContainer: { alignItems: "center", paddingVertical: 32 },
    emptyText: { marginTop: 12, color: COLORS.textBody, fontSize: 14 },

    toastWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      alignItems: "center",
    },
    toastContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
    toastSuccess: { borderLeftWidth: 4, borderLeftColor: "#10B981" },
    toastError: { borderLeftWidth: 4, borderLeftColor: "#EF4444" },
    toastIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    toastText: { fontSize: 14, fontWeight: "600" },
  });

export default EarningsScreen;
