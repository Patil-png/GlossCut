import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
  Dimensions, TextInput, ScrollView, Platform, Image, ActivityIndicator, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Clock, MapPin, Search, ChevronRight, CheckCircle2, QrCode,
  AlertCircle, X, ShieldCheck, Zap, Scissors, Phone, MessageSquare, Info, Users,
  Calendar, ShieldAlert, HeartHandshake, Shield
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from "../utils/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const safeUpper = (val) => {
  if (!val) return "";
  return String(val).toUpperCase();
};

const TrackQueueScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [trackingId, setTrackingId] = useState(route.params?.trackingId || '');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const isCompleted = queueData?.status === 'completed' || queueData?.status === 'success';

  const toastAnim = useRef(new Animated.Value(-100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkActiveBooking = async () => {
      if (route.params?.trackingId) {
        fetchQueuePosition(route.params.trackingId);
        return;
      }
      try {
        const res = await api.get('/api/booking/active');
        if (res.data.success && res.data.activeBooking) {
          const activeId = res.data.activeBooking.queueTrackingId || res.data.activeBooking._id;
          if (activeId) {
            setTrackingId(activeId);
            fetchQueuePosition(activeId);
          }
        }
      } catch (err) {
        console.log("No active booking found");
      }
    };
    checkActiveBooking();
  }, [route.params?.trackingId]);

  const triggerError = (msg) => {
    setError(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    Animated.spring(toastAnim, { toValue: insets.top + 10, useNativeDriver: true, tension: 80, friction: 10 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -100, duration: 500, useNativeDriver: true }).start(() => setError(null));
    }, 3000);
  };

  const fetchQueuePosition = useCallback(async (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/booking/track/${id}`);
      if (res.data.success) {
        setQueueData(res.data.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        if (id === trackingId) triggerError("This ID doesn't exist");
      }
    } catch (err) {
      if (id === trackingId) triggerError("This ID doesn't exist");
    } finally {
      setLoading(false);
    }
  }, [insets.top, trackingId]);

  const handleCall = () => {
    if (queueData?.barberPhone) {
      Linking.openURL(`tel:${queueData.barberPhone}`);
    }
  };

  const handleMap = () => {
    if (queueData?.shopAddress) {
      const url = Platform.select({
        ios: `maps:0,0?q=${queueData.shopAddress}`,
        android: `geo:0,0?q=${queueData.shopAddress}`
      });
      Linking.openURL(url);
    }
  };

  const handleChat = () => {
    navigation.navigate("Chat");
  };

  const renderQueueItem = (item, index) => {
    const isCurrent = item.isTarget;
    const isStarted = item.status === 'started';

    return (
      <View key={item.id} style={[styles.queueTimelineItem, isCurrent && styles.itemCurrent]}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineDot, isCurrent && styles.dotCurrent, isStarted && styles.dotStarted]} />
          {index !== queueData.queueList.length - 1 && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isCurrent && styles.rankTextCurrent]}>{String(item.rank).padStart(2, '0')}</Text>
        </View>

        <View style={[styles.timelineContent, isCurrent && styles.contentCurrent]}>
          <View style={styles.timelineHeaderRow}>
            <Text style={[styles.timelineName, isCurrent && styles.textCurrent]}>
              {isCurrent ? "YOUR SESSION" : item.name}
            </Text>
            <View style={styles.timeStack}>
              <Text style={[styles.timelineTime, isCurrent && styles.textCurrent]}>{item.estArrival}</Text>
              <Text style={styles.slotLabel}>SLOT: {item.time}</Text>
            </View>
          </View>
          <View style={styles.timelineStatusRow}>
            <Text style={styles.timelineStatus}>{safeUpper(item.status)}</Text>
            {isStarted && <View style={styles.livePulseMini} />}
          </View>
        </View>

        {isCurrent && (
          <View style={styles.currentIndicatorBox}>
            <CheckCircle2 size={16} color="#00C896" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.bgDecorCircle1} />
      <View style={styles.bgDecorCircle2} />

      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
        <View style={styles.toastInner}>
          <AlertCircle size={20} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.toastText}>{error}</Text>
          <TouchableOpacity onPress={() => Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start()}>
            <X size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={[styles.premiumHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerActionBtn}>
          <ArrowLeft size={20} color="#111" strokeWidth={3} />
        </TouchableOpacity>

        <View style={styles.headerMain}>
          <Text style={styles.headerTagline}>SYSTEM STATUS: ACTIVE</Text>
          <Text style={styles.headerPrimaryTitle}>SESSION TRACKER</Text>
        </View>

        <View style={styles.headerStatusBox}>
          <View style={styles.statusPulse} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.bottomRegion}>
          {!queueData ? (
            <>
              <Animated.View style={[styles.inputCard, { transform: [{ translateX: shakeAnim }], marginTop: 80 }]}>
                <View style={styles.inputHeader}>
                  <View style={styles.iconBox}><QrCode size={18} color="#111" strokeWidth={2.5} /></View>
                  <View><Text style={styles.inputTitle}>Live Tracking</Text><Text style={styles.inputTag}>SECURE GATEWAY</Text></View>
                </View>

                <Text style={styles.inputSubtitle}>Enter your unique Tracking ID from your booking confirmation to unlock your All-Access Pass.</Text>

                <View style={[styles.modernInputWrapper, isFocused && styles.modernInputFocused]}>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="ID CODE"
                    placeholderTextColor="#CCC"
                    value={trackingId}
                    onChangeText={(v) => { setTrackingId(v.toUpperCase()); if (error) setError(null); }}
                    autoCapitalize="characters"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                  <View style={styles.inputDecor}><Search size={20} color={isFocused ? "#111" : "#BBB"} strokeWidth={2.5} /></View>
                </View>

                <TouchableOpacity style={[styles.trackBtn, loading && { opacity: 0.6 }]} onPress={() => fetchQueuePosition(trackingId)} activeOpacity={0.8}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.trackBtnText}>VERIFY & TRACK</Text>
                      <ChevronRight size={18} color="#FFF" strokeWidth={3} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.externalSecurityNotes}>
                <View style={styles.notesHeader}>
                  <View style={styles.notesIconBox}><Shield size={14} color="#111" /></View>
                  <Text style={styles.notesTitle}>SECURITY PROTOCOL</Text>
                </View>
                <View style={styles.notesList}>
                  <View style={styles.noteRow}>
                    <ShieldCheck size={14} color="#00C896" />
                    <Text style={styles.noteText}>End-to-end encrypted session tracking.</Text>
                  </View>
                  <View style={styles.noteRow}>
                    <Info size={14} color="#3B82F6" />
                    <Text style={styles.noteText}>ID is available in your WhatsApp confirmation.</Text>
                  </View>
                  <View style={styles.noteRow}>
                    <Clock size={14} color="#F59E0B" />
                    <Text style={styles.noteText}>Refreshes automatically every 60 seconds.</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.passWrapper}>
                {/* --- REALISTIC LANYARD STRAP --- */}
                <View style={styles.lanyardStrap}>
                  <LinearGradient
                    colors={['#1F2937', '#374151', '#1F2937']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.strapTexture} />
                </View>

                {/* --- NEXT-LEVEL 3D LOBSTER CLAW ASSEMBLY --- */}
                <View style={styles.lanyardHook}>
                  <View style={styles.hookBackLoop} />
                  <View style={styles.hookSwivel}>
                    <LinearGradient colors={['#F3F4F6', '#9CA3AF', '#4B5563']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    <View style={styles.swivelGlint} />
                  </View>
                  <View style={styles.hookJoint}>
                    <LinearGradient colors={['#D1D5DB', '#4B5563']} style={StyleSheet.absoluteFill} />
                    <View style={styles.jointPin} />
                  </View>
                  <View style={styles.clawBody}>
                    <LinearGradient colors={['#F9FAFB', '#D1D5DB', '#9CA3AF', '#4B5563']} style={StyleSheet.absoluteFill} />
                    <View style={styles.clawReflection} />
                    <View style={styles.clawGlint} />
                  </View>
                </View>
                <View style={styles.lanyardSlot}>
                  <View style={styles.slotInnerShadow} />
                </View>
                  <View style={styles.idCard}>
                    <LinearGradient colors={['#18181B', '#09090B']} style={styles.cardBg} />
                    <View style={styles.idTopRow}>
                      <View style={styles.idLogo}><Zap size={20} color="#FFF" strokeWidth={2.5} /></View>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeLabel}>{isCompleted ? 'STATUS' : 'RANK'}</Text>
                        <Text style={[styles.rankBadgeNumber, isCompleted && { fontSize: 13, color: '#C8FF00', fontWeight: '900' }]}>
                          {isCompleted ? 'DONE' : `#${queueData.queuePosition}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.idMainTitle}>SALON PASS</Text>

                    {isCompleted && (
                      <View style={styles.completedPassBanner}>
                        <CheckCircle2 size={16} color="#C8FF00" strokeWidth={3} />
                        <Text style={styles.completedPassBannerText}>YOUR TODAY APPOINTMENT IS COMPLETED</Text>
                      </View>
                    )}

                    <View style={styles.idMetaGrid}>
                      <View style={styles.idMetaCol}>
                        <Text style={styles.idMetaLabel}>LOCATION</Text>
                        <Text style={styles.idShopName} numberOfLines={1}>{safeUpper(queueData.shopName)}</Text>
                        <Text style={styles.idShopAddress} numberOfLines={1} ellipsizeMode="tail">
                          {safeUpper(queueData.shopAddress) || "INDIA"}
                        </Text>
                      </View>
                      <View style={styles.idMetaCol}>
                        <Text style={styles.idMetaLabel}>BARBER</Text>
                        <Text style={styles.idMetaValue}>{safeUpper(queueData.barberName) || "MASTER"}</Text>
                      </View>
                    </View>
                    <View style={styles.idDivider} />
                    <View style={styles.idHolderBox}>
                      <Text style={styles.idMetaLabel}>@HOLDER</Text>
                      <Text style={styles.idHolderName}>{safeUpper(queueData.customerName) || "VIP"}</Text>
                    </View>
                    <View style={styles.idFooter}>
                      <View style={styles.idQrContainer}>
                        <Image 
                          source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.instagram.com/glosscut.india/&color=ffffff&bgcolor=09090b' }} 
                          style={styles.realQrImage} 
                        />
                      </View>
                      <View style={styles.idBottomMeta}>
                        <View style={styles.idBottomMetaRow}>
                          <Text style={styles.idMetaLabel}>EST. ARRIVAL</Text>
                          <Text style={[styles.idBottomValue, { fontSize: 16, color: '#C8FF00' }]}>
                            {isCompleted ? "COMPLETED" : (queueData.queueList?.find(i => i.isTarget)?.estArrival || "SCHEDULED")}
                          </Text>
                        </View>
                        <View style={styles.idBottomMetaRow}>
                          <Text style={styles.idMetaLabel}>PASS STATUS</Text>
                          <Text style={[styles.idBottomValue, isCompleted && { color: '#EF4444' }]}>
                            {isCompleted ? "EXPIRED / USED" : "VERIFIED ACCESS"}
                          </Text>
                        </View>
                        <View style={styles.idBottomMetaRow}>
                          <Text style={styles.idMetaLabel}>QUEUE RANK</Text>
                          <Text style={[styles.idBottomValue, { fontSize: 16 }]}>
                            {isCompleted ? "COMPLETED" : `#${queueData.queuePosition}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.idStudioRow}>
                      <View style={styles.studioIconBox}><View style={styles.studioBar1} /><View style={styles.studioBar2} /></View>
                      <Text style={styles.studioText}>GLOSSCUT STUDIO</Text>
                    </View>
                  </View>
                </View>

              <View style={styles.dashboardSection}>
                <View style={styles.sectionHeader}>
                  <Users size={16} color="#111" />
                  <Text style={styles.sectionTitle}>Queue Timeline</Text>
                </View>
                <View style={styles.timelineCard}>
                  <View style={styles.timelineStats}>
                    <Text style={styles.timelineCountText}>{queueData.queueList?.length || 0} ACTIVE SESSIONS</Text>
                    <View style={styles.liveIndicator}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
                  </View>
                  {queueData.queueList && queueData.queueList.length > 0 ? (
                    queueData.queueList.map((item, index) => renderQueueItem(item, index))
                  ) : (
                    <View style={styles.emptyQueueBox}>
                      <Info size={14} color="#94A3B8" />
                      <Text style={styles.emptyQueueText}>STATION CLEAR - NO OTHERS IN QUEUE</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* --- FOOTER ASSISTANCE --- */}
              <TouchableOpacity style={styles.assistanceBtn} onPress={handleChat}>
                <HeartHandshake size={18} color="#111" />
                <Text style={styles.assistanceText}>Need Help? Chat with Us</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bgDecorCircle1: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(0,200,150,0.03)', zIndex: 0 },
  bgDecorCircle2: { position: 'absolute', bottom: 100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(17,17,17,0.02)', zIndex: 0 },
  toast: { position: 'absolute', left: 20, right: 20, zIndex: 1000 },
  toastInner: { backgroundColor: '#111', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  toastText: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#FFF' },
  premiumHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'rgba(248, 250, 252, 0.98)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', zIndex: 100 },
  headerActionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerMain: { alignItems: 'center', flex: 1 },
  headerTagline: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 7, color: '#94A3B8', fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  headerPrimaryTitle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, color: '#111', fontWeight: '800', letterSpacing: 1.5 },
  headerStatusBox: { width: 40, alignItems: 'flex-end' },
  statusPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C896', shadowColor: '#00C896', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 5 },
  bottomRegion: { paddingHorizontal: 20 },
  inputCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 25, borderWidth: 1.5, borderColor: '#F2F4F7', shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 10 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  inputTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: '#111' },
  inputTag: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, color: '#AAA', letterSpacing: 1.5, marginTop: -2 },
  inputSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: '#999', marginBottom: 20, lineHeight: 18 },
  modernInputWrapper: { backgroundColor: '#F8F9FA', borderRadius: 16, height: 56, borderWidth: 2, borderColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  modernInputFocused: { borderColor: '#111', backgroundColor: '#FFF' },
  modernInput: { flex: 1, fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#111', letterSpacing: 6, height: '100%' },
  inputDecor: { paddingLeft: 10 },
  trackBtn: { backgroundColor: '#111', height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 15 },
  trackBtnText: { fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#FFF', fontSize: 13, letterSpacing: 1 },
  externalSecurityNotes: { marginTop: 35, paddingHorizontal: 5, gap: 12 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notesIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  notesTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: '#64748B', letterSpacing: 1.5 },
  notesList: { gap: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#64748B' },

  // --- REALISTIC LANYARD & ID CARD ---
  passWrapper: { alignItems: 'center', paddingTop: 60, marginBottom: 25, width: '100%' },
  lanyardStrap: { position: 'absolute', top: -100, width: 32, height: 180, backgroundColor: '#1F2937', zIndex: 1, overflow: 'hidden', borderRadius: 4 },
  strapTexture: { ...StyleSheet.absoluteFillObject, opacity: 0.1, backgroundColor: '#000', borderRightWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  lanyardHook: { position: 'absolute', top: 40, zIndex: 30, alignItems: 'center', width: 30 },
  hookBackLoop: { position: 'absolute', top: 12, width: 12, height: 16, backgroundColor: '#374151', borderRadius: 2, zIndex: -1 },
  hookSwivel: { width: 22, height: 8, borderRadius: 2, overflow: 'hidden', borderWidth: 1, borderColor: '#9CA3AF' },
  swivelGlint: { position: 'absolute', top: 1, right: 2, width: 4, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 },
  hookJoint: { width: 14, height: 14, borderRadius: 7, marginTop: -2, overflow: 'hidden', borderWidth: 1, borderColor: '#6B7280', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  jointPin: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#374151' },
  clawBody: { width: 18, height: 30, marginTop: -4, borderRadius: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 10 },
  clawReflection: { position: 'absolute', top: 0, left: 1, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.3)' },
  clawGlint: { position: 'absolute', top: 4, right: 2, width: 2, height: 2, backgroundColor: '#FFF', borderRadius: 1, opacity: 0.8 },

  lanyardSlot: { width: 50, height: 14, borderRadius: 7, backgroundColor: '#111', marginBottom: -7, zIndex: 10, borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
  slotInnerShadow: { ...StyleSheet.absoluteFillObject, borderTopWidth: 2, borderColor: 'rgba(0,0,0,0.5)' },
  idCard: { 
    width: SCREEN_WIDTH > 450 ? 380 : SCREEN_WIDTH * 0.88,
    minHeight: 460, 
    backgroundColor: '#09090B', 
    borderRadius: 16, 
    padding: SCREEN_WIDTH > 360 ? 25 : 18,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 20 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 25, 
    elevation: 25, 
    position: 'relative', 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  cardBg: { ...StyleSheet.absoluteFillObject },
  idTopRow: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idLogo: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
  rankBadge: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, minWidth: 60 },
  rankBadgeLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 8, color: '#111', fontWeight: '800', letterSpacing: 1 },
  rankBadgeNumber: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 22, color: '#111', fontWeight: '900', marginTop: -2 },
  idMainTitle: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: SCREEN_WIDTH > 360 ? 28 : 22, 
    color: '#FFF', 
    fontWeight: '800', 
    letterSpacing: 2, 
    marginBottom: 25 
  },
  idMetaGrid: { flexDirection: 'row', gap: SCREEN_WIDTH > 360 ? 20 : 12, marginBottom: 20 },
  idMetaCol: { flex: 1 },
  idMetaLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  idShopName: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: SCREEN_WIDTH > 360 ? 13 : 11, color: '#FFF', fontWeight: '800', marginBottom: 2 },
  idShopAddress: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: SCREEN_WIDTH > 360 ? 9 : 8, color: 'rgba(255,255,255,0.6)', fontWeight: '600', lineHeight: 12 },
  idMetaValue: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: SCREEN_WIDTH > 360 ? 10 : 9, color: '#FFF', fontWeight: '600', lineHeight: 14 },
  idDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 25 },
  idHolderBox: { marginBottom: 30 },
  idHolderName: { 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: SCREEN_WIDTH > 360 ? 24 : 20, 
    color: '#FFF', 
    fontWeight: '800', 
    letterSpacing: 1 
  },
  idFooter: { flexDirection: 'row', gap: SCREEN_WIDTH > 360 ? 35 : 25, alignItems: 'flex-start', marginBottom: 25 },
  idQrContainer: { 
    backgroundColor: 'transparent', 
    width: SCREEN_WIDTH > 360 ? 110 : 90, 
    height: SCREEN_WIDTH > 360 ? 110 : 90 
  },
  realQrImage: { width: '100%', height: '100%', borderRadius: 6 },
  idBottomMeta: { flex: 1, height: SCREEN_WIDTH > 360 ? 110 : 90, justifyContent: 'space-between' },
  idBottomMetaRow: {},
  idBottomValue: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#FFF', fontWeight: '700' },
  idStudioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 20 },
  studioIconBox: { width: 22, height: 14, gap: 3 },
  studioBar1: { height: 3, width: '100%', backgroundColor: '#FFF' },
  studioBar2: { height: 3, width: '70%', backgroundColor: '#FFF' },
  studioText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: 0.5 },

  // --- DASHBOARD SECTIONS ---
  dashboardSection: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: '#111' },

  // --- SCHEDULE CARD ---
  scheduleCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F2F4F7' },
  scheduleItem: { flex: 1, alignItems: 'center' },
  scheduleLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: '#999', letterSpacing: 1, marginBottom: 4 },
  scheduleValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15, color: '#111' },
  vDivider: { width: 1, height: 30, backgroundColor: '#F2F4F7' },

  timelineCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F2F4F7' },
  timelineStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  timelineCountText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: '#111', letterSpacing: 0.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C896' },
  liveText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, color: '#00C896' },
  emptyQueueBox: { padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyQueueText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: '#94A3B8', letterSpacing: 1 },
  queueTimelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 5 },
  itemCurrent: { backgroundColor: 'rgba(0,200,150,0.03)', borderRadius: 12 },
  rankContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 10, color: '#94A3B8' },
  rankTextCurrent: { color: '#111' },
  timelineLeft: { alignItems: 'center', width: 12 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', zIndex: 2 },
  dotCurrent: { backgroundColor: '#111', transform: [{ scale: 1.2 }] },
  dotStarted: { backgroundColor: '#00C896' },
  timelineLine: { position: 'absolute', top: 10, bottom: -20, width: 2, backgroundColor: '#F1F5F9', zIndex: 1 },
  timelineContent: { flex: 1, paddingLeft: 5 },
  contentCurrent: {},
  timelineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  timelineName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#64748B' },
  timeStack: { alignItems: 'flex-end' },
  timelineTime: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 11, color: '#111' },
  slotLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 7, color: '#94A3B8', letterSpacing: 0.5, marginTop: 1 },
  textCurrent: { color: '#111' },
  timelineStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timelineStatus: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, color: '#94A3B8', letterSpacing: 0.5 },
  livePulseMini: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#00C896' },
  currentIndicatorBox: { paddingLeft: 10 },

  actionDashboard: { gap: 15 },
  barberMiniCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F2F4F7' },
  miniBarberAvatar: { width: 44, height: 44, borderRadius: 22 },
  miniBarberInfo: { flex: 1 },
  miniBarberName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: '#111' },
  miniBarberRole: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#999' },
  miniActionCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9ECEF' },

  quickActionsGrid: { flexDirection: 'row', gap: 12 },
  actionTile: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F2F4F7' },
  tileIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#111' },

  serviceSummaryCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F2F4F7' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  summaryTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: '#111' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  serviceName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#666' },
  summaryDivider: { height: 1, backgroundColor: '#F2F4F7', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#999' },
  totalValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15, color: '#111' },

  policyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F2F4F7' },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  policyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#111' },
  policyText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: '#666' },

  assistanceBtn: { backgroundColor: '#FFF', height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: '#E9ECEF', borderStyle: 'dashed', marginTop: 10 },
  assistanceText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: '#111' },
  completedPassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 255, 0, 0.08)',
    borderColor: 'rgba(200, 255, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  completedPassBannerText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: SCREEN_WIDTH > 360 ? 11 : 9.5,
    color: '#C8FF00',
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  }
});

export default TrackQueueScreen;
