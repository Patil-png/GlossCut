import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  Clipboard,
  ActivityIndicator,
  Linking
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Bell,
  Clock,
  CheckCircle,
  Calendar,
  ShieldAlert,
  Gift,
  Zap,
  MapPin,
  HelpCircle,
  ClipboardList,
  Info,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  XCircle
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, addMinutes } from "date-fns";
import api from "../utils/api";

const { width } = Dimensions.get("window");

// --- 1. BRAND THEMES ---
const getNotificationTheme = (type, isDark) => {
  switch (type?.toLowerCase()) {
    case 'booking':
    case 'appointment':
      return {
        bg: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
        color: '#38BDF8',
        glow: 'rgba(56, 189, 248, 0.45)',
        border: isDark ? 'rgba(56, 189, 248, 0.2)' : '#BAE6FD',
        icon: Calendar,
        label: 'Appointment'
      };
    case 'promo':
    case 'offer':
      return {
        bg: isDark ? 'rgba(251, 191, 36, 0.08)' : '#FEF3C7',
        color: '#FBBF24',
        glow: 'rgba(251, 191, 36, 0.45)',
        border: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FDE68A',
        icon: Gift,
        label: 'Exclusive Deal'
      };
    case 'alert':
    case 'system':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEE2E2',
        color: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.45)',
        border: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FCA5A5',
        icon: ShieldAlert,
        label: 'System Alert'
      };
    default:
      return {
        bg: isDark ? 'rgba(200, 255, 0, 0.06)' : '#F5F4F0',
        color: '#C8FF00',
        glow: 'rgba(200, 255, 0, 0.3)',
        border: isDark ? 'rgba(200, 255, 0, 0.15)' : '#E8E7E2',
        icon: Bell,
        label: 'Notification'
      };
  }
};

const DashedLine = ({ isDark }) => (
  <View style={styles.dashedContainer}>
    {[...Array(34)].map((_, i) => (
      <View key={i} style={[styles.dash, { backgroundColor: isDark ? '#222' : '#E8E7E2' }]} />
    ))}
  </View>
);

const TimelineStep = ({ time, title, desc, completed, current, isErrorState, last, theme, isDark }) => {
  let dotColor = completed 
    ? (isDark ? '#C8FF00' : '#1A1A1A') 
    : (current ? '#C8FF00' : (isDark ? '#2E2E2E' : '#E8E7E2'));

  if (isErrorState) {
    dotColor = '#EF4444';
  }

  return (
    <View style={styles.stepRow}>
      {/* Time column */}
      <View style={styles.stepTimeCol}>
        <Text style={[
          styles.stepTimeText, 
          { color: isErrorState ? '#EF4444' : (completed || current ? theme.colors.text : theme.colors.textSecondary) }
        ]}>
          {time}
        </Text>
      </View>

      {/* Connector column */}
      <View style={styles.stepConnectorCol}>
        <View style={[
          styles.stepDot, 
          { 
            backgroundColor: completed || current ? dotColor : (isDark ? '#141414' : '#F5F4F0'),
            borderColor: isErrorState ? '#EF4444' : (current ? '#C8FF00' : (isDark ? '#2E2E2E' : '#E8E7E2')),
            borderWidth: completed ? 0 : 1.5
          }
        ]}>
          {isErrorState ? (
            <XCircle size={12} color="#EF4444" fill={isDark ? '#141414' : '#FFF'} />
          ) : completed ? (
            <CheckCircle 
              size={11} 
              color={isDark ? '#1A1A1A' : '#FFF'} 
              strokeWidth={3.5} 
              fill={isDark ? '#C8FF00' : '#1A1A1A'} 
            />
          ) : current ? (
            <View style={styles.pulseDot} />
          ) : null}
        </View>
        {!last && (
          <View style={[
            styles.stepLine, 
            { 
              backgroundColor: isErrorState 
                ? '#EF4444' 
                : (completed ? (isDark ? '#C8FF00' : '#1A1A1A') : (isDark ? '#222' : '#E8E7E2')) 
            }
          ]} />
        )}
      </View>

      {/* Title & Desc column */}
      <View style={styles.stepContentCol}>
        <Text style={[
          styles.stepTitle, 
          { color: isErrorState ? '#EF4444' : (completed || current ? theme.colors.text : theme.colors.textSecondary) }
        ]}>
          {title}
        </Text>
        <Text style={[styles.stepDesc, { color: theme.colors.textSecondary }]}>{desc}</Text>
      </View>
    </View>
  );
};

