import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  StatusBar,
  RefreshControl} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ArrowLeft,
  Coins,
  Gift,
  CheckCircle,
  TrendingUp,
  Zap,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  XCircle,
  AlertTriangle} from "lucide-react-native";
import api from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// ==========================================
// 1. OPTIMIZED MODERN ALERT (Memoized)
// ==========================================
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 40,
          friction: 6, // Slightly increased friction for smoother settle
          tension: 40,
          useNativeDriver: true}),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true}),
      ]).start();

      const timer = setTimeout(() => {
        handleHide();
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      // Immediate reset if not visible to prevent ghosting
      if (opacity._value !== 0) handleHide();
    }
  }, [visible]);

  const handleHide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true}),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true}),
    ]).start(() => {
      if (visible && onHide) onHide();
    });
  }, [visible, onHide, opacity, translateY]);

  const getAlertStyle = useMemo(() => {
    switch (type) {
      case "error":
        return {
          bg: "#FEF2F2",
          border: "#FECACA",
          icon: <XCircle color="#EF4444" size={24} fill="#FEE2E2" />};
      case "warning":
        return {
          bg: "#FFFBEB",
          border: "#FDE68A",
          icon: <AlertTriangle color="#F59E0B" size={24} fill="#FEF3C7" />};
      case "success":
      default:
        return {
          bg: "#F0FDF4",
          border: "#BBF7D0",
          icon: <CheckCircle color="#10B981" size={24} fill="#DCFCE7" />};
    }
  }, [type]);

  if (!visible && opacity._value === 0) return null;

  return (
    <Animated.View
      style={[styles.alertWrapper, { transform: [{ translateY }], opacity }]}
    >
      <View
        style={[
          styles.alertBox,
          {
            backgroundColor: getAlertStyle.bg,
            borderColor: getAlertStyle.border},
        ]}
      >
        <View style={styles.alertIcon}>{getAlertStyle.icon}</View>
        <View style={styles.alertTextContent}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ==========================================
// 2. ISOLATED BLACK CARD (Heavy Animation)
// ==========================================
// Strict Memoization: Only re-renders if coin balance changes.
// Ignoring navigation prop in comparison to prevent unnecessary re-renders during nav events.
const BlackCard = React.memo(
  ({ setkarCoins, onHistoryPress }) => {
    const cardFadeAnim = useRef(new Animated.Value(0)).current;
    const cardSlideAnim = useRef(new Animated.Value(50)).current;
    const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Entrance
      Animated.sequence([
        Animated.parallel([
          Animated.timing(cardFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true}),
          Animated.spring(cardSlideAnim, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true}),
          Animated.spring(cardScaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true}),
        ]),
      ]).start();

      // Loops - Started after entrance to save initial frames
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true}),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true}),
        ])
      );

      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true}),
          Animated.delay(1500),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true}),
        ])
      );

      const timer = setTimeout(() => {
        floatAnimation.start();
        shimmerAnimation.start();
      }, 500);

      return () => {
        clearTimeout(timer);
        floatAnimation.stop();
        shimmerAnimation.stop();
      };
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-800, 800]});

    // Formatting coins
    const formattedCoins = useMemo(
      () => setkarCoins.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      [setkarCoins]
    );

    return (
      <Animated.View
        style={[
          styles.balanceCardWrapper,
          {
            opacity: cardFadeAnim,
            transform: [
              { translateY: cardSlideAnim },
              { scale: cardScaleAnim },
              { translateY: floatAnim },
            ]},
        ]}
      >
        <View style={styles.balanceCard}>
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [
                  { translateX: shimmerTranslate },
                  { rotate: "35deg" },
                ]},
            ]}
          >
            <LinearGradient
              colors={[
                "transparent",
                "rgba(255,255,255,0.02)",
                "rgba(255,255,255,0.15)",
                "rgba(255,255,255,0.02)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
          <View style={styles.cardBackgroundShine} />
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>GlossCut BLACK</Text>
            <Zap size={20} color="#71717a" fill="#71717a" />
          </View>
          <View>
            <View style={styles.cardChip}>
              <View style={[styles.chipLine, styles.chipV1]} />
              <View style={[styles.chipLine, styles.chipV2]} />
              <View style={[styles.chipLine, styles.chipH1]} />
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardBalanceLabel}>Available Balance</Text>
              <Text style={styles.cardBalanceText}>₹ {formattedCoins}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardFooterCol}>
              <Text style={styles.cardFooterLabel}>VALID THRU</Text>
              <Text style={styles.cardFooterValue}>12/30</Text>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={onHistoryPress}
            >
              <Text
                style={[
                  styles.cardFooterLabel,
                  { marginBottom: 0, color: "#fff", marginRight: 4 },
                ]}
              >
                HISTORY
              </Text>
              <ChevronRight size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  },
  (prev, next) => prev.setkarCoins === next.setkarCoins
);

