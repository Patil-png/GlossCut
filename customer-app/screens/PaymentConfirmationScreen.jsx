import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Dimensions, Switch, Platform, StatusBar, Animated, Easing, AppState, Linking, Share, Clipboard
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  ArrowLeft, CheckCircle, Check, CreditCard, Clock, ShieldCheck, MapPin,
  ChevronRight, Wallet, Scissors, CalendarCheck, Lock, Star, Copy, Calendar as CalendarIcon,
  Ticket as TicketIcon, Share2 as ShareIcon, Home as HomeIcon
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  const {
    providerName,
    shopName,
    selectedServices,
    totalPrice,
    providerId,
    forFriend,
    serviceType,
    bookingDate,
    providerRating,
    providerAddress
  } = route.params;
  const insets = useSafeAreaInsets();

  // --- STATE MANAGEMENT ---
  const [showAnimation, setShowAnimation] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(route.params.paymentConfirmed || false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [bookingOtp, setBookingOtp] = useState(route.params.bookingOtp || '');
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
  const ticketSlideAnim = useRef(new Animated.Value(paymentConfirmed ? 0 : Dimensions.get('window').height)).current;
  const textFadeAnim = useRef(new Animated.Value(paymentConfirmed ? 1 : 0)).current;

  // --- LOGIC & EFFECTS ---

  // Success Animations & Haptics
  useEffect(() => {
    paymentConfirmedRef.current = paymentConfirmed;

    if (paymentConfirmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(ticketSlideAnim, {
          toValue: 0,
          damping: 12,
          stiffness: 90,
          useNativeDriver: true
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.spring(pulseAnim, { toValue: 1.2, useNativeDriver: true }),
          Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }),
        ])
      ]).start();

      // Loop pulse for hero icon
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

  // --- HELPERS ---
  const formatBookingDate = (dateStr) => {
    if (!dateStr) return "Today";
    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = d.getDate();
      const month = months[d.getMonth()];
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return dateStr;
    }
  };

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
  const remainingAmount = totalPrice || 0;

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



  const finalPayable = (confirmationFee - (useSetkarCoins ? coinsToUse : 0)).toFixed(2);

  if (paymentConfirmed) {
    return (
      <View style={[styles.successContainer, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* --- TOP NAVIGATION BAR --- */}
        <View style={[styles.topNavBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={async () => {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const shareUrl = `https://glosscut.com/booking-success/${route.params.bookingId || ''}`;
                const trackUrl = `https://glosscut.com/track-queue/${route.params.bookingId || ''}`;

                await Share.share({
                  title: 'GlossCut Booking Receipt',
                  message: `🛡️ GlossCut Booking Confirmed!\n\n🏪 Shop: ${shopName || 'Our Partner Shop'}\n👤 Barber: ${providerName || 'My Barber'}\n📅 Date: ${formatBookingDate(bookingDate)}\n🔑 Entry Code (OTP): ${bookingOtp || 'N/A'}\n📍 Location: ${providerAddress || 'N/A'}\n\n📲 Track Your Queue Live:\n${trackUrl}\n\nPlease keep this receipt for smooth entry!`
                });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            <ShareIcon size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* 1. EXECUTIVE CONFIRMATION HERO */}
        <View style={styles.executiveHero}>
          <LottieView
            source={require('../assets/Confetti.json')}
            autoPlay loop={false}
            style={styles.subtleConfetti}
            resizeMode="cover"
            pointerEvents="none"
          />

          <Animated.View style={[styles.heroContentLuxe, { opacity: textFadeAnim }]}>
            <View style={styles.confirmationBadge}>
              <View style={styles.innerBadgeCircle}>
                <Check size={24} color="#FFF" strokeWidth={4} />
              </View>
            </View>

            <Text style={styles.luxeStatusText}>SLOT SECURED</Text>
            <Text style={styles.luxeMainTitle} numberOfLines={1} ellipsizeMode="tail">{shopName || "GlossCut Studio"}</Text>

            <View style={styles.luxeDetailRow}>
              <View style={styles.luxeDetailItem}>
                <CalendarIcon size={12} color="#64748B" />
                <Text style={styles.luxeDetailValue} numberOfLines={1} ellipsizeMode="tail">{formatBookingDate(bookingDate)}</Text>
              </View>
              <View style={styles.luxeDividerSmall} />
              <View style={styles.luxeDetailItem}>
                <Scissors size={12} color="#64748B" />
                <Text style={styles.luxeDetailValue} numberOfLines={1} ellipsizeMode="tail">{providerName || "Professional"}</Text>
              </View>
            </View>

            {/* LIVE TRACKER BUTTON */}
            <TouchableOpacity
              style={styles.liveTrackerBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('TrackQueue', { trackingId: route.params.bookingId });
              }}
            >
              <View style={styles.liveIndicator} />
              <Text style={styles.liveTrackerText}>TRACK LIVE QUEUE</Text>
              <ChevronRight size={16} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        >
          <Animated.View style={{ transform: [{ translateY: ticketSlideAnim }], paddingHorizontal: 20 }}>

            {/* --- PREMIUM GLASS TICKET --- */}
            {/* --- VINTAGE SCALLOPED TICKET --- */}
            <View style={styles.scallopedTicket}>
              {/* Left Scallops */}
              <View style={styles.leftScallops}>
                {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={styles.scallopCircle} />)}
              </View>

              <View style={styles.ticketMainSection}>
                <View style={styles.innerTicketBorder}>
                  {/* Decorative Corner Stars */}
                  <Star size={10} color="#5D4037" fill="#5D4037" style={styles.starTL} />
                  <Star size={10} color="#5D4037" fill="#5D4037" style={styles.starTR} />
                  <Star size={10} color="#5D4037" fill="#5D4037" style={styles.starBL} />
                  <Star size={10} color="#5D4037" fill="#5D4037" style={styles.starBR} />

                  <View style={styles.ticketHeaderVintage}>
                    <Text style={styles.shopNameVintage} numberOfLines={1} ellipsizeMode="tail">{shopName || "GLOSSCUT STUDIO"}</Text>
                    <Text style={styles.serviceVintage} numberOfLines={1}>
                      {selectedServices.length} SERVICES • ₹{Number(remainingAmount).toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.vintageDivider} />

                  <View style={styles.servicesListVintage}>
                    {selectedServices.slice(0, 3).map((s, i) => (
                      <Text key={i} style={styles.serviceItemVintage} numberOfLines={1} ellipsizeMode="tail">• {s.name}</Text>
                    ))}
                    {selectedServices.length > 3 && <Text style={styles.serviceItemVintage} numberOfLines={1}>+ {selectedServices.length - 3} more...</Text>}
                  </View>
                </View>
              </View>

              {/* Perforation */}
              <View style={styles.vintagePerforation}>
                <View style={styles.perfCutoutTop} />
                <View style={styles.perfLine} />
                <View style={styles.perfCutoutBottom} />
              </View>

              {/* Right Stub (Barcode Area) */}
              <View style={styles.ticketStubSection}>
                <View style={styles.innerStubBorder}>
                  <Star size={8} color="#5D4037" fill="#5D4037" style={styles.starStubT} />
                  <Star size={8} color="#5D4037" fill="#5D4037" style={styles.starStubB} />

                  <View style={styles.barcodeContainer}>
                    {/* Mock Barcode Lines */}
                    {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 4].map((w, i) => (
                      <View key={i} style={[styles.barcodeLine, { width: w }]} />
                    ))}
                  </View>

                  <Text style={styles.stubOtpText}>{bookingOtp}</Text>

                  <TouchableOpacity
                    style={styles.stubCopyBtn}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Clipboard.setString(bookingOtp);
                    }}
                  >
                    <Copy size={12} color="#5D4037" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Scallops */}
              <View style={styles.rightScallops}>
                {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={styles.scallopCircle} />)}
              </View>
            </View>

            {/* --- HELPER TEXT --- */}
            <View style={styles.vintageFooterInfo}>
              <ShieldCheck size={14} color="#5D4037" />
              <Text style={styles.vintageFooterText} numberOfLines={1} ellipsizeMode="tail">OFFICIAL BOOKING TOKEN • NON-TRANSFERABLE</Text>
            </View>

            {/* --- SMART TIMELINE --- */}
            <View style={styles.nextStepsCard}>
              <Text style={styles.nextStepsTitle}>Next Steps</Text>

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, { backgroundColor: '#22C55E' }]}>
                  <CheckCircle size={14} color="#FFF" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepName} numberOfLines={1} ellipsizeMode="tail">Booking Confirmed</Text>
                  <Text style={styles.stepDesc} numberOfLines={1} ellipsizeMode="tail">Details sent to {providerName}</Text>
                </View>
              </View>

              <View style={styles.stepLine} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, { backgroundColor: '#E2E8F0' }]}>
                  <Clock size={14} color="#64748B" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepName, { color: '#64748B' }]}>Arrive on Time</Text>
                  <Text style={styles.stepDesc}>Head to the salon for your slot</Text>
                </View>
              </View>

              <View style={styles.stepLine} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, { backgroundColor: '#E2E8F0' }]}>
                  <Scissors size={14} color="#64748B" />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepName, { color: '#64748B' }]}>Enjoy Your Service</Text>
                  <Text style={styles.stepDesc}>Share OTP to begin</Text>
                </View>
              </View>


            </View>

          </Animated.View>
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={styles.homeActionButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <HomeIcon size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareReceiptBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Add share logic
            }}
          >
            <ShareIcon size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
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
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Review & Pay</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Step 2 of 2</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName} numberOfLines={1} ellipsizeMode="tail">{providerName}</Text>
              <View style={styles.serviceBadge}>
                <CalendarCheck size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.serviceText} numberOfLines={1} ellipsizeMode="tail">
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
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.totalLabel} numberOfLines={1}>Total Payable</Text>
            <Text style={styles.totalAmount} numberOfLines={1}>₹{finalPayable}</Text>
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
  },
  topNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  navCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // --- SUCCESS VIEW STYLES (EXECUTIVE LUXE) ---
  executiveHero: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  subtleConfetti: {
  position: 'absolute',
  top: 0,
  width: width,
  height: 300,
  opacity: 0.4,
},
  heroContentLuxe: {
  alignItems: 'center',
  zIndex: 10,
},
  confirmationBadge: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(34, 197, 94, 0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},
  innerBadgeCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#22C55E',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#22C55E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
  luxeStatusText: {
  fontSize: 10,
  fontWeight: '900',
  color: '#22C55E',
  letterSpacing: 2,
  marginBottom: 8,
},
  luxeMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    width: '100%',
    paddingHorizontal: 10,
  },
  liveTrackerBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#0F172A',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 100,
  marginTop: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 15,
  elevation: 8,
},
  liveIndicator: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#10B981',
  marginRight: 10,
},
  liveTrackerText: {
  fontSize: 12,
  fontWeight: '900',
  color: '#FFF',
  letterSpacing: 1.5,
  marginRight: 8,
},
  luxeDetailRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
  backgroundColor: '#F8FAFC',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 100,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  gap: 10,
},
  luxeDetailItem: {
  flexDirection: 'row',
  alignItems: 'center',
  flexShrink: 1,
},
  luxeDetailValue: {
  fontSize: 12,
  fontWeight: '700',
  color: '#64748B',
  marginLeft: 6,
  flexShrink: 1,
},
  luxeDividerSmall: {
  width: 1,
  height: 12,
  backgroundColor: '#E2E8F0',
  marginHorizontal: 12,
},

  premiumTicket: {
  backgroundColor: '#FFF',
  borderRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.1,
  shadowRadius: 30,
  elevation: 20,
  overflow: 'hidden',
},
  ticketMain: {
  padding: 24,
},
  ticketHead: {
  flexDirection: 'row',
  alignItems: 'center',
},
  shopLogoBox: {
  width: 54,
  height: 54,
  borderRadius: 16,
  backgroundColor: '#F1F5F9',
  justifyContent: 'center',
  alignItems: 'center',
},
  shopInitial: {
  fontSize: 24,
  fontWeight: '800',
  color: '#0F172A',
},
  shopNameTicket: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  shopMetaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 2,
},
  shopRatingText: {
  fontSize: 12,
  color: '#64748B',
  fontWeight: '600',
},
  confBadge: {
  backgroundColor: '#F0FDF4',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 10,
},
  confBadgeText: {
  fontSize: 10,
  fontWeight: '900',
  color: '#22C55E',
},
  ticketDivider: {
  height: 1,
  backgroundColor: '#F1F5F9',
  marginVertical: 20,
},
  ticketSectionTitle: {
  fontSize: 11,
  fontWeight: '800',
  color: '#94A3B8',
  letterSpacing: 1,
  marginBottom: 16,
},
  ticketServiceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
  serviceDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#CBD5E1',
  marginRight: 12,
},
  ticketServiceName: {
  flex: 1,
  fontSize: 14,
  fontWeight: '600',
  color: '#334155',
},
  ticketServicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  ticketTotalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 8,
  paddingTop: 16,
  borderTopWidth: 1,
  borderTopColor: '#F8FAFC',
},
  totalLabelText: {
  fontSize: 15,
  fontWeight: '700',
  color: '#64748B',
},
  totalValueText: {
  fontSize: 20,
  fontWeight: '900',
  color: '#0F172A',
},
  addressBoxTicket: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8FAFC',
  padding: 12,
  borderRadius: 14,
  marginTop: 20,
},
  addressTextTicket: {
  fontSize: 12,
  color: '#64748B',
  marginLeft: 8,
  fontWeight: '500',
  flex: 1,
},
  perforationWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  height: 30,
  backgroundColor: 'transparent',
},
  cutoutLeft: {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#F8FAFC',
  marginLeft: -10,
},
  dashedLine: {
  flex: 1,
  height: 1,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderStyle: 'dashed',
  marginHorizontal: 10,
},
  cutoutRight: {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: '#F8FAFC',
  marginRight: -10,
},
  // --- VINTAGE TICKET STYLES ---
  scallopedTicket: {
    flexDirection: 'row',
    backgroundColor: '#E6D5B8', // Tan color from image
    height: 180,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 10,
  },
  leftScallops: {
    position: 'absolute',
    left: -12,
    top: 0,
    bottom: 0,
    justifyContent: 'space-around',
    paddingVertical: 10,
    zIndex: 10,
  },
  rightScallops: {
    position: 'absolute',
    right: -12,
    top: 0,
    bottom: 0,
    justifyContent: 'space-around',
    paddingVertical: 10,
    zIndex: 10,
  },
  scallopCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
