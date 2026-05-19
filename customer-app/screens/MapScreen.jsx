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
  Image as RNImage,
  TextInput as SearchInput
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import {
  Clock,
  Navigation as NavigationIcon,
  Smartphone,
  Heart,
  X,
  GraduationCap,
  ChevronRight,
  Star as StarIcon,
  MapPin,
  Search,
  ArrowLeft,
  Sparkles,
  Check as CheckIcon,
  Scissors
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { barbers as dummyBarbers } from "../data/barbers.js";
import BarberCard from "../src/components/BarberCard";


const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const CARD_HEIGHT = 280;

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.uri) return image;
  if (typeof image === 'string') {
    if (image.startsWith('http') || image.startsWith('data:')) return { uri: image };
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.29.243:5000';
    return { uri: `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}` };
  }
  return image;
};

// --- OPTIMIZED SUB-COMPONENTS ---

const UserLocationMarker = memo(({ location, theme }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 2,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  if (!location) return null;

  return (
    <Marker
      coordinate={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
      zIndex={0}
      tracksViewChanges={true}
      style={{ overflow: "visible" }}
    >
      <View style={styles.userLocationMarkerContainer}>
        <Animated.View
          style={[
            styles.userLocationPulse,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 2],
                outputRange: [0.3, 0]
              })
            }
          ]}
        />
        <View style={styles.userLocationCore}>
          <View style={styles.userLocationCoreInner} />
        </View>
      </View>
    </Marker>
  );
});

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
          backgroundColor: '#3b82f6',
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
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

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;


    // Floating animation (featured only)
    useEffect(() => {
      if (barber.isPriority) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -6,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [barber.isPriority]);

    // Scale animation on select
    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.2 : 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }, [isSelected]);

    // Pulse glow when selected
    useEffect(() => {
      if (isSelected) {
        Animated.loop(
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          })
        ).start();
      } else {
        pulseAnim.setValue(0);
      }
    }, [isSelected]);

    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.6],
    });

    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0],
    });

    const shopImageSource = useMemo(
      () => getImageUrl(barber.image),
      [barber.image]
    );

    return (
      <Marker
        coordinate={{
          latitude: parseFloat(barber.location.coordinates[1]),
          longitude: parseFloat(barber.location.coordinates[0]),
        }}
        anchor={{ x: 0.5, y: 1 }}
        onPress={() => onPress(barber)}
        tracksViewChanges={true} // Forced true to fix visibility stability issues
        zIndex={isSelected ? 1000 : 1}
      >
        <Animated.View
          collapsable={false}
          style={[
            styles.markerWrapper,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          {/* 🔥 Ground Pulse Shadow */}
          {isSelected && (
            <Animated.View
              style={[
                styles.groundPulse,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            >
               <View style={styles.groundPulseInner} />
            </Animated.View>
          )}

          {/* 🏷 FEATURED BADGE (Pixel Perfect) */}
          {barber.isPriority && (
            <View style={styles.premiumBadgeContainer}>
              <View style={styles.premiumBadge}>
                <Text style={styles.badgeEmoji}>👑</Text>
                <Text style={styles.badgeText}>FEATURED</Text>
              </View>
              <View style={styles.badgePointer} />
            </View>
          )}

          {/* 🎯 MAIN PIN (Double Border & Glow) */}
          <View style={[styles.mainPinContainer, isSelected && styles.pinGlow]}>
             <View style={styles.redOuterBorder}>
                <View style={styles.whiteInnerBorder}>
                   {shopImageSource?.uri ? (
                     <RNImage
                       source={shopImageSource}
                       style={styles.pinImage}
                     />
                   ) : (
                     <View style={styles.pinFallback}>
                       <Scissors size={22} color="#ef4444" />
                     </View>
                   )}
                </View>
             </View>
             {/* Integrated Pointed Tip */}
             <View style={styles.pinTipOuter}>
                <View style={styles.pinTipInner} />
             </View>
          </View>
        </Animated.View>
      </Marker>
    );
  }
);

// Internal ExpertItem removed in favor of src/components/BarberCard.jsx


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
            width: `${Math.max(0, Math.min(1, percentage)) * 100}%`,
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
  const [selectedShopId, setSelectedShopId] = useState(null); // Stable ID for selection
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

  const handleLocateMe = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 1000);
    }
  }, [location]);

  // Handlers
  const resetToDefault = useCallback(() => {
    setSelectedShop(null);
    setSelectedShopId(null);
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
    setSelectedShopId(shop._id);
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
              isSelected={selectedShopId === barber._id}
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
          <UserLocationMarker location={location} theme={theme} />
          {routeCoords.length > 0 && (
            <>
              {/* Solid Logistics Route Line */}
              <Polyline
                coordinates={routeCoords}
                strokeWidth={5}
                strokeColor="#2563eb"
                lineCap="round"
                lineJoin="round"
              />

              {/* Destination Point Marker (House Icon style) */}
              <Marker
                coordinate={routeCoords[routeCoords.length - 1]}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.destinationMarkerOuter}>
                  <View style={styles.destinationMarkerInner}>
                    {/* Using a small View to simulate the house shape since it's a marker */}
                    <View style={styles.houseTop} />
                    <View style={styles.houseBody} />
                  </View>
                </View>
              </Marker>
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

        {location && (
          <TouchableOpacity
            style={[
              styles.locateMeBtn,
              { bottom: selectedShop ? 320 : 100 }
            ]}
            onPress={handleLocateMe}
            activeOpacity={0.8}
          >
            <NavigationIcon size={24} color="#0f172a" />
          </TouchableOpacity>
        )}

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
              roadDistance={roadDistance}
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
    <View style={styles.defaultSheetContent}>
      <View style={[styles.defaultSheetIcon, { backgroundColor: '#f8fafc' }]}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulseInner} />
          <Search size={28} color="#ef4444" />
        </View>
      </View>
      <View style={styles.defaultSheetText}>
        <Text style={styles.defaultTitleText}>Find Your Perfect Style</Text>
        <Text style={styles.defaultSubtitleText}>
          Explore elite grooming networks near you. Real-time availability at your fingertips.
        </Text>
      </View>
    </View>
  </View>
));

