import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Trophy,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  X,
  WifiOff, // Icon for network errors
} from "lucide-react-native";
import { format, isToday, isYesterday } from "date-fns";
import api from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// ====================================================================
// OPTIMIZED COMPONENT: Startup-Style Custom Toast
// ====================================================================
const CustomToast = ({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Modern Spring Animation (Blinkit/Zomato style bounce)
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 40, // Exact marginTop request
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto Hide
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
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible && onHide) onHide();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const isSuccess = type === "success";
  const bgColor = theme.mode === "dark" ? "#1f2937" : "#ffffff";
  const accentColor = isSuccess ? "#16A34A" : "#DC2626";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColor,
          shadowColor: "#000",
        },
      ]}
    >
      <View style={[styles.toastStrip, { backgroundColor: accentColor }]} />

      <View style={styles.toastIconBox}>
        {isSuccess ? (
          <CheckCircle
            size={22}
            color={accentColor}
            fill={theme.mode === "dark" ? "transparent" : "#dcfce7"}
          />
        ) : (
          <AlertTriangle
            size={22}
            color={accentColor}
            fill={theme.mode === "dark" ? "transparent" : "#fee2e2"}
          />
        )}
      </View>

      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color: theme.colors.text }]}>
          {isSuccess ? "Success" : "Wait a moment"}
        </Text>
        <Text
          style={[styles.toastMessage, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleHide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ====================================================================
// OPTIMIZED COMPONENT: Memoized Transaction Item (Prevents Lag)
// ====================================================================
const TransactionItem = React.memo(({ item, theme, isLastItem }) => {
  const isRecharge = item.type === "recharge";
  const formattedTime = useMemo(
    () => format(new Date(item.date), "hh:mm a"),
    [item.date]
  );

  return (
    <View
      style={[
        styles.transactionRow,
        {
          backgroundColor: theme.colors.card,
          borderBottomWidth: isLastItem ? 0 : 1,
          borderBottomColor: theme.colors.border + "40",
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isRecharge
              ? "rgba(22, 163, 74, 0.1)"
              : "rgba(220, 38, 38, 0.1)",
          },
        ]}
      >
        {isRecharge ? (
          <TrendingUp size={20} color="#16A34A" />
        ) : (
          <TrendingDown size={20} color="#DC2626" />
        )}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
            {item.description ||
              (isRecharge ? "Recharged Coins" : "Spent Coins")}
          </Text>
          <Text
            style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}
          >
            {isRecharge ? "Wallet Recharge" : "Order Payment"} • {formattedTime}
          </Text>
        </View>

        <Text
          style={[
            styles.amountText,
            { color: isRecharge ? "#16A34A" : "#DC2626" },
          ]}
        >
          {isRecharge ? "+" : "-"}
          {item.amount}
        </Text>
      </View>
    </View>
  );
});

// ====================================================================
// OPTIMIZED COMPONENT: Memoized Section Header
// ====================================================================
const SectionHeader = React.memo(({ title, theme }) => (
  <View
    style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}
  >
    <View style={styles.sectionHeaderContent}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  </View>
));

