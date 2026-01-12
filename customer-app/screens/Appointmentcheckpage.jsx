import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Gift,
  Circle,
  Star,
  Crown,
  Diamond,
  AlertTriangle,
  RefreshCw,
  Clock,
  IndianRupee,
  Scissors,
  Sparkles,
  User,
  CheckCircle2,
  Info,
} from "lucide-react-native";
import { format } from "date-fns";

// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

// --- 1. MODERN MACRO-INTERACTION ALERT COMPONENT (FIXED) ---
// Added 'styles' to the props receiving list
const TopToastAlert = ({ visible, message, type, onHide, theme, styles }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 40, // Margin Top 40 as requested
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }).start();

      const timer = setTimeout(() => {
        closeAlert();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      closeAlert();
    }
  }, [visible]);

  const closeAlert = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  if (!visible && translateY._value === -150) return null;

  let IconComponent = Info;
  let accentColor = "#3b82f6"; // Blue
  let bgColor = theme.dark ? "#1e293b" : "#ffffff";
  let textColor = theme.dark ? "#ffffff" : "#0f172a";

  if (type === "success") {
    IconComponent = CheckCircle2;
    accentColor = "#22c55e"; // Green
  } else if (type === "error") {
    IconComponent = AlertTriangle;
    accentColor = "#ef4444"; // Red
  }

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.toastContent,
          {
            backgroundColor: bgColor,
            shadowColor: theme.dark ? "#000" : "#64748b",
          },
        ]}
      >
        <View style={[styles.toastStrip, { backgroundColor: accentColor }]} />
        <View style={styles.toastIconBox}>
          <IconComponent size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.toastTitle, { color: textColor }]}>
            {type === "error"
              ? "Attention"
              : type === "success"
              ? "Success"
              : "Update"}
          </Text>
          <Text
            style={[styles.toastMessage, { color: theme.colors.textSecondary }]}
          >
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// --- LOGIC CONSTANTS (MATCHING BARBER APP) ---
const getAppointmentTypePriority = (appointment) => {
  let type = appointment.appointmentType || "Basic";
  if (appointment.isOfflineBooking) type = "Basic";
  const lowerCaseType = type.toLowerCase();
  if (lowerCaseType.includes("express")) return 1;
  if (lowerCaseType.includes("black")) return 2;
  if (lowerCaseType.includes("premium")) return 3;
  if (lowerCaseType.includes("basic")) return 4;
  return 5;
};

const getAppointmentStatusPriority = (status) => {
  if (status === 'started') return 0;
  if (status === 'confirmed' || status === 'pending') return 1;
  return 2; // completed, cancelled
};