// ==========================================
// 3. ISOLATED GRID MENU
// ==========================================
const GridMenu = React.memo(
  ({ onDealPress, onCheckoutPress, onCashbackPress }) => {
    return (
      <View style={styles.gridContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.gridItem, styles.shadowBlue]}
          onPress={onDealPress}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F0F9FF"]}
            style={[styles.gridGradient, { borderColor: "#E0F2FE" }]}
          >
            <View style={styles.gridHeader}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#E0F2FE" }]}
              >
                <Gift size={22} color="#0284C7" />
              </View>
              <ArrowUpRight size={18} color="#94A3B8" />
            </View>
            <Text style={styles.gridText}>Exclusive{"\n"}Deals</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.gridItem, styles.shadowGreen]}
          onPress={onCheckoutPress}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F0FDF4"]}
            style={[styles.gridGradient, { borderColor: "#DCFCE7" }]}
          >
            <View style={styles.gridHeader}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#DCFCE7" }]}
              >
                <Zap size={22} color="#16A34A" />
              </View>
              <ArrowUpRight size={18} color="#94A3B8" />
            </View>
            <Text style={styles.gridText}>Instant{"\n"}Checkout</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.gridItem, styles.shadowOrange]}
          onPress={onCashbackPress}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFF7ED"]}
            style={[styles.gridGradient, { borderColor: "#FFEDD5" }]}
          >
            <View style={styles.gridHeader}>
              <View
                style={[styles.gridIconBox, { backgroundColor: "#FFEDD5" }]}
              >
                <Coins size={22} color="#EA580C" />
              </View>
              <ArrowUpRight size={18} color="#94A3B8" />
            </View>
            <Text style={styles.gridText}>Instant{"\n"}Cashback</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }
);

