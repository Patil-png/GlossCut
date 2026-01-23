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
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import api from "../utils/api";
import { BlurView } from "expo-blur";

// --- CONFIGURATION & CONSTANTS ---
const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;

const COLORS = {
  primary: "#6a11cb",
  primaryDark: "#4c0c91",
  primarySoft: "rgba(106, 17, 203, 0.1)",
  background: "#F4F6FA", // Slightly cooler gray for modern feel
  surface: "#FFFFFF",
  dark: "#1A1A1A",
  text: "#333333",
  textSecondary: "#8E8E93",
  border: "#EEF0F6",
  red: "#FF453A",
  green: "#32D74B",
  gold: "#FFD700",
  white: "#FFFFFF",
  disabled: "#E0E0E0",
  shadow: "rgba(106, 17, 203, 0.15)",
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
    color: "#8E8E93",
  },
  {
    id: 7,
    name: "Entry",
    price: "399",
    place: "7th",
    icon: "tag",
    color: "#8E8E93",
  },
  {
    id: 8,
    name: "Starter",
    price: "299",
    place: "8th",
    icon: "rocket",
    color: "#8E8E93",
  },
  {
    id: 9,
    name: "Lite",
    price: "199",
    place: "9th",
    icon: "leaf",
    color: "#8E8E93",
  },
  {
    id: 10,
    name: "Free",
    price: "99",
    place: "10th",
    icon: "gift",
    color: "#8E8E93",
  },
];

// --- 1. SWIPE BUTTON COMPONENT ---
const SwipeButton = ({ onSwipeSuccess, label, disabled, price }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState(false);
  const maxDragRef = useRef(0);
  const [dragLimit, setDragLimit] = useState(0);

  const BUTTON_HEIGHT = 56;
  const PADDING = 6; // Increased padding for better knob look

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !disabled && !isSwiped && maxDragRef.current > 0,
      onPanResponderMove: (_, gestureState) => {
        if (disabled || isSwiped) return;
        const maxDrag = maxDragRef.current;
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
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const textOpacity = translateX.interpolate({
    inputRange: [0, dragLimit > 0 ? dragLimit / 2 : 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.swipeContainer, disabled && styles.swipeDisabled]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        const limit = Math.max(0, w - BUTTON_HEIGHT - PADDING * 0.5); // Adjusted calculation
        maxDragRef.current = limit;
        setDragLimit(limit);
      }}
    >
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
            color="rgba(255,255,255,0.4)"
          />
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.7)"
          />
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.swipeKnob, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Ionicons
          name={isSwiped ? "checkmark" : "arrow-forward"}
          size={26}
          color={COLORS.primary}
        />
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

  const stylesType =
    type === "success"
      ? { color: COLORS.green, icon: "checkmark-circle" }
      : type === "error"
        ? { color: COLORS.red, icon: "alert-circle" }
        : { color: COLORS.primary, icon: "information-circle" };

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }], opacity }]}
    >
      <View style={styles.toastContent}>
        <View
          style={[
            styles.toastIconBg,
            { backgroundColor: stylesType.color + "15" },
          ]}
        >
          <Ionicons name={stylesType.icon} size={22} color={stylesType.color} />
        </View>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 3. TIER CARD ---
