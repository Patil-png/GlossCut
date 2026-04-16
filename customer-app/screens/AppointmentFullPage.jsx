import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  StatusBar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Gift,
  Circle,
  Star,
  Crown,
  Diamond,
  Clock,
  ChevronLeft,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  XCircle
} from "lucide-react-native";
import { format } from "date-fns";

const { width } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENT: Appointment Card ---
// Extracted and Memoized to prevent FlatList lag
const AppointmentCard = React.memo(({ item, theme, styles, getIcon }) => {
  let formattedDate = "N/A";
  if (
    item.date &&
    (typeof item.date === "string" || typeof item.date === "number")
  ) {
    const dateObj = new Date(item.date);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = format(dateObj, "MMM dd");
    }
  }

  const customerNameDisplay = item.isOfflineBooking
    ? item.customerName || "Offline Customer"
    : item.userId?.name || "Online Customer";

  const isBlackPremium = item.appointmentType === "Express";

  return (
    <View
      style={[
        styles.card,
        isBlackPremium && styles.highlightedCard,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {getIcon(item.appointmentType, theme)}
        </View>
        <View style={styles.cardTextContainer}>
          <Text
            style={[
              styles.customerName,
              { color: theme.colors.text },
              isBlackPremium && { fontWeight: "bold" },
            ]}
            numberOfLines={1}
          >
            {customerNameDisplay}
          </Text>
          <View style={styles.metaRow}>
            <Clock size={12} color={theme.colors.textSecondary || "#888"} />
            <Text
              style={[
                styles.metaText,
                { color: theme.colors.textSecondary || "#888" },
              ]}
            >
              {formattedDate} • {item.time || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.priceText, { color: theme.colors.text }]}>
          ₹{item.totalPrice || "0"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "confirmed"
                  ? "rgba(76, 175, 80, 0.1)"
                  : "rgba(255, 152, 0, 0.1)"
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "confirmed"
                    ? "#4CAF50"
                    : theme.colors.primary
              },
            ]}
          >
            {item.status || "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );
});

