import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  ScrollView,
  Image,
  Linking,
  Dimensions,
  StatusBar,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clock,
  Navigation,
  Smartphone,
  Heart,
  X,
  GraduationCap,
  ChevronRight,
  Star as StarIcon,
  MapPin,
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { barbers as dummyBarbers } from "../data/barbers.js";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MapScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.9136,
    longitude: 77.768,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopBarbers, setShopBarbers] = useState([]);
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const bottomSheetHeight = useRef(
    new Animated.Value(screenHeight * 0.35)
  ).current;
  const [markerTracks, setMarkerTracks] = useState({});

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        bottomSheetHeight.setOffset(bottomSheetHeight._value);
        bottomSheetHeight.setValue(0);
      },
      onPanResponderMove: (e, gesture) => {
        bottomSheetHeight.setValue(-gesture.dy);
      },
      onPanResponderRelease: (e, gesture) => {
        bottomSheetHeight.flattenOffset();
        const currentHeight = bottomSheetHeight._value;
        const velocity = gesture.vy;

        const collapsedHeight = screenHeight * 0.2;
        const halfOpenHeight = screenHeight * 0.5;
        const fullOpenHeight = screenHeight * 0.85;

        let targetHeight = currentHeight;
        const SWIPE_THRESHOLD = 0.5;

        if (velocity > SWIPE_THRESHOLD) {
          if (currentHeight > halfOpenHeight) {
            targetHeight = halfOpenHeight;
          } else {
            targetHeight = collapsedHeight;
          }
        } else if (velocity < -SWIPE_THRESHOLD) {
          if (currentHeight < halfOpenHeight) {
            targetHeight = halfOpenHeight;
          } else {
            targetHeight = fullOpenHeight;
          }
        } else {
          if (currentHeight < (collapsedHeight + halfOpenHeight) / 2) {
            targetHeight = collapsedHeight;
          } else if (currentHeight < (halfOpenHeight + fullOpenHeight) / 2) {
            targetHeight = halfOpenHeight;
          } else {
            targetHeight = fullOpenHeight;
          }
        }

        targetHeight = Math.max(
          collapsedHeight,
          Math.min(fullOpenHeight, targetHeight)
        );

        Animated.spring(bottomSheetHeight, {
          toValue: targetHeight,
          tension: 40,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      // Check for cached location
      const cachedLocationData = await AsyncStorage.getItem("cachedLocation");
      const now = Date.now();
      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

      let locationToUse = null;

      if (cachedLocationData) {
        const { location: cachedLocation, timestamp } = JSON.parse(cachedLocationData);
        const timeSinceCache = now - timestamp;

        // Use cached location if it's less than 2 days old
        if (timeSinceCache < TWO_DAYS_MS) {
          locationToUse = cachedLocation;
          console.log("Using cached location, age:", Math.round(timeSinceCache / (1000 * 60 * 60)), "hours");
        }
      }

      // Fetch new location if no cache or cache is too old
      if (!locationToUse) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }

        console.log("Fetching new location...");
        let location = await Location.getCurrentPositionAsync({});

        // Cache the new location with timestamp
        await AsyncStorage.setItem("cachedLocation", JSON.stringify({
          location,
          timestamp: now
        }));

        locationToUse = location;
        console.log("Location cached successfully");
      }

      setLocation(locationToUse);
      setMapRegion({
        latitude: locationToUse.coords.latitude,
        longitude: locationToUse.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      fetchBarbers();
    })();
  }, []);

  const fetchBarbers = async () => {
    try {
      // Check for cached shop data
      const cachedShopData = await AsyncStorage.getItem("cachedShopData");
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

      let shopDataToUse = null;

      if (cachedShopData) {
        const { shops: cachedShops, timestamp } = JSON.parse(cachedShopData);
        const timeSinceCache = now - timestamp;

        if (timeSinceCache < ONE_DAY_MS) {
          shopDataToUse = cachedShops;
          console.log("Using cached shop data, age:", Math.round(timeSinceCache / (1000 * 60 * 60)), "hours");
        }
      }

      if (!shopDataToUse) {
        console.log("Fetching fresh shop data...");
        const shopRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/all`, { timeout: 10000 });
        const barberRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/all`, { timeout: 10000 });

        if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
          const formattedData = [];

          for (const shop of shopRes.data) {
            const shopBarbers = barberRes.data.filter((barber) => barber.shopId === shop._id);
            let totalTodaysBookings = 0;

            for (const barber of shopBarbers) {
              if (barber.isAvailable) {
                totalTodaysBookings += barber.todaysBookings || 0;
              }
            }

            const shopData = {
              _id: shop._id,
              location: shop.location,
              shopName: shop.owner?.name || shop.name || "Unknown Shop",
              address: shop.address || "Address not set",
              phone: shop.phone,
              owner: shop.owner ? {
                _id: shop.owner._id,
                name: shop.owner.name,
                profilePicture: shop.owner.profilePicture,
                rating: shop.owner.rating || 0,
                reviews: shop.owner.reviews || 0,
                isAvailable: shop.owner.isAvailable,
                maxAppointmentsPerDay: shop.owner.maxAppointmentsPerDay || 10,
                todaysBookings: 0,
              } : null,
              staff: (shop.staff || []).map(staffMember => ({
                _id: staffMember._id,
                name: staffMember.name,
                profilePicture: staffMember.profilePicture,
                rating: staffMember.rating || 0,
                reviews: staffMember.reviews || 0,
                isAvailable: staffMember.isAvailable,
                maxAppointmentsPerDay: staffMember.maxAppointmentsPerDay || 10,
                todaysBookings: 0,
              })),
              image: shop.image || shop.owner?.profilePicture,
              rating: shop.rating || 0,
              reviews: shop.totalReviews || 0,
              category: shop.category || "General",
              isAvailable: !!shop.isAvailable,
              todaysBookings: totalTodaysBookings,
              listingTier: shop.listingTier,
              totalBarbers: (shop.owner ? 1 : 0) + (shop.staff?.length || 0),
              services: shop.services || [],
              avgAppointmentTime: shop.avgAppointmentTime || "30 min",
              operatingHours: shop.operatingHours,
              shopKey: `${shop.name || "Unknown Shop"}|||${shop.address || "Address not set"}`,
            };

            // Process owner ratings
            let ownerBarberCard = null;
            if (shopData.owner) {
                ownerBarberCard = shopBarbers.find(b =>
                (b.barberId === shopData.owner._id || b._id === shopData.owner._id) &&
                b.approvalStatus === 'approved'
              );
              if (ownerBarberCard) {
                shopData.owner.rating = typeof ownerBarberCard.rating === 'number' ? ownerBarberCard.rating : shopData.owner.rating || 0;
                shopData.owner.reviews = typeof ownerBarberCard.reviews === 'number' ? ownerBarberCard.reviews : shopData.owner.reviews || 0;
                shopData.owner.todaysBookings = ownerBarberCard.todaysBookings || 0;
              }
            }

            // Process staff ratings
            const staffBarberCards = {};
            shopData.staff.forEach(staffMember => {
              const staffBarberCard = shopBarbers.find(b =>
                (b.barberId === staffMember._id || b._id === staffMember._id) &&
                b.approvalStatus === 'approved'
              );
              if (staffBarberCard) {
                staffBarberCards[staffMember._id] = staffBarberCard;
                staffMember.rating = typeof staffBarberCard.rating === 'number' ? staffBarberCard.rating : staffMember.rating || 0;
                staffMember.reviews = typeof staffBarberCard.reviews === 'number' ? staffBarberCard.reviews : staffMember.reviews || 0;
                staffMember.todaysBookings = staffBarberCard.todaysBookings || 0;
              }
            });

            shopData.ownerBarberCard = ownerBarberCard;
            shopData.staffBarberCards = staffBarberCards;
            formattedData.push(shopData);
          }

          // Group by unique location
          const groupedByLocation = {};
          formattedData.forEach((shop) => {
            const locationKey = shop.shopKey;
            if (!groupedByLocation[locationKey]) {
              groupedByLocation[locationKey] = shop;
            } else {
              if ((shop.staff?.length || 0) > (groupedByLocation[locationKey].staff?.length || 0)) {
                groupedByLocation[locationKey] = shop;
              }
            }
          });

          const finalShopsArray = Object.values(groupedByLocation).map((shop, index) => ({
            ...shop,
            uniqueId: `${shop.shopKey}_${index}`,
          }));

          await AsyncStorage.setItem("cachedShopData", JSON.stringify({
            shops: finalShopsArray,
            timestamp: now
          }));

          shopDataToUse = finalShopsArray;
          console.log(`Found ${finalShopsArray.length} unique shop locations.`);
        }
      }
      setBarbers(shopDataToUse);
    } catch (error) {
      console.error("Error fetching shop data, falling back to dummy data:", error);
      setBarbers(dummyBarbers);
    }
  };

  const handleMarkerPress = (shop) => {
    setSelectedShop(shop);
    setShopBarbers(shop.barbers || []);
    Animated.spring(bottomSheetHeight, {
      toValue: screenHeight * 0.75,
      tension: 30,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const closeBarberDetails = () => {
    setSelectedBarber(null);
    Animated.spring(bottomSheetHeight, {
      toValue: screenHeight * 0.35,
      tension: 30,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.mapContainer]}>
        <MapView
          ref={mapRef}
          customMapStyle={theme.dark ? mapStyle : []}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          pitchEnabled={true}
          rotateEnabled={true}
          showsBuildings={true}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
            >
              <View style={styles.userLocationMarkerOuter}>
                <View style={styles.userLocationMarkerInner} />
              </View>
            </Marker>
          )}
          {barbers.map((barber) => {
            if (barber.location?.coordinates?.length === 2) {
              const latitude = parseFloat(barber.location.coordinates[1]);
              const longitude = parseFloat(barber.location.coordinates[0]);
              const displayShopName = barber.shopName || barber.owner?.name || "Unknown Shop";

              if (!isNaN(latitude) && !isNaN(longitude)) {
                return (
                  <Marker
                    key={barber.uniqueId}
                    coordinate={{ latitude, longitude }}
                    anchor={{ x: 0.5, y: 1 }}
                    title={displayShopName}
                    description={barber.address}
                    onPress={() => handleMarkerPress(barber)}
                    tracksViewChanges={markerTracks[barber.uniqueId] === undefined ? true : markerTracks[barber.uniqueId]}
                  >
                    <View style={styles.markerWrapper} pointerEvents="box-none">
                      <View style={[styles.markerContainer, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.markerLottieWrapper}>
                          <Image
                            source={require("../assets/GlossCut.png")}
                            style={styles.markerImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                      <View style={[styles.markerArrow, { borderTopColor: theme.colors.card }]} />
                    </View>
                  </Marker>
                );
              }
            }
            return null;
          })}
        </MapView>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              height: bottomSheetHeight,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
          </View>

          {selectedShop ? (
            <ShopDetailCard
              shop={selectedShop}
              barbers={shopBarbers}
              onClose={() => {
                setSelectedShop(null);
                setShopBarbers([]);
                Animated.spring(bottomSheetHeight, {
                  toValue: screenHeight * 0.35,
                  tension: 30,
                  friction: 7,
                  useNativeDriver: false,
                }).start();
              }}
              theme={theme}
              navigation={navigation}
            />
          ) : selectedBarber ? (
            <BarberDetailCard
              barber={selectedBarber}
              onClose={closeBarberDetails}
              theme={theme}
              navigation={navigation}
            />
          ) : null}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ===== SHOP DETAIL CARD COMPONENT =====
const ShopDetailCard = ({ shop, barbers, onClose, theme, navigation }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const displayShopName = shop.shopName || "Unknown Shop";
  const displayAddress = shop.address || "Address not set";
  const displayPhone = shop.phone || "Phone not set";

  const displayRating = reviewsData ? reviewsData.averageRating.toFixed(1) : (shop.rating ? shop.rating.toFixed(1) : "N/A");
  const displayReviewCount = reviewsData ? reviewsData.totalReviews : (shop.reviews || 0);

  const shopImageSource = shop.image
    ? { uri: shop.image.startsWith("http") ? shop.image : `${process.env.EXPO_PUBLIC_API_URL}${shop.image}` }
    : require("../assets/GlossCut.png");

  useEffect(() => {
    const fetchFreshShopData = async () => {
      if (!shop) return;
      try {
        const updatedShop = shop;
        const barberIds = [];
        if (updatedShop.owner && updatedShop.owner._id) barberIds.push(updatedShop.owner._id);
        if (updatedShop.staff && updatedShop.staff.length > 0) {
          updatedShop.staff.forEach(staff => {
            if (staff._id) barberIds.push(staff._id);
          });
        }

        if (barberIds.length === 0) {
          setReviewsData({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
          setIsLoading(false);
          return;
        }

        const reviewPromises = barberIds.map(barberId =>
          axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/review/barber/${barberId}`, { timeout: 10000 })
        );

        // We only fetch reviews now, no booking history needed
        const reviewResponses = await Promise.all(reviewPromises);

        const allReviews = reviewResponses.flatMap(response => response.data);
        let reviewsData = { averageRating: 0, totalReviews: 0, ratingBreakdown: {} };

        if (allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / allReviews.length;
          const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          allReviews.forEach(review => {
            ratingBreakdown[review.rating] = (ratingBreakdown[review.rating] || 0) + 1;
          });
          reviewsData = { averageRating, totalReviews: allReviews.length, ratingBreakdown };
        }

        setReviewsData(reviewsData);
        setIsLoading(false);

      } catch (error) {
        console.error(`Error fetching fresh data for shop ${shop.shopName}:`, error);
        setReviewsData({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
        setIsLoading(false);
      }
    };

    fetchFreshShopData();
  }, [shop._id]);

  const handleBarberSelect = (barber) => {
    if (!barber?.isAvailable) {
      Alert.alert("Barber Offline", `${barber.name} is currently offline and cannot accept bookings right now.`);
      return;
    }
    navigation.navigate("BarberSearch", {
      selectedShop: shop,
      selectedBarberId: barber._id,
      fromHomeScreen: true
    });
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Phone not available");
  };

  const handleDirections = (lat, lng) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={[styles.shopDetailWrapper, { backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading shop details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shopDetailWrapper, { backgroundColor: theme.colors.card }]}>
      <ScrollView contentContainerStyle={styles.shopDetailScrollContent} showsVerticalScrollIndicator={false}>
        {/* Shop Header */}
        <View style={styles.shopImageContainer}>
          <Image source={shopImageSource} style={styles.shopImage} resizeMode="cover" />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.4)"]} style={styles.imageGradient} />
          <TouchableOpacity
            onPress={onClose}
            style={[styles.imageCloseBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.shopImageBottomInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopImageTitle} numberOfLines={1}>{displayShopName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <StarIcon size={14} color="#FFD700" fill="#FFD700" />
                <Text style={[styles.smallText, { color: "#fff", marginLeft: 6 }]}>
                  {displayRating} ({displayReviewCount} reviews)
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => handleCall(displayPhone)} style={[styles.shopActionBtn, { backgroundColor: theme.colors.primary + "20" }]}>
                <Smartphone size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDirections(shop.location?.coordinates[1], shop.location?.coordinates[0])}
                style={[styles.shopActionBtn, { backgroundColor: theme.colors.primary + "20" }]}
              >
                <Navigation size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shop Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text style={[styles.barberAddress, { color: theme.colors.text }]} numberOfLines={2}>
              {displayAddress}
            </Text>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 16 }]}>Operating Hours</Text>
          {shop.operatingHours ? Object.entries(shop.operatingHours).map(([day, hours]) => (
            <View key={day} style={styles.operatingHourRow}>
              <Text style={[styles.dayText, { color: theme.colors.text }]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>
                {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Closed'}
              </Text>
            </View>
          )) : (
            <View style={styles.operatingHourRow}>
              <Text style={[styles.dayText, { color: theme.colors.text }]}>Daily</Text>
              <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>9:00 AM - 9:00 PM</Text>
            </View>
          )}
        </View>

        {/* Reviews Summary */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
          <View style={styles.reviewSummary}>
            <View style={styles.reviewHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Customer Reviews</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CustomerReviewsScreen', { shopId: shop._id, shopName: displayShopName })}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All ({displayReviewCount})</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ratingOverview}>
              <View style={styles.ratingLeft}>
                <Text style={[styles.overallRating, { color: theme.colors.text }]}>{displayRating}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} size={16} color={star <= Math.floor(displayRating) ? "#FFD700" : "#ddd"} fill={star <= Math.floor(displayRating) ? "#FFD700" : "#ddd"} />
                  ))}
                </View>
                <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>Based on {displayReviewCount} reviews</Text>
              </View>
              <View style={styles.ratingBreakdown}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData?.ratingBreakdown?.[rating] || 0;
                  const percentage = displayReviewCount > 0 ? count / displayReviewCount : 0;
                  return (
                    <View key={rating} style={styles.ratingBarRow}>
                      <Text style={[styles.ratingBarLabel, { color: theme.colors.textSecondary }]}>{rating}</Text>
                      <View style={styles.ratingBarContainer}>
                        <View style={[styles.ratingBarFill, { width: `${percentage * 100}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={[styles.ratingBarCount, { color: theme.colors.textSecondary }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Owner and Staff List */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 16 }]}>
            Shop Team ({(shop.owner ? 1 : 0) + (shop.staff?.length || 0)})
          </Text>

          {/* Shop Owner */}
          {shop.owner && (
            <View>
              <Text style={[styles.subSectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>Shop Owner</Text>
              <TouchableOpacity
                style={[styles.barberListItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
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
                <Image source={require("../assets/GlossCut.png")} style={styles.barberListAvatar} resizeMode="cover" />
                <View style={styles.barberListInfo}>
                  <View style={styles.barberListHeader}>
                    <Text style={[styles.barberListName, { color: theme.colors.text }]} numberOfLines={1}>
                      {shop.owner.name || "Unknown Owner"}
                    </Text>
                    <View style={[styles.barberStatusBadge, { backgroundColor: shop.owner.isAvailable ? "#E8F5E9" : "#FFEBEE" }]}>
                      <Text style={[styles.barberStatusText, { color: shop.owner.isAvailable ? "#2E7D32" : "#C62828" }]}>
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
              <Text style={[styles.subSectionTitle, { color: theme.colors.text, marginTop: 24, marginBottom: 12 }]}>
                Staff Members ({shop.staff.length})
              </Text>
              {shop.staff.map((staffMember, index) => (
                <TouchableOpacity
                  key={staffMember._id || index}
                  style={[styles.barberListItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
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
                  <Image source={require("../assets/GlossCut.png")} style={styles.barberListAvatar} resizeMode="cover" />
                  <View style={styles.barberListInfo}>
                    <View style={styles.barberListHeader}>
                      <Text style={[styles.barberListName, { color: theme.colors.text }]} numberOfLines={1}>
                        {staffMember.name || "Unknown Staff"}
                      </Text>
                      <View style={[styles.barberStatusBadge, { backgroundColor: staffMember.isAvailable ? "#E8F5E9" : "#FFEBEE" }]}>
                        <Text style={[styles.barberStatusText, { color: staffMember.isAvailable ? "#2E7D32" : "#C62828" }]}>
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
              <Text style={[styles.emptyBarbersText, { color: theme.colors.textSecondary }]}>
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

const BarberDetailCard = ({ barber, onClose, theme, navigation }) => {
  const displayShopName = barber.shopName || barber.name || barber.owner?.name || "Unknown Shop";
  const displayAddress = barber.address || "Address not set";
  const displayPhone = barber.phone || "Phone not set";
  const displayRating = barber.rating ? barber.rating.toFixed(1) : "N/A";
  const displayTag = barber.tag || "No tag";
  const displayAvgAppointmentTime = barber.avgAppointmentTime ? `${barber.avgAppointmentTime}` : "N/A";
  const displayIsAvailable = barber.isAvailable ? "Available" : "Not Available";
  const shopImageSource = barber.image
    ? { uri: barber.image.startsWith("http") ? barber.image : `${process.env.EXPO_PUBLIC_API_URL}${barber.image}` }
    : require("../assets/GlossCut.png");
  const serviceProviderType = barber.category || "General";

  const { likedProviders, likeProvider, unlikeProvider } = useAuth();
  const [liked, setLiked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const bookScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (barber) setLiked(likedProviders.some(like => like.providerId === barber._id));
  }, [barber, likedProviders]);

  const toggleLike = () => {
    const isCurrentlyLiked = likedProviders.some(like => like.providerId === barber._id);
    if (isCurrentlyLiked) {
      unlikeProvider(barber._id, 'barber');
      Alert.alert("Removed", "Removed from favorites");
    } else {
      likeProvider(barber._id, 'barber');
      Alert.alert("Success", "Added to favorites!");
    }
    setLiked(!isCurrentlyLiked);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleBookNowPress = () => {
    if (!barber?.isAvailable) {
      Alert.alert("Provider Offline", "This barber is currently offline and cannot accept bookings right now.");
      return;
    }
    navigation.navigate("Booking", { barberId: barber._id });
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Phone not available");
  };

  const handleDirections = (lat, lng) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const onBookPressIn = () => Animated.spring(bookScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onBookPressOut = () => Animated.spring(bookScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={[styles.barberDetailWrapper, { backgroundColor: theme.colors.card }]}>
      <ScrollView contentContainerStyle={styles.barberDetailScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => Alert.alert("Shop Image", `Displaying image for ${displayShopName}`)} style={styles.barberImageContainer} activeOpacity={0.9}>
          <Image source={shopImageSource} style={styles.barberShopImage} resizeMode="cover" />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.4)"]} style={styles.imageGradient} />
          <TouchableOpacity
            onPress={onClose}
            style={[styles.imageCloseBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={[styles.statusPill, { backgroundColor: displayIsAvailable === "Available" ? "rgba(46,125,50,0.15)" : "rgba(198,40,40,0.15)" }]}>
            <Text style={[styles.statusPillText, { color: displayIsAvailable === "Available" ? "#2E7D32" : "#C62828" }]}>
              {displayIsAvailable}
            </Text>
          </View>
          <View style={styles.imageBottomInfo} pointerEvents="none">
            <View style={{ flex: 1 }}>
              <Text style={styles.imageBottomTitle} numberOfLines={1}>{displayShopName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <StarIcon size={14} color="#FFD700" fill="#FFD700" />
                <Text style={[styles.smallText, { color: "#fff", marginLeft: 6 }]}>{displayRating}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton} onPress={toggleLike} activeOpacity={0.8}>
              <Heart size={24} color={liked ? theme.colors.primary : "#fff"} fill={liked ? theme.colors.primary : "rgba(0,0,0,0.2)"} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.infoCard,
            { paddingTop: 20, paddingBottom: 20, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }], backgroundColor: theme.colors.background, borderColor: "transparent" },
          ]}
        >
          <View style={[styles.rowBetween, { marginBottom: 16 }]}>
            <View style={styles.badgeRow}>
              <View style={[styles.tagBadge, { backgroundColor: theme.colors.primary + "15" }]}>
                <Text style={[styles.tagBadgeText, { color: theme.colors.primary }]}>{serviceProviderType}</Text>
              </View>
              <View style={[styles.availabilityBadge, { backgroundColor: displayIsAvailable === "Available" ? "#E8F6EC" : "#FDECEA" }]}>
                <Text style={[styles.availabilityText, { color: displayIsAvailable === "Available" ? "#2E7D32" : "#C62828" }]}>{displayIsAvailable}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity onPress={() => handleCall(displayPhone)} style={[styles.smallIconBtn, { backgroundColor: theme.colors.primary + "10" }]}>
                <Smartphone size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDirections(barber.location?.coordinates[1], barber.location?.coordinates[0])}
                style={[styles.smallIconBtn, { backgroundColor: theme.colors.primary + "10" }]}
              >
                <Navigation size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text style={[styles.barberAddress, { color: theme.colors.text }]} numberOfLines={2}>{displayAddress}</Text>
          </View>
        </Animated.View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
          <View style={[styles.detailRow, { marginBottom: 12 }]}>
            <Smartphone size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.barberDetailText, { color: theme.colors.text }]}>{displayPhone}</Text>
          </View>
          <View style={styles.rowWrap}>
            <View style={styles.detailRowSmall}>
              <GraduationCap size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>{displayTag}</Text>
            </View>
            <View style={styles.detailRowSmall}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>~{displayAvgAppointmentTime}</Text>
            </View>
          </View>
        </View>

        {barber.description ? (
          <View style={[styles.infoCard, { paddingTop: 6, backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>About</Text>
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]} numberOfLines={4}>{barber.description}</Text>
          </View>
        ) : null}

        {barber.services && barber.services.length > 0 && (
          <View style={[styles.infoCard, { paddingBottom: 20, backgroundColor: theme.colors.background, borderColor: "transparent" }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 16 }]}>Services</Text>
            {barber.services.map((service, index) => (
              <View key={index} style={[styles.serviceCard, { backgroundColor: theme.colors.card, borderColor: "transparent" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTextItem, { color: theme.colors.text }]}>{service.name}</Text>
                  <Text style={[styles.serviceSubText, { color: theme.colors.textSecondary }]}>
                    {service.duration ?? service.time ? `${service.duration ?? service.time} mins` : ""}
                  </Text>
                </View>
                <View style={[styles.pricePill, { backgroundColor: theme.colors.primary + "15" }]}>
                  <Text style={[styles.pricePillText, { color: theme.colors.primary }]}>₹{service.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Animated.View style={{ transform: [{ scale: bookScale }] }}>
        <TouchableOpacity
          style={[styles.bookButtonFixed, { backgroundColor: barber?.isAvailable ? theme.colors.primary : theme.colors.border, opacity: barber?.isAvailable ? 1 : 0.7 }]}
          onPressIn={barber?.isAvailable ? onBookPressIn : undefined}
          onPressOut={barber?.isAvailable ? onBookPressOut : undefined}
          onPress={handleBookNowPress}
          activeOpacity={barber?.isAvailable ? 0.9 : 1}
          disabled={!barber?.isAvailable}
        >
          <Text style={styles.bookButtonText}>{barber?.isAvailable ? "Book Appointment" : "Provider Offline"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },
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
  sheetHandleArea: { width: "100%", alignItems: "center", paddingVertical: 16 },
  sheetHandle: { width: 40, height: 5, borderRadius: 2.5, opacity: 0.3 },
  sheetScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  markerWrapper: { alignItems: "center", justifyContent: "center", width: 70, height: 72, overflow: "visible" },
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
  markerLottieWrapper: { width: "100%", height: "100%", borderRadius: 26, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  markerImage: { width: "100%", height: "100%", borderRadius: 26, backgroundColor: "#eee" },
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
  userLocationMarkerOuter: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(66, 133, 244, 0.25)", alignItems: "center", justifyContent: "center" },
  userLocationMarkerInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#4285F4", borderWidth: 3, borderColor: "#fff" },
  barberDetailWrapper: { flex: 1 },
  barberDetailScrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  barberImageContainer: { height: 240, borderRadius: 28, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  barberShopImage: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 120 },
  statusPill: { position: "absolute", top: 16, left: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  statusPillText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  imageBottomInfo: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingVertical: 20, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  imageBottomTitle: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.6, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  imageCloseBtn: { position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  smallText: { fontSize: 13, fontWeight: "600", letterSpacing: -0.1 },
  infoCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tagBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  tagBadgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  availabilityBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  availabilityText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  smallIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  detailRow: { flexDirection: "row", alignItems: "center" },
  barberAddress: { fontSize: 15, marginLeft: 12, flex: 1, fontWeight: "500", lineHeight: 22, letterSpacing: -0.1 },
  barberDetailText: { fontSize: 15, marginLeft: 12, fontWeight: "600", letterSpacing: -0.1 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 8 },
  detailRowSmall: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  descriptionText: { fontSize: 15, lineHeight: 24, fontWeight: "500", letterSpacing: -0.1 },
  serviceCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  serviceTextItem: { fontSize: 16, fontWeight: "700", marginBottom: 6, letterSpacing: -0.3 },
  serviceSubText: { fontSize: 13, fontWeight: "600", letterSpacing: 0.1 },
  pricePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, alignItems: "center", justifyContent: "center", minWidth: 80 },
  pricePillText: { fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  bookButtonFixed: { position: "absolute", left: 20, right: 20, bottom: 24, paddingVertical: 18, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  bookButtonText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  shopDetailWrapper: { flex: 1 },
  shopDetailScrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  shopImageContainer: { height: 200, borderRadius: 28, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  shopImage: { width: "100%", height: "100%" },
  shopImageBottomInfo: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingVertical: 20, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  shopImageTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: -0.6, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  shopActionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  barberListItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  barberListAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16, borderWidth: 2, borderColor: "rgba(0,0,0,0.1)" },
  barberListInfo: { flex: 1 },
  barberListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  barberListName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  barberStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  barberStatusText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  barberListDetails: { flexDirection: "row", alignItems: "center" },
  barberListStat: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  barberListStatText: { fontSize: 13, fontWeight: "600", marginLeft: 4, color: "#666" },
  emptyBarbers: { alignItems: "center", padding: 20 },
  emptyBarbersText: { fontSize: 16, fontWeight: "500", textAlign: "center" },
  // Removed statsGrid, statItem, etc. styles
  operatingHourRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  dayText: { fontSize: 16, fontWeight: "600" },
  hoursText: { fontSize: 14 },
  reviewSummary: { marginBottom: 16 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  viewAllText: { fontSize: 14, fontWeight: "600" },
  ratingOverview: { flexDirection: "row", marginBottom: 16 },
  ratingLeft: { flex: 1, alignItems: "center" },
  overallRating: { fontSize: 48, fontWeight: "900", marginBottom: 8 },
  starRow: { flexDirection: "row", marginBottom: 8 },
  reviewCount: { fontSize: 14, textAlign: "center" },
  ratingBreakdown: { flex: 1, marginLeft: 20 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ratingBarLabel: { width: 20, fontSize: 14, fontWeight: "600", textAlign: "center" },
  ratingBarContainer: { flex: 1, height: 8, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 4, marginHorizontal: 8, overflow: "hidden" },
  ratingBarFill: { height: "100%", borderRadius: 4 },
  ratingBarCount: { width: 30, fontSize: 12, textAlign: "right" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});

export default MapScreen;