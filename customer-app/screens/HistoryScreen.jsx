import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  Image,
  Dimensions,
  Easing,
} from "react-native";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  WifiOff,
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import api from "../utils/api";
import BottomNavBar from "../components/BottomNavBar";

// --- 1. OPTIMIZATION: Memoized Helper Functions ---
const getStatusStyle = (status, theme) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return { bg: "rgba(34, 197, 94, 0.1)", text: "#16A34A" };
    case "cancelled":
      return { bg: "rgba(239, 68, 68, 0.1)", text: "#DC2626" };
    case "pending":
      return { bg: "rgba(245, 158, 11, 0.1)", text: "#D97706" };
    case "confirmed":
      return { bg: "rgba(59, 130, 246, 0.1)", text: "#2563EB" };
    default:
      return { bg: theme.colors.border, text: theme.colors.textSecondary };
  }
};

const formatDateHeader = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM dd");
};

// --- 2. NEW COMPONENT: Modern Alert (Micro-interaction) ---
const ModernAlert = ({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animation In
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)), // Bouncy effect like Blinkit/Zomato
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        handleHide();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      handleHide();
    }
  }, [visible]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide && visible) onHide();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const getIcon = () => {
    if (type === "success") return <CheckCircle color="#fff" size={20} />;
    if (type === "error") return <AlertCircle color="#fff" size={20} />;
    return <WifiOff color="#fff" size={20} />;
  };

  const getBgColor = () => {
    if (type === "success") return "#10B981"; // Emerald Green
    if (type === "error") return "#EF4444"; // Red
    return "#3B82F6"; // Blue
  };

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: theme.colors.card, // Use card color for modern look
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        },
      ]}
    >
      <View style={[styles.alertIconType, { backgroundColor: getBgColor() }]}>
        {getIcon()}
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
          {type === "error" ? "Attention" : "Success"}
        </Text>
        <Text
          style={[styles.alertMessage, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleHide} style={styles.alertCloseBtn}>
        <X size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- 3. OPTIMIZATION: Memoized Trip Card ---
// Wrapped in React.memo to prevent re-rendering entire list on simple state changes
const AnimatedTripCard = React.memo(
  ({ trip, index, navigation, theme, styles }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 500,
        delay: Math.min(index * 50, 500), // Cap delay to prevent long waits on long lists
        useNativeDriver: true,
      }).start();
    }, []);

    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    const displayStatus =
      trip.status === "confirmed" && trip.paymentStatus === "pending"
        ? "Pending"
        : trip.status;
    const statusStyle = getStatusStyle(displayStatus, theme);

    return (
      <Animated.View
        style={{ opacity: animValue, transform: [{ translateY }] }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("BookingDetail", { booking: trip })
          }
          activeOpacity={0.9}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.timeBadge}>
                <Clock size={12} color={theme.colors.primary} />
                <Text style={[styles.timeText, { color: theme.colors.text }]}>
                  {trip.time}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.bg },
                ]}
              >
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {displayStatus}
                </Text>
              </View>
            </View>

            <View style={styles.mainInfoRow}>
              <Image
                source={require("../assets/GlossCut.png")}
                style={styles.avatar}
              />
              <View style={styles.infoCol}>
                <Text
                  style={[styles.barberName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {trip.barberId?.name || "Unknown Barber"}
                </Text>
                <View style={styles.subInfoRow}>
                  <Text
                    style={[
                      styles.serviceCount,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {trip.services.length} Service
                    {trip.services.length !== 1 ? "s" : ""}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: theme.colors.textSecondary },
                    ]}
                  />
                  <Text
                    style={[styles.priceText, { color: theme.colors.primary }]}
                  >
                    ₹{trip.totalPrice}
                  </Text>
                </View>
              </View>
              <View style={styles.arrowContainer}>
                <ChevronRight size={18} color={theme.colors.border} />
              </View>
            </View>

            <View
              style={[
                styles.dottedSeparator,
                { borderColor: theme.colors.textSecondary },
              ]}
            />

            <View style={styles.pillsRow}>
              {trip.services.slice(0, 3).map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </View>
              ))}

              {trip.services.length > 3 && (
                <View
                  style={[
                    styles.moreBadge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.moreText}>
                    +{trip.services.length - 3}
                  </Text>
                </View>
              )}
            </View>

            {trip.status === "cancelled" && trip.cancellationReason && (
              <View style={styles.cancellationRow}>
                <Text
                  style={[
                    styles.cancellationText,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  Reason: {trip.cancellationReason}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  // Custom comparison function for React.memo to prevent lag
  (prevProps, nextProps) => {
    return (
      prevProps.trip._id === nextProps.trip._id &&
      prevProps.trip.status === nextProps.trip.status
    );
  }
);

const HistoryScreen = () => {
  const { theme } = useTheme();
  const { user, token, isLoading: authIsLoading } = useAuth();
  const navigation = useNavigation();

  // State
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Alert State (Replaces generic Error Screen)
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  // Trigger Alert Helper
  const showAlert = (message, type = "error") => {
    setAlertConfig({ visible: true, message, type });
  };

  const groupTripsByDate = (trips) => {
    const grouped = trips.reduce((acc, trip) => {
      const dateKey = trip.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(trip);
      return acc;
    }, {});
    return Object.keys(grouped).map((date) => ({
      date,
      items: grouped[date],
    }));
  };

  const fetchTripHistory = async () => {
    try {
      const response = await api.get('/api/booking/history');
      const data = response.data;

      if (response.status === 200) {
        const now = new Date();
        const upcoming = [];
        const past = [];

        data.forEach((booking) => {
          const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
          if (
            (booking.status === "pending" ||
              booking.status === "confirmed") &&
            bookingDateTime > now
          ) {
            upcoming.push(booking);
          } else {
            past.push(booking);
          }
        });

        upcoming.sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
        );

        past.sort(
          (a, b) =>
            new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`)
        );

        setUpcomingTrips(upcoming);
        setPastTrips(past);
      } else {
        throw new Error(data.message || "Failed to fetch trip history");
      }
    } catch (error) {
      // Replaced setError logic with ModernAlert to keep page valid
      showAlert(
        error.message || "Internet connection appears to be offline",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authIsLoading) {
      if (user && token) {
        fetchTripHistory();
      } else {
        setLoading(false);
      }
    }
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, token, authIsLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripHistory();
  };

  const groupedUpcoming = useMemo(
    () => groupTripsByDate(upcomingTrips),
    [upcomingTrips]
  );
  const groupedPast = useMemo(() => groupTripsByDate(pastTrips), [pastTrips]);

  // Initial Loading State
  if (showAnimation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContainer}>
          <LottieView
            source={require("../assets/History.json")}
            autoPlay
            loop
            style={{ width: 250, height: 250 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Fallback Loading (Spinner)
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Alert Overlay - Placed here to float above everything */}
      <ModernAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        theme={theme}
      />

      <View
        style={[styles.header, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Bookings
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Handling Empty State Manually here inside ScrollView or standalone */}
      {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Calendar size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Bookings Found
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            You haven't made any appointments yet, or we couldn't fetch them.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onRefresh} // Changed to retry/refresh
          >
            <Text style={[styles.primaryButtonText, { color: "#fff" }]}>
              Refresh Page
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          // Remove clipping to help with smoothness
          removeClippedSubviews={Platform.OS === "android"}
        >
          {groupedUpcoming.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {groupedUpcoming.map((group) => (
                <View key={group.date} style={styles.dateGroupBlock}>
                  <View style={styles.dateHeaderRow}>
                    <View style={styles.dateHeaderDot} />
                    <Text style={styles.dateHeaderText}>
                      {formatDateHeader(group.date)}
                    </Text>
                  </View>
                  {group.items.map((trip, idx) => (
                    <AnimatedTripCard
                      key={trip._id}
                      trip={trip}
                      index={idx}
                      navigation={navigation}
                      theme={theme}
                      styles={styles}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}

          {groupedPast.length > 0 && (
            <View style={styles.sectionContainer}>
              {groupedPast.map((group) => (
                <View key={group.date} style={styles.dateGroupBlock}>
                  <View style={styles.dateHeaderRow}>
                    <View
                      style={[
                        styles.dateHeaderDot,
                        { backgroundColor: theme.colors.textSecondary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dateHeaderText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {formatDateHeader(group.date)}
                    </Text>
                  </View>
                  {group.items.map((trip, idx) => (
                    <AnimatedTripCard
                      key={trip._id}
                      trip={trip}
                      index={idx}
                      navigation={navigation}
                      theme={theme}
                      styles={styles}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar navigation={navigation} activeScreen="History" />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Modern Alert Styles ---
  alertContainer: {
    position: "absolute",
    top: 40, // Requested marginTop: 40
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    // Modern Shadows
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  alertIconType: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: "500",
  },
  alertCloseBtn: {
    padding: 5,
  },
  // --- Existing Styles ---
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
    color: "#666", // Fallback color
  },
  dateGroupBlock: {
    marginBottom: 16,
  },
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
    marginRight: 10,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginLeft: 18,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mainInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  barberName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  subInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
  },
  arrowContainer: {
    opacity: 0.3,
  },
  dottedSeparator: {
    height: 1,
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: "dashed",
    opacity: 0.3,
    marginVertical: 14,
    backgroundColor: "transparent",
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  moreBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  moreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60, // Added margin top for better centering in scroll
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
    opacity: 0.6,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cancellationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cancellationText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default HistoryScreen;
