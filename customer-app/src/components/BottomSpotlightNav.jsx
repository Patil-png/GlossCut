import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Search, Clock, MapPin, Calendar, Zap, Bell, User, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../../navigation/RootNavigation';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = (SCREEN_WIDTH - 60) / 5; // Adjust based on 5 tabs and padding

const BottomSpotlightNav = () => {
  const insets = useSafeAreaInsets();
  const [currentRouteName, setCurrentRouteName] = useState('Home');
  const [currentRouteParams, setCurrentRouteParams] = useState({});
  const translateX = useSharedValue(0);

  const routes = [
    { name: 'Home', title: 'Home', Icon: Home },
    { name: 'BarberSearch', title: 'Search', Icon: Search },
    { name: 'TrackQueue', title: 'Track', Icon: Clock },
    { name: 'ShopMapScreen', title: 'Map', Icon: MapPin },
    { name: 'History', title: 'History', Icon: Calendar },
  ];

  // Use a listener on the navigationRef to track state changes globally
  useEffect(() => {
    const updatePosition = (routeName) => {
      const index = routes.findIndex(r => r.name === routeName);
      if (index !== -1) {
        translateX.value = withSpring(index * TAB_WIDTH, {
          damping: 15,
          stiffness: 120
        });
      }
    };

    const timeout = setTimeout(() => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route) {
          setCurrentRouteName(route.name);
          setCurrentRouteParams(route.params || {});
          updatePosition(route.name);
        }
      }
    }, 500);

    const unsubscribe = navigationRef.addListener('state', () => {
      const route = navigationRef.getCurrentRoute();
      if (route) {
        setCurrentRouteName(route.name);
        setCurrentRouteParams(route.params || {});
        updatePosition(route.name);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const animatedSpotlightStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Only show on main app screens (hide on Login, Splash, etc.)
  const hiddenScreens = [
    'Login', 'Signup', 'Splash', 'Onboarding', 'ForgotPassword',
    'OTPVerification', 'ResetPassword', 'BookingOTPVerification',
    'Booking', 'PaymentConfirmation', 'TrackQueue', 'Appointmentcheckpage',
    'Profile', 'TwoFactorVerification', 'EditPhoneNumber', 'EditName',
    'EditEmail', 'PersonalInfo', 'ChangePassword', 'ManageNotifications',
    'AboutGlossCut', 'RefundPolicy', 'Chat', 'LikedBarbers', 'FaceSuggestor',
    'PrivacyCheckup', 'Notifications', 'ScheduleNextAppointment',
    'BookingDetail', 'NotificationDetail'
  ];
  const isShopSelected = currentRouteParams?.isShopSelected;

  if (hiddenScreens.includes(currentRouteName) || isShopSelected) {
    return null;
  }

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.spotlightBarContainer}>
        <View style={styles.spotlightBar}>
          <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="dark" style={styles.blurBackground} />
          <LinearGradient
            colors={['rgba(50, 50, 50, 0.4)', 'rgba(20, 20, 20, 0.6)']}
            style={styles.barGradient}
          />

          {/* Animated Spotlight Beam */}
          <Animated.View style={[styles.spotlightContainer, animatedSpotlightStyle, { width: TAB_WIDTH }]}>
            <View style={styles.activePill} />
            <Svg height="60" width="80" style={styles.svgBeam}>
              <Defs>
                <SvgGradient id="grad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <Stop offset="0%" stopColor="white" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="white" stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path
                d="M30 0 L50 0 L70 60 L10 60 Z"
                fill="url(#grad)"
              />
            </Svg>
          </Animated.View>

          {routes.map((route) => {
            const isFocused = currentRouteName === route.name;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (navigationRef.isReady()) {
                navigationRef.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.name}
                style={styles.spotlightItem}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                  <route.Icon
                    size={24}
                    color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
                    strokeWidth={isFocused ? 2.5 : 2}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110, // Increased to accommodate insets safely
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
    zIndex: 9999,
  },
  spotlightBarContainer: {
    width: SCREEN_WIDTH - 40,
    height: 72,
    marginBottom: 10, // Reduced from 20
  },
  spotlightBar: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 100,
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    overflow: 'hidden', // Required for BlurView
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 25, 25, 0.85)',
  },
  barGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spotlightContainer: {
    position: 'absolute',
    top: 0,
    left: 10, // Matches paddingHorizontal of spotlightBar
    bottom: 0,
    alignItems: 'center',
  },
  activePill: {
    width: 32,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  svgBeam: {
    position: 'absolute',
    top: 0,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  activeIconWrapper: {
    // Optional: add a scale transform here if desired
  }
});

export default BottomSpotlightNav;
