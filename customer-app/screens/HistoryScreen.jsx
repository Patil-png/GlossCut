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
  StatusBar,
  SectionList
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from 'expo-blur';
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
          style={[styles.card, { backgroundColor: "#fffdfbff" }]}
        >
          <View style={styles.cardContent}>
            {/* Card Header removed (Time removed, Status moved inline) */}

            <View style={styles.mainInfoRow}>
              <Image
                source={require("../assets/GlossCut.png")}
                style={styles.avatar}
              />
              <View style={styles.infoCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text
                    style={[styles.barberName, { color: theme.colors.text, flexShrink: 1, marginBottom: 0 }]}
                    numberOfLines={1}
                  >
                    {trip.barberId?.shopName || trip.barberId?.name || "Unknown Shop"}
                  </Text>
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
  const [hasError, setHasError] = useState(false);

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
        data: grouped[date].sort((a, b) => {
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
        setHasError(false);
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
      setHasError(true);
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
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Alert Overlay - Placed here to float above everything */}
      <ModernAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        theme={theme}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      {/* STICKY NAVBAR (Glassmorphic Premium) */}
      <View style={styles.topSection}>
        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[styles.locationRow, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Personal Records</Text>
            <Text style={styles.locationValue}>My Bookings</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("ScheduleNextAppointment")}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Calendar size={20} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacer for Absolute Header */}
      <View style={{ height: insets.top + 85 }} />

      {/* Handling Empty/Error States */}
      {hasError ? (
        <View style={styles.errorStateContainer}>
          <View style={styles.errorIconOuterCircle}>
            <View style={styles.errorIconInnerCircle}>
              <WifiOff size={36} color="#9B1C1C" />
            </View>
          </View>
          <Text style={styles.errorTitleText}>Connection Offline</Text>
          <Text style={styles.errorSubtitleText}>
            We couldn't sync your bookings. Please check your internet connection or try again.
          </Text>
          <TouchableOpacity
            style={styles.errorRetryButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.errorRetryButtonText}>Retry Connection</Text>
            <RefreshCw size={14} color="#1A1A1A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ) : upcomingTrips.length === 0 && pastTrips.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconOuterCircle}>
            <View style={styles.emptyIconInnerCircle}>
              <Calendar size={36} color="#1A1A1A" />
            </View>
          </View>
          <Text style={styles.emptyTitleText}>No Grooming Sessions</Text>
          <Text style={styles.emptySubtitleText}>
            Your booked services, queue progress, and styling history will appear here once you schedule an appointment.
          </Text>
          <TouchableOpacity
            style={styles.emptyBookButton}
            onPress={() => navigation.navigate("ScheduleNextAppointment")}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBookButtonText}>Book Your First Session</Text>
            <ChevronRight size={18} color="#C8FF00" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={allGroupedTrips}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <View style={styles.groupItemsContainer}>
              <TripCard
                trip={item}
                index={index}
                navigation={navigation}
                theme={theme}
                styles={styles}
              />
            </View>
          )}
          renderSectionHeader={({ section: { date } }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>
                  {formatDateHeader(date)}
                </Text>
              </View>
              <View style={styles.headerLine} />
            </View>
          )}
          SectionSeparatorComponent={() => (
            <View
              style={[
                styles.daySeparator,
                { backgroundColor: theme.colors.border },
              ]}
            />
          )}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 60 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
        />
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent for blur effect
    zIndex: 1000,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16
  },
  locationTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  locationLabel: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 0
  },
  locationValue: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold', // Consistent bold font
    color: '#0F172A',
    letterSpacing: -0.5
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4
  },
  headerPill: {
    backgroundColor: '#eeeeeeff', // Darker grey for better contrast
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 7, 7, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerPillText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', // Bolder font for date headers
    color: '#1A1A1A',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(30, 29, 29, 0.2)', // Darker line for better visibility
    borderRadius: 1
  },
  card: {
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
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
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4
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
    elevation: 4,
    flexShrink: 0 // Prevent button from collapsing on small screens
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
    fontFamily: 'DMSans_500Medium',
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
    fontFamily: 'DMSans_700Bold',
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
    fontFamily: 'DMSans_700Bold',
    marginBottom: 10
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 80,
  },
  emptyIconOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0EFE9',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#E8E7E2',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#E8E7E2',
  },
  emptyTitleText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtitleText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#606058',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  emptyBookButton: {
    height: 52,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyBookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  errorStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 80,
  },
  errorIconOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FDF2F2',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#FDE8E8',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  errorIconInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#FDE8E8',
  },
  errorTitleText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#9B1C1C',
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  errorSubtitleText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#606058',
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  errorRetryButton: {
    height: 52,
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  errorRetryButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  cancellationRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)"
  },
  cancellationText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    fontStyle: "italic"
  }
});

export default HistoryScreen;
