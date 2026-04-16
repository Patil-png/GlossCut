import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  PanResponder,
  ActivityIndicator,
  TextInput as SearchInput
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
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
  Search,
  ArrowLeft
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { barbers as dummyBarbers } from "../data/barbers.js";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENTS ---

const AnimatedLoadingBar = ({ theme }) => {
  const anim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 400,
        duration: 1500,
        useNativeDriver: true
      })
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.routeLoadingBar,
        {
          backgroundColor: theme.colors.primary,
          transform: [{
            translateX: anim.interpolate({
              inputRange: [-100, 400],
              outputRange: [-Dimensions.get('window').width * 0.4, Dimensions.get('window').width]
            })
          }]
        },
      ]}
    />
  );
};

const ShopMarker = memo(
  ({ barber, onPress, isSelected }) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const timer = setTimeout(() => {
        setTracksViewChanges(false);
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.2 : 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }).start();
    }, [isSelected]);

    const shopImageSource = useMemo(() => {
      if (barber.image) {
        return {
          uri: barber.image.startsWith("http")
            ? barber.image
            : `${process.env.EXPO_PUBLIC_API_URL}${barber.image}`
        };
      }
      return require("../assets/GlossCut.png");
    }, [barber.image]);

    return (
      <Marker
        coordinate={{
          latitude: parseFloat(barber.location.coordinates[1]),
          longitude: parseFloat(barber.location.coordinates[0])
        }}
        anchor={{ x: 0.5, y: 1 }}
        title={barber.shopName || "Shop"}
        onPress={() => onPress(barber)}
        tracksViewChanges={tracksViewChanges}
        zIndex={isSelected ? 1000 : 1}
      >
        <Animated.View style={[styles.markerWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[
            styles.markerContainer,
            isSelected && { borderColor: "#ef4444", borderWidth: 3 },
            { backgroundColor: "#fff", overflow: "hidden" }
          ]}>
            <Image
              source={shopImageSource}
              style={styles.markerImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onLoad={() => setTracksViewChanges(true)} // Allow one more draw after load
            />
          </View>
          <View style={[styles.markerBottomArrow, isSelected && { borderTopColor: "#ef4444" }]} />

          {barber.isPriority ? (
            <View style={[styles.markerLabel, { backgroundColor: "#ef4444" }]}>
              <Text style={[styles.markerLabelText, { color: "#fff" }]}>FEATURED</Text>
            </View>
          ) : (
            barber.rating > 0 && (
              <View style={styles.markerLabel}>
                <StarIcon size={8} color="#FFD700" fill="#FFD700" />
                <Text style={styles.markerLabelText}>{barber.rating.toFixed(1)}</Text>
              </View>
            )
          )}
        </Animated.View>
      </Marker>
    );
  },
  (prev, next) => prev.barber.uniqueId === next.barber.uniqueId && prev.isSelected === next.isSelected
);

