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
  Pressable,
  Image
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

// --- 1. CATEGORY FILTERS ---
const FILTERS = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'unread', label: 'Unread', icon: CheckCircle },
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

const getNotificationTheme = (type, isDark) => {
  switch (type?.toLowerCase()) {
    case 'booking':
    case 'appointment':
      return {
        bg: isDark ? 'rgba(0, 153, 255, 0.12)' : '#F0F9FF',
        color: isDark ? '#5EBDFF' : '#0284C7',
        icon: Calendar
      };
    case 'promo':
    case 'offer':
      return {
        bg: isDark ? 'rgba(251, 191, 36, 0.12)' : '#FFFBEB',
        color: isDark ? '#F59E0B' : '#D97706',
        icon: Gift
      };
    case 'alert':
    case 'system':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
        color: isDark ? '#EF4444' : '#DC2626',
        icon: ShieldAlert
      };
    default:
      return {
        bg: isDark ? 'rgba(156, 163, 175, 0.12)' : '#F3F4F6',
        color: isDark ? '#9CA3AF' : '#4B5563',
        icon: Bell
      };
  }
};

// --- 3. COMPONENTS ---

const SectionHeader = memo(({ title, theme }) => {
  const isDark = theme.dark;
  return (
    <View style={styles.sectionHeader}>
      <View 
        style={[
          styles.headerPill, 
          { 
            backgroundColor: isDark ? '#18181B' : '#FFFFFF', 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.2 : 0.04,
          }
        ]}
      >
        <Text style={[styles.headerPillText, { color: theme.colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.headerLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
    </View>
  );
});

const FilterChip = memo(({ filter, active, onPress, theme }) => {
  const Icon = filter.icon;
  const isDark = theme.dark;

  // Active state colors (Solid background with glowing matching shadow)
  const activeBg = isDark ? '#C8FF00' : theme.colors.primary;
  const activeBorder = isDark ? '#C8FF00' : theme.colors.primary;
  const activeText = isDark ? '#000000' : '#FFFFFF';

  // Inactive state colors (Clean physical tile matching the background cards)
  const inactiveBg = isDark ? '#18181B' : '#FFFFFF';
  const inactiveBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const inactiveText = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(filter.id);
      }}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? activeBg : inactiveBg,
          borderColor: active ? activeBorder : inactiveBorder,
          shadowColor: active ? activeBorder : '#000000',
          shadowOffset: active ? { width: 0, height: 4 } : { width: 0, height: 2 },
          shadowOpacity: active ? (isDark ? 0.35 : 0.22) : (isDark ? 0.15 : 0.03),
          shadowRadius: active ? 8 : 4,
          elevation: active ? 4 : 1,
        }
      ]}
    >
      {Icon && (
        <Icon 
          size={normalize(13)} 
          color={active ? activeText : inactiveText} 
          style={{ marginRight: 6 }} 
          strokeWidth={2.5}
        />
      )}
      <Text style={[styles.filterText, { color: active ? activeText : inactiveText }]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );
});

const SkeletonItem = () => (
  <View style={styles.skeletonItem}>
    <Skeleton width={normalize(48)} height={normalize(48)} borderRadius={normalize(16)} />
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={12} borderRadius={4} />
    </View>
  </View>
);

