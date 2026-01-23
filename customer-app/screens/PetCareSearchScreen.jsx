
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Easing,
  Keyboard,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import OptimizedImage from "../components/OptimizedImage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  MapPin,
  Bookmark,
  ChevronRight,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  WifiOff,
  Filter,
  Scissors,
  User,
  Phone,
  Mail,
  ChevronDown,
  MessageSquare,
  RefreshCw,
  Bell,
  Calendar
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import api from "../utils/api";


// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

const { width, height } = Dimensions.get("window");

// --- COMPONENT: PREMIUM DYNAMIC ISLAND ALERT ---
const TopToastAlert = React.memo(
  ({ visible, message, type = "success", onHide, theme, styles }) => {
    const translateY = useRef(new Animated.Value(-150)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: Platform.OS === "ios" ? 50 : 20,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          })
        ]).start();

        const timer = setTimeout(() => {
          hideAlert();
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        translateY.setValue(-150);
        scale.setValue(0.9);
      }
    }, [visible]);

    const hideAlert = useCallback(() => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onHide) onHide();
      });
    }, [visible, onHide, translateY]);

    const getAlertConfig = () => {
      switch (type) {
        case "success": return { color: "#27AE60", icon: <CheckCircle size={18} color="#fff" strokeWidth={3} /> };
        case "error": return { color: "#EB5757", icon: <AlertCircle size={18} color="#fff" strokeWidth={3} /> };
        case "network": return { color: "#F2994A", icon: <WifiOff size={18} color="#fff" strokeWidth={3} /> };
        default: return { color: "#2F80ED", icon: <Info size={18} color="#fff" strokeWidth={3} /> };
      }
    };

    const config = getAlertConfig();

    return (
      <Animated.View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          alignItems: "center",
          transform: [{ translateY }, { scale }],
        }}
      >
        <View style={[styles.toastContainer, { backgroundColor: "#1E1E1E" }]}>
          <View style={[styles.toastIcon, { backgroundColor: config.color }]}>
            {config.icon}
          </View>
          <Text style={[styles.toastText, { color: "#fff" }]}>{message}</Text>
        </View>
      </Animated.View>
    );
  }
);

// --- COMPONENT: PREMIUM DYNAMIC ISLAND ALERT ---
// (Already replaced above)