const checkIsBookingRelated = (notification) => {
  if (!notification) return false;
  const type = notification.type?.toLowerCase();
  if (['booking', 'appointment'].includes(type)) return true;
  
  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();
  return (
    title.includes('booking') ||
    title.includes('appointment') ||
    title.includes('queue') ||
    title.includes('walk-in') ||
    message.includes('booking') ||
    message.includes('appointment') ||
    message.includes('cancelled')
  );
};

const NotificationDetailScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notification } = route.params || {};
  const insets = useSafeAreaInsets();

  const [copied, setCopied] = useState(false);
  const [liveBooking, setLiveBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  const nTheme = getNotificationTheme(notification?.type, isDark);
  const TypeIcon = nTheme.icon;

  const isFocused = useIsFocused();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true
      })
    ]).start();

    // 1. Mark notification as read
    const markAsRead = async () => {
      if (!notification?._id) return;
      try {
        await api.put(`/api/notifications/${notification._id}/read`);
      } catch (err) { }
    };
    markAsRead();
  }, [notification]);

  // Live polling for booking updates
  useEffect(() => {
    const isBookingRelated = checkIsBookingRelated(notification);
    if (!isBookingRelated) return;

    let isMounted = true;
    let cachedBookingId = notification?.relatedId || notification?.bookingId;

    const fetchLatestBooking = async (showLoader = false) => {
      if (showLoader) setLoadingBooking(true);
      try {
        let activeId = cachedBookingId;

        // SMART FALLBACK: If booking ID is missing, query the booking history
        if (!activeId) {
          const historyRes = await api.get('/api/booking/history');
          if (!isMounted) return;
          
          if (historyRes.data && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
            const bookings = historyRes.data;
            const msgLower = (notification.message || '').toLowerCase();
            
            // Try to match barber name
            let matchedBooking = bookings.find(b => {
              const barberName = b.barberId?.name;
              return barberName && msgLower.includes(barberName.toLowerCase());
            });

            // Try to match status matching notification title keywords
            if (!matchedBooking) {
              const titleLower = (notification.title || '').toLowerCase();
              if (titleLower.includes('cancel') || msgLower.includes('cancel')) {
                matchedBooking = bookings.find(b => b.status === 'cancelled');
              } else if (titleLower.includes('complete') || msgLower.includes('complete')) {
                matchedBooking = bookings.find(b => b.status === 'completed');
              } else if (titleLower.includes('started') || msgLower.includes('started')) {
                matchedBooking = bookings.find(b => b.status === 'started');
              } else if (titleLower.includes('confirm') || msgLower.includes('confirm')) {
                matchedBooking = bookings.find(b => ['confirmed', 'started'].includes(b.status));
              }
            }

            // Fallback to absolute latest booking
            if (!matchedBooking) {
              matchedBooking = bookings[0];
            }

            if (matchedBooking) {
              activeId = matchedBooking._id;
              cachedBookingId = activeId; // Cache it for subsequent polls
            }
          }
        }

        if (activeId) {
          const res = await api.get(`/api/booking/${activeId}`);
          if (!isMounted) return;
          if (res.data) {
            setLiveBooking(res.data);
          }
        }
      } catch (err) {
        console.log("Error loading dynamic notification booking details:", err.message);
      } finally {
        if (showLoader) setLoadingBooking(false);
      }
    };

    // Run first fetch immediately on mount/focus
    if (isFocused) {
      fetchLatestBooking(liveBooking === null);
    }

    // Polling interval of 1 minute when screen is active
    let intervalId = null;
    if (isFocused) {
      intervalId = setInterval(() => {
        fetchLatestBooking(false);
      }, 60000);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [notification, isFocused]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleViewSalon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shopName = liveBooking?.barberId?.shopName || notification?.shopName || 'GlossCut Studio';
    const shopAddress = liveBooking?.barberId?.shopAddress || notification?.shopAddress || '';
    const coords = liveBooking?.barberId?.shopCoordinates || notification?.shopCoordinates;
    
    let lat = null;
    let lng = null;
    if (coords && coords.length === 2) {
      lng = coords[0];
      lat = coords[1];
    }

    let mapUrl = '';
    if (lat && lng) {
      mapUrl = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(shopName)}&ll=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(shopName)})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });
    } else {
      const query = encodeURIComponent(`${shopName} ${shopAddress}`);
      mapUrl = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`
      });
    }

    Linking.openURL(mapUrl).catch(err => {
      console.log('Error opening maps app:', err);
      const webQuery = encodeURIComponent(`${shopName} ${shopAddress}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${webQuery}`);
    });
  };

  const copyToClipboard = () => {
    const code = liveBooking?.otp || notification?.otp || 'N/A';
    Clipboard.setString(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!notification) return null;

  // Determine current live statuses
  const rawStatus = liveBooking?.status || notification?.status || 'pending';
  const status = rawStatus.toLowerCase();
  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed' || status === 'assigned' || status === 'started' || status === 'completed';
  const isStarted = status === 'started' || status === 'completed';
  const isCompleted = status === 'completed' || status === 'success';
  const isCancelled = status === 'cancelled';

  // Dynamic time helpers for timeline
  const getFormattedTime = (dateInput) => {
    if (!dateInput) return null;
    try {
      const d = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
      return format(d, 'h:mm a');
    } catch (e) {
      return null;
    }
  };

  const baseTime = notification.createdAt ? parseISO(notification.createdAt) : new Date();
  const timeLogged = getFormattedTime(notification.createdAt) || format(baseTime, 'h:mm a');
  const timeConfirmed = (isConfirmed || isCompleted) ? (getFormattedTime(liveBooking?.createdAt) || getFormattedTime(notification.createdAt) || format(addMinutes(baseTime, 3), 'h:mm a')) : '--:--';
  const timeCompleted = isCompleted ? (getFormattedTime(liveBooking?.updatedAt) || format(new Date(), 'h:mm a')) : '--:--';
  const timeCancelled = isCancelled ? (getFormattedTime(liveBooking?.updatedAt) || format(new Date(), 'h:mm a')) : '--:--';

  // Dynamic values based on live booking response
  const displayShop = liveBooking?.barberId?.shopName || notification?.shopName || 'GlossCut Studio';
  const displayBarber = liveBooking?.barberId?.name || notification?.providerName || 'Specialist';
  const isBooking = checkIsBookingRelated(notification);
  const displayServices = isBooking 
    ? (liveBooking?.services?.map(s => s.name).join(', ') || 'Loading services...') 
    : (notification?.message || '');
  const displayPrice = liveBooking?.totalPrice 
    ? `₹${Number(liveBooking.totalPrice).toFixed(0)}` 
    : (notification?.totalPrice ? `₹${notification.totalPrice}` : 'Calculated at Shop');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- FLOATING HEADER --- */}
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={98}
        style={[styles.blurHeader, { paddingTop: insets.top, borderBottomColor: theme.colors.border }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={[styles.backBtnCircle, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: theme.colors.border }]}>
            <ArrowLeft size={16} color={theme.colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>Transaction Activity</Text>
          <View style={{ width: 34 }} />
        </View>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 72, paddingBottom: 130 }]}
      >
        {/* --- PROFESSIONAL TICKET CARD --- */}
        <Animated.View style={[
          styles.ticketCard, 
          { 
            backgroundColor: theme.colors.card, 
            borderColor: theme.colors.border,
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }] 
          }
        ]}>
          {/* HEADER ROW WITH GLOW */}
          <View style={styles.cardHeaderRow}>
            <View style={[
              styles.iconContainer, 
              { 
                backgroundColor: isCancelled ? (isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEE2E2') : nTheme.bg, 
                borderColor: isCancelled ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FCA5A5') : nTheme.border,
                shadowColor: isCancelled ? '#EF4444' : nTheme.glow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.35 : 0.18,
                shadowRadius: 10,
              }
            ]}>
              {isCancelled ? (
                <XCircle size={18} color="#EF4444" strokeWidth={2.2} />
              ) : (
                <TypeIcon size={18} color={isDark ? nTheme.color : '#1A1A1A'} strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[styles.cardTag, { color: isCancelled ? '#EF4444' : (isDark ? nTheme.color : '#606058') }]}>
                {isCancelled ? 'CANCELLED' : nTheme.label.toUpperCase()}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {isCancelled ? 'Appointment Cancelled' : notification.title}
              </Text>
            </View>
          </View>

          {/* DYNAMIC CARD CALLOUT BLOCK */}
          <View style={styles.descriptionSection}>
            <View style={[styles.calloutBox, { backgroundColor: isDark ? '#161618' : '#FAF9F6', borderColor: theme.colors.border }]}>
              <View style={[styles.accentBar, { backgroundColor: isCancelled ? '#EF4444' : (isDark ? '#C8FF00' : '#1A1A1A') }]} />
              <Text style={[styles.calloutText, { color: theme.colors.textSecondary }]}>
                {isCancelled 
                  ? (liveBooking?.cancellationReason || 'This booking has been cancelled and its slot was released.') 
                  : notification.message}
              </Text>
            </View>

            {/* LIVE ACTION TRIGGER BUTTON INSIDE CARD */}
            {liveBooking && (isPending || isConfirmed) && (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('TrackQueue', { trackingId: liveBooking.queueTrackingId || liveBooking._id });
                }}
                style={[styles.cardActionBtn, { backgroundColor: isDark ? '#2E2E2E' : '#1A1A1A' }]}
              >
                <TrendingUp size={14} color="#C8FF00" />
                <Text style={styles.cardActionBtnText}>Track Queue in Real-Time</Text>
                <ChevronRight size={14} color="#C8FF00" />
              </TouchableOpacity>
            )}

            {liveBooking && isCompleted && (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('BookingDetailScreen', { booking: liveBooking });
                }}
                style={[styles.cardActionBtn, { backgroundColor: isDark ? '#2E2E2E' : '#1A1A1A' }]}
              >
                <ClipboardList size={14} color="#C8FF00" />
                <Text style={styles.cardActionBtnText}>View Invoice & Review</Text>
                <ChevronRight size={14} color="#C8FF00" />
              </TouchableOpacity>
            )}
          </View>

          {isBooking && (
            <>
              {/* TRANSITIONAL CUTOUT SEPARATOR */}
              <View style={styles.separatorContainer}>
                <View style={[styles.sideCutoutLeft, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} />
                <DashedLine isDark={isDark} />
                <View style={[styles.sideCutoutRight, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} />
              </View>

              {/* PREMIUM TRANSACTION TABLE */}
              <View style={styles.tableSection}>
                <View style={styles.tableRow}>
                  <View style={styles.rowLabelCol}>
                    <Calendar size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Shop / Barber</Text>
                  </View>
                  <Text style={[styles.rowValue, { color: theme.colors.text }]} numberOfLines={1}>
                    {displayShop} • {displayBarber}
                  </Text>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.tableRow}>
                  <View style={styles.rowLabelCol}>
                    <Clock size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Time & Services</Text>
                  </View>
                  <Text style={[styles.rowValue, { color: theme.colors.text }]} numberOfLines={1}>
                    {liveBooking?.time || timeLogged} ({displayServices})
                  </Text>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.tableRow}>
                  <View style={styles.rowLabelCol}>
                    <ClipboardList size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Verification OTP</Text>
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={copyToClipboard}
                    style={[styles.copyableBadge, { backgroundColor: isDark ? '#1C1C1E' : '#F0EFE9', borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.rowValueMonospace, { color: theme.colors.text }]}>
                      {liveBooking?.otp || notification?.otp || 'N/A'}
                    </Text>
                    {copied ? (
                      <Check size={11} color="#C8FF00" strokeWidth={3} />
                    ) : (
                      <Copy size={10} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.tableRow}>
                  <View style={styles.rowLabelCol}>
                    <Info size={13} color={theme.colors.textSecondary} />
                    <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>Live Status / Price</Text>
                  </View>
                  <View style={styles.statusBadgeRow}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: isCancelled ? '#EF4444' : (isCompleted ? '#22C55E' : (isConfirmed ? '#C8FF00' : '#E8E7E2')) }
                    ]} />
                    <Text style={[styles.statusBadgeText, { color: theme.colors.text }]}>
                      {status.toUpperCase()} ({displayPrice})
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {isBooking && (
          /* --- LIVE DHL-STYLE TIMELINE --- */
          <Animated.View style={[styles.progressSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>LIVE TIMELINE</Text>
            <View style={[styles.progressCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <TimelineStep
                time={timeLogged}
                title="Notification Logged"
                desc="GlossCut registered and confirmed transaction log activity."
                completed
                theme={theme}
                isDark={isDark}
              />

              {isCancelled ? (
                <TimelineStep
                  time={timeCancelled}
                  title="Booking Cancelled"
                  desc="The appointment reservation was cancelled and slot released."
                  completed={false}
                  current={false}
                  isErrorState
                  last
                  theme={theme}
                  isDark={isDark}
                />
              ) : (
                <>
                  <TimelineStep
                    time={timeConfirmed}
                    title={isPending ? "Awaiting Confirmation" : "Booking Confirmed"}
                    desc={isPending ? "Connecting with professional specialist..." : "Appointment accepted and scheduled."}
                    completed={isConfirmed}
                    current={isPending}
                    theme={theme}
                    isDark={isDark}
                  />
                  <TimelineStep
                    time={isStarted ? (getFormattedTime(liveBooking?.startedAt) || timeConfirmed) : '--:--'}
                    title={isCompleted ? "Session Started" : (status === 'started' ? "Grooming In Progress" : "Grooming Session")}
                    desc={isCompleted ? "Your grooming session was successfully completed." : (status === 'started' ? "Your grooming session is underway!" : "Please head to the chair when called.")}
                    completed={isStarted}
                    current={status === 'confirmed'}
                    theme={theme}
                    isDark={isDark}
                  />
                  <TimelineStep
                    time={timeCompleted}
                    title="Session Finalized"
                    desc="All booking records and service logs are compiled."
                    completed={isCompleted}
                    current={status === 'started'}
                    last
                    theme={theme}
                    isDark={isDark}
                  />
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* --- ASSISTANCE LINKS --- */}
        <View style={styles.helpSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>CUSTOMER ASSISTANCE</Text>
          <View style={styles.helpGrid}>
            <TouchableOpacity 
              activeOpacity={0.85} 
              style={[styles.helpButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Chat');
              }}
            >
              <HelpCircle size={15} color={theme.colors.text} />
              <Text style={[styles.helpBtnText, { color: theme.colors.text }]}>Help Support</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.85} 
              style={[styles.helpButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
              onPress={handleViewSalon}
            >
              <MapPin size={15} color={theme.colors.text} />
              <Text style={[styles.helpBtnText, { color: theme.colors.text }]}>View Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- STICKY FOOTER --- */}
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={98}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), borderTopColor: theme.colors.border }]}
      >
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.primaryAction} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Home');
          }}
        >
          <LinearGradient
            colors={isDark ? ['#C8FF00', '#D4FF40'] : ['#1A1A1A', '#2E2E2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={[styles.actionText, { color: isDark ? '#1A1A1A' : '#FFFFFF' }]}>Return to Dashboard</Text>
            <Zap size={14} color={isDark ? '#1A1A1A' : '#C8FF00'} fill={isDark ? '#1A1A1A' : '#C8FF00'} />
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
  },
  headerContent: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  backBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  navTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2
  },
  scrollContent: {
    paddingHorizontal: 16
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.02,
    shadowRadius: 24,
    elevation: 3
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  headerTextCol: {
    flex: 1
  },
  cardTag: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  calloutBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    overflow: "hidden"
  },
  accentBar: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 10
  },
  calloutText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500"
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 8,
    marginTop: 10,
    gap: 6
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF"
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    overflow: "hidden"
  },
  sideCutoutLeft: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    marginLeft: -8,
    zIndex: 10
  },
  sideCutoutRight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    marginRight: -8,
    zIndex: 10
  },
  dashedContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4
  },
  dash: {
    width: 3.5,
    height: 1,
    borderRadius: 0.5
  },
  tableSection: {
    padding: 16,
    gap: 12
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rowLabelCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  rowLabel: {
    fontSize: 11.5,
    fontWeight: "600"
  },
  rowValue: {
    fontSize: 11.5,
    fontWeight: "800",
    maxWidth: width * 0.5
  },
  copyableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  rowValueMonospace: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: -0.2
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  progressSection: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4
  },
  progressCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 44
  },
  stepTimeCol: {
    width: 54,
    paddingRight: 6,
    justifyContent: "flex-start",
  },
  stepTimeText: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 2
  },
  stepConnectorCol: {
    alignItems: "center",
    width: 14,
    marginRight: 10
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    marginTop: 3
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C8FF00'
  },
  stepLine: {
    width: 1.2,
    flex: 1,
    marginTop: 2,
    marginBottom: -4,
    zIndex: 1
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 12
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 1
  },
  stepDesc: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "500"
  },
  helpSection: {
    marginTop: 20
  },
  helpGrid: {
    flexDirection: "row",
    gap: 8
  },
  helpButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1
  },
  helpBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  primaryAction: {
    height: 46,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2
  }
});

export default NotificationDetailScreen;
