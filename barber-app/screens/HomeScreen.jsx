import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  StatusBar,
  PanResponder,
  FlatList,
  Switch,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  User,
  Car,
  Navigation,
  Bike,
  Users,
  Zap,
  Calendar,
  Sun,
  Moon,
  Bell,
  Smartphone,
  Scissors,
  Heart,
  Dog,
  History,
  CalendarPlus,
  Coins,
  DollarSign,
  ClipboardList,
  ChevronDown,
  CheckCircle,
  XCircle,
  IndianRupee
} from 'lucide-react-native';
import { MapPin, Star, GraduationCap } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { barbersData } from '../data/barbers.js'; // Import barbersData
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Component for Summary Cards ---
const SummaryCard = ({ icon: Icon, label, value, colors, theme }) => (
    <LinearGradient colors={colors} style={styles.summaryCard}>
        <View style={styles.summaryCardIcon}>
            <Icon color={theme.colors.text} size={24} />
        </View>
        <Text style={[styles.summaryCardLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.summaryCardValue, { color: theme.colors.text }]}>{value}</Text>
    </LinearGradient>
);

// --- Component for Quick Action Tiles ---
const QuickActionTile = ({ icon: Icon, label, onPress, theme }) => (
    <Pressable
        style={({ pressed }) => [
            styles.quickAction,
            {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1.0,
            }
        ]}
        onPress={onPress}
    >
        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary + '10' }]}>
            <Icon color={theme.colors.primary} size={28} />
        </View>
        <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
            {label}
        </Text>
    </Pressable>
);