ticketMainSection: {
  flex: 3,
    padding: 12,
    },
innerTicketBorder: {
  flex: 1,
    borderWidth: 1.5,
      borderColor: '#5D4037',
        borderRadius: 12,
          borderStyle: 'solid',
            padding: 12,
              justifyContent: 'center',
    },
starTL: { position: 'absolute', top: 8, left: 8 },
starTR: { position: 'absolute', top: 8, right: 8 },
starBL: { position: 'absolute', bottom: 8, left: 8 },
starBR: { position: 'absolute', bottom: 8, right: 8 },

ticketHeaderVintage: {
  alignItems: 'center',
    marginBottom: 8,
    },
shopNameVintage: {
  fontSize: 16,
    fontWeight: '900',
      color: '#5D4037',
        letterSpacing: 1,
    },
serviceVintage: {
  fontSize: 10,
    fontWeight: '700',
      color: '#8D6E63',
        marginTop: 2,
    },
vintageDivider: {
  height: 1,
    backgroundColor: 'rgba(93, 64, 55, 0.2)',
      marginVertical: 8,
    },
servicesListVintage: {
  alignItems: 'center',
    },
  serviceItemVintage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5D4037',
    lineHeight: 16,
    maxWidth: '100%',
  },

vintagePerforation: {
  width: 30,
    alignItems: 'center',
      justifyContent: 'center',
        position: 'relative',
    },
