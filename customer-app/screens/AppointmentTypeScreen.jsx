import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Easing,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

const { width } = Dimensions.get("window");

// --- CONSTANTS ---
const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;
const FOOTER_PADDING_BOTTOM = Platform.OS === "ios" ? 34 : 24;

const allAppointmentTypes = [
  {
    id: "2",
    name: "Basic",
    description: "Standard appointment slot.",
    priceIndicator: "Standard",
  },
  {
    id: "4",
    name: "Express",
    description: "VIP Lounge access, top priority & fastest service.",
    priceIndicator: "Exclusive",
  },
];

// --- CUSTOM TOAST COMPONENT (Modern Alert) ---
const ToastNotification = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 40, // marginTop: 40 as requested
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "#ECFDF5",
          border: "#10B981",
          text: "#065F46",
          icon: "checkmark-circle",
        };
      case "error":
        return {
          bg: "#FEF2F2",
          border: "#EF4444",
          text: "#991B1B",
          icon: "alert-circle",
        };
      case "warning":
        return {
          bg: "#FFFBEB",
          border: "#F59E0B",
          text: "#92400E",
          icon: "warning",
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

  const stylesConfig = getColors();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }] },
        { backgroundColor: stylesConfig.bg, borderColor: stylesConfig.border },
      ]}
    >
      <Ionicons
        name={stylesConfig.icon}
        size={24}
        color={stylesConfig.border}
        style={{ marginRight: 10 }}
      />
      <Text style={[styles.toastText, { color: stylesConfig.text }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// --- 1. OPTIMIZED CARD COMPONENT (Memoized) ---
// Using React.memo ensures cards only re-render if their specific props change
const AnimatedCard = memo(
  ({ item, isSelected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isBlack = item.name === "Express";

    // Memoize expensive calculations
    const cardData = React.useMemo(() => ({
      isBlack: item.name === "Express",
      iconName: (() => {
        if (item.name === "Free") return "walking";
        if (item.name === "Basic") return "clock";
        if (item.name === "Premium") return "bolt";
        return "crown";
      })(),
      colors: item.name === "Express" ? {
        icon: "#FFD700",
        text: "#FFD700",
        bg: ["#1a1a1a", "#000000"],
        border: "#333"
      } : {
        icon: isSelected ? "#10B981" : "#6B7280",
        text: "#1E293B",
        bg: isSelected ? ["#F0FDF4", "#FFFFFF"] : ["#FFF", "#FFF"],
        border: isSelected ? "#10B981" : "#F1F5F9"
      }
    }), [item.name, isSelected]);

    // Memoize event handlers
    const handlePressIn = React.useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePressOut = React.useCallback(() => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }, []);

    const handlePress = React.useCallback(() => onPress(item), [onPress, item]);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={{ marginBottom: 16, width: "100%" }}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ scale: scaleAnim }] },
            isSelected && styles.cardSelected,
            isBlack && styles.cardBlack,
          ]}
        >
          {isBlack && (
            <LinearGradient
              colors={["#1a1a1a", "#000000"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {!isBlack && isSelected && (
            <LinearGradient
              colors={["#F0FDF4", "#FFFFFF"]}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View style={styles.cardContent}>
            {/* Icon Box */}
            <View
              style={[
                styles.iconContainer,
                cardData.isBlack
                  ? styles.iconContainerBlack
                  : isSelected
                  ? styles.iconContainerSelected
                  : styles.iconContainerDefault,
              ]}
            >
              <FontAwesome5
                name={cardData.iconName}
                size={18}
                color={cardData.colors.icon}
              />
            </View>

            {/* Text Area */}
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.cardTitle, isBlack && styles.textGold]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.priceIndicator === "Popular" && (
                  <View style={styles.badgePopular}>
                    <Text style={styles.badgeTextPopular}>BEST VALUE</Text>
                  </View>
                )}
                {item.priceIndicator === "Exclusive" && (
                  <View style={styles.badgeExclusive}>
                    <Text style={styles.badgeTextExclusive}>VIP</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.cardDesc, isBlack && styles.textGrayLight]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <Text style={[styles.priceTag, isBlack && styles.textWhite]}>
                {item.priceIndicator}
              </Text>
            </View>

            {/* Radio Button */}
            <View style={styles.radioContainer}>
              {isSelected ? (
                <View
                  style={[
                    styles.radioActive,
                    isBlack && styles.radioActiveGold,
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={isBlack ? "#000" : "#FFF"}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.radioInactive,
                    isBlack && styles.radioInactiveDark,
                  ]}
                />
              )}
            </View>
          </View>
          {isBlack && isSelected && <View style={styles.goldBorder} />}
        </Animated.View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.item.id === nextProps.item.id
    );
  }
);

const AppointmentTypeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();

  const { failedAppointmentType, barberId, services, totalPrice, date, time } =
    route.params;

  const appointmentTypes = failedAppointmentType
    ? allAppointmentTypes.filter((type) => type.name === "Express")
    : allAppointmentTypes;

  const [selectedType, setSelectedType] = useState(null);
  const [isTnCAccepted, setIsTnCAccepted] = useState(false);

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const isLowPriority =
    selectedType &&
    (selectedType.name === "Free" || selectedType.name === "Basic");

  // Optimized selection handler
  const handleSelectType = useCallback((type) => {
    setSelectedType(type);
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSendRequest = async () => {
    if (!selectedType) {
      showToast("Please select an appointment type", "warning");
      return;
    }
    if (!isTnCAccepted) {
      showToast("Please accept Terms & Conditions", "warning");
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/booking`,
        {
          barberId,
          services,
          totalPrice,
          date,
          time,
          appointmentType: selectedType.name,
        },
        { headers: { "x-auth-token": token }, timeout: 10000 } // Added timeout to prevent infinite hang
      );

      showToast("Request Sent Successfully!", "success");
      // Small delay to let user see the success toast
      setTimeout(() => {
        navigation.navigate("RequestSent", { bookingId: res.data._id });
      }, 500);
    } catch (err) {
      console.error("Booking Error:", err);

      // Network Error Handling (Safety)
      if (!err.response) {
        showToast("Network Error. Check your internet connection.", "error");
        return;
      }

      const errMsg = err.response?.data?.msg;

      if (
        err.response.status === 400 &&
        (errMsg === "This barber is fully booked for today." ||
          errMsg ===
            "This barber is fully booked with high priority appointments.")
      ) {
        navigation.navigate("AppointmentFull", {
          barberId,
          date,
          time,
          services,
          totalPrice,
          failedAppointmentType: selectedType.name,
        });
      } else {
        showToast(errMsg || "Failed to create booking. Try again.", "error");
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />

      {/* Toast Notification (Placed high z-index) */}
      <View style={styles.toastWrapper}>
        <ToastNotification
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </View>

      {/* Safe Area Wrapper */}
      <SafeAreaView style={styles.safeAreaTop} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitleMain}>Select Tier</Text>
        </View>
        <TouchableOpacity style={styles.helpIcon}>
          <Feather name="help-circle" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="never"
        removeClippedSubviews={true} // Performance Optimization
      >
        <Text style={styles.sectionHeader}>Choose Experience</Text>

        {appointmentTypes.map((item) => (
          <AnimatedCard
            key={item.id}
            item={item}
            isSelected={selectedType?.id === item.id}
            onPress={handleSelectType}
          />
        ))}

        <View style={styles.trustBadgeContainer}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color="#6B7280"
          />
          <Text style={styles.trustBadgeText}>100% Service Guarantee</Text>
        </View>

        {/* Spacer for Sticky Footer */}
        <View style={{ height: Platform.OS === "ios" ? 280 : 300 }} />
      </ScrollView>

      {/* --- STICKY FOOTER --- */}
      <View style={styles.stickyFooterWrapper}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.9)", "#FFF"]}
          style={styles.footerGradient}
          pointerEvents="none"
        />

        {/* 1. WARNING BANNER */}
        {isLowPriority && (
          <View style={styles.warningWrapper}>
            <View style={styles.warningContainer}>
              <View style={styles.warningIconBox}>
                <MaterialCommunityIcons
                  name="clock-alert-outline"
                  size={18}
                  color="#9A3412"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>
                  High Wait Times Expected
                </Text>
                <Text style={styles.warningText}>
                  Upgrade to Premium to skip the queue.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footerContent}>
          {/* 2. T&C CHECKBOX AREA */}
          <TouchableOpacity
            style={styles.tncContainer}
            activeOpacity={1}
            onPress={() => setIsTnCAccepted(!isTnCAccepted)}
          >
            <View
              style={[styles.checkbox, isTnCAccepted && styles.checkboxChecked]}
            >
              {isTnCAccepted && <Feather name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.tncText}>
              I agree to the{" "}
              <Text style={styles.tncLink}>Terms & Conditions</Text> and
              Cancellation Policy.
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 3. ACTION ROW */}
          <View style={styles.actionRow}>
            {/* Left: Price & Queue */}
            <View style={styles.priceColumn}>
              <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.totalAmount}>{totalPrice}</Text>
              </View>

              <TouchableOpacity
                style={styles.liveQueuePill}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("Appointmentcheckpage", {
                    barberData: { id: barberId },
                    selectedAppointmentType: selectedType
                      ? selectedType.name
                      : "Basic",
                    services,
                    totalPrice,
                    date,
                    time,
                  })
                }
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveQueueText}>View Live Queue</Text>
                <Feather name="chevron-right" size={12} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Right: Payment Button */}
            <TouchableOpacity
              onPress={handleSendRequest}
              activeOpacity={0.8}
              // Disabled logic removed to allow visual feedback (Toast)
              style={[
                styles.payButton,
                (!selectedType || !isTnCAccepted) && styles.payButtonDisabled,
                selectedType?.name === "Express" && styles.payButtonBlack,
              ]}
            >
              <Text
                style={[
                  styles.payButtonText,
                  selectedType?.name === "Express" &&
                    styles.payButtonTextGold,
                ]}
              >
                {selectedType ? "Confirm" : "Select"}
              </Text>
              {selectedType && isTnCAccepted && (
                <Feather
                  name="arrow-right"
                  size={18}
                  color={
                    selectedType?.name === "Express" ? "#FFD700" : "#FFF"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{ height: FOOTER_PADDING_BOTTOM, backgroundColor: "#FFF" }}
        />
      </View>
    </View>
  );
};

// =========================================================================
// RESPONSIVE STYLESHEET
// =========================================================================
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  // --- TOAST STYLES ---
  toastWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Super high to float above everything
    alignItems: "center",
    justifyContent: "center",
  },
  toastContainer: {
    position: "absolute",
    top: 0, // Animated to 40
    width: width * 0.9,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  safeAreaTop: {
    flex: 0,
    backgroundColor: "#F8FAFC",
  },
  header: {
    marginTop: 28,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
    zIndex: 5,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 1,
  },
  headerTitles: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  headerTitleMain: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  helpIcon: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
    letterSpacing: -0.5,
    paddingHorizontal: 4,
  },

  // --- CARD STYLES ---
  cardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  cardBlack: {
    borderColor: "#333",
    backgroundColor: "#000",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    zIndex: 2,
  },
  goldBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: "#FFD700",
    borderRadius: 16,
    opacity: 0.6,
    zIndex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerDefault: { backgroundColor: "#F1F5F9" },
  iconContainerSelected: { backgroundColor: "#D1FAE5" },
  iconContainerBlack: { backgroundColor: "rgba(255, 215, 0, 0.15)" },

  textContainer: { flex: 1, marginRight: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginRight: 8,
  },
  cardDesc: { fontSize: 12, color: "#64748B", lineHeight: 16, marginBottom: 4 },
  priceTag: { fontSize: 11, fontWeight: "700", color: "#10B981" },
  textGold: { color: "#FFD700" },
  textWhite: { color: "#FFF" },
  textGrayLight: { color: "#94A3B8" },

  badgePopular: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTextPopular: { fontSize: 9, fontWeight: "800", color: "#B45309" },
  badgeExclusive: {
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#FFD700",
  },
  badgeTextExclusive: { fontSize: 9, fontWeight: "800", color: "#FFD700" },

  radioContainer: { marginLeft: "auto" },
  radioInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  radioInactiveDark: { borderColor: "#475569" },
  radioActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActiveGold: { backgroundColor: "#FFD700" },

  trustBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    opacity: 0.8,
    marginBottom: 10,
  },
  trustBadgeText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
    fontWeight: "500",
  },

  // --- STICKY FOOTER ---
  stickyFooterWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 20,
  },
  footerGradient: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },

  // Warning Component
  warningWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  warningContainer: {
    backgroundColor: "#FFF7ED",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    flexDirection: "row",
    alignItems: "center",
  },
  warningIconBox: {
    marginRight: 12,
    backgroundColor: "#FFEDD5",
    padding: 6,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A3412",
  },
  warningText: {
    fontSize: 11,
    color: "#C2410C",
    flexWrap: "wrap",
  },

  footerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },

  // Terms & Conditions
  tncContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  tncText: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
    flexWrap: "wrap",
  },
  tncLink: {
    color: "#111",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceColumn: {
    flexDirection: "column",
  },
  totalLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  // View Queue Pill
  liveQueuePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  liveQueueText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginRight: 2,
  },

  // Main Button
  payButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 140,
    justifyContent: "center",
  },
  payButtonBlack: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  payButtonDisabled: {
    backgroundColor: "#94A3B8", // Changed slightly for better visual with toast interaction
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 8,
  },
  payButtonTextGold: {
    color: "#FFD700",
  },
});

export default AppointmentTypeScreen;
