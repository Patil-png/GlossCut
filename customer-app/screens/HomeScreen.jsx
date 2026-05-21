import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Easing,
  Platform,
  Image,
  Dimensions
} from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { StatusBar } from "expo-status-bar";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api, { API_URL } from "../utils/api";
import {
  Search,
  Bell,
  MapPin,
  ChevronRight,
  Zap,
  Scissors,
  Sparkles,
  Dog,
  Bot,
  Leaf,
  Baby,
  Calendar,
  Heart,
  Wand2,
  Mic,
  User,
  Clock,
  WifiOff,
  CloudOff
} from "lucide-react-native";

import {
  PremiumCoinIcon,
  PremiumFaceIcon,
  PremiumHistoryIcon,
  PremiumHeartIcon,
  PremiumMapIcon,
  PremiumSearchIcon,
  PremiumBellIcon
} from '../src/components/PremiumIcons';

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import { Layout } from '../src/theme/layout';
import PromoCard from '../src/components/PromoCard';
import PromoCarousel from '../src/components/PromoCarousel';
import ServiceChip from '../src/components/ServiceChip';
import SalonCard from '../src/components/SalonCard';
import ActiveAppointmentBanner from '../src/components/ActiveAppointmentBanner';
import { isToday } from 'date-fns';


const BlobDecoration = ({ style }) => (
  <View
    style={[
      {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.CTA_BUTTON, // Use brand lime
        opacity: 0.05,
        filter: 'blur(80px)', // Standard on web/iOS, handles differently on Android
      },
      style
    ]}
  />
);

