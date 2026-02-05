import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  Vibration,
  Dimensions,
  Easing,
  PanResponder,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

// --- CONFIGURATION & CONSTANTS ---
const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;

const COLORS = {
  primary: "#6366F1", // Indigo-500
  primaryDark: "#4338CA", // Indigo-700
  secondary: "#EC4899", // Pink-500
  dark: "#0F172A", // Slate-900
  text: "#1E293B", // Slate-800
  textSecondary: "#64748B", // Slate-500
  background: "#F1F5F9", // Slate-100
  white: "#FFFFFF",
  red: "#EF4444",
  green: "#10B981",
  gold: "#F59E0B",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  disabled: "#94A3B8",
};

const tiers = [
  {
    id: 1,
    name: "Premium",
    price: "999",
    place: "1st",
    icon: "crown",
    color: "#FFD700",
  },
  {
    id: 2,
    name: "Gold",
    price: "899",
    place: "2nd",
    icon: "star",
    color: "#DAA520",
  },
  {
    id: 3,
    name: "Silver",
    price: "799",
    place: "3rd",
    icon: "medal",
    color: "#C0C0C0",
  },
  {
    id: 4,
    name: "Bronze",
    price: "699",
    place: "4th",
    icon: "shield",
    color: "#CD7F32",
  },
  {
    id: 5,
    name: "Standard",
    price: "599",
    place: "5th",
    icon: "check-circle",
    color: "#6a11cb",
  },
  {
    id: 6,
    name: "Basic",
    price: "499",
    place: "6th",
    icon: "information",
    color: "#888",
  },
  {
    id: 7,
    name: "Entry",
    price: "399",
    place: "7th",
    icon: "tag",
    color: "#888",
  },
  {
    id: 8,
    name: "Starter",
    price: "299",
    place: "8th",
    icon: "rocket",
    color: "#888",
  },
  {
    id: 9,
    name: "Lite",
    price: "199",
    place: "9th",
    icon: "leaf",
    color: "#888",
  },
  {
    id: 10,
    name: "Free",
    price: "99",
    place: "10th",
    icon: "gift",
    color: "#888",
  },
];