const AppointmentFullPage = () => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Safe param destructuring
  const params = route.params || {};
  const { barberId, date, time, services, totalPrice, failedAppointmentType } =
    params;

  // Memoize styles to prevent recalc on every render
  const styles = useMemo(() => getStyles(theme), [theme]);

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // --- TOAST STATE & REF ---
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: "",
    type: "success",
    title: ""
  });
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // --- DATA STATE ---
  const [barberAppointments, setBarberAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumAvailable, setIsPremiumAvailable] = useState(false);
  const [demoAppointments, setDemoAppointments] = useState(null);

  // --- TOAST FUNCTION ---
  const showToast = useCallback((title, message, type = "success") => {
    setToastConfig({ visible: true, message, type, title });

    // Animate In
    Animated.spring(toastAnim, {
      toValue: insets.top + (Platform.OS === 'android' ? 10 : 0),
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();

    // Auto Hide
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setToastConfig((prev) => ({ ...prev, visible: false }));
      });
    }, 4000);
  }, []);

  // Initial Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
    ]).start();
  }, []);

  // Validation
  const isDateValid =
    date &&
    (typeof date === "string" || typeof date === "number") &&
    !isNaN(new Date(date).getTime());
  const validDate = isDateValid ? date : null;

  // --- API CALLS ---
  useEffect(() => {
    if (!barberId || !validDate) return;

    const fetchData = async () => {
      try {
        const [appointmentsRes, premiumRes] = await Promise.allSettled([
          api.get(
            `/api/booking/barber-appointments/${barberId}`,
            {
              params: { date: validDate }
            }
          ),
          api.get(
            `/api/booking/check-premium-availability/${barberId}`,
            {
              params: { date: validDate }
            }
          ),
        ]);

        if (appointmentsRes.status === "fulfilled") {
          setBarberAppointments(appointmentsRes.value.data);
        } else {
          console.error("Fetch Apps Error", appointmentsRes.reason);
          showToast(
            "Connection Issue",
            "Could not load current queue.",
            "error"
          );
        }

        if (premiumRes.status === "fulfilled") {
          setIsPremiumAvailable(
            premiumRes.value.data.type === "premium" &&
            premiumRes.value.data.count > 0
          );
        }
      } catch (error) {
        console.error("General Fetch Error:", error);
        showToast(
          "Network Error",
          "Please check your internet connection.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [barberId, validDate, token, showToast]);

  const getAppointmentTypeIcon = useCallback(
    (appointmentType, currentTheme) => {
      switch (appointmentType) {
        case "Free":
          return <Gift size={18} color={currentTheme.colors.primary} />;
        case "Basic":
          return <Circle size={18} color={currentTheme.colors.primary} />;
        case "Premium":
          return <Star size={18} color="#FFD700" fill="#FFD700" />;
        case "Express":
          return <Crown size={18} color="#000" fill="#FFD700" />;
        default:
          return null;
      }
    },
    []
  );

  const handleBookPremium = async () => {
    try {
      const res = await api.post(
        `/api/booking`,
        {
          barberId,
          services,
          totalPrice,
          date,
          time,
          appointmentType: "Express"
        }
      );

      showToast("Success!", "VIP Booking Request Sent", "success");

      // Delay navigation slightly to let user see toast
      setTimeout(() => {
        navigation.navigate("RequestSent", { bookingId: res.data._id });
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Could not complete booking.";
      showToast("Booking Failed", errorMsg, "error");
    }
  };

  const runDemoSimulation = () => {
    const priority = ["Basic"];
    let bookings = [...barberAppointments];
    let bookingToCancel = null;

    for (const type of priority) {
      const targets = bookings.filter((b) => b.appointmentType === type);
      if (targets.length > 0) {
        bookingToCancel = targets[targets.length - 1];
        break;
      }
    }

    if (bookingToCancel) {
      bookings = bookings.filter((b) => b._id !== bookingToCancel._id);
    }

    const newBooking = {
      _id: "newBooking_" + Date.now(),
      userId: { name: "You" },
      appointmentType: "Express",
      date: date,
      time: time,
      totalPrice: totalPrice,
      status: "confirmed"
    };

    const blackPremiumApps = bookings.filter(
      (b) => b.appointmentType === "Express"
    );
    bookings.splice(blackPremiumApps.length, 0, newBooking);

    setDemoAppointments(bookings);
    showToast("Simulation Active", "You've jumped the queue!", "success");
  };

  // --- RENDER FUNCTIONS (Memoized) ---

  const renderHeader = useCallback(
    () => (
      <View>
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <AlertCircle size={16} color="#D32F2F" style={{ marginRight: 6 }} />
            <Text style={styles.heroBadgeText}>High Demand</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            Barber is Fully Booked
          </Text>
          <Text
            style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}
          >
            The slots for {failedAppointmentType} are full today.
          </Text>
        </View>

        {isPremiumAvailable && (
          <View style={styles.premiumCardContainer}>
            <View style={styles.premiumCardBg} />
            <View style={styles.premiumContent}>
              <View style={styles.premiumHeaderRow}>
                <Diamond size={24} color="#FFD700" fill="#FFD700" />
                <Text style={styles.premiumTitle}>VIP Access Available</Text>
              </View>
              <Text style={styles.premiumDesc}>
                Skip the line. Book an{" "}
                <Text style={{ fontWeight: "bold", color: "#FFD700" }}>
                  Express
                </Text>{" "}
                slot to instantly secure your spot.
              </Text>

              <TouchableOpacity
                style={[
                  styles.bookPremiumButton,
                  { backgroundColor: "#FFD700" },
                ]}
                onPress={handleBookPremium}
              >
                <Text style={styles.bookPremiumButtonText}>
                  Book Express
                </Text>
                <Crown size={18} color="#000" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.queueHeaderContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Current Queue
            </Text>
            <View
              style={[
                styles.liveBadge,
                { backgroundColor: "rgba(255,0,0,0.1)" },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: "red" }]} />
              <Text style={[styles.liveText, { color: "red" }]}>Live</Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [
      theme,
      isPremiumAvailable,
      failedAppointmentType,
      styles,
      handleBookPremium,
    ]
  );

  const renderFooter = useCallback(
    () => (
      <>
        {isPremiumAvailable && (
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: theme.colors.card }]}
              activeOpacity={0.7}
              onPress={runDemoSimulation}
            >
              <View style={styles.demoIconWrapper}>
                <View style={styles.playIconBg}>
                  <PlayCircle
                    size={24}
                    color="#2196F3"
                    fill="rgba(33, 150, 243, 0.2)"
                  />
                </View>
              </View>
              <View style={styles.demoTextContent}>
                <Text style={[styles.demoTitle, { color: theme.colors.text }]}>
                  See how it works
                </Text>
                <Text
                  style={[
                    styles.demoSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Tap to simulate the queue jump
                </Text>
              </View>
              <View
                style={[
                  styles.demoActionBadge,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.demoActionText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Try Demo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </>
    ),
    [theme, isPremiumAvailable, styles, runDemoSimulation]
  );

  // Handle Invalid Date State
  if (!isDateValid) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <AlertCircle size={50} color={theme.colors.error || "#ff4444"} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Oops! Something went wrong with the date.
        </Text>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* --- CUSTOM TOAST NOTIFICATION --- */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [{ translateY: toastAnim }],
            shadowColor: toastConfig.type === "error" ? "#ff4444" : "#4CAF50"
          },
        ]}
      >
        <View
          style={[
            styles.toastIcon,
            {
              backgroundColor:
                toastConfig.type === "error"
                  ? "rgba(255,68,68,0.1)"
                  : "rgba(76,175,80,0.1)"
            },
          ]}
        >
          {toastConfig.type === "error" ? (
            <XCircle size={24} color="#ff4444" />
          ) : (
            <CheckCircle2 size={24} color="#4CAF50" />
          )}
        </View>
        <View style={styles.toastContent}>
          <Text style={styles.toastTitle}>{toastConfig.title}</Text>
          <Text style={styles.toastMessage}>{toastConfig.message}</Text>
        </View>
      </Animated.View>

      {/* --- HEADER --- */}
      <View style={[styles.navHeader, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.colors.card }]}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {/* --- CONTENT --- */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 15, color: theme.colors.textSecondary }}>
            Checking queue availability...
          </Text>
        </View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY }]
          }}
        >
          <FlatList
            data={demoAppointments || barberAppointments}
            // Use the extracted memoized component
            renderItem={({ item }) => (
              <AppointmentCard
                item={item}
                theme={theme}
                styles={styles}
                getIcon={getAppointmentTypeIcon}
              />
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            // --- PERFORMANCE PROPS ---
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
          />
        </Animated.View>
      )}
    </View>
  );
};

