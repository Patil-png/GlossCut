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
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Users,
  Phone,
  Mail,
  ChevronDown,
  MessageSquare,
  RefreshCw,
  Bell,
  Calendar,
  HeartPulse,
  Dog,
  Sparkles,
  Smile,
  Navigation as NavigationIcon,
  ShieldCheck,
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import api from "../utils/api";

// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

const { width, height } = Dimensions.get("window");

const GlossCutImage = require("../assets/GlossCut.png");

// --- HELPER: HAVERSINE DISTANCE (AIR DISTANCE) ---
const getAirDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// --- HELPER: ROAD DISTANCE (OSRM BATCH) ---
const fetchRoadDistances = async (userCoords, shops) => {
  try {
    if (!userCoords || shops.length === 0) {
      console.log("⚠️ Distance Calc Skipped: User Coords or Shops empty.");
      return {};
    }

    const shopCoords = shops
      .filter(s => s.location?.coordinates?.length === 2 && (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0))
      .map(s => `${s.location.coordinates[0]},${s.location.coordinates[1]}`)
      .join(';');

    if (!shopCoords) return {};

    const url = `https://router.project-osrm.org/table/v1/driving/${userCoords.longitude},${userCoords.latitude};${shopCoords}?sources=0&annotations=distance`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.distances && data.distances[0]) {
      const distanceMap = {};
      const shopIds = shops.filter(s => s.location?.coordinates?.length === 2 && (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0)).map(s => s._id || s.id);

      data.distances[0].slice(1).forEach((dist, index) => {
        if (dist !== null && shopIds[index]) {
          distanceMap[shopIds[index]] = (dist / 1000).toFixed(1); // Convert meters to km
        }
      });
      return distanceMap;
    }
    return {};
  } catch (error) {
    console.error('OSRM Distance Error:', error);
    return {};
  }
};

// --- COMPONENT: PREMIUM SKELETON LOADER ---
const SkeletonCard = React.memo(({ styles }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.barberCard, { opacity: 0.8, marginBottom: 20 }]}>
      <Animated.View style={[styles.cardImageContainer, { backgroundColor: '#E1E1E1', opacity }]} />
      <View style={styles.cardBody}>
        <Animated.View style={{ height: 24, width: '60%', backgroundColor: '#E1E1E1', borderRadius: 4, marginBottom: 8, opacity }} />
        <Animated.View style={{ height: 16, width: '40%', backgroundColor: '#E1E1E1', borderRadius: 4, marginBottom: 16, opacity }} />
        <View style={styles.metaRow}>
          <Animated.View style={{ height: 14, width: 60, backgroundColor: '#E1E1E1', borderRadius: 4, opacity }} />
          <View style={styles.dotSeparator} />
          <Animated.View style={{ height: 14, width: 60, backgroundColor: '#E1E1E1', borderRadius: 4, opacity }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Animated.View style={{ height: 30, width: '40%', backgroundColor: '#E1E1E1', borderRadius: 4, opacity }} />
          <Animated.View style={{ height: 40, width: 100, backgroundColor: '#E1E1E1', borderRadius: 12, opacity }} />
        </View>
      </View>
    </View>
  );
});

// --- COMPONENT: STAGGERED ENTRANCE WRAPPER ---
const StaggeredCard = ({ children, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

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
            tension: 120,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 120,
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
        duration: 150,
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

// --- COMPONENT: PULSING AVAILABILITY DOT (Blinkit style) ---
const PulseDot = ({ isAvailable }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAvailable) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [isAvailable]);

  return (
    <View style={{ width: 10, height: 10, marginRight: 6, alignItems: 'center', justifyContent: 'center' }}>
      {isAvailable && (
        <Animated.View style={{
          position: 'absolute', width: 10, height: 10, borderRadius: 5,
          backgroundColor: '#10B981', opacity: 0.35,
          transform: [{ scale: pulseAnim }],
        }} />
      )}
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: isAvailable ? '#10B981' : '#FFF',
      }} />
    </View>
  );
};

// --- COMPONENT: BOUNCY MACRO-INTERACTION CARD ---
const BouncyCard = React.memo(({ children, onPress, disabled, style }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 6,
      tension: 150,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 150,
    }).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- OPTIMIZED COMPONENT: BARBER CARD ITEM ---
