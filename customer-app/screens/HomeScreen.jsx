import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  CloudOff,
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
import PromoCard from '../src/components/PromoCard';
import ServiceChip from '../src/components/ServiceChip';
import SalonCard from '../src/components/SalonCard';

const HomeScreen = ({ navigation }) => {
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
        accuracy: Location.Accuracy.Balanced,
      });
      
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

  const renderHeader = () => (
    <>
      {/* HERO HEADER */}
      <View style={styles.heroHeader}>
        <View style={styles.headerRow}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'B'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'Bhagyashree'} 👋</Text>
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

        <TouchableOpacity style={[styles.searchBar, styles.searchShadow]} activeOpacity={0.9} onPress={() => navigation.navigate("BarberSearch")}>
          <View style={styles.searchInner}>
            <Search size={20} color={Colors.CHARCOAL} strokeWidth={2.5} opacity={0.4} />
            <Text style={styles.searchPlaceholder}>Search for salons, stylists...</Text>
          </View>
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
            <View style={styles.micDivider} />
            <Mic size={18} color={Colors.LIME_PRIMARY} strokeWidth={2.5} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

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
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingBottom: 4 }}
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
        marginTop: 0, paddingHorizontal: 5, marginBottom: 4
      }}>
        <PromoCard
          title="+ FREE Service"
          discount="50%"
          subtext="Only for new bookings today"
          onClaim={() => { }}
        />
      </View>

      {/* TOP RATED SECTION TITLE */}
      <View style={[styles.sectionHeader, { marginBottom: 12, marginTop: 4, paddingHorizontal: 16 }]}>
        <Text style={Typography.SECTION_HEADER}>Salons Near You</Text>
        <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.LIME_PRIMARY} />

      <FlatList
        data={isEntrancePhase ? [] : nearbyShops}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_PAGE,
  },
  heroHeader: {
    backgroundColor: Colors.LIME_PRIMARY,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: Colors.BG_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    ...Typography.FONT_BLACK,
    fontSize: 15,
    color: Colors.CHARCOAL,
  },
  greeting: {
    ...Typography.FONT_BLACK,
    fontSize: 20,
    color: Colors.CHARCOAL,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.DANGER,
  },
  locationText: {
    ...Typography.FONT_SEMI,
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.DANGER,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  searchShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchPlaceholder: {
    ...Typography.FONT_MED,
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 12,
  },
  micDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  seeAll: {
    ...Typography.FONT_BOLD,
    fontSize: 11,
    color: Colors.LIME_DEEP,
  },
  quickActionsCard: {
    backgroundColor: '#F7F6F3',   // Very subtle warm tint — different but not a card
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.07)',
  },
});

export default HomeScreen;
