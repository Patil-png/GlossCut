import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Dimensions, Switch, Platform, StatusBar, Animated, Easing, AppState, Linking
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  ArrowLeft, CheckCircle, CreditCard, Clock, ShieldCheck, MapPin,
  ChevronRight, Wallet, Scissors, CalendarCheck, Lock, Star, Copy, Calendar as CalendarIcon
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Colors } from '../src/theme/colors';
import { Layout } from '../src/theme/layout';
import { Typography } from '../src/theme/typography';
import api from "../utils/api";
import { useFocusEffect } from '@react-navigation/native';
import * as Calendar from 'expo-calendar'; // Ensure you run: npx expo install expo-calendar

const PAYMENT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const PLATFORM_FEE = 7;
const BACKEND_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/payment`;
const { width } = Dimensions.get('window');

const PaymentConfirmationScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user, token, fetchUser } = useAuth();
  const { providerName, selectedServices, totalPrice, providerId, forFriend, serviceType, bookingDate } = route.params;
  const insets = useSafeAreaInsets();

  // --- STATE MANAGEMENT ---
  const [showAnimation, setShowAnimation] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [bookingOtp, setBookingOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [useSetkarCoins, setUseSetkarCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);

  // --- REFS ---
  const timerRef = useRef(null);
  const endTimeRef = useRef(null); // Fix: Track absolute end time
  const paymentConfirmedRef = useRef(paymentConfirmed);
  const isPaymentProcessingRef = useRef(isPaymentProcessing);

  // --- ANIMATION REFS ---
  const payBtnScale = useRef(new Animated.Value(1)).current;
  const coinsScale = useRef(new Animated.Value(1)).current;

  // New Premium Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ticketSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  // --- LOGIC & EFFECTS ---

  useEffect(() => {
    paymentConfirmedRef.current = paymentConfirmed;

    // Trigger Success Animations
    if (paymentConfirmed) {
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(ticketSlideAnim, {
          toValue: 0,
          damping: 12,
          stiffness: 90,
          mass: 1,
          useNativeDriver: true
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [paymentConfirmed]);

  useEffect(() => {
    isPaymentProcessingRef.current = isPaymentProcessing;
  }, [isPaymentProcessing]);

  // Cancel Booking Logic
  const cancelBooking = useCallback(async () => {
    if (route.params.bookingId && !paymentConfirmedRef.current && !isPaymentProcessingRef.current) {
      try {
        await api.put(`/api/booking/cancel/${route.params.bookingId}`, {}, {
          // headers handled by interceptor
        });
        Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled because payment was not completed within 1 minute.');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } catch (error) {
        console.error('Error cancelling booking:', error);
        Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
      }
    }
  }, [route.params.bookingId, token, navigation]);

  // Prevent Back Button
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!paymentConfirmedRef.current && route.params.bookingId) {
          e.preventDefault();
          Alert.alert(
            'Confirm Payment',
            'You must pay the amount to confirm the appointment. If you go back now, the appointment will be cancelled.',
            [
              { text: 'Pay Now', onPress: () => { }, style: 'cancel' },
              { text: 'Cancel Appointment', onPress: () => { unsubscribe(); cancelBooking(); }, style: 'destructive' },
            ],
            { cancelable: false }
          );
        }
      });
      return unsubscribe;
    }, [navigation, cancelBooking, route.params.bookingId])
  );

  // --- ROBUST TIMER LOGIC (Background Safe) ---
  useEffect(() => {
    if (route.params.bookingId && !paymentConfirmed) {
      // 1. Set the absolute end time ONLY ONCE
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + 60 * 1000;
      }

      // 2. Interval checks the difference between NOW and END TIME
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

        setCountdown(remaining);

        if (paymentConfirmedRef.current) {
          clearInterval(timerRef.current);
          return;
        }

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          cancelBooking();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [route.params.bookingId, cancelBooking, paymentConfirmed]);

  // Fee Calculation
  const getConfirmationFee = () => {
    if (forFriend) {
      if (serviceType === 'salon') return 15;
      if (serviceType === 'pet') return 20;
      return 10;
    } else {
      if (serviceType === 'salon') return 10;
      if (serviceType === 'pet') return 20;
      return 7;
    }
  };

  const confirmationFee = getConfirmationFee();
  const remainingAmount = totalPrice;

  // Coin Logic
  useEffect(() => {
    if (user) {
      setCoinsToUse(user.setkarCoins >= confirmationFee ? confirmationFee : user.setkarCoins);
    }
  }, [user, confirmationFee]);

  const animateCoinSwitch = (val) => {
    setUseSetkarCoins(val);
    Animated.sequence([
      Animated.timing(coinsScale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
      Animated.timing(coinsScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePayment = async () => {
    Animated.sequence([
      Animated.timing(payBtnScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(payBtnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    setPaymentInitiated(true);
    setIsPaymentProcessing(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      let finalAmountToPay = confirmationFee;
      let coinsUsed = 0;

      if (useSetkarCoins && user.setkarCoins > 0) {
        coinsUsed = user.setkarCoins >= finalAmountToPay ? finalAmountToPay : user.setkarCoins;
        finalAmountToPay -= coinsUsed;
        finalAmountToPay = Math.max(0, finalAmountToPay);
      }

      const response = await api.post(`/api/payment/dummy-payment`, {
        bookingId: route.params.bookingId,
        coinsUsed: coinsUsed
      });

      if (response.data.status === 'success') {
        setBookingOtp(response.data.otp);
        setPaymentConfirmed(true);
        setShowAnimation(true);
        await fetchUser(); // Refresh user data to get updated coin balance from backend
      } else {
        Alert.alert('Booking Failed', response.data.message || 'Could not confirm booking.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setPaymentInitiated(false);
      setIsPaymentProcessing(false);
    }
  };

  // --- CALENDAR INTEGRATION ---
  const addToCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];

        // Note: Replace new Date() with actual bookingDate parsing if available
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        await Calendar.createEventAsync(defaultCalendar.id, {
          title: `Gloss Cut: ${providerName}`,
          startDate: startDate,
          endDate: endDate,
          location: providerName,
          notes: `Booking ID: ${bookingOtp}. Service Type: ${serviceType}`,
          timeZone: 'Asia/Kolkata'
        });
        Alert.alert('Success', 'Added to your calendar!');
      } else {
        Alert.alert('Permission Denied', 'We need calendar permissions to save the date.');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Could not add to calendar. Please try again.');
    }
  };

  const finalPayable = (confirmationFee - (useSetkarCoins ? coinsToUse : 0)).toFixed(2);

  // ----------------------------------------------------------------
  // RENDER: BOOKING CONFIRMED (UNICORN STARTUP UI)
  // ----------------------------------------------------------------
  if (paymentConfirmed) {
    const perforationDots = Array.from({ length: 20 }).map((_, i) => (
      <View key={i} style={styles.perfDot} />
    ));

    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* 1. Minimal Header */}
        <View style={styles.successBgHeader}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.BG_PAGE }]} />
          <LottieView
            source={require('../assets/Confetti.json')}
            autoPlay loop={false}
            style={{ position: 'absolute', top: 0, width: width, height: '100%', zIndex: 0, opacity: 0.5 }}
            resizeMode="cover"
          />

          <View style={{ flex: 1, alignItems: 'center', paddingTop: Math.max(insets.top, 20) }}>
            <Animated.View style={{ alignItems: 'center', opacity: textFadeAnim }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 15 }}>
                <View style={styles.pulseRing}>
                  <View style={styles.checkIconBg}>
                    <CheckCircle size={40} color={Colors.TEXT_PRIMARY} strokeWidth={4} />
                  </View>
                </View>
              </Animated.View>
              <Text style={styles.heroTitle}>Booking Confirmed!</Text>
              <Text style={styles.heroSub}>You're all set for the appointment</Text>
            </Animated.View>
          </View>
        </View>

        {/* 2. Scrollable Content with "Spring" Ticket */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 240 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          overScrollMode="never"
        >
          <Animated.View style={{
            transform: [{ translateY: ticketSlideAnim }],
            paddingHorizontal: 20
          }}>

            {/* --- THE TICKET --- */}
            <View style={styles.ticketWrapper}>
              {/* Top Part: Service Details */}
              <View style={styles.ticketTop}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketProviderIcon}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.TEXT_PRIMARY }}>{providerName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.ticketTitle}>{providerName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Star size={12} fill={Colors.TEXT_PRIMARY} color={Colors.TEXT_PRIMARY} />
                      <Text style={styles.ticketSub}> 4.9 • {serviceType === 'salon' ? 'Salon Visit' : 'Home Service'}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PAID</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                <View style={styles.serviceList}>
                  <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
                  {selectedServices.map((s, i) => (
                    <View key={i} style={styles.serviceRow}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      <Text style={styles.servicePrice}>₹{s.price}</Text>
                    </View>
                  ))}
                  <View style={[styles.serviceRow, { marginTop: 12 }]}>
                    <Text style={[styles.serviceName, { fontWeight: '700' }]}>Balance to pay at store</Text>
                    <Text style={[styles.servicePrice, { fontWeight: '700', fontSize: 16 }]}>₹{remainingAmount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* Perforation / Rip Line */}
              <View style={styles.ripContainer}>
                <View style={styles.ripCircleLeft} />
                <View style={styles.dotsContainer}>
                  {perforationDots}
                </View>
                <View style={styles.ripCircleRight} />
              </View>

              {/* Bottom Part: OTP & Trust */}
              <View style={styles.ticketBottom}>
                <Text style={styles.otpLabel}>SHOW THIS CODE TO PROVIDER</Text>

                <View style={styles.otpVault}>
                  <Text style={styles.otpDigit}>{bookingOtp}</Text>
                  <TouchableOpacity style={styles.copyBtn}>
                    <Copy size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.trustFooter}>
                  <ShieldCheck size={14} color="#28A745" />
                  <Text style={styles.trustText}>Secure Code • One-time use only</Text>
                </View>
              </View>
            </View>

            {/* --- TIMELINE --- */}
            <View style={styles.timelineBox}>
              <Text style={styles.timelineHeader}>Track Order</Text>

              {/* Step 1 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconActive}>
                  <CheckCircle size={14} color="#FFF" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.stepTitle}>Booking Accepted</Text>
                  <Text style={styles.stepSub}>We've shared your details with {providerName}</Text>
                </View>
              </View>
              <View style={styles.timelineConnectorActive} />

              {/* Step 2 */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineIconPending}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#888' }}>2</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepTitle, { color: '#888' }]}>Arrive & Start Service</Text>
                  <Text style={styles.stepSub}>Share the OTP {bookingOtp} to start the job</Text>
                </View>
              </View>

              {/* --- ADD TO CALENDAR BUTTON (RETENTION FEATURE) --- */}
              <TouchableOpacity
                onPress={addToCalendar}
                style={styles.calendarButton}
              >
                <CalendarIcon size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.calendarText, { color: theme.colors.primary }]}>Add to Calendar</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>

        {/* Floating Action Bar */}
        <Animated.View style={[styles.fabContainer, { opacity: textFadeAnim }]}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
            activeOpacity={0.9}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    );
  }

  // ----------------------------------------------------------------
  // RENDER: PAYMENT REVIEW
  // ----------------------------------------------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />

      {/* Header */}
      <View style={[styles.safeHeader, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.headerTitle}>Review & Pay</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 2</Text>
          </View>
        </View>
      </View>

      {/* Timer Alert */}
      {countdown > 0 && (
        <View style={styles.timerContainer}>
          <Clock size={16} color="#D9480F" strokeWidth={2.5} />
          <Text style={styles.timerText}>
            Complete payment in 00:{countdown < 10 ? `0${countdown}` : countdown} to secure slot
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Booking Summary Card */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginLeft: 4 }}>Booking Summary</Text>
        <View style={styles.premiumCard}>
          <View style={styles.providerRow}>
            <View style={styles.providerIcon}>
              <Scissors size={24} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.serviceBadge}>
                <CalendarCheck size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.serviceText}>
                  {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''} • {serviceType === 'salon' ? 'In-Store' : 'Home Visit'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bill Rows */}
          {selectedServices.map((service, index) => (
            <View key={index} style={styles.billItem}>
              <Text style={styles.billLabel} numberOfLines={1}>{service.name}</Text>
              <Text style={styles.billPrice}>₹{service.price}</Text>
            </View>
          ))}

          <View style={[styles.billItem, { marginTop: 8 }]}>
            <Text style={[styles.billLabel, { fontWeight: '600' }]}>Subtotal</Text>
            <Text style={styles.billPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.billItem}>
            <Text style={styles.billLabel}>
              {forFriend ? 'Friend Booking Fee' : 'Platform Fee'}
            </Text>
            <Text style={styles.billPrice}>₹{confirmationFee.toFixed(2)}</Text>
          </View>
        </View>

        {/* Setkar Coins Wallet */}
        {user?.setkarCoins !== undefined && (
          <Animated.View style={[styles.coinCard, { transform: [{ scale: coinsScale }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => animateCoinSwitch(!useSetkarCoins)}
              style={styles.coinRow}
            >
              <View>
                <View style={styles.coinLeft}>
                  <View style={{ backgroundColor: '#FFF4E6', padding: 6, borderRadius: 8 }}>
                    <Wallet size={18} color="#D97E00" />
                  </View>
                  <Text style={styles.coinLabel}>Use GlossCut Coins</Text>
                </View>
                <Text style={styles.coinSub}>Balance: {user.setkarCoins.toFixed(2)} coins</Text>
              </View>

              <Switch
                trackColor={{ false: theme.colors.border, true: '#F59F00' }}
                thumbColor={'#fff'}
                onValueChange={(val) => animateCoinSwitch(val)}
                value={useSetkarCoins}
              />
            </TouchableOpacity>

            {/* --- IMPROVED COIN UI --- */}
            {useSetkarCoins && (
              <View style={styles.coinDiscountBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Wallet size={14} color="#B76E00" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#B76E00', fontWeight: '700' }}>GlossCut Savings</Text>
                </View>
                <Text style={{ color: '#B76E00', fontWeight: '800', fontSize: 16 }}>
                  - ₹{coinsToUse.toFixed(2)}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Payment Split Info */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginTop: 8, marginLeft: 4 }}>Payment Breakdown</Text>
        <View style={styles.payLaterBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CreditCard size={18} color={theme.colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.payLaterLabel}>Pay Now to Confirm</Text>
          </View>
          <Text style={[styles.payLaterAmount, { color: theme.colors.primary }]}>₹{finalPayable}</Text>
        </View>

        <View style={[styles.payLaterBox, { marginTop: 8, backgroundColor: theme.colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={styles.payLaterLabel}>Pay at Store</Text>
          </View>
          <Text style={styles.payLaterAmount}>₹{remainingAmount.toFixed(2)}</Text>
        </View>

      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.trustRow}>
          <Lock size={12} color={theme.colors.textSecondary} />
          <Text style={styles.trustText}>Payments are 100% Secure & Encrypted</Text>
        </View>

        <View style={styles.footerActionRow}>
          <View>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalAmount}>₹{finalPayable}</Text>
          </View>

          <Animated.View style={[styles.payButton, { transform: [{ scale: payBtnScale }] }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={handlePayment}
              disabled={paymentInitiated || countdown === 0}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.gradientBtn,
                  {
                    backgroundColor:
                      countdown === 0 ? theme.colors.border : Colors.CTA_BUTTON,
                  },
                ]}
              >
                {paymentInitiated ? (
                  <Text style={styles.payText}>Processing...</Text>
                ) : (
                  <>
                    <Text style={styles.payText}>Pay & Book</Text>
                    <ChevronRight size={20} color={Colors.TEXT_ON_DARK} strokeWidth={3} />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Loading Overlay */}
      {showAnimation && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 200, height: 200, backgroundColor: '#fff', borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
              <LottieView
                source={require('../assets/Payment Successful Animation.json')}
                autoPlay loop={false}
                style={{ width: 180, height: 180 }}
                onAnimationFinish={() => setShowAnimation(false)}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PaymentConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9'
  },
  // --- NEW SUCCESS SCREEN STYLES (UNICORN UI) ---
  successContainer: {
    flex: 1,
    backgroundColor: '#F4F4F4', // Clean background
  },
  successBgHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380, // Deep header
  },
  pulseRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 10,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  heroSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontWeight: '500'
  },

  // TICKET CARD WRAPPER
  ticketWrapper: {
    backgroundColor: 'transparent',
    marginBottom: 25
  },
  ticketTop: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 30
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ticketProviderIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2
  },
  ticketSub: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  statusBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#137333',
    letterSpacing: 0.5
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  serviceName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  servicePrice: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600'
  },

  // PERFORATION EFFECT
  ripContainer: {
    height: 20,
    backgroundColor: '#FFF', // Must match ticket color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 10,
    position: 'relative',
    marginTop: -1
  },
  ripCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4F4F4', // Match SCREEN background
    marginLeft: -12
  },
  ripCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4F4F4', // Match SCREEN background
    marginRight: -12
  },
  dotsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    overflow: 'hidden'
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4F4F4', // Match SCREEN background
    marginHorizontal: 2,
    marginTop: 7, // Center it visually in the 20px height
  },

  // TICKET BOTTOM
  ticketBottom: {
    backgroundColor: '#F9FAFB', // Slightly different shade for bottom half
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 0
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 12
  },
  otpVault: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    position: 'relative',
    flexDirection: 'row'
  },
  otpDigit: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#111',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  copyBtn: {
    position: 'absolute',
    right: 15,
    padding: 5
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 6
  },

  // TIMELINE
  timelineBox: {
    paddingHorizontal: 10,
    marginBottom: 30
  },
  timelineHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    marginLeft: 10
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  timelineIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  timelineIconPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  timelineConnectorActive: {
    width: 2,
    height: 30,
    backgroundColor: '#28A745',
    marginLeft: 11,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 20
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111'
  },
  stepSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 18
  },

  // CALENDAR BUTTON
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  calendarText: {
    fontSize: 14,
    fontWeight: '600'
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20
  },
  doneButton: {
    backgroundColor: '#111',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center'
  },
  doneText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },

  // --- PAYMENT REVIEW STYLES ---
  safeHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    zIndex: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    height: 60
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666'
  },
  timerContainer: {
    backgroundColor: '#FFF4E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  timerText: {
    color: '#D9480F',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13
  },
  content: {
    paddingBottom: 160,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  premiumCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  providerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  serviceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  billLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1
  },
  billPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  coinCard: {
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE066',
    marginBottom: 16
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  coinLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B76E00',
    marginLeft: 10
  },
  coinSub: {
    fontSize: 12,
    color: '#D97E00',
    marginTop: 2,
    marginLeft: 34
  },
  coinDiscountBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 126, 0, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 8,
    borderRadius: 8
  },
  payLaterBox: {
    backgroundColor: '#F4F6F9',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  payLaterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  payLaterAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 20
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    opacity: 0.7
  },
  trustText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6
  },
  footerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    letterSpacing: -0.5
  },
  payButton: {
    flex: 1,
    marginLeft: 24,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden'
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  payText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8
  }
});