const NotificationCard = memo(({ item, theme, onPress, isFirst, isLast }) => {
  const isDark = theme.dark;
  const isUnread = !item.read;
  const nTheme = getNotificationTheme(item.type, isDark);
  const Icon = nTheme.icon;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  };

  const borderTopRadius = isFirst ? normalize(16) : 0;
  const borderBottomRadius = isLast ? normalize(16) : 0;
  const cardMarginBottom = isLast ? normalize(16) : 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isUnread 
            ? (isDark ? 'rgba(200, 255, 0, 0.04)' : 'rgba(0, 153, 255, 0.03)') 
            : (isDark ? '#18181B' : '#FFFFFF'),
          borderColor: isUnread 
            ? (isDark ? 'rgba(200, 255, 0, 0.25)' : 'rgba(0, 153, 255, 0.15)') 
            : theme.colors.border,
          borderTopLeftRadius: borderTopRadius,
          borderTopRightRadius: borderTopRadius,
          borderBottomLeftRadius: borderBottomRadius,
          borderBottomRightRadius: borderBottomRadius,
          marginBottom: cardMarginBottom,
          borderBottomWidth: isLast ? 1 : 0.5,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.15 : 0.03,
          shadowRadius: 8,
          elevation: isDark ? 2 : 1,
        }
      ]}
    >
      <View style={styles.cardInner}>
        <View 
          style={[
            styles.statusIconContainer, 
            { 
              backgroundColor: nTheme.bg,
              shadowColor: nTheme.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0.22 : 0.12,
              shadowRadius: 5,
              elevation: 2,
            }
          ]}
        >
          <Image 
            source={require("../assets/GlossCutAppIcon.png")} 
            style={{ width: '100%', height: '100%', borderRadius: normalize(16) }} 
            resizeMode="cover" 
          />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text
                style={[
                  styles.cardTitle,
                  { 
                    color: theme.colors.text, 
                    fontWeight: isUnread ? "700" : "600",
                    fontFamily: isUnread ? (Platform.OS === 'ios' ? 'Outfit-Bold' : 'sans-serif-medium') : (Platform.OS === 'ios' ? 'Outfit-Regular' : 'sans-serif')
                  }
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isUnread && (
                <View style={[styles.unreadDot, { backgroundColor: isDark ? '#C8FF00' : theme.colors.primary }]} />
              )}
            </View>
            <Text style={[styles.cardTime, { color: theme.colors.textSecondary }]}>
              {getRelativeTime(item.createdAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.cardDescription,
              { 
                color: isUnread ? theme.colors.text : theme.colors.textSecondary,
                fontWeight: isUnread ? "500" : "400",
                lineHeight: 18
              }
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          {isUnread && (
            <View style={styles.actionRow}>
              <Text style={[styles.tapText, { color: isDark ? '#C8FF00' : theme.colors.primary }]}>Review Details</Text>
              <ArrowRight size={10} color={isDark ? '#C8FF00' : theme.colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const EmptyState = memo(({ theme, searchQuery, activeFilter, onClear }) => {
  const isDark = theme.dark;
  const hasFilter = searchQuery.length > 0 || activeFilter !== 'all';

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(200, 255, 0, 0.04)' : 'rgba(0, 153, 255, 0.04)', borderColor: isDark ? 'rgba(200, 255, 0, 0.15)' : 'rgba(0, 153, 255, 0.1)' }]}>
        <Bell size={normalize(32)} color={isDark ? '#C8FF00' : theme.colors.primary} strokeWidth={1.5} />
      </View>
      
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {hasFilter ? "No matches found" : "All caught up!"}
      </Text>
      
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {hasFilter 
          ? "We couldn't find any updates matching your search queries or filter tags." 
          : "You have no new updates or booking notices. We'll alert you the moment something comes up!"}
      </Text>

      {hasFilter && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClear();
          }}
          style={[styles.emptyBtn, { backgroundColor: isDark ? '#C8FF00' : theme.colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const NotificationsScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/api/notifications");
      const filtered = (res.data || []).filter(n => {
        const title = (n.title || "").toLowerCase();
        const message = (n.message || "").toLowerCase();
        const isCoinEarned = title.includes("coin earned") || 
                             message.includes("coin earned") || 
                             (title.includes("coin") && title.includes("earned")) ||
                             (message.includes("coin") && message.includes("earned"));
        return !isCoinEarned;
      });
      setNotifications(filtered);
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
    <View style={[styles.container, { backgroundColor: isDark ? "#0A0A0C" : "#F8FAFC" }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- GHOST/BLUR NAV BAR --- */}
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={85}
        style={[styles.blurHeader, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }} 
            style={[styles.backBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <ChevronLeft size={normalize(20)} color={theme.colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Animated.Text style={[styles.navTitle, { color: theme.colors.text, opacity: scrollY.interpolate({ inputRange: [60, 100], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
            Updates {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Animated.Text>
          <TouchableOpacity 
            onPress={markAllRead} 
            style={[styles.backBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <CheckCircle size={normalize(18)} color={isDark ? "#C8FF00" : theme.colors.primary} strokeWidth={2.5} />
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
            isFirst={index === 0}
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
              <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                {unreadCount > 0 ? `You have ${unreadCount} unread update${unreadCount > 1 ? 's' : ''}.` : 'Stay in control of your bookings.'}
              </Text>
            </Animated.View>

             <View 
              style={[
                styles.searchOuter, 
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: isSearchFocused ? (isDark ? '#C8FF00' : theme.colors.primary) : theme.colors.border,
                  borderWidth: 1
                }
              ]}
            >
              <Search size={18} color={isSearchFocused ? (isDark ? '#C8FF00' : theme.colors.primary) : theme.colors.textSecondary} />
              <TextInput
                placeholder="Search updates..."
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.searchInput, { color: theme.colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearchQuery('');
                  }}
                  style={styles.clearSearchBtn}
                >
                  <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
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
            <EmptyState
              theme={theme}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onClear={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            />
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
    height: normalize(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16)
  },
  navTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    letterSpacing: -0.5
  },
  backBtn: {
    padding: normalize(6),
    borderRadius: normalize(12),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  heroSection: {
    paddingHorizontal: 16,
    marginBottom: normalize(2)
  },
  heroTitle: {
    fontSize: normalize(32),
    fontWeight: "900",
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Syne-Bold' : 'serif'
  },
  heroSubtitle: {
    fontSize: normalize(13),
    marginTop: 4,
    fontWeight: "500",
    opacity: 0.7,
    lineHeight: normalize(18)
  },
  searchOuter: {
    flexDirection: "row",
    alignItems: "center",
    height: normalize(48),
    borderRadius: normalize(14),
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(14),
    fontWeight: "600"
  },
  filterRow: {
    marginTop: normalize(14),
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    gap: normalize(8)
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1
  },
  filterText: {
    fontSize: normalize(12),
    fontWeight: "700",
    letterSpacing: -0.2
  },
  listContent: {
    paddingBottom: 40
  },
  sectionHeader: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(18),
    paddingBottom: normalize(10),
    flexDirection: "row",
    alignItems: "center"
  },
  headerPill: {
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(5),
    borderRadius: 100,
    marginRight: normalize(8),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  headerPillText: {
    fontSize: normalize(10),
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1
  },
  card: {
    marginHorizontal: normalize(16),
    padding: normalize(16),
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  statusIconContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(14),
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
    fontSize: normalize(14),
    letterSpacing: -0.3,
    marginRight: 8
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2
  },
  cardTime: {
    fontSize: normalize(10),
    fontWeight: "700",
    opacity: 0.5
  },
  cardDescription: {
    fontSize: normalize(12),
    lineHeight: normalize(17),
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
    fontSize: normalize(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  clearSearchBtn: {
    padding: normalize(4),
    borderRadius: normalize(8),
  },
  skeletonItem: {
    flexDirection: "row",
    paddingVertical: normalize(16),
    alignItems: "center"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: normalize(60),
    paddingHorizontal: normalize(32)
  },
  emptyIconContainer: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(24),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(20)
  },
  emptyTitle: {
    fontSize: normalize(18),
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: normalize(8),
    textAlign: "center"
  },
  emptySubtitle: {
    fontSize: normalize(12),
    lineHeight: normalize(17),
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.6,
    marginBottom: normalize(24)
  },
  emptyBtn: {
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(100),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  emptyBtnText: {
    fontSize: normalize(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  }
});

export default NotificationsScreen;