const ExpertItem = memo(
  ({ expert, theme, onPress, shopCategory, shopAvgTime }) => {
    return (
      <TouchableOpacity
        style={[
          styles.barberListItem,
          { backgroundColor: theme.colors.background },
        ]}
        onPress={() =>
          onPress({
            _id: expert._id,
            name: expert.name,
            profilePicture: expert.profilePicture,
            rating: expert.rating || 0,
            reviews: expert.reviews || 0,
            isAvailable: expert.isAvailable,
            avgAppointmentTime: shopAvgTime || "30 min",
            specialties: [shopCategory || "General"]
          })
        }
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/GlossCut.png")}
          style={styles.barberListAvatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.barberListInfo}>
          <View style={styles.barberListHeader}>
            <Text
              style={[styles.barberListName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {expert.name || "Unknown Expert"}
            </Text>
            {expert.isAvailable ? (
              <View
                style={[
                  styles.barberStatusBadge,
                  { backgroundColor: theme.colors.success + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.barberStatusText,
                    { color: theme.colors.success },
                  ]}
                >
                  Available
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.barberStatusBadge,
                  { backgroundColor: theme.colors.error + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.barberStatusText,
                    { color: theme.colors.error },
                  ]}
                >
                  Offline
                </Text>
              </View>
            )}
          </View>
          <View style={styles.barberListDetails}>
            <StarIcon size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.barberListStatText}>
              {typeof expert.rating === "number" && expert.rating >= 0
                ? expert.rating.toFixed(1)
                : "New"}
            </Text>
            <Text
              style={[
                styles.barberListStatText,
                {
                  marginLeft: 4,
                  fontWeight: "400",
                  color: theme.colors.textSecondary
                },
              ]}
            >
              ({expert.reviews || 0} reviews)
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  }
);

const OperatingHourItem = memo(({ day, hours, theme }) => (
  <View style={styles.operatingHourRow}>
    <Text style={[styles.dayText, { color: theme.colors.textSecondary }]}>
      {day.charAt(0).toUpperCase() + day.slice(1)}
    </Text>
    <View style={[styles.timePill, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.hoursText, { color: theme.colors.text }]}>
        {hours.open && hours.close
          ? `${hours.open} - ${hours.close}`
          : "Closed"}
      </Text>
    </View>
  </View>
));

const ServiceItem = memo(({ service, theme }) => (
  <View
    style={[styles.serviceCard, { backgroundColor: theme.colors.background }]}
  >
    <View style={{ flex: 1 }}>
      <Text style={[styles.serviceTextItem, { color: theme.colors.text }]}>
        {service.name}
      </Text>
      <Text
        style={[styles.serviceSubText, { color: theme.colors.textSecondary }]}
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
      <Text style={[styles.pricePillText, { color: theme.colors.primary }]}>
        ₹{service.price}
      </Text>
    </View>
  </View>
));

const RatingBar = memo(({ rating, count, percentage, theme }) => (
  <View style={styles.ratingBarRow}>
    <Text
      style={[styles.ratingBarLabel, { color: theme.colors.textSecondary }]}
    >
      {rating}
    </Text>
    <View style={styles.ratingBarContainer}>
      <View
        style={[
          styles.ratingBarFill,
          {
            width: `${percentage * 100}%`,
            backgroundColor: theme.colors.primary
          },
        ]}
      />
    </View>
  </View>
));

// --- MAIN SCREEN ---

const MapScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.9136,
    longitude: 77.768,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02
  });
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopBarbers, setShopBarbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [roadDistance, setRoadDistance] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  const bottomSheetHeight = useRef(
    new Animated.Value(screenHeight * 0.25)
  ).current;

  // Handlers
  const resetToDefault = useCallback(() => {
    setSelectedShop(null);
    setSelectedBarber(null);
    Animated.spring(bottomSheetHeight, {
      toValue: screenHeight * 0.25,
      tension: 30,
      friction: 7,
      useNativeDriver: false
    }).start();
  }, []);

  const handleMarkerPress = useCallback((shop) => {
    setSelectedShop(shop);
    setShopBarbers(shop.barbers || []);
    Animated.spring(bottomSheetHeight, {
      toValue: screenHeight * 0.75,
      tension: 30,
      friction: 7,
      useNativeDriver: false
    }).start();
  }, []);

  const closeBarberDetails = useCallback(() => {
    setSelectedBarber(null);
    Animated.spring(bottomSheetHeight, {
      toValue: screenHeight * 0.75,
      tension: 30,
      friction: 7,
      useNativeDriver: false
    }).start();
  }, []);

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Home");
  };

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
          if (currentHeight > halfOpenHeight) targetHeight = halfOpenHeight;
          else targetHeight = collapsedHeight;
        } else if (velocity < -SWIPE_THRESHOLD) {
          if (currentHeight < halfOpenHeight) targetHeight = halfOpenHeight;
          else targetHeight = fullOpenHeight;
        } else {
          if (currentHeight < (collapsedHeight + halfOpenHeight) / 2)
            targetHeight = collapsedHeight;
          else if (currentHeight < (halfOpenHeight + fullOpenHeight) / 2)
            targetHeight = halfOpenHeight;
          else targetHeight = fullOpenHeight;
        }
        targetHeight = Math.max(
          collapsedHeight,
          Math.min(fullOpenHeight, targetHeight)
        );
        Animated.spring(bottomSheetHeight, {
          toValue: targetHeight,
          tension: 40,
          friction: 8,
          useNativeDriver: false
        }).start();
      }
    })
  ).current;

  // Location & Data Fetching
  useEffect(() => {
    (async () => {
      const cachedLocationData = await AsyncStorage.getItem("cachedLocation");
      const now = Date.now();
      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
      let locationToUse = null;

      if (cachedLocationData) {
        const { location: cachedLocation, timestamp } =
          JSON.parse(cachedLocationData);
        if (now - timestamp < TWO_DAYS_MS) locationToUse = cachedLocation;
      }

      if (!locationToUse) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        await AsyncStorage.setItem(
          "cachedLocation",
          JSON.stringify({ location, timestamp: now })
        );
        locationToUse = location;
      }

      setLocation(locationToUse);
      setMapRegion({
        latitude: locationToUse.coords.latitude,
        longitude: locationToUse.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      });
      fetchBarbers();
    })();
  }, []);

  // --- ROAD ROUTING (OSRM) ---
  useEffect(() => {
    if (!location || !selectedShop) {
      setRouteCoords([]);
      setRoadDistance(null);
      return;
    }

    const fetchRoute = async () => {
      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;
      const shopCoords = selectedShop.location?.coordinates;

      if (!shopCoords || shopCoords.length !== 2) return;
      const [shopLng, shopLat] = shopCoords;

      if (shopLat === 0 && shopLng === 0) {
        setRouteCoords([]);
        return;
      }

      setIsLoadingRoute(true);
      try {
        const url = `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${shopLng},${shopLat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === "Ok" && data.routes?.[0]) {
          const route = data.routes[0];
          if (route.geometry?.coordinates) {
            const coords = route.geometry.coordinates.map((point) => ({
              latitude: point[1],
              longitude: point[0]
            }));
            setRouteCoords(coords);
            setRoadDistance((route.distance / 1000).toFixed(1));

            // Fit map to route
            if (mapRef.current && coords.length > 0) {
              mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true
              });
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ OSRM Route Fetch Failed:", err.message);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [selectedShop, location]);

  // Search Logic
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = barbers.filter(
        (shop) =>
          shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, barbers]);

  const handleSearchResultPress = useCallback((shop) => {
    setSearchTerm("");
    setIsSearchFocused(false);
    handleMarkerPress(shop);

    if (mapRef.current && shop.location?.coordinates) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(shop.location.coordinates[1]),
        longitude: parseFloat(shop.location.coordinates[0]),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1000);
    }
  }, [handleMarkerPress]);

  const fetchBarbers = async () => {
    try {
      const cachedShopData = await AsyncStorage.getItem("cachedShopData");
      const now = Date.now();
      const TEN_MIN_MS = 10 * 60 * 1000; // Increased to 10 minutes as requested
      let shopDataToUse = null;

      if (cachedShopData) {
        const { shops: cachedShops, timestamp } = JSON.parse(cachedShopData);
        if (now - timestamp < TEN_MIN_MS) shopDataToUse = cachedShops;
      }

      if (!shopDataToUse) {
        const shopRes = await api.get(
          `/api/shop/all`,
          { timeout: 10000 }
        );
        const barberRes = await api.get(
          `/api/barber-card/all`,
          { timeout: 10000 }
        );

        if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
          // --- ALGORITHMIC OPTIMIZATION START ---
          // Pre-group barbers by shopID to avoid O(N*M) nested loop
          const barbersByShop = {};
          barberRes.data.forEach((barber) => {
            if (!barbersByShop[barber.shopId]) {
              barbersByShop[barber.shopId] = [];
            }
            barbersByShop[barber.shopId].push(barber);
          });
          // --- ALGORITHMIC OPTIMIZATION END ---

          const formattedData = [];
          for (const shop of shopRes.data) {
            // Instant lookup instead of .filter()
            const shopBarbers = barbersByShop[shop._id] || [];

            const shopData = {
              _id: shop._id,
              location: shop.location,
              shopName: shop.owner?.name || shop.name || "Unknown Shop",
              address: shop.address || "Address not set",
              phone: shop.phone,
              owner: shop.owner ? { ...shop.owner } : null,
              staff: (shop.staff || []).map((s) => ({ ...s })),
              image: shop.image || shop.owner?.profilePicture,
              rating: shop.rating || 0,
              reviews: shop.totalReviews || 0,
              category: shop.category || "General",
              isAvailable: !!shop.isAvailable,
              totalBarbers: (shop.owner ? 1 : 0) + (shop.staff?.length || 0),
              services: shop.services || [],
              avgAppointmentTime: shop.avgAppointmentTime || "30 min",
              operatingHours: shop.operatingHours,
              shopKey: `${shop.name || "Unknown Shop"}|||${shop.address || "Address not set"
                }`
            };

            let ownerBarberCard = null;
            if (shopData.owner) {
              // Keep .find here as shopBarbers array is small (usually < 10)
              ownerBarberCard = shopBarbers.find(
                (b) =>
                  (b.barberId === shopData.owner._id ||
                    b._id === shopData.owner._id) &&
                  b.approvalStatus === "approved"
              );
              if (ownerBarberCard) {
                shopData.owner.rating =
                  typeof ownerBarberCard.rating === "number"
                    ? ownerBarberCard.rating
                    : shopData.owner.rating || 0;
                shopData.owner.reviews =
                  typeof ownerBarberCard.reviews === "number"
                    ? ownerBarberCard.reviews
                    : shopData.owner.reviews || 0;
              }
            }
            const staffBarberCards = {};
            shopData.staff.forEach((staffMember) => {
              const staffBarberCard = shopBarbers.find(
                (b) =>
                  (b.barberId === staffMember._id ||
                    b._id === staffMember._id) &&
                  b.approvalStatus === "approved"
              );
              if (staffBarberCard) {
                staffBarberCards[staffMember._id] = staffBarberCard;
                staffMember.rating =
                  typeof staffBarberCard.rating === "number"
                    ? staffBarberCard.rating
                    : staffMember.rating || 0;
                staffMember.reviews =
                  typeof staffBarberCard.reviews === "number"
                    ? staffBarberCard.reviews
                    : staffMember.reviews || 0;
              }
            });

            // Assign pre-calculated card data to shop object
            shopData.ownerBarberCard = ownerBarberCard;
            shopData.staffBarberCards = staffBarberCards;

            // IMPORTANT: Attach the raw barber list so we don't have to fetch again
            shopData.barbers = shopBarbers;

            formattedData.push(shopData);
          }

          const groupedByLocation = {};
          formattedData.forEach((shop) => {
            const locationKey = shop.shopKey;
            if (!groupedByLocation[locationKey]) {
              groupedByLocation[locationKey] = shop;
            } else {
              if (
                (shop.staff?.length || 0) >
                (groupedByLocation[locationKey].staff?.length || 0)
              ) {
                groupedByLocation[locationKey] = shop;
              }
            }
          });

          const finalShopsArray = Object.values(groupedByLocation).map(
            (shop, index) => ({
              ...shop,
              uniqueId: `${shop.shopKey}_${index}`
            })
          );

          await AsyncStorage.setItem(
            "cachedShopData",
            JSON.stringify({ shops: finalShopsArray, timestamp: now })
          );
          shopDataToUse = finalShopsArray;
        }
      }
      setBarbers(shopDataToUse);
    } catch (error) {
      console.error("Error fetching shop data", error);
      setBarbers(dummyBarbers);
    }
  };

  const markers = useMemo(() => {
    return barbers.map((barber) => {
      if (barber.location?.coordinates?.length === 2) {
        const latitude = parseFloat(barber.location.coordinates[1]);
        const longitude = parseFloat(barber.location.coordinates[0]);
        // Filter out [0, 0] as it represents an expired/reset location
        if (!isNaN(latitude) && !isNaN(longitude) && (latitude !== 0 || longitude !== 0)) {
          return (
            <ShopMarker
              key={barber.uniqueId}
              barber={barber}
              onPress={handleMarkerPress}
              isSelected={selectedShop?._id === barber._id}
            />
          );
        }
      }
      return null;
    });
  }, [barbers, handleMarkerPress, selectedShop]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.mapContainer]}>
        {isLoadingRoute && (
          <View style={styles.routeLoadingContainer}>
            <AnimatedLoadingBar theme={theme} />
          </View>
        )}
        <MapView
          ref={mapRef}
          customMapStyle={mapStyle}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          pitchEnabled={true}
          rotateEnabled={true}
          showsBuildings={true}
          onPress={(e) => {
            if (
              e.nativeEvent.action !== "marker-press" &&
              (selectedShop || selectedBarber)
            ) {
              resetToDefault();
            }
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }}
              title="Your Location"
            >
              <View style={styles.userLocationMarkerOuter}>
                <View style={styles.userLocationMarkerInner} />
              </View>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <>
              {/* Background Glow */}
              <Polyline
                coordinates={routeCoords}
                strokeWidth={8}
                strokeColor={theme.colors.primary + "33"}
                lineCap="round"
                lineJoin="round"
              />
              {/* Main Road Line */}
              <Polyline
                coordinates={routeCoords}
                strokeWidth={4}
                strokeColor={theme.colors.primary}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}
          {markers}
        </MapView>

        <TouchableOpacity
          style={[
            styles.floatingBackBtn,
            {
              top: insets.top + 10,
              backgroundColor: isDark ? theme.colors.card : "#fff",
              shadowColor: isDark ? "#000" : "#000"
            },
          ]}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color={isDark ? theme.colors.text : "#000"} />
        </TouchableOpacity>

        {/* Floating Search Bar Overlay */}
        <View style={[styles.searchOverlay, { top: insets.top + 10 }]}>
          <View style={[
            styles.searchBarContainer,
            { backgroundColor: theme.colors.card },
            isSearchFocused && styles.searchBarFocused
          ]}>
            <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <SearchInput
              placeholder="Search shops or areas..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.text }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {isSearchFocused && searchResults.length > 0 && (
            <View style={[styles.searchResultsContainer, { backgroundColor: theme.colors.card }]}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultPress(item)}
                >
                  <View style={styles.searchResultImageWrapper}>
                    <Image
                      source={item.image ? { uri: item.image.startsWith("http") ? item.image : `${process.env.EXPO_PUBLIC_API_URL}${item.image}` } : require("../assets/GlossCut.png")}
                      style={styles.searchResultImage}
                    />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: theme.colors.text }]}>{item.shopName}</Text>
                    <Text style={[styles.searchResultAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.bottomSheet,
            { height: bottomSheetHeight, backgroundColor: theme.colors.card },
          ]}
        >
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>
          {selectedShop ? (
            <ShopDetailCard
              shop={selectedShop}
              barbers={shopBarbers}
              onClose={resetToDefault}
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
          ) : (
            <DefaultSheetContent theme={theme} />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const DefaultSheetContent = memo(({ theme }) => (
  <View style={styles.defaultSheetContainer}>
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: theme.colors.primary + "10" },
      ]}
    >
      <Search size={36} color={theme.colors.primary} />
    </View>
    <Text style={[styles.defaultTitle, { color: theme.colors.text }]}>
      Explore Nearby
    </Text>
    <Text
      style={[styles.defaultSubtitle, { color: theme.colors.textSecondary }]}
    >
      Select any shop marker on the map to view experts, ratings, and book your
      next style.
    </Text>
  </View>
));

const ShopDetailCard = memo(({ shop, barbers, onClose, theme, navigation }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize static display data
  const displayShopName = useMemo(
    () => shop.shopName || "Unknown Shop",
    [shop]
  );
  const displayAddress = useMemo(
    () => shop.address || "Address not set",
    [shop]
  );
  const displayPhone = useMemo(() => shop.phone || "Phone not set", [shop]);
  const shopImageSource = useMemo(
    () =>
      shop.image
        ? {
          uri: shop.image.startsWith("http")
            ? shop.image
            : `${process.env.EXPO_PUBLIC_API_URL}${shop.image}`
        }
        : require("../assets/GlossCut.png"),
    [shop]
  );

  const displayRating = reviewsData
    ? reviewsData.averageRating.toFixed(1)
    : shop.rating
      ? shop.rating.toFixed(1)
      : "N/A";
  const displayReviewCount = reviewsData
    ? reviewsData.totalReviews
    : shop.reviews || 0;

  useEffect(() => {
    const fetchFreshShopData = async () => {
      if (!shop) return;
      try {
        const barberIds = [
          shop.owner?._id,
          ...(shop.staff || []).map((s) => s._id),
        ].filter(Boolean);
        if (barberIds.length === 0) {
          setReviewsData({
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: {}
          });
          setIsLoading(false);
          return;
        }
        const reviewPromises = barberIds.map((id) =>
          api.get(
            `/api/review/barber/${id}`,
            { timeout: 10000 }
          )
        );
        const reviewResponses = await Promise.all(reviewPromises);
        const allReviews = reviewResponses.flatMap((res) => res.data);

        if (allReviews.length > 0) {
          const total = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
          const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          allReviews.forEach(
            (r) => (breakdown[r.rating] = (breakdown[r.rating] || 0) + 1)
          );
          setReviewsData({
            averageRating: total / allReviews.length,
            totalReviews: allReviews.length,
            ratingBreakdown: breakdown
          });
        } else {
          setReviewsData({
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: {}
          });
        }
        setIsLoading(false);
      } catch (error) {
        setReviewsData({
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: {}
        });
        setIsLoading(false);
      }
    };
    fetchFreshShopData();
  }, [shop._id]);

  const handleBarberSelect = useCallback(
    (barberData) => {
      if (!barberData?.isAvailable) {
        Alert.alert(
          "Barber Offline",
          `${barberData.name} is currently offline.`
        );
        return;
      }
      navigation.navigate("BarberSearch", {
        selectedShop: shop,
        selectedBarberId: barberData._id,
        fromHomeScreen: true
      });
    },
    [navigation, shop]
  );

  const handleCall = useCallback((phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("Phone not available");
  }, []);

  const handleDirections = useCallback((lat, lng) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`
    });
    if (url) Linking.openURL(url);
  }, []);

  const allExperts = useMemo(() => {
    const experts = [];
    if (shop.owner) experts.push(shop.owner);
    if (shop.staff) experts.push(...shop.staff);
    return experts;
  }, [shop]);

  const shopHeader = useMemo(
    () => (
      <>
        <View style={styles.shopImageContainer}>
          <Image
            source={shopImageSource}
            style={styles.shopImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.imageGradient}
          />
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.imageCloseBtn,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.3)"
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#fff" />
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
                  marginTop: 6
                }}
              >
                <View style={styles.ratingBadge}>
                  <StarIcon size={12} color="#FFD700" fill="#FFD700" />
                  <Text
                    style={[styles.smallText, { color: "#000", marginLeft: 4 }]}
                  >
                    {displayRating}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.smallText,
                    { color: "rgba(255,255,255,0.9)", marginLeft: 8 },
                  ]}
                >
                  ({displayReviewCount} reviews)
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              {roadDistance && (
                <View style={styles.distanceBadge}>
                  <Navigation size={12} color={theme.colors.primary} />
                  <Text style={[styles.distanceText, { color: theme.colors.primary }]}>
                    {roadDistance} km
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => handleCall(displayPhone)}
                  style={[
                    styles.shopActionBtn,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <Smartphone size={20} color="#fff" />
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
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Navigation size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <MapPin size={20} color={theme.colors.primary} />
            </View>
            <Text
              style={[styles.barberAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {displayAddress}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <Clock
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, marginBottom: 0 },
              ]}
            >
              Operating Hours
            </Text>
          </View>
          <View
            style={[
              styles.hoursContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {shop.operatingHours ? (
              Object.entries(shop.operatingHours).map(([day, hours]) => (
                <OperatingHourItem
                  key={day}
                  day={day}
                  hours={hours}
                  theme={theme}
                />
              ))
            ) : (
              <OperatingHourItem
                day="Daily"
                hours={{ open: "9:00 AM", close: "9:00 PM" }}
                theme={theme}
              />
            )}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
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
                onPress={() =>
                  navigation.navigate("CustomerReviewsScreen", {
                    shopId: shop._id,
                    shopName: displayShopName
                  })
                }
              >
                <Text
                  style={[styles.viewAllText, { color: theme.colors.primary }]}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ratingOverview}>
              <View style={styles.ratingLeft}>
                <Text
                  style={[styles.overallRating, { color: theme.colors.text }]}
                >
                  {displayRating}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={14}
                      color={
                        star <= Math.floor(displayRating)
                          ? "#FFD700"
                          : "#E0E0E0"
                      }
                      fill={
                        star <= Math.floor(displayRating)
                          ? "#FFD700"
                          : "#E0E0E0"
                      }
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.reviewCount,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {displayReviewCount} reviews
                </Text>
              </View>
              <View style={styles.ratingBreakdown}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData?.ratingBreakdown?.[rating] || 0;
                  const percentage =
                    displayReviewCount > 0 ? count / displayReviewCount : 0;
                  return (
                    <RatingBar
                      key={rating}
                      rating={rating}
                      count={count}
                      percentage={percentage}
                      theme={theme}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              marginBottom: 16,
              paddingHorizontal: 20
            },
          ]}
        >
          Experts ({allExperts.length})
        </Text>
      </>
    ),
    [
      shop,
      displayRating,
      displayReviewCount,
      reviewsData,
      theme,
      handleCall,
      handleDirections,
      onClose,
      displayShopName,
      displayAddress,
      displayPhone,
      allExperts.length,
      roadDistance,
    ]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.shopDetailWrapper,
          {
            backgroundColor: theme.colors.card,
            justifyContent: "center",
            alignItems: "center"
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.shopDetailWrapper, { backgroundColor: theme.colors.card }]}
    >
      <FlashList
        data={allExperts}
        estimatedItemSize={80}
        ListHeaderComponent={shopHeader}
        ListEmptyComponent={
          <View style={styles.emptyBarbers}>
            <Text
              style={[
                styles.emptyBarbersText,
                { color: theme.colors.textSecondary },
              ]}
            >
              No team members available.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <ExpertItem
              expert={item}
              theme={theme}
              onPress={handleBarberSelect}
              shopCategory={shop.category}
              shopAvgTime={shop.avgAppointmentTime}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // OPTIMIZATION: Helps Android list performance
      />
    </View>
  );
});