const BarberCardItem = React.memo(
  ({ item, isLiked, premiumInfo, theme, styles, onPress, onLikePress, onCheckAppointment, distance = null, isSmall = false, showLikeButton = true }) => {
    // Memoize expensive calculations
    const cardData = React.useMemo(() => {
      const isPendingApproval = item?.approvalStatus === 'pending';

      const { fullness, isAlmostFull, hasPremiumSlots, maxAppointments } = (() => {
        const maxApps = item?.owner?.maxAppointmentsPerDay
          ? Math.max(item.todaysBookings || 0, item.owner.maxAppointmentsPerDay)
          : 20;
        const full = Math.min(((item?.todaysBookings || 0) / maxApps) * 100, 100);
        return {
          maxAppointments: maxApps,
          fullness: full,
          isAlmostFull: full > 90,
          hasPremiumSlots: premiumInfo && premiumInfo.count > 0,
        };
      })();

      const capacityText = (() => {
        if (isAlmostFull && hasPremiumSlots) return `${premiumInfo?.count || 0} Premium Slots`;
        if (fullness > 90) return "High Demand";
        return `${maxAppointments - (item?.todaysBookings || 0)} slots left`;
      })();

      return { isPendingApproval, fullness, isAlmostFull, hasPremiumSlots, maxAppointments, capacityText };
    }, [item?.approvalStatus, item?.todaysBookings, item?.owner?.maxAppointmentsPerDay, premiumInfo]);

    // Memoize event handlers
    const handlePress = React.useCallback(() => onPress(item), [onPress, item]);
    const handleLike = React.useCallback(() => onLikePress(item.id), [onLikePress, item.id]);
    const handleBook = React.useCallback(() => onCheckAppointment(item), [onCheckAppointment, item]);

    const reviewCountDisplay = React.useMemo(() =>
      typeof item.reviewCount === 'number'
        ? item.reviewCount
        : (Array.isArray(item.reviews) ? item.reviews.length : 0),
      [item.reviewCount, item.reviews]
    );

    // Extract values from cardData for easier access
    const { isPendingApproval, hasPremiumSlots, fullness, isAlmostFull, capacityText } = cardData;

    if (isSmall) {
      return (
        <BouncyCard onPress={handlePress} disabled={!item.isAvailable || isPendingApproval} style={[styles.horizontalBarberCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {isPendingApproval && (
            <View style={styles.pendingOverlayHorizontal}>
              <RefreshCw size={12} color="#fff" />
              <Text style={styles.pendingTextHorizontal}>Review</Text>
            </View>
          )}
          <View style={styles.horizontalBarberInner}>
            <View style={styles.horizontalAvatarContainer}>
              <OptimizedImage
                source={item.image.uri || item.image}
                style={styles.horizontalAvatar}
                contentFit="cover"
              />
              <View style={[styles.horizontalStatusDot, { backgroundColor: item.isAvailable ? '#4CAF50' : '#F44336', borderColor: '#FFFFFF' }]} />
            </View>

            <View style={styles.horizontalDetails}>
              <Text style={[styles.horizontalName, { color: theme.colors.text, fontFamily: 'Nunito_700Bold' }]} numberOfLines={1}>{item.name}</Text>

              <View style={styles.horizontalMeta}>
                <Star size={12} color="#E8A020" fill="#E8A020" />
                <Text style={[styles.horizontalRating, { color: theme.colors.primary, fontFamily: 'Nunito_700Bold' }]}>
                  {item.rating > 0 ? item.rating.toFixed(1) : "New"}
                </Text>
                <Text style={[styles.horizontalReviews, { fontFamily: 'Nunito_600SemiBold' }]}>({reviewCountDisplay})</Text>

                <View style={[styles.dotSeparator, { marginHorizontal: 6, backgroundColor: theme.colors.border }]} />
                <Scissors size={10} color={theme.colors.textSecondary} style={{ marginRight: 2 }} />
                <Text style={[styles.horizontalServiceText, { color: theme.colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }]}>{item.totalServices} Svcs</Text>
              </View>

              <Text style={[styles.horizontalTime, { color: theme.colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }]}>~{item.avgAppointmentTime}</Text>
            </View>

            <View style={styles.horizontalAction}>
              <TouchableOpacity
                style={[styles.smallBookBtn, { backgroundColor: item.isAvailable ? theme.colors.primary : theme.colors.border }]}
                disabled={!item.isAvailable}
                onPress={handleBook}
                activeOpacity={0.7}
              >
                <Text style={[styles.smallBookBtnText, { color: '#FFFFFF', fontFamily: 'Nunito_700Bold' }]}>
                  {item.isAvailable ? 'Book' : 'Closed'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BouncyCard>
      );
    }

    return (
      <BouncyCard
        onPress={handlePress}
        disabled={!item.isAvailable || isPendingApproval}
        style={[styles.hsPremiumCard, { backgroundColor: theme.colors.card }]}
      >
        {/* Pending Approval Overlay */}
        {isPendingApproval && (
          <View style={styles.pendingOverlay}>
            <View style={styles.pendingBadge}>
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.pendingText}>Under Review</Text>
            </View>
          </View>
        )}

        {/* --- Hero Section --- */}
        <View style={styles.hsCardImageArea}>
          <OptimizedImage
            source={item.image.uri || item.image}
            style={styles.hsPremiumCardImage}
            contentFit="cover"
          />
          <View style={styles.hsImageOverlay} />

          {/* Top-right: Status badge */}
          <View style={styles.hsBadgeTopRight}>
            <View style={[styles.hsStatusBadge, { backgroundColor: item.isAvailable ? '#FFF' : '#000' }]}>
              <PulseDot isAvailable={item.isAvailable} />
              <Text style={[styles.hsStatusBadgeText, { color: item.isAvailable ? '#000' : '#FFF' }]}>
                {item.isAvailable ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Top-left: Category + Featured + Trending */}
          <View style={styles.hsBadgeTopLeft}>
            {item.listingTier === 'premium' && (
              <View style={styles.hsFeaturedBadge}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.hsFeaturedBadgeText}>FEATURED</Text>
              </View>
            )}
            {(item.todaysBookings || 0) >= 3 && (
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingBadgeText}>🔥 Popular</Text>
              </View>
            )}
            <View style={styles.hsCategoryBadge}>
              <Text style={styles.hsCategoryBadgeText}>{item.category?.toUpperCase() || 'EXPERT'}</Text>
            </View>
          </View>

          {/* Bottom-right: Distance pill on image */}
          {distance && (
            <View style={styles.distancePillOnImage}>
              <NavigationIcon size={10} color="#FFF" />
              <Text style={styles.distancePillText}>{distance} km</Text>
            </View>
          )}

          {/* Bookmark button */}
          {showLikeButton && (
            <TouchableOpacity style={styles.bookmarkBtn} onPress={handleLike} activeOpacity={0.7}>
              <Bookmark size={16} color={isLiked ? '#E11D48' : '#FFF'} fill={isLiked ? '#E11D48' : 'transparent'} />
            </TouchableOpacity>
          )}
        </View>

        {/* --- Content Section (HomeScreen Style) --- */}
        <View style={styles.hsPremiumCardContent}>
          <View style={styles.hsTitleRow}>
            <Text style={[styles.hsPremiumTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.hsRatingBadge}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.hsRatingText, { color: theme.colors.text }]}>
                {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>

          <View style={[styles.hsMetaRow, { alignItems: 'flex-start' }]}>
            <MapPin size={14} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={[styles.hsMetaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.shopName || item.address}
            </Text>
          </View>

          {item.type !== 'shop' && (
            <View style={styles.hsBookRow}>
              {item.isAvailable && (
                <View style={styles.liveQueueIndicator}>
                  <Text style={[styles.queueCount, { color: fullness > 80 ? '#F44336' : '#2E7D32', fontFamily: 'Nunito_700Bold' }]}>{capacityText}</Text>
                  <View style={styles.miniBarTrack}>
                    <Animated.View style={[styles.miniBarFill, { width: `${fullness}%`, backgroundColor: fullness > 80 ? '#F44336' : '#4CAF50' }]} />
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[styles.hsBookBtn, { backgroundColor: item.isAvailable ? '#E8A020' : '#D8F0D0' }]}
                onPress={handleBook}
                activeOpacity={0.8}
                disabled={!item.isAvailable}
              >
                <Text style={[styles.hsBookBtnText, { fontFamily: 'Nunito_700Bold' }]}>{item.isAvailable ? 'Book Slot' : 'Offline'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BouncyCard>
    );
  },
  (prev, next) => prev.item.id === next.item.id && prev.item.todaysBookings === next.item.todaysBookings && prev.item.isAvailable === next.item.isAvailable && prev.isLiked === next.isLiked
);

// --- COMPONENT: SHOP DETAILS BOTTOM SHEET ---
const ShopDetailsSheet = ({ visible, shop, onClose, theme, styles, onLike, onBook, onCardPress, getBarberData, likedProviders, premiumAvailability, roadDistances, airDistances }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Show loading briefly when modal opens
  useEffect(() => {
    if (visible && shop) {
      setIsLoading(true);
      // Brief loading delay for smooth UX
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [visible, shop]);

  const getReviewCount = (data, fallback) => {
    if (typeof data?.reviewCount === 'number') return data.reviewCount;
    if (Array.isArray(fallback)) return fallback.length;
    return 0;
  };

  // Local function to check if a provider is liked
  const checkIsLiked = (providerId, providerType) => {
    if (!Array.isArray(likedProviders)) return false;
    return likedProviders.some(
      like => like.providerId === providerId && like.providerType === providerType
    );
  };

  const ownerBarber = useMemo(() => {
    if (!shop?.owner?._id) return null;
    const data = getBarberData(shop.owner._id);
    // Allow barbers within an approved shop. If there's an explicit rejected status, hide them.
    if (data && data.approvalStatus && data.approvalStatus !== 'approved') return null;
    return {
      id: shop.owner._id || 'owner',
      type: 'barber',
      barberId: shop.owner._id,
      name: shop.owner?.name || 'Unknown Owner',
      address: shop?.address || 'Unknown Address',
      image: data?.image || (shop.owner?.profilePicture && shop.owner.profilePicture !== "https://via.placeholder.com/150" ? { uri: shop.owner.profilePicture } : GlossCutImage),
      rating: data?.rating || shop.owner?.rating || 0,
      reviewCount: getReviewCount(data, shop?.reviews),
      category: 'Barber',
      avgAppointmentTime: data?.avgAppointmentTime || '30 min',
      totalServices: data?.totalServices || 0,
      isAvailable: shop.owner?.isAvailable || false,
      todaysBookings: shop.ownerTodaysBookings || data?.todaysBookings || 0,
      listingTier: data?.listingTier || shop?.listingTier,
      shopName: shop?.name || 'Unknown Shop',
      owner: { ...(shop.owner || {}), maxAppointmentsPerDay: shop.originalOwnerMax || 10 },
      approvalStatus: data?.approvalStatus,
    };
  }, [shop, getBarberData]);

  const staffBarbers = useMemo(() => (shop?.staff || []).map((staffMember) => {
    if (!staffMember?._id) return null;
    const data = getBarberData(staffMember._id);
    // Allow barbers within an approved shop. If there's an explicit rejected status, hide them.
    if (data && data.approvalStatus && data.approvalStatus !== 'approved') return null;
    return {
      id: staffMember._id || 'staff',
      type: 'barber',
      barberId: data?.barberId || staffMember._id,
      name: staffMember?.name || data?.name || 'Unknown Barber',
      address: shop?.address || 'Unknown Address',
      image: data?.image || { uri: staffMember?.profilePicture || GlossCutImage },
      rating: data?.rating || 0,
      reviewCount: getReviewCount(data, []),
      category: 'Barber',
      avgAppointmentTime: data?.avgAppointmentTime || '30 min',
      totalServices: data?.totalServices || 0,
      isAvailable: staffMember?.isAvailable || false,
      todaysBookings: shop?.staffTodaysBookings?.[staffMember._id] || data?.todaysBookings || 0,
      listingTier: data?.listingTier || shop?.listingTier,
      shopName: shop?.name || 'Unknown Shop',
      owner: { maxAppointmentsPerDay: staffMember?.maxAppointmentsPerDay || 10 },
      approvalStatus: data?.approvalStatus,
    };
  }).filter(barber => barber !== null), [shop, getBarberData]);

  if (!shop || !visible) return null;

  // Show loading screen while data is being prepared
  if (isLoading) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background, paddingVertical: 40 }]}>
            <View style={styles.loadingContainer}>
              <View style={[styles.skeletonCircle, { backgroundColor: theme.colors.border, width: 60, height: 60, borderRadius: 30, marginBottom: 20 }]} />
              <View style={{ height: 24, width: '70%', backgroundColor: theme.colors.border, borderRadius: 4, marginBottom: 10 }} />
              <View style={{ height: 16, width: '50%', backgroundColor: theme.colors.border, borderRadius: 4, marginBottom: 30 }} />
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' }]}>Preparing shop details...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={1}>{shop.name || shop.shopName}</Text>
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
                <BarberCardItem
                  item={ownerBarber}
                  isLiked={checkIsLiked(ownerBarber.id, 'barber')}
                  premiumInfo={premiumAvailability[ownerBarber.id]}
                  distance={roadDistances?.[shop?._id] || airDistances?.[shop?._id]}
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
                  <BarberCardItem
                    key={barber.id}
                    item={barber}
                    isLiked={checkIsLiked(barber.id, 'barber')}
                    premiumInfo={premiumAvailability[barber.id]}
                    distance={roadDistances?.[shop?._id] || airDistances?.[shop?._id]}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};


// --- MAIN SCREEN ---
const SearchScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 2 : 1;

  const { forFriend, selectedCategory, selectedService } = route.params || {};
  const [userTier, setUserTier] = useState("premium");
  const { theme } = useTheme();
  const { likedProviders, setLikedProviders, likeProvider, unlikeProvider, checkIsLiked } = useAuth();

  const [inputText, setInputText] = useState(selectedService || "");
  const [debouncedQuery, setDebouncedQuery] = useState(selectedService || "");
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
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("Determining location...");
  const [roadDistances, setRoadDistances] = useState({});
  const [airDistances, setAirDistances] = useState({});

  // --- EFFECT: FETCH USER LOCATION ---
  useEffect(() => {
    (async () => {
      try {
        // 1. Try Loading from Cache for Instant UI
        const cached = await AsyncStorage.getItem("cachedLocation");
        if (cached) {
          const { location, timestamp, addressName } = JSON.parse(cached);
          if (addressName) setLocationName(addressName);
          if (Date.now() - timestamp < 10 * 60 * 1000) { // 10 min cache
            setUserLocation(location.coords);
          }
        }

        // 2. Request Fresh Permissions and Location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation(location.coords);

          // 3. Reverse Geocode to get City/State
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });

            if (geocode && geocode.length > 0) {
              const place = geocode[0];
              // Prioritize Neighborhood/Area names for a "Proper Area" feel
              const neighborhood = place.district || place.street || place.subregion || "";
              const city = place.city || place.subregion || "";
              
              // Construct a nice, descriptive "Area, City" string
              let formattedName = "";
              if (neighborhood && city && neighborhood !== city) {
                formattedName = `${neighborhood}, ${city}`;
              } else {
                formattedName = city || neighborhood || "Current Location";
              }
              
              setLocationName(formattedName);

              // 4. Update Cache with Address
              await AsyncStorage.setItem("cachedLocation", JSON.stringify({
                location,
                timestamp: Date.now(),
                addressName: formattedName
              }));
            }
          } catch (geoErr) {
            console.warn("Reverse Geocode Error:", geoErr);
          }
        } else {
          setLocationName("Location Access Denied");
        }
      } catch (e) {
        console.warn("Location error:", e);
        setLocationName("Location Unavailable");
      }
    })();
  }, []);

  const [alert, setAlert] = useState({ visible: false, message: "", type: "info" });
  const flatListRef = useRef(null);

  const styles = useMemo(() => getStyles(theme), [theme]);

  const getBarberData = useCallback((barberId) => {
    return allBarbersData.find(b => (b.barberId === barberId || b.id === barberId) && b.type === 'barber');
  }, [allBarbersData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputText);
    }, 150);
    return () => clearTimeout(handler);
  }, [inputText]);

  // Handle navigation from HomeScreen to open shop modal
  useEffect(() => {
    if (route.params?.selectedShop && route.params?.fromHomeScreen) {
      try {
        // Ensure the shop object has required properties
        const shop = route.params.selectedShop;
        if (shop && typeof shop === 'object') {
          setSelectedShop(shop);
        } else {
          console.warn('Invalid shop data received from HomeScreen');
        }
      } catch (error) {
        console.error('Error setting selected shop from HomeScreen:', error);
      }
    }
  }, [route.params]);

  useEffect(() => {
    if (selectedCategory) {
      setActiveFilters(prev => prev.includes(selectedCategory) ? prev : [selectedCategory]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedService) {
      setInputText(selectedService);
      setDebouncedQuery(selectedService);
    }
  }, [selectedService]);

  const triggerAlert = useCallback((message, type = "info") => {
    setAlert((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setAlert({ visible: true, message, type });
    }, 100);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // OPTIMIZED: Fetch Logic
  const fetchBarbers = useCallback(async () => {
    setRefreshing(true);
    const timestamp = Date.now();
    const lat = userLocation?.latitude;
    const lng = userLocation?.longitude;

    try {
      // --- STAGE 1: CORE FETCH (SLIM & FAST) ---
      const shopRes = await api.get(`/api/shop/all?slim=true&limit=100&t=${timestamp}${lat ? `&userLat=${lat}&userLng=${lng}` : ''}`, { timeout: 10000 });
      
      // Independent barbers (optional, don't let it block)
      let barberRes = { data: [] };
      try {
        barberRes = await api.get(`/api/barber-card/all?t=${timestamp}`, { timeout: 5000 });
      } catch (e) { console.warn("Barber cards fetch failed:", e.message); }

      if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
        const barberBookingsMap = {};
        // Placeholder bookings initially - pulse will fill accurately
        const formattedData = [];
        for (const shop of shopRes.data) {
          const shopBarbers = barberRes.data.filter((barber) => barber.shopId === shop._id);
          let totalMaxAppointments = 0;

          if (shop.owner?.isAvailable) {
            totalMaxAppointments += shop.owner.maxAppointmentsPerDay || 10;
          }
          (shop.staff || []).forEach(staff => {
            if (staff.isAvailable) totalMaxAppointments += staff.maxAppointmentsPerDay || 10;
          });


          const shopCard = {
            id: shop._id,
            _id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            image: (() => {
              const getImageUrl = (path) => {
                if (!path) return GlossCutImage;
                if (path.startsWith('http')) return { uri: path };
                const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.29.243:5000';
                return { uri: `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` };
              };
              return getImageUrl(shop.image || shop.owner?.profilePicture);
            })(),
            rating: shop.rating || 0,
            reviews: Array.isArray(shop.reviews) ? shop.reviews : [],
            reviewCount: shop.totalReviews || 0,
            services: shop.services || [],
            category: shop.category || "General",
            tag: shop.tag,
            avgAppointmentTime: shop.avgAppointmentTime || "30 min",
            totalServices: shop.services?.length || 0,
            isAvailable: !!shop.isAvailable,
            todaysBookings: 0, // Will be filled after batch fetch
            listingTier: shop.listingTier,
            totalBarbers: shop.totalBarbers || 1,
            shopRating: shop.shopRating || shop.rating || 0,
            originalOwnerMax: shop.owner?.maxAppointmentsPerDay || 10,
            ownerTodaysBookings: 0, // Will be filled
            staffTodaysBookings: {}, // Will be filled
            approvalStatus: shop.approvalStatus,
            location: shop.location, // Store location for distance calc
          };
          formattedData.push(shopCard);

          for (const barber of shopBarbers) {
            const barberCard = {
              id: barber.id,
              _id: barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              name: barber.name || "Unknown Barber",
              address: barber.address || shop.address || "Location Unavailable",
              image: barber.image || (barber.barberId?.profilePicture && barber.barberId.profilePicture !== "https://via.placeholder.com/150" ? { uri: barber.barberId.profilePicture } : GlossCutImage),
              rating: barber.rating || 0,
              reviews: Array.isArray(barber.reviews) ? barber.reviews : [],
              reviewCount: typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0),
              services: barber.services || [],
              category: barber.category || "General",
              tag: barber.specialties?.[0] || barber.tag || "General",
              avgAppointmentTime: barber.avgAppointmentTime || "30 min",
              totalServices: barber.services?.length || 0,
              isAvailable: barber.isAvailable && shop.isAvailable,
              todaysBookings: barberBookingsMap[barber.barberId] || barber.todaysBookings || 0,
              shopName: barber.shopName || shop.name,
              listingTier: barber.listingTier,
              parentShopId: shop._id,
              owner: barber.barberId,
              approvalStatus: barber.approvalStatus,
            };
            formattedData.push(barberCard);
          }
        }

        const rawIndependentBarbers = barberRes.data.filter((barber) => !barber.shopId);
        for (const barber of rawIndependentBarbers) {
          const barberCard = {
            id: barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            name: barber.name || "Unknown Barber",
            address: barber.address || "No address",
            image: barber.image || (barber.barberId?.profilePicture && barber.barberId.profilePicture !== "https://via.placeholder.com/150" ? { uri: barber.barberId.profilePicture } : GlossCutImage),
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

        // Final pass for shops to set total bookings
        formattedData.forEach(item => {
          if (item.type === 'shop') {
            const ownerId = item.owner?._id;
            const staffIds = (item.staff || []).map(s => s._id);
            item.ownerTodaysBookings = barberBookingsMap[ownerId] || 0;
            staffIds.forEach(id => { item.staffTodaysBookings[id] = barberBookingsMap[id] || 0; });
            item.todaysBookings = item.ownerTodaysBookings + Object.values(item.staffTodaysBookings).reduce((a, b) => a + b, 0);
          }
        });

        const shops = formattedData.filter(item => item.type === 'shop');
        // Include barbers in shops. Barbers might not have explicit approvalStatus.
        const barbersInShops = formattedData.filter(item => item.type === 'barber' && item.shopId && (!item.approvalStatus || item.approvalStatus === 'approved'));

        const mainList = [...shops]; // ONLY show shops in the search feed
        setAllBarbers(mainList);
        setAllBarbersData(barbersInShops);
        setFilteredBarbers(mainList);

        fetchPremiumAvailability(formattedData);
        // --- STAGE 2: PULSE FETCH (LIVE STATS PATCH) ---
        fetchLiveStatsPatch();
      }
    } catch (err) {
      if (err.message?.includes("Network Error") || err.code === "ECONNABORTED") {
        triggerAlert("Network Error. Check connection.", "error");
      } else {
        triggerAlert("Could not load shops and barbers.", "error");
      }
    } finally {
      setLoading(false);
      setShowLottie(false);
      setRefreshing(false);
    }
  }, [triggerAlert, userLocation]);

  const fetchLiveStatsPatch = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/booking/todays-stats?date=${todayStr}`, { timeout: 5000 });
      if (res.data) {
        const stats = res.data;
        setAllBarbers(prev => prev.map(item => {
          if (item.type === 'shop') {
            const ownerId = item.owner?._id;
            const ownerBookings = stats[ownerId] || 0;
            let staffTotal = 0;
            const staffPatch = {};
            (item.staff || []).forEach(s => {
              staffPatch[s._id] = stats[s._id] || 0;
              staffTotal += staffPatch[s._id];
            });
            return {
              ...item,
              ownerTodaysBookings: ownerBookings,
              staffTodaysBookings: staffPatch,
              todaysBookings: ownerBookings + staffTotal
            };
          }
          return item;
        }));
      }
    } catch (e) {
      console.warn("Pulse stats fetch failed:", e.message);
    }
  };

  // --- EFFECT: CALCULATE DISTANCES ---
  useEffect(() => {
    if (userLocation && allBarbers.length > 0) {
      // 1. Calculate Air Distances immediately (Fallback)
      const airMap = {};
      allBarbers.forEach(shop => {
        if (shop.location?.coordinates?.length === 2) {
          const dist = getAirDistance(
            userLocation.latitude,
            userLocation.longitude,
            shop.location.coordinates[1],
            shop.location.coordinates[0]
          );
          airMap[shop.id || shop._id] = dist.toFixed(1);
        }
      });
      setAirDistances(airMap);

      // 2. Fetch Proper Road Distances in background
      fetchRoadDistances(userLocation, allBarbers).then(roadMap => {
        setRoadDistances(prev => ({ ...prev, ...roadMap }));
      });
    }
  }, [userLocation, allBarbers]);

  const fetchPremiumAvailability = async (barbers) => {
    try {
      const today = new Date().toISOString();
      const allIds = barbers.map(b => b.barberId || b.id).filter(id => id);

      if (allIds.length > 0) {
        let allResults = {};
        // Chunk IDs to prevent URL length limit Network Errors
        const chunkSize = 40;
        for (let i = 0; i < allIds.length; i += chunkSize) {
          const chunk = allIds.slice(i, i + chunkSize).join(',');
          try {
            const res = await api.get(`/api/booking/check-premium-availability-batch?barberIds=${chunk}&date=${today}`, {
              timeout: 10000
            });
            Object.assign(allResults, res.data);
          } catch (err) {
            console.warn(`Premium chunk ${i} failed:`, err.message);
          }
        }
        setPremiumAvailability(allResults);
      }
    } catch (e) {
      console.error('Error fetching premium availability:', e);
    }
  };

  useEffect(() => {
    if (showLottie) { setTimeout(() => fetchBarbers(), 500); }
  }, [showLottie, fetchBarbers]);

  const performSortAndFilter = useCallback((query, filters) => {
    if (!allBarbers) return;
    let list = allBarbers.filter((barber) => {
      if (barber.approvalStatus !== 'approved') return false;

      // Handle Category Filtering
      const shopCategory = barber.category || "";
      const categoryFilters = filters.filter(f => ["Barber", "Unisex", "Women's Salon", "Pet Care"].includes(f));

      if (categoryFilters.length > 0) {
        // Fix: If Barber or Women's Salon is selected, also include Unisex shops
        const isMatch = categoryFilters.some(f => {
          if (f === "Barber" || f === "Women's Salon") {
            return shopCategory === f || shopCategory === "Unisex";
          }
          return shopCategory === f;
        });
        if (!isMatch) return false;
      }

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
    } else {
      // Default: Sort by Distance
      list.sort((a, b) => {
        const idA = a.id || a._id;
        const idB = b.id || b._id;
        const distA = parseFloat(roadDistances[idA] || airDistances[idA] || 99999);
        const distB = parseFloat(roadDistances[idB] || airDistances[idB] || 99999);

        // If distances are equal (or both 99999), preserve order
        if (distA === distB) return 0;
        return distA - distB;
      });
    }
    setFilteredBarbers(list);
  }, [allBarbers, roadDistances, airDistances]);

  useEffect(() => {
    if (!loading) { performSortAndFilter(debouncedQuery, activeFilters); }
  }, [debouncedQuery, activeFilters, loading, performSortAndFilter]);

  useFocusEffect(
    useCallback(() => {
      // Always refresh data when screen comes into focus
      if (!showLottie) {
        fetchBarbers();
      }
    }, [showLottie, fetchBarbers])
  );

  const handleLikePress = useCallback(async (barberId) => {
    const providerId = barberId;
    const providerType = 'barber';

    const result = await likeProvider(providerId, providerType);
    if (result === 'added') {
      triggerAlert("Added to favorites!", "success");
    } else if (result === 'removed') {
      triggerAlert("Removed from favorites", "info");
    }
  }, [likeProvider, triggerAlert]);

  const handleCardPress = useCallback(async (item) => {
    if (!item.isAvailable) {
      if (item.type === "shop") triggerAlert("This shop is currently closed.", "info");
      else triggerAlert("This barber is currently unavailable.", "info");
      return;
    }
    if (item.type === "shop") {
      setSelectedShop(item);
      return;
    }
    navigation.navigate("Booking", { barberData: item, userTier });
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/increment-click/${item.id}`);
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
      triggerAlert("Barber details unavailable", "error");
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
      triggerAlert("Barber details unavailable", "error");
    }
  }, [navigation, userTier, triggerAlert]);

  const clearSearch = () => setInputText("");

  const renderItem = useCallback(({ item }) => {
    const dist = roadDistances[item._id] || airDistances[item._id] || "0";

    // If it's a Barber (Independent or Staff), render the proper full-size Barber Card
    if (item.type === "barber") {
      return (
        <BarberCardItem
          item={item}
          isLiked={checkIsLiked(item.id, 'barber')}
          premiumInfo={premiumAvailability[item.id]}
          distance={parseFloat(dist).toFixed(1)}
          theme={theme}
          styles={styles}
          onPress={handleCardPress}
          onLikePress={handleLikePress}
          onCheckAppointment={handleCheckAppointment}
          isSmall={false} // Use full-size proper card
          showLikeButton={true}
        />
      );
    }

    // --- HOME SCREEN STYLE SHOP CARD ---
    return (
      <BouncyCard
        onPress={() => handleCardPress(item)}
        style={[styles.hsPremiumCard, { backgroundColor: theme.colors.card }]}
      >
        <View style={styles.hsCardImageArea}>
          <OptimizedImage
            source={item.image}
            style={styles.hsPremiumCardImage}
            contentFit="cover"
          />
          <View style={styles.hsImageOverlay} />

          {/* Top-right: Status badge */}
          <View style={styles.hsBadgeTopRight}>
            <View style={[styles.hsStatusBadge, { backgroundColor: item.isAvailable ? '#FFF' : '#000' }]}>
              <PulseDot isAvailable={item.isAvailable} />
              <Text style={[styles.hsStatusBadgeText, { color: item.isAvailable ? '#000' : '#FFF' }]}>
                {item.isAvailable ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Top-left: Category + Featured + Priority */}
          <View style={styles.hsBadgeTopLeft}>
            {item.isPriority && (
              <View style={styles.hsFeaturedBadge}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.hsFeaturedBadgeText}>FEATURED</Text>
              </View>
            )}
            <View style={styles.hsCategoryBadge}>
              <Text style={styles.hsCategoryBadgeText}>{item.category?.toUpperCase() || 'SALON'}</Text>
            </View>
          </View>

          {/* Bottom-right: Distance pill */}
          <View style={styles.distancePillOnImage}>
            <NavigationIcon size={10} color="#FFF" />
            <Text style={styles.distancePillText}>~{parseFloat(dist).toFixed(1)} km</Text>
          </View>

          {item.isVerified && (
            <View style={styles.hsVerifiedBadge}>
              <ShieldCheck size={12} color="#FFF" />
              <Text style={styles.hsVerifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.hsPremiumCardContent}>
          <View style={styles.hsTitleRow}>
            <Text style={[styles.hsPremiumTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.hsRatingBadge}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.hsRatingText, { color: theme.colors.text }]}>
                {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>

          <View style={[styles.hsMetaRow, { alignItems: 'flex-start' }]}>
            <MapPin size={14} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={[styles.hsMetaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
      </BouncyCard>
    );
  }, [theme, styles, handleCardPress, roadDistances, airDistances, checkIsLiked, premiumAvailability, handleLikePress, handleCheckAppointment]);

  const keyExtractor = useCallback((item) => item.id, []);

  const filterOptions = useMemo(() => [
    { label: "Open Now", value: "Online", icon: <Clock size={14} color="inherit" /> },
    { label: "Top Rated", value: "Rating", icon: <Star size={14} color="inherit" /> },
    { label: "Trending", value: "Number of Reviews", icon: <Zap size={14} color="inherit" /> },
  ], []);

  const categoryOptions = useMemo(() => [
    { label: "Barber", value: "Barber", icon: Scissors },
    { label: "Unisex", value: "Unisex", icon: User },
    { label: "Women Salon", value: "Women's Salon", icon: Smile },
  ], []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.card} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.dark ? theme.colors.background : '#F7F7F7' }]}>

        {/* --- PREMIUM COMPACT TOP SECTION --- */}
        <View style={styles.topSection}>
          {/* CONSOLIDATED HEADER (Location + Navigation) */}
          <View style={styles.locationRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>
                Exploring {selectedCategory === "Barber" ? "Top Barbers" :
                  selectedCategory === "Women's Salon" ? "Women Salons" :
                    selectedCategory === "Pet Care" ? "Pet Care" :
                      selectedService ? selectedService : "Experts"} in
              </Text>
              <Text style={styles.locationValue} numberOfLines={1}>{locationName} • Now ▾</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.headerIconBtn}>
              <Bell size={20} color={theme.colors.text} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* SEARCH PILL */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color={theme.colors.primary} strokeWidth={2.5} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search name, service or shop..."
                placeholderTextColor={theme.colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="search"
              />
              {inputText.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchBtn}>
                  <X size={12} color="#fff" strokeWidth={3} />
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
        </View>




        {/* LIST */}
        <View style={{ flex: 1 }}>
          {showLottie ? (
            <View style={styles.centerContent}>
              <LottieView source={require("../assets/Employee Search.json")} autoPlay loop={false} onAnimationFinish={() => setShowLottie(false)} style={{ width: 200, height: 200 }} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Finding experts...</Text>
            </View>
          ) : loading ? (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} styles={styles} />)}
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              key={numColumns}
              data={filteredBarbers}
              renderItem={({ item, index }) => (
                <StaggeredCard index={index}>
                  {renderItem({ item })}
                </StaggeredCard>
              )}
              keyExtractor={keyExtractor}
              numColumns={numColumns}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
              contentContainerStyle={[
                styles.listContent,
                numColumns > 1 && { paddingHorizontal: 10 }
              ]}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={6}
              maxToRenderPerBatch={4}
              windowSize={5}
              updateCellsBatchingPeriod={50}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchBarbers}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              }
              ListHeaderComponent={
                <View style={{ backgroundColor: theme.dark ? theme.colors.background : '#F7F7F7', paddingBottom: 10 }}>
                  {/* UNIFIED FILTER ROW — categories + filters in one horizontal scroll */}
                  {showFilters && (
                    <View style={[styles.categoryScrollContainer, { paddingHorizontal: 0, marginBottom: 12, marginTop: 5 }]}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
                        {/* Category Pills */}
                        {categoryOptions.map((cat) => {
                          const isActive = activeFilters.includes(cat.value);
                          const IconComp = cat.icon;
                          return (
                            <TouchableOpacity
                              key={cat.value}
                              activeOpacity={0.7}
                              style={[
                                styles.categoryPill,
                                {
                                  backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                                  shadowOpacity: isActive ? 0.25 : 0.05,
                                }
                              ]}
                              onPress={() => setActiveFilters((prev) =>
                                prev.includes(cat.value) ? prev.filter(f => f !== cat.value) : [...prev, cat.value]
                              )}
                            >
                              <IconComp size={11} color={isActive ? "#FFF" : theme.colors.textSecondary} strokeWidth={2.5} style={{ marginRight: 4 }} />
                              <Text style={[styles.categoryPillText, { color: isActive ? "#fff" : theme.colors.text }]}>
                                {cat.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Inline divider shown when filter panel is open */}
                        <View style={{ width: 1, height: 20, backgroundColor: theme.colors.border, marginHorizontal: 6, alignSelf: 'center' }} />

                        {/* Filter Chips — inline, appear only when filter icon is tapped */}
                        {filterOptions.map((option) => {
                          const isActive = activeFilters.includes(option.value);
                          return (
                            <TouchableOpacity
                              key={option.value}
                              activeOpacity={0.7}
                              style={[
                                styles.categoryPill,
                                {
                                  backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                                  shadowOpacity: isActive ? 0.2 : 0.05,
                                }
                              ]}
                              onPress={() => setActiveFilters((prev) =>
                                prev.includes(option.value) ? prev.filter(f => f !== option.value) : [...prev, option.value]
                              )}
                            >
                              {isActive && <CheckCircle size={10} color="#fff" style={{ marginRight: 3 }} strokeWidth={3} />}
                              <Text style={[styles.categoryPillText, { color: isActive ? "#fff" : theme.colors.text }]}>
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.listHeader}>
                    <View style={styles.listHeaderAccent} />
                    <Text style={[styles.listHeaderTitle, { color: theme.colors.text }]}>
                      {filteredBarbers.length} Experts Near You
                    </Text>
                    <View style={[styles.listHeaderBadge, { backgroundColor: theme.colors.primary + '18' }]}>
                      <Text style={[styles.listHeaderBadgeText, { color: theme.colors.primary }]}>{filteredBarbers.length}</Text>
                    </View>
                  </View>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Search size={48} color={theme.colors.border} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Experts Found</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                    We couldn't find anything matching your search. Try different filters or categories.
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* BOTTOM SHEET MODAL */}
        {(() => {
          try {
            return (
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
                likedProviders={likedProviders}
                premiumAvailability={premiumAvailability}
                roadDistances={roadDistances}
                airDistances={airDistances}
              />
            );
          } catch (error) {
            console.error('Error rendering ShopDetailsSheet:', error);
            return null;
          }
        })()}

        <TopToastAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={hideAlert} theme={theme} styles={styles} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- POLISHED PREMIUM STYLES (WITH META ROW) ---
const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // --- TOP SECTION ---
  topSection: {
    backgroundColor: theme.colors.headerBg,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    zIndex: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 8,
  },
  locationIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    color: theme.colors.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.08 * 16,
  },
  locationValue: {
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
    color: theme.colors.text,
  },

  // Header
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 8, 
    paddingBottom: 6 
  },
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20, 
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: { 
    fontSize: 22, 
    fontFamily: "Nunito_800ExtraBold", 
    color: theme.colors.text, 
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    fontSize: 13, 
    fontFamily: "Nunito_400Regular", 
    color: theme.colors.textSecondary 
  },
  headerIconBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: theme.colors.card, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  notificationBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: theme.colors.error, 
    borderWidth: 1.5, 
    borderColor: theme.colors.card 
  },

  // Search
  searchContainer: { paddingHorizontal: 20, paddingBottom: 10 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56, 
    borderRadius: 28, // Pill shape
    paddingHorizontal: 16, 
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    fontFamily: 'Nunito_400Regular', 
    color: theme.colors.text,
    height: '100%', 
    paddingLeft: 8 
  },
  clearSearchBtn: { 
    backgroundColor: theme.colors.border, 
    borderRadius: 10, 
    padding: 4 
  },
  searchDivider: { 
    paddingLeft: 12, 
    borderLeftWidth: 1, 
    borderLeftColor: theme.colors.border, 
    height: 24, 
    justifyContent: 'center' 
  },
  micIcon: { marginLeft: 10 },

  // Filter Dropdown
  filterDropdown: { position: 'absolute', top: 80, right: 20, zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  filterDropdownContent: { backgroundColor: theme.colors.card, borderRadius: 16, paddingVertical: 8, minWidth: 180, borderWidth: 1, borderColor: theme.colors.border },
  dropdownFilterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  dropdownFilterItemActive: { backgroundColor: theme.colors.primary + '15' },
  dropdownFilterText: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginLeft: 12, flex: 1 },
  dropdownFilterTextActive: { color: theme.colors.primary },

  // Filters
  filtersContainer: { overflow: 'hidden' },
  filterContainer: { paddingHorizontal: 20, paddingBottom: 8, alignItems: 'center' },
  filterChip: { 
    paddingVertical: 6, 
    paddingHorizontal: 14, 
    borderRadius: 20, 
    marginRight: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  filterText: { 
    fontSize: 12, 
    fontFamily: "Nunito_600SemiBold" 
  },

  // Categories
  categoryScrollContainer: { marginBottom: 10, marginTop: 4 },
  categoryScrollContent: { paddingHorizontal: 20 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    marginTop: 20, 
    paddingHorizontal: 20 
  },
  listHeaderAccent: { 
    width: 6, 
    height: 22, 
    borderRadius: 3, 
    backgroundColor: theme.colors.primary, 
    marginRight: 10 
  },
  listHeaderTitle: { 
    fontSize: 16, 
    fontFamily: 'Nunito_700Bold', 
    color: theme.colors.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.08 * 16,
    flex: 1 
  },
  listHeaderBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20,
    backgroundColor: theme.colors.badgeBg,
  },
  listHeaderBadgeText: { 
    fontSize: 12, 
    fontFamily: 'Nunito_700Bold',
    color: theme.colors.primary,
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  loadingText: { marginTop: 0, fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // --- MASTERPIECE STARTUP UI STYLES ---
  masterpieceShopCard: { borderRadius: 24, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  masterpieceHero: { height: 180, position: "relative" },
  masterpieceShopImage: { width: "100%", height: "100%" },
  masterpieceGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },

  badgeTopRight: { position: "absolute", top: 12, right: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#F1F5F9", backgroundColor: "#FFF" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, position: "relative" },
  pingAnim: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", opacity: 0.3, top: -3, left: -3 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, color: "#000" },

  badgeTopLeft: { position: "absolute", top: 12, left: 12, gap: 6 },
  categoryBadgeImage: { backgroundColor: "#0F172A", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  categoryBadgeText: { fontSize: 9, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1.2 },

  featuredBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F59E0B", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "900", marginLeft: 4, letterSpacing: 1 },

  masterpieceShopBody: { padding: 16 },
  shopMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shopMasterName: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, flex: 1, marginRight: 10 },
  shopLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  shopLocationText: { fontSize: 13, fontWeight: '500', marginLeft: 6, flex: 1, lineHeight: 18 },

  ratingPillStartup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6 },
  ratingPillText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  shopStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : '#F1F3F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  leftStatsGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  statIconBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  statValue: { fontSize: 13, fontWeight: '900', letterSpacing: -0.2 },
  statLabel: { fontSize: 8.5, fontWeight: '700', opacity: 0.6, marginTop: -1, textTransform: 'uppercase', letterSpacing: 0.3 },
  vDivider: { width: 1, height: 16, backgroundColor: theme.colors.border, opacity: 0.5 },

  shopBookBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  shopBookBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', marginRight: 4, letterSpacing: 0.5 },

  // Barber Card Redesign
  premiumBarberCard: { borderRadius: 24, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  masterpieceImageArea: { height: 180, position: 'relative' },
  masterpieceImage: { width: '100%', height: '100%' },
  masterpieceBadges: { position: 'absolute', top: 16, left: 16 },
  glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  glassBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff', marginLeft: 6 },
  masterpieceHeart: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayCategory: { position: 'absolute', bottom: 16, left: 16, backgroundColor: '#000000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  overlayCategoryText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },

  masterpieceBody: { padding: 16 },
  masterpieceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  masterpieceTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, flex: 1, marginRight: 10 },
  masterpieceLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  masterpieceSubText: { fontSize: 13, fontWeight: '500', marginLeft: 6, flex: 1, lineHeight: 18 },
  zomatoRating: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, gap: 3 },
  zomatoRatingText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  masterpieceInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border, marginBottom: 6, opacity: 0.8 },
  infoSpan: { alignItems: 'center' },
  infoSpanValue: { fontSize: 15, fontWeight: '900' },
  infoSpanLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  infoDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },

  masterpieceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveQueueIndicator: { flex: 1, marginRight: 20 },
  queueCount: { fontSize: 12, fontWeight: '900', marginBottom: 6 },
  miniBarTrack: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },

  premiumBookBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16 },
  premiumBookBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', marginRight: 8 },

  // --- BARBER CARD STYLES (Used in Modal) ---
  barberCard: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: theme.colors.border },

  // NEW: Compact Horizontal Layout for Modal
  horizontalBarberCard: { borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, overflow: 'hidden' },
  horizontalBarberInner: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  horizontalAvatarContainer: { position: 'relative' },
  horizontalAvatar: { width: 64, height: 64, borderRadius: 32 },
  horizontalStatusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  horizontalDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  horizontalName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  horizontalMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  horizontalRating: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  horizontalReviews: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginLeft: 2 },
  horizontalServiceText: { fontSize: 12, fontWeight: '600' },
  horizontalTime: { fontSize: 12, fontWeight: '500' },
  horizontalAction: { marginLeft: 12 },
  smallBookBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  smallBookBtnText: { fontSize: 13, fontWeight: '800' },
  pendingOverlayHorizontal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pendingTextHorizontal: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6 },

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
  toastContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 28, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 20, 
  },
  toastIcon: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  toastText: { 
    fontSize: 13, 
    fontFamily: 'Nunito_600SemiBold' 
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { maxHeight: height * 0.85, height: 'auto', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 30, backgroundColor: theme.colors.background },
  modalHandleContainer: { alignItems: 'center', paddingVertical: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: theme.colors.text },
  modalSubtitle: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.colors.textSecondary },
  closeBtn: { padding: 6, backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginRight: 10 },
  sectionLine: { flex: 1, height: 1, backgroundColor: theme.colors.border, opacity: 0.5 },

  // Pending Approval Overlay
  pendingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  pendingText: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 },

  // ===== LOADING STYLES =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },

  distanceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 11, fontWeight: '900', letterSpacing: -0.2 },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  // =============================================
  // HOME SCREEN CARD STYLES (hs* prefix) - exact match
  // =============================================
  hsPremiumCard: { borderRadius: 24, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  hsCardImageArea: { height: 210, position: 'relative' },
  hsPremiumCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hsImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },

  hsBadgeTopRight: { position: 'absolute', top: 12, right: 12 },
  hsStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  hsStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, position: 'relative' },
  hsPingAnim: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', opacity: 0.3, top: -3, left: -3 },
  hsStatusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  hsBadgeTopLeft: { position: 'absolute', top: 12, left: 12, gap: 6 },
  hsFeaturedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  hsFeaturedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 4, letterSpacing: 1 },
  hsCategoryBadge: { backgroundColor: '#0F172A', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hsCategoryBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.2 },

  hsVerifiedBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  hsVerifiedText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginLeft: 4 },

  hsPremiumCardContent: { padding: 16 },
  hsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  hsPremiumTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, flex: 1, marginRight: 10 },
  hsRatingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  hsRatingText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },

  hsMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  hsMetaText: { fontSize: 13, fontWeight: '500', marginLeft: 6, flex: 1, lineHeight: 18 },

  hsDistanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hsDistanceText: { fontSize: 12, fontWeight: '800', color: '#4C763B', marginLeft: 6 },

  hsBookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  hsBookBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  hsBookBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13, marginRight: 4 },

  // Startup Extras
  trendingBadge: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  trendingBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  distancePillOnImage: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  distancePillText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  bookmarkBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
});

export default SearchScreen;
