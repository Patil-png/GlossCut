import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { MapPin, Bell, History, Coins, ChevronRight, Scissors, Heart, Dog } from "lucide-react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate("Profile")}
        >
          <Image
            source={
              user?.profilePicture
                ? user.profilePicture
                : require("../assets/GlossCut.png")
            }
            style={styles.headerProfileImage}
          />
          <View style={styles.headerTextCol}>
            <Text
              style={[
                styles.headerGreeting,
                { color: theme.colors.textSecondary },
              ]}
            >
              Welcome back,
            </Text>
            <Text
              style={[styles.headerUserName, { color: theme.colors.text }]}
            >
              {user?.name?.split(" ")[0] || "User"}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={[styles.headerIconBtn, { backgroundColor: theme.colors.background }]}
        >
          <Bell size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
          Find Your Perfect Service
        </Text>

        {/* Map Button */}
        <TouchableOpacity
          style={[styles.mapButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("MapScreen")}
        >
          <MapPin size={24} color="#fff" />
          <Text style={styles.mapButtonText}>Explore Services on Map</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("BarberSearch")}
          >
            <View
              style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary + "15" }]}
            >
              <Scissors color={theme.colors.primary} size={24} />
            </View>
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>
              Men
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("WomenSalonSearch")}
          >
            <View
              style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary + "15" }]}
            >
              <Heart color={theme.colors.primary} size={24} />
            </View>
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>
              Women
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("PetCareSearch")}
          >
            <View
              style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary + "15" }]}
            >
              <Dog color={theme.colors.primary} size={24} />
            </View>
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>
              Pet Care
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Access
        </Text>
        <View style={styles.listContainer}>
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("History")}
          >
            <View
              style={[styles.listIconBox, { backgroundColor: theme.colors.primary + "10" }]}
            >
              <History size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.listContent}>
              <Text style={[styles.listTitle, { color: theme.colors.text }]}>
                My History
              </Text>
              <Text style={[styles.listSubtitle, { color: theme.colors.textSecondary }]}>
                View past appointments
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("SetkarCoinsScreen")}
          >
            <View
              style={[styles.listIconBox, { backgroundColor: theme.colors.primary + "10" }]}
            >
              <Coins size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.listContent}>
              <Text style={[styles.listTitle, { color: theme.colors.text }]}>
                GlossCut Coins
              </Text>
              <Text style={[styles.listSubtitle, { color: theme.colors.textSecondary }]}>
                Check your balance
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===== SHOP DETAIL CARD COMPONENT =====
const ShopDetailCard = ({ shop, barbers, onClose, theme, navigation }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [shopStats, setShopStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const displayShopName = shop.shopName || "Unknown Shop";
  const displayAddress = shop.address || "Address not set";
  const displayPhone = shop.phone || "Phone not set";

  // Calculate real review data
  const displayRating = reviewsData ? reviewsData.averageRating.toFixed(1) : (shop.rating ? shop.rating.toFixed(1) : "N/A");
  const displayReviewCount = reviewsData ? reviewsData.totalReviews : (shop.reviews || 0);

  const shopImageSource = shop.image
    ? {
        uri: shop.image.startsWith("http")
          ? shop.image
          : `${process.env.EXPO_PUBLIC_API_URL}${shop.image}`,
      }
    : require("../assets/GlossCut.png");

  // Fetch fresh data for this specific shop when clicked
  useEffect(() => {
    const fetchFreshShopData = async () => {
      if (!shop) return;

      console.log(`Fetching fresh data for shop: ${shop.shopName}`);
      setLoadingReviews(true);
      setLoadingStats(true);

      try {
        // Use existing shop data from cache - no need to fetch individual shop
        const updatedShop = shop;

        // Barber ratings are already updated from cached data in fetchBarbers()
        // No need to fetch individual barber cards again

        // Define barber IDs for this shop to fetch reviews and bookings
        const barberIds = [];
        if (updatedShop.owner && updatedShop.owner._id) {
          barberIds.push(updatedShop.owner._id);
        }
        if (updatedShop.staff && updatedShop.staff.length > 0) {
          updatedShop.staff.forEach(staff => {
            if (staff._id) barberIds.push(staff._id);
          });
        }

        if (barberIds.length === 0) {
          setReviewsData({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
          setShopStats({ totalBookings: 0, activeBookings: 0, completedBookings: 0, customerSatisfaction: 0 });
          return;
        }

        // Fetch reviews and bookings for barbers in this specific shop only
        const reviewPromises = barberIds.map(barberId =>
          axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/review/barber/${barberId}`, { timeout: 10000 })
        );

        const bookingPromises = barberIds.map(barberId =>
          axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber/${barberId}/all`, { timeout: 10000 })
        );

        const [reviewResponses, bookingResponses] = await Promise.all([
          Promise.all(reviewPromises),
          Promise.all(bookingPromises)
        ]);

        // Process reviews for this shop only
        const allReviews = reviewResponses.flatMap(response => response.data);
        let reviewsData = { averageRating: 0, totalReviews: 0, ratingBreakdown: {} };

        if (allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / allReviews.length;

          // Calculate rating breakdown
          const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          allReviews.forEach(review => {
            ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;
          });

          reviewsData = {
            averageRating,
            totalReviews: allReviews.length,
            ratingBreakdown
          };
        }

        // Update individual barber ratings from fresh review data
        const barberReviewsMap = {};
        allReviews.forEach(review => {
          if (!barberReviewsMap[review.barberId]) {
            barberReviewsMap[review.barberId] = [];
          }
          barberReviewsMap[review.barberId].push(review.rating);
        });

        // Update owner rating if we have fresh review data
        if (updatedShop.owner && barberReviewsMap[updatedShop.owner._id]) {
          const ownerReviews = barberReviewsMap[updatedShop.owner._id];
          if (ownerReviews.length > 0) {
            const totalRating = ownerReviews.reduce((sum, rating) => sum + rating, 0);
            const averageRating = totalRating / ownerReviews.length;
            updatedShop.owner.rating = averageRating;
            updatedShop.owner.reviews = ownerReviews.length;
          }
        }

        // Update staff ratings if we have fresh review data
        updatedShop.staff.forEach(staffMember => {
          if (barberReviewsMap[staffMember._id]) {
            const staffReviews = barberReviewsMap[staffMember._id];
            if (staffReviews.length > 0) {
              const totalRating = staffReviews.reduce((sum, rating) => sum + rating, 0);
              const averageRating = totalRating / staffReviews.length;
              staffMember.rating = averageRating;
              staffMember.reviews = staffReviews.length;
            }
          }
        });

        setReviewsData(reviewsData);

        // Process bookings for this shop only
        const allBookings = bookingResponses.flatMap(response => response.data);
        const totalBookings = allBookings.length;
        const activeBookings = allBookings.filter(booking =>
          booking.status === 'confirmed' || booking.status === 'in_progress'
        ).length;
        const completedBookings = allBookings.filter(booking =>
          booking.status === 'completed'
        ).length;

        // Customer satisfaction is the average rating from reviews
        const customerSatisfaction = reviewsData.averageRating > 0 ? Math.round(reviewsData.averageRating * 20) : 0; // Convert to percentage

        setShopStats({
          totalBookings,
          activeBookings,
          completedBookings,
          customerSatisfaction
        });

        console.log(`Fresh data loaded for shop: ${updatedShop.shopName}`);

        // Set loading to false after all data is loaded
        setIsLoading(false);

      } catch (error) {
        console.error(`Error fetching fresh data for shop ${shop.shopName}:`, error);
        setReviewsData({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
        setShopStats({ totalBookings: 0, activeBookings: 0, completedBookings: 0, customerSatisfaction: 0 });
        setIsLoading(false); // Set loading to false even on error
      } finally {
        setLoadingReviews(false);
        setLoadingStats(false);
      }
    };

    fetchFreshShopData();
  }, [shop._id]); // Only re-fetch when shop ID changes

  const handleBarberSelect = (barber) => {
    if (!barber?.isAvailable) {
      Alert.alert(
        "Barber Offline",
        `${barber.name} is currently offline and cannot accept bookings right now.`
      );
      return;
    }

    // Navigate to BarberSearch screen with shop data and selected barber
    navigation.navigate("BarberSearch", {
      selectedShop: shop,
      selectedBarberId: barber._id,
      fromHomeScreen: true
    });
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Phone not available");
    }
  };

  const handleDirections = (lat, lng) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <View
        style={[
          styles.shopDetailWrapper,
          { backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading shop details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shopDetailWrapper,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.shopDetailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Header */}
        <View style={styles.shopImageContainer}>
          <Image
            source={shopImageSource}
            style={styles.shopImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            style={styles.imageGradient}
          />
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.imageCloseBtn,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.shopImageBottomInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopImageTitle} numberOfLines={1}>
                {displayShopName}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <StarIcon size={14} color="#FFD700" fill="#FFD700" />
                <Text
                  style={[styles.smallText, { color: "#fff", marginLeft: 6 }]}
                >
                  {displayRating} ({displayReviewCount} reviews)
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleCall(displayPhone)}
                style={[
                  styles.shopActionBtn,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Smartphone size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleDirections(
                    shop.location?.coordinates[1],
                    shop.location?.coordinates[0]
                  )
                }
                style={[
                  styles.shopActionBtn,
                  { backgroundColor: theme.colors.primary + "20" },
                ]}
              >
                <Navigation size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shop Info */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text
              style={[styles.barberAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {displayAddress}
            </Text>
          </View>
        </View>



            {/* Shop Statistics */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, marginBottom: 16 },
            ]}
          >
            Shop Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shopStats?.totalBookings || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Bookings
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shopStats?.activeBookings || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Active Bookings
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shopStats?.completedBookings || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shopStats?.customerSatisfaction ? `${shopStats.customerSatisfaction}%` : 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Satisfaction
              </Text>
            </View>
          </View>
        </View>


        {/* Operating Hours */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, marginBottom: 16 },
            ]}
          >
            Operating Hours
          </Text>
          {shop.operatingHours ? Object.entries(shop.operatingHours).map(([day, hours]) => (
            <View key={day} style={styles.operatingHourRow}>
              <Text style={[styles.dayText, { color: theme.colors.text }]}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>
                {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Closed'}
              </Text>
            </View>
          )) : (
            <>
              <View style={styles.operatingHourRow}>
                <Text style={[styles.dayText, { color: theme.colors.text }]}>Monday - Friday</Text>
                <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>9:00 AM - 8:00 PM</Text>
              </View>
              <View style={styles.operatingHourRow}>
                <Text style={[styles.dayText, { color: theme.colors.text }]}>Saturday</Text>
                <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>8:00 AM - 9:00 PM</Text>
              </View>
              <View style={styles.operatingHourRow}>
                <Text style={[styles.dayText, { color: theme.colors.text }]}>Sunday</Text>
                <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>10:00 AM - 6:00 PM</Text>
              </View>
            </>
          )}
        </View>

        {/* Shop Reviews Summary */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <View style={styles.reviewSummary}>
            <View style={styles.reviewHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text, marginBottom: 0 },
                ]}
              >
                Customer Reviews
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CustomerReviewsScreen', {
                  shopId: shop._id,
                  shopName: displayShopName,
                })}
              >
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                  View All ({displayReviewCount})
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ratingOverview}>
              <View style={styles.ratingLeft}>
                <Text style={[styles.overallRating, { color: theme.colors.text }]}>
                  {displayRating}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={16}
                      color={star <= Math.floor(displayRating) ? "#FFD700" : "#ddd"}
                      fill={star <= Math.floor(displayRating) ? "#FFD700" : "#ddd"}
                    />
                  ))}
                </View>
                <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>
                  Based on {displayReviewCount} reviews
                </Text>
              </View>
              <View style={styles.ratingBreakdown}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData?.ratingBreakdown?.[rating] || 0;
                  const percentage = displayReviewCount > 0 ? count / displayReviewCount : 0;
                  return (
                    <View key={rating} style={styles.ratingBarRow}>
                      <Text style={[styles.ratingBarLabel, { color: theme.colors.textSecondary }]}>
                        {rating}
                      </Text>
                      <View style={styles.ratingBarContainer}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            {
                              width: `${percentage * 100}%`,
                              backgroundColor: theme.colors.primary
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.ratingBarCount, { color: theme.colors.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Owner and Staff List */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, marginBottom: 16 },
            ]}
          >
            Shop Team ({(shop.owner ? 1 : 0) + (shop.staff?.length || 0)})
          </Text>

          {/* Shop Owner */}
          {shop.owner && (
            <View>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: theme.colors.text, marginBottom: 12 },
                ]}
              >
                Shop Owner
              </Text>
              <TouchableOpacity
                style={[
                  styles.barberListItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleBarberSelect({
                  _id: shop.owner._id,
                  name: shop.owner.name,
                  profilePicture: shop.owner.profilePicture,
                  rating: shop.owner.rating || 0,
                  reviews: shop.owner.reviews || 0,
                  isAvailable: shop.owner.isAvailable,
                  avgAppointmentTime: shop.avgAppointmentTime || "30 min",
                  specialties: shop.owner.specialties || [shop.category || "General"],
                  todaysBookings: shop.owner.todaysBookings || 0,
                })}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../assets/GlossCut.png")}
                  style={styles.barberListAvatar}
                  resizeMode="cover"
                />

                <View style={styles.barberListInfo}>
                  <View style={styles.barberListHeader}>
                    <Text
                      style={[styles.barberListName, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {shop.owner.name || "Unknown Owner"}
                    </Text>
                    <View
                      style={[
                        styles.barberStatusBadge,
                        {
                          backgroundColor: shop.owner.isAvailable
                            ? "#E8F5E9"
                            : "#FFEBEE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.barberStatusText,
                          {
                            color: shop.owner.isAvailable ? "#2E7D32" : "#C62828",
                          },
                        ]}
                      >
                        {shop.owner.isAvailable ? "Available" : "Offline"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.barberListDetails}>
                    <View style={styles.barberListStat}>
                      <StarIcon size={12} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.barberListStatText}>
                        {typeof shop.owner.rating === 'number' && shop.owner.rating >= 0 ? shop.owner.rating.toFixed(1) : "New"}
                      </Text>
                      <Text style={[styles.barberListStatText, { marginLeft: 4 }]}>
                        ({shop.owner.reviews || 0} reviews)
                      </Text>
                    </View>
                  </View>
                </View>

                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Staff Members */}
          {shop.staff && shop.staff.length > 0 && (
            <View>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: theme.colors.text, marginTop: 24, marginBottom: 12 },
                ]}
              >
                Staff Members ({shop.staff.length})
              </Text>
              {shop.staff.map((staffMember, index) => (
                <TouchableOpacity
                  key={staffMember._id || index}
                  style={[
                    styles.barberListItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleBarberSelect({
                    _id: staffMember._id,
                    name: staffMember.name,
                    profilePicture: staffMember.profilePicture,
                    rating: staffMember.rating || 0,
                    reviews: staffMember.reviews || 0,
                    isAvailable: staffMember.isAvailable,
                    avgAppointmentTime: shop.avgAppointmentTime || "30 min",
                    specialties: staffMember.specialties || [shop.category || "General"],
                    todaysBookings: staffMember.todaysBookings || 0,
                  })}
                  activeOpacity={0.8}
                >
                <Image
                  source={require("../assets/GlossCut.png")}
                  style={styles.barberListAvatar}
                  resizeMode="cover"
                />

                  <View style={styles.barberListInfo}>
                    <View style={styles.barberListHeader}>
                      <Text
                        style={[styles.barberListName, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {staffMember.name || "Unknown Staff"}
                      </Text>
                      <View
                        style={[
                          styles.barberStatusBadge,
                          {
                            backgroundColor: staffMember.isAvailable
                              ? "#E8F5E9"
                              : "#FFEBEE",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.barberStatusText,
                            {
                              color: staffMember.isAvailable ? "#2E7D32" : "#C62828",
                            },
                          ]}
                        >
                          {staffMember.isAvailable ? "Available" : "Offline"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.barberListDetails}>
                      <View style={styles.barberListStat}>
                        <StarIcon size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.barberListStatText}>
                          {typeof staffMember.rating === 'number' && staffMember.rating >= 0 ? staffMember.rating.toFixed(1) : "New"}
                        </Text>
                        <Text style={[styles.barberListStatText, { marginLeft: 4 }]}>
                          ({staffMember.reviews || 0} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(!shop.owner && (!shop.staff || shop.staff.length === 0)) && (
            <View style={styles.emptyBarbers}>
              <Text
                style={[
                  styles.emptyBarbersText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No team members available at this shop right now.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const BarberDetailCard = ({ barber, onClose, theme, navigation }) => {
  const displayShopName =
    barber.shopName || barber.name || barber.owner?.name || "Unknown Shop";
  const displayAddress = barber.address || "Address not set";
  const displayPhone = barber.phone || "Phone not set";
  const displayRating = barber.rating ? barber.rating.toFixed(1) : "N/A";
  const displayReviewCount = barber.reviews || 0;
  const displayTag = barber.tag || "No tag";
  const displayAvgAppointmentTime = barber.avgAppointmentTime
    ? `${barber.avgAppointmentTime}`
    : "N/A";
  const displayIsAvailable = barber.isAvailable ? "Available" : "Not Available";
  const shopImageSource = barber.image
    ? {
        uri: barber.image.startsWith("http")
          ? barber.image
          : `${process.env.EXPO_PUBLIC_API_URL}${barber.image}`,
      }
    : require("../assets/GlossCut.png");
  const serviceProviderType = barber.category || "General";

  const handleReviewPress = () => {
    navigation.navigate("CustomerReviewsScreen", {
      barberId: barber._id,
      barberName: displayShopName,
    });
  };

  const handleImagePress = () => {
    Alert.alert("Shop Image", `Displaying image for ${displayShopName}`);
  };

  const handleServiceProviderTypePress = () => {
    if (serviceProviderType === "Men's Grooming") {
      navigation.navigate("BarberSearch");
    } else if (serviceProviderType === "Women's Salon") {
      navigation.navigate("WomenSalonSearch");
    } else if (serviceProviderType === "Pet Care") {
      navigation.navigate("PetCareSearch");
    } else {
      Alert.alert(
        "Category",
        `Navigating to search for category: ${serviceProviderType}`
      );
    }
  };

  const handleBookNowPress = () => {
    if (!barber?.isAvailable) {
      Alert.alert(
        "Provider Offline",
        "This barber is currently offline and cannot accept bookings right now."
      );
      return;
    }
    navigation.navigate("Booking", { barberId: barber._id });
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const { likedProviders, likeProvider, unlikeProvider } = useAuth();
  const [liked, setLiked] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const triggerAlert = useCallback((message, type = "info") => {
    Alert.alert(type === "success" ? "Success" : type === "error" ? "Error" : "Notice", message);
  }, []);
  const toggleLike = () => {
    const isCurrentlyLiked = likedProviders.some(like => like.providerId === barber._id);
    if (isCurrentlyLiked) {
      unlikeProvider(barber._id, 'barber');
      triggerAlert("Removed from favorites", "info");
    } else {
      likeProvider(barber._id, 'barber');
      triggerAlert("Added to favorites!", "success");
    }
    setLiked(!isCurrentlyLiked);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (barber) {
      setLiked(likedProviders.some(like => like.providerId === barber._id));
    }
  }, [barber, likedProviders]);

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Phone not available");
    }
  };

  const handleDirections = (lat, lng) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const bookScale = useRef(new Animated.Value(1)).current;
  const onBookPressIn = () =>
    Animated.spring(bookScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const onBookPressOut = () =>
    Animated.spring(bookScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View
      style={[
        styles.barberDetailWrapper,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.barberDetailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={handleImagePress}
          style={styles.barberImageContainer}
          activeOpacity={0.9}
        >
          <Image
            source={shopImageSource}
            style={styles.barberShopImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            style={styles.imageGradient}
          />
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.imageCloseBtn,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  displayIsAvailable === "Available"
                    ? "rgba(46,125,50,0.15)"
                    : "rgba(198,40,40,0.15)",
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color:
                    displayIsAvailable === "Available" ? "#2E7D32" : "#C62828",
                },
              ]}
            >
              {displayIsAvailable}
            </Text>
          </View>
          <View style={styles.imageBottomInfo} pointerEvents="none">
            <View style={{ flex: 1 }}>
              <Text style={styles.imageBottomTitle} numberOfLines={1}>
                {displayShopName}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <StarIcon size={14} color="#FFD700" fill="#FFD700" />
                <Text
                  style={[styles.smallText, { color: "#fff", marginLeft: 6 }]}
                >
                  {displayRating}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={toggleLike}
              activeOpacity={0.8}
            >
              <Heart
                size={24}
                color={liked ? theme.colors.primary : "#fff"}
                fill={liked ? theme.colors.primary : "rgba(0,0,0,0.2)"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.infoCard,
            {
              paddingTop: 20,
              paddingBottom: 20,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <View style={[styles.rowBetween, { marginBottom: 16 }]}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.tagBadge,
                  { backgroundColor: theme.colors.primary + "15" },
                ]}
              >
                <Text
                  style={[styles.tagBadgeText, { color: theme.colors.primary }]}
                >
                  {serviceProviderType}
                </Text>
              </View>
              <View
                style={[
                  styles.availabilityBadge,
                  {
                    backgroundColor:
                      displayIsAvailable === "Available"
                        ? "#E8F6EC"
                        : "#FDECEA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.availabilityText,
                    {
                      color:
                        displayIsAvailable === "Available"
                          ? "#2E7D32"
                          : "#C62828",
                    },
                  ]}
                >
                  {displayIsAvailable}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => handleCall(displayPhone)}
                style={[
                  styles.smallIconBtn,
                  { backgroundColor: theme.colors.primary + "10" },
                ]}
              >
                <Smartphone size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleDirections(
                    barber.location?.coordinates[1],
                    barber.location?.coordinates[0]
                  )
                }
                style={[
                  styles.smallIconBtn,
                  { backgroundColor: theme.colors.primary + "10" },
                ]}
              >
                <Navigation size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text
              style={[styles.barberAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {displayAddress}
            </Text>
          </View>
        </Animated.View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: "transparent",
            },
          ]}
        >
          <View style={[styles.detailRow, { marginBottom: 12 }]}>
            <Smartphone size={18} color={theme.colors.textSecondary} />
            <Text
              style={[styles.barberDetailText, { color: theme.colors.text }]}
            >
              {displayPhone}
            </Text>
          </View>
          <View style={styles.rowWrap}>
            <View style={styles.detailRowSmall}>
              <GraduationCap size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>
                {displayTag}
              </Text>
            </View>
            <View style={styles.detailRowSmall}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>
                ~{displayAvgAppointmentTime}
              </Text>
            </View>
          </View>
        </View>

        {barber.description ? (
          <View
            style={[
              styles.infoCard,
              {
                paddingTop: 6,
                backgroundColor: theme.colors.background,
                borderColor: "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, marginBottom: 12 },
              ]}
            >
              About
            </Text>
            <Text
              style={[
                styles.descriptionText,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={4}
            >
              {barber.description}
            </Text>
          </View>
        ) : null}

        {barber.services && barber.services.length > 0 && (
          <View
            style={[
              styles.infoCard,
              {
                paddingBottom: 20,
                backgroundColor: theme.colors.background,
                borderColor: "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, marginBottom: 16 },
              ]}
            >
              Services
            </Text>
            {barber.services.map((service, index) => (
              <View
                key={index}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: "transparent",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.serviceTextItem,
                      { color: theme.colors.text },
                    ]}
                  >
                    {service.name}
                  </Text>
                  <Text
                    style={[
                      styles.serviceSubText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {service.duration ?? service.time
                      ? `${service.duration ?? service.time} mins`
                      : ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pricePill,
                    { backgroundColor: theme.colors.primary + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.pricePillText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    ₹{service.price}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Animated.View style={{ transform: [{ scale: bookScale }] }}>
        <TouchableOpacity
          style={[
            styles.bookButtonFixed,
            {
              backgroundColor: barber?.isAvailable
                ? theme.colors.primary
                : theme.colors.border,
              opacity: barber?.isAvailable ? 1 : 0.7,
            },
          ]}
          onPressIn={barber?.isAvailable ? onBookPressIn : undefined}
          onPressOut={barber?.isAvailable ? onBookPressOut : undefined}
          onPress={handleBookNowPress}
          activeOpacity={barber?.isAvailable ? 0.9 : 1}
          disabled={!barber?.isAvailable}
        >
          <Text style={styles.bookButtonText}>
            {barber?.isAvailable ? "Book Appointment" : "Provider Offline"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
    marginRight: 12,
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerUserName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 16,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 30,
    letterSpacing: -0.8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 40,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  listContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  listSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.7,
    letterSpacing: 0.1,
  },

  // ===== FLOATING HEADER =====
  floatingHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
    marginRight: 12,
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerUserName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5252",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // ===== BOTTOM SHEET =====
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHandleArea: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 24,
    letterSpacing: -0.8,
  },
  subSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 32,
    letterSpacing: -0.5,
  },

  // ===== QUICK ACTIONS GRID =====
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // ===== LIST ITEMS =====
  listContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  listSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  listDivider: {
    height: 1,
    opacity: 0.1,
    marginLeft: 64,
    marginVertical: 4,
  },

  // ===== MAP MARKERS =====
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    height: 72,
    overflow: "visible",
  },
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  markerLottieWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    backgroundColor: "#eee",
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  userLocationMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(66, 133, 244, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  userLocationMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4285F4",
    borderWidth: 3,
    borderColor: "#fff",
  },

  // ===== ALERT BANNER =====
  alertBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 99,
  },
  alertContent: {
    flex: 1,
    marginRight: 12,
  },
  alertText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  alertDismissBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
  },

  // ===== AD MODAL STYLING =====
  adBannerOuterContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
  },
  adBannerCard: {
    width: "100%",
    maxHeight: screenHeight * 0.85,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 16,
  },
  adHero: {
    width: "100%",
    position: "relative",
    backgroundColor: "#000",
  },
  adHeroImage: {
    width: "100%",
    height: "100%",
  },
  adTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  adHeaderRow: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adBadge: {
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  adBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  adCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  adContentScroll: {
    flex: 1,
  },
  adContentContainer: {
    padding: 24,
    paddingBottom: 12,
  },
  adTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  adDescription: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.85,
    marginBottom: 24,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  adBarberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  adBarberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.05)",
  },
  adBarberInfo: {
    flex: 1,
    justifyContent: "center",
  },
  adBarberName: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  adBarberShop: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  adRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  adRatingText: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  adFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  adPrimaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  adPrimaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // ===== BARBER DETAIL CARD =====
  barberDetailWrapper: {
    flex: 1,
  },
  barberDetailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  barberImageContainer: {
    height: 240,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  barberShopImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  statusPill: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  imageBottomInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  imageBottomTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  imageCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  smallText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  // ===== INFO CARDS =====
  infoCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  tagBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  availabilityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  smallIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barberAddress: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  barberDetailText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 8,
  },
  detailRowSmall: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ===== SECTION TITLES =====
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  // ===== SERVICE CARDS =====
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceTextItem: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  serviceSubText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  pricePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  pricePillText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  // ===== BOOK BUTTON =====
  bookButtonFixed: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // ===== SHOP DETAIL CARD STYLES =====
  shopDetailWrapper: {
    flex: 1,
  },
  shopDetailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  shopImageContainer: {
    height: 200,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  shopImage: {
    width: "100%",
    height: "100%",
  },
  shopImageBottomInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  shopImageTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shopActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  barberListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  barberListAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  barberListInfo: {
    flex: 1,
  },
  barberListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  barberListName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  barberStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  barberStatusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  barberListDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  barberListStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  barberListStatText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
    color: "#666",
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
  emptyBarbers: {
    alignItems: "center",
    padding: 20,
  },
  emptyBarbersText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  operatingHourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
  },
  hoursText: {
    fontSize: 14,
  },
  reviewSummary: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingOverview: {
    flexDirection: "row",
    marginBottom: 16,
  },
  ratingLeft: {
    flex: 1,
    alignItems: "center",
  },
  overallRating: {
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 8,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    textAlign: "center",
  },
  ratingBreakdown: {
    flex: 1,
    marginLeft: 20,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingBarLabel: {
    width: 20,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  ratingBarCount: {
    width: 30,
    fontSize: 12,
    textAlign: "right",
  },

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
});

export default HomeScreen;
