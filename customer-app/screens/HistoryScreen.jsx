import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
  Easing,
  Platform,
  StatusBar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  WifiOff,
  RefreshCw
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format, isToday, isYesterday } from "date-fns";
import api from "../utils/api";

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
const ModernAlert = ({ visible, message, type, onHide, theme, topInset }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animation In
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: topInset,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)), // Bouncy effect like Blinkit/Zomato
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
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
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
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
          elevation: 10
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
const TripCard = React.memo(
  ({ trip, index, navigation, theme, styles }) => {
    const translateY = 0;

    const displayStatus =
      trip.status === "confirmed" && trip.paymentStatus === "pending"
        ? "Pending"
        : trip.status;
    const statusStyle = getStatusStyle(displayStatus, theme);

    return (
      <View
        style={{ opacity: 1, transform: [{ translateY }] }}
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
                  {trip.barberId?.shopName || trip.barberId?.name || "Unknown Shop"}
                </Text>
                {trip.barberId?.shopName && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'DMSans_500Medium',
                      color: theme.colors.textSecondary,
                      marginBottom: 6,
                      marginTop: -2
                    }}
                    numberOfLines={1}
                  >
                    Served by <Text style={{ fontFamily: 'Syne_800ExtraBold', color: theme.colors.text }}>{trip.barberId?.name}</Text>
                  </Text>
                )}
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

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={[styles.pillsRow, { flex: 1 }]}>
                {trip.services.slice(0, 3).map((s, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border
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

              <TouchableOpacity
                style={[styles.rebookButton, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }]}
                activeOpacity={0.8}
                onPress={() => {
                  // Navigate to SearchScreen to show the shop modal
                  navigation.navigate("BarberSearch", {
                    selectedShopId: trip.barberId?._id || trip.barberId,
                    fromHistoryScreen: true
                  });
                }}
              >
                <Text style={[styles.rebookText, { fontSize: 11 }]}>Rebook</Text>
                <RefreshCw size={12} color="#000000" strokeWidth={2.5} />
              </TouchableOpacity>
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
                  <Text style={{ fontFamily: 'DMSans_700Bold' }}>Reason:</Text> {trip.cancellationReason}
                </Text>
              </View>
            )}


          </View>
        </TouchableOpacity>
      </View>
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

// --- 4. SKELETON LOADER (With Shimmer Animation) ---
const HistorySkeleton = React.memo(({ theme }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.linear
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ])
    ).start();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      {[1, 2, 3].map((i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { backgroundColor: theme.colors.card, opacity }]}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonBadge} />
          </View>
          <View style={styles.skeletonMain}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonInfoCol}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
            </View>
          </View>
          <View style={styles.skeletonFooter}>
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
});