// --- Component for Service Links ---
const ServiceLink = ({ icon: Icon, label, value, onPress, theme }) => (
    <TouchableOpacity style={styles.serviceButton} onPress={onPress}>
        <View style={[styles.serviceIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon size={20} color={theme.colors.primary} />
        </View>
        <Text style={[styles.serviceText, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.serviceValue, { color: theme.colors.primary }]}>{value}</Text>
        <ChevronDown size={18} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
    </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { theme, isDark, changeTheme } = useTheme();
  const { user, updateAvailability } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [isMainOwner, setIsMainOwner] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Getting your location...');
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.9136, // Centered around Dastur Nagar, Amravati
    longitude: 77.7680, // Centered around Dastur Nagar, Amravati
    latitudeDelta: 0.02, // Zoom level to show local area
    longitudeDelta: 0.02, // Zoom level to show local area
  });
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const bottomSheetHeight = useRef(new Animated.Value(screenHeight * 0.3)).current;
  const pan = useRef(new Animated.ValueXY()).current;

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
        const fullOpenHeight = screenHeight * 0.8;

        let targetHeight = currentHeight;

        // Define a threshold for quick flick gestures
        const SWIPE_THRESHOLD = 0.5; // pixels per second

        if (velocity > SWIPE_THRESHOLD) { // Swiping down
          if (currentHeight > halfOpenHeight) {
            targetHeight = halfOpenHeight; // Snap to half-open from full-open
          } else {
            targetHeight = collapsedHeight; // Snap to collapsed from half-open or less
          }
        } else if (velocity < -SWIPE_THRESHOLD) { // Swiping up
          if (currentHeight < halfOpenHeight) {
            targetHeight = halfOpenHeight; // Snap to half-open from collapsed
          } else {
            targetHeight = fullOpenHeight; // Snap to full-open from half-open or more
          }
        } else { // No significant swipe, snap to nearest point
          if (currentHeight < (collapsedHeight + halfOpenHeight) / 2) {
            targetHeight = collapsedHeight;
          } else if (currentHeight < (halfOpenHeight + fullOpenHeight) / 2) {
            targetHeight = halfOpenHeight;
          } else {
            targetHeight = fullOpenHeight;
          }
        }

        // Ensure targetHeight is within bounds
        targetHeight = Math.max(collapsedHeight, Math.min(fullOpenHeight, targetHeight));

        Animated.spring(bottomSheetHeight, {
          toValue: targetHeight,
          tension: 30, // Adjust for snappier feel
          friction: 7, // Adjust for smoother deceleration
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      // Fetch initial shop ownership status
      const fetchShop = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`, {
            headers: { 'x-auth-token': token },
          });
          setIsMainOwner(res.data.isMainOwner);
        } catch (err) {
          console.error(err);
        }
      };
      fetchShop();

      const fetchNotifications = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications`, {
            headers: { 'x-auth-token': token },
          });
          const unreadNotifications = res.data.filter(notification => !notification.read);
          setNotificationCount(unreadNotifications.length);
        } catch (err) {
          console.error(err);
        }
      };

      const fetchEarnings = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/earnings`, {
            headers: { 'x-auth-token': token },
          });
          setLifetimeEarnings(res.data.lifetimeEarnings || 0);
          setTodayEarnings(res.data.todayEarnings || 0);
        } catch (err) {
          console.error('Error fetching earnings:', err);
        }
      };

      fetchNotifications();
      fetchEarnings();

      const notificationsInterval = setInterval(fetchNotifications, 10000);
      const earningsInterval = setInterval(fetchEarnings, 10000);

      return () => {
        clearInterval(notificationsInterval);
        clearInterval(earningsInterval);
      };
    })();
  }, []);

  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  const handleAvailabilityChange = async () => {
    await updateAvailability(!isAvailable);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        customMapStyle={isDark ? lightMapStyle : darkMapStyle}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
        )}
        {isAvailable && barbersData.map(barber => (
          <Marker
            key={barber.id}
            coordinate={{
              latitude: barber.latitude,
              longitude: barber.longitude,
            }}
            title={barber.name}
            description={barber.address}
            pinColor={theme.colors.primary} // Use theme's primary color for the pin
          />
        ))}
      </MapView>
      <View style={[styles.header, { top: insets.top, backgroundColor: theme.colors.card }]}>
        <TouchableOpacity style={styles.profileContainer} onPress={() => navigation.navigate('Profile')}>
          <Image source={user?.profilePicture ? { uri: user.profilePicture } : require('../assets/SetKarr.png')} style={styles.profileImage} />
          <View>
            <Text style={[styles.greetingText, { color: theme.colors.textSecondary }]}>Good morning</Text>
            <Text style={[styles.nameText, { color: theme.colors.text }]}>{user?.name || 'User'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.themeButton}>
          <Bell size={24} color={theme.colors.text} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: bottomSheetHeight,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} {...panResponder.panHandlers} />
        <ScrollView>
          <View style={[
                styles.availabilityContainer,
                {
                    backgroundColor: theme.colors.card,
                    borderColor: isAvailable ? theme.colors.success : theme.colors.red,
                    shadowColor: isAvailable ? theme.colors.success : theme.colors.red,
                }
            ]}>
                <View style={styles.availabilityStatus}>
                    {isAvailable ? (
                        <CheckCircle size={24} color={theme.colors.success} style={{ marginRight: 10 }} />
                    ) : (
                        <XCircle size={24} color={theme.colors.red} style={{ marginRight: 10 }} />
                    )}
                    <View>
                        <Text style={[styles.availabilityTitle, { color: theme.colors.text }]}>
                            {isAvailable ? 'You are ON DUTY' : 'You are OFFLINE'}
                        </Text>
                        <Text style={[styles.availabilitySubtitle, { color: theme.colors.textSecondary }]}>
                            {isAvailable ? 'Visible to customers now' : 'Not visible for bookings'}
                        </Text>
                    </View>
                </View>
                <Switch
                    trackColor={{ false: theme.colors.border, true: theme.colors.success + '80' }}
                    thumbColor={isAvailable ? theme.colors.success : theme.colors.textSecondary}
                    ios_backgroundColor={theme.colors.border}
                    onValueChange={handleAvailabilityChange}
                    value={isAvailable}
                />
            </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
            <QuickActionTile
                icon={CalendarPlus}
                label="Manage Queue"
                theme={theme}
                onPress={() => navigation.navigate('QueueManagement')}
            />
            {isMainOwner ? (
              <QuickActionTile
                  icon={Zap}
                  label="Listing Tier"
                  theme={theme}
                  onPress={() => navigation.navigate('ListedCard')}
              />
            ) : (
              <QuickActionTile
                  icon={User}
                  label="Create Barber Card"
                  theme={theme}
                  onPress={() => navigation.navigate('CreateBarberCard')}
              />
            )}
            <QuickActionTile
                icon={History}
                label="Recent Bookings"
                theme={theme}
                onPress={() => navigation.navigate('AllAppointments')}
            />
            {isMainOwner && (
              <QuickActionTile
                  icon={User}
                  label="Create Barber Card"
                  theme={theme}
                  onPress={() => navigation.navigate('CreateBarberCard')}
              />
            )}
          </ScrollView>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 25 }]}>Financial & Service Tools</Text>
          <View style={[styles.serviceLinksContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <ServiceLink
                icon={Coins}
                label="GlossCut Coins Balance"
                value="₹1,200"
                theme={theme}
                onPress={() => { /* Navigate to Coins Screen */ }}
            />
            <View style={[styles.serviceDivider, { backgroundColor: theme.colors.border }]} />
            <ServiceLink
                icon={IndianRupee}
                label="Today's Earnings"
                value={`₹${todayEarnings.toLocaleString()}`}
                theme={theme}
                onPress={() => navigation.navigate('Earnings')}
            />
            <View style={[styles.serviceDivider, { backgroundColor: theme.colors.border }]} />
            <ServiceLink
                icon={Calendar}
                label="Manage Slots & Calendar"
                value="Daily"
                theme={theme}
                onPress={() => { /* Navigate to Calendar Screen */ }}
            />
          </View>
        </ScrollView>
      </Animated.View>

    </View>
  );
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const lightMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9c9c9' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  greetingText: {
    color: '#ccc',
  },
  nameText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  handle: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 10,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 2, // Border to highlight status
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  availabilitySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingLeft: 15,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth, // Subtle border
    width: 120,
    marginHorizontal: 5,
    aspectRatio: 1,
  },
  quickActionIcon: {
    padding: 12,
    borderRadius: 30,
    marginBottom: 10,
  },
  quickActionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 5,
  },

  // --- Service Links ---
  serviceLinksContainer: {
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  serviceIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
    flex: 1,
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  serviceDivider: {
    height: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // --- Summary Cards ---
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryCardIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
  },
  summaryCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default HomeScreen;
