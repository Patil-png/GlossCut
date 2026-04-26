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
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- THEME COLORS ---
const COLORS = {
  primary: '#4C763B',
  primaryGradient: ['#4C763B', '#22C55E'],
  black: '#1C1C1E',
  dark: '#0F172A',
  white: '#FFFFFF',
  gray: {
    50: '#F8F9FB',
    100: '#F1F5F9',
    200: '#E2E8F0',
    400: '#94A3B8',
    600: '#64748B',
    900: '#1C1C1E',
  },
  status: {
    started: { bg: 'rgba(0, 191, 165, 0.1)', text: '#00695C', border: '#00BFA5' },
    pending: { bg: 'rgba(41, 121, 255, 0.1)', text: '#1565C0', border: '#2979FF' },
    confirmed: { bg: 'rgba(106, 27, 154, 0.1)', text: '#6A1B9A', border: '#6A1B9A' },
    completed: { bg: 'rgba(76, 175, 80, 0.1)', text: '#2E7D32', border: '#4CAF50' },
    cancelled: { bg: 'rgba(239, 83, 80, 0.1)', text: '#C62828', border: '#EF5350' },
  }
};

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
      }, 30000); // Match website's 30s
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
    if (urlTrackingId) {
      fetchQueuePosition(urlTrackingId);
    }
  }, [urlTrackingId, fetchQueuePosition]);

  useEffect(() => {
    const fetchActive = async () => {
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
    fetchActive();
  }, [urlTrackingId]);

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

  const getRemainingTime = () => {
    if (!queueData || queueData.status !== 'started') return null;
    const baseMins = queueData.baseDuration || 30;
    const offset = queueData.durationOffset || 0;
    const totalMins = baseMins + offset;
    const elapsedMs = nowTick - new Date(queueData.startedAt).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const rem = totalMins - elapsedMinutes;
    return rem;
  };

  const SEARCH_ILLUSTRATION = require("../assets/images/search_doodle.png");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Background Decor */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.black} strokeWidth={3} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSubtitle}>LIVE STATUS</Text>
          <Text style={styles.headerTitle}>Queue Tracker</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => queueData ? fetchQueuePosition(queueData.trackingId) : null}
          disabled={!queueData || loading}
        >
          <RefreshCcw size={18} color={COLORS.black} strokeWidth={3} className={loading ? 'animate-spin' : ''} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => queueData ? fetchQueuePosition(queueData.trackingId) : null} tintColor={COLORS.primary} />
        }
      >
        {!queueData ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchHero}>
              <View style={styles.heroImageWrapper}>
                <Image source={SEARCH_ILLUSTRATION} style={styles.searchIllustration} resizeMode="contain" />
              </View>
              <Text style={styles.searchHeroTitle}>Check your position</Text>
              <Text style={styles.searchHeroSub}>Enter the 6-digit tracking ID found on your booking receipt or SMS.</Text>
            </View>

            <View style={styles.searchForm}>
              <View style={styles.idInputBox}>
                <TextInput
                  style={styles.idInput}
                  placeholder="X X X X X X"
                  placeholderTextColor={COLORS.gray[400]}
                  value={trackingId}
                  onChangeText={(val) => setTrackingId(val.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                style={styles.mainSubmitBtnContainer}
                onPress={handleSubmit}
                disabled={loading || activeBookingLoading || (trackingId?.length || 0) < 6}
              >
                <LinearGradient
                  colors={COLORS.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.mainSubmitBtn, (trackingId?.length || 0) < 6 && { opacity: 0.5 }]}
                >
                  {loading || activeBookingLoading ? (
                    <RefreshCcw size={22} color="#FFF" />
                  ) : (
                    <Text style={styles.mainSubmitBtnText}>Track Queue</Text>
                  )}
                </LinearGradient>
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
                <View style={styles.shortcutIconBox}>
                  <LinearGradient colors={COLORS.primaryGradient} style={styles.shortcutIconGradient}>
                    <CheckCircle size={20} color="#FFF" />
                  </LinearGradient>
                </View>
                <View style={styles.shortcutText}>
                  <Text style={styles.shortcutLabel}>ACTIVE BOOKING FOUND</Text>
                  <Text style={styles.shortcutValue}>{activeBooking.barberId?.shopName || "Live Session"}</Text>
                </View>
                <ChevronRight size={18} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View style={[styles.trackerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Back Button / Switch Tracking */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setQueueData(null);
                setTrackingId('');
                setAutoRefresh(false);
              }}
            >
              <ArrowLeft size={16} color={COLORS.gray[600]} />
              <Text style={styles.switchButtonText}>Track different booking</Text>
            </TouchableOpacity>

            <View style={styles.trackerMainGrid}>
              {/* Position Card */}
              <View style={styles.heroCard}>
                {queueData.status === 'cancelled' ? (
                  <View style={styles.cancelledState}>
                    <View style={styles.cancelIconBox}><Flag size={32} color="#EF4444" /></View>
                    <Text style={styles.cancelledHeading}>APPOINTMENT CANCELLED</Text>
                    {queueData.cancellationReason && (
                      <Text style={styles.cancelledReason}>"{queueData.cancellationReason}"</Text>
                    )}
                    <Text style={styles.cancelledSubtext}>Unfortunately, this appointment has been cancelled. Please contact the shop.</Text>
                  </View>
                ) : (
                  <View style={styles.verticalTicket}>
                    {/* Top Stub Section (Position) */}
                    <View style={styles.vStubSection}>
                      <View style={styles.vInnerStub}>
                        {/* Decorative Stars */}
                        <Star size={12} color="#5D4037" fill="#5D4037" style={styles.vStarTL} />
                        <Star size={12} color="#5D4037" fill="#5D4037" style={styles.vStarTR} />
                        <Star size={12} color="#5D4037" fill="#5D4037" style={styles.vStarBL} />
                        <Star size={12} color="#5D4037" fill="#5D4037" style={styles.vStarBR} />

                        <View style={styles.vStubLeft}>
                          <Text style={styles.vStubLabel}>YOUR POSITION</Text>
                          <View style={styles.vBarcodeContainer}>
                            {[3, 6, 2, 8, 3, 5, 2, 7, 4, 2, 6, 3, 5].map((w, i) => (
                              <View key={i} style={[styles.vBarcodeLine, { width: w }]} />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.vStubVal}>#{queueData.queuePosition}</Text>
                      </View>
                    </View>

                    {/* Horizontal Perforation */}
                    <View style={styles.vPerforation}>
                      <View style={styles.vPerfNotchLeft} />
                      <View style={styles.vPerfLine} />
                      <View style={styles.vPerfNotchRight} />
                    </View>

                    {/* Main Section (Details) */}
                    <View style={styles.vMainSection}>
                      <View style={styles.vInnerMain}>
                        <View style={styles.vHeader}>
                          <Text style={styles.vShopName}>{queueData.shopName || "GLOSSCUT STUDIO"}</Text>
                          <Text style={styles.vBarberName}>with {queueData.barberName}</Text>
                        </View>

                        {/* Live Status Pill */}
                        <View style={styles.vLiveStatusBox}>
                          <View style={styles.vLivePulse}>
                            <View style={styles.vLiveDot} />
                            <View style={styles.vLiveRing} />
                          </View>
                          <Text style={styles.vLiveText}>LIVE TRACKING ACTIVE</Text>
                        </View>

                        {/* Wait Time Integration */}
                        {['pending', 'confirmed'].includes(queueData.status) && (
                          <View style={styles.vWaitBox}>
                            <Text style={styles.vWaitLabel}>ESTIMATED WAIT</Text>
                            <Text style={styles.vWaitVal}>
                              {queueData.estimatedWaitRange
                                ? `${queueData.estimatedWaitRange.min}-${queueData.estimatedWaitRange.max}`
                                : queueData.estimatedWaitMinutes || '--'}
                              <Text style={styles.vWaitUnit}> MINS</Text>
                            </Text>
                          </View>
                        )}

                        {queueData.status === 'started' && (
                          <View style={styles.vProgressBox}>
                            <Text style={styles.vProgressLabel}>✂️ IN PROGRESS</Text>
                            {(() => {
                              const rem = getRemainingTime();
                              if (rem === null) return null;
                              return <Text style={styles.vProgressVal}>{rem} MIN LEFT</Text>;
                            })()}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Scallops (Top and Bottom) */}
                    <View style={styles.vScallopsTop}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <View key={i} style={styles.vScallopCircle} />)}
                    </View>
                    <View style={styles.vScallopsBottom}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <View key={i} style={styles.vScallopCircle} />)}
                    </View>
                  </View>
                )}
              </View>


              {/* Booking Details Card */}
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Booking Details</Text>
                <View style={styles.detailsList}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tracking ID</Text>
                    <View style={styles.trackingIdBadge}><Text style={styles.trackingIdText}>#{queueData.trackingId}</Text></View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Shop</Text>
                    <Text style={styles.detailValue}>{queueData.shopName}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Barber</Text>
                    <Text style={styles.detailValue}>{queueData.barberName}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Services</Text>
                    <Text style={styles.detailValueRight}>{queueData.services.join(', ')}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Booked at</Text>
                    <Text style={styles.detailValue}>{queueData.bookingTime}</Text>
                  </View>
                  <View style={[styles.detailItem, styles.detailItemLast]}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusPill, { backgroundColor: COLORS.status[queueData.status]?.bg || COLORS.gray[100] }]}>
                      <Text style={[styles.statusPillText, { color: COLORS.status[queueData.status]?.text || COLORS.gray[600] }]}>
                        {queueData.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Live Updates Indicator */}
              <View style={styles.liveSyncBox}>
                <View style={styles.syncLeft}>
                  <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                    <View style={styles.pulseRing} />
                  </View>
                  <Text style={styles.syncText}>Live Updates (15s)</Text>
                </View>
                <TouchableOpacity onPress={() => fetchQueuePosition(queueData.trackingId, false)}>
                  <Text style={styles.refreshBtnText}>REFRESH</Text>
                </TouchableOpacity>
              </View>


              {/* Footer */}
              <View style={styles.trackerFooter}>
                <Text style={styles.footerBrand}>GLOSSCUT PARTNER NETWORK</Text>
                <View style={styles.footerDots}>
                  <View style={styles.footerDot} />
                  <View style={styles.footerDot} />
                  <View style={styles.footerDot} />
                </View>
              </View>

            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  bgOrb1: { position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(76, 118, 59, 0.05)', zIndex: 0 },
  bgOrb2: { position: 'absolute', bottom: 100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0, 191, 165, 0.05)', zIndex: 0 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: COLORS.gray[100] },
  backIconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.gray[50], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gray[100] },
  headerSubtitle: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 2, marginBottom: 2, opacity: 0.6 },
  headerTitle: { fontSize: 24, fontWeight: '1000', color: COLORS.black, letterSpacing: -1 },
  headerActionButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.gray[50], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.gray[100] },

  scrollContent: { paddingBottom: 40 },
  searchContainer: { padding: 24, alignItems: 'center' },
  searchHero: { alignItems: 'center', marginTop: width * 0.05, marginBottom: width * 0.08 },
  heroImageWrapper: { width: width * 0.6, height: width * 0.6, marginBottom: 24 },
  searchIllustration: { width: '100%', height: '100%' },
  searchHeroTitle: { fontSize: Math.max(22, width * 0.07), fontWeight: '1000', color: COLORS.black, letterSpacing: -0.5, marginBottom: 12 },
  searchHeroSub: { fontSize: Math.max(13, width * 0.04), color: COLORS.gray[600], textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, fontWeight: '500' },

  searchForm: { width: '100%', gap: 20 },
  idInputBox: { backgroundColor: '#FFF', borderRadius: 24, height: 80, borderWidth: 2, borderColor: COLORS.gray[200], justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  idInput: { fontSize: 32, fontWeight: '900', color: COLORS.black, letterSpacing: 10, textAlign: 'center', width: '100%' },
  mainSubmitBtnContainer: { width: '100%', height: 68, borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 },
  mainSubmitBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainSubmitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },

  errorPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.status.cancelled.text, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginTop: 20, gap: 8 },
  errorPillText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  activeShortcutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, padding: 20, marginTop: 40, borderWidth: 1.5, borderColor: COLORS.gray[100], shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  shortcutIconBox: { width: 50, height: 50, borderRadius: 16, overflow: 'hidden', marginRight: 16 },
  shortcutIconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shortcutText: { flex: 1 },
  shortcutLabel: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 4 },
  shortcutValue: { fontSize: 17, fontWeight: '1000', color: COLORS.black, tracking: -0.3 },

  trackerContainer: { padding: width * 0.05 },
  switchButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', alignSelf: 'flex-start', borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.gray[100], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  switchButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.gray[600] },

  trackerMainGrid: { gap: 16 },
  heroCard: { backgroundColor: 'transparent', padding: 0, marginTop: 10, marginBottom: 20 },
  verticalTicket: { backgroundColor: '#E6D5B8', borderRadius: 4, overflow: 'hidden', width: '100%' },
  vScallopsTop: { position: 'absolute', top: -12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', zIndex: 10 },
  vScallopsBottom: { position: 'absolute', bottom: -12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', zIndex: 10 },
  vScallopCircle: { width: width * 0.05, height: width * 0.05, borderRadius: width * 0.025, backgroundColor: COLORS.gray[50] },

  vStubSection: { padding: width * 0.04, paddingBottom: 0, alignItems: 'center' },
  vInnerStub: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: '#5D4037', borderRadius: 16, paddingHorizontal: width * 0.07, paddingVertical: width * 0.05, backgroundColor: 'rgba(93, 64, 55, 0.03)' },
  vStubLeft: { gap: 5 },
  vStubLabel: { fontSize: Math.max(11, width * 0.032), fontWeight: '1000', color: '#5D4037', letterSpacing: 1.8 },
  vStubVal: { fontSize: Math.max(42, width * 0.14), fontWeight: '1000', color: '#5D4037', letterSpacing: -2.5 },
  vBarcodeContainer: { flexDirection: 'row', alignItems: 'flex-end', height: width * 0.06, marginTop: 4 },
  vBarcodeLine: { height: '100%', backgroundColor: '#5D4037', marginHorizontal: 1.8, opacity: 0.8 },
  vStarTL: { position: 'absolute', top: width * 0.02, left: width * 0.02 },
  vStarTR: { position: 'absolute', top: width * 0.02, right: width * 0.02 },
  vStarBL: { position: 'absolute', bottom: width * 0.02, left: width * 0.02 },
  vStarBR: { position: 'absolute', bottom: width * 0.02, right: width * 0.02 },

  vPerforation: { height: width * 0.07, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  vPerfLine: { height: 1, width: '85%', borderWidth: 1, borderColor: '#5D4037', borderStyle: 'dashed' },
  vPerfNotchLeft: { position: 'absolute', left: -width * 0.05, width: width * 0.1, height: width * 0.1, borderRadius: width * 0.05, backgroundColor: COLORS.gray[50] },
  vPerfNotchRight: { position: 'absolute', right: -width * 0.05, width: width * 0.1, height: width * 0.1, borderRadius: width * 0.05, backgroundColor: COLORS.gray[50] },

  vMainSection: { padding: width * 0.05, paddingTop: 8 },
  vInnerMain: { width: '100%', borderWidth: 1.5, borderColor: '#5D4037', borderRadius: 12, padding: width * 0.045 },
  vHeader: { alignItems: 'center', marginBottom: 16 },
  vShopName: { fontSize: Math.max(18, width * 0.05), fontWeight: '900', color: '#5D4037', textAlign: 'center', letterSpacing: -0.5 },
  vBarberName: { fontSize: Math.max(10, width * 0.03), fontWeight: '700', color: '#8D6E63', marginTop: 4 },

  vLiveStatusBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingVertical: 10, borderRadius: 12, marginBottom: 16 },
  vLivePulse: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  vLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  vLiveRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(34, 197, 94, 0.3)' },
  vLiveText: { fontSize: 10, fontWeight: '900', color: '#166534', letterSpacing: 1 },

  vWaitBox: { alignItems: 'center', backgroundColor: '#5D4037', paddingVertical: 14, borderRadius: 12 },
  vWaitLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 3 },
  vWaitVal: { fontSize: Math.max(26, width * 0.075), fontWeight: '1000', color: '#22C55E' },
  vWaitUnit: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  vProgressBox: { alignItems: 'center', backgroundColor: '#5D4037', paddingVertical: 14, borderRadius: 12 },
  vProgressLabel: { fontSize: 10, fontWeight: '900', color: '#00BFA5', letterSpacing: 2, marginBottom: 3 },
  vProgressVal: { fontSize: Math.max(26, width * 0.075), fontWeight: '1000', color: '#FFF' },


  detailsCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 28, borderWidth: 1.5, borderColor: COLORS.gray[100] },
  detailsTitle: { fontSize: 18, fontWeight: '1000', color: COLORS.black, marginBottom: 20, letterSpacing: -0.3 },
  detailsList: { gap: 14 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItemLast: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.gray[50] },
  detailLabel: { fontSize: 14, color: COLORS.gray[400], fontWeight: '700' },
  detailValue: { fontSize: 15, fontWeight: '1000', color: COLORS.black },
  detailValueRight: { fontSize: 15, fontWeight: '1000', color: COLORS.black, textAlign: 'right', flex: 1, marginLeft: 20 },
  trackingIdBadge: { backgroundColor: 'rgba(76, 118, 59, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  trackingIdText: { fontSize: 14, fontWeight: '900', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: '1000', letterSpacing: 0.5 },

  liveSyncBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, borderWidth: 1, borderColor: COLORS.gray[100] },
  syncLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseContainer: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  pulseRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(34, 197, 94, 0.3)' },
  syncText: { fontSize: 12, fontWeight: '700', color: COLORS.gray[600] },
  refreshBtnText: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },

  nowServingText: { textAlign: 'center', fontSize: 12, color: COLORS.gray[400], fontWeight: '700', marginTop: 8 },

  rulesCard: { marginTop: 40, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 40, padding: 32, borderWidth: 1, borderColor: '#FFF' },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  rulesAccent: { width: 6, height: 24, backgroundColor: COLORS.status.confirmed.text, borderRadius: 3, shadowColor: COLORS.status.confirmed.text, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  rulesTitle: { fontSize: 14, fontWeight: '1000', color: COLORS.black, letterSpacing: 2, textTransform: 'uppercase' },
  ruleItem: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  ruleNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.status.confirmed.text, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  ruleNumberText: { fontSize: 9, fontWeight: '1000', color: '#FFF' },
  ruleText: { flex: 1, fontSize: 13, color: COLORS.gray[600], fontWeight: '700', lineHeight: 20 },
  bold: { color: COLORS.black, fontWeight: '1000' },
  greenBold: { color: '#00BFA5', fontWeight: '1000', textDecorationLine: 'underline' },

  trackerFooter: { marginTop: 60, alignItems: 'center', paddingBottom: 40 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: COLORS.gray[400], letterSpacing: 3, marginBottom: 16 },
  footerDots: { flexDirection: 'row', gap: 8 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.gray[200] },

  cancelledState: { alignItems: 'center', padding: 10 },
  cancelIconBox: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  cancelledHeading: { fontSize: 24, fontWeight: '1000', color: '#FFF', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  cancelledReason: { fontSize: 18, color: '#FCA5A5', fontStyle: 'italic', marginBottom: 16, textAlign: 'center', fontWeight: '700' },
  cancelledSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
});

export default TrackQueueScreen;