perfLine: {
  width: 1,
    height: '80%',
      borderWidth: 1,
        borderColor: '#5D4037',
          borderStyle: 'dashed',
    },
perfCutoutTop: {
  position: 'absolute',
    top: -15,
      width: 30,
        height: 30,
          borderRadius: 15,
            backgroundColor: '#FFFFFF',
    },
perfCutoutBottom: {
  position: 'absolute',
    bottom: -15,
      width: 30,
        height: 30,
          borderRadius: 15,
            backgroundColor: '#FFFFFF',
    },

ticketStubSection: {
  flex: 1.2,
    padding: 12,
      paddingLeft: 0,
    },
innerStubBorder: {
  flex: 1,
    borderWidth: 1.5,
      borderColor: '#5D4037',
        borderRadius: 12,
          padding: 8,
            alignItems: 'center',
              justifyContent: 'center',
    },
starStubT: { position: 'absolute', top: 6 },
starStubB: { position: 'absolute', bottom: 6 },

barcodeContainer: {
  flexDirection: 'row',
    alignItems: 'flex-end',
      height: 40,
        marginBottom: 8,
    },
barcodeLine: {
  height: '100%',
    backgroundColor: '#5D4037',
      marginHorizontal: 1,
    },
stubOtpText: {
  fontSize: 14,
    fontWeight: '900',
      color: '#5D4037',
        letterSpacing: 2,
          transform: [{ rotate: '0deg' }], // Vertical in image, but horizontal for readability
    },
