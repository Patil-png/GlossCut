import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  FlatList,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  Bell,
  Clock,
  Search,
  X,
  CheckCircle,
  WifiOff,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import api from "../utils/api";

const { width } = Dimensions.get("window");

// --- OPTIMIZATION: MEMOIZED RENDER ITEM ---
// Prevents the list items from re-rendering unless their specific data changes
const NotificationCard = memo(({ item, theme, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onPress(item)}
    style={[styles.card, { backgroundColor: theme.colors.card }]}
  >
    <View style={styles.cardInner}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: item.read
              ? "#F1F5F9"
              : theme.colors.primary + "15",
          },
        ]}
      >
        <Bell size={20} color={item.read ? "#94A3B8" : theme.colors.primary} />
      </View>
      <View style={styles.contentBox}>
        <Text
          style={[styles.cardTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.cardMsg} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.read && (
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
      )}
    </View>
  </TouchableOpacity>
));

const NotificationsScreen = ({ navigation }) => {
  const { theme } = useTheme();

  // States
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    msg: "",
    type: "success",
  });

  // Animation Refs
  const alertAnim = useRef(new Animated.Value(-100)).current;

  // --- OPTIMIZATION: USECALLBACK ---
  // Prevents function recreation on every render
  const triggerAlert = useCallback(
    (msg, type = "success") => {
      setAlert({ visible: true, msg, type });
      Animated.spring(alertAnim, {
        toValue: 40,
        useNativeDriver: true,
        bounciness: 12,
        speed: 10,
      }).start();

      setTimeout(() => {
        Animated.timing(alertAnim, {
          toValue: -100,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setAlert((prev) => ({ ...prev, visible: false })));
      }, 4000);
    },
    [alertAnim]
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications', { timeout: 8000 });
      setNotifications(res.data);
    } catch (err) {
      if (!err.response) {
        triggerAlert("Offline: Using cached data", "error");
      } else {
        triggerAlert("Sync failed. Pull to refresh.", "info");
      }
    } finally {
      setLoading(false);
    }
  }, [triggerAlert]);

  const handlePress = useCallback(
    (item) => {
      // 1. Navigate Immediately (Priority 1)
      navigation.navigate("NotificationDetail", { notification: item });

      // 2. Update state in next frame to not block navigation animation
      requestAnimationFrame(() => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
        );
      });
    },
    [navigation]
  );

  const markAllRead = useCallback(async () => {
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    triggerAlert("All marked as read", "success");

    try {
      await api.put('/api/notifications/read-all');
    } catch (error) {
      console.log("Failed to sync mark all read", error);
    }
  }, [triggerAlert]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- OPTIMIZATION: USEMEMO ---
  // Filters data without blocking the UI thread
  const filteredNotifications = useMemo(() => {
    if (!searchQuery) return notifications;
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, notifications]);

  // --- OPTIMIZATION: FLATLIST PROPS ---
  const renderItem = useCallback(
    ({ item }) => (
      <NotificationCard item={item} theme={theme} onPress={handlePress} />
    ),
    [theme, handlePress]
  );

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
      <StatusBar barStyle="dark-content" />

      {/* --- PREMIUM FLOATING ALERT --- */}
      <Animated.View
        style={[
          styles.alertPopup,
          {
            transform: [{ translateY: alertAnim }],
            backgroundColor: alert.type === "error" ? "#1E293B" : "#FFF",
          },
        ]}
      >
        <View style={styles.alertInner}>
          {alert.type === "error" ? (
            <WifiOff size={18} color="#FDA4AF" />
          ) : (
            <CheckCircle size={18} color="#10B981" />
          )}
          <Text
            style={[
              styles.alertText,
              { color: alert.type === "error" ? "#FFF" : "#1E293B" },
            ]}
          >
            {alert.msg}
          </Text>
        </View>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* --- NAVBAR --- */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backCircle}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Updates</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
            <CheckCircle size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* --- SEARCH --- */}
        <View style={styles.searchSection}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search notifications..."
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
              clearButtonMode="while-editing" // iOS native optimization
            />
            {searchQuery.length > 0 && Platform.OS === "android" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- OPTIMIZED LIST --- */}
        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchNotifications}
          // Performance Props
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          updateCellsBatchingPeriod={50}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nothing found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  alertPopup: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  alertInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  markReadBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  searchSection: { paddingHorizontal: 20, marginTop: 15 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontWeight: "600",
    color: "#1E293B",
    fontSize: 15,
  },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardInner: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  contentBox: { flex: 1, marginLeft: 14 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cardMsg: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontWeight: "500",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#94A3B8", fontWeight: "600", fontSize: 15 },
});

export default NotificationsScreen;