const ScrollingPlaceholder = ({ styles }) => {
  const phrases = [
    "Search for hair stylists...",
    "Search for top-rated salons...",
    "Search for grooming experts...",
    "Search for relaxing spas...",
    "Search for beard specialists...",
  ];

  const [index, setIndex] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Animate Out: Slide up and fade out
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
        // 2. Prepare next phrase: Reset to bottom
        setIndex((prev) => (prev + 1) % phrases.length);
        Animated.timing(scrollAnim, { toValue: 20, duration: 0, useNativeDriver: true }).start();

        // 3. Animate In: Slide up from bottom and fade in
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
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const bellRef = React.useRef(null);

  const [nearbyShops, setNearbyShops] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [isOffline, setIsOffline] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const fetchActiveAppointment = async (coords = userCoords) => {
    try {
      const res = await api.get('/api/booking/history');
      if (res.data && Array.isArray(res.data)) {
        // Find first confirmed/started appointment for TODAY
        const todayApp = res.data.find(app => 
          isToday(new Date(app.date)) && 
          ['confirmed', 'started', 'pending'].includes(app.status)
        );
        
        if (todayApp) {
          const shopLat = todayApp.barberId?.location?.coordinates?.[1];
          const shopLng = todayApp.barberId?.location?.coordinates?.[0];
          let distanceStr = '...';

          if (coords && shopLat && shopLng) {
            const distMeters = getDistance(coords.latitude, coords.longitude, shopLat, shopLng);
            distanceStr = distMeters > 1000 
              ? `${(distMeters / 1000).toFixed(1)} km` 
              : `${Math.round(distMeters)} Metres`;
          }

          const trackId = todayApp.queueTrackingId || todayApp._id;

          setActiveAppointment({
            trackingId: trackId,
            shopName: todayApp.barberId?.shopName || 'Studio',
            shopAddress: todayApp.barberId?.address || todayApp.barberId?.shopAddress || 'Mumbai',
            time: todayApp.time, // Fallback
            otp: todayApp.otp || '----', // Added OTP
            shopImage: todayApp.barberId?.shopImage ? `${API_URL}/${todayApp.barberId.shopImage}` : null,
            distance: distanceStr
          });

          // --- FETCH LIVE ESTIMATED START TIME ---
          try {
            const trackRes = await api.get(`/api/booking/track/${trackId}`);
            if (trackRes.data && trackRes.data.success) {
              const queueData = trackRes.data.data;
              const userQueueEntry = queueData.queueList?.find(item => 
                item.id === todayApp._id || item.isTarget
              );
              
              if (userQueueEntry && userQueueEntry.estArrival) {
                setActiveAppointment(prev => ({
                  ...prev,
                  time: userQueueEntry.estArrival,
                  otp: queueData.otp || prev.otp, // Ensure we get latest OTP
                  queuePosition: queueData.queuePosition || 0 // EXTRACT REAL QUEUE POSITION
                }));
              }
            }
          } catch (trackErr) {
            console.warn("Could not fetch live tracking for banner:", trackErr.message);
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching today's appointment:", e);
    }
  };

  // --- 100% BEST PRACTICE CACHING CONSTANTS ---
  const CACHE_KEY_SHOPS = 'cached_nearby_shops';
  const CACHE_KEY_LOCATION = 'cached_user_coords';
  const MOVEMENT_THRESHOLD_METERS = 500; // Only re-fetch if moved > 500m

  const quickActions = [
    { id: 'Search', title: 'Search', Icon: Search, PremiumIcon: PremiumSearchIcon, variant: 'search', route: 'BarberSearch' },
    { id: 'TrackQueue', title: 'Track', Icon: Clock, PremiumIcon: PremiumHistoryIcon, variant: 'lime', route: 'TrackQueue' },
    { id: 'Map', title: 'Shop Map', Icon: MapPin, PremiumIcon: PremiumMapIcon, variant: 'green', route: 'ShopMapScreen' },
    { id: 'History', title: 'History', Icon: Calendar, PremiumIcon: PremiumHistoryIcon, variant: 'black', route: 'History' },
    { id: 'Coins', title: 'Coins', Icon: Zap, PremiumIcon: PremiumCoinIcon, variant: 'lime', route: 'SetkarCoins' },
    { id: 'Notifications', title: 'Updates', Icon: Bell, PremiumIcon: PremiumBellIcon, variant: 'blue', route: 'Notifications' },
    { id: 'Profile', title: 'Profile', Icon: User, PremiumIcon: null, variant: 'orange', route: 'Profile' },
  ];

  // Logic from old HomeScreen kept for data fetching
  const fetchNearbyShops = async (lat, lng, forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoadingShops(true);

      const params = {
        slim: 'true',   // Slim projection — less data over wire
        limit: 5,       // ✅ Only fetch top 5 nearby shops — reduces server load
      };

      if (lat && lng) {
        params.userLat = lat;
        params.userLng = lng;
      }

      const res = await api.get("/api/shop/all", { params });
      setIsOffline(false);

      if (Array.isArray(res.data)) {
        const approved = res.data
          .filter(s => s.approvalStatus === "approved")
          .slice(0, 5); // Safety net: cap at 5 even if backend sends more
        setNearbyShops(approved);

        // Cache only the top 5 results
        await AsyncStorage.setItem(CACHE_KEY_SHOPS, JSON.stringify(approved));
        if (lat && lng) {
          await AsyncStorage.setItem(CACHE_KEY_LOCATION, JSON.stringify({ lat, lng, timestamp: Date.now() }));
        }
      }
    } catch (e) {
      console.error("Error fetching shops:", e);
      setIsOffline(true);
    } finally {
      setLoadingShops(false);
    }
  };

  // Helper to calculate distance between coordinates (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (typeof path === 'string') {
      if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
      }
      return `${API_URL}/${path}`;
    }
    if (path.uri) return path.uri;
    return path;
  };

  const getUserLocation = async () => {
    try {
      // 1. Load CACHED data immediately (SWR Pattern)
      const cachedShops = await AsyncStorage.getItem(CACHE_KEY_SHOPS);
      if (cachedShops) {
        setNearbyShops(JSON.parse(cachedShops));
        setLoadingShops(false);
      }

      const cachedLocString = await AsyncStorage.getItem(CACHE_KEY_LOCATION);
      if (cachedLocString) {
        const cachedLoc = JSON.parse(cachedLocString);
        setUserCoords({ latitude: cachedLoc.lat, longitude: cachedLoc.lng });
      }

      const cachedName = await AsyncStorage.getItem('cached_location_name');
      if (cachedName) {
        setLocationName(cachedName);
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Amravati, MH');
        fetchNearbyShops();
        return;
      }

      // Fast location retrieval: Try last known position first (instant lookup)
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        // Fallback to active GPS querying if last known is not available
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
      }

      const { latitude, longitude } = location.coords;
      setUserCoords({ latitude, longitude });
      fetchActiveAppointment({ latitude, longitude });

      // 2. LOCATION GUARD: Check if we moved enough to justify a server call
      if (cachedLocString && cachedShops) {
        const cachedLoc = JSON.parse(cachedLocString);
        const distanceMoved = getDistance(latitude, longitude, cachedLoc.lat, cachedLoc.lng);
        const cacheAge = Date.now() - cachedLoc.timestamp;

        // If moved less than 500m AND cache is less than 10 mins old, SKIP server call
        if (distanceMoved < MOVEMENT_THRESHOLD_METERS && cacheAge < 600000) {
          console.log(`🚀 Optimization: Using cached shops (Moved only ${Math.round(distanceMoved)}m)`);
          return;
        }
      }

      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode && reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const resolvedName = `${place.district || place.city || place.name || 'Nearby'}, ${place.region || ''}`;
        setLocationName(resolvedName);
        await AsyncStorage.setItem('cached_location_name', resolvedName);
      }

      fetchNearbyShops(latitude, longitude, !!cachedShops);
    } catch (error) {
      console.error("Error getting location:", error);
      fetchNearbyShops();
    }
  };

  // --- HISTORY TRANSITION LOGIC ---
  const triggerHistoryTransition = () => {
    navigation.navigate('History');
  };

  // --- ENTRANCE SEQUENCE ---


  useEffect(() => {
    getUserLocation();
    fetchActiveAppointment();
  }, []);

  // Polling for live time updates every 1 minute
  useEffect(() => {
    let interval;
    if (activeAppointment) {
      interval = setInterval(() => {
        fetchActiveAppointment();
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [activeAppointment?.trackingId]);

  // Recalculate distance when coords are updated
  useEffect(() => {
    if (userCoords && activeAppointment) {
      fetchActiveAppointment(userCoords);
    }
  }, [userCoords]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  };

  const renderHeader = () => (
    <>
      {/* SPACER FOR STICKY HEADER (approx height) */}
      <View style={{ height: insets.top + 140 }} />



      {/* --- ACTIVE APPOINTMENT BANNER (Shown if appointment exists today) --- */}
      {activeAppointment && (
        <ActiveAppointmentBanner appointment={activeAppointment} />
      )}

      {/* ── QUICK ACTIONS CARD SECTION ── */}
      {/* PROMO SECTION HEADER */}
      <View style={[styles.sectionHeader, { marginBottom: 2, marginTop: 8, paddingHorizontal: Layout.screenPadding }]}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Featured Offers</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      {/* PROMO SECTION */}
      <View style={{
        marginTop: 0, marginBottom: 8
      }}>
        {/* ── PROMO CAROUSEL SECTION ── */}
        <PromoCarousel navigation={navigation} />
      </View>

      {/* TOP RATED SECTION TITLE */}
      <View style={[styles.sectionHeader, { marginBottom: 16, marginTop: 12, paddingHorizontal: Layout.screenPadding }]}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Salons Near You</Text>
        </View>
        <View style={[styles.headerLine, { marginRight: 8 }]} />
        <TouchableOpacity
          onPress={() => navigation.navigate("BarberSearch")}
          style={styles.seeAllContainer}
        >
          <Text style={styles.seeAll}>See All</Text>
          <ChevronRight size={14} color={Colors.TEXT_MUTED} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* INSANE UI BACKGROUND DECORATIONS */}
      <BlobDecoration style={{ top: 100, left: -100 }} />
      <BlobDecoration style={{ bottom: 100, right: -100, opacity: 0.03 }} />

      {/* STICKY NAVBAR */}
      <View style={styles.topSection} pointerEvents="box-none">
        <View style={[styles.locationRow, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.backButton}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'B'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>{getGreeting()} 👋</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ShopMapScreen")}>
              <Text style={styles.locationValue} numberOfLines={1}>{locationName} • Now ▾</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightActions}>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <WifiOff size={12} color={theme.colors.textSecondary} />
                <Text style={styles.offlineText}>Cached</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                bellRef.current?.animate();
                setTimeout(() => navigation.navigate("Notifications"), 500);
              }}
            >
              <Bell size={20} color={theme.colors.textOnDark} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("BarberSearch")}
          >
            <View style={styles.searchInner}>
              <Search size={18} color={theme.colors.accent} strokeWidth={2.5} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ScrollingPlaceholder styles={styles} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.searchDivider}
              onPress={() => navigation.navigate("ShopMapScreen")}
            >
              <MapPin size={18} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={nearbyShops}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Layout.screenPadding }}>
            <SalonCard
              name={item.name}
              rating={item.shopRating || item.rating || 0}
              address={item.address}
              image={getImageUrl(item.image || item.owner?.profilePicture)}
              isAvailable={item.isAvailable}
              category={item.category || 'Salon'}
              todaysBookings={item.todaysBookings || 0}
              listingTier={item.listingTier || 'standard'}
              distance={userCoords && item.location?.coordinates ?
                (getDistance(userCoords.latitude, userCoords.longitude, item.location.coordinates[1], item.location.coordinates[0]) / 1000).toFixed(1) + " km"
                : null
              }
              isVerified={item.isVerified}
              isPriority={item.isPriority}
              onPress={() => {
                const routeName = item.category === "Pet Care" ? "PetCareSearch" :
                                 item.category === "Women's Salon" ? "WomenSalonSearch" : "BarberSearch";
                navigation.navigate(routeName, {
                  selectedShopId: item._id || item.id,
                  fromHomeScreen: true
                });
              }}
            />
          </View>
        )}
      />

    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },

  // --- TOP SECTION (Redesigned matching SearchScreen) ---
  topSection: {
    backgroundColor: '#111111', // Slightly deeper black
    zIndex: 1000,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', // Slightly crisper border
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    // Professional High-End Shadow: Soft but defined
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10, // Sufficient for Android depth without being 'muddy'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 8
  },
  locationTextContainer: {
    flex: 1
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255, 255, 255, 0.6)', // Muted white
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  locationValue: {
    ...theme.typography.FONT_BOLD,
    fontSize: 15,
    color: theme.colors.textOnDark,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 4
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.textOnDark
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    borderWidth: 1.5,
    borderColor: theme.colors.navBackground
  },

  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: theme.colors.border
  },
  offlineText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  // Search
  searchContainer: { paddingHorizontal: 20, paddingBottom: 15, paddingTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Brighter background (was 0.05)
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)' // Brighter border (was 0.1)
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  searchDivider: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    height: 24,
    justifyContent: 'center'
  },
  placeholderContainer: {
    height: 24,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)' // Brighter text (was 0.6)
  },

  // Rest of Sectioning
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  seeAll: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: '#333333', // More sophisticated charcoal
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  headerPill: {
    backgroundColor: '#F8F9FA', // Light grey/white for a cleaner look
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerPillText: {
    ...Typography.SECTION_HEADER,
    color: '#1A1A1A', // Back to deep black for legibility
    fontSize: 12, // Slightly more compact
    letterSpacing: 0.6,
    textTransform: 'uppercase' // More professional/editorial
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1
  }
});

export default HomeScreen;
