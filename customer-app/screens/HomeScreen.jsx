import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import BottomNavBar from "../components/BottomNavBar";
import {
  MapPin,
  History,
  ChevronRight,
  Scissors,
  Heart,
  Dog,
  Search,
  Zap,
  Star,
  ShoppingBag,
  Sofa,
  Baby,
  Mic,
  ChevronDown,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // === THE "MASTERPIECE" PALETTE ===
  const colors = {
    bg: isDark ? "#050505" : "#FAFAFA", // Purest off-white
    surface: isDark ? "#121212" : "#FFFFFF",

    // Typography
    heading: isDark ? "#FFFFFF" : "#0F172A", // Deep Navy/Black
    body: isDark ? "#A1A1AA" : "#64748B", // Cool Grey

    // Brand Identity
    primary: "#F43F5E", // Rose 500
    primarySoft: "#FFF1F2", // Rose 50
    gold: "#F59E0B",

    // UI Elements
    border: isDark ? "#27272A" : "#F1F5F9",
    inputBg: isDark ? "#18181B" : "#FFFFFF",

    // Specialized Shadows (The "100 Year" Depth)
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

  // === STATE (UNCHANGED) ===
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [topShops, setTopShops] = useState([]);
  const [topShopsLoading, setTopShopsLoading] = useState(true);

  // === API CALLS (UNCHANGED) ===
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const response = await api.get("/api/barber-card/services");
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchTopShops = async () => {
    try {
      setTopShopsLoading(true);
      const response = await api.get("/api/shop/all");
      let sortedShops = response.data
        .filter((shop) => shop.approvalStatus === "approved")
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      if (sortedShops.length === 0) {
        sortedShops = response.data.slice(0, 5);
      }
      setTopShops(sortedShops);
    } catch (error) {
      console.error("Error fetching top shops:", error);
    } finally {
      setTopShopsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchTopShops();
  }, []);

  // === ICONS HELPER (UNCHANGED) ===
  const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (
      name.includes("hair") ||
      name.includes("cut") ||
      name.includes("beard")
    ) {
      return <Scissors size={22} color="#F97316" strokeWidth={1.5} />;
    } else if (
      name.includes("facial") ||
      name.includes("beauty") ||
      name.includes("spa")
    ) {
      return <Heart size={22} color="#EC4899" strokeWidth={1.5} />;
    } else if (name.includes("massage")) {
      return <Sofa size={22} color="#8B5CF6" strokeWidth={1.5} />;
    } else if (
      name.includes("pet") ||
      name.includes("dog") ||
      name.includes("cat")
    ) {
      return <Dog size={22} color="#EAB308" strokeWidth={1.5} />;
    } else if (name.includes("kids") || name.includes("baby")) {
      return <Baby size={22} color="#06B6D4" strokeWidth={1.5} />;
    } else {
      return <ShoppingBag size={22} color="#10B981" strokeWidth={1.5} />;
    }
  };

  const getServiceBackgroundColor = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (
      name.includes("hair") ||
      name.includes("cut") ||
      name.includes("beard")
    ) {
      return isDark ? "#331F0F" : "#FFF7ED";
    } else if (
      name.includes("facial") ||
      name.includes("beauty") ||
      name.includes("spa")
    ) {
      return isDark ? "#33101F" : "#FDF2F8";
    } else if (name.includes("massage")) {
      return isDark ? "#201533" : "#F5F3FF";
    } else if (
      name.includes("pet") ||
      name.includes("dog") ||
      name.includes("cat")
    ) {
      return isDark ? "#33290F" : "#FEFCE8";
    } else if (name.includes("kids") || name.includes("baby")) {
      return isDark ? "#0D2B33" : "#ECFEFF";
    } else {
      return isDark ? "#0D3321" : "#ECFDF5";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFE4E6" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFE4E6" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 110,
          backgroundColor: colors.bg,
        }}
        bounces={false}
      >
        {/* === THE "MAGAZINE" COVER (HERO SECTION) === */}
        <View style={styles.heroSection}>
          {/* Header: Location & Status */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => navigation.navigate("MapScreen")}
              activeOpacity={0.8}
            >
              <View style={styles.locationIconBox}>
                <MapPin size={20} color="#E11D48" fill="#E11D48" />
              </View>
              <View style={styles.locationTexts}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.headerTitle}>
                    {user?.name ? user.name.split(" ")[0] : "Guest"}
                  </Text>
                  <ChevronDown
                    size={14}
                    color="#0F172A"
                    strokeWidth={3}
                    style={{ marginLeft: 4, opacity: 0.6 }}
                  />
                </View>
                <Text style={styles.headerSubtitle}>Amravati, Maharashtra</Text>
              </View>
            </TouchableOpacity>

            {/* Coin Badge - Glassmorphism */}
            <TouchableOpacity
              style={styles.glassCoin}
              onPress={() => navigation.navigate("SetkarCoinsScreen")}
            >
              <Zap size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.glassCoinText}>0</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar - Floating Element */}
          <TouchableOpacity
            style={[styles.searchBar, colors.shadowCard]}
            activeOpacity={1}
            onPress={() => navigation.navigate("BarberSearch")}
          >
            <Search size={20} color="#E11D48" style={{ marginRight: 12 }} />
            <Text style={styles.searchPlaceholder}>Find your style...</Text>
            <View style={styles.micButton}>
              <Mic size={18} color="#E11D48" />
            </View>
          </TouchableOpacity>

          {/* THE AD CARD - "3D STICKER" CONCEPT */}
          <View style={styles.adWrapper}>
            <View style={styles.adContent}>
              {/* Left: Typography */}
              <View style={{ flex: 1, paddingRight: 8, zIndex: 10 }}>
                <View style={styles.saleBadge}>
                  <Sparkles size={10} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.saleBadgeText}>LIMITED OFFER</Text>
                </View>
                <Text style={styles.adHeadline}>
                  <Text style={{ fontSize: 20 }}>Get </Text>
                  <Text style={{ color: "#E11D48" }}>50% OFF</Text>
                  {"\n"}& FREE Service
                </Text>
                <Text style={styles.adSubline}>First booking under 5km</Text>

                <TouchableOpacity
                  style={styles.blackButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.blackButtonText}>Claim Now</Text>
                  <ArrowRight size={14} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Right: The "Sticker" Image */}
              {/* We add a white border and shadow to the image container to make it pop like a sticker */}
              <View style={[styles.stickerContainer, colors.shadowFloating]}>
                <Image
                  source={require("../assets/GlossCut.png")}
                  style={styles.stickerImage}
                />
              </View>
            </View>

            {/* Background Decor */}
            <View style={styles.adDecorCircle} />
          </View>
        </View>

        {/* === MAIN CONTENT LAYER === */}
        <View style={styles.bodyContainer}>
          {/* === 1. CATEGORIES (Micro-Interaction Style) === */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.h2, { color: colors.heading }]}>
              Explore Services
            </Text>

            {servicesLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : (
              <View style={styles.gridWrapper}>
                {/* Static 'All' */}
                <TouchableOpacity
                  style={styles.catItem}
                  onPress={() => navigation.navigate("BarberSearch")}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.catIconBox,
                      {
                        backgroundColor: "#FFFFFF",
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <ShoppingBag
                      size={22}
                      color={colors.heading}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text style={[styles.catLabel, { color: colors.heading }]}>
                    All
                  </Text>
                </TouchableOpacity>

                {/* Mapped Services */}
                {services.slice(0, 7).map((service) => (
                  <TouchableOpacity
                    key={service._id}
                    style={styles.catItem}
                    onPress={() =>
                      navigation.navigate("BarberSearch", {
                        selectedService: service.name,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        {
                          backgroundColor: getServiceBackgroundColor(
                            service.name
                          ),
                        },
                      ]}
                    >
                      {getServiceIcon(service.name)}
                    </View>
                    <Text
                      style={[styles.catLabel, { color: colors.heading }]}
                      numberOfLines={1}
                    >
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* === 2. TOP RATED (App Store Style Cards) === */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.h2, { color: colors.heading }]}>
                  Top Rated
                </Text>
                <Text style={[styles.subtitle, { color: colors.body }]}>
                  Curated by experts
                </Text>
              </View>
              <TouchableOpacity onPress={fetchTopShops} style={styles.iconBtn}>
                <ArrowRight size={20} color={colors.heading} />
              </TouchableOpacity>
            </View>

            {topShopsLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 4, paddingBottom: 24 }} // Padding for shadow spread
              >
                {topShops.map((shop) => (
                  <TouchableOpacity
                    key={shop._id}
                    style={[
                      styles.shopCard,
                      { backgroundColor: colors.surface },
                      colors.shadowCard,
                    ]}
                    onPress={() =>
                      navigation.navigate("BarberSearch", {
                        selectedShop: shop._id,
                      })
                    }
                    activeOpacity={0.9}
                  >
                    {/* High-Impact Image Area */}
                    <View style={styles.shopImageWrap}>
                      <Image
                        source={
                          shop.image
                            ? { uri: shop.image }
                            : require("../assets/GlossCut.png")
                        }
                        style={styles.shopImageFull}
                      />
                      {/* Glass Blur Badge */}
                      <View style={styles.ratingGlass}>
                        <Star size={10} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>
                          {shop.rating ? shop.rating.toFixed(1) : "New"}
                        </Text>
                      </View>
                      <View style={styles.heartGlass}>
                        <Heart size={14} color="#FFF" />
                      </View>
                    </View>

                    {/* Minimalist Info */}
                    <View style={styles.shopDetails}>
                      <Text
                        style={[styles.shopTitle, { color: colors.heading }]}
                        numberOfLines={1}
                      >
                        {shop.name}
                      </Text>
                      <Text
                        style={[styles.shopMeta, { color: colors.body }]}
                        numberOfLines={1}
                      >
                        {shop.category === "Barber"
                          ? "Men & Unisex"
                          : shop.category}
                      </Text>

                      <View style={styles.shopFooter}>
                        <View style={styles.metaRow}>
                          <Clock size={12} color="#10B981" />
                          <Text style={styles.openText}>Open Now</Text>
                        </View>
                        <Text style={[styles.distText, { color: colors.body }]}>
                          1.2 km
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* === 3. QUICK ACTIONS (Modern Settings Style) === */}
          <View style={styles.sectionBlock}>
            <Text
              style={[styles.h2, { color: colors.heading, marginBottom: 16 }]}
            >
              Quick Actions
            </Text>

            <View
              style={[
                styles.menuContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              {/* Item 1 */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}>
                  <History size={20} color="#3B82F6" strokeWidth={2} />
                </View>
                <View
                  style={[
                    styles.menuText,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.menuTitle, { color: colors.heading }]}>
                    My Bookings
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.body }]}>
                    Upcoming & History
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.body} />
              </TouchableOpacity>

              {/* Item 2 */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("LikedBarbers")}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#FEF2F2" }]}>
                  <Heart size={20} color="#EF4444" strokeWidth={2} />
                </View>
                <View
                  style={[
                    styles.menuText,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.menuTitle, { color: colors.heading }]}>
                    Favorites
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.body }]}>
                    Saved Salons
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.body} />
              </TouchableOpacity>

              {/* Item 3 */}
              <TouchableOpacity
                style={[styles.menuItem, { marginBottom: 0 }]}
                onPress={() => navigation.navigate("SetkarCoinsScreen")}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#FFFBEB" }]}>
                  <Zap size={20} color="#F59E0B" strokeWidth={2} />
                </View>
                <View style={[styles.menuText, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.menuTitle, { color: colors.heading }]}>
                    GlossCut Coins
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.body }]}>
                    0 Points Balance
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomNavBar navigation={navigation} activeScreen="Home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // === HERO SECTION (THE "MAGAZINE COVER") ===
  heroSection: {
    backgroundColor: "#FFE4E6", // Rose-100/200 feel
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 48, // Aggressive curvature
    borderBottomRightRadius: 48,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  locationContainer: { flexDirection: "row", alignItems: "center" },
  locationIconBox: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: "#475569", fontWeight: "500" },

  // Glass Coin
  glassCoin: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  glassCoinText: {
    color: "#F59E0B",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 13,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
  },
  micButton: {
    width: 36,
    height: 36,
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Ad Wrapper
  adWrapper: { position: "relative", marginTop: 8 },
  adContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E11D48",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  saleBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  adHeadline: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 30,
    letterSpacing: -1,
    marginBottom: 6,
  },
  adSubline: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 16,
    fontWeight: "500",
  },

  // Black Button
  blackButton: {
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  blackButtonText: {
    color: "#FFF",
    fontWeight: "700",
    marginRight: 6,
    fontSize: 13,
  },

  // The "3D Sticker" Image
  stickerContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#FFF",
    padding: 6,
    borderRadius: 20,
    transform: [{ rotate: "8deg" }, { translateY: 10 }], // The "Tossed on table" look
    borderWidth: 4,
    borderColor: "#FFF",
  },
  stickerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "contain",
  },
  adDecorCircle: {
    position: "absolute",
    right: -20,
    bottom: -30,
    width: 160,
    height: 160,
    backgroundColor: "#FECDD3",
    borderRadius: 80,
    zIndex: -1,
    opacity: 0.6,
  },

  // === BODY ===
  bodyContainer: { paddingHorizontal: 20, paddingTop: 32 },

  // Sections
  sectionBlock: { marginBottom: 32 },
  h2: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  subtitle: { fontSize: 13, marginTop: 2 },
  iconBtn: {
    backgroundColor: "#F1F5F9",
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Categories
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catItem: {
    width: (screenWidth - 40) / 4,
    alignItems: "center",
    marginBottom: 20,
  },
  catIconBox: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  catLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  // Shop Cards
  shopCard: {
    width: 220,
    marginRight: 16,
    borderRadius: 24,
    marginBottom: 8,
    padding: 0,
  },
  shopImageWrap: {
    height: 140,
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  shopImageFull: { width: "100%", height: "100%", resizeMode: "cover" },

  ratingGlass: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(10px)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { color: "#FFF", fontSize: 10, fontWeight: "800", marginLeft: 4 },

  heartGlass: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  shopDetails: { padding: 14 },
  shopTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  shopMeta: { fontSize: 12, marginBottom: 10 },
  shopFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center" },
  openText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "700",
    marginLeft: 4,
  },
  distText: { fontSize: 11, fontWeight: "500" },

  // Menu/Quick Actions
  menuContainer: { borderRadius: 24, padding: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 12 },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  menuSub: { fontSize: 12 },
});

export default HomeScreen;
