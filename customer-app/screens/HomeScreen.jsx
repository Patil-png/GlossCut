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

  // Dynamic Styles based on theme
  const dynamicStyles = {
    headerBg: isDark ? "#121212" : "#FFFFFF",
    // We use a slightly darker shade for the thick separators to create contrast
    separatorColor: isDark ? "#1E1E1E" : "#F4F6F8", 
    cardBg: isDark ? "#1E1E1E" : "#FFFFFF",
    accentColor: theme.colors.primary || '#00BFFF',
    borderColor: isDark ? "#333" : "#F0F0F0",
    textColor: theme.colors.text,
    subTextColor: theme.colors.textSecondary,
    softShadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
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

  // Function to get icon for service
  const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return <Scissors size={24} color="#FF9800" />;
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return <Heart size={24} color="#E91E63" />;
    } else if (name.includes('massage')) {
      return <Sofa size={24} color="#673AB7" />;
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return <Dog size={24} color="#FDD835" />;
    } else if (name.includes('kids') || name.includes('baby')) {
      return <Baby size={24} color="#4FC3F7" />;
    } else {
      return <ShoppingBag size={24} color="#4CAF50" />;
    }
  };

  // Function to get background color for service
  const getServiceBackgroundColor = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('cut') || name.includes('beard')) {
      return '#FFF8E1';
    } else if (name.includes('facial') || name.includes('beauty') || name.includes('spa')) {
      return '#FCE4EC';
    } else if (name.includes('massage')) {
      return '#F3E5F5';
    } else if (name.includes('pet') || name.includes('dog') || name.includes('cat')) {
      return '#FFFDE7';
    } else if (name.includes('kids') || name.includes('baby')) {
      return '#E1F5FE';
    } else {
      return '#E8F5E9';
    }
  };

  // Helper Component for Section Divider
  const SectionSeparator = () => (
    <View style={{ height: 8, backgroundColor: dynamicStyles.separatorColor, marginVertical: 4 }} />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: dynamicStyles.headerBg }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* === HEADER FIXED === */}
      <View style={[styles.headerContainer, { borderBottomColor: dynamicStyles.separatorColor, borderBottomWidth: 1 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.locationContainer}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MapScreen")}
          >
            <View style={[styles.locationIconBox, { backgroundColor: dynamicStyles.separatorColor }]}>
               <MapPin size={20} color={dynamicStyles.accentColor} fill={dynamicStyles.accentColor} />
            </View>
            <View style={styles.locationTextContainer}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={[styles.locationLabel, { color: dynamicStyles.textColor }]}>
                  Home
                </Text>
                <ChevronDown size={14} color={dynamicStyles.textColor} style={{marginLeft: 4, marginTop: 2}} strokeWidth={2.5}/>
              </View>
              <Text style={[styles.locationSubLabel, { color: dynamicStyles.subTextColor }]} numberOfLines={1}>
                {user?.name ? `${user.name.split(" ")[0]}` : "User"}, 5A, Model Town...
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
             <TouchableOpacity
              onPress={() => navigation.navigate("SetkarCoinsScreen")}
              style={[styles.coinsBtn, { backgroundColor: isDark ? '#333' : '#FFF9C4' }]}
            >
              <Zap size={14} color="#FBC02D" fill="#FBC02D"/>
              <Text style={[styles.coinsText, { color: '#FBC02D' }]}>0</Text>
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
        <TouchableOpacity 
          activeOpacity={1} 
          style={[
            styles.searchContainer, 
            dynamicStyles.softShadow,
            { backgroundColor: isDark ? '#2C2C2C' : '#FFFFFF', borderColor: dynamicStyles.borderColor }
          ]}
        >
          <Search size={18} color={dynamicStyles.accentColor} style={{marginRight: 12}}/>
          <View style={{flex: 1}}>
             <Text style={[styles.searchLabel, { color: dynamicStyles.subTextColor }]}>Search for "Haircut"</Text>
          </View>
          <View style={[styles.micDivider, { backgroundColor: dynamicStyles.borderColor }]}/>
          <Mic size={18} color={dynamicStyles.accentColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* === SECTION 1: BANNER === */}
        <View style={styles.sectionContainer}>
            <View style={[styles.bannerWrapper, dynamicStyles.softShadow]}>
                <View style={[styles.bannerContent]}>
                    <View style={styles.saleTag}>
                        <Text style={styles.saleTagText}>50% OFF</Text>
                    </View>
                    <Text style={styles.bannerTitle}>Winter Special</Text>
                    <Text style={styles.bannerSubtitle}>Grooming Sale is Live!</Text>
                    
                    <TouchableOpacity style={styles.bookNowBtn}>
                        <Text style={styles.bookNowText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
                <Snowflake size={80} color="#E1F5FE" style={styles.bgIcon} />
                <Snowflake size={40} color="#B3E5FC" style={styles.bgIconSmall} />
            </View>
        </View>

        <SectionSeparator />

        {/* === SECTION 2: SERVICES === */}
        <View style={styles.sectionContainer}>
             <View style={styles.sectionHeaderRow}>
                 <Text style={[styles.sectionHeader, { color: dynamicStyles.textColor }]}>Categories</Text>
                 <TouchableOpacity onPress={() => navigation.navigate("BarberSearch")}>
                    <Text style={[styles.seeAllText, { color: dynamicStyles.accentColor }]}>View all</Text>
                 </TouchableOpacity>
             </View>

            {servicesLoading ? (
                <ActivityIndicator size="small" color={dynamicStyles.accentColor} />
            ) : (
                <View style={styles.categoryGrid}>
                    <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => navigation.navigate("BarberSearch")}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: dynamicStyles.separatorColor }]}>
                            <ShoppingBag size={24} color={dynamicStyles.textColor} />
                        </View>
                        <Text style={[styles.categoryLabel, { color: dynamicStyles.textColor }]}>All</Text>
                    </TouchableOpacity>

                    {services.slice(0, 7).map((service) => (
                        <TouchableOpacity
                            key={service._id}
                            style={styles.categoryItem}
                            onPress={() => navigation.navigate("BarberSearch", { selectedService: service.name })}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: getServiceBackgroundColor(service.name) }]}>
                                {getServiceIcon(service.name)}
                            </View>
                            <Text style={[styles.categoryLabel, { color: dynamicStyles.textColor }]} numberOfLines={1}>
                                {service.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>

        <SectionSeparator />

        {/* === SECTION 3: TOP RATED === */}
        <View style={[styles.sectionContainer, { paddingBottom: 10 }]}>
             <View style={styles.sectionHeaderRow}>
                 <View>
                    <Text style={[styles.sectionHeader, { color: dynamicStyles.textColor }]}>Top Rated Salons</Text>
                    <Text style={[styles.sectionSubHeader, { color: dynamicStyles.subTextColor }]}>Highly recommended near you</Text>
                 </View>
             </View>
             
             {topShopsLoading ? (
                 <ActivityIndicator size="small" color={dynamicStyles.accentColor} style={{ marginTop: 20 }}/>
             ) : (
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopScroll}>
                    {topShops.map((shop) => (
                        <TouchableOpacity
                            key={shop._id}
                            style={[styles.shopCard, dynamicStyles.softShadow, { backgroundColor: dynamicStyles.cardBg }]}
                            onPress={() => navigation.navigate("BarberSearch", { selectedShop: shop._id })}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={shop.image ? { uri: shop.image } : require("../assets/GlossCut.png")}
                                style={styles.shopImg}
                            />
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingNum}>{shop.rating ? shop.rating.toFixed(1) : "New"}</Text>
                                <Star size={10} color="#FFF" fill="#FFF" style={{marginLeft: 2}}/>
                            </View>

                            <View style={styles.shopDetails}>
                                <Text style={[styles.shopTitle, { color: dynamicStyles.textColor }]} numberOfLines={1}>{shop.name}</Text>
                                <Text style={[styles.shopSub, { color: dynamicStyles.subTextColor }]} numberOfLines={1}>
                                    {shop.category === 'Barber' ? 'Unisex' : shop.category} • 2.4 km
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                 </ScrollView>
             )}
        </View>

        <SectionSeparator />

        {/* === SECTION 4: MY ACCOUNT (LIST STYLE) === */}
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
                 <Text style={[styles.sectionHeader, { color: dynamicStyles.textColor }]}>Your Account</Text>
            </View>

            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate("History")}>
                <View style={[styles.listIcon, { backgroundColor: '#E3F2FD' }]}>
                    <History size={18} color="#1976D2"/>
                </View>
                <View style={styles.listContent}>
                    <Text style={[styles.listTitle, { color: dynamicStyles.textColor }]}>Bookings</Text>
                    <Text style={styles.listSub}>Check your past appointments</Text>
                </View>
                <ChevronRight size={18} color={dynamicStyles.subTextColor}/>
            </TouchableOpacity>

            <View style={[styles.listDivider, { backgroundColor: dynamicStyles.borderColor }]} />

            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate("LikedBarbers")}>
                <View style={[styles.listIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Heart size={18} color="#D32F2F"/>
                </View>
                <View style={styles.listContent}>
                    <Text style={[styles.listTitle, { color: dynamicStyles.textColor }]}>Favorites</Text>
                    <Text style={styles.listSub}>Salons you love</Text>
                </View>
                <ChevronRight size={18} color={dynamicStyles.subTextColor}/>
            </TouchableOpacity>

             <View style={[styles.listDivider, { backgroundColor: dynamicStyles.borderColor }]} />

            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate("SetkarCoinsScreen")}>
                <View style={[styles.listIcon, { backgroundColor: '#FFF8E1' }]}>
                    <Zap size={18} color="#FBC02D"/>
                </View>
                <View style={styles.listContent}>
                    <Text style={[styles.listTitle, { color: dynamicStyles.textColor }]}>GlossCut Coins</Text>
                    <Text style={styles.listSub}>Earn rewards on bookings</Text>
                </View>
                 <Text style={{fontSize: 12, fontWeight: '700', color: '#FBC02D'}}>0 Pts</Text>
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
  
  // HEADER
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 45 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  locationLabel: {
      fontSize: 14,
      fontWeight: '700',
  },
  locationSubLabel: {
      fontSize: 12,
      opacity: 0.7,
      width: '90%',
  },
  headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  coinsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  coinsText: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
  },
  profileBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#FFF',
      overflow: 'hidden',
  },
  headerProfileImage: {
      width: '100%',
      height: '100%',
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      borderRadius: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
  },
  searchLabel: {
      fontSize: 14,
  },
  micDivider: {
      width: 1,
      height: 24,
      marginHorizontal: 10,
  },

  // SECTION GENERAL
  scrollContent: {
      flex: 1,
  },
  sectionContainer: {
      paddingVertical: 16,
      paddingHorizontal: 16,
  },
  sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 16,
  },
  sectionHeader: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
  },
  sectionSubHeader: {
      fontSize: 13,
      marginTop: 2,
  },
  seeAllText: {
      fontSize: 14,
      fontWeight: '600',
  },

  // BANNER
  bannerWrapper: {
      backgroundColor: '#0277BD', // Deep Blue
      borderRadius: 16,
      height: 160,
      position: 'relative',
      overflow: 'hidden',
      padding: 20,
      justifyContent: 'center',
  },
  bannerContent: {
      zIndex: 2,
      width: '70%',
  },
  saleTag: {
      backgroundColor: '#FFF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 8,
  },
  saleTagText: {
      color: '#0277BD',
      fontWeight: '800',
      fontSize: 10,
  },
  bannerTitle: {
      color: '#FFF',
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 26,
  },
  bannerSubtitle: {
      color: '#E1F5FE',
      fontSize: 14,
      marginTop: 4,
      marginBottom: 14,
  },
  bookNowBtn: {
      backgroundColor: '#FFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  bookNowText: {
      color: '#0277BD',
      fontWeight: '700',
      fontSize: 12,
  },
  bgIcon: {
      position: 'absolute',
      right: -20,
      bottom: -20,
      opacity: 0.2,
  },
  bgIconSmall: {
      position: 'absolute',
      right: 60,
      top: 20,
      opacity: 0.2,
  },

  // CATEGORIES
  categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
  },
  categoryItem: {
      width: (screenWidth - 32) / 4,
      alignItems: 'center',
      marginBottom: 16,
  },
  iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
  },
  categoryLabel: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
  },

  // TOP SHOPS
  shopScroll: {
      paddingRight: 16,
  },
  shopCard: {
      width: 220,
      borderRadius: 14,
      marginRight: 16,
      marginBottom: 4,
  },
  shopImg: {
      width: '100%',
      height: 120,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
  },
  ratingBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: '#2E7D32',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
  },
  ratingNum: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '700',
  },
  shopDetails: {
      padding: 12,
  },
  shopTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
  },
  shopSub: {
      fontSize: 12,
  },

  // MY ACCOUNT LIST
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
  },
  listIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  listContent: {
      flex: 1,
  },
  listTitle: {
      fontSize: 15,
      fontWeight: '600',
  },
  listSub: {
      fontSize: 12,
      color: '#999',
      marginTop: 2,
  },
  listDivider: {
      height: 1,
      marginLeft: 56, // Align with text
      opacity: 0.5,
  },
});

export default HomeScreen;