import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import {
  ArrowLeft,
  WifiOff,
  CheckCircle,
  Calendar as CalendarIcon,

  Scissors,
} from "lucide-react-native";
import api from "../utils/api";
import { useIsFocused } from "@react-navigation/native";
import { format } from "date-fns";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

// --- 1. TOAST COMPONENT (Valid Component) ---
const TopToast = ({ message, type, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 60 : 40,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();

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
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide && onHide());
  };

  const bgColors = {
    error: "#FF4757",
    success: "#2ED573",
    info: "#3742FA",
  };

  return (
    <Animated.View
      style={[styles.toastContainer, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.toastContent,
          { backgroundColor: bgColors[type] || bgColors.info },
        ]}
      >
        {type === "error" ? (
          <WifiOff size={18} color="#fff" />
        ) : (
          <CheckCircle size={18} color="#fff" />
        )}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 2. SCALABLE CARD COMPONENT (Valid Component) ---
const ScalableCard = ({ children, onPress, style }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- 3. SEPARATED APPOINTMENT CARD (The Fix) ---
// This is now a standalone component, so Hooks are allowed here!
const AppointmentCard = ({ item, index, navigation, theme }) => {
  const dateObj = new Date(item.date);

  // Animation Hooks
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100, // Staggered effect
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusConfig = (status, paymentStatus) => {
    if (paymentStatus === "pending")
      return { label: "Unpaid", color: "#FF6B6B", bg: "#FFECEC" };
    switch (status) {
      case "pending":
        return { label: "Approving", color: "#FFA502", bg: "#FFF4D9" };
      case "confirmed":
        return { label: "Confirmed", color: "#2ED573", bg: "#E3FCEF" };
      case "started":
        return { label: "Active", color: "#3742FA", bg: "#EBEBFF" };
      case "completed":
        return { label: "Done", color: "#57606F", bg: "#F1F2F6" };
      default:
        return {
          label: status,
          color: theme.colors.textSecondary,
          bg: theme.colors.border,
        };
    }
  };

  const statusConfig = getStatusConfig(item.status, item.paymentStatus);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border + "40",
          },
        ]}
      >
        {/* LEFT: Date */}
        <View
          style={[
            styles.dateBlock,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[styles.dateMonth, { color: theme.colors.textSecondary }]}
          >
            {format(dateObj, "MMM")}
          </Text>
          <Text style={[styles.dateDay, { color: theme.colors.text }]}>
            {format(dateObj, "dd")}
          </Text>
          <View
            style={[styles.timePill, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>

        {/* RIGHT: Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              {item.userId?.profilePicture ? (
                <Image
                  source={{ uri: item.userId.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitial,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {item.userId?.name?.charAt(0) || "U"}
                  </Text>
                </View>
              )}
              <View>
                <Text
                  style={[styles.userName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.userId?.name || "Guest User"}
                </Text>
                <Text
                  style={[
                    styles.serviceCount,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.services.length} Service
                  {item.services.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View style={styles.priceTag}>
              <Text
                style={[styles.priceSymbol, { color: theme.colors.primary }]}
              >
                ₹
              </Text>
              <Text style={[styles.priceValue, { color: theme.colors.text }]}>
                {Math.floor(item.totalPrice)}
              </Text>
            </View>
          </View>

          <View
            style={[styles.dashedLine, { borderColor: theme.colors.border }]}
          />

          <View style={styles.cardFooter}>
            <View style={styles.servicesContainer}>
              <Scissors
                size={12}
                color={theme.colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.serviceText,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.services.map((s) => s.name).join(", ")}
              </Text>
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusConfig.color },
                ]}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// --- 4. SKELETON COMPONENT ---
const SkeletonItem = ({ theme }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonCard,
        { backgroundColor: theme.colors.card, opacity },
      ]}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          backgroundColor: theme.colors.border,
        }}
      />
      <View style={{ marginLeft: 15, flex: 1 }}>
        <View
          style={{
            width: "60%",
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.border,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: "40%",
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.border,
          }}
        />
      </View>
    </Animated.View>
  );
};

// --- 5. MAIN SCREEN ---
const AllAppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("pending");
  const isFocused = useIsFocused();

  // Animation for Filter Tab
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const filterOptions = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Upcoming" },
    { key: "completed", label: "History" },
  ];

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
  };

  const handleFilterChange = (newFilter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(newFilter);
    const index = filterOptions.findIndex((opt) => opt.key === newFilter);

    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();
  };

  const fetchAppointments = async (isRefresh = false) => {
    if (!isRefresh && appointments.length === 0) setLoading(true);

    try {
      const res = await api.get('/api/booking/barber', {
        timeout: 10000,
      });

      if (res.status === 200) {
        setAppointments(res.data.filter((a) => a.status !== "cancelled"));
      }
    } catch (err) {
      let msg = "Something went wrong.";
      if (err.message === "Network Error" || !err.response) {
        msg = "Internet connection appears to be offline.";
      } else if (err.response?.status === 401) {
        msg = "Session expired. Please login again.";
      } else if (err.response?.status >= 500) {
        msg = "Server is currently down. Try again later.";
      }
      showToast(msg, "error");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
      const initialIndex = filterOptions.findIndex((opt) => opt.key === filter);
      slideAnim.setValue(initialIndex);
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(true);
  };

  const filterWidth = (width - 48) / filterOptions.length;
  const translateX = slideAnim.interpolate({
    inputRange: filterOptions.map((_, index) => index),
    outputRange: filterOptions.map((_, index) => index * filterWidth),
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <TopToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center", marginRight: 42 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              My Bookings
            </Text>
          </View>


        </View>

        {/* FILTER */}
        <View style={styles.filterWrapper}>
          <View
            style={[
              styles.filterBackground,
              { backgroundColor: theme.colors.border + "60" },
            ]}
          >
            <Animated.View
              style={[
                styles.activeFilterPill,
                {
                  width: filterWidth,
                  transform: [{ translateX }],
                  backgroundColor: theme.colors.card,
                },
              ]}
            />
            {filterOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.filterTab}
                onPress={() => handleFilterChange(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        filter === opt.key
                          ? theme.colors.text
                          : theme.colors.textSecondary,
                      fontWeight: filter === opt.key ? "700" : "500",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LIST */}
        {loading ? (
          <View style={styles.listContent}>
            {[1, 2, 3, 4].map((k) => (
              <SkeletonItem key={k} theme={theme} />
            ))}
          </View>
        ) : appointments.filter((a) => a.status === filter).length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.colors.primary + "10" },
              ]}
            >
              <CalendarIcon size={40} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No {filter} bookings
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Your appointment list is clean. {"\n"}New bookings will appear
              here instantly.
            </Text>
          </View>
        ) : (
          <FlatList
            data={appointments.filter((a) => a.status === filter)}
            // FIX IS HERE: passing a component to renderItem, not a function with hooks
            renderItem={({ item, index }) => (
              <AppointmentCard
                item={item}
                index={index}
                navigation={navigation}
                theme={theme}
              />
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Toast
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: "85%",
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: Platform.OS === "android" ? STATUSBAR_HEIGHT + 10 : 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Filter
  filterWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  filterBackground: {
    flexDirection: "row",
    borderRadius: 25,
    height: 50,
    position: "relative",
    padding: 4,
  },
  activeFilterPill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  filterText: { fontSize: 14 },

  // Skeleton
  skeletonCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
  },

  // Card
  cardContainer: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
  },
  dateBlock: {
    borderRadius: 18,
    width: 68,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateDay: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  timePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  timeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  cardContent: { flex: 1, justifyContent: "space-between" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 14, marginRight: 10 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 14,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700" },
  userName: { fontSize: 16, fontWeight: "700", width: 120 },
  serviceCount: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  priceTag: { flexDirection: "row", alignItems: "flex-start" },
  priceSymbol: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
    marginRight: 1,
  },
  priceValue: { fontSize: 18, fontWeight: "800" },

  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 1,
    marginVertical: 12,
    opacity: 0.4,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicesContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  serviceText: { fontSize: 12, flex: 1, fontWeight: "500" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Empty State
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});

export default AllAppointmentsScreen;