// --- STYLES ---

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    // Toast Styles
    toastContainer: {
      position: "absolute",
      top: 0,
      left: 20,
      right: 20,
      zIndex: 9999,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)"
    },
    toastIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12
    },
    toastContent: {
      flex: 1
    },
    toastTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2
    },
    toastMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18
    },

    // Navigation Header
    navHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
      zIndex: 10
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        },
        android: { elevation: 3 }
      })
    },

    // Hero Section
    heroSection: {
      alignItems: "center",
      paddingHorizontal: 24,
      marginBottom: 24,
      marginTop: 10
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(211, 47, 47, 0.1)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12
    },
    heroBadgeText: {
      color: "#D32F2F",
      fontWeight: "600",
      fontSize: 12
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: -0.5
    },
    heroSubtitle: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22
    },

    // Premium Card
    premiumCardContainer: {
      marginHorizontal: 20,
      marginBottom: 30,
      borderRadius: 24,
      overflow: "hidden",
      position: "relative",
      backgroundColor: "#1A1A1A", // Luxury Dark BG
      ...Platform.select({
        ios: {
          shadowColor: "#FFD700",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8
        },
        android: { elevation: 8 }
      })
    },
    premiumContent: {
      padding: 24
    },
    premiumHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12
    },
    premiumTitle: {
      color: "#FFD700",
      fontSize: 20,
      fontWeight: "800",
      marginLeft: 10
    },
    premiumDesc: {
      color: "#E0E0E0",
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 24
    },
    bookPremiumButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      borderRadius: 16
    },
    bookPremiumButtonText: {
      color: "#000",
      fontWeight: "800",
      fontSize: 16
    },

    // Queue List Header
    queueHeaderContainer: {
      paddingHorizontal: 20,
      marginBottom: 10
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700"
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6
    },
    liveText: {
      fontSize: 12,
      fontWeight: "bold"
    },
    listContent: {
      paddingBottom: 40
    },

    // Appointment Card
    card: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.03)",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 3
        },
        android: { elevation: 1 }
      })
    },
    highlightedCard: {
      borderColor: "#FFD700",
      borderWidth: 1,
      backgroundColor: "#FFFDF0"
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12
    },
    cardTextContainer: {
      flex: 1
    },
    customerName: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center"
    },
    metaText: {
      fontSize: 12,
      marginLeft: 4
    },
    cardRight: {
      alignItems: "flex-end"
    },
    priceText: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6
    },
    statusText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase"
    },

    // Demo Section (Footer)
    footerContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40
    },
    demoCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)"
    },
    demoIconWrapper: {
      marginRight: 16
    },
    playIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#E3F2FD",
      justifyContent: "center",
      alignItems: "center"
    },
    demoTextContent: {
      flex: 1
    },
    demoTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 2
    },
    demoSubtitle: {
      fontSize: 13,
      opacity: 0.8
    },
    demoActionBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.1)",
      backgroundColor: "rgba(0,0,0,0.02)"
    },
    demoActionText: {
      fontSize: 12,
      fontWeight: "700"
    },

    // Error State
    errorText: {
      fontSize: 18,
      textAlign: "center",
      marginTop: 20,
      fontWeight: "600"
    },
    primaryButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 30
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700"
    }
  });

export default AppointmentFullPage;
