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
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import BottomNavBar from "../components/BottomNavBar";
import {
  MapPin,
  Bell,
  History,
  Coins,
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
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Dynamic Styles based on theme
  const dynamicStyles = {
    headerBg: isDark ? "#121212" : "#F8F9FA", // Slightly cleaner background
    softShadow: {
      shadowColor: isDark ? "#000" : "#7A7A7A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.08, // Much softer shadow
      shadowRadius: 16,
      elevation: 5,
    },
    cardBg: isDark ? "#1E1E1E" : "#FFFFFF",
    accentColor: theme.colors.primary || '#00BFFF',
    borderColor: isDark ? "#333" : "#F0F0F0",
  };

  // State for services
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  // State for top shops
  const [topShops, setTopShops] = useState([]);
  const [topShopsLoading, setTopShopsLoading] = useState(true);
  const [topShopsError, setTopShopsError] = useState(null);

  // Function to fetch services from API
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

  // Function to fetch top-rated shops
  const fetchTopShops = async () => {
    try {
      setTopShopsLoading(true);
      setTopShopsError(null);

      const response = await api.get('/api/shop/all');
      console.log('All shops response:', response.data);

      // Sort by rating and take top 5 shops (be less strict with filtering)
      let sortedShops = response.data
        .filter(shop => shop.approvalStatus === 'approved') // Only approved shops
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      // If no approved shops, show any shops (for debugging)
      if (sortedShops.length === 0) {
        console.log('No approved shops found, showing all shops for debugging');
        sortedShops = response.data.slice(0, 5);
      }

      console.log('Filtered and sorted shops:', sortedShops);
      setTopShops(sortedShops);
    } catch (error) {
      console.error('Error fetching top shops:', error);
      setTopShopsError(error.message || 'Failed to fetch top shops');
    } finally {
      setTopShopsLoading(false);
    }
  };

  // Fetch services and top shops on component mount
  useEffect(() => {
    fetchServices();
    fetchTopShops();
  }, []);

  // Function to get icon for service
  const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return <Scissors size={22} color="#FF9800" />;
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return <Heart size={22} color="#E91E63" />;
    } else if (name.includes('massage')) {
      return <Sofa size={22} color="#673AB7" />;
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return <Dog size={22} color="#FDD835" />;
    } else if (name.includes('kids') || name.includes('baby')) {
      return <Baby size={22} color="#4FC3F7" />;
    } else {
      return <ShoppingBag size={22} color="#4CAF50" />;
    }
  };

  // Function to get background color for service
  const getServiceBackgroundColor = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return '#FFF3E0';
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return '#FCE4EC';
    } else if (name.includes('massage')) {
      return '#EDE7F6';
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return '#FFFDE7';
    } else if (name.includes('kids') || name.includes('baby')) {
      return '#E1F5FE';
    } else {
      return '#E8F5E9';
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: dynamicStyles.headerBg }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* === HEADER SECTION === */}
      <View style={[styles.headerContainer]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.locationContainer}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MapScreen")}
          >
            <View style={[styles.locationIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
               <MapPin size={20} color={dynamicStyles.accentColor} fill={dynamicStyles.accentColor} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationLabel, { color: theme.colors.text }]}>
                HOME 
                <ChevronRight size={16} color={theme.colors.text} style={{marginTop: 2, marginLeft: 2}}/>
              </Text>
              <Text style={[styles.locationSubLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {user?.name ? `${user.name.split(" ")[0]}` : "User"}, 5A, Behind Avtar...
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate("SetkarCoinsScreen")}
              style={[styles.coinsBtn, { backgroundColor: isDark ? '#333' : '#FFF', borderColor: '#FFD700' }]}
            >
              <Zap size={16} color="#FFD700" fill="#FFD700"/>
              <Text style={styles.coinsText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={styles.profileBtn}
            >
              <Image
                source={
                  user?.profilePicture
                    ? user.profilePicture
                    : require("../assets/GlossCut.png")
                }
                style={styles.headerProfileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={[styles.searchContainer, dynamicStyles.softShadow, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.borderColor }]}>
          <Search size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.searchText, { color: theme.colors.textSecondary }]}>
            Search "haircut" or "massage"
          </Text>
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={() => {}} style={styles.micButton}>
              <Mic size={20} color={dynamicStyles.accentColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // Added padding for floating nav
      >

        {/* === WINTER SAVER SALE BANNER === */}
        <View style={[styles.bannerSection, dynamicStyles.softShadow]}>
            <View style={styles.bannerContent}>
                <Text style={[styles.bannerTitle, { color: dynamicStyles.accentColor }]}>WINTER</Text>
                <Text style={[styles.bannerSubtitle, { color: theme.colors.text }]}>SAVER SALE</Text>
                <TouchableOpacity style={[styles.shopNowBtn, { backgroundColor: dynamicStyles.accentColor }]}>
                   <Text style={styles.shopNowText}>Book Now</Text>
                </TouchableOpacity>
            </View>
            <Snowflake size={40} color={dynamicStyles.accentColor} style={styles.snowflakeIcon1}/>
            <Snowflake size={28} color={dynamicStyles.accentColor} style={styles.snowflakeIcon2}/>
            {/* Abstract Circle Decoration */}
            <View style={[styles.bannerCircle, { backgroundColor: dynamicStyles.accentColor }]} />
        </View>


        {/* === SERVICES === */}
        <View style={styles.sectionHeaderContainer}>
             <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Services</Text>
             <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
                <Text style={[styles.seeAllText, { color: dynamicStyles.accentColor }]}>See all</Text>
             </TouchableOpacity>
        </View>
        
        <View style={styles.categorySection}>
          {servicesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={dynamicStyles.accentColor} />
            </View>
          ) : servicesError ? (
            <Text style={{textAlign: 'center', color: 'red'}}>Error loading services</Text>
          ) : (
            <View style={styles.categoryRow}>
              {/* All Services */}
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => navigation.navigate("BarberSearch")}
              >
                <View style={[styles.categoryCircle, { backgroundColor: isDark ? '#333' : '#F5F5F5', borderColor: dynamicStyles.borderColor }]}>
                  <ShoppingBag size={22} color={theme.colors.text} />
                </View>
                <Text style={[styles.categoryText, { color: theme.colors.text }]}>All</Text>
              </TouchableOpacity>

              {/* Dynamic Services */}
              {services.slice(0, 5).map((service) => (
                <TouchableOpacity
                  key={service._id}
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate("BarberSearch", { selectedService: service.name })}
                >
                  <View style={[styles.categoryCircle, { backgroundColor: getServiceBackgroundColor(service.name) }]}>
                    {getServiceIcon(service.name)}
                  </View>
                  <Text style={[styles.categoryText, { color: theme.colors.text }]} numberOfLines={1}>
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* === TOP RATED SHOPS === */}
        <View style={styles.sectionContainer}>
             <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Top Rated Shops</Text>
             <TouchableOpacity onPress={fetchTopShops}><Text style={[styles.seeAllText, { color: theme.colors.textSecondary }]}>Refresh</Text></TouchableOpacity>
        </View>

        {topShopsLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={dynamicStyles.accentColor} />
            </View>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestsellerList}>
            {topShops.map((shop) => (
            <TouchableOpacity
                key={shop._id}
                style={[styles.shopCard, dynamicStyles.softShadow, { backgroundColor: dynamicStyles.cardBg }]}
                onPress={() => navigation.navigate("BarberSearch", { selectedShop: shop._id })}
                activeOpacity={0.9}
            >
                <Image
                source={
                    shop.image
                    ? { uri: shop.image }
                    : require("../assets/GlossCut.png")
                }
                style={styles.shopImage}
                resizeMode="cover"
                />
                <View style={styles.shopInfo}>
                   <View style={styles.shopTextContent}>
                        <Text style={[styles.shopName, { color: theme.colors.text }]} numberOfLines={1}>
                            {shop.name}
                        </Text>
                        <Text style={[styles.shopCategory, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {shop.category === 'Barber' ? 'Unisex' : shop.category}
                        </Text>
                   </View>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{shop.rating ? shop.rating.toFixed(1) : 'New'}</Text>
                        <Star size={10} color="#FFF" fill="#FFF" style={{ marginLeft: 2 }} />
                    </View>
                </View>
            </TouchableOpacity>
            ))}
        </ScrollView>
        )}

        {/* === MY DASHBOARD === */}
        <View style={styles.sectionContainer}>
             <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>My Account</Text>
        </View>
        <View style={[styles.mySectionsContainer, dynamicStyles.softShadow, { backgroundColor: dynamicStyles.cardBg, borderColor: dynamicStyles.borderColor }]}>
            <TouchableOpacity
              style={styles.mySectionItem}
              onPress={() => navigation.navigate("History")}
            >
                <View style={styles.mySectionRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                        <History size={18} color="#2196F3" />
                    </View>
                    <Text style={[styles.mySectionText, { color: theme.colors.text }]}>My History</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.sectionDivider, { backgroundColor: dynamicStyles.borderColor }]} />

            <TouchableOpacity
              style={styles.mySectionItem}
              onPress={() => navigation.navigate("LikedBarbers")}
            >
                <View style={styles.mySectionRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                        <Heart size={18} color="#E91E63" />
                    </View>
                    <Text style={[styles.mySectionText, { color: theme.colors.text }]}>Liked Barbers</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.sectionDivider, { backgroundColor: dynamicStyles.borderColor }]} />

            <TouchableOpacity
              style={styles.mySectionItem}
              onPress={() => navigation.navigate("SetkarCoinsScreen")}
            >
                <View style={styles.mySectionRow}>
                     <View style={[styles.iconBox, { backgroundColor: '#FFF8E1' }]}>
                        <Zap size={18} color="#FFB300" />
                    </View>
                    <Text style={[styles.mySectionText, { color: theme.colors.text }]}>GlossCut Coins</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>

      </ScrollView>

       {/* === BOTTOM NAVIGATION === */}
       <BottomNavBar navigation={navigation} activeScreen="Home" />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // === HEADER STYLES ===
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '800',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: -0.5,
  },
  locationSubLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
    opacity: 0.8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
    color: '#FFD700',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerProfileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26, // Pill shape
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  micButton: {
      padding: 4,
  },

  // === SCROLL CONTENT ===
  scrollContent: {
    flex: 1,
  },
  
  // === BANNER ===
  bannerSection: {
    backgroundColor: '#EBF4FF', // Soft Blue
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden',
    height: 160,
    justifyContent: 'center',
  },
  bannerContent: {
      zIndex: 2,
      width: '60%',
  },
  bannerTitle: {
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -1,
      fontStyle: 'italic',
  },
  bannerSubtitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 12,
  },
  shopNowBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 30,
      alignSelf: 'flex-start',
  },
  shopNowText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
  },
  snowflakeIcon1: {
      position: 'absolute',
      top: 20,
      right: 40,
      opacity: 0.8,
      zIndex: 2,
  },
  snowflakeIcon2: {
      position: 'absolute',
      bottom: 30,
      right: 90,
      opacity: 0.5,
      zIndex: 2,
  },
  bannerCircle: {
      position: 'absolute',
      right: -40,
      bottom: -40,
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.1,
  },


  // === HEADERS & UTILS ===
  sectionHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  seeAllText: {
      fontSize: 13,
      fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // === CATEGORIES ===
  categorySection: {
    marginBottom: 30,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    width: (screenWidth - 40) / 4.5,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 24, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // === MY SECTIONS (CARD) ===
  mySectionsContainer: {
      marginHorizontal: 20,
      borderRadius: 20,
      marginBottom: 30,
      borderWidth: 1,
      overflow: 'hidden',
  },
  mySectionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 18,
  },
  mySectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  mySectionText: {
      fontSize: 15,
      fontWeight: '600',
  },
  sectionDivider: {
      height: 1,
      marginHorizontal: 16,
  },


  // === TOP SHOPS (HORIZONTAL SCROLL) ===
  bestsellerList: {
      paddingHorizontal: 20,
      paddingRight: 10,
  },
  shopCard: {
      borderRadius: 18,
      padding: 10,
      marginRight: 16,
      width: 170,
      marginBottom: 10, // for shadow
  },
  shopImage: {
      width: '100%',
      height: 100,
      borderRadius: 14,
      marginBottom: 10,
  },
  shopInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  shopTextContent: {
      flex: 1,
      marginRight: 4,
  },
  shopName: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
  },
  shopCategory: {
      fontSize: 11,
      fontWeight: '500',
  },
  ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2E7D32',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
  },
  ratingText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFF',
  },

  // === FLOATING BOTTOM NAV BAR ===
  floatingNavBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 14,
      position: 'absolute',
      bottom: 24, // Floating effect
      left: 20,
      right: 20,
      borderRadius: 30,
      elevation: 8,
  },
  navItem: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  navText: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 4,
  },
  
  // Errors
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
      marginBottom: 10,
  },
  retryButton: {
      padding: 10,
      borderRadius: 8,
  },
  retryButtonText: {
      color: '#FFF',
      fontWeight: '600',
  },
});

export default HomeScreen;
