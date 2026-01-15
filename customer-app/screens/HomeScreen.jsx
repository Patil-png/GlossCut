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
  Snowflake,
  ShoppingBag,
  Sofa,
  Baby,
  Mic,
  ChevronDown,
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // === THEME COLORS ===
  const colors = {
    bg: isDark ? "#000000" : "#F5F7FA", // Slightly cleaner gray
    cardBg: isDark ? "#121212" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    primary: theme.colors.primary || "#2563EB",
    border: isDark ? "#333" : "#E5E7EB",
    inputBg: isDark ? "#1F1F1F" : "#FFFFFF",
    shadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.03,
      shadowRadius: 8,
      elevation: 2,
    }
  };

  // === STATE (UNCHANGED) ===
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [topShops, setTopShops] = useState([]);
  const [topShopsLoading, setTopShopsLoading] = useState(true);
  const [topShopsError, setTopShopsError] = useState(null);

  // === API CALLS (UNCHANGED) ===
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      const response = await api.get('/api/barber-card/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServicesError(error.message || 'Failed to fetch services');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchTopShops = async () => {
    try {
      setTopShopsLoading(true);
      setTopShopsError(null);
      const response = await api.get('/api/shop/all');
      let sortedShops = response.data
        .filter(shop => shop.approvalStatus === 'approved')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      if (sortedShops.length === 0) {
        sortedShops = response.data.slice(0, 5);
      }
      setTopShops(sortedShops);
    } catch (error) {
      console.error('Error fetching top shops:', error);
      setTopShopsError(error.message || 'Failed to fetch top shops');
    } finally {
      setTopShopsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchTopShops();
  }, []);

  // === ICONS (UNCHANGED) ===
  const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return <Scissors size={20} color="#F97316" />;
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return <Heart size={20} color="#EC4899" />;
    } else if (name.includes('massage')) {
      return <Sofa size={20} color="#8B5CF6" />;
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return <Dog size={20} color="#EAB308" />;
    } else if (name.includes('kids') || name.includes('baby')) {
      return <Baby size={20} color="#06B6D4" />;
    } else {
      return <ShoppingBag size={20} color="#10B981" />;
    }
  };

  const getServiceBackgroundColor = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return isDark ? '#331F0F' : '#FFF7ED';
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return isDark ? '#33101F' : '#FDF2F8';
    } else if (name.includes('massage')) {
      return isDark ? '#201533' : '#F5F3FF';
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return isDark ? '#33290F' : '#FEFCE8';
    } else if (name.includes('kids') || name.includes('baby')) {
      return isDark ? '#0D2B33' : '#ECFEFF';
    } else {
      return isDark ? '#0D3321' : '#ECFDF5';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />

      {/* === HEADER === */}
      <View style={[styles.headerContainer, { backgroundColor: colors.bg }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
             style={styles.locationWrapper} 
             onPress={() => navigation.navigate("MapScreen")}
          >
             <View style={[styles.locIconBg, { backgroundColor: colors.cardBg }]}>
                <MapPin size={18} color={colors.primary} />
             </View>
             <View>
                <Text style={[styles.locLabel, { color: colors.subText }]}>Current Location</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[styles.locValue, { color: colors.text }]}>
                        {user?.name ? `${user.name.split(" ")[0]}'s Home` : "Select Location"}
                    </Text>
                    <ChevronDown size={12} color={colors.text} style={{marginLeft: 4, marginTop: 2}} strokeWidth={3}/>
                </View>
             </View>
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
             <TouchableOpacity 
                style={[styles.coinBadge, { backgroundColor: isDark ? '#332800' : '#FEFCE8', borderColor: '#FEF9C3' }]}
                onPress={() => navigation.navigate("SetkarCoinsScreen")}
             >
                <Zap size={12} color="#CA8A04" fill="#CA8A04" />
                <Text style={[styles.coinText, { color: '#CA8A04' }]}>0</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Image
                    source={user?.profilePicture ? user.profilePicture : require("../assets/GlossCut.png")}
                    style={[styles.profilePic, { borderColor: colors.cardBg }]}
                />
             </TouchableOpacity>
          </View>
        </View>

        {/* Floating Search Bar */}
        <TouchableOpacity 
            style={[styles.searchBar, colors.shadow, { backgroundColor: colors.cardBg }]}
            activeOpacity={1}
        >
            <Search size={18} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.searchText, { color: colors.subText }]}>Search "Haircut", "Salon"...</Text>
            <View style={[styles.micBox, { backgroundColor: colors.bg }]}>
                <Mic size={16} color={colors.primary} />
            </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16 }}
      >
        
        {/* === IMPROVED HERO BANNER === */}
        <View style={[styles.bannerContainer, colors.shadow]}>
            <View style={styles.bannerContent}>
                <View style={styles.bannerLeft}>
                    <View style={styles.saleTag}>
                         <Text style={styles.saleTagText}>WINTER SALE</Text>
                    </View>
                    <Text style={styles.bannerBigText}>50% OFF</Text>
                    <Text style={styles.bannerSubText}>On your first appointment</Text>
                    
                    <TouchableOpacity style={styles.bannerButton}>
                        <Text style={styles.bannerButtonText}>Book Now</Text>
                        <ChevronRight size={14} color="#000" />
                    </TouchableOpacity>
                </View>
                
                {/* Decorative Circles for "Good" Look */}
                <View style={styles.circleDecoration1} />
                <View style={styles.circleDecoration2} />
                <Snowflake size={90} color="rgba(255,255,255,0.15)" style={styles.bannerIcon} />
            </View>
        </View>

        {/* === CARD 2: SERVICES === */}
        <View style={[styles.sectionCard, colors.shadow, { backgroundColor: colors.cardBg }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Categories</Text>
                <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
            </View>

            {servicesLoading ? (
                 <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }}/>
            ) : (
                <View style={styles.gridContainer}>
                    <TouchableOpacity 
                        style={styles.gridItem}
                        onPress={() => navigation.navigate("BarberSearch")}
                    >
                        <View style={[styles.gridIcon, { backgroundColor: colors.bg }]}>
                            <ShoppingBag size={20} color={colors.text} />
                        </View>
                        <Text style={[styles.gridLabel, { color: colors.text }]}>All</Text>
                    </TouchableOpacity>

                    {services.slice(0, 7).map((service) => (
                        <TouchableOpacity 
                            key={service._id} 
                            style={styles.gridItem}
                            onPress={() => navigation.navigate("BarberSearch", { selectedService: service.name })}
                        >
                            <View style={[styles.gridIcon, { backgroundColor: getServiceBackgroundColor(service.name) }]}>
                                {getServiceIcon(service.name)}
                            </View>
                            <Text style={[styles.gridLabel, { color: colors.text }]} numberOfLines={1}>
                                {service.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>

        {/* === CARD 3: TOP SHOPS === */}
        <View style={[styles.sectionCard, colors.shadow, { backgroundColor: colors.cardBg }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Top Rated</Text>
                    <Text style={[styles.cardSubTitle, { color: colors.subText }]}>Verified salons nearby</Text>
                </View>
                <TouchableOpacity onPress={fetchTopShops}>
                    <Text style={[styles.seeAll, { color: colors.subText }]}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {topShopsLoading ? (
                 <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }}/>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 4, paddingLeft: 4 }}
                >
                    {topShops.map((shop) => (
                        <TouchableOpacity
                            key={shop._id}
                            style={[styles.shopItem, colors.shadow, { backgroundColor: colors.cardBg }]}
                            onPress={() => navigation.navigate("BarberSearch", { selectedShop: shop._id })}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={shop.image ? { uri: shop.image } : require("../assets/GlossCut.png")}
                                style={styles.shopImg}
                            />
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingNum}>{shop.rating ? shop.rating.toFixed(1) : 'New'}</Text>
                                <Star size={8} color="#FFF" fill="#FFF" style={{ marginLeft: 2 }}/>
                            </View>
                            
                            <View style={styles.shopInfo}>
                                <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>{shop.name}</Text>
                                <Text style={[styles.shopMeta, { color: colors.subText }]} numberOfLines={1}>
                                    {shop.category === 'Barber' ? 'Unisex' : shop.category} • 1.2 km
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>

        {/* === CARD 4: MY ACCOUNT === */}
        <View style={[styles.sectionCard, colors.shadow, { backgroundColor: colors.cardBg }]}>
             <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 12 }]}>Quick Actions</Text>
             
             <TouchableOpacity style={styles.listRow} onPress={() => navigation.navigate("History")}>
                <View style={[styles.listIcon, { backgroundColor: '#EFF6FF' }]}>
                    <History size={18} color="#2563EB" />
                </View>
                <View style={styles.listText}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>Bookings</Text>
                </View>
                <ChevronRight size={16} color={colors.subText} />
             </TouchableOpacity>

             <View style={[styles.divider, { backgroundColor: colors.border }]} />

             <TouchableOpacity style={styles.listRow} onPress={() => navigation.navigate("LikedBarbers")}>
                <View style={[styles.listIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Heart size={18} color="#EF4444" />
                </View>
                <View style={styles.listText}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>Favorites</Text>
                </View>
                <ChevronRight size={16} color={colors.subText} />
             </TouchableOpacity>

             <View style={[styles.divider, { backgroundColor: colors.border }]} />

             <TouchableOpacity style={styles.listRow} onPress={() => navigation.navigate("SetkarCoinsScreen")}>
                <View style={[styles.listIcon, { backgroundColor: '#FFFBEB' }]}>
                    <Zap size={18} color="#F59E0B" />
                </View>
                <View style={styles.listText}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>GlossCut Coins</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>0 Pts</Text>
             </TouchableOpacity>
        </View>

      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen="Home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 45 : 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  searchText: {
    flex: 1,
    fontSize: 13,
  },
  micBox: {
    padding: 6,
    borderRadius: 8,
  },

  // === BANNER STYLE ===
  bannerContainer: {
      marginTop: 12, // Reduced margin
      marginBottom: 12, // Reduced margin
      borderRadius: 20,
      backgroundColor: '#2563EB', // Bright Blue
      height: 150,
      overflow: 'hidden',
  },
  bannerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      position: 'relative',
  },
  bannerLeft: {
      zIndex: 2,
      flex: 1,
  },
  saleTag: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
  },
  saleTagText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
  },
  bannerBigText: {
      color: '#FFF',
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 30,
      fontStyle: 'italic',
      letterSpacing: -1,
  },
  bannerSubText: {
      color: '#DBEAFE', // Light blue text
      fontSize: 12,
      marginTop: 4,
      marginBottom: 12,
      fontWeight: '500',
  },
  bannerButton: {
      backgroundColor: '#FFF',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
  },
  bannerButtonText: {
      color: '#000',
      fontSize: 11,
      fontWeight: '700',
      marginRight: 2,
  },
  circleDecoration1: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleDecoration2: {
      position: 'absolute',
      bottom: -40,
      right: 40,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerIcon: {
      position: 'absolute',
      right: 0,
      bottom: -10,
      opacity: 0.8,
  },

  // CARD BASE STYLE
  sectionCard: {
    borderRadius: 20,
    marginBottom: 12, // Tight spacing as requested
    padding: 16,
  },

  // Generic Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubTitle: {
    fontSize: 12,
    marginTop: 1,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (screenWidth - 64) / 4, // Tighter calculations
    alignItems: 'center',
    marginBottom: 12,
  },
  gridIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Shops
  shopItem: {
    width: 190,
    marginRight: 12,
    borderRadius: 14,
    marginBottom: 4, // shadow space
  },
  shopImg: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingNum: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  shopInfo: {
    padding: 10,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  shopMeta: {
    fontSize: 10,
  },

  // List Rows
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
});

export default HomeScreen;