const TierCard = ({
  tier,
  isSelected,
  isLockedByOther,
  isLockedByYou,
  onPress,
  disabled,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled)
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 20,
      }).start();
  };
  const handlePressOut = () => {
    if (!disabled)
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      }).start();
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!disabled) {
            Vibration.vibrate(10);
            onPress();
          }
        }}
        disabled={disabled}
        style={[
          styles.cardContainer,
          isSelected && styles.cardSelected,
          isLockedByOther && styles.cardLocked,
        ]}
      >
        {/* Left: Icon & Rank */}
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconCircle,
              isSelected
                ? { backgroundColor: COLORS.primary }
                : { backgroundColor: COLORS.background },
            ]}
          >
            <MaterialCommunityIcons
              name={tier.icon}
              size={24}
              color={isSelected ? COLORS.white : tier.color}
            />
          </View>
        </View>

        {/* Center: Info */}
        <View style={styles.cardCenter}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.tierName, isLockedByOther && styles.textLocked]}
            >
              {tier.name}
            </Text>
            {isSelected && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Selected</Text>
              </View>
            )}
          </View>

          <Text style={styles.tierRank}>
            Rank Position:{" "}
            <Text style={{ color: COLORS.dark, fontWeight: "700" }}>
              {tier.place}
            </Text>
          </Text>

          {isLockedByOther && (
            <View style={styles.lockStatus}>
              <Ionicons
                name="lock-closed"
                size={12}
                color={COLORS.red}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.lockTextError}>Taken by another salon</Text>
            </View>
          )}
          {isLockedByYou && (
            <View style={styles.lockStatus}>
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={COLORS.green}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.lockTextSuccess}>Current Active Plan</Text>
            </View>
          )}
        </View>

        {/* Right: Price */}
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.priceText,
              isSelected && { color: COLORS.primary },
              isLockedByOther && styles.textLocked,
            ]}
          >
            ₹{tier.price}
          </Text>
          <Text style={styles.durationText}>/mo</Text>
        </View>

        {/* Selected Indicator Border Overlay (for cleaner look) */}
        {isSelected && <View style={styles.selectedBorderOverlay} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---
const PetCareListingTierScreen = ({ navigation }) => {
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

  const showToast = (message, type = "info") => {
    if (type === "error") Vibration.vibrate([0, 50, 50, 50]);
    else if (type === "success") Vibration.vibrate(50);
    setToast({ visible: true, message, type });
  };

  const fetchShopAndLockedPlaces = useCallback(async () => {
    setLoading(true);
    try {


      const shopRes = await api.get('/api/shop');
      setMyShop(shopRes.data);
      if (
        shopRes.data.selectedListingPlace &&
        shopRes.data.selectedListingPlace.category === "Pet Care"
      ) {
        setSelectedTier(
          tiers.find((t) => t.id === shopRes.data.selectedListingPlace.tierId)
        );
        setListingConfirmed(true);
      } else {
        setSelectedTier(null);
        setListingConfirmed(false);
      }

      const lockedRes = await api.get(
        '/api/shop/locked-places?category=Pet Care'
      );
      setLockedPlaces(lockedRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Could not load listing tiers.", "error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchShopAndLockedPlaces();
    }, [fetchShopAndLockedPlaces])
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Updating Rankings...</Text>
      </View>
    );
  }

  const handleSelectTier = (tier) => {
    if (listingConfirmed) {
      showToast("Cancel current plan to switch.", "info");
      return;
    }
    const lockedPlace = lockedPlaces.find(
      (lp) => lp.tierId === tier.id && lp.category === "Pet Care"
    );
    if (lockedPlace && lockedPlace.lockedBy) {
      // Logic to view other profile if needed
      return;
    }
    setSelectedTier(selectedTier?.id === tier.id ? null : tier);
  };

  const handleConfirm = () => {
    if (selectedTier) {
      navigation.navigate("PaymentScreen", {
        tier: selectedTier,
        category: "Pet Care",
      });
    }
  };

  const handleCancelListing = async () => {
    setShowCancelConfirmation(false);
    setLoading(true);
    try {
      await api.put(
        `/api/shop/barber/cancel-listing/${user.id}`,
        { category: "Pet Care" }
      );
      showToast("Listing cancelled successfully.", "success");
      setListingConfirmed(false);
      setSelectedTier(null);
      fetchShopAndLockedPlaces();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to cancel.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Boost Pet Care Visibility</Text>
          <Text style={styles.headerSubtitle}>
            Secure a top spot in Pet Care search results.
          </Text>
        </View>
        <View style={styles.headerIconBg}>
          <Ionicons name="trending-up" size={24} color={COLORS.primary} />
        </View>
      </View>

      {/* --- CONTENT --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Available Positions</Text>
          <View style={styles.line} />
        </View>

        {tiers.map((tier) => {
          const lockedPlace = lockedPlaces.find(
            (lp) => lp.tierId === tier.id && lp.category === "Pet Care"
          );
          const isLockedByOther =
            user &&
            lockedPlace?.lockedBy &&
            lockedPlace.lockedBy._id !== user.id;
          const isLockedByYou =
            user &&
            lockedPlace?.lockedBy &&
            lockedPlace.lockedBy._id === user.id;

          return (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier?.id === tier.id}
              isLockedByOther={isLockedByOther}
              isLockedByYou={isLockedByYou}
              onPress={() => handleSelectTier(tier)}
              disabled={isLockedByOther || listingConfirmed}
            />
          );
        })}
      </ScrollView>

      {/* --- BOTTOM FLOATING DOCK --- */}
      <BlurView intensity={90} tint="light" style={styles.bottomDockContainer}>
        <View style={styles.bottomDockContent}>
          {listingConfirmed ? (
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.btnSecondary,
                  { flex: 1, marginRight: 12 },
                ]}
                onPress={() =>
                  user?.id &&
                  navigation.navigate("BarberProfileViewScreen", {
                    barberId: user.id,
                  })
                }
              >
                <Text style={styles.btnTextPrimary}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.btnDestructive, { flex: 1 }]}
                onPress={() => setShowCancelConfirmation(true)}
              >
                <Text style={styles.btnTextDestructive}>End Listing</Text>
              </TouchableOpacity>
            </View>
          ) : !selectedTier ? (
            <View style={[styles.button, styles.btnDisabled]}>
              <Text style={styles.btnTextDisabled}>Select a Rank Above</Text>
            </View>
          ) : (
            <SwipeButton
              label={`Swipe to Get ${selectedTier.place} Rank`}
              price={selectedTier.price}
              onSwipeSuccess={handleConfirm}
              disabled={false}
            />
          )}
        </View>
      </BlurView>

      {/* --- CONFIRMATION MODAL --- */}
      {showCancelConfirmation && (
        <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBg}>
              <Ionicons name="warning-outline" size={32} color={COLORS.red} />
            </View>
            <Text style={styles.modalTitle}>Cancel Listing?</Text>
            <Text style={styles.modalBody}>
              You will lose your{" "}
              <Text style={{ fontWeight: "700", color: COLORS.dark }}>
                {selectedTier?.place} Place
              </Text>{" "}
              immediately. This spot may be taken by another salon.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowCancelConfirmation(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Keep Rank</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // --- Header ---
  header: {
    paddingHorizontal: 24,
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: COLORS.background, // Match container
  },
  headerTextContainer: { flex: 1, paddingRight: 20 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // --- List Section ---
  scrollContent: { paddingHorizontal: 20, paddingBottom: 160 },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginRight: 12,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },

  // --- Tier Card ---
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FDFBFF",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardLocked: {
    backgroundColor: "#FAFAFA",
    opacity: 0.7,
    borderColor: "transparent",
  },

  cardLeft: { marginRight: 16 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  cardCenter: { flex: 1, justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  tierName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    marginRight: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tierRank: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },

  lockStatus: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  lockTextError: { fontSize: 12, color: COLORS.red, fontWeight: "600" },
  lockTextSuccess: { fontSize: 12, color: COLORS.green, fontWeight: "600" },
  textLocked: { color: "#A0A0A0" },

  cardRight: { alignItems: "flex-end", justifyContent: "center", minWidth: 70 },
  priceText: { fontSize: 18, fontWeight: "800", color: COLORS.dark },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: -2,
  },

  selectedBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderColor: COLORS.primary,
    borderWidth: 2,
    borderRadius: 20,
    pointerEvents: "none",
  },

  // --- Bottom Dock ---
  bottomDockContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    // Fallback for Android if BlurView issues arise
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.95)" : undefined,
  },
  bottomDockContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  row: { flexDirection: "row" },

  // --- Buttons ---
  button: {
    height: 56,
    borderRadius: 28, // Pill shape
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondary: { backgroundColor: "#F0E6FF" },
  btnTextPrimary: { color: COLORS.primary, fontSize: 16, fontWeight: "700" },
  btnDestructive: { backgroundColor: "#FFF0F0" },
  btnTextDestructive: { color: COLORS.red, fontSize: 16, fontWeight: "700" },
  btnDisabled: { backgroundColor: COLORS.border },
  btnTextDisabled: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },

  // --- Swipe Button ---
  swipeContainer: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    padding: 4,
    width: "100%",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  swipeDisabled: { backgroundColor: COLORS.disabled, shadowOpacity: 0 },
  swipeTextContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 40, // Offset for the knob
  },
  swipeLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  swipePrice: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: "500",
  },
  shimmerIcon: { flexDirection: "row", marginLeft: 8, alignItems: "center" },
  swipeKnob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // --- Modal ---
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
  modalBtnCancel: { backgroundColor: COLORS.background },
  modalBtnConfirm: { backgroundColor: COLORS.red },
  modalBtnTextCancel: { color: COLORS.dark, fontWeight: "600" },
  modalBtnTextConfirm: { color: COLORS.white, fontWeight: "700" },

  // --- Toast ---
  toastContainer: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 10,
    left: 16,
    right: 16,
    zIndex: 2000,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toastText: { fontSize: 14, color: COLORS.text, fontWeight: "600", flex: 1 },
});

export default PetCareListingTierScreen;
