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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../utils/api";
import * as Haptics from "expo-haptics";
import RazorpayCheckout from "react-native-razorpay";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

// Premium Color Palette matching ListingTierScreen
const COLORS = {
  primary: "#6366F1", // Indigo-500
  primaryDark: "#4338CA", // Indigo-700
  secondary: "#EC4899", // Pink-500
  background: "#F1F5F9", // Slate-100
  cardBg: "#FFFFFF",
  text: "#0F172A", // Slate-900
  textSecondary: "#64748B", // Slate-500
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  swipeTrack: "#E0E7FF",
  swipeText: "#6366F1",
  white: "#FFFFFF",
  gold: "#F59E0B",
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
  const { tier, adPlacementId, amount, adId } = route.params || {};
  const { user } = useAuth(); // Safely accessed now

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
    // A. BOOKING PAYMENT (Kept as is - currently dummy/coins based on your recent files)
    if (adPlacementId || !tier && !adId) {
      setLoading(true);
      try {
        let res;
        if (adPlacementId) {
          res = await api.put(`/api/ads/${adPlacementId}`, {
            status: "active",
            isBooked: true,
          });
        }
        setPaymentCompleted(true);
        showToast("Activated Successfully!", "success");
        setTimeout(() => navigation.navigate("Profile"), 2000);
      } catch (err) {
        setLoading(false);
        setResetBtn((p) => p + 1);
        showToast(err.response?.data?.msg || "Transaction Failed", "error");
      }
      return;
    }

    // NEW: AD CAMPAIGN PAYMENT (REAL RAZORPAY)
    if (adId) {
      setLoading(true);
      try {
        console.log('🔹 [Razorpay Ad] Initiating order for Ad:', adId);

        // 1. Create Ad Order
        const orderRes = await api.post("/api/payment/ad-order", {
          adId,
          price: parseFloat(amount)
        });

        // 2. Fetch Config
        const configRes = await api.get("/api/payment/config");
        const rzpKey = configRes.data.key;

        const options = {
          description: `Book Ad Campaign`,
          currency: orderRes.data.currency,
          key: rzpKey,
          amount: orderRes.data.amount,
          name: 'SetKarr Salon',
          order_id: orderRes.data.id,
          prefill: {
            email: user.email,
            contact: user.phone || '',
            name: user.name
          },
          theme: { color: COLORS.primary }
        };

        // 3. Open Checkout
        const data = await RazorpayCheckout.open(options);

        // 4. Verify Payment
        const verifyRes = await api.post("/api/payment/verify-ad", {
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          adId
        });

        if (verifyRes.data.success) {
          setPaymentCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast("Ad Campaign Active!", "success");
          setTimeout(() => navigation.navigate("Profile"), 2000);
        }
      } catch (err) {
        console.error('🔥 [Razorpay Ad Error]:', err);
        showToast(err.message || "Payment Failed", "error");
        setResetBtn((p) => p + 1);
      } finally {
        setLoading(false);
      }
      return;
    }

    // B. LISTING TIER PAYMENT (REAL RAZORPAY)
    setLoading(true);
    try {
      console.log('🔹 [Razorpay] Initiating order for tier:', tier.id);

      // 1. Create Razorpay Order
      let orderRes;
      try {
        orderRes = await api.post("/api/payment/listing-order", {
          tierId: tier.id,
          price: tier.price,
          category: route.params.category
        });
        console.log('✅ [Razorpay] Order created:', orderRes.data.id);
      } catch (apiErr) {
        console.error('❌ [Razorpay] API Order Creation Failed:', apiErr.response?.data || apiErr.message);
        const backendError = apiErr.response?.data?.error || apiErr.response?.data?.msg || apiErr.message;
        throw new Error(backendError);
      }

      // 1.5 Fetch Razorpay Key from Backend
      let rzpKey;
      try {
        const configRes = await api.get("/api/payment/config");
        rzpKey = configRes.data.key;
        if (!rzpKey) throw new Error("Key not returned from server");
      } catch (keyErr) {
        console.error('❌ [Razorpay] Failed to fetch Key ID:', keyErr);
        throw new Error("Payment configuration missing on server. Please try again later.");
      }

      const options = {
        description: `Upgrade to ${tier.name} Listing`,
        image: 'https://i.imgur.com/39go7K2.png',
        currency: orderRes.data.currency,
        key: rzpKey,
        amount: orderRes.data.amount,
        name: 'SetKarr Salon',
        order_id: orderRes.data.id,
        prefill: {
          email: user.email,
          contact: user.phone || '',
          name: user.name
        },
        theme: { color: COLORS.primary }
      };

      // 2. Open Razorpay Checkout
      let data;
      try {
        console.log('🔹 [Razorpay] Checking SDK availability...');
        const isSDKAvailable = RazorpayCheckout && typeof RazorpayCheckout.open === 'function';

        if (!isSDKAvailable) {
          console.error('❌ [Razorpay] SDK Object:', RazorpayCheckout);
          throw new Error("Razorpay SDK (Native Module) is not linked or not available. Expo Go does not support this. You MUST use a Development Build.");
        }

        console.log('🔹 [Razorpay] Opening Checkout modal...');
        data = await RazorpayCheckout.open(options);
        console.log('✅ [Razorpay] Payment successful:', data.razorpay_payment_id);
      } catch (sdkErr) {
        console.error('❌ [Razorpay] SDK Error:', sdkErr);

        // Detect native module missing or null property access
        const isMissingModule =
          !RazorpayCheckout ||
          sdkErr.message?.includes('null') ||
          sdkErr.message?.includes('undefined') ||
          sdkErr.message?.includes('Native module');

        if (isMissingModule) {
          throw new Error("Razorpay native module is missing. You MUST use a Development Build on a device/emulator to see the payment popup.");
        }
        throw sdkErr;
      }

      // 3. Verify Payment
      console.log('🔹 [Razorpay] Verifying payment...');
      const verifyRes = await api.post("/api/payment/verify-listing", {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        tierId: tier.id,
        price: tier.price,
        category: route.params.category
      });

      if (verifyRes.data.success) {
        setPaymentCompleted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast("Rank Secured Successfully!", "success");
        setTimeout(() => navigation.navigate("BarberProfileViewScreen", { barberId: user.id }), 2000);
      }
    } catch (err) {
      console.error('🔥 [Razorpay Final Catch]:', err);
      let errorMsg = "Payment Failed";
      if (err.description) errorMsg = err.description;
      else if (err.error?.description) errorMsg = err.error.description;
      else if (typeof err.message === 'string') errorMsg = err.message;
      else if (typeof err === 'string') errorMsg = err;

      showToast(errorMsg, "error");
      setResetBtn((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }, [tier, adPlacementId, user, route.params.category]);

  const details = useMemo(() => {
    if (adId)
      return {
        title: "Ad Campaign",
        sub: "Banner Promotion",
        price: parseFloat(amount),
        icon: "trending-up",
      };
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmation</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* --- NEW SECTION: QUEUE POSITION MESSAGE --- */}
          {tier && (
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.queueMessageCard}
            >
              <View style={styles.queueIconBg}>
                <Ionicons name="podium" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.queueTextContainer}>
                <Text style={styles.queueTitle}>Listing Position Guaranteed</Text>
                <Text style={styles.queueBody}>
                  Your card will be visible on the{" "}
                  <Text style={styles.queueHighlight}>
                    {tier.place || "Top"}
                  </Text>{" "}
                  on the Listing.
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Impact Projection Card */}
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
                <Text style={styles.statValue}>++</Text>
                <View
                  style={[
                    styles.miniBar,
                    { width: "90%", backgroundColor: COLORS.gold },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.impactFooter}>
              *Based on shops with similar listings in your area.
            </Text>
          </View>

          {/* Receipt Card */}
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
              <Text style={styles.billLabel}>Total Payable</Text>
              <Text style={styles.billValue}>₹{details.price.toFixed(2)}</Text>
            </View>
          </View>

          {/* Benefits */}
          <Text style={styles.sectionHeader}>Included Benefits</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={18} color={COLORS.primary} />
              <Text style={styles.benefitText}>Instant Live</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.benefitText}>Verified Badge</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people" size={18} color={COLORS.primary} />
              <Text style={styles.benefitText}>More Clients</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="star" size={18} color={COLORS.primary} />
              <Text style={styles.benefitText}>Top Rated</Text>
            </View>
          </View>

          <View style={styles.paymentMethod}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={18}
              color={COLORS.success}
            />
            <Text style={styles.methodText}>
              Secure payment processed via Razorpay
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomDock}>
          <SwipeButton
            onSwipeSuccess={handlePayment}
            label="Swipe to Pay"
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  scroll: { padding: 20, paddingBottom: 100 },

  // --- Queue Message Card ---
  queueMessageCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  queueIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  queueTextContainer: { flex: 1 },
  queueTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  queueBody: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  queueHighlight: {
    fontWeight: "800",
    fontSize: 17,
    color: "#FFF",
    textDecorationLine: 'underline'
  },

  // Impact Card
  impactCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 10,
  },
  impactTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { color: "#94A3B8", fontSize: 12, marginBottom: 6, fontWeight: '500' },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  miniBar: { height: 4, borderRadius: 2, marginTop: 8 },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#334155",
    marginHorizontal: 10,
  },
  impactFooter: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Receipt Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 52,
    height: 52,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemName: { fontSize: 17, fontWeight: "700", color: COLORS.text, marginBottom: 2 },
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
  billLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textSecondary },
  billValue: { fontSize: 28, fontWeight: "800", color: COLORS.text },

  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  benefitItem: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  benefitText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 10,
  },

  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  methodText: { fontSize: 12, color: '#166534', marginLeft: 8, fontWeight: '500' },

  bottomDock: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 35 : 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 }
  },
  swipeTrack: {
    height: 60,
    backgroundColor: COLORS.swipeTrack,
    borderRadius: 30,
    padding: 5,
    justifyContent: "center",
  },
  swipeTextContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  swipeLabel: { fontSize: 16, fontWeight: "700", color: COLORS.swipeText },
  swipeThumb: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  toastWrapper: {
    position: "absolute",
    top: StatusBar.currentHeight + 10,
    left: 0,
    right: 0,
    zIndex: 10000,
    alignItems: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    elevation: 10,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    maxWidth: "90%",
  },
  toastText: { marginLeft: 10, fontWeight: "600", fontSize: 14 },
});

export default PaymentScreen;
