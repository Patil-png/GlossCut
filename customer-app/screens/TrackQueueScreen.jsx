import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Animated, Easing, Alert, Dimensions, RefreshControl, Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, Users, AlertCircle, ArrowLeft, RefreshCcw, Clock,
  ShieldCheck, CheckCircle, Scissors, MapPin, Info, Gift, ChevronRight, Star, Sparkles,
  Check, Play, Flag
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import io from 'socket.io-client';
import api, { API_URL } from "../utils/api";
import { format } from "date-fns";

const { width } = Dimensions.get('window');

// --- SUB-COMPONENTS ---

const AppointmentCard = memo(({ appointment, index, isLast }) => {
  const isStarted = appointment.status === "started";
  const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;

  return (
    <View style={styles.feedItem}>
      <View style={styles.feedTimeline}>
        <View style={[styles.timelineDot, isStarted && styles.timelineDotActive]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={[styles.feedCard, isStarted && styles.feedCardActive]}>
        <View style={styles.feedCardTop}>
          <View style={styles.feedAvatar}>
            <Text style={styles.feedAvatarText}>{(appointment.userId?.name || appointment.customerName || "C")[0]}</Text>
          </View>
          <View style={styles.feedInfo}>
            <Text style={styles.feedName} numberOfLines={1}>{appointment.userId?.name || appointment.customerName || "Customer"}</Text>
            <View style={styles.feedBadgeRow}>
              <Text style={styles.feedPos}>TOKEN #{index + 1}</Text>
              {isExpress && <View style={styles.expressPill}><Text style={styles.expressPillText}>EXPRESS</Text></View>}
            </View>
          </View>
          {isStarted ? (
            <View style={styles.liveTag}><Text style={styles.liveTagText}>IN CHAIR</Text></View>
          ) : (
            <Text style={styles.waitTag}>WAITING</Text>
          )}
        </View>
      </View>
    </View>
  );
});

const TrackQueueScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const urlTrackingId = route.params?.trackingId;

  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Queue List State
  const [appointments, setAppointments] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [hasPreviousBooking, setHasPreviousBooking] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [activeBookingLoading, setActiveBookingLoading] = useState(false);

  // Live Tracker State for 'started' appointments
  const [nowTick, setNowTick] = useState(Date.now());
  const [timeOffset, setTimeOffset] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Sync time with server
  useEffect(() => {
    const syncTime = async () => {
      try {
        const res = await api.get('/api/booking/server-time');
        if (res.data.success && res.data.serverTimeMs) {
          const localTime = Date.now();
          const offset = res.data.serverTimeMs - localTime;
          setTimeOffset(offset);
          setNowTick(localTime + offset);
        }
      } catch (err) {
        console.error("Failed to sync server time", err);
      }
    };
    syncTime();
  }, []);

  // Update tick for active appointments
  useEffect(() => {
    let interval;
    if (queueData?.status === 'started') {
      interval = setInterval(() => {
        setNowTick(Date.now() + timeOffset);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [queueData?.status, timeOffset]);

  const fetchQueuePosition = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      if (!id) return;
      const searchId = id.length === 6 ? id.toUpperCase() : id;
      const res = await api.get(`/api/booking/track/${searchId}`);

      if (res.data.success) {
        setQueueData(res.data.data);
        setAutoRefresh(true);

        if (res.data.data.barberId) {
          fetchQueueList(res.data.data.barberId);
        }

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1)), useNativeDriver: true })
        ]).start();
      } else {
        setError(res.data.msg || 'Booking not found');
        setQueueData(null);
        setAutoRefresh(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setAutoRefresh(false);
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const checkHistory = async () => {
      if (!queueData?.barberId) return;
      try {
        const res = await api.get('/api/booking/history');
        if (res.data && Array.isArray(res.data)) {
          const pastWithBarber = res.data.some(b =>
            (b.barberId?._id === queueData.barberId || b.barberId === queueData.barberId) &&
            b.status === 'completed'
          );
          setHasPreviousBooking(pastWithBarber);
        }
      } catch (err) {
        console.log("History check failed");
      }
    };
    checkHistory();
  }, [queueData?.barberId]);

  const fetchQueueList = useCallback(async (barberId) => {
    setListLoading(true);
    try {
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const res = await api.get(`/api/booking/website/barber-queue/${barberId}`, {
        params: { date: dateStr }
      });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Queue List Error:", err);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlTrackingId) {
      fetchQueuePosition(urlTrackingId);
    }
  }, [urlTrackingId, fetchQueuePosition]);

  useEffect(() => {
    const fetchActiveAndHistory = async () => {
      if (urlTrackingId) return;
      setActiveBookingLoading(true);
      try {
        const activeRes = await api.get('/api/booking/active');
        if (activeRes.data.success && activeRes.data.activeBooking) {
          setActiveBooking(activeRes.data.activeBooking);
        }
      } catch (err) {
        console.log("Auto-fetch failed", err);
      } finally {
        setActiveBookingLoading(false);
      }
    };
    fetchActiveAndHistory();
  }, [urlTrackingId, fetchQueuePosition]);

  useEffect(() => {
    let interval;
    let socket;

    if (queueData && autoRefresh) {
      socket = io(API_URL, { transports: ['websocket'] });

      socket.on('connect', () => {
        socket.emit('join', `booking_${queueData.bookingId}`);
      });

      socket.on('booking_status_update', (data) => {
        if (data.status) {
          fetchQueuePosition(queueData.trackingId, true);
        }
      });

      socket.on('almost_ready_call', (data) => {
        Alert.alert(
          "🚨 YOU ARE UP NEXT! 🚨",
          `Your barber is almost ready for you! Please head to the shop within the next 10 minutes to avoid losing your spot.`
        );
        fetchQueuePosition(queueData.trackingId, true);
      });

      interval = setInterval(() => {
        fetchQueuePosition(queueData.trackingId, true);
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [queueData, autoRefresh, fetchQueuePosition]);

  const handleSubmit = () => {
    if (trackingId.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      fetchQueuePosition(trackingId.trim());
    }
  };

  const SEARCH_ILLUSTRATION = require("../assets/images/search_doodle.png");
  const HERO_ILLUSTRATION = require("../assets/images/waiting_doodle.png");

  const sortedAppointments = useMemo(() => {
    const activeRaw = appointments.filter(app => ["confirmed", "started"].includes(app.status));
    activeRaw.sort((a, b) => {
      if (a.status === 'started' && b.status !== 'started') return -1;
      if (b.status === 'started' && a.status !== 'started') return 1;
      const isExpress = (app) => (app.appointmentType?.toLowerCase().includes("express") || app.isPromoted);
      const aIsExpress = isExpress(a);
      const bIsExpress = isExpress(b);
      if (aIsExpress && !bIsExpress) return -1;
      if (bIsExpress && !aIsExpress) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    return activeRaw;
  }, [appointments]);

  const getRemainingTime = () => {
    if (!queueData || queueData.status !== 'started') return null;
    const baseMins = queueData.baseDuration || 30;
    const offset = queueData.durationOffset || 0;
    const totalMins = baseMins + offset;
    const elapsedMs = nowTick - new Date(queueData.startedAt).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    return totalMins - elapsedMinutes;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => queueData ? fetchQueuePosition(queueData.trackingId) : null}
          disabled={!queueData || loading}
        >
          <RefreshCcw size={18} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => queueData ? fetchQueuePosition(queueData.trackingId) : null} tintColor="#4C763B" />
        }
      >
        {!queueData ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchHero}>
              <View style={styles.heroImageWrapper}>
                <Image
                  source={SEARCH_ILLUSTRATION}
                  style={styles.searchIllustration}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.searchHeroTitle}>Check your position</Text>
              <Text style={styles.searchHeroSub}>Enter the 6-digit tracking ID found on your booking receipt or SMS.</Text>
            </View>

            <View style={styles.searchForm}>
              <View style={styles.idInputBox}>
                <TextInput
                  style={styles.idInput}
                  placeholder="X X X X X X"
                  placeholderTextColor="#94A3B8"
                  value={trackingId}
                  onChangeText={setTrackingId}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                style={[styles.mainSubmitBtn, (trackingId?.length || 0) < 6 && styles.mainSubmitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading || activeBookingLoading || (trackingId?.length || 0) < 6}
              >
                {loading || activeBookingLoading ? (
                  <RefreshCcw size={22} color="#FFF" />
                ) : (
                  <Text style={styles.mainSubmitBtnText}>Track My Turn</Text>
                )}
              </TouchableOpacity>
            </View>
            {error && (
              <View style={styles.errorPill}>
                <AlertCircle size={14} color="#FFF" />
                <Text style={styles.errorPillText}>{error}</Text>
              </View>
            )}

            {activeBooking && (
              <TouchableOpacity
                style={styles.activeShortcutCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  const tid = activeBooking.queueTrackingId || activeBooking._id;
                  setTrackingId(tid);
                  fetchQueuePosition(tid);
                }}
              >
                <View style={styles.shortcutIconBox}><CheckCircle size={20} color="#FFF" /></View>
                <View style={styles.shortcutText}>
                  <Text style={styles.shortcutLabel}>ACTIVE APPOINTMENT DETECTED</Text>
                  <Text style={styles.shortcutValue}>{activeBooking.barberId?.shopName || "Live Session"}</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View style={[styles.trackerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={styles.activeHeroSection}>
              <View style={styles.heroDoodleWrapper}>
                <Image
                  source={HERO_ILLUSTRATION}
                  style={styles.activeHeroImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.heroTextContent}>
                <Text style={styles.heroShopName}>{queueData.shopName}</Text>
                <Text style={styles.heroWelcome}>Your turn is getting closer! ✂️</Text>
              </View>
            </View>

            {/* Journey Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}><Check size={12} color="#FFF" /></View>
                <Text style={styles.stepLabel}>Booked</Text>
              </View>
              <View style={styles.stepLineActive} />
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, queueData.status !== 'completed' && styles.stepCircleActive]}>
                  {queueData.status === 'started' ? <Check size={12} color="#FFF" /> : <Clock size={12} color="#FFF" />}
                </View>
                <Text style={styles.stepLabel}>In Queue</Text>
              </View>
              <View style={[styles.stepLine, queueData.status === 'started' && styles.stepLineActive]} />
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, queueData.status === 'started' && styles.stepCircleStarted]}>
                  <Scissors size={12} color={queueData.status === 'started' ? "#FFF" : "#CBD5E1"} />
                </View>
                <Text style={styles.stepLabel}>In Chair</Text>
              </View>
            </View>

            {/* Primary Status Card */}
            <View style={styles.heroCard}>
              {queueData.status === 'cancelled' ? (
                <View style={styles.cancelledState}>
                  <View style={styles.cancelIconBox}><Flag size={32} color="#EF4444" /></View>
                  <Text style={styles.cancelledHeading}>Booking Cancelled</Text>
                  <Text style={styles.cancelledSubtext}>{queueData.cancellationReason || "The session was cancelled by the venue."}</Text>
                </View>
              ) : (
                <View style={styles.heroContent}>
                  <View style={styles.posDisplay}>
                    <View style={styles.posOuterRing}>
                      <Text style={styles.posLabel}>POSITION</Text>
                      <Text style={styles.posVal}>#{queueData.queuePosition}</Text>
                    </View>
                  </View>

                  <View style={styles.etaBox}>
                    {queueData.status === 'started' ? (
                      <View style={styles.liveIndicator}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.liveText}>LIVE SESSION IN PROGRESS</Text>
                      </View>
                    ) : (
                      <View style={styles.waitInfo}>
                        <Text style={styles.etaTitle}>Estimated Wait</Text>
                        <Text style={styles.etaValue}>
                          {queueData.estimatedWaitRange
                            ? `${queueData.estimatedWaitRange.min}-${queueData.estimatedWaitRange.max}`
                            : queueData.estimatedWaitMinutes || '--'}
                          <Text style={styles.etaUnit}> mins</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Venue & Barber Details */}
            <View style={styles.venueCard}>
              <View style={styles.venueTop}>
                <View style={styles.venueIconBox}><MapPin size={20} color="#4C763B" /></View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{queueData.shopName}</Text>
                  <Text style={styles.venueBarber}>with {queueData.barberName}</Text>
                </View>
                <View style={styles.venueStatusPill}><Text style={styles.venueStatusText}>{queueData.status.toUpperCase()}</Text></View>
              </View>
              <View style={styles.venueFooter}>
                <View style={styles.footerItem}><Clock size={14} color="#64748B" /><Text style={styles.footerText}>{queueData.bookingTime}</Text></View>
                <View style={styles.footerItem}><ShieldCheck size={14} color="#64748B" /><Text style={styles.footerText}>Verified Turn</Text></View>
              </View>
            </View>

            {/* Live Queue Feed */}
            <View style={styles.feedSection}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>LIVE QUEUE FEED</Text>
                <View style={styles.livePulsePill}><View style={styles.smallPulseDot} /><Text style={styles.livePillText}>UPDATED JUST NOW</Text></View>
              </View>

              {listLoading ? (
                <View style={styles.feedEmpty}><RefreshCcw size={20} color="#CBD5E1" /></View>
              ) : sortedAppointments.length === 0 ? (
                <View style={styles.feedEmpty}><Text style={styles.feedEmptyText}>Queue is currently empty</Text></View>
              ) : (
                <View style={styles.feedList}>
                  {sortedAppointments.map((item, idx) => (
                    <AppointmentCard key={item._id} appointment={item} index={idx} isLast={idx === sortedAppointments.length - 1} />
                  ))}
                </View>
              )}
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF' },
  backIconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 },
  headerActionButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 40 },
  searchContainer: { padding: 24, alignItems: 'center' },
  heroImageWrapper: {
    width: 200,
    height: 200,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIllustration: {
    width: '100%',
    height: '100%',
  },
  searchHero: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  searchIconRing: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#DCFCE7' },
  searchHeroTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, marginBottom: 8 },
  searchHeroSub: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  searchForm: { width: '100%', gap: 16 },
  idInputBox: { backgroundColor: '#FFF', borderRadius: 20, height: 72, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  idInput: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: 8, textAlign: 'center', width: '100%' },
  mainSubmitBtn: { height: 64, backgroundColor: '#0F172A', borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  mainSubmitBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  mainSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  errorPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 20, gap: 8 },
  errorPillText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  activeShortcutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 40, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 },
  shortcutIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#4C763B', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  shortcutText: { flex: 1 },
  shortcutLabel: { fontSize: 10, fontWeight: '900', color: '#4C763B', letterSpacing: 1, marginBottom: 2 },
  shortcutValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  trackerContainer: { padding: 20 },
  activeHeroSection: {
    height: 220,
    width: '100%',
    borderRadius: 32,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heroDoodleWrapper: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  activeHeroImage: {
    width: '100%',
    height: '100%',
  },
  heroTextContent: {
    alignItems: 'center',
  },
  heroShopName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  heroWelcome: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 30 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#4C763B' },
  stepCircleStarted: { backgroundColor: '#F59E0B' },
  stepLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#F1F5F9', marginTop: -18, marginHorizontal: 4 },
  stepLineActive: { flex: 1, height: 2, backgroundColor: '#4C763B', marginTop: -18, marginHorizontal: 4 },
  heroCard: { backgroundColor: '#0F172A', borderRadius: 36, padding: 30, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 10 },
  heroContent: { alignItems: 'center' },
  posDisplay: { marginBottom: 20 },
  posOuterRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  posLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: -4 },
  posVal: { fontSize: 56, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  etaBox: { width: '100%', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B98120', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#10B98140' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  liveText: { fontSize: 12, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
  waitInfo: { alignItems: 'center' },
  etaTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  etaValue: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  etaUnit: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  cancelledState: { alignItems: 'center', padding: 10 },
  cancelIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EF444420', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  cancelledHeading: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  cancelledSubtext: { fontSize: 14, color: '#FCA5A5', textAlign: 'center', lineHeight: 20 },
  venueCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.02, shadowRadius: 20, elevation: 2 },
  venueTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  venueIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  venueBarber: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  venueStatusPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  venueStatusText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  venueFooter: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F8FAFC', gap: 20 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  feedSection: { marginTop: 10 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  feedTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 2 },
  livePulsePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  smallPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  livePillText: { fontSize: 9, fontWeight: '900', color: '#64748B' },
  feedList: { gap: 12 },
  feedItem: { flexDirection: 'row', gap: 16 },
  feedTimeline: { width: 20, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#FFF', marginTop: 16, zIndex: 2 },
  timelineDotActive: { backgroundColor: '#10B981' },
  timelineLine: { position: 'absolute', top: 28, bottom: -12, width: 2, backgroundColor: '#F1F5F9' },
  feedCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  feedCardActive: { borderColor: '#10B98140', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  feedCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  feedAvatarText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  feedInfo: { flex: 1 },
  feedName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  feedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedPos: { fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  expressPill: { backgroundColor: '#F59E0B20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  expressPillText: { fontSize: 8, fontWeight: '900', color: '#F59E0B' },
  liveTag: { backgroundColor: '#10B98115', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  liveTagText: { fontSize: 10, fontWeight: '900', color: '#10B981' },
  waitTag: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  feedEmpty: { padding: 60, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  feedEmptyText: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
});

export default TrackQueueScreen;