// ==========================================
// 4. ISOLATED RECHARGE SECTION (Performance Key)
// ==========================================
// This component holds the input state. Typing here DOES NOT re-render the BlackCard/Parent.
const RechargeSection = React.memo(({ onRechargeRequest, themeColor }) => {
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Memoized amounts array
  const amounts = useMemo(() => [10, 25, 100, 500], []);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    // We await the parent's function.
    // If parent function returns true/false or promise, we stop loading.
    await onRechargeRequest(rechargeAmount, () => setRechargeAmount(""));
    setLoading(false);
  };

  return (
    <View style={styles.whiteCard}>
      <Text style={styles.inputLabel}>ENTER AMOUNT</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.bigInput}
          placeholder="0"
          placeholderTextColor="#E2E8F0"
          keyboardType="numeric"
          value={rechargeAmount}
          onChangeText={(text) => {
            const validText = text.replace(/[^0-9.]/g, "");
            setRechargeAmount(validText);
          }}
          maxLength={6}
          cursorColor={themeColor}
          // Important for Android performance
          importantForAutofill="no"
        />
      </View>

      <View style={styles.chipsContainer}>
        {amounts.map((amount) => (
          <View key={amount} style={styles.quickChipWrapper}>
            {amount === 100 && (
              <View style={styles.mostPopularBadge}>
                <View style={styles.badgeInner}>
                  <Text style={styles.mostPopularText}>BEST</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.chip,
                rechargeAmount === String(amount) && styles.chipActive,
              ]}
              onPress={() => setRechargeAmount(String(amount))}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  rechargeAmount === String(amount) && styles.chipTextActive,
                ]}
              >
                ₹{amount}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, loading && { opacity: 0.8 }]}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[themeColor, "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>Recharge</Text>
              <ArrowRight
                size={20}
                color="#fff"
                style={{ marginLeft: 8, opacity: 0.9 }}
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

// ==========================================
// 5. MAIN SCREEN CONTAINER
// ==========================================
const SetkarCoinsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, token, fetchUser } = useAuth();
  const [setkarCoins, setSetkarCoins] = useState(user?.setkarCoins || 0);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"});

  useEffect(() => {
    if (user) setSetkarCoins(user.setkarCoins);
  }, [user]);

  // Memoized Alert Triggers
  const triggerAlert = useCallback((title, message, type = "success") => {
    setAlertConfig({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Memoized Navigation Handlers
  const handleNavBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleHistoryNav = useCallback(
    () => navigation.navigate("SetkarCoinHistoryScreen"),
    [navigation]
  );
  const handleDealsNav = useCallback(
    () => navigation.navigate("ExclusiveDealsScreen"),
    [navigation]
  );

  // Logic Handler - Passed down to RechargeSection
  // Returns a Promise so the child knows when to stop loading
  const processRecharge = useCallback(
    async (amountStr, onSuccessClear) => {
      Keyboard.dismiss();

      if (!amountStr || amountStr.trim() === "") {
        triggerAlert(
          "Empty Input",
          "Please enter an amount to recharge.",
          "warning"
        );
        return;
      }

      const amount = parseFloat(amountStr);

      if (isNaN(amount)) {
        triggerAlert("Invalid Input", "Please enter a valid number.", "error");
        return;
      }
      if (amount <= 0) {
        triggerAlert(
          "Invalid Amount",
          "Amount must be greater than zero.",
          "warning"
        );
        return;
      }
      if (amount > 100000) {
        triggerAlert(
          "Limit Exceeded",
          "You can only recharge up to ₹1,00,000 at once.",
          "warning"
        );
        return;
      }

      try {
        const response = await api.post(
          `/api/user/recharge-setkar-coins`,
          { coins: amount },
          { timeout: 10000 }
        );

        if (response.data.success) {
          const bonusCoins = response.data.bonusCoins || 0;
          let msg = `₹${amount.toFixed(2)} added to your wallet.`;
          if (bonusCoins > 0)
            msg = `Success! Added ₹${amount} + ${bonusCoins} bonus!`;

          triggerAlert("Recharge Successful!", msg, "success");
          if (onSuccessClear) onSuccessClear(); // Clear input in child
          await fetchUser();
        } else {
          triggerAlert(
            "Transaction Failed",
            response.data.message || "Could not complete recharge.",
            "error"
          );
        }
      } catch (error) {
        console.log("Recharge Error:", error);
        if (error.message === "Network Error" || !error.response) {
          triggerAlert(
            "No Internet",
            "Please check your internet connection.",
            "error"
          );
        } else if (error.code === "ECONNABORTED") {
          triggerAlert(
            "Timeout",
            "Server took too long to respond.",
            "warning"
          );
        } else if (error.response && error.response.status >= 500) {
          triggerAlert(
            "Server Issue",
            "Our servers are having a hiccup. Try later.",
            "error"
          );
        } else {
          triggerAlert(
            "Error",
            "Something went wrong. Please try again.",
            "error"
          );
        }
      }
    },
    [token, fetchUser, triggerAlert]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNavBack} style={styles.backBtnArea}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Performance Boost
        keyboardShouldPersistTaps="handled" // Better touch handling
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              await fetchUser();
              triggerAlert("Refreshed", "Coin balance updated!", "success");
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Animated Components - Will NOT re-render on typing now */}
        <BlackCard
          setkarCoins={setkarCoins}
          onHistoryPress={handleHistoryNav}
        />

        <GridMenu
          onDealPress={handleDealsNav}
          onCheckoutPress={handleHistoryNav}
          onCashbackPress={handleHistoryNav}
        />

        {/* Isolated Input Section */}
        <Text style={styles.sectionTitle}>Top Up Wallet</Text>
        <RechargeSection
          onRechargeRequest={processRecharge}
          themeColor={theme.colors.primary}
        />

        {/* Static Benefits */}
        <View style={{ paddingHorizontal: 4 }}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: "#ECFDF5" }]}>
              <CheckCircle size={22} color="#10B981" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>100% Secure</Text>
              <Text style={styles.infoValue}>
                Bank grade security on all payments
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: "#EEF2FF" }]}>
              <TrendingUp size={22} color="#6366F1" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>No Expiry</Text>
              <Text style={styles.infoValue}>
                Your coins stick with you forever
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Alert Component */}
      <ModernAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },

  // Alert
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
    paddingHorizontal: 16},
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
    maxWidth: 400},
  alertIcon: { marginRight: 12 },
  alertTextContent: { flex: 1 },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2},
  alertMessage: { fontSize: 12, color: "#4B5563", fontWeight: "500" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 10,
    backgroundColor: "#F8F9FD",
    zIndex: 1},
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  headerPlaceholder: { width: 40 },
  backBtnArea: { padding: 8, marginLeft: -8 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 50 },

  // Black Card
  balanceCardWrapper: { marginBottom: 30, marginTop: 10 },
  balanceCard: {
    borderRadius: 24,
    height: 220,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    position: "relative"},
  shimmerOverlay: {
    position: "absolute",
    top: -200,
    bottom: -200,
    left: "50%",
    marginLeft: -75,
    width: 150,
    zIndex: 5},
  cardBackgroundShine: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: "#ffffff",
    opacity: 0.03,
    borderRadius: 150},
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10},
  cardLabel: {
    color: "#E5E4E2",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.9},
  cardChip: {
    width: 45,
    height: 34,
    backgroundColor: "#EAB308",
    borderRadius: 6,
    marginTop: 20,
    position: "relative",
    borderWidth: 1,
    borderColor: "#CA8A04",
    overflow: "hidden"},
  chipLine: { position: "absolute", backgroundColor: "#CA8A04", opacity: 0.5 },
  chipV1: { top: 0, bottom: 0, left: 14, width: 1 },
  chipV2: { top: 0, bottom: 0, right: 14, width: 1 },
  chipH1: { top: 16, left: 0, right: 0, height: 1 },
  cardMiddle: { justifyContent: "center", marginTop: 10, zIndex: 10 },
  cardBalanceLabel: {
    color: "#A1A1AA",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6},
  cardBalanceText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "600",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"]},
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 10},
  cardFooterCol: { flexDirection: "column" },
  cardFooterLabel: {
    color: "#A1A1AA",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4},
  cardFooterValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20},

  // Grid
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
    marginLeft: 4},
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
    paddingHorizontal: 2},
  gridItem: { width: "31%", height: 125, borderRadius: 26 },
  shadowBlue: {
  },
  shadowGreen: {
  },
  shadowOrange: {
  },
  gridGradient: {
    flex: 1,
    borderRadius: 26,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    position: "relative",
    overflow: "hidden"},
  gridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"},
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"},
  gridText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 17,
    letterSpacing: -0.4},

  // Input
  whiteCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    paddingBottom: 30,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9"},
  inputLabel: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    marginBottom: 10},
  inputContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 32,
    marginTop: 4},
  currencySymbol: {
    fontSize: 32,
    fontWeight: "600",
    color: "#CBD5E1",
    marginRight: 6,
    marginTop: 8},
  bigInput: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1E293B",
    minWidth: 80,
    textAlign: "center",
    borderBottomWidth: 0},

  // Chips
  chipsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32},
  quickChipWrapper: { width: "23%", position: "relative" },
  mostPopularBadge: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10},
  badgeInner: {
    backgroundColor: "#F59E0B",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100},
  mostPopularText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5},
  chip: {
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"},
  chipActive: {
    backgroundColor: "#1E293B",
    borderColor: "#1E293B",
    transform: [{ scale: 1.05 }],
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8},
  chipText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  // Button
  actionButton: {
    borderRadius: 22},
  gradientBtn: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 22},
  actionButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5},

  // Info
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16},
  infoTextContainer: { flex: 1 },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2},
  infoValue: { fontSize: 13, color: "#666" }});

export default SetkarCoinsScreen;
