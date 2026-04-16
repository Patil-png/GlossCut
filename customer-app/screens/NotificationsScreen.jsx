import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  SectionList,
  Dimensions,
  TextInput,
  Platform,
  LayoutAnimation,
  ScrollView,
  Pressable
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  ChevronLeft,
  Search,
  X,
  CheckCircle,
  WifiOff,
  Bell,
  Calendar,
  Gift,
  ShieldAlert,
  ArrowRight
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { useTheme } from "../contexts/ThemeContext.jsx";
import api from "../utils/api";
import Skeleton from "../components/Skeleton";

const { width } = Dimensions.get("window");

// --- 1. CATEGORY FILTERS ---
const FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'unread', label: 'Unread', icon: null },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'promos', label: 'Promos', icon: Gift },
];

// --- 2. UTILS ---
const groupNotifications = (notifications) => {
  const groups = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: []
  };

  notifications.forEach((n) => {
    const date = parseISO(n.createdAt || new Date().toISOString());
    if (isToday(date)) groups.Today.push(n);
    else if (isYesterday(date)) groups.Yesterday.push(n);
    else if (isThisWeek(date)) groups["This Week"].push(n);
    else groups.Earlier.push(n);
  });

  return Object.keys(groups)
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ title: key, data: groups[key] }));
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

const getNotificationTheme = (type) => {
  switch (type?.toLowerCase()) {
    case 'booking':
    case 'appointment':
      return { bg: '#E0F2FE', color: '#0284C7', icon: Calendar };
    case 'promo':
    case 'offer':
      return { bg: '#FEF3C7', color: '#D97706', icon: Gift };
    case 'alert':
    case 'system':
      return { bg: '#FEE2E2', color: '#DC2626', icon: ShieldAlert };
    default:
      return { bg: '#F1F5F9', color: '#64748B', icon: Bell };
  }
};

// --- 3. COMPONENTS ---

const SectionHeader = memo(({ title, theme }) => (
  <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    <View style={[styles.sectionLine, { backgroundColor: theme.colors.border }]} />
  </View>
));

const FilterChip = memo(({ filter, active, onPress, theme }) => {
  const Icon = filter.icon;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(filter.id)}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.card,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        }
      ]}
    >
      {Icon && <Icon size={14} color={active ? "#FFF" : theme.colors.textSecondary} style={{ marginRight: 6 }} />}
      <Text style={[styles.filterText, { color: active ? "#FFF" : theme.colors.textSecondary }]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );
});

const SkeletonItem = () => (
  <View style={styles.skeletonItem}>
    <Skeleton width={48} height={48} borderRadius={16} />
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={12} borderRadius={4} />
    </View>
  </View>
);

const NotificationCard = memo(({ item, theme, onPress, isLast }) => {
  const isUnread = !item.read;
  const nTheme = getNotificationTheme(item.type);
  const Icon = nTheme.icon;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isUnread ? (theme.dark ? '#1A1A1A' : '#F9F9F7') : 'transparent',
          borderLeftWidth: isUnread ? 4 : 0,
          borderLeftColor: theme.colors.primary,
          opacity: pressed ? 0.8 : 1
        }
      ]}
    >
      <View style={styles.cardInner}>
        <View style={[styles.statusIconContainer, { backgroundColor: nTheme.bg }]}>
          <Icon size={20} color={nTheme.color} strokeWidth={2.5} />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: theme.colors.text, fontWeight: isUnread ? "800" : "600" }
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isUnread && (
                <View style={[styles.newBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardTime, { color: theme.colors.textSecondary }]}>
              {getRelativeTime(item.createdAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.cardDescription,
              { color: isUnread ? theme.colors.text : theme.colors.textSecondary }
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          {isUnread && (
            <View style={styles.actionRow}>
              <Text style={[styles.tapText, { color: theme.colors.primary }]}>Review Details</Text>
              <ArrowRight size={12} color={theme.colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const NotificationsScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.log("Fetch failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/notifications/read-all");
    } catch (e) { }
  }, []);

  const handlePress = useCallback(
    (item) => {
      navigation.navigate("NotificationDetail", { notification: item });
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
    },
    [navigation]
  );

  const filteredGroups = useMemo(() => {
    let list = notifications;

    // Apply Filter
    if (activeFilter === 'unread') list = list.filter(n => !n.read);
    else if (activeFilter === 'bookings') list = list.filter(n => n.type === 'booking' || n.type === 'appointment');
    else if (activeFilter === 'promos') list = list.filter(n => n.type === 'promo' || n.type === 'offer');

    // Apply Search
    if (searchQuery) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return groupNotifications(list);
  }, [notifications, searchQuery, activeFilter]);

  // --- ANIMATIONS ---
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp'
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.85],
    extrapolate: 'clamp'
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- GHOST/BLUR NAV BAR --- */}
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={85}
        style={[styles.blurHeader, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Animated.Text style={[styles.navTitle, { color: theme.colors.text, opacity: scrollY.interpolate({ inputRange: [60, 100], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
            Updates
          </Animated.Text>
          <TouchableOpacity onPress={markAllRead} style={styles.iconBtn}>
            <CheckCircle size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <Animated.SectionList
        sections={filteredGroups}
        keyExtractor={(item) => item._id}
        renderItem={({ item, section, index }) => (
          <NotificationCard
            item={item}
            theme={theme}
            onPress={handlePress}
            isLast={index === section.data.length - 1}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SectionHeader title={title} theme={theme} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + (Platform.OS === 'ios' ? 120 : 130), paddingBottom: insets.bottom + 100 }
        ]}
        onRefresh={() => fetchNotifications(true)}
        refreshing={refreshing}
        stickySectionHeadersEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true
        })}
        ListHeaderComponent={
          <View style={styles.heroSection}>
            <Animated.View style={{ transform: [{ translateY: headerTranslateY }, { scale: titleScale }], opacity: titleOpacity }}>
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Updates</Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>Stay in control of your bookings.</Text>
            </Animated.View>

            <View style={[styles.searchOuter, { backgroundColor: theme.colors.card }]}>
              <Search size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Search updates..."
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.searchInput, { color: theme.colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map(f => (
                <FilterChip key={f.id} filter={f} active={activeFilter === f.id} onPress={setActiveFilter} theme={theme} />
              ))}
            </ScrollView>
          </View>
        }
        ListFooterComponent={loading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </View>
        ) : null}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <LottieView
                source={require("../assets/Not Found.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No updates matching your filter.</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  headerContent: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  iconBtn: {
    padding: 10,
    borderRadius: 12
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 20
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Syne-Bold' : 'serif'
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "500",
    opacity: 0.7
  },
  searchOuter: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600"
  },
  filterRow: {
    marginTop: 18,
    paddingRight: 20,
    gap: 10
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1
  },
  filterText: {
    fontSize: 13,
    fontWeight: "700"
  },
  listContent: {
    paddingBottom: 40
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    opacity: 0.6
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    opacity: 0.4
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 2
  },
  cardMain: {
    flex: 1
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10
  },
  cardTitle: {
    fontSize: 15,
    letterSpacing: -0.3,
    marginRight: 8
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.5
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    opacity: 0.8
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6
  },
  tapText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  skeletonItem: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80
  },
  lottie: {
    width: 220,
    height: 220
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 20,
    opacity: 0.7
  }
});

export default NotificationsScreen;
