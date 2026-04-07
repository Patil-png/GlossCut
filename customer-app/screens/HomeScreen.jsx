import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import {
  MapPin,
  Search,
  Zap,
  Mic,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Star,
  ShieldCheck,
  Navigation as NavigationIcon,
  CircleUser,
  Scissors,
  Dog,
  HeartPulse,
  Smile,
  Bell,
  User,
} from "lucide-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OptimizedImage from "../components/OptimizedImage";

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // === THE "MASTERPIECE" PALETTE ===
  const colors = {
    bg: isDark ? "#050505" : "#FAFAFA",
    surface: isDark ? "#121212" : "#FFFFFF",

    // Typography
    heading: isDark ? "#FFFFFF" : "#0F172A",
    body: isDark ? "#D1D5DB" : "#334155",

    // Brand Identity
    primary: "#F43F5E",
    primarySoft: "#FFF1F2",
    gold: "#F59E0B",

    // UI Elements
    border: isDark ? "#27272A" : "#F1F5F9",
    inputBg: isDark ? "#18181B" : "#FFFFFF",

    // Specialized Shadows
    shadowFloating: {
      shadowColor: "#F43F5E",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    shadowCard: {
      shadowColor: "#64748B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  };

  // === STATE ===
  const [location, setLocation] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);

  const categories = [
    { id: "1", title: "Barber", icon: Scissors, screen: "BarberSearch" },
    { id: "2", title: "Unisex", icon: User, screen: "BarberSearch" },
    { id: "3", title: "Women Salon", icon: Smile, screen: "WomenSalonSearch" },
  ];

  // === HELPERS ===
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // === DATA FETCHING ===
  const fetchNearbyShops = async (userLat, userLng) => {
    try {
      setLoadingShops(true);
      const cachedData = await AsyncStorage.getItem("cachedNearbyShops");
      const cachedTime = await AsyncStorage.getItem("cachedNearbyShopsTime");
      const now = Date.now();

      if (cachedData && cachedTime && now - parseInt(cachedTime) < 600000) {
        setNearbyShops(JSON.parse(cachedData));
        setLoadingShops(false);
        return;
      }

      const [shopRes, barberRes] = await Promise.all([
        api.get("/api/shop/all"),
        api.get("/api/barber-card/all")
      ]);

      if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
        const formattedShops = shopRes.data
          .filter(s => s.approvalStatus === "approved" && s.location?.coordinates?.[0] !== 0)
          .map(shop => {
            const shopCoords = shop.location?.coordinates;
            const distance = calculateDistance(userLat, userLng, shopCoords[1], shopCoords[0]);
            return {
              _id: shop._id,
              name: shop.name || "Unknown Shop",
              category: shop.category || "General",
              image: shop.image,
              rating: shop.rating || 0,
              distance: distance,
              isAvailable: !!shop.isAvailable,
              isVerified: !!shop.isVerified,
              isPriority: !!shop.isPriority,
              location: shop.location,
              address: shop.address,
              shop: shop
            };
          })
          .sort((a, b) => a.distance - b.distance);

        setNearbyShops(formattedShops);
        await AsyncStorage.setItem("cachedNearbyShops", JSON.stringify(formattedShops));
        await AsyncStorage.setItem("cachedNearbyShopsTime", now.toString());
      }
    } catch (error) {
      console.error("Error fetching nearby shops:", error);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        fetchNearbyShops(20.9136, 77.768);
        return;
      }
      let locationRes = await Location.getCurrentPositionAsync({});
      setLocation(locationRes);
      fetchNearbyShops(locationRes.coords.latitude, locationRes.coords.longitude);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
      >
        {/* === HEADER (Blinkit Style) === */}
        <View style={styles.premiumHeader}>
          <TouchableOpacity 
            style={styles.headerLeft}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MapScreen")}
          >
            <View style={styles.deliveryIndicator}>
              <Text style={styles.serviceLabel}>Service at</Text>
              <View style={styles.locationMainRow}>
                <MapPin size={18} color="#E11D48" fill="#E11D48" />
                <Text style={styles.locationMainText}>Amravati</Text>
                <ChevronDown size={14} color="#0F172A" style={{ marginLeft: 4 }} />
              </View>
            </View>
            <Text style={styles.fullAddressText} numberOfLines={1}>
              Rajapeth, Badnera Rd, Maharashtra 444605
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Bell size={22} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileBox}
              onPress={() => navigation.navigate("Profile")}
            >
              <CircleUser size={32} color="#0F172A" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[styles.premiumSearchBar, colors.shadowCard]}
            activeOpacity={1}
            onPress={() => navigation.navigate("BarberSearch")}
          >
            <Search size={22} color="#94A3B8" style={{ marginRight: 12 }} />
            <Text style={styles.searchPlaceholderText}>Search for 'Haircut' or 'Spa'</Text>
            <View style={styles.splitLine} />
            <Mic size={20} color="#E11D48" />
          </TouchableOpacity>
        </View>

        {/* Categories Bar */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => navigation.navigate(cat.screen)}
              >
                <View style={[styles.categoryCircle, { backgroundColor: colors.surface }, colors.shadowCard]}>
                  <cat.icon size={26} color="#E11D48" strokeWidth={1.5} />
                </View>
                <Text style={styles.categoryLabelText}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroWrapper}>
          <View style={[styles.premiumAdCard, { backgroundColor: "#FFE4E6" }]}>
             <View style={styles.adInfo}>
                <View style={styles.promoTag}>
                  <Sparkles size={12} color="#FFF" />
                  <Text style={styles.promoTagText}>NEW USER SPECIAL</Text>
                </View>
                <Text style={styles.adMainTitle}>Flat 50% Off</Text>
                <Text style={styles.adSubTitle}>on your first salon visit</Text>
                
                <TouchableOpacity style={styles.shopNowBtn}>
                  <Text style={styles.shopNowBtnText}>Explore Now</Text>
                  <ArrowRight size={14} color="#FFF" />
                </TouchableOpacity>
             </View>
             
             <View style={styles.adImageContainer}>
                <Image source={require("../assets/GlossCut.png")} style={styles.heroIllustration} />
             </View>
          </View>
        </View>

        {/* Shops Section */}
        <View style={styles.bodyContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.h2, { color: colors.heading }]}>Shops Near You</Text>
              <Text style={[styles.subtitle, { color: colors.body }]}>Closest salons near your location</Text>
            </View>
            <TouchableOpacity
              onPress={() => location && fetchNearbyShops(location.coords.latitude, location.coords.longitude)}
              style={styles.iconBtn}
            >
              <ArrowRight size={20} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {loadingShops ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.verticalList}>
              {nearbyShops.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.premiumCard, { backgroundColor: colors.surface }, colors.shadowCard]}
                  onPress={() => {
                    const screen = item.category === "Pet Care" ? "PetCareSearch" :
                      (item.category === "Women's Salon" ? "WomenSalonSearch" : "BarberSearch");
                    navigation.navigate(screen, { selectedShop: item.shop, fromHomeScreen: true });
                  }}
                  activeOpacity={0.9}
                >
                    <View style={styles.cardImageArea}>
                      <OptimizedImage
                        source={item.image}
                        style={styles.premiumCardImage}
                        contentFit="cover"
                      />
                    <View style={styles.imageOverlay} />
                    <View style={styles.badgeTopRight}>
                      <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? "#FFF" : "#000" }]}>
                        <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? "#10B981" : "#FFF" }]}>
                          {item.isAvailable && <View style={styles.pingAnim} />}
                        </View>
                        <Text style={[styles.statusBadgeText, { color: item.isAvailable ? "#000" : "#FFF" }]}>
                          {item.isAvailable ? "Open Now" : "Closed"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.badgeTopLeft}>
                      {item.isPriority && (
                        <View style={styles.featuredBadge}>
                          <Sparkles size={10} color="#FFF" />
                          <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                      )}
                      <View style={styles.categoryBadgeImage}>
                        <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
                      </View>
                    </View>
                    {item.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <ShieldCheck size={12} color="#FFF" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.premiumCardContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.premiumTitle, { color: colors.heading }]} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.ratingBadgeInline}>
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={[styles.ratingTextInline, { color: colors.heading }]}>
                          {item.rating > 0 ? item.rating.toFixed(1) : "New"}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.metaRow, { alignItems: 'flex-start' }]}>
                      <MapPin size={14} color={isDark ? "#D1D5DB" : "#334155"} style={{ marginTop: 2 }} />
                      <Text style={[styles.metaText, { color: isDark ? "#D1D5DB" : "#334155", fontWeight: '600' }]} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    <View style={styles.distanceRow}>
                      <NavigationIcon size={14} color="#4C763B" />
                      <Text style={styles.distanceText}>~{item.distance.toFixed(1)} km away</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  premiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 30 : 60,
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  serviceLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#E11D48",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  locationMainRow: { flexDirection: "row", alignItems: "center" },
  locationMainText: { fontSize: 19, fontWeight: "900", color: "#0F172A", marginLeft: 4 },
  fullAddressText: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBox: { borderWidth: 1.5, borderColor: "#F1F5F9", borderRadius: 20, padding: 2 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 24 },
  premiumSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchPlaceholderText: { flex: 1, fontSize: 15, color: "#94A3B8", fontWeight: "500" },
  splitLine: { width: 1, height: 20, backgroundColor: "#E2E8F0", marginHorizontal: 12 },
  categorySection: { marginBottom: 24 },
  categoryContent: { paddingHorizontal: 16 },
  categoryItem: { alignItems: "center", marginRight: 20 },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  categoryLabelText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },
  heroWrapper: { paddingHorizontal: 16, marginBottom: 32 },
  premiumAdCard: { height: 140, borderRadius: 24, flexDirection: "row", overflow: "hidden" },
  adInfo: { flex: 1.2, padding: 16, justifyContent: "center" },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  promoTagText: { color: "#FFF", fontSize: 8, fontWeight: "900", marginLeft: 4 },
  adMainTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", letterSpacing: -1 },
  adSubTitle: { fontSize: 13, color: "#475569", fontWeight: "600", marginBottom: 12 },
  shopNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E11D48",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  shopNowBtnText: { color: "#FFF", fontWeight: "800", fontSize: 11, marginRight: 4 },
  adImageContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroIllustration: { width: 100, height: 100, resizeMode: "contain", transform: [{ rotate: "-5deg" }] },
  bodyContainer: { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  h2: { fontSize: 22, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: "500" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  verticalList: { marginTop: 8 },
  premiumCard: { borderRadius: 24, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9" },
  cardImageArea: { height: 180, position: "relative" },
  premiumCardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  badgeTopRight: { position: "absolute", top: 12, right: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#F1F5F9" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6, position: "relative" },
  pingAnim: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", opacity: 0.3, top: -3, left: -3 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  badgeTopLeft: { position: "absolute", top: 12, left: 12, gap: 6 },
  featuredBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F59E0B", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "900", marginLeft: 4, letterSpacing: 1 },
  categoryBadgeImage: { 
    backgroundColor: "#0F172A", 
    alignSelf: "flex-start", 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.1)" 
  },
  categoryBadgeText: { 
    fontSize: 9, 
    fontWeight: "900", 
    color: "#FFFFFF", 
    letterSpacing: 1.2 
  },
  verifiedBadge: { position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#3B82F6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { color: "#FFF", fontSize: 10, fontWeight: "800", marginLeft: 4 },
  premiumCardContent: { padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  premiumTitle: { fontSize: 19, fontWeight: "800", letterSpacing: -0.5, flex: 1, marginRight: 10 },
  ratingBadgeInline: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingTextInline: { fontSize: 12, fontWeight: "800", marginLeft: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaText: { fontSize: 13, fontWeight: "500", marginLeft: 6, flex: 1, lineHeight: 18 },
  distanceRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  distanceText: { fontSize: 12, fontWeight: "800", color: "#4C763B", marginLeft: 6 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: "500" },
});

export default HomeScreen;
