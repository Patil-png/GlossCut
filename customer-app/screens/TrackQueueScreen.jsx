import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Animated, Easing, Alert, Dimensions, RefreshControl, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, Users, AlertCircle, ArrowLeft, RefreshCcw, Clock,
  ShieldCheck, CheckCircle, Scissors, MapPin, Info, Gift, ChevronRight, Star
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import io from 'socket.io-client';
import api, { API_URL } from "../utils/api";
import { format } from "date-fns";

const { width } = Dimensions.get('window');

// --- SUB-COMPONENTS ---

const AppointmentCard = memo(({ appointment, index }) => {
  const isConfirmed = appointment.status === "confirmed";
  const isStarted = appointment.status === "started";
  const isPending = appointment.status === "pending" || appointment.status?.includes("Pending");
  const isOfflineBooking = appointment.isOfflineBooking;
  const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;

  const styleTheme = useMemo(() => {
    if (isStarted) return { bg: "#E0F2F1", text: "#00695C", border: "#00BFA5" };
    if (isPending) return { bg: "#E3F2FD", text: "#1565C0", border: "#2979FF" };
    if (isConfirmed) return { bg: "#F3E5F5", text: "#6A1B9A", border: "#6A1B9A" };
    if (appointment.status === "completed") return { bg: "#E8F5E9", text: "#2E7D32", border: "#4CAF50" };
    if (appointment.status === "cancelled") return { bg: "#FFEBEE", text: "#C62828", border: "#EF5350" };
    return { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" };
  }, [isStarted, isPending, isConfirmed, appointment.status]);

  const customerNameDisplay = isOfflineBooking
    ? appointment.customerName || "Offline Customer"
    : appointment.userId?.name || `Customer ${index + 1}`;

  return (
    <View style={styles.appCardContainer}>
      <View style={[styles.appCardAccent, { backgroundColor: styleTheme.border }]} />
      <View style={styles.appCardContent}>
        <View style={styles.posBadge}>
          <Text style={styles.posText}>#{index + 1}</Text>
        </View>
        
        <View style={styles.customerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.customerName} numberOfLines={1}>{customerNameDisplay}</Text>
            {isExpress ? (
              <View style={styles.expressBadge}><Text style={styles.expressText}>EXPRESS</Text></View>
            ) : (
              <View style={styles.basicBadge}><Text style={styles.basicText}>BASIC</Text></View>
            )}
          </View>
          {isOfflineBooking && <Text style={styles.walkInText}>WALK-IN</Text>}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: styleTheme.bg }]}>
          <Text style={[styles.statusText, { color: styleTheme.text }]}>
            {appointment.status === 'confirmed' ? 'Waiting' : appointment.status === 'started' ? 'Active' : appointment.status}
          </Text>
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
      }, 1000); // 1s for smooth feel on app
    }
    return () => clearInterval(interval);
  }, [queueData?.status, timeOffset]);

  const fetchQueuePosition = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const searchId = id.length === 6 ? id.toUpperCase() : id;
      const res = await api.get(`/api/booking/track/${searchId}`);
      
      if (res.data.success) {
        setQueueData(res.data.data);
        setAutoRefresh(true);
        
        // If we have a barberId, fetch the full queue list
        if (res.data.data.barberId) {
          fetchQueueList(res.data.data.barberId);
        }

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1)), useNativeDriver: true })
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


  // Check if customer has booked this barber before (Industry-grade UX)
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

  // Handle Initial Search if trackingId exists in params
  useEffect(() => {
    if (urlTrackingId) {
      fetchQueuePosition(urlTrackingId);
    }
  }, [urlTrackingId, fetchQueuePosition]);

  // Socket & Polling logic
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
          `Your barber is almost ready for you! Please head to the shop within the next 10 minutes to avoid losing your spot.\n\n${data.message || ""}`
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'started': return '#3B82F6';
      case 'confirmed': return '#22C55E';
      case 'pending': return '#EAB308';
      case 'completed': return '#64748B';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracker</Text>
        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={() => queueData ? fetchQueuePosition(queueData.trackingId) : null}
          disabled={!queueData || loading}
        >
          <RefreshCcw size={20} color={queueData ? "#0F172A" : "#CBD5E1"} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => queueData ? fetchQueuePosition(queueData.trackingId) : null} 
            tintColor="#4C763B"
          />
        }
      >
        {!queueData ? (
          <View style={styles.searchSection}>
            <View style={styles.lottiePlaceholder}>
              <Scissors size={60} color="#4C763B" strokeWidth={1} />
            </View>
            <Text style={styles.searchTitle}>Track Your Turn</Text>
            <Text style={styles.searchSub}>Enter your Tracking ID to see your position in the live queue.</Text>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. A12B34"
                placeholderTextColor="#94A3B8"
                value={trackingId}
                onChangeText={setTrackingId}
                autoCapitalize="characters"
                maxLength={24}
              />
              <TouchableOpacity 
                style={[styles.trackBtn, trackingId.length < 6 && styles.trackBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading || trackingId.length < 6}
              >
                {loading ? <RefreshCcw size={20} color="#FFF" /> : <Search size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        ) : (
          <Animated.View style={[styles.trackerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Status Card */}
            <View style={[styles.positionCard, queueData.status === 'cancelled' && styles.cancelledCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.dot} />
                <Text style={styles.statusLabel}>YOUR STATUS</Text>
                <View style={styles.dot} />
              </View>

              {queueData.status === 'cancelled' ? (
                <View style={styles.centerContent}>
                  <AlertCircle size={50} color="#EF4444" />
                  <Text style={styles.cancelledTitle}>CANCELLED</Text>
                  <Text style={styles.cancelledReason}>"{queueData.cancellationReason || "No reason provided"}"</Text>
                </View>
              ) : (
                <View style={styles.centerContent}>
                  <Text style={styles.posNumber}>#{queueData.queuePosition}</Text>
                  
                  {queueData.status === 'started' ? (
                    <View style={styles.activeRow}>
                      <Text style={styles.activeStatus}>✂️ IN PROGRESS</Text>
                      {(() => {
                        const remaining = getRemainingTime();
                        if (remaining < 0) return <Text style={styles.overtime}>OVERTIME (+{Math.abs(remaining)}m)</Text>;
                        return (
                          <View style={styles.timerRow}>
                            <Text style={styles.timerNum}>{remaining}</Text>
                            <Text style={styles.timerUnit}>MIN LEFT</Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : queueData.peopleAhead === 0 ? (
                    <Text style={styles.turnText}>🎉 IT'S YOUR TURN!</Text>
                  ) : (
                    <View style={styles.aheadRow}>
                      <Text style={styles.aheadNum}>{queueData.peopleAhead}</Text>
                      <Text style={styles.aheadUnit}>PEOPLE AHEAD</Text>
                    </View>
                  )}

                  {/* Estimated Wait */}
                  {queueData.status !== 'started' && queueData.status !== 'completed' && (
                    <View style={styles.waitRow}>
                      <View style={styles.waitDivider} />
                      <View style={styles.waitContent}>
                        <Clock size={16} color="#94A3B8" />
                        <Text style={styles.waitLabel}>ESTIMATED WAIT</Text>
                        <Text style={styles.waitTime}>
                          {queueData.estimatedWaitRange 
                            ? `${queueData.estimatedWaitRange.min}-${queueData.estimatedWaitRange.max}` 
                            : queueData.estimatedWaitMinutes || '--'}
                          <Text style={styles.waitMin}> mins</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Users size={18} color="#3B82F6" />
                <Text style={styles.statVal}>{queueData.totalInQueue}</Text>
                <Text style={styles.statLabel}>IN QUEUE</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={18} color="#F59E0B" />
                <Text style={styles.statVal}>{queueData.currentToken || '#'}</Text>
                <Text style={styles.statLabel}>NOW SERVING</Text>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Tracking ID</Text>
                <Text style={styles.detailValPrimary}>#{queueData.trackingId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Venue</Text>
                <Text style={styles.detailValBold}>{queueData.shopName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Barber</Text>
                <Text style={styles.detailValBold}>{queueData.barberName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Status</Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(queueData.status) + '15' }]}>
                  <Text style={[styles.statusTextSmall, { color: getStatusColor(queueData.status) }]}>
                    {queueData.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Re-book Card (Smooth UX for Returning Customers) */}
            {hasPreviousBooking && (
              <TouchableOpacity 
                style={styles.rebookCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Booking", { barberId: queueData.barberId });
                }}
                activeOpacity={0.9}
              >
                <View style={styles.rebookIconBox}>
                  <RefreshCcw size={24} color="#FFF" />
                </View>
                <View style={styles.rebookTextContent}>
                  <Text style={styles.rebookTitle} numberOfLines={1}>Smooth Re-booking</Text>
                  <Text style={styles.rebookDesc} numberOfLines={2}>
                    You've visited {queueData.barberName} before. Schedule your next visit now!
                  </Text>
                </View>
                <ChevronRight size={20} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            {/* Live Queue Deck */}
            <View style={styles.queueDeckSection}>
              <View style={styles.deckHeader}>
                <Text style={styles.deckTitle}>ACTIVE DECK</Text>
                <View style={styles.deckLine} />
              </View>

              {listLoading ? (
                <View style={styles.deckLoader}>
                  <RefreshCcw size={24} color="#4C763B" />
                  <Text style={styles.deckLoaderText}>Updating Deck...</Text>
                </View>
              ) : sortedAppointments.length === 0 ? (
                <View style={styles.emptyDeck}>
                  <Gift size={40} color="#CBD5E1" />
                  <Text style={styles.emptyDeckText}>Deck is Clear</Text>
                </View>
              ) : (
                <View style={styles.appList}>
                  {sortedAppointments.map((item, idx) => (
                    <AppointmentCard key={item._id} appointment={item} index={idx} />
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#F8F9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  lottiePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4C763B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  searchTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  searchSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingLeft: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  trackBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#4C763B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 15,
  },
  trackerSection: {
    padding: 20,
  },
  positionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  cancelledCard: {
    backgroundColor: '#450A0A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
  },
  posNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 80,
    marginBottom: 10,
  },
  activeRow: {
    alignItems: 'center',
  },
  activeStatus: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timerNum: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
  },
  timerUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 8,
  },
  overtime: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EF4444',
  },
  turnText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aheadNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  aheadUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 10,
    marginTop: 4,
  },
  waitRow: {
    width: '100%',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  waitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 8,
    letterSpacing: 1,
  },
  waitTime: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginLeft: 10,
  },
  waitMin: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  cancelledTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 15,
  },
  cancelledReason: {
    fontSize: 14,
    color: '#FCA5A5',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  detailsSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4C763B',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detailValBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '900',
  },
  queueDeckSection: {
    marginTop: 10,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deckTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    marginRight: 15,
  },
  deckLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  appCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  appCardAccent: {
    width: 4,
  },
  appCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 15,
  },
  posBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  posText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
    maxWidth: width * 0.3,
  },
  expressBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expressText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
  },
  basicBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  basicText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
  },
  walkInText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 2,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  deckLoader: {
    padding: 40,
    alignItems: 'center',
  },
  deckLoaderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDeck: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 32,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyDeckText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 15,
  },
  rebookCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  rebookIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#4C763B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rebookTextContent: {
    flex: 1,
  },
  rebookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  rebookDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default TrackQueueScreen;