// --- 1. SWIPE BUTTON COMPONENT (FIXED & DRAGGABLE) ---
const SwipeButton = ({ onSwipeSuccess, label, disabled, price }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);

  // We use a ref for the drag limit so the PanResponder
  // can access the live value without stale closures
  const maxDragRef = useRef(0);
  // We use state just to trigger a re-render for the interpolation
  const [dragLimit, setDragLimit] = useState(0);

  const BUTTON_HEIGHT = 56;
  const PADDING = 4;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !disabled && !isSwiped && maxDragRef.current > 0,

      onPanResponderMove: (_, gestureState) => {
        if (disabled || isSwiped) return;
        const maxDrag = maxDragRef.current;

        // Constrain movement between 0 and maxDrag
        if (gestureState.dx < 0) {
          translateX.setValue(0);
        } else if (gestureState.dx > maxDrag) {
          translateX.setValue(maxDrag);
        } else {
          translateX.setValue(gestureState.dx);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (disabled || isSwiped) return;
        const maxDrag = maxDragRef.current;

        // Success Threshold: Dragged > 65%
        if (gestureState.dx > maxDrag * 0.65) {
          Animated.spring(translateX, {
            toValue: maxDrag,
            useNativeDriver: true,
            bounciness: 0,
            speed: 100,
          }).start(() => {
            setIsSwiped(true);
            Vibration.vibrate(50);
            onSwipeSuccess();
          });
        } else {
          // Snap back to start
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // Visual Interpolation for text fading
  const safeLimit = dragLimit > 0 ? dragLimit / 2 : 1;
  const textOpacity = translateX.interpolate({
    inputRange: [0, safeLimit],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.swipeContainer, disabled && styles.swipeDisabled]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        // Calculate max drag distance
        const limit = Math.max(0, w - BUTTON_HEIGHT - PADDING);
        maxDragRef.current = limit;
        setDragLimit(limit); // Trigger render for interpolation
      }}
    >
      {/* pointerEvents="none" ensures clicks pass through to the slider if missed */}
      <Animated.View
        style={[styles.swipeTextContainer, { opacity: textOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.swipeLabel}>{label}</Text>
        {price && <Text style={styles.swipePrice}> • ₹{price}</Text>}
        <View style={styles.shimmerIcon}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.5)"
          />
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.swipeKnob, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
      </Animated.View>
    </View>
  );
};

// --- 2. TOAST NOTIFICATION ---
const ToastNotification = ({ message, type, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => hideToast(), 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible && opacity._value === 0) return null;

  let iconName = "information-circle";
  let iconColor = COLORS.primary;

  if (type === "success") {
    iconName = "checkmark-circle";
    iconColor = COLORS.green;
  } else if (type === "error") {
    iconName = "alert-circle";
    iconColor = COLORS.red;
  }

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }], opacity }]}
    >
      <View style={styles.toastContent}>
        <View
          style={[styles.toastIconBg, { backgroundColor: iconColor + "20" }]}
        >
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 3. TIER CARD (REDESIGNED & POLISHED) ---
const TierCard = ({
  tier,
  isSelected,
  isLockedByOther,
  isLockedByYou,
  onPress,
  disabled,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for selected state
  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.02, duration: 150, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true })
      ]).start();
    }
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  // Dynamic Styles
  const cardOpacity = isLockedByOther ? 0.6 : 1;
  const isTopTier = tier.id <= 3;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!disabled) {
            Vibration.vibrate(10);
            onPress();
          }
        }}
        disabled={disabled}
      >
        {isSelected ? (
          // SELECTED STATE: Premium Gradient with Glow Border
          <LinearGradient
            colors={['#8B5CF6', '#4F46E5']} // Violet-500 to Indigo-600
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardContainer, styles.cardSelectedShadow, { borderWidth: 2, borderColor: '#C4B5FD' }]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.rankBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Text style={[styles.rankText, { color: "#FFF", fontSize: 16 }]}>{tier.place}</Text>
                </View>
              </View>

              <View style={styles.cardCenter}>
                <Text style={[styles.tierName, { color: "#FFF", fontSize: 19, letterSpacing: 0.5 }]}>{tier.name}</Text>
                {isLockedByYou && (
                  <View style={[styles.statusPill, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="shield-checkmark" size={12} color={COLORS.green} />
                    <Text style={[styles.statusText, { color: COLORS.green }]}>You Own This</Text>
                  </View>
                )}
                {!isLockedByYou && (
                  <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={[styles.statusText, { color: '#FFF' }]}>Excellent Choice</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardRight}>
                <Text style={[styles.priceText, { color: "#FFF", fontSize: 22 }]}>₹{tier.price}</Text>
                <Text style={[styles.durationText, { color: "rgba(255,255,255,0.8)" }]}>/ month</Text>
                <View style={[styles.selectedCheck, { backgroundColor: '#FFF', borderRadius: 12, padding: 2, marginTop: 6 }]}>
                  <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                </View>
              </View>
            </View>

            {/* Glossy Overlay */}
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'transparent']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </LinearGradient>
        ) : (
          // UNSELECTED STATE
          <View style={[
            styles.cardContainer,
            styles.cardDefaultShadow,
            isLockedByOther && styles.cardLockedBg,
            isLockedByYou && { borderColor: COLORS.green, borderWidth: 1.5 }
          ]}>
            <View style={[styles.cardContent, { opacity: cardOpacity }]}>
              <View style={styles.cardLeft}>
                <View style={[
                  styles.rankBadge,
                  { backgroundColor: isTopTier ? tier.color + "15" : COLORS.background }
                ]}>
                  <Text style={[
                    styles.rankText,
                    { color: isTopTier ? tier.color : COLORS.textSecondary }
                  ]}>{tier.place}</Text>
                </View>
              </View>

              <View style={styles.cardCenter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.tierName, { color: COLORS.text }]}>{tier.name}</Text>
                  {isTopTier && (
                    <MaterialCommunityIcons name="crown" size={16} color={tier.color} style={{ marginLeft: 6 }} />
                  )}
                </View>
                {isLockedByOther ? (
                  <View style={styles.lockedRow}>
                    <Ionicons name="lock-closed" size={12} color={COLORS.red} />
                    <Text style={styles.lockedText}>Taken by {tier.lockedBy?.name || 'someone'}</Text>
                  </View>
                ) : (
                  <Text style={styles.rankSubtitle}>Available Position</Text>
                )}
              </View>

              <View style={styles.cardRight}>
                <Text style={[styles.priceText, { color: COLORS.dark }]}>₹{tier.price}</Text>
                <Text style={[styles.durationText, { color: COLORS.textSecondary }]}>/mo</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- 4. MAIN SCREEN COMPONENT ---
const ListingTierScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState(null);
  const [lockedPlaces, setLockedPlaces] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listingConfirmed, setListingConfirmed] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const routeCategory = route?.params?.category || "Barber";

  const showToast = (message, type = "info") => {
    if (type === "error") Vibration.vibrate([0, 50, 50, 50]);
    else if (type === "success") Vibration.vibrate(50);
    setToast({ visible: true, message, type });
  };

  const fetchShopAndLockedPlaces = useCallback(async () => {
    setLoading(true);
    try {


      // Parallel fetch for speed
      const [shopRes, lockedRes] = await Promise.all([
        api.get('/api/shop', { timeout: 10000 }),
        api.get(
          `/api/shop/locked-places?category=${encodeURIComponent(routeCategory)}`,
          { timeout: 10000 }
        ),
      ]);

      setMyShop(shopRes.data);

      const categoryToMatch = routeCategory;
      const myActiveListing = shopRes.data.selectedListingPlaces?.find(
        lp => lp.category === categoryToMatch
      );

      if (myActiveListing) {
        setSelectedTier(
          tiers.find((t) => t.id === myActiveListing.tierId)
        );
        setListingConfirmed(true);
      } else {
        setSelectedTier(null);
        setListingConfirmed(false);
      }
      setLockedPlaces(lockedRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.message === "Network Error" || error.code === "ECONNABORTED") {
        showToast("Internet appears to be offline", "error");
      } else {
        showToast("Could not sync latest tiers", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchShopAndLockedPlaces();
    }, [fetchShopAndLockedPlaces])
  );

  const handleSelectTier = (tier) => {
    if (listingConfirmed) {
      showToast("Cancel current plan to switch.", "error");
      return;
    }
    if (!user) {
      showToast("Please login first", "error");
      return;
    }

    const lockedPlace = lockedPlaces.find((lp) => lp.tierId === tier.id);
    if (lockedPlace && lockedPlace.lockedBy && lockedPlace.lockedBy._id) {
      const barberId = lockedPlace.lockedBy._id;
      if (typeof barberId === "string" && barberId.length > 0) {
        navigation.navigate("BarberProfileViewScreen", { barberId: barberId });
        return;
      }
    }
    // Toggle
    if (selectedTier?.id === tier.id) setSelectedTier(null);
    else setSelectedTier(tier);
  };

  const handleConfirm = () => {
    if (selectedTier) {
      // Small delay to allow swipe animation to finish visually
      setTimeout(() => {
        navigation.navigate("PaymentScreen", {
          tier: selectedTier,
          category: routeCategory
        });
      }, 200);
    } else {
      showToast("Please select a tier first", "info");
    }
  };

  const handleCancelListing = async () => {
    setShowCancelConfirmation(false);
    setLoading(true);
    try {
      await api.put(
        `/api/shop/barber/cancel-listing/${user.id}`,
        { category: routeCategory }
      );
      showToast("Listing cancelled successfully", "success");
      setListingConfirmed(false);
      setSelectedTier(null);
      fetchShopAndLockedPlaces();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to cancel listing",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Updating live rankings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{routeCategory === "Unisex" ? "Unisex Section" : "Boost Visibility"}</Text>
          <Text style={styles.headerSubtitle}>
            Secure a top spot in {routeCategory} search results.
          </Text>
        </View>
        <View style={styles.headerIconBg}>
          <Ionicons name="stats-chart" size={22} color={COLORS.primary} />
        </View>
      </View>

      {/* Scrollable List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Text style={styles.sectionHeader}>Live Positions</Text>
        {tiers.map((tier) => {
          const foundLockedPlace = lockedPlaces.find(
            (lp) => lp.tierId === tier.id && lp.category === "Barber"
          );
          const isLockedByOther =
            user &&
            foundLockedPlace &&
            foundLockedPlace.lockedBy &&
            foundLockedPlace.lockedBy._id !== user.id;
          const isLockedByYou =
            user &&
            foundLockedPlace &&
            foundLockedPlace.lockedBy &&
            foundLockedPlace.lockedBy._id === user.id;
          const isSelected = selectedTier?.id === tier.id;

          return (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={isSelected}
              isLockedByOther={isLockedByOther}
              isLockedByYou={isLockedByYou}
              onPress={() => handleSelectTier(tier)}
              disabled={isLockedByOther || listingConfirmed}
            />
          );
        })}
      </ScrollView>

      {/* Bottom Floating Dock */}
      <BlurView
        intensity={25}
        tint="default"
        style={styles.bottomDockContainer}
      >
        <View style={styles.bottomDockContent}>
          {listingConfirmed ? (
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.btnSecondary,
                  { flex: 1, marginRight: 10 },
                ]}
                onPress={() =>
                  user &&
                  user.id &&
                  navigation.navigate("BarberProfileViewScreen", {
                    barberId: user.id,
                  })
                }
              >
                <Text style={[styles.btnText, { color: COLORS.primary }]}>
                  View Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.btnDestructive, { flex: 1 }]}
                onPress={() => setShowCancelConfirmation(true)}
              >
                <Text style={[styles.btnText, { color: COLORS.red }]}>
                  End Listing
                </Text>
              </TouchableOpacity>
            </View>
          ) : // SWIPE BUTTON LOGIC
            !selectedTier ? (
              <TouchableOpacity
                style={[styles.button, styles.btnDisabled]}
                disabled={true}
              >
                <Text style={[styles.btnText, { color: "#888" }]}>
                  Select a Tier to Continue
                </Text>
              </TouchableOpacity>
            ) : (
              <SwipeButton
                label={`Swipe to Get ${selectedTier.name}`}
                price={selectedTier.price}
                onSwipeSuccess={handleConfirm}
                disabled={false}
              />
            )}
        </View>
      </BlurView>

      {/* Modals & Toasts */}
      {showCancelConfirmation && (
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBg}>
              <Ionicons name="warning" size={32} color={COLORS.red} />
            </View>
            <Text style={styles.modalTitle}>Cancel Listing?</Text>
            <Text style={styles.modalBody}>
              You will lose your{" "}
              <Text style={{ fontWeight: "bold" }}>{selectedTier?.place}</Text>{" "}
              place ranking immediately.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowCancelConfirmation(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleCancelListing}
              >
                <Text style={styles.modalBtnTextConfirm}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

// --- 5. STYLESHEET ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: STATUSBAR_HEIGHT + 15,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  // Content
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 10 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Card
  cardContainer: {
    borderRadius: 24,
    padding: 2, // For border effect if needed, but using internal padding
    overflow: "hidden",
  },
  cardSelectedShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  cardDefaultShadow: {
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLockedBg: {
    backgroundColor: "#F8FAFC", // Lighter gray for locked
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    width: '100%'
  },
  cardLeft: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardCenter: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  tierName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  rankSubtitle: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '600'
  },
  cardRight: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
    fontVariant: ["tabular-nums"],
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4
  },
  selectedCheck: {
    marginTop: 4
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  lockedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 4
  },

  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FDFBFF",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  cardLocked: { backgroundColor: "#F7F7F7", opacity: 0.85 },
  cardLeft: { marginRight: 14 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCenter: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  tierName: { fontSize: 17, fontWeight: "700", color: COLORS.dark },
  tierPlace: { fontSize: 13, color: COLORS.textSecondary },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  lockInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  lockedText: { fontSize: 12, color: COLORS.red, fontWeight: "600" },
  textLocked: { color: "#A0A0A0" },
  cardRight: { alignItems: "flex-end" },
  priceText: { fontSize: 17, fontWeight: "800", color: COLORS.dark },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Bottom Dock
  bottomDockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  bottomDockContent: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  row: { flexDirection: "row" },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: "#F0E6FF", shadowOpacity: 0, elevation: 0 },
  btnDestructive: {
    backgroundColor: "#FFF0F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabled: { backgroundColor: "#F2F2F7", shadowOpacity: 0, elevation: 0 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },

  // Swipe Button Styles
  swipeContainer: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    justifyContent: "center",
    padding: 4,
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  swipeDisabled: { backgroundColor: "#E0E0E0", shadowOpacity: 0, elevation: 0 },
  swipeTextContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    zIndex: 1,
  },
  swipeLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  swipePrice: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
  swipeKnob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shimmerIcon: { flexDirection: "row", marginLeft: 10, alignItems: "center" },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalBtnCancel: { backgroundColor: "#F2F2F7" },
  modalBtnConfirm: { backgroundColor: COLORS.red },
  modalBtnTextCancel: { color: COLORS.dark, fontWeight: "600" },
  modalBtnTextConfirm: { color: COLORS.white, fontWeight: "700" },

  // Toast
  toastContainer: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 20,
    left: 20,
    right: 20,
    zIndex: 2000,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  toastIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toastText: {
    fontSize: 14,
    color: COLORS.toastText,
    fontWeight: "600",
    flex: 1,
  },
});

export default ListingTierScreen;