const ShopDetailCard = memo(({ shop, barbers, onClose, theme, navigation, roadDistance }) => {
  const shopImageSource = useMemo(() => getImageUrl(shop.image), [shop.image]);

  const handleServices = useCallback(() => {
    navigation.navigate("BarberSearch", {
      selectedShop: shop,
      fromHomeScreen: true
    });
  }, [navigation, shop]);

  return (
    <View style={styles.webStyleCard}>
      {/* Decorative Gradient Background */}
      <View style={styles.webStyleCardBackground} />

      {/* Main Content Row */}
      <View style={styles.webStyleRow}>
        {/* Left: Premium Image Frame */}
        <View style={styles.webStyleImageFrame}>
          <ExpoImage
            source={shopImageSource}
            style={styles.webStyleImage}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Right: Shop Info */}
        <View style={styles.webStyleInfo}>
          <View style={styles.webStyleBadgeRow}>
            {shop.isPriority ? (
              <View style={styles.webFeaturedBadge}>
                <StarIcon size={8} color="#fff" fill="#fff" />
                <Text style={styles.webFeaturedBadgeText}>FEATURED</Text>
              </View>
            ) : (
              <View style={styles.webPremiumBadge}>
                <Sparkles size={8} color="#f59e0b" />
                <Text style={styles.webPremiumBadgeText}>Premium</Text>
              </View>
            )}
            <View style={styles.webVerifiedBadge}>
              <CheckIcon size={8} color="#3b82f6" />
              <Text style={styles.webVerifiedBadgeText}>Verified</Text>
            </View>
          </View>

          <Text style={styles.webShopName} numberOfLines={1}>
            {shop.shopName || shop.name}
          </Text>

          <View style={styles.webAddressRow}>
            <MapPin size={12} color="#f59e0b" style={{ marginRight: 4 }} />
            <Text style={styles.webAddressText} numberOfLines={1}>
              {shop.address || "Premium Partner Site"}
            </Text>
          </View>

          <View style={styles.webActionRow}>
            {roadDistance && (
              <View style={styles.webDistancePill}>
                <NavigationIcon size={10} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={styles.webDistanceText}>{roadDistance} km</Text>
              </View>
            )}

            <View style={styles.webButtonsContainer}>
              <TouchableOpacity
                onPress={handleServices}
                style={styles.webServicesBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.webServicesBtnText}>CHECK QUEUE</Text>
                <ChevronRight size={14} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={styles.webCloseBtn}
                activeOpacity={0.7}
              >
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});
const BarberDetailCard = memo(({ barber, onClose, theme, navigation }) => {
  const displayShopName = barber.shopName || "Unknown Shop";
  const shopImageSource = useMemo(() => getImageUrl(barber.image), [barber.image]);
  const displayRating = barber.rating ? Number(barber.rating).toFixed(1) : "N/A";
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
    // Navigate to Appointmentcheckpage instead of Booking to show the live queue first
    navigation.navigate("Appointmentcheckpage", { barberData: barber });
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
                <NavigationIcon size={20} color={theme.colors.primary} />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="#fff" />
            <Text style={styles.bookButtonText}>
              {barber.isAvailable ? "CHECK LIVE QUEUE" : "PROVIDER OFFLINE"}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// --- STYLES ---
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#eef2f6" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#748895" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#eef2f6" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#adb5bd" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e1e8ed" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#748895" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e0" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#748895" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#9cd3ff" }]
  }
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
  // --- NEW WEBSITE-STYLE SHOP CARD ---
  webStyleCard: {
    margin: 12,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden',
  },
  webStyleCardBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.8,
  },
  webStyleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webStyleImageFrame: {
    width: 110,
    height: 110,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webStyleImage: {
    width: '100%',
    height: '100%',
  },
  webStyleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  webStyleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  webFeaturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
  },
  webFeaturedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  webPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  webPremiumBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#f59e0b',
  },
  webVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  webVerifiedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#3b82f6',
  },
  webShopName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  webAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  webAddressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  webActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webDistancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webDistanceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  webButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webServicesBtn: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  webServicesBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  webCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  // --- REIMAGINED DEFAULT SHEET CONTENT ---
  defaultSheetContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  defaultSheetContent: {
    alignItems: 'center',
  },
  defaultSheetIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ef4444',
    borderRadius: 100,
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  defaultSheetText: {
    alignItems: 'center',
  },
  defaultTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  defaultSubtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  // --- INSANE REDESIGNED MARKER STYLES ---
  markerWrapper: {
    width: 100,
    height: 120,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 15,
  },
  mainPinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinGlow: {
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  redOuterBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ef4444",
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  whiteInnerBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 1.5,
    overflow: "hidden",
  },
  pinImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  pinFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  pinTipOuter: {
    width: 18,
    height: 18,
    backgroundColor: "#ef4444",
    transform: [{ rotate: "45deg" }],
    marginTop: -14,
    zIndex: -1,
    borderBottomRightRadius: 3,
  },
  pinTipInner: {
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    position: "absolute",
    right: 2.5,
    bottom: 2.5,
    borderBottomRightRadius: 1.5,
  },
  premiumBadgeContainer: {
    position: "absolute",
    top: 15,
    alignItems: "center",
    zIndex: 20,
  },
  premiumBadge: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 12,
    marginRight: 4,
    color: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  badgePointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#ef4444",
    marginTop: -1,
  },
  groundPulse: {
    position: "absolute",
    bottom: 8,
    width: 44,
    height: 22,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: -2,
  },
  groundPulseInner: {
    width: 22,
    height: 11,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },

  // --- USER LOCATION PULSE ---
  userLocationMarkerContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
  },
  userLocationCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
  },
  userLocationCoreInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  destinationMarkerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#000",
  },
  destinationMarkerInner: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  houseTop: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f59e0b",
  },
  houseBody: {
    width: 10,
    height: 8,
    backgroundColor: "#f59e0b",
    marginTop: -1,
  },
  // --- LOCATE ME BUTTON ---
  locateMeBtn: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
