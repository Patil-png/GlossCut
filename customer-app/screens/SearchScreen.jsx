import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo
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
  Linking
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OptimizedImage from "../components/OptimizedImage";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
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
  Sparkles,
  Smile,
  Navigation as NavigationIcon,
  ShieldCheck
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import api from "../utils/api";
import BarberCard from "../src/components/BarberCard";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';


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
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
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
    // Optimization: Only animate the first few items to prevent lag during fast scroll
    if (index > 8) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true
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
  ({ visible, message, type = "success", onHide, theme, styles, topInset }) => {
    const translateY = useRef(new Animated.Value(-150)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: topInset,
            useNativeDriver: true,
            friction: 6,
            tension: 120
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 120
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
        useNativeDriver: true
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
          transform: [{ translateY }, { scale }]
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
          transform: [{ scale: pulseAnim }]
        }} />
      )}
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: isAvailable ? '#10B981' : '#FFF'
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
      tension: 150
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 150
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

// --- COMPONENT: SCROLLING PLACEHOLDER (Search Screen Version) ---
const ScrollingPlaceholder = React.memo(({ styles }) => {
  const phrases = [
    "Search with shop name...",
    "Search with barber name...",
    "Search according to category...",
    "Search with shop address...",
  ];

  const [index, setIndex] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(scrollAnim, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad)
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        }),
      ]).start(() => {
        setIndex((prev) => (prev + 1) % phrases.length);
        scrollAnim.setValue(20);
        Animated.parallel([
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad)
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
        ]).start();
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.placeholderContainer}>
      <Animated.Text
        style={[
          styles.searchPlaceholder,
          {
            opacity: opacityAnim,
            transform: [{ translateY: scrollAnim }]
          }
        ]}
      >
        {phrases[index]}
      </Animated.Text>
    </View>
  );
});

// Internal BarberCardItem removed in favor of src/components/BarberCard.jsx


