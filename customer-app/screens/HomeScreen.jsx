import React, { useState, useEffect, useRef } from "react";
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
  Dimensions} from "react-native";
import { StatusBar } from "expo-status-bar";
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
  CloudOff} from "lucide-react-native";

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


const ScrollingPlaceholder = () => {
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
          easing: Easing.in(Easing.quad)}),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true}),
      ]).start(() => {
        // 2. Prepare next phrase: Reset to bottom
        setIndex((prev) => (prev + 1) % phrases.length);
        scrollAnim.setValue(20);
        
        // 3. Animate In: Slide up from bottom and fade in
        Animated.parallel([
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad)}),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true}),
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
  const [isEntrancePhase, setIsEntrancePhase] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [locationName, setLocationName] = useState('Detecting location...');
  const [isOffline, setIsOffline] = useState(false);

  // --- 100% BEST PRACTICE CACHING CONSTANTS ---
  const CACHE_KEY_SHOPS = 'cached_nearby_shops';
  const CACHE_KEY_LOCATION = 'cached_user_coords';
  const MOVEMENT_THRESHOLD_METERS = 500; // Only re-fetch if moved > 500m

  const quickActions = [
    { id: 'Search', title: 'Search', Icon: Search, PremiumIcon: PremiumSearchIcon, variant: 'search', route: 'BarberSearch' },
    { id: 'Coins', title: 'Coins', Icon: Zap, PremiumIcon: PremiumCoinIcon, variant: 'lime', route: 'Profile' },
    { id: 'Map', title: 'Shop Map', Icon: MapPin, PremiumIcon: PremiumMapIcon, variant: 'green', route: 'MapScreen' },
    { id: 'FaceAI', title: 'Face AI', Icon: Bot, PremiumIcon: PremiumFaceIcon, variant: 'blue', route: 'FaceSuggestor' },
    { id: 'History', title: 'History', Icon: Calendar, PremiumIcon: PremiumHistoryIcon, variant: 'black', route: 'History' },
    { id: 'Liked', title: 'Liked', Icon: Heart, PremiumIcon: PremiumHeartIcon, variant: 'orange', route: 'LikedBarbers' },
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
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Amravati, MH');
        fetchNearbyShops();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced});
      
      const { latitude, longitude } = location.coords;
      setUserCoords({ latitude, longitude });
      
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
        setLocationName(`${place.district || place.city || place.name || 'Nearby'}, ${place.region || ''}`);
      }

      fetchNearbyShops(latitude, longitude, !!cachedShops);
    } catch (error) {
      console.error("Error getting location:", error);
      fetchNearbyShops();
    }
  };

  // --- ENTRANCE SEQUENCE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntrancePhase(false);
    }, 3000); // Wait for the staggered icons to finish (~2.5s)
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getUserLocation();
  }, []);

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
      <View style={{ height: insets.top + 130 }} />

      {/* ── QUICK ACTIONS CARD SECTION ── */}

      {/* ── QUICK ACTIONS CARD SECTION ── */}
      <View style={[styles.quickActionsCard, { marginTop: 8 }]}>
        <View style={styles.sectionHeader}>
          <Text style={Typography.SECTION_HEADER}>Quick Actions</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={quickActions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingLeft: Layout.screenPadding, paddingRight: 8, paddingBottom: 4 }}
          renderItem={({ item, index }) => (
            <ServiceChip
              title={item.title}
              Icon={item.Icon}
              PremiumIcon={item.PremiumIcon}
              active={false}
              autoAnimate={isEntrancePhase}
              entranceDelay={index * 250}
              onPress={() => item.action ? item.action() : navigation.navigate(item.route)}
              colorVariant={item.variant}
            />
          )}
        />
      </View>

      {/* PROMO SECTION */}
      <View style={{
        marginTop: 0, marginBottom: 4
      }}>
        {/* ── PROMO CAROUSEL SECTION ── */}
        <PromoCarousel />
      </View>

      {/* TOP RATED SECTION TITLE */}
      <View style={[styles.sectionHeader, { marginBottom: 12, marginTop: 4, paddingHorizontal: Layout.screenPadding }]}>
        <Text style={Typography.SECTION_HEADER}>Salons Near You</Text>
        <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* STICKY NAVBAR */}
      <View style={styles.stickyNavbar}>
        <View style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerRow}>
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0] || 'B'}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate("MapScreen")}>
                  <View style={styles.statusDot} />
                  <Text style={styles.locationText}>{locationName} ›</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              {isOffline && (
                <View style={styles.offlineBadge}>
                  <WifiOff size={12} color="#94A3B8" />
                  <Text style={styles.offlineText}>Cached</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => {
                  bellRef.current?.animate();
                  setTimeout(() => navigation.navigate("Notifications"), 500);
                }}
              >
                <PremiumBellIcon ref={bellRef} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.searchBar, styles.searchShadow]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("BarberSearch")}
          >
            <View style={styles.searchInner}>
              <Search size={20} color={Colors.TEXT_MUTED} strokeWidth={2} />
              <ScrollingPlaceholder />
            </View>
            <TouchableOpacity
              style={styles.mapBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("MapScreen")}
            >
              <View style={styles.mapDivider} />
              <MapPin size={18} color={Colors.TEXT_MUTED} strokeWidth={2} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={isEntrancePhase ? [] : nearbyShops}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Layout.screenPadding }}>
            <SalonCard
              name={item.name}
              rating={item.rating || 0}
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
              onPress={() => navigation.navigate("Booking", { barberData: item })}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_PAGE},
  stickyNavbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Layout.noShadow},
  heroHeader: {
    backgroundColor: Colors.BG_PAGE,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 20,
    ...Layout.noShadow},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16},
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  avatar: {
    width: Layout.avatar,
    height: Layout.avatar,
    borderRadius: Layout.avatar / 2,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD,
    backgroundColor: Colors.BG_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.noShadow},
  avatarText: {
    ...Typography.FONT_BOLD,
    fontSize: 15,
    color: Colors.TEXT_PRIMARY},
  greeting: {
    ...Typography.SCREEN_TITLE,
    fontSize: 20,
    marginBottom: 2},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4},
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.STATUS_OPEN},
  locationText: {
    ...Typography.SMALL_LABEL,
    fontSize: 11,
    color: Colors.TEXT_SECONDARY},
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12},
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BG_CARD,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD},
  offlineText: {
    ...Typography.MICRO_LABEL,
    fontSize: 9,
    color: Colors.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.BG_HOVER,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.noShadow},
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.DANGER,
    borderWidth: 1.5,
    borderColor: Colors.BG_CARD},

  searchBar: {
    backgroundColor: Colors.BG_CARD,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_INPUT,
    borderRadius: 50,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between'},
  searchShadow: {
    ...Layout.noShadow},
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1},
  searchPlaceholder: {
    ...Typography.PLACEHOLDER},
  placeholderContainer: {
    height: 24,
    overflow: 'hidden',
    justifyContent: 'center'},
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 12},
  mapDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: Colors.DIVIDER,
    marginRight: 12},
  section: {
    marginBottom: Layout.sectionGap},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 14},
  seeAll: {
    ...Typography.FONT_MED,
    fontSize: 12,
    color: Colors.TEXT_SECONDARY},
  quickActionsCard: {
    backgroundColor: Colors.BG_PAGE,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 8,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.DIVIDER}});

export default HomeScreen;
