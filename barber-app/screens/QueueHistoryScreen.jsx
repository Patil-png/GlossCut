import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Gift,
  Circle,
  Star,
  Crown,
  ChevronLeft,
  Calendar,
  Clock,
  MoreHorizontal,
  ChevronDown, // Added ChevronDown for the date picker
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { format, parse } from "date-fns";

// ... [Keep your existing helper functions: getAppointmentTypeMeta, getStatusConfig, and AppointmentCard here] ...

// --- RE-INSERTED HELPERS FOR COMPLETENESS ---
const getAppointmentTypeMeta = (appointmentType, theme) => {
  const size = 16;
  switch (appointmentType) {
    case "Free":
      return {
        icon: <Gift size={size} color={theme.colors.info} />,
        color: theme.colors.info,
        bg: theme.colors.info + "15",
      };
    case "Basic":
      return {
        icon: <Circle size={size} color={theme.colors.textSecondary} />,
        color: theme.colors.textSecondary,
        bg: theme.colors.textSecondary + "15",
      };
    case "Premium":
      return {
        icon: <Star size={size} color="#FFD700" fill="#FFD700" />,
        color: "#FFD700",
        bg: "#FFD70020",
        isPremium: true,
      };
    case "Black Premium":
      return {
        icon: <Crown size={size} color="#1A1A1A" fill="#D4AF37" />,
        color: "#D4AF37",
        bg: "#1A1A1A",
        isBlack: true,
      };
    default:
      return {
        icon: <Circle size={size} color={theme.colors.textSecondary} />,
        color: theme.colors.textSecondary,
        bg: theme.colors.card,
      };
  }
};

const getStatusConfig = (status, theme) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        color: theme.colors.success,
        bg: theme.colors.success + "15",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: theme.colors.danger,
        bg: theme.colors.danger + "10",
      };
    case "started":
      return {
        label: "In Progress",
        color: theme.colors.primary,
        bg: theme.colors.primary + "15",
      };
    default:
      return {
        label: status,
        color: theme.colors.textSecondary,
        bg: theme.colors.textSecondary + "10",
      };
  }
};