// --- COMPONENT: BOUNCY MACRO-INTERACTION CARD ---
const BouncyCard = React.memo(({ children, onPress, disabled, style }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ marginBottom: 20 }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- COMPONENT: PET CARE CARD ITEM (UPDATED LAYOUT) ---
const PetCareCardItem = React.memo(
  ({ item, isLiked, premiumInfo, theme, styles, onPress, onLikePress, onCheckAppointment, isSmall = false, showLikeButton = true }) => {

    const { fullness, isAlmostFull, hasPremiumSlots, maxAppointments } = useMemo(() => {
      const maxApps = item.owner?.maxAppointmentsPerDay
        ? Math.max(item.todaysBookings, item.owner.maxAppointmentsPerDay)
        : 20;
      const full = Math.min((item.todaysBookings / maxApps) * 100, 100);
      return {
        maxAppointments: maxApps,
        fullness: full,
        isAlmostFull: full > 90,
        hasPremiumSlots: premiumInfo && premiumInfo.count > 0,
      };
    }, [item.todaysBookings, item.owner, premiumInfo]);

    const capacityText = useMemo(() => {
      if (isAlmostFull && hasPremiumSlots) return `${premiumInfo.count} Premium Slots`;
      if (fullness > 90) return "High Demand";
      return `${maxAppointments - item.todaysBookings} slots left`;
    }, [isAlmostFull, hasPremiumSlots, fullness, maxAppointments, item.todaysBookings, premiumInfo]);

    const isPendingApproval = item?.approvalStatus === 'pending';

    const handlePress = useCallback(() => onPress(item), [onPress, item]);
    const handleLike = useCallback(() => onLikePress(item.id), [onLikePress, item.id]);
    const handleBook = useCallback(() => onCheckAppointment(item), [onCheckAppointment, item]);

    const reviewCountDisplay = typeof item.reviewCount === 'number'
      ? item.reviewCount
      : (Array.isArray(item.reviews) ? item.reviews.length : 0);

    return (
      <BouncyCard onPress={handlePress} disabled={!item.isAvailable || isPendingApproval} style={[styles.barberCard, isSmall && styles.smallCard]}>

        {/* Pending Approval Overlay */}
        {isPendingApproval && (
          <View style={styles.pendingOverlay}>
            <View style={styles.pendingBadge}>
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.pendingText}>Under Review</Text>
            </View>
          </View>
        )}

        {/* --- Image Section --- */}
        <View style={[styles.cardImageContainer, isSmall && { height: 180 }]}>
          <OptimizedImage
            source={item.image.uri}
            style={styles.cardImage}
            contentFit="cover"
          />

          <View style={styles.gradientOverlay} />

          <View style={styles.cardTopRow}>
            {/* Badge */}
            <View style={styles.glassBadge}>
              <Text style={styles.ratingBadgeText}>{item.rating > 0 ? item.rating.toFixed(1) : "New"}</Text>
              <Star size={12} color="#000" fill="#000" style={{ marginLeft: 3, marginBottom: 1 }} />
            </View>

            {showLikeButton && item.type === "barber" && (
              <TouchableOpacity style={styles.heartButton} onPress={handleLike} activeOpacity={0.7}>
                <Bookmark size={20} color={isLiked ? "#FF3B30" : "#fff"} fill={isLiked ? "#FF3B30" : "transparent"} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.cardBottomInfo}>
            {!item.isAvailable ? (
              <View style={[styles.statusPill, { backgroundColor: "#FF3B30" }]}>
                <Clock size={12} color="#fff" style={{ marginRight: 4 }} strokeWidth={3} />
                <Text style={[styles.statusText, { color: '#fff' }]}>CLOSED</Text>
              </View>
            ) : (
              <View style={styles.statusPill}>
                <View style={styles.liveDotWrapper}>
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.statusText}>OPEN NOW</Text>
              </View>
            )}
            {hasPremiumSlots && isAlmostFull && (
              <View style={[styles.statusPill, { backgroundColor: "#FFD700", marginLeft: 8 }]}>
                <Zap size={12} color="#000" fill="#000" style={{ marginRight: 2 }} />
                <Text style={[styles.statusText, { color: '#000' }]}>PREMIUM</Text>
              </View>
            )}
          </View>
        </View>

        {/* --- Content Section (Redesigned) --- */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderCol}>
            {/* Title */}
            <Text style={[styles.barberName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>

            {/* Address */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <MapPin size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.shopName, { color: theme.colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>{item.shopName || item.address}</Text>
            </View>
          </View>

          {item.type !== "shop" && (
            <>
              {/* New Meta Row: Time • Services • Reviews */}
              <View style={styles.metaRow}>
                {/* Time */}
                <View style={styles.metaItem}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.avgAppointmentTime}</Text>
                </View>

                <View style={styles.dotSeparator} />

                {/* Services */}
                <View style={styles.metaItem}>
                  <Scissors size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.totalServices} Services</Text>
                </View>

                <View style={styles.dotSeparator} />

                {/* Reviews */}
                <View style={styles.metaItem}>
                  <Star size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{reviewCountDisplay} Reviews</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                {item.isAvailable && (
                  <View style={styles.capacityContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={[styles.capacityText, { color: fullness > 80 ? '#FF3B30' : '#27AE60' }]}>{capacityText}</Text>
                    </View>
                    <View style={styles.capacityBarTrack}>
                      <Animated.View style={[styles.capacityBarFill, { width: `${fullness}%`, backgroundColor: fullness > 80 ? "#FF3B30" : "#27AE60" }]} />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.bookButton, { backgroundColor: item.isAvailable ? theme.colors.primary : theme.colors.border }]}
                  onPress={handleBook}
                  activeOpacity={item.isAvailable ? 0.7 : 1}
                  disabled={!item.isAvailable}
                >
                  <Text style={[styles.bookButtonText, { color: item.isAvailable ? '#fff' : '#999' }]}>
                    {item.isAvailable ? 'Live Queue' : 'Closed'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </BouncyCard>
    );
  },
  (prev, next) => prev.item.id === next.item.id && prev.item.todaysBookings === next.item.todaysBookings && prev.item.isAvailable === next.item.isAvailable && prev.isLiked === next.isLiked
);

// --- COMPONENT: SHOP DETAILS BOTTOM SHEET ---
const ShopDetailsSheet = ({ visible, shop, onClose, theme, styles, onLike, onBook, onCardPress, getBarberData, checkIsLiked, premiumAvailability }) => {
  if (!shop) return null;

  const getReviewCount = (data, fallback) => {
    if (typeof data?.reviewCount === 'number') return data.reviewCount;
    if (Array.isArray(fallback)) return fallback.length;
    return 0;
  };

  const ownerBarber = useMemo(() => {
    const data = getBarberData(shop.owner._id);
    // Only show owner barber if their card is approved
    if (data && data.approvalStatus !== 'approved') return null;
    return {
      id: shop.owner._id || 'owner',
      type: 'barber',
      barberId: shop.owner._id,
      name: shop.owner.name,
      address: shop.address,
      image: data?.image || { uri: shop.owner.profilePicture },
      rating: data?.rating || shop.owner.rating || 0,
      reviewCount: getReviewCount(data, shop.reviews),
      category: 'Pet Care',
      avgAppointmentTime: data?.avgAppointmentTime || '30 min',
      totalServices: data?.totalServices || 0,
      isAvailable: shop.owner.isAvailable,
      todaysBookings: data?.todaysBookings || 0,
      listingTier: data?.listingTier || shop.listingTier,
      shopName: shop.name,
      owner: { ...shop.owner, maxAppointmentsPerDay: shop.originalOwnerMax || 10 },
    };
  }, [shop, getBarberData]);

  const staffBarbers = useMemo(() => (shop.staff || []).map((staffMember) => {
    const data = getBarberData(staffMember._id);
    // Only show staff barber if their card is approved
    if (data && data.approvalStatus !== 'approved') return null;
    return {
      id: staffMember._id || 'staff',
      type: 'barber',
      barberId: data?.barberId || staffMember._id,
      name: staffMember.name || data?.name || 'Unknown Pet Care Provider',
      address: shop.address,
      image: data?.image || { uri: staffMember.profilePicture || 'https://via.placeholder.com/150' },
      rating: data?.rating || 0,
      reviewCount: getReviewCount(data, []),
      category: 'Pet Care',
      avgAppointmentTime: data?.avgAppointmentTime || '30 min',
      totalServices: data?.totalServices || 0,
      isAvailable: staffMember.isAvailable,
      todaysBookings: data?.todaysBookings || 0,
      listingTier: data?.listingTier || shop.listingTier,
      shopName: shop.name,
      owner: { maxAppointmentsPerDay: staffMember.maxAppointmentsPerDay || 10 }
    };
  }).filter(barber => barber !== null), [shop, getBarberData]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>

          <View style={styles.modalHandleContainer}>
            <View style={styles.modalHandle} />
          </View>

          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={1}>{shop.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={{ backgroundColor: theme.colors.card, padding: 4, borderRadius: 6, marginRight: 6 }}>
                  <MapPin size={12} color={theme.colors.primary} />
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{shop.address}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {ownerBarber && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shop Owner</Text>
                  <View style={styles.sectionLine} />
                </View>
                <PetCareCardItem
                  item={ownerBarber}
                  isLiked={checkIsLiked(ownerBarber.id, 'barber')}
                  premiumInfo={premiumAvailability[ownerBarber.id]}
                  theme={theme}
                  styles={styles}
                  onPress={onCardPress}
                  onLikePress={onLike}
                  onCheckAppointment={onBook}
                  isSmall={true}
                  showLikeButton={true}
                />
              </>
            )}

            {staffBarbers.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: ownerBarber ? 24 : 0 }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Expert Team ({staffBarbers.length})</Text>
                  <View style={styles.sectionLine} />
                </View>
                {staffBarbers.map((barber) => (
                  <PetCareCardItem
                    key={barber.id}
                    item={barber}
                    isLiked={checkIsLiked(barber.id, 'barber')}
                    premiumInfo={premiumAvailability[barber.id]}
                    theme={theme}
                    styles={styles}
                    onPress={onCardPress}
                    onLikePress={onLike}
                    onCheckAppointment={onBook}
                    isSmall={true}
                    showLikeButton={true}
                  />
                ))}
              </>
            )}

            {(!ownerBarber && staffBarbers.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No approved providers available at this shop right now.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- MAIN SCREEN ---
const PetCareSearchScreen = ({ navigation, route }) => {
  const { forFriend } = route.params || {};
  const [userTier, setUserTier] = useState("premium");
  const { theme } = useTheme();
  const { likedProviders, likeProvider, unlikeProvider, checkIsLiked } = useAuth();

  const [inputText, setInputText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  const [allBarbers, setAllBarbers] = useState([]);
  const [allBarbersData, setAllBarbersData] = useState([]);
  const [filteredBarbers, setFilteredBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLottie, setShowLottie] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumAvailability, setPremiumAvailability] = useState({});

  const [selectedShop, setSelectedShop] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [alert, setAlert] = useState({ visible: false, message: "", type: "info" });
  const flatListRef = useRef(null);

  const styles = useMemo(() => getStyles(theme), [theme]);

  const getBarberData = useCallback((barberId) => {
    return allBarbersData.find(b => (b.barberId === barberId || b.id === barberId) && b.type === 'barber');
  }, [allBarbersData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputText);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputText]);

  const triggerAlert = useCallback((message, type = "info") => {
    setAlert((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setAlert({ visible: true, message, type });
    }, 100);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // OPTIMIZED: Advanced Data Fetching with Batch API Calls
  const fetchBarbers = useCallback(async () => {
    setRefreshing(true);

    try {
      const timestamp = Date.now();
      const shopRes = await api.get(`/api/shop/all?category=Pet Care&t=${timestamp}`, { timeout: 10000 });
      const barberRes = await api.get(`/api/barber-card/all?t=${timestamp}`, { timeout: 10000 });

      if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
        const formattedData = [];
        for (const shop of shopRes.data) {
          const shopBarbers = barberRes.data.filter((barber) => barber.shopId === shop._id);
          let totalTodaysBookings = 0;
          let totalMaxAppointments = 0;

          if (shop.owner?.isAvailable) {
            totalMaxAppointments += shop.owner.maxAppointmentsPerDay || 10;
          }
          for (const staff of shop.staff || []) {
            if (staff.isAvailable) {
              totalMaxAppointments += staff.maxAppointmentsPerDay || 10;
            }
          }
          // Calculate todays bookings dynamically from actual bookings
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get all barber IDs for this shop
            const barberIds = [shop.owner._id, ...(shop.staff || []).map(s => s._id)].filter(id => id);

            if (barberIds.length > 0) {
              // Fetch actual bookings for today
              const bookingRes = await api.get(
                `/api/booking/barber-appointments-batch?barberIds=${barberIds.join(',')}&date=${today.toISOString().split('T')[0]}`,
                { timeout: 5000 }
              );

              if (bookingRes.data && typeof bookingRes.data === 'object') {
                // Sum up confirmed/started bookings for all barbers in this shop
                const todaysConfirmedBookings = Object.values(bookingRes.data).reduce((sum, count) => sum + (count || 0), 0);
                totalTodaysBookings = todaysConfirmedBookings;
              }
            }
          } catch (error) {
            console.warn('Error fetching todays bookings, using stored value:', error.message);
            // Fallback to stored value if API fails
            for (const barber of shopBarbers) {
              if (barber.isAvailable) {
                totalTodaysBookings += barber.todaysBookings || 0;
              }
            }
          }

          const shopCard = {
            id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            image: shop.image
              ? {
                uri: shop.image.startsWith("http")
                  ? shop.image
                  : `${process.env.EXPO_PUBLIC_API_URL}${shop.image}`,
              }
              : shop.owner?.profilePicture
                ? {
                  uri: shop.owner.profilePicture.startsWith("http")
                    ? shop.owner.profilePicture
                    : `${process.env.EXPO_PUBLIC_API_URL}${shop.owner.profilePicture}`,
                }
                : { uri: "https://via.placeholder.com/150" },
            rating: shop.rating || 0,
            reviews: Array.isArray(shop.reviews) ? shop.reviews : [],
            reviewCount: shop.totalReviews || 0,
            services: shop.services || [],
            category: "Pet Care",
            tag: shop.tag,
            avgAppointmentTime: shop.avgAppointmentTime || "30 min",
            totalServices: shop.services?.length || 0,
            isAvailable: !!shop.isAvailable,
            todaysBookings: totalTodaysBookings,
            listingTier: shop.listingTier,
            totalBarbers: shop.totalBarbers || 1,
            shopRating: shop.shopRating || shop.rating || 0,
            originalOwnerMax: shop.owner?.maxAppointmentsPerDay || 10,
            approvalStatus: shop.approvalStatus,
          };
          formattedData.push(shopCard);

          for (const barber of shopBarbers) {
            const barberCard = {
              id: barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              name: barber.name || "Unknown Pet Care Provider",
              address: barber.address || shop.address || "Location Unavailable",
              image: barber.image || { uri: barber.barberId?.profilePicture || "https://via.placeholder.com/150" },
              rating: barber.rating || 0,
              reviews: Array.isArray(barber.reviews) ? barber.reviews : [],
              reviewCount: typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0),
              services: barber.services || [],
              category: barber.category || "General",
              tag: barber.specialties?.[0] || barber.tag || "General",
              avgAppointmentTime: barber.avgAppointmentTime || "30 min",
              totalServices: barber.services?.length || 0,
              isAvailable: barber.isAvailable && shop.isAvailable,
              todaysBookings: barber.todaysBookings || 0,
              shopName: barber.shopName || shop.name,
              listingTier: barber.listingTier,
              parentShopId: shop._id,
              owner: barber.barberId,
              approvalStatus: barber.approvalStatus,
            };
            formattedData.push(barberCard);
          }
        }

        const independentBarbers = barberRes.data.filter((barber) => !barber.shopId);
        for (const barber of independentBarbers) {
          const barberCard = {
            id: barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            name: barber.name || "Unknown Pet Care Provider",
            address: barber.address || "No address",
            image: barber.image || { uri: barber.barberId?.profilePicture || "https://via.placeholder.com/150" },
            rating: barber.rating || 0,
            reviews: Array.isArray(barber.reviews) ? barber.reviews : [],
            reviewCount: typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0),
            services: barber.services || [],
            category: barber.category || "General",
            tag: barber.specialties?.[0] || barber.tag || "General",
            avgAppointmentTime: barber.avgAppointmentTime || "30 min",
            totalServices: barber.services?.length || 0,
            isAvailable: barber.isAvailable,
            todaysBookings: barber.todaysBookings || 0,
            shopName: barber.shopName || "Independent",
            listingTier: barber.listingTier,
            parentShopId: null,
            owner: barber.barberId,
            approvalStatus: barber.approvalStatus,
          };
          formattedData.push(barberCard);
        }

        const shops = formattedData.filter(item => item.type === 'shop');
        const barbers = formattedData.filter(item => item.type === 'barber' && item.approvalStatus === 'approved'); // Only approved barbers

        setAllBarbers(shops); // Only shops for filtering and display
        setAllBarbersData(barbers);
        setFilteredBarbers(shops); // Only show shops initially
        fetchPremiumAvailability(formattedData);
      }
    } catch (err) {
      if (err.message?.includes("Network Error") || err.code === "ECONNABORTED") {
        triggerAlert("Network Error. Check connection.", "error");
      } else {
        triggerAlert("Could not load shops and pet care providers.", "error");
      }
    } finally {
      setLoading(false);
      setShowLottie(false);
      setRefreshing(false);
    }
  }, [triggerAlert]);

  const fetchPremiumAvailability = async (barbers) => {
    try {
      const today = new Date().toISOString();
      const barberIds = barbers.map(b => b.barberId || b.id).filter(id => id).join(',');
      if (barberIds) {
        const res = await api.get(`/api/booking/check-premium-availability-batch?barberIds=${barberIds}&date=${today}`, {
          timeout: 10000
        });
        setPremiumAvailability(res.data);
      }
    } catch (e) {
      console.error('Error fetching premium availability:', e);
    }
  };

  useEffect(() => {
    if (showLottie) { setTimeout(() => fetchBarbers(), 1500); }
  }, [showLottie, fetchBarbers]);

  const performSortAndFilter = useCallback((query, filters) => {
    if (!allBarbers) return;
    let list = allBarbers.filter((barber) => {
      const category = barber.category || "";
      const isCorrectCategory = category === "Pet Care";
      if (!isCorrectCategory) return false;
      if (barber.approvalStatus !== 'approved') return false;
      if (filters.includes("Online") && !barber.isAvailable) return false;
      if (filters.includes("Offline") && barber.isAvailable) return false;
      if (query && query.trim() !== "") {
        const lowerQuery = query.toLowerCase().trim();
        const name = (barber.name || "").toLowerCase();
        const address = (barber.address || "").toLowerCase();
        if (!name.includes(lowerQuery) && !address.includes(lowerQuery)) return false;
      }
      return true;
    });

    if (filters.includes("Rating")) {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.includes("Number of Reviews")) {
      list.sort((a, b) => (Array.isArray(b.reviews) ? b.reviews.length : 0) - (Array.isArray(a.reviews) ? a.reviews.length : 0));
    }
    setFilteredBarbers(list);
  }, [allBarbers]);

  useEffect(() => {
    if (!loading) { performSortAndFilter(debouncedQuery, activeFilters); }
  }, [debouncedQuery, activeFilters, loading, performSortAndFilter]);

  useFocusEffect(
    useCallback(() => {
      if (!showLottie && !loading) {
        fetchBarbers();
      }
    }, [showLottie, loading, fetchBarbers])
  );

  const handleLikePress = useCallback(async (barberId) => {
    const providerId = barberId;
    const providerType = 'barber';

    const isCurrentlyLiked = checkIsLiked(providerId, providerType);

    if (isCurrentlyLiked) {
      const success = await unlikeProvider(providerId, providerType);
      if (success) {
        triggerAlert("Removed from favorites", "info");
      }
    } else {
      const success = await likeProvider(providerId, providerType);
      if (success) {
        triggerAlert("Added to favorites!", "success");
      }
    }
  }, [checkIsLiked, likeProvider, unlikeProvider, triggerAlert]);

  const handleCardPress = useCallback(async (item) => {
    if (!item.isAvailable) {
      if (item.type === "shop") triggerAlert("This shop is currently closed.", "info");
      else triggerAlert("This pet care provider is currently unavailable.", "info");
      return;
    }
    if (item.type === "shop") {
      setSelectedShop(item);
      return;
    }
    navigation.navigate("Booking", { barberData: item, userTier });
    try {
      await api.put(`/api/barber-card/increment-click/${item.id}`);
    } catch (e) { }
  }, [navigation, triggerAlert, userTier]);

  const handleCheckAppointment = useCallback((item) => {
    if (item?.barberId) {
      setSelectedShop(null);
      navigation.navigate("Appointmentcheckpage", {
        barberData: item,
        userTier: userTier,
      });
    } else {
      triggerAlert("Pet care provider details unavailable", "error");
    }
  }, [navigation, userTier, triggerAlert]);

  const handleCardPressForModal = useCallback((item) => {
    if (item?.barberId) {
      setSelectedShop(null);
      navigation.navigate("Booking", {
        barberData: item,
        userTier: userTier,
      });
    } else {
      triggerAlert("Pet care provider details unavailable", "error");
    }
  }, [navigation, userTier, triggerAlert]);

  const clearSearch = () => setInputText("");

  const renderItem = useCallback(({ item }) => {
    return (
      <PetCareCardItem
        item={item}
        isLiked={checkIsLiked(item.id, 'barber')}
        premiumInfo={premiumAvailability[item.id]}
        theme={theme}
        styles={styles}
        onPress={handleCardPress}
        onLikePress={handleLikePress}
        onCheckAppointment={handleCheckAppointment}
      />
    );
  }, [checkIsLiked, premiumAvailability, theme, styles, handleCardPress, handleLikePress, handleCheckAppointment]);

  const keyExtractor = useCallback((item) => item.id, []);

  const filterOptions = useMemo(() => [
    { label: "Open Now", value: "Online", icon: <Clock size={14} color="inherit" /> },
    { label: "Top Rated", value: "Rating", icon: <Star size={14} color="inherit" /> },
    { label: "Trending", value: "Number of Reviews", icon: <Zap size={14} color="inherit" /> },
  ], []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Find Pet Care</Text>
            <Text style={styles.headerSubtitle}>Book the best near you</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => fetchBarbers()} style={[styles.headerIconBtn, { marginRight: 4 }]}>
              <RefreshCw size={20} color={theme.colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerIconBtn}>
              <Bell size={20} color={theme.colors.text} strokeWidth={2.5} />
              {/* Notification Badge - can be connected to actual notification count */}
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Search size={20} color={theme.colors.primary} style={{ marginRight: 10 }} strokeWidth={2.5} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search 'Dog Grooming', 'Vet'...'"
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="search"
            />
            {inputText.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchBtn}>
                <X size={14} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={styles.searchDivider}
              >
                <Filter size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ANIMATED FILTERS */}
        <Animated.View style={[styles.filtersContainer, { maxHeight: showFilters ? 60 : 0, opacity: showFilters ? 1 : 0 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            {filterOptions.map((option) => {
              const isActive = activeFilters.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      shadowOpacity: isActive ? 0.2 : 0.05
                    }
                  ]}
                  onPress={() => setActiveFilters((prev) => prev.includes(option.value) ? prev.filter((f) => f !== option.value) : [...prev, option.value])}
                >
                  {isActive && <CheckCircle size={12} color="#fff" style={{ marginRight: 4 }} strokeWidth={3} />}
                  <Text style={[styles.filterText, { color: isActive ? "#fff" : theme.colors.text }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* LIST */}
        <View style={{ flex: 1 }}>
          {showLottie ? (
            <View style={styles.centerContent}>
              <LottieView source={require("../assets/Employee Search.json")} autoPlay loop={false} onAnimationFinish={() => setShowLottie(false)} style={{ width: 200, height: 200 }} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Finding pet care experts...</Text>
            </View>
          ) : loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredBarbers}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchBarbers}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={[styles.listHeaderTitle, { color: theme.colors.text }]}>
                    {filteredBarbers.length} Spots Nearby
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Pet Care Providers Found</Text>
                  <Text style={styles.emptySubtitle}>Try changing your search.</Text>
                </View>
              }
            />
          )}
        </View>

        {/* BOTTOM SHEET MODAL */}
        <ShopDetailsSheet
          visible={!!selectedShop}
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          theme={theme}
          styles={styles}
          onLike={handleLikePress}
          onBook={handleCheckAppointment}
          onCardPress={handleCardPressForModal}
          getBarberData={getBarberData}
          checkIsLiked={checkIsLiked}
          premiumAvailability={premiumAvailability}
        />

        <TopToastAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={hideAlert} theme={theme} styles={styles} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- POLISHED PREMIUM STYLES (WITH META ROW) ---
const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  backButton: { marginRight: 15, padding: 8, borderRadius: 50, backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "#f5f5f5" },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: theme.colors.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: "500" },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: theme.colors.border },

  // Search
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', height: '100%', paddingRight: 10 },
  clearSearchBtn: { backgroundColor: '#ccc', borderRadius: 10, padding: 2 },
  searchDivider: { paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: theme.colors.border },

  // Filter Dropdown
  filterDropdown: { position: 'absolute', top: 80, right: 20, zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  filterDropdownContent: { backgroundColor: theme.colors.card, borderRadius: 16, paddingVertical: 8, minWidth: 180, borderWidth: 1, borderColor: theme.colors.border },
  dropdownFilterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  dropdownFilterItemActive: { backgroundColor: theme.colors.primary + '15' },
  dropdownFilterText: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginLeft: 12, flex: 1 },
  dropdownFilterTextActive: { color: theme.colors.primary },

  // Filters
  filtersContainer: { overflow: 'hidden' },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  filterText: { fontSize: 13, fontWeight: "700" },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listHeader: { marginBottom: 12, marginTop: 4 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', opacity: 0.6, letterSpacing: -0.2 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  loadingText: { marginTop: 0, fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center' },

  // --- PREMIUM CARD STYLES ---
  barberCard: { backgroundColor: theme.colors.card, borderRadius: 24, marginBottom: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: theme.colors.border },
  smallCard: { marginBottom: 16, borderRadius: 20, shadowOpacity: 0.04 },

  // Card Image Area
  cardImageContainer: { height: 180, width: "100%", overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'relative' },
  cardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, zIndex: 2, position: 'relative' },
  glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  ratingBadgeText: { fontSize: 12, fontWeight: '800', color: '#000' },
  heartButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  cardBottomInfo: { padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 2, position: 'relative' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  liveDotWrapper: { width: 8, height: 8, marginRight: 4, justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853' },
  statusText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // --- CARD BODY CONTENT ---
  cardBody: { padding: 16, paddingTop: 14 },

  // Header Row
  cardHeaderCol: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 },
  barberName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 },
  shopName: { fontSize: 15, fontWeight: '500' },

  // NEW: Meta Row (Time, Services, Reviews)
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginHorizontal: 10 },

  // Footer Actions
  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  capacityContainer: { flex: 1, marginRight: 16, paddingBottom: 2 },
  capacityBarTrack: { height: 4, backgroundColor: theme.dark ? '#333' : '#E0E0E0', borderRadius: 2, overflow: 'hidden' },
  capacityBarFill: { height: '100%', borderRadius: 2 },
  capacityText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  bookButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  bookButtonText: { fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  // Toast
  toastContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 40, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 20, minWidth: width * 0.6 },
  toastIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  toastText: { fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { maxHeight: height * 0.85, height: 'auto', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 30 },
  modalHandleContainer: { alignItems: 'center', paddingVertical: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 26 },
  modalSubtitle: { fontSize: 14, fontWeight: '600' },
  closeBtn: { padding: 6, backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginRight: 10 },
  sectionLine: { flex: 1, height: 1, backgroundColor: theme.colors.border, opacity: 0.5 },

  // Pending Approval Overlay
  pendingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  pendingText: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 },
});

export default PetCareSearchScreen;