const HistoryScreen = () => {
  const { theme } = useTheme();
  const { user, token, isLoading: authIsLoading } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // State
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Alert State (Replaces generic Error Screen)
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: "",
    type: "info"
  });

  // Trigger Alert Helper
  const showAlert = (message, type = "error") => {
    setAlertConfig({ visible: true, message, type });
  };

  const groupTripsByDate = (trips) => {
    if (!trips || trips.length === 0) return [];

    const grouped = trips.reduce((acc, trip) => {
      // Normalize date to YYYY-MM-DD to ensure consistent grouping
      // Handles both "YYYY-MM-DD" and full ISO strings
      let dateKey = trip.date;
      if (dateKey && dateKey.includes("T")) {
        dateKey = dateKey.split("T")[0];
      }

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(trip);
      return acc;
    }, {});

    // Sort dates descending (newest/future first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        items: grouped[date].sort((a, b) => {
          // Sort items within a date by time descending (latest time first)
          return b.time.localeCompare(a.time);
        }),
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
  }, [user, token, authIsLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripHistory();
  };

  const allGroupedTrips = useMemo(() => {
    const combined = [...upcomingTrips, ...pastTrips];
    return groupTripsByDate(combined);
  }, [upcomingTrips, pastTrips]);



  // Loading State with Skeleton
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.topSection}>
          <View style={[styles.locationRow, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Personal Records</Text>
              <Text style={styles.locationValue}>My Bookings</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 110, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <HistorySkeleton theme={theme} />
        </ScrollView>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Alert Overlay - Placed here to float above everything */}
      <ModernAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        theme={theme}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      {/* STICKY NAVBAR (Premium Anime-Tech) */}
      <View style={styles.topSection}>
        <View style={[styles.locationRow, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Personal Records</Text>
            <Text style={styles.locationValue}>My Bookings</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Spacer for Absolute Header */}
      <View style={{ height: insets.top + 110 }} />

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
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 60 }]}
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
          {allGroupedTrips.map((group, groupIdx) => (
            <View key={group.date} style={styles.dateGroupBlock}>
              <View style={styles.dateHeaderRow}>
                <View
                  style={[
                    styles.dateHeaderDot,
                    {
                      backgroundColor: isToday(new Date(group.date))
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.dateHeaderText,
                    { color: theme.colors.text },
                  ]}
                >
                  {formatDateHeader(group.date)}
                </Text>
              </View>

              <View style={styles.groupItemsContainer}>
                {group.items.map((trip, idx) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    index={idx}
                    navigation={navigation}
                    theme={theme}
                    styles={styles}
                  />
                ))}
              </View>

              {/* Day Separation Line */}
              {groupIdx < allGroupedTrips.length - 1 && (
                <View
                  style={[
                    styles.daySeparator,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // --- Modern Alert Styles ---
  alertContainer: {
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    // Modern Shadows
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  alertIconType: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  alertContent: {
    flex: 1
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: "500"
  },
  alertCloseBtn: {
    padding: 5
  },
  // --- Existing Styles ---
  // --- TOP SECTION (Premium Anime-Tech) ---
  topSection: {
    backgroundColor: '#0D0D0D', // Deeper black
    zIndex: 1000,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12
  },
  locationTextContainer: {
    flex: 1
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1.5, // Increased for professional look
    marginBottom: 1
  },
  locationValue: {
    fontSize: 20, // Slightly larger for impact
    fontFamily: 'Syne_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.2
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  sectionContainer: {
    marginBottom: 32
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
    marginBottom: 24
  },
  groupItemsContainer: {
    paddingLeft: 4, // Aligned with the header
  },
  daySeparator: {
    height: 1,
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.2
  },
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4
  },
  dateHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
    marginRight: 10
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "700"
  },
  card: {
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    padding: 16
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  mainInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    marginRight: 14
  },
  infoCol: {
    flex: 1
  },
  barberName: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 2,
    letterSpacing: -0.5
  },
  subInfoRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  serviceCount: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.3
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rebookButton: {
    backgroundColor: '#C8FF00', // Brand Lime
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  rebookText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  priceText: {
    fontSize: 16,
    fontFamily: 'Syne_700Bold',
  },
  arrowContainer: {
    opacity: 0.3
  },
  dottedSeparator: {
    height: 1,
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: "dashed",
    opacity: 0.3,
    marginVertical: 14,
    backgroundColor: "transparent"
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  pillText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
    opacity: 0.9
  },
  // --- Skeleton Styles ---
  skeletonCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    opacity: 0.5
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB'
  },
  skeletonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 14
  },
  skeletonInfoCol: {
    flex: 1
  },
  skeletonLine: {
    height: 16,
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#E5E7EB'
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12
  },
  skeletonPill: {
    width: 80,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#E5E7EB'
  },
  moreBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2
  },
  moreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF"
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
    marginBottom: 24
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
    opacity: 0.6
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700"
  },
  cancellationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)"
  },
  cancellationText: {
    fontSize: 12,
    fontStyle: "italic"
  }
});

export default HistoryScreen;