const AppointmentCard = ({
  item,
  sectionKey,
  activeSection,
  theme,
  navigation,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const displayIndex =
    sectionKey === "active"
      ? activeSection.findIndex((app) => app._id === item._id) + 1
      : null;
  const typeMeta = getAppointmentTypeMeta(item.appointmentType, theme);
  const statusConfig = getStatusConfig(item.status, theme);
  const customerName = item.isOfflineBooking
    ? item.customerName
    : item.userId
    ? item.userId.name
    : "Unknown";
  let displayTime = "N/A";
  try {
    displayTime = format(new Date(item.date), "h:mm a");
  } catch (e) {}

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() =>
        navigation.navigate("AppointmentDetail", {
          appointment: item,
          activeAppointments: activeSection,
        })
      }
    >
      <Animated.View
        style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
            typeMeta.isBlack && styles.blackPremiumCard,
          ]}
        >
          <View
            style={[
              styles.cardLeftStrip,
              {
                backgroundColor: typeMeta.isBlack
                  ? "#D4AF37"
                  : theme.colors.background,
              },
            ]}
          >
            {displayIndex ? (
              <View style={styles.queueBadge}>
                <Text
                  style={[
                    styles.queueLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Q
                </Text>
                <Text
                  style={[styles.queueNumber, { color: theme.colors.primary }]}
                >
                  {displayIndex}
                </Text>
              </View>
            ) : (
              <Calendar size={20} color={theme.colors.textSecondary} />
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.customerName,
                  { color: typeMeta.isBlack ? "#FFF" : theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {customerName}
              </Text>
              <Text
                style={[
                  styles.priceTag,
                  {
                    color: typeMeta.isBlack ? "#D4AF37" : theme.colors.primary,
                  },
                ]}
              >
                ₹{item.totalPrice}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: typeMeta.bg,
                    borderColor: typeMeta.color,
                    borderWidth: 0.5,
                  },
                ]}
              >
                {typeMeta.icon}
                <Text
                  style={[
                    styles.typeText,
                    { color: typeMeta.isBlack ? "#D4AF37" : typeMeta.color },
                  ]}
                >
                  {item.appointmentType}
                </Text>
              </View>
              {item.isOfflineBooking && (
                <View style={styles.offlineTag}>
                  <Text style={styles.offlineText}>OFFLINE</Text>
                </View>
              )}
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.timeContainer}>
                <Clock
                  size={14}
                  color={typeMeta.isBlack ? "#AAA" : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: typeMeta.isBlack
                        ? "#AAA"
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {displayTime}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusConfig.bg },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: statusConfig.color }]}
                >
                  {statusConfig.label.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---
const QueueHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ... [Keep your existing fetchAppointments and onRefresh logic exactly as is] ...
  // (Pasting the fetching logic briefly for context in this snippet)
  const fetchAppointments = async (date) => {
    setLoading(true);
    if (!user || typeof user._id !== "string") {
      setLoading(false);
      return;
    }
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber-appointments/${user._id}?date=${formattedDate}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Simplified sort for brevity in display
        const sorted = data
          .filter((b) =>
            ["pending", "confirmed", "started", "completed"].includes(b.status)
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setAppointments(sorted);
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user._id) fetchAppointments(selectedDate);
  }, [selectedDate, user]);
  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(selectedDate);
  };

  const pendingSection = appointments.filter(
    (app) => app.status === "pending" || app.paymentStatus === "pending"
  );
  const activeSection = appointments.filter(
    (app) =>
      (app.status === "confirmed" || app.status === "started") &&
      (app.isOfflineBooking || app.paymentStatus !== "pending")
  );
  const completedSection = appointments.filter(
    (app) => app.status === "completed"
  );

  const sectionsData = useMemo(
    () =>
      [
        { title: "Pending & Issues", data: pendingSection, key: "pending" },
        { title: "In Queue", data: activeSection, key: "active" },
        { title: "Completed", data: completedSection, key: "completed" },
      ].filter((section) => section.data.length > 0),
    [appointments]
  );

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* 1. Translucent Status Bar for edge-to-edge feel
       */}
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* 2. Top Header Container 
        Using SafeAreaView here ensures top padding on iOS, while we handle Android manually or via styling 
      */}
      <View
        style={[
          styles.topBarContainer,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.navButton, { backgroundColor: theme.colors.card }]}
            >
              <ChevronLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>

            {/* Title Section */}
            <View style={styles.headerTitleContainer}>
              <Text
                style={[styles.headerTitleText, { color: theme.colors.text }]}
              >
                Queue History
              </Text>
            </View>

            {/* Menu Button */}
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.colors.card }]}
            >
              <MoreHorizontal size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Date Picker Strip - Integrated into the Header Block */}
        <View style={styles.dateStripContainer}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={[
              styles.datePill,
              {
                backgroundColor: theme.colors.card,
                shadowColor: theme.colors.text,
              },
            ]}
          >
            <Calendar
              size={16}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.datePillText, { color: theme.colors.text }]}>
              {format(selectedDate, "EEEE, MMM do, yyyy")}
            </Text>
            <ChevronDown
              size={16}
              color={theme.colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal Logic */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Content List */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centerView}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.centerView}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Calendar size={32} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Appointments
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              There are no bookings for {format(selectedDate, "MMM do")}.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sectionsData}
            renderItem={({ item }) => (
              <View style={styles.sectionContainer}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.title}
                </Text>
                <FlatList
                  data={item.data}
                  renderItem={({ item: appointment }) => (
                    <AppointmentCard
                      item={appointment}
                      sectionKey={item.key}
                      activeSection={activeSection}
                      theme={theme}
                      navigation={navigation}
                    />
                  )}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              </View>
            )}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  // --- NEW HEADER STYLES ---
  topBarContainer: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 0,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
    // Add subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14, // Squircle shape
    justifyContent: "center",
    alignItems: "center",
    // Subtle button shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Date Strip Styles
  dateStripContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  datePillText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // --- CONTENT STYLES ---
  contentContainer: {
    flex: 1,
  },
  centerView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  listPadding: {
    padding: 20,
    paddingTop: 10,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.7,
  },

  // --- OLDER STYLES (Kept for Card Rendering) ---
  cardWrapper: { marginBottom: 10 },
  cardContainer: { marginBottom: 8 },
  card: {
    flexDirection: "row",
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  blackPremiumCard: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  cardLeftStrip: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
  },
  queueBadge: { alignItems: "center", justifyContent: "center" },
  queueLabel: { fontSize: 10, fontWeight: "800" },
  queueNumber: { fontSize: 20, fontWeight: "900", lineHeight: 24 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  customerName: { fontSize: 17, fontWeight: "700", flex: 1, marginRight: 8 },
  priceTag: { fontSize: 16, fontWeight: "800" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  typeText: { fontSize: 11, fontWeight: "700", marginLeft: 4 },
  offlineTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offlineText: { fontSize: 10, fontWeight: "700", color: "#6B7280" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  timeContainer: { flexDirection: "row", alignItems: "center" },
  timeText: { marginLeft: 5, fontSize: 13, fontWeight: "600" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 5 },
  emptySubtitle: { fontSize: 14, textAlign: "center", opacity: 0.7 },
});

export default QueueHistoryScreen;