stubCopyBtn: {
  marginTop: 6,
    padding: 4,
    },
vintageFooterInfo: {
  flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
        marginTop: 16,
          opacity: 0.6,
    },
vintageFooterText: {
  fontSize: 9,
    fontWeight: '800',
      color: '#5D4037',
        marginLeft: 8,
          letterSpacing: 1,
    },
nextStepsCard: {
  backgroundColor: '#FFF',
    borderRadius: 24,
      padding: 24,
        marginTop: 20,
    },
nextStepsTitle: {
  fontSize: 18,
    fontWeight: '800',
      color: '#0F172A',
        marginBottom: 20,
    },
stepItem: {
  flexDirection: 'row',
    alignItems: 'center',
    },
stepCircle: {
  width: 28,
    height: 28,
      borderRadius: 14,
        justifyContent: 'center',
          alignItems: 'center',
    },
stepInfo: {
  marginLeft: 16,
    },
stepName: {
  fontSize: 15,
    fontWeight: '700',
      color: '#0F172A',
    },
  stepDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    maxWidth: '90%',
  },
stepLine: {
  width: 2,
    height: 20,
      backgroundColor: '#F1F5F9',
        marginLeft: 13,
          marginVertical: 4,
    },
calendarActionBtn: {
  flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
        marginTop: 24,
          paddingVertical: 12,
            backgroundColor: '#F8FAFC',
              borderRadius: 14,
    },
calendarBtnText: {
  fontSize: 14,
    fontWeight: '700',
      color: '#0F172A',
        marginLeft: 8,
    },
bottomActionBar: {
  position: 'absolute',
    bottom: 0,
      left: 0,
        right: 0,
          flexDirection: 'row',
            backgroundColor: '#FFF',
              padding: 16,
                borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
    },
homeActionButton: {
  flex: 1,
    height: 56,
      backgroundColor: '#0F172A',
        borderRadius: 18,
          flexDirection: 'row',
            alignItems: 'center',
              justifyContent: 'center',
                shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
    shadowRadius: 20,
      elevation: 10,
    },
homeBtnText: {
  color: '#FFF',
    fontSize: 16,
      fontWeight: '800',
    },
shareReceiptBtn: {
  width: 56,
    height: 56,
      backgroundColor: '#F1F5F9',
        borderRadius: 18,
          marginLeft: 12,
            justifyContent: 'center',
              alignItems: 'center',
    }
  });


