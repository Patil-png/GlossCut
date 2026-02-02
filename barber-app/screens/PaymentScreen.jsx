import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
  Dimensions,
  Vibration,
  Easing,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../utils/api";
import * as Haptics from "expo-haptics";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");
const COLORS = {
  primary: "#6366f1",
  secondary: "#f43f5e",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  swipeTrack: "#E0E7FF",
  swipeText: "#6366f1",
  white: "#FFFFFF",
};

// --- COMPONENT: TOP-DOWN TOAST ---
const Toast = memo(({ visible, message, type, translateY }) => {
  if (!visible) return null;
  const getStyle = () => {
    switch (type) {
      case "success":
        return {
          bg: "#F0FDF4",
          border: "#22C55E",
          text: "#166534",
          icon: "checkmark-circle",
        };
      case "error":
        return {
          bg: "#FEF2F2",
          border: "#EF4444",
          text: "#991B1B",
          icon: "alert-circle",
        };
      default:
        return {
          bg: "#EFF6FF",
          border: "#3B82F6",
          text: "#1E40AF",
          icon: "information-circle",
        };
    }
  };
  const config = getStyle();
  return (
    <Animated.View
      style={[styles.toastWrapper, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.toastContent,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <Ionicons name={config.icon} size={22} color={config.border} />
        <Text style={[styles.toastText, { color: config.text }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
});

// --- COMPONENT: SWIPE BUTTON ---
const SwipeButton = memo(
  ({ onSwipeSuccess, label, amount, isLoading, isSuccess, resetTrigger }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [swiped, setSwiped] = useState(false);
    const BUTTON_WIDTH = width - 40;
    const THUMB_SIZE = 52;
    const END_POSITION = BUTTON_WIDTH - THUMB_SIZE - 12;

    useEffect(() => {
      if (resetTrigger > 0 && swiped && !isSuccess) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        setSwiped(false);
      }
    }, [resetTrigger]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gs) => {
          if (!swiped && !isLoading && !isSuccess) {
            translateX.setValue(Math.max(0, Math.min(END_POSITION, gs.dx)));
          }
        },
        onPanResponderRelease: (_, gs) => {
          if (swiped || isLoading || isSuccess) return;
          if (gs.dx > END_POSITION * 0.8) {
            setSwiped(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } catch (e) { }
            Animated.timing(translateX, {
              toValue: END_POSITION,
              duration: 150,
              useNativeDriver: true,
            }).start(onSwipeSuccess);
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 12,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View style={styles.swipeTrack}>
        <Animated.View
          style={[
            styles.swipeTextContainer,
            {
              opacity: translateX.interpolate({
                inputRange: [0, END_POSITION / 2],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <Text style={styles.swipeLabel}>
            {label} • ₹{amount}
          </Text>
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.swipeThumb,
            { transform: [{ translateX }] },
            (swiped || isSuccess) && { backgroundColor: COLORS.success },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : isSuccess ? (
            <Ionicons name="checkmark" size={28} color="#fff" />
          ) : (
            <Ionicons name="chevron-forward" size={28} color={COLORS.primary} />
          )}
        </Animated.View>
      </View>
    );
  }
);

// --- MAIN SCREEN ---
const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tier, adPlacementId, amount } = route.params || {};
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [resetBtn, setResetBtn] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback((message, type = "info") => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, {
      toValue: 50,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast((p) => ({ ...p, visible: false })));
    }, 3000);
  }, []);

  const handlePayment = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (adPlacementId) {
        res = await api.put(
          `/api/ads/${adPlacementId}`,
          { status: "active", isBooked: true }
        );
      } else {
        res = await api.post(
          '/api/shop/listing-place',
          { tier: tier.id, price: tier.price, duration: "30 days" }
        );
      }
      setPaymentCompleted(true);
      showToast("Activated Successfully!", "success");
      setTimeout(
        () =>
          tier
            ? navigation.navigate("BarberProfileViewScreen", {
              barberId: user.id,
            })
            : navigation.navigate("Profile"),
        2000
      );
    } catch (err) {
      setLoading(false);
      setResetBtn((p) => p + 1);
      showToast(err.response?.data?.msg || "Transaction Failed", "error");
    }
  }, [tier, adPlacementId, user]);

  const details = useMemo(() => {
    if (adPlacementId)
      return {
        title: "Home Banner",
        sub: "Priority Ad Slot",
        price: parseFloat(amount),
        icon: "trending-up",
      };
    return {
      title: tier?.name || "Premium",
      sub: "Top Search Listing",
      price: parseFloat(tier?.price || 0),
      icon: "award",
    };
  }, [tier, adPlacementId, amount]);

  return (
    <View style={styles.main}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        translateY={toastAnim}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade Shop</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. IMPACT PROJECTION CARD (New Section) */}
          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.impactTitle}>Estimated Growth</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Reach</Text>
                <Text style={styles.statValue}>+240%</Text>
                <View
                  style={[
                    styles.miniBar,
                    { width: "80%", backgroundColor: COLORS.success },
                  ]}
                />
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bookings</Text>
                <Text style={styles.statValue}>3.5x</Text>
                <View
                  style={[
                    styles.miniBar,
                    { width: "60%", backgroundColor: COLORS.primary },
                  ]}
                />
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Revenue</Text>
                <Text style={styles.statValue}>₹₹₹</Text>
                <View
                  style={[
                    styles.miniBar,
                    { width: "90%", backgroundColor: "#F59E0B" },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.impactFooter}>
              *Based on shops with similar Premium listings in your area.
            </Text>
          </View>

          {/* 2. RECEIPT CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name={details.icon} size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.itemName}>{details.title}</Text>
                <Text style={styles.itemSub}>{details.sub}</Text>
              </View>
            </View>
            <View style={styles.dashedLine} />
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Amount to Pay</Text>
              <Text style={styles.billValue}>₹{details.price.toFixed(2)}</Text>
            </View>
          </View>

          {/* 3. BENEFITS LIST */}
          <Text style={styles.sectionHeader}>Why Go {details.title}?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Instant Visibility</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.benefitText}>Verified Badge</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="people-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.benefitText}>More Customers</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="star-outline" size={20} color={COLORS.primary} />
              <Text style={styles.benefitText}>Priority Support</Text>
            </View>
          </View>

          <View style={styles.paymentMethod}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={20}
              color={COLORS.success}
            />
            <Text style={styles.methodText}>
              Secure payment powered by encrypted gateway
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomDock}>
          <SwipeButton
            onSwipeSuccess={handlePayment}
            label="Slide to Confirm"
            amount={details.price.toFixed(0)}
            isLoading={loading}
            isSuccess={paymentCompleted}
            resetTrigger={resetBtn}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: COLORS.background },
  safe: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  scroll: { padding: 20 },

  // Impact Card Styles
  impactCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  impactTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { color: "#94A3B8", fontSize: 11, marginBottom: 4 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  miniBar: { height: 3, borderRadius: 2, marginTop: 6 },
  verticalDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#334155",
    alignSelf: "center",
  },
  impactFooter: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 15,
    textAlign: "center",
    fontStyle: "italic",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 25,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 50,
    height: 50,
    backgroundColor: "#f0f2ff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemName: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  itemSub: { fontSize: 13, color: COLORS.textSecondary },
  dashedLine: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 20,
    borderRadius: 1,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billLabel: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  billValue: { fontSize: 26, fontWeight: "900", color: COLORS.primary },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 15,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  benefitItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  benefitText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },

  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  methodText: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 8 },
  bottomDock: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 35 : 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 20,
  },
  swipeTrack: {
    height: 64,
    backgroundColor: COLORS.swipeTrack,
    borderRadius: 32,
    padding: 6,
    justifyContent: "center",
  },
  swipeTextContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  swipeLabel: { fontSize: 16, fontWeight: "800", color: COLORS.swipeText },
  swipeThumb: {
    width: 52,
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  toastWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    alignItems: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 50,
    borderWidth: 1,
    elevation: 10,
    shadowOpacity: 0.2,
    maxWidth: "90%",
  },
  toastText: { marginLeft: 10, fontWeight: "700", fontSize: 14 },
});

export default PaymentScreen;