// ====================================================================
// MAIN SCREEN
// ====================================================================
const SetkarCoinHistoryScreen = () => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();

  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  // Alert State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Constants
  const loyaltyLevels = useMemo(
    () => [
      {
        name: "Bronze",
        minCoins: 0,
        maxCoins: 99,
        color: "#CD7F32",
        nextLevel: "Silver",
      },
      {
        name: "Silver",
        minCoins: 100,
        maxCoins: 499,
        color: "#C0C0C0",
        nextLevel: "Gold",
      },
      {
        name: "Gold",
        minCoins: 500,
        maxCoins: 999,
        color: "#FFD700",
        nextLevel: "Platinum",
      },
      {
        name: "Platinum",
        minCoins: 1000,
        maxCoins: 2499,
        color: "#E5E4E2",
        nextLevel: "Diamond",
      },
      {
        name: "Diamond",
        minCoins: 2500,
        maxCoins: Infinity,
        color: "#B9F2FF",
        nextLevel: null,
      },
    ],
    []
  );

  // Show Toast Helper
  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  // Fetch Logic
  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      try {
        if (!token) throw new Error("No auth token");

        const response = await api.get(
          `/api/user/setkar-coin-transactions`,
          { timeout: 10000 } // Added timeout
        );

        if (response.data?.success) {
          setTransactions(response.data.transactions || []);
          if (isRefresh) showToast("History updated", "success");
        } else {
          // Safe fallback if server returns success:false but no crash
          setTransactions([]);
          showToast("Could not load history", "error");
        }
      } catch (err) {
        console.error("Transaction Fetch Error:", err);
        // Determine error type for better UX
        if (!err.response && err.request) {
          showToast("Network unavailable. Check connection.", "error");
        } else {
          showToast("Server error. Please try again later.", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, showToast]
  );

  // Initial Load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(true);
  }, [fetchTransactions]);

  // --- Calculations ---

  const currentBalance = useMemo(() => {
    if (!transactions.length) return 0;
    return transactions.reduce((acc, curr) => {
      // Ensure amount is treated as a number
      const amt = Number(curr.amount) || 0;
      return curr.type === "recharge" ? acc + amt : acc - amt;
    }, 0);
  }, [transactions]);

  const loyaltyInfo = useMemo(() => {
    const balance = Math.max(0, currentBalance);
    let currentLevel = loyaltyLevels[0];
    let nextLevel = null;
    let progress = 0;

    for (let i = 0; i < loyaltyLevels.length; i++) {
      if (
        balance >= loyaltyLevels[i].minCoins &&
        balance <= loyaltyLevels[i].maxCoins
      ) {
        currentLevel = loyaltyLevels[i];
        nextLevel = loyaltyLevels[i + 1] || null;
        break;
      }
    }

    if (nextLevel) {
      const levelRange = nextLevel.minCoins - currentLevel.minCoins;
      const coinsInLevel = balance - currentLevel.minCoins;
      progress = (coinsInLevel / levelRange) * 100;
    } else {
      progress = 100;
    }

    return {
      currentLevel,
      nextLevel,
      progress: Math.min(progress, 100),
      balance,
    };
  }, [currentBalance, loyaltyLevels]);

  // Animate Progress Bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loyaltyInfo.progress,
      duration: 1200,
      useNativeDriver: false, // Width cannot use native driver
      easing: Easing.out(Easing.exp),
    }).start();
  }, [loyaltyInfo.progress, progressAnim]);

  // Filter Data
  const filteredSections = useMemo(() => {
    let filtered = transactions;
    if (activeTab === "Earned")
      filtered = transactions.filter((t) => t.type === "recharge");
    else if (activeTab === "Spent")
      filtered = transactions.filter((t) => t.type !== "recharge");
    else if (activeTab === "Cashback")
      filtered = transactions.filter(
        (t) =>
          t.description?.toLowerCase().includes("cashback") ||
          t.description?.toLowerCase().includes("reward")
      );

    const groups = filtered.reduce((groups, transaction) => {
      const date = transaction.date.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
      return groups;
    }, {});

    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => {
        const dateObj = new Date(date);
        let title = format(dateObj, "MMMM dd, yyyy");
        if (isToday(dateObj)) title = "Today, " + format(dateObj, "dd MMM");
        else if (isYesterday(dateObj))
          title = "Yesterday, " + format(dateObj, "dd MMM");
        return { title, data: groups[date] };
      });
  }, [transactions, activeTab]);

  // --- Render Helpers (Optimized with useCallback) ---

  const renderSectionHeader = useCallback(
    ({ section: { title } }) => <SectionHeader title={title} theme={theme} />,
    [theme]
  );

  const renderItem = useCallback(
    ({ item, index, section }) => (
      <TransactionItem
        item={item}
        theme={theme}
        isLastItem={index === section.data.length - 1}
      />
    ),
    [theme]
  );

  const renderHeader = useMemo(
    () => (
      <View style={styles.listHeaderContainer}>
        <LinearGradient
          colors={["#4ade80", "#16a34a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
          </View>

          <View style={styles.balanceRow}>
            <Trophy
              size={28}
              color="#FFD700"
              style={{ marginRight: 10 }}
              fill="#FFD700"
            />
            <Text style={styles.balanceText}>
              {Math.max(0, currentBalance)} GlossCut Coins
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: loyaltyInfo.currentLevel.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {loyaltyInfo.currentLevel.name} Level:{" "}
              {loyaltyInfo.nextLevel
                ? `${Math.round(loyaltyInfo.progress)}% to ${loyaltyInfo.nextLevel.name
                }`
                : "Max Level Achieved!"}
            </Text>
          </View>
        </LinearGradient>

        <View
          style={[styles.tabContainer, { backgroundColor: theme.colors.card }]}
        >
          {["All", "Earned", "Spent", "Cashback"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && { backgroundColor: "#16A34A" },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? "#fff" : theme.colors.textSecondary,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [activeTab, theme, currentBalance, loyaltyInfo, progressAnim]
  );

  // --- Main Render ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* ALERT COMPONENT (Floating Top) */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        theme={theme}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Coin History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10} // Optimization: Render fewer items initially
          maxToRenderPerBatch={10} // Optimization: Batch rendering
          windowSize={5} // Optimization: Keep less items in memory
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16A34A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <ShoppingBag size={48} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No transactions yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Start using the app to earn coins!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- ALERT / TOAST STYLES (Zomato/Blinkit Style) ---
  toastContainer: {
    position: "absolute",
    top: 0, // Animated to 40 via logic
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    // Premium Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastStrip: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  toastIconBox: {
    marginRight: 10,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.9,
  },

  // --- STANDARD STYLES ---
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  listHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 4,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    marginRight: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    opacity: 0.5,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default SetkarCoinHistoryScreen;