// --- COMPONENT: SHOP DETAILS BOTTOM SHEET ---
const ShopDetailsSheet = memo(({ visible, shop, onClose, theme, styles, onLike, onBook, onCardPress, getBarberData, likedProviders, premiumAvailability, roadDistances, airDistances }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);

  // Responsive Breakpoints & Adaptive Sizing
  const isTablet = width > 768;
  const isLargePhone = width > 480 && width <= 768;

  // Decide column count based on available modal width
  const modalWidth = isTablet ? Math.min(width * 0.8, 750) : width;
  const numColumns = isTablet ? 3 : (isLargePhone ? 2 : 1);

  const modalMaxHeight = height * 0.75;
  const cardGap = 12;
  const cardWidth = (modalWidth - (40 + (numColumns - 1) * cardGap)) / numColumns;



  useEffect(() => {
    if (visible && shop) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible, shop]);



  const handleDirections = () => {
    if (!shop?.location?.coordinates) return;
    const [lng, lat] = shop.location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${shop.name})`
    });
    Linking.openURL(url);
  };

  const checkIsLiked = (providerId, providerType) => {
    if (!Array.isArray(likedProviders)) return false;
    return likedProviders.some(like => like.providerId === providerId && like.providerType === providerType);
  };

  const allExperts = useMemo(() => {
    if (!shop) return [];
    const list = [];

    // Helper to format experts
    const formatExpert = (member, isOwner = false) => {
      const memberId = member._id || member.id;
      if (!memberId) return null;

      const data = getBarberData(memberId);
      const ownerId = shop.owner?._id || shop.owner?.id;
      const ownerData = ownerId ? getBarberData(ownerId) : null;
      const ownerServices = ownerData?.services || [];

      let services = data?.services || [];
      if (!isOwner && services.length === 0 && ownerServices.length > 0) {
        services = ownerServices;
      }

      return {
        id: memberId,
        type: 'barber',
        barberId: memberId,
        name: member.name || 'Professional',
        address: shop.address,
        image: data?.image || (member.profilePicture && member.profilePicture !== "https://via.placeholder.com/150" ? { uri: member.profilePicture } : GlossCutImage),
        rating: data?.rating || member.rating || 0,
        reviewCount: (typeof data?.reviewCount === 'number' ? data.reviewCount : (Array.isArray(member.reviews) ? member.reviews.length : 0)),
        category: 'Expert',
        isAvailable: member.isAvailable,
        todaysBookings: isOwner ? (shop.ownerTodaysBookings || 0) : (shop.staffTodaysBookings?.[memberId] || 0),
        listingTier: data?.listingTier || shop.listingTier,
        shopName: shop.name,
        approvalStatus: data?.approvalStatus,
        services: services
      };
    };

    const ownerId = shop.owner?._id || shop.owner?.id;
    if (shop.owner && ownerId) {
      const formattedOwner = formatExpert(shop.owner, true);
      if (formattedOwner) list.push(formattedOwner);
    }

    (shop.staff || []).forEach(staff => {
      const staffId = staff._id || staff.id;
      if (staffId && staffId !== ownerId) {
        const formattedStaff = formatExpert(staff);
        if (formattedStaff) list.push(formattedStaff);
      }
    });

    return list;
  }, [shop, getBarberData, likedProviders, premiumAvailability, roadDistances, airDistances]);

  if (!shop || !visible) return null;

  if (isLoading) {
    return (
      <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
          <View style={[styles.modalContentFallback, { backgroundColor: theme.colors.background, alignSelf: 'center', width: modalWidth }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </Modal>
    );
  }

  const currentDistance = roadDistances?.[shop._id] || airDistances?.[shop._id];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[
        styles.modalOverlay,
        isTablet && { justifyContent: 'center', alignItems: 'center' }
      ]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />

        <View style={[
          styles.modalShell,
          {
            backgroundColor: theme.colors.background,
            height: modalMaxHeight,
            width: modalWidth,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: isTablet ? 32 : 0,
            borderBottomRightRadius: isTablet ? 32 : 0,
            overflow: 'hidden',
          }
        ]}>
          <View style={[styles.heroContainer, { height: 'auto', paddingBottom: 15, overflow: 'hidden', borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}>
            <LinearGradient
              colors={['#0F172A', '#111111']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(200, 255, 0, 0.02)' }} />

            {/* Bottom Sheet Handle (Integrated) */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
            </View>

            {/* Brand Accent Bar */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              backgroundColor: '#C8FF00',
              opacity: 0.6
            }} />

            {/* Subtle Decorative Blob */}
            <View style={{
              position: 'absolute',
              bottom: -40,
              right: -40,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#C8FF00',
              opacity: 0.03
            }} />

            {/* Premium Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.floatingCloseBtn, { top: 14, right: 16 }]}
              activeOpacity={0.8}
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <X size={18} color="#FFF" strokeWidth={3} />
            </TouchableOpacity>

            {/* Hero Content Overlay (Compact & Responsive) */}
            <View style={[styles.heroContent, { position: 'relative', marginTop: 15, paddingLeft: 24, paddingRight: 60 }]}>
              <View style={styles.badgeRow}>
                {shop.shopRating > 0 && (
                  <View style={styles.heroRatingBadge}>
                    <Star size={10} color="#FFD700" fill="#FFD700" style={{ marginRight: 4 }} />
                    <Text style={styles.heroRatingText}>{Number(shop.shopRating).toFixed(1)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">{shop.name}</Text>

              <View style={styles.heroLocationRow}>
                <MapPin size={12} color="#C8FF00" style={{ marginRight: 4 }} />
                <Text style={styles.heroAddressText} numberOfLines={1}>{shop.address}</Text>
              </View>

              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.roadRouteBtn}
                  onPress={handleDirections}
                  activeOpacity={0.8}
                >
                  <NavigationIcon size={14} color="#1A1A1A" style={{ marginRight: 6 }} />
                  <Text style={styles.roadRouteText}>Visualize Road Route</Text>
                </TouchableOpacity>

                {currentDistance && (
                  <View style={styles.heroDistanceBadge}>
                    <MapPin size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.heroDistanceText}>{currentDistance} km</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* List Section */}
          <View style={styles.listSection}>


            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 20),
                paddingHorizontal: 20,
                paddingTop: 4
              }}
            >
              <View style={[styles.listHeaderInner, { paddingHorizontal: 0, marginBottom: 12 }]}>
                <View>
                  <Text style={styles.listSectionTitle}>Select a Professional</Text>
                  <Text style={styles.listSectionSubtitle}>Choose who you want to book with</Text>
                </View>
                <View style={styles.availabilitySummary}>
                  <Text style={styles.availabilityCount}>{allExperts.filter(b => b.isAvailable).length}</Text>
                  <Text style={styles.availabilityLabel}>Available</Text>
                </View>
              </View>
              <View style={[styles.expertGrid, { gap: cardGap }]}>
                {allExperts.map((expert) => (
                  <View key={expert.id} style={{ width: cardWidth, marginBottom: 4 }}>
                    <BarberCard
                      item={expert}
                      isLiked={checkIsLiked(expert.id, 'barber')}
                      premiumInfo={premiumAvailability[expert.id]}
                      distance={currentDistance}
                      onPress={onCardPress}
                      onLikePress={onLike}
                      onBookPress={onBook}
                    />
                  </View>
                ))}
              </View>

              {allExperts.length === 0 && (
                <View style={styles.emptyExpertState}>
                  <Users size={40} color={theme.colors.border} />
                  <Text style={styles.emptyExpertText}>No professionals available at this shop.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
});



// --- MAIN SCREEN ---
const SearchScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
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

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const flatListRef = useRef(null);

  const styles = useMemo(() => getStyles(theme, insets), [theme, insets]);

  const barberDataMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(allBarbersData)) {
      allBarbersData.forEach(b => {
        if (b.type === 'barber') {
          if (b.barberId) map.set(b.barberId, b);
          if (b.id) map.set(b.id, b);
        }
      });
    }
    return map;
  }, [allBarbersData]);

  const getBarberData = useCallback((barberId) => {
    return barberDataMap.get(barberId);
  }, [barberDataMap]);

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

  // Handle navigation from HomeScreen, HistoryScreen or ShopMapScreen to open shop modal
  useEffect(() => {
    const { selectedShopId, fromHistoryScreen, fromShopMapScreen, fromHomeScreen } = route.params || {};

    if ((fromHistoryScreen || fromShopMapScreen || fromHomeScreen) && selectedShopId && allBarbers.length > 0) {
      // Find the shop (robustly searching by shop ID, owner ID, or staff ID)
      const shop = allBarbers.find(s =>
        (s._id || s.id) === selectedShopId ||
        (s.owner?._id || s.owner?.id) === selectedShopId ||
        (s.staff || []).some(staff => (staff._id || staff.id) === selectedShopId)
      );

      if (shop) {
        // Only update if it's actually different to prevent re-render loops
        if (!selectedShop || (selectedShop._id || selectedShop.id) !== (shop._id || shop.id)) {
          setSelectedShop(shop);
        }
        // CRITICAL: Clear the params so it doesn't trigger again on re-renders or updates
        navigation.setParams({ fromHistoryScreen: false, fromShopMapScreen: false, fromHomeScreen: false, selectedShopId: null });
      }
    }
  }, [route.params?.selectedShopId, route.params?.fromHistoryScreen, route.params?.fromShopMapScreen, route.params?.fromHomeScreen, allBarbers, navigation]);

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
    setToast((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setToast({ visible: true, message, type });
    }, 100);
  }, []);

  const hideAlert = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
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
            shopImages: shop.shopImages || [],
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
              rating: barber.rating || barber.averageRating || 0,
              reviews: Array.isArray(barber.reviews) ? barber.reviews : [],
              numberOfReviews: barber.numberOfReviews || (typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0)),
              reviewCount: barber.numberOfReviews || (typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0)),
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
              approvalStatus: barber.approvalStatus
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
            rating: barber.rating || barber.averageRating || 0,
            reviews: Array.isArray(barber.reviews) ? barber.reviews : [],
            numberOfReviews: barber.numberOfReviews || (typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0)),
            reviewCount: barber.numberOfReviews || (typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : 0)),
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
            approvalStatus: barber.approvalStatus
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
        const barbersInShops = formattedData.filter(item => item.type === 'barber');

        const mainList = [...shops]; // ONLY show shops in the search feed
        setAllBarbers(mainList);
        setAllBarbersData(barbersInShops);

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

  const filteredBarbers = useMemo(() => {
    if (!allBarbers) return [];
    let list = allBarbers.filter((barber) => {
      if (barber.approvalStatus !== 'approved') return false;

      // Handle Category Filtering
      const shopCategory = barber.category || "";
      const categoryFilters = activeFilters.filter(f => ["Barber", "Unisex", "Women's Salon", "Pet Care"].includes(f));

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

      if (activeFilters.includes("Online") && !barber.isAvailable) return false;
      if (activeFilters.includes("Offline") && barber.isAvailable) return false;
      if (debouncedQuery && debouncedQuery.trim() !== "") {
        const lowerQuery = debouncedQuery.toLowerCase().trim();
        const name = (barber.name || "").toLowerCase();
        const address = (barber.address || "").toLowerCase();
        if (!name.includes(lowerQuery) && !address.includes(lowerQuery)) return false;
      }
      return true;
    });

    if (activeFilters.includes("Rating")) {
      list.sort((a, b) => b.rating - a.rating);
    } else if (activeFilters.includes("Number of Reviews")) {
      list.sort((a, b) => (Array.isArray(b.reviews) ? b.reviews.length : 0) - (Array.isArray(a.reviews) ? a.reviews.length : 0));
    } else {
      // Default: Sort by Distance
      list.sort((a, b) => {
        const idA = a.id || a._id;
        const idB = b.id || b._id;
        const distA = parseFloat(roadDistances[idA] || airDistances[idA] || 99999);
        const distB = parseFloat(roadDistances[idB] || airDistances[idB] || 99999);

        if (distA === distB) return 0;
        return distA - distB;
      });
    }
    return list;
  }, [allBarbers, roadDistances, airDistances, debouncedQuery, activeFilters]);

  useFocusEffect(
    useCallback(() => {
      // Always refresh data when screen comes into focus
      if (!showLottie) {
        fetchBarbers();
      }
    }, [showLottie, fetchBarbers])
  );

  const handleLikePress = useCallback(async (barber) => {
    const providerId = typeof barber === 'object' ? (barber.id || barber._id) : barber;
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
        userTier: userTier
      });
    } else {
      triggerAlert("Barber details unavailable", "error");
    }
  }, [navigation, userTier, triggerAlert]);

  const handleCloseShopModal = useCallback(() => {
    setSelectedShop(null);
  }, []);

  const handleCardPressForModal = useCallback((item) => {
    if (item?.barberId) {
      setSelectedShop(null);
      navigation.navigate("Booking", {
        barberData: item,
        userTier: userTier
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
        <BarberCard
          item={item}
          isLiked={checkIsLiked(item.id, 'barber')}
          premiumInfo={premiumAvailability[item.id]}
          onPress={handleCardPress}
          onLikePress={handleLikePress}
          onBookPress={handleCheckAppointment}
          isSmall={false} // Use full-size proper card
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
              <Star size={12} color={theme.colors.text} fill={theme.colors.text} />
              <Text style={[styles.hsRatingText, { color: theme.colors.text }]}>
                {Number(item.rating) > 0 ? Number(item.rating).toFixed(1) : 'New'}
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
      <StatusBar barStyle="light-content" backgroundColor="#111111" translucent />
      <View style={[styles.container, { backgroundColor: '#ffffffff' }]}>
        <TopToastAlert
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={useCallback(() => setToast({ ...toast, visible: false }), [toast])}
          theme={theme}
          styles={styles}
          topInset={(insets && typeof insets.top === 'number') ? insets.top + (Platform.OS === 'android' ? 10 : 0) : 40}
        />

        {/* --- PREMIUM COMPACT TOP SECTION --- */}
        <View style={[styles.topSection, { paddingTop: (insets && typeof insets.top === 'number') ? insets.top + 10 : 50 }]}>
          {/* CONSOLIDATED HEADER (Location + Navigation) */}
          <View style={styles.locationRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={20} color="#FFFFFF" />
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


          </View>

          {/* SEARCH PILL */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color="#C8FF00" strokeWidth={2.5} />
              <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
                <TextInput
                  style={styles.searchInput}
                  placeholder=""
                  placeholderTextColor="transparent"
                  value={inputText}
                  onChangeText={setInputText}
                  returnKeyType="search"
                />
                {inputText.length === 0 && (
                  <View style={{ position: 'absolute', left: 8, pointerEvents: 'none' }}>
                    <ScrollingPlaceholder styles={styles} />
                  </View>
                )}
              </View>
              {inputText.length > 0 ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchBtn}>
                  <X size={12} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowFilters(true)}
                  style={styles.searchDivider}
                >
                  <Filter size={18} color="rgba(255, 255, 255, 0.4)" />
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
                <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 10 }}>
                  {/* SPACER FOR ABSOLUTE HEADER */}
                  <View style={{ height: ((insets && typeof insets.top === 'number') ? insets.top : 0) + 140 }} />

                  {/* UNIFIED FILTER ROW — categories + filters in one horizontal scroll */}
                  {/* ACTIVE FILTERS ROW — horizontal scroll of active filters */}
                  {activeFilters.length > 0 && (
                    <View style={[styles.categoryScrollContainer, { paddingHorizontal: 0, marginBottom: 8, marginTop: 0 }]}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
                        {activeFilters.map((filterVal) => {
                          const catOpt = categoryOptions.find(c => c.value === filterVal);
                          const filterOpt = filterOptions.find(f => f.value === filterVal);
                          const label = catOpt?.label || filterOpt?.label || filterVal;
                          return (
                            <TouchableOpacity
                              key={filterVal}
                              activeOpacity={0.7}
                              style={[
                                styles.categoryPill,
                                {
                                  backgroundColor: theme.colors.primary,
                                  borderColor: theme.colors.primary,
                                  shadowOpacity: 0.25,
                                  flexDirection: 'row',
                                  alignItems: 'center'
                                }
                              ]}
                              onPress={() => setActiveFilters((prev) => prev.filter(f => f !== filterVal))}
                            >
                              <Text style={[styles.categoryPillText, { color: "#fff", marginRight: 6 }]}>
                                {label}
                              </Text>
                              <X size={10} color="#fff" strokeWidth={3} />
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
        <ShopDetailsSheet
          visible={!!selectedShop}
          shop={selectedShop}
          onClose={handleCloseShopModal}
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

        {/* PREMIUM FILTER BOTTOM SHEET MODAL */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowFilters(false)}
              />
            </BlurView>
            <View style={[styles.filterSheetContainer, { paddingBottom: (insets && typeof insets.bottom === 'number') ? Math.max(insets.bottom, 24) : 24 }]}>
              {/* Drag Handle */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Filters</Text>
                  <Text style={styles.sheetSubtitle}>Refine your expert search</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={styles.sheetCloseBtn}
                >
                  <X size={18} color="#475569" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Filter Options Content */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
                {/* Category Selection */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Service Category</Text>
                  <View style={styles.categoryGrid}>
                    {categoryOptions.map((cat) => {
                      const isActive = activeFilters.includes(cat.value);
                      const IconComp = cat.icon;
                      return (
                        <TouchableOpacity
                          key={cat.value}
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveFilters((prev) =>
                              prev.includes(cat.value)
                                ? prev.filter((f) => f !== cat.value)
                                : [...prev, cat.value]
                            );
                          }}
                          style={[
                            styles.gridCard,
                            isActive && styles.gridCardActive
                          ]}
                        >
                          <IconComp size={20} color={isActive ? theme.colors.primary : "#64748B"} strokeWidth={2} style={{ marginBottom: 6 }} />
                          <Text style={[styles.gridCardText, isActive && styles.gridCardTextActive]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Additional Sort / Filter Options */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sort & Filter By</Text>
                  <View style={styles.optionsList}>
                    {filterOptions.map((option) => {
                      const isActive = activeFilters.includes(option.value);
                      return (
                        <TouchableOpacity
                          key={option.value}
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveFilters((prev) =>
                              prev.includes(option.value)
                                ? prev.filter((f) => f !== option.value)
                                : [...prev, option.value]
                            );
                          }}
                          style={[
                            styles.listRow,
                            isActive && styles.listRowActive
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {React.cloneElement(option.icon, { color: isActive ? theme.colors.primary : "#64748B", size: 16 })}
                            <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                              {option.label}
                            </Text>
                          </View>
                          <View style={[styles.checkboxOutline, isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                            {isActive && <CheckCircle size={10} color="#FFF" strokeWidth={3.5} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  onPress={() => {
                    setActiveFilters([]);
                  }}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetBtnText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={[styles.applyBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                >
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
};

// --- POLISHED PREMIUM STYLES (WITH META ROW) ---
const getStyles = (theme, insets) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // --- TOP SECTION ---
  topSection: {
    backgroundColor: '#111111',
    zIndex: 1000,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    // Professional High-End Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 8
  },
  locationIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  locationTextContainer: {
    flex: 1
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2
  },
  locationValue: {
    fontSize: 15,
    fontFamily: 'Syne_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.2
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Syne_800ExtraBold",
    color: theme.colors.text,
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textSecondary
  },


  // Search
  searchContainer: { paddingHorizontal: 20, paddingBottom: 15, paddingTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    height: '100%',
    paddingLeft: 12,
    zIndex: 1
  },
  placeholderContainer: {
    height: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    marginLeft: 12
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  clearSearchBtn: {
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    padding: 4
  },
  searchDivider: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    height: 24,
    justifyContent: 'center'
  },
  micIcon: { marginLeft: 10 },

  // Filter Dropdown
  filterDropdown: { position: 'absolute', top: 80, right: 20, zIndex: 1000 },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  filterText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium"
  },

  // Categories
  categoryScrollContainer: { marginBottom: 6, marginTop: 0, overflow: 'visible' },
  categoryScrollContent: { paddingHorizontal: 20, paddingVertical: 4, overflow: 'visible' },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    marginRight: 8,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.3
  },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: insets.bottom + 80 },
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
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.08 * 16,
    flex: 1
  },
  listHeaderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.badgeBg
  },
  listHeaderBadgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.primary
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  loadingText: { marginTop: 0, fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // --- MASTERPIECE STARTUP UI STYLES ---
  masterpieceShopCard: {
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Strong Luxury Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8
  },
  masterpieceHero: { height: 180, position: "relative", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  masterpieceShopImage: { width: "100%", height: "100%" },
  masterpieceGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" },

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
  shopLocationText: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginLeft: 6, flex: 1, lineHeight: 18 },

  ratingPillStartup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6 },
  ratingPillText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  shopStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : '#F1F3F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  leftStatsGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  statIconBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  statValue: { fontSize: 13, fontWeight: '900', letterSpacing: -0.2 },
  statLabel: { fontSize: 8.5, fontWeight: '700', opacity: 0.6, marginTop: -1, textTransform: 'uppercase', letterSpacing: 0.3 },
  vDivider: { width: 1, height: 16, backgroundColor: theme.colors.border, opacity: 0.5 },

  shopBookBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  shopBookBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', marginRight: 4, letterSpacing: 0.5 },

  // Barber Card Redesign
  premiumBarberCard: {
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    // Strong Luxury Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8
  },
  masterpieceImageArea: { height: 180, position: 'relative', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
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
  masterpieceSubText: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginLeft: 6, flex: 1, lineHeight: 18 },
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
  barberCard: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },

  // NEW: Compact Horizontal Layout for Modal
  horizontalBarberCard: { borderRadius: 20, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
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
    borderRadius: 28
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
    fontFamily: 'DMSans_500Medium'
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { maxHeight: height * 0.85, height: 'auto', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, backgroundColor: theme.colors.background },
  modalHandleContainer: { alignItems: 'center', paddingVertical: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2 },
  modalContentFallback: { maxHeight: height * 0.85, height: 'auto', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingVertical: 30, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },

  // Redesigned Modal Styles
  modalShell: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20
  },
  heroContainer: {
    position: 'relative',
    backgroundColor: '#111'
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingBottom: 6
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  heroCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  heroCategoryText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  heroRatingText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'DMSans_700Bold'
  },
  heroTitle: {
    fontSize: width < 380 ? 18 : 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  heroAddressText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.85)',
    flex: 1
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2
  },
  roadRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8FF00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  roadRouteText: {
    color: '#1A1A1A',
    fontSize: width < 380 ? 10 : 11,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  heroDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  heroDistanceText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold'
  },
  floatingCloseBtn: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8
  },
  paginationContainer: {
    position: 'absolute',
    top: height * 0.38 - 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)'
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: '#C8FF00'
  },
  listSection: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  listHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8
  },
  listSectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: theme.colors.text
  },
  listSectionSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  availabilitySummary: {
    backgroundColor: theme.colors.hover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  availabilityCount: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: theme.colors.text,
    lineHeight: 20
  },
  availabilityLabel: {
    fontSize: 8,
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2
  },
  expertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  emptyExpertState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12
  },
  emptyExpertText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: theme.colors.textSecondary,
    textAlign: 'center'
  },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Syne_800ExtraBold', color: theme.colors.text },
  modalSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: theme.colors.textSecondary },
  closeBtn: { padding: 6, backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginRight: 10 },
  sectionLine: { flex: 1, height: 1, backgroundColor: theme.colors.border, opacity: 0.5 },

  // Pending Approval Overlay
  pendingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  pendingText: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 },

  // ===== LOADING STYLES =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600'
  },

  distanceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 11, fontWeight: '900', letterSpacing: -0.2 },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10
  },

  // =============================================
  // HOME SCREEN CARD STYLES (hs* prefix) - exact match
  // =============================================
  hsPremiumCard: {
    borderRadius: 24,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Strong Luxury Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8
  },
  hsCardImageArea: { height: 210, position: 'relative', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  hsPremiumCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hsImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },

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
  hsMetaText: { fontSize: 13, fontFamily: 'DMSans_700Bold', marginLeft: 6, flex: 1, lineHeight: 18 },

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

  // Premium Bottom Sheet Filter styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  filterSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 8
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: '#0F172A',
    lineHeight: 24
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: '#64748B',
    marginTop: 2
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 20
  },
  filterSection: {
    marginBottom: 24
  },
  filterSectionTitle: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 10
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08'
  },
  gridCardText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: '#475569',
    textAlign: 'center'
  },
  gridCardTextActive: {
    color: theme.colors.primary
  },
  optionsList: {
    gap: 8
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  listRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '04'
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#334155'
  },
  rowLabelActive: {
    color: theme.colors.primary,
    fontFamily: 'DMSans_700Bold'
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#64748B'
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  applyBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF'
  }
});

export default SearchScreen;