const Appointmentcheckpage = ({ route }) => {
  const { theme } = useTheme();
  const { user, isLoading, token } = useAuth();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  // --- ALERT STATE ---
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((type, message) => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // --- DATA EXTRACTION ---
  const {
    barberData,
    salonData,
    providerData,
    selectedAppointmentType,
    services,
    totalPrice,
    date,
    time,
  } = route.params || {};

  const serviceProvider = barberData || salonData || providerData;
  const barberId = serviceProvider?.id;
  // Memoize date to prevent recalculations
  const effectiveDate = useMemo(
    () => date || format(new Date(), "yyyy-MM-dd"),
    [date]
  );

  const styles = useMemo(() => getStyles(theme), [theme]);

  // --- OPTIMIZED SORTING LOGIC ---
  const sortAppointments = useCallback((appointments) => {
    return [...appointments].sort((a, b) => {
      // 1. Status Priority
      const statusAPriority = getAppointmentStatusPriority(a.status);
      const statusBPriority = getAppointmentStatusPriority(b.status);
      if (statusAPriority !== statusBPriority)
        return statusAPriority - statusBPriority; // Lower number = higher priority

      // 2. Type Priority
      const typeAPriority = getAppointmentTypePriority(a);
      const typeBPriority = getAppointmentTypePriority(b);
      if (typeAPriority !== typeBPriority) return typeAPriority - typeBPriority; // Lower number = higher priority

      // 3. Time Comparison (Optimized string comparison for ISO/HH:mm format)
      // Assuming time is "HH:mm", simple string comparison works and is faster than new Date()
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });
  }, []);

  const [barberAppointments, setBarberAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LIVE INDICATOR ANIMATION ---
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // --- OPTIMIZED API FETCHING WITH CACHING ---
  const fetchBarberAppointments = useCallback(async () => {
    if (!barberId || !token) {
      setLoading(false);
      return;
    }


    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber-appointments/${barberId}`,
        {
          headers: { "x-auth-token": token },
          params: { date: effectiveDate },
          timeout: 10000, // 10 second timeout to prevent hanging
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];
      setBarberAppointments(data);
    } catch (error) {
      console.error("Queue Sync Error:", error);
      let errorMsg = "Could not sync the queue.";

      if (error.message === "Network Error" || !error.response) {
        errorMsg = "Internet seems to be offline.";
      }

      // NON-BLOCKING MODERN ALERT
      showToast("error", errorMsg);
      // Ensure app doesn't crash, just keep old data or empty array
      if (barberAppointments.length === 0) setBarberAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [barberId, token, effectiveDate, showToast, barberAppointments.length]);

  useEffect(() => {
    if (!isLoading) {
      fetchBarberAppointments();
    }
  }, [isLoading, fetchBarberAppointments]);

  // --- MEMOIZED QUEUE CALCULATION (PERFORMANCE FIX) ---
  const { displayedAppointments, overallQueuePosition } = useMemo(() => {
    let combinedAppointments = [...barberAppointments];
    let userIndex = null;
    let actualUserBooking = null;

    // Check for real booking
    if (user) {
      actualUserBooking = barberAppointments.find(
        (apt) => apt.userId?._id === user._id && !apt.isDemo
      );
    }

    // Logic to insert Demo User if needed
    if (
      !actualUserBooking &&
      selectedAppointmentType &&
      services &&
      totalPrice &&
      date &&
      time &&
      user
    ) {
      const stableDemoId = `demo-${user._id}-${selectedAppointmentType}-${date}-${time}`;
      const mockAppointment = {
        _id: stableDemoId,
        userId: { _id: user._id, name: user.name || "You (Demo)" },
        appointmentType: selectedAppointmentType,
        services: services,
        totalPrice: totalPrice,
        date: date,
        time: time,
        isDemo: true,
        status: "Pending (Demo)",
      };

      // Only add if not duplicate
      if (!combinedAppointments.some((apt) => apt._id === stableDemoId)) {
        combinedAppointments.push(mockAppointment);
      }
    }

    // Filter to match barber app logic: only include pending, confirmed, started, completed, and paymentStatus !== failed
    const filteredAppointments = combinedAppointments.filter(
      (appointment) =>
        ["pending", "confirmed", "started", "completed"].includes(
          appointment.status
        ) && appointment.paymentStatus !== "failed"
    );

    // Sort
    const sorted = sortAppointments(filteredAppointments);

    // Find position
    if (user) {
      const targetId = actualUserBooking
        ? user._id
        : `demo-${user._id}-${selectedAppointmentType}-${date}-${time}`;
      const foundIndex = sorted.findIndex(
        (apt) => apt._id === targetId || apt.userId?._id === user._id
      );
      userIndex = foundIndex !== -1 ? foundIndex + 1 : null;
    }

    return {
      displayedAppointments: sorted,
      overallQueuePosition: userIndex,
    };
  }, [
    barberAppointments,
    user,
    selectedAppointmentType,
    services,
    totalPrice,
    date,
    time,
    sortAppointments,
  ]);

  // --- UI HELPERS ---
  const getAppointmentTypeIcon = (appointmentType) => {
    let IconComponent;
    let color;
    let size = 14;

    switch (appointmentType) {
      case "Free":
        IconComponent = Gift;
        color = theme.colors.text;
        break;
      case "Basic":
        IconComponent = Circle;
        color = theme.colors.textSecondary;
        break;
      case "Premium":
        IconComponent = Star;
        color = "#F59E0B";
        size = 16;
        break;
      case "Express":
        IconComponent = Crown;
        color = theme.colors.text;
        size = 16;
        break;
      default:
        IconComponent = Diamond;
        color = theme.colors.primary;
    }
    return (
      <IconComponent size={size} color={color} style={{ marginRight: 6 }} />
    );
  };

  const getStatusDisplay = (status) => {
    let statusColor = "#64748B";
    let statusBgColor = "#F1F5F9";
    let statusText = status;

    switch (status) {
      case "started":
        statusColor = "#2563eb";
        statusBgColor = "#dbeafe";
        statusText = "In Progress";
        break;
      case "confirmed":
        statusColor = "#15803d";
        statusBgColor = "#dcfce7";
        statusText = "Confirmed";
        break;
      case "pending":
      case "Pending":
      case "Pending (Demo)":
        statusColor = "#b45309";
        statusBgColor = "#fef3c7";
        statusText = "Waiting";
        break;
      case "completed":
        statusColor = "#64748B";
        statusBgColor = "#F1F5F9";
        statusText = "Completed";
        break;
      case "cancelled":
        statusColor = "#b91c1c";
        statusBgColor = "#fee2e2";
        statusText = "Cancelled";
        break;
    }

    return (
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: theme.dark
              ? "rgba(255,255,255,0.08)"
              : statusBgColor,
            borderColor: theme.dark ? "transparent" : statusBgColor,
          },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text
          style={[
            styles.statusText,
            { color: theme.dark ? "#e2e8f0" : statusColor },
          ]}
        >
          {statusText}
        </Text>
      </View>
    );
  };

  // --- RENDER ITEM (Optimized with useCallback) ---
  const renderAppointmentItem = useCallback(
    ({ item, index }) => {
      let formattedTime = item.time || "N/A";
      const customerNameDisplay = item.isOfflineBooking
        ? item.customerName || "In-Store Customer"
        : item.userId?.name || `Guest #${index + 1}`;

      const isCurrentUser = item.userId?._id === user?._id && !item.isDemo;
      const isDemoAppointment = item.isDemo;
      const isMe = isCurrentUser || isDemoAppointment;

      const cardColors = isMe
        ? theme.dark
          ? [theme.colors.primary, "#4338ca"]
          : ["#eff6ff", "#e0e7ff"]
        : theme.dark
        ? [theme.colors.card, theme.colors.card]
        : ["#ffffff", "#ffffff"];

      const cardBorderColor = isMe
        ? theme.colors.primary
        : theme.dark
        ? "rgba(255,255,255,0.05)"
        : "#e2e8f0";

      return (
        <View style={styles.cardWrapper}>
          <View style={styles.timelineContainer}>
            <View
              style={[
                styles.timelineLine,
                {
                  backgroundColor: isMe
                    ? theme.colors.primary
                    : theme.colors.border,
                  opacity: 0.4,
                },
              ]}
            />
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: isMe
                    ? theme.colors.primary
                    : theme.dark
                    ? "#334155"
                    : "#cbd5e1",
                  borderColor: theme.colors.background,
                  transform: [{ scale: isMe ? 1.2 : 1 }],
                },
              ]}
            >
              <Text
                style={[
                  styles.timelineIndex,
                  { color: isMe ? "#fff" : theme.colors.textSecondary },
                ]}
              >
                {index + 1}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={cardColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.appointmentCard,
              { borderColor: cardBorderColor, borderWidth: isMe ? 1.5 : 1 },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: isMe
                          ? theme.colors.primary + "20"
                          : theme.colors.background,
                      },
                    ]}
                  >
                    <User
                      size={16}
                      color={
                        isMe ? theme.colors.primary : theme.colors.textSecondary
                      }
                    />
                  </View>
                  <View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={[
                          styles.customerName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {isMe ? "You" : customerNameDisplay}
                      </Text>
                      {isMe && (
                        <View style={styles.meBadge}>
                          <Text style={styles.meBadgeText}>ME</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.subInfoRow}>
                      {getAppointmentTypeIcon(item.appointmentType)}
                      <Text
                        style={[
                          styles.subInfoText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {item.appointmentType}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Text
                    style={[styles.timeTextBig, { color: theme.colors.text }]}
                  >
                    {formattedTime}
                  </Text>
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Estimated
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.cardDivider,
                  {
                    backgroundColor: theme.dark
                      ? "rgba(255,255,255,0.05)"
                      : "#f1f5f9",
                  },
                ]}
              />

              <View style={styles.cardFooter}>
                {getStatusDisplay(item.status)}
                {item.totalPrice && (
                  <Text style={[styles.priceTag, { color: theme.colors.text }]}>
                    ₹{item.totalPrice}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    },
    [theme, user, displayedAppointments.length, styles]
  ); // Added styles to dependency array

  // --- LOADING STATE ---
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Syncing Queue...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- ERROR STATE ---
  if (!barberId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorIconBg}>
            <AlertTriangle size={32} color="#ef4444" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Details Unavailable
          </Text>
          <Text
            style={[styles.errorDesc, { color: theme.colors.textSecondary }]}
          >
            We couldn't retrieve the provider's schedule info.
          </Text>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        {/* Pass styles here to fix the crash */}
        <TopToastAlert
          visible={true}
          type="error"
          message="Invalid Provider ID"
          theme={theme}
          styles={styles}
        />
      </SafeAreaView>
    );
  }

  // --- MAIN RENDER ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* GLOBAL TOAST ALERT (FIXED: Passing styles) */}
      <TopToastAlert
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        theme={theme}
        styles={styles}
      />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, { opacity: fadeAnim }]} />
            <Text style={styles.liveText}>LIVE UPDATES</Text>
          </View>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            Today's Queue
          </Text>
          <Text
            style={[styles.dateSubtext, { color: theme.colors.textSecondary }]}
          >
            {format(new Date(effectiveDate), "EEEE, d MMMM")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            fetchBarberAppointments();
            showToast("info", "Refreshing list...");
          }}
          style={[
            styles.refreshButton,
            { backgroundColor: theme.dark ? "#1e293b" : "#f1f5f9" },
          ]}
        >
          <RefreshCw size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. THE GOLDEN TICKET (USER SUMMARY) */}
      {selectedAppointmentType && (
        <View style={styles.ticketWrapper}>
          <LinearGradient
            colors={
              theme.dark ? ["#4338ca", "#312e81"] : ["#2563eb", "#1d4ed8"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ticketContainer}
          >
            <View style={styles.ticketGlow} />
            <Sparkles
              size={80}
              color="#fff"
              style={{
                position: "absolute",
                right: -20,
                top: -20,
                opacity: 0.15,
              }}
            />

            <View style={styles.ticketTopSection}>
              <View style={styles.ticketHeaderRow}>
                <View style={styles.ticketPill}>
                  <Text style={styles.ticketPillText}>ENTRY TICKET</Text>
                </View>
                <Image
                  source={{
                    uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GlossCut",
                  }}
                  style={styles.qrPlaceholder}
                />
              </View>

              <View style={styles.queueDisplay}>
                <Text style={styles.queueLabel}>CURRENT POSITION</Text>
                <Text style={styles.queueNumber}>
                  {overallQueuePosition !== null
                    ? String(overallQueuePosition).padStart(2, "0")
                    : "--"}
                </Text>
                <View style={styles.inLineBadge}>
                  <Text style={styles.inLineText}>
                    People ahead:{" "}
                    {overallQueuePosition ? overallQueuePosition - 1 : 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ripContainer}>
              <View
                style={[
                  styles.ripCircle,
                  { left: -12, backgroundColor: theme.colors.background },
                ]}
              />
              <View style={styles.dashedLine} />
              <View
                style={[
                  styles.ripCircle,
                  { right: -12, backgroundColor: theme.colors.background },
                ]}
              />
            </View>

            <View style={styles.ticketBottomSection}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Clock size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>TIME</Text>
                  <Text style={styles.detailValue}>{time}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <IndianRupee size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>AMOUNT</Text>
                  <Text style={styles.detailValue}>{totalPrice}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconBg}>
                  <Scissors size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>SERVICE</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {selectedAppointmentType}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          <View
            style={[
              styles.ticketShadow,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      )}

      {/* 3. MAIN LIST */}
      <View style={styles.listContainer}>
        {displayedAppointments.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/7486/7486744.png",
              }}
              style={{
                width: 120,
                height: 120,
                opacity: 0.8,
                marginBottom: 20,
              }}
            />
            <Text
              style={[styles.emptyStateTitle, { color: theme.colors.text }]}
            >
              Queue is Clear
            </Text>
            <Text
              style={[
                styles.emptyStateDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              No bookings yet for today. Your path is clear to be the first!
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            // --- FLATLIST OPTIMIZATIONS ---
            removeClippedSubviews={true}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
            // -----------------------------
            ListHeaderComponent={
              <View style={styles.listHeaderContainer}>
                <Text
                  style={[
                    styles.listHeaderTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  UPCOMING APPOINTMENTS
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: theme.dark ? "#334155" : "#e2e8f0" },
                  ]}
                >
                  <Text
                    style={[styles.countText, { color: theme.colors.text }]}
                  >
                    {displayedAppointments.length}
                  </Text>
                </View>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// --- PREMIUM STYLING SYSTEM ---
const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    // Alert Toast Styles
    toastContainer: {
      position: "absolute",
      top: 0,
      left: 20,
      right: 20,
      zIndex: 999, // High zIndex to float over everything
    },
    toastContent: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 0,
      overflow: "hidden",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
      minHeight: 60,
    },
    toastStrip: {
      width: 6,
      height: "100%",
    },
    toastIconBox: {
      paddingHorizontal: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    toastTitle: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 2,
    },
    toastMessage: {
      fontSize: 12,
      fontWeight: "500",
      paddingRight: 10,
      marginBottom: 2,
    },

    // Header
    header: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "android" ? 40 : 10,
      paddingBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    liveIndicatorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#ef4444",
      marginRight: 6,
    },
    liveText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#ef4444",
      letterSpacing: 0.5,
    },
    pageTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    dateSubtext: { fontSize: 14, fontWeight: "500", marginTop: 2 },
    refreshButton: {
      padding: 12,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },

    // Ticket Styles
    ticketWrapper: { paddingHorizontal: 24, marginBottom: 25, marginTop: 5 },
    ticketContainer: {
      borderRadius: 24,
      overflow: "hidden",
      position: "relative",
      zIndex: 2,
    },
    ticketGlow: {
      position: "absolute",
      top: -50,
      left: -50,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: "rgba(255,255,255,0.1)",
      blurRadius: 20,
    },
    ticketTopSection: { padding: 24, paddingBottom: 20 },
    ticketHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    ticketPill: {
      backgroundColor: "rgba(0,0,0,0.2)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    ticketPillText: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
    },
    qrPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 4,
      opacity: 0.8,
      tintColor: "white",
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    queueDisplay: { alignItems: "center", marginTop: 5 },
    queueLabel: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 2,
      marginBottom: 4,
    },
    queueNumber: {
      color: "#ffffff",
      fontSize: 64,
      fontWeight: "800",
      lineHeight: 70,
      letterSpacing: -2,
      fontVariant: ["tabular-nums"],
      textShadowColor: "rgba(0,0,0,0.2)",
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 10,
    },
    inLineBadge: {
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 4,
    },
    inLineText: { color: "#fff", fontSize: 12, fontWeight: "600" },

    // Rip Section
    ripContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 24,
      position: "relative",
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    ripCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      position: "absolute",
      top: 0,
      zIndex: 10,
    },
    dashedLine: {
      width: "84%",
      height: 1,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderStyle: "dashed",
      borderRadius: 1,
    },

    // Bottom Section
    ticketBottomSection: {
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "rgba(0,0,0,0.1)",
    },
    detailItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    detailIconBg: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
    detailLabel: {
      color: "rgba(255,255,255,0.5)",
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    detailValue: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      maxWidth: 70,
    },
    ticketShadow: {
      position: "absolute",
      bottom: -10,
      left: 20,
      right: 20,
      height: 40,
      borderRadius: 20,
      opacity: 0.3,
      zIndex: 1,
      transform: [{ scaleX: 0.9 }],
    },

    // List Styling
    listContainer: {
      flex: 1,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: theme.dark ? "#0f172a" : "#f8fafc",
      overflow: "hidden",
    },
    flatListContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 100,
    },
    listHeaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    listHeaderTitle: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      opacity: 0.6,
    },
    countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    countText: { fontSize: 11, fontWeight: "700" },

    // Cards
    cardWrapper: { flexDirection: "row", marginBottom: 0, minHeight: 110 },
    timelineContainer: { width: 40, alignItems: "center", marginRight: 12 },
    timelineLine: { width: 2, flex: 1, borderRadius: 1 },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 3,
      position: "absolute",
      top: 24,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    timelineIndex: { fontSize: 10, fontWeight: "800" },
    appointmentCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardContent: { gap: 12 },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    userInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    customerName: { fontSize: 16, fontWeight: "700", maxWidth: 140 },
    meBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 6,
    },
    meBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    subInfoRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
    subInfoText: { fontSize: 13, fontWeight: "500" },
    timeContainer: { alignItems: "flex-end" },
    timeTextBig: { fontSize: 15, fontWeight: "700" },
    timeLabel: { fontSize: 11 },
    cardDivider: { height: 1, width: "100%" },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      borderWidth: 1,
      gap: 6,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "700" },
    priceTag: { fontSize: 15, fontWeight: "700" },

    // Empty State & Error
    emptyStateContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
    },
    emptyStateTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
    emptyStateDesc: {
      textAlign: "center",
      maxWidth: 260,
      lineHeight: 22,
      fontSize: 15,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
    },
    errorIconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#fee2e2",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    errorTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
    errorDesc: { textAlign: "center", fontSize: 16, marginBottom: 30 },
    backButton: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
    },
    backButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    loadingText: { marginTop: 16, fontWeight: "600" },
  });

export default Appointmentcheckpage;