const BarberDetailCard = memo(({ barber, onClose, theme, navigation }) => {
  const displayShopName = barber.shopName || "Unknown Shop";
  const shopImageSource = useMemo(
    () =>
      barber.image
        ? {
          uri: barber.image.startsWith("http")
            ? barber.image
            : `${process.env.EXPO_PUBLIC_API_URL}${barber.image}`
        }
        : require("../assets/GlossCut.png"),
    [barber]
  );
  const displayRating = barber.rating ? barber.rating.toFixed(1) : "N/A";
  const serviceProviderType = barber.category || "General";

  const { likedProviders, likeProvider, unlikeProvider } = useAuth();
  const [liked, setLiked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bookScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  useEffect(() => {
    if (barber)
      setLiked(likedProviders.some((like) => like.providerId === barber._id));
  }, [barber, likedProviders]);

  const toggleLike = useCallback(() => {
    const isCurrentlyLiked = likedProviders.some(
      (like) => like.providerId === barber._id
    );
    if (isCurrentlyLiked) {
      unlikeProvider(barber._id, "barber");
      Alert.alert("Removed", "Removed from favorites");
    } else {
      likeProvider(barber._id, "barber");
      Alert.alert("Success", "Added to favorites!");
    }
    setLiked(!isCurrentlyLiked);
  }, [likedProviders, barber]);

  const handleBookNowPress = useCallback(() => {
    if (!barber?.isAvailable) {
      Alert.alert("Offline", "Provider is currently offline.");
      return;
    }
    navigation.navigate("Booking", { barberId: barber._id });
  }, [barber, navigation]);

  const handleCall = useCallback(() => {
    if (barber.phone) Linking.openURL(`tel:${barber.phone}`);
    else Alert.alert("Phone not available");
  }, [barber]);

  const handleDirections = useCallback(() => {
    if (barber.location?.coordinates) {
      const url = Platform.select({
        ios: `maps:0,0?q=${barber.location.coordinates[1]},${barber.location.coordinates[0]}`,
        android: `geo:0,0?q=${barber.location.coordinates[1]},${barber.location.coordinates[0]}`
      });
      if (url) Linking.openURL(url);
    }
  }, [barber]);

  const onBookPressIn = useCallback(
    () =>
      Animated.spring(bookScale, {
        toValue: 0.97,
        useNativeDriver: true
      }).start(),
    []
  );
  const onBookPressOut = useCallback(
    () =>
      Animated.spring(bookScale, { toValue: 1, useNativeDriver: true }).start(),
    []
  );

  const barberHeader = useMemo(
    () => (
      <>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Shop Image", `Displaying image for ${displayShopName}`)
          }
          style={styles.barberImageContainer}
          activeOpacity={0.9}
        >
          <Image
            source={shopImageSource}
            style={styles.barberShopImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.imageGradient}
          />
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.imageCloseBtn,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.3)"
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: barber.isAvailable
                  ? theme.colors.success + "20"
                  : theme.colors.error + "20"
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: barber.isAvailable
                    ? theme.colors.success
                    : theme.colors.error
                },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                {
                  color: barber.isAvailable
                    ? theme.colors.success
                    : theme.colors.error
                },
              ]}
            >
              {barber.isAvailable ? "Available" : "Offline"}
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
                  marginTop: 6
                }}
              >
                <View style={styles.ratingBadge}>
                  <StarIcon size={12} color="#FFD700" fill="#FFD700" />
                  <Text
                    style={[styles.smallText, { color: "#000", marginLeft: 4 }]}
                  >
                    {displayRating}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={toggleLike}
              activeOpacity={0.8}
            >
              <Heart
                size={24}
                color={liked ? "#FF4081" : "#fff"}
                fill={liked ? "#FF4081" : "rgba(0,0,0,0.1)"}
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
                    outputRange: [8, 0]
                  })
                },
              ],
              backgroundColor: theme.colors.card,
              borderColor: "transparent"
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
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <TouchableOpacity
                onPress={handleCall}
                style={[
                  styles.smallIconBtn,
                  { backgroundColor: theme.colors.primary + "10" },
                ]}
              >
                <Smartphone size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDirections}
                style={[
                  styles.smallIconBtn,
                  { backgroundColor: theme.colors.primary + "10" },
                ]}
              >
                <Navigation size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <MapPin size={20} color={theme.colors.primary} />
            </View>
            <Text
              style={[styles.barberAddress, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {barber.address || "No address"}
            </Text>
          </View>
        </Animated.View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.detailRow, { marginBottom: 16 }]}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.textSecondary + "15" },
              ]}
            >
              <Smartphone size={20} color={theme.colors.textSecondary} />
            </View>
            <Text
              style={[styles.barberDetailText, { color: theme.colors.text }]}
            >
              {barber.phone || "No Phone"}
            </Text>
          </View>
          <View style={styles.rowWrap}>
            <View style={styles.detailRowSmall}>
              <GraduationCap size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>
                {barber.tag || "No tag"}
              </Text>
            </View>
            <View style={styles.detailRowSmall}>
              <Clock size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.smallText, { color: theme.colors.text }]}>
                ~{barber.avgAppointmentTime || "30m"}
              </Text>
            </View>
          </View>
        </View>

        {barber.description && (
          <View
            style={[styles.infoCard, { backgroundColor: theme.colors.card }]}
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
        )}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              marginBottom: 16,
              paddingHorizontal: 0
            },
          ]}
        >
          Services
        </Text>
      </>
    ),
    [
      barber,
      displayShopName,
      shopImageSource,
      displayRating,
      liked,
      fadeAnim,
      theme,
      handleCall,
      handleDirections,
      onClose,
      toggleLike,
    ]
  );

  return (
    <View
      style={[
        styles.barberDetailWrapper,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <FlashList
        data={barber.services || []}
        estimatedItemSize={60}
        ListHeaderComponent={barberHeader}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <ServiceItem service={item} theme={theme} />
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      />

      <Animated.View style={{ transform: [{ scale: bookScale }], bottom: Math.max(insets.bottom, 20), position: 'absolute', left: 0, right: 0 }}>
        <TouchableOpacity
          style={[
            styles.bookButtonFixed,
            {
              backgroundColor: barber.isAvailable
                ? theme.colors.primary
                : theme.colors.border,
              opacity: barber.isAvailable ? 1 : 0.8
            },
          ]}
          onPressIn={barber.isAvailable ? onBookPressIn : undefined}
          onPressOut={barber.isAvailable ? onBookPressOut : undefined}
          onPress={handleBookNowPress}
          activeOpacity={barber.isAvailable ? 0.9 : 1}
          disabled={!barber.isAvailable}
        >
          <Text style={styles.bookButtonText}>
            {barber.isAvailable ? "Book Appointment" : "Provider Offline"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// --- STYLES ---
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }]
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },
  floatingBackBtn: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32
  },
  sheetHandleArea: { width: "100%", alignItems: "center", paddingVertical: 16 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, opacity: 0.2 },
  sheetScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 64, // Explicitly match container
    height: 74, // container(64) + arrow(10)
  },
  markerContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff"
  },
  markerImage: {
    width: 58, // 64 - border(2*2) - small margin
    height: 58,
    borderRadius: 29,
    backgroundColor: "#f0f0f0"
  },
  markerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    marginTop: 4
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: "900"
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -4
  },
  userLocationMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(66, 133, 244, 0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  userLocationMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4285F4",
    borderWidth: 2,
    borderColor: "#fff"
  },
  defaultSheetContainer: {
    paddingHorizontal: 40,
    alignItems: "center",
    paddingTop: 20
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  defaultTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5
  },
  defaultSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    opacity: 0.8
  },
  shopDetailWrapper: { flex: 1 },
  shopDetailScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  shopImageContainer: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24
  },
  shopImage: { width: "100%", height: "100%" },
  shopImageBottomInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  shopImageTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  shopActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  imageCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    zIndex: 10
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16
  },
  detailRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  barberAddress: {
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: -0.2
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 16
  },
  hoursContainer: { borderRadius: 16, padding: 12 },
  operatingHourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8
  },
  dayText: { fontSize: 15, fontWeight: "600", flex: 1 },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center"
  },
  hoursText: { fontSize: 13, fontWeight: "700" },
  reviewSummary: { marginBottom: 4 },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  viewAllText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  ratingOverview: { flexDirection: "row", alignItems: "center" },
  ratingLeft: {
    alignItems: "center",
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.06)"
  },
  overallRating: {
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 4,
    letterSpacing: -1
  },
  starRow: { flexDirection: "row", marginBottom: 6, gap: 2 },
  reviewCount: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    fontWeight: "500"
  },
  ratingBreakdown: { flex: 1, marginLeft: 20 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  ratingBarLabel: {
    width: 14,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.6
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden"
  },
  ratingBarFill: { height: "100%", borderRadius: 3 },
  barberListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  barberListAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: "#f0f0f0"
  },
  barberListInfo: { flex: 1 },
  barberListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  barberListName: { fontSize: 17, fontWeight: "700", letterSpacing: -0.4 },
  barberStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  barberStatusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  barberListDetails: { flexDirection: "row", alignItems: "center" },
  barberListStatText: { fontSize: 13, fontWeight: "700", marginLeft: 4 },
  emptyBarbers: { alignItems: "center", padding: 24, opacity: 0.6 },
  emptyBarbersText: { fontSize: 16, fontWeight: "500", textAlign: "center" },
  barberDetailWrapper: { flex: 1 },
  barberDetailScrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  barberImageContainer: {
    height: 260,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 24
  },
  barberShopImage: { width: "100%", height: "100%" },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160
  },
  statusPill: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center"
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  imageBottomInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  imageBottomTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  smallText: { fontSize: 14, fontWeight: "600", letterSpacing: -0.1 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tagBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tagBadgeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  availabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  availabilityText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  smallIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  barberDetailText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: "600",
    letterSpacing: -0.2
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 20, marginTop: 4 },
  detailRowSmall: { flexDirection: "row", alignItems: "center", gap: 8 },
  descriptionText: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: "400",
    opacity: 0.9
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12
  },
  serviceTextItem: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3
  },
  serviceSubText: { fontSize: 13, fontWeight: "600", opacity: 0.6 },
  pricePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70
  },
  pricePillText: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  bookButtonFixed: {
    position: "absolute",
    left: 20,
    right: 20,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40
  },
  loadingText: { marginTop: 16, fontSize: 15, fontWeight: "600", opacity: 0.7 },
  searchOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 1000
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  searchBarFocused: {
    borderColor: "#ef4444"
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    height: "100%"
  },
  searchResultsContainer: {
    marginTop: 10,
    borderRadius: 24,
    padding: 8,
    maxHeight: 300
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16
  },
  searchResultImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#f0f0f0"
  },
  searchResultImage: {
    width: "100%",
    height: "100%"
  },
  searchResultInfo: {
    flex: 1
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2
  },
  searchResultAddress: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7
  },
  markerImageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    overflow: "hidden"
  },
  markerBottomArrow: {
    position: "absolute",
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff"
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "800"
  },
  routeLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 2000,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden"
  },
  routeLoadingBar: {
    height: "100%",
    width: "40%",
    position: "absolute"
  }
});

export default MapScreen;
