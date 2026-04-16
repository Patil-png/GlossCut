import React, { useEffect, useRef, useMemo } from "react";
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
  LayoutAnimation
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Bell,
  Clock,
  CheckCircle,
  Share2,
  Info,
  Calendar,
  ShieldAlert,
  ChevronRight,
  Gift,
  Zap,
  Trash2,
  ArrowRight,
  ClipboardList,
  MapPin,
  HelpCircle
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from "date-fns";
import api from "../utils/api";
import SalonIllustration from "../src/components/illustrations/SalonIllustration";

const { width } = Dimensions.get("window");

// --- 1. UTILS ---
const getNotificationTheme = (type) => {
  switch (type?.toLowerCase()) {
    case 'booking':
    case 'appointment':
      return { bg: '#E0F2FE', color: '#0284C7', icon: Calendar, label: 'Booking' };
    case 'promo':
    case 'offer':
      return { bg: '#FEF3C7', color: '#D97706', icon: Gift, label: 'Promotion' };
    case 'alert':
    case 'system':
      return { bg: '#FEE2E2', color: '#DC2626', icon: ShieldAlert, label: 'System Alert' };
    default:
      return { bg: '#F1F5F9', color: '#64748B', icon: Bell, label: 'Notification' };
  }
};

const DashedLine = () => (
  <View style={styles.dashedContainer}>
    {[...Array(20)].map((_, i) => (
      <View key={i} style={styles.dash} />
    ))}
  </View>
);

const StatusStep = ({ title, desc, completed, current, last }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepLeft}>
      <View style={[styles.stepDot, { backgroundColor: completed || current ? '#000' : '#E5E7EB' }]}>
        {completed && <CheckCircle size={10} color="#FFF" strokeWidth={3} />}
      </View>
      {!last && <View style={[styles.stepLine, { backgroundColor: completed ? '#000' : '#E5E7EB' }]} />}
    </View>
    <View style={styles.stepRight}>
      <Text style={[styles.stepTitle, { color: completed || current ? '#000' : '#9CA3AF' }]}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  </View>
);

const NotificationDetailScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notification } = route.params || {};
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const nTheme = getNotificationTheme(notification?.type);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();

    const markAsRead = async () => {
      if (!notification?._id) return;
      try {
        await api.put(`/api/notifications/${notification._id}/read`);
      } catch (err) { }
    };
    markAsRead();
  }, [notification]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleViewSalon = () => {
    if (notification.shopId || notification.salonId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Booking', { salonId: notification.shopId || notification.salonId });
    }
  };

  if (!notification) return null;

  // --- Dynamic Status Logic ---
  const status = notification.status?.toLowerCase() || 'pending';
  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed' || status === 'assigned';
  const isCompleted = status === 'completed' || status === 'success';

  return (
    <View style={[styles.container, { backgroundColor: '#F3F4F6' }]}>
      <StatusBar barStyle="dark-content" />

      {/* --- ELITE NAV HEADER --- */}
      <BlurView
        tint="light"
        intensity={90}
        style={[styles.blurHeader, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtnCircle}>
            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Update Details</Text>
          <TouchableOpacity style={styles.backBtnCircle}>
            <Share2 size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80, paddingBottom: 150 }]}
      >
        {/* --- TICKET CARD --- */}
        <Animated.View style={[styles.ticketCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* TOP SECTION: ILLUSTRATION */}
          <View style={styles.ticketTop}>
            <View style={styles.illustrationWrap}>
              <SalonIllustration size={140} />
            </View>
            <View style={[styles.statusTag, { backgroundColor: nTheme.bg }]}>
              <Text style={[styles.statusTagText, { color: nTheme.color }]}>{nTheme.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* DASHED SEPARATOR */}
          <View style={styles.separatorContainer}>
            <View style={styles.sideCutoutLeft} />
            <DashedLine />
            <View style={styles.sideCutoutRight} />
          </View>

          {/* BOTTOM SECTION: INFO */}
          <View style={styles.ticketBottom}>
            <Text style={styles.titleText}>{notification.title}</Text>
            <Text style={styles.messageText}>{notification.message}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{format(parseISO(notification.createdAt || new Date().toISOString()), 'h:mm a')}</Text>
              </View>
              <View style={styles.infoBox}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{format(parseISO(notification.createdAt || new Date().toISOString()), 'MMM dd, yyyy')}</Text>
              </View>
              <View style={styles.infoBox}>
                <ClipboardList size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Order ID</Text>
                <Text style={styles.infoValue}>#{notification.relatedId?.slice(-6).toUpperCase() || notification._id?.slice(-6).toUpperCase() || '88291'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* --- PROGRESS TRACKER (BLINKIT STYLE) --- */}
        <Animated.View style={[styles.progressSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>STATUS UPDATE</Text>
          <View style={styles.progressCard}>
            <StatusStep
              title="Update Received"
              desc="We've processed this notification for you."
              completed
            />
            <StatusStep
              title={isPending ? "Pending Action" : "Action Completed"}
              desc={isPending ? "We are waiting for professional confirmation." : "The professional has confirmed your session."}
              completed={isConfirmed || isCompleted}
              current={isPending}
            />
            <StatusStep
              title="Session Complete"
              desc="All updates from this session are finalized."
              completed={isCompleted}
              current={isConfirmed}
              last
            />
          </View>
        </Animated.View>

        {/* --- HELP SECTION --- */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
          <View style={styles.helpGrid}>
            <TouchableOpacity style={styles.helpBotton} onPress={() => navigation.navigate('Chat')}>
              <HelpCircle size={20} color="#000" />
              <Text style={styles.helpBtnText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpBotton} onPress={handleViewSalon}>
              <MapPin size={20} color="#000" />
              <Text style={styles.helpBtnText}>View Salon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- STICKY GLOSSY FOOTER --- */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity activeOpacity={0.9} style={styles.primaryAction} onPress={() => navigation.navigate('Home')}>
          <LinearGradient
            colors={['#1A1A1A', '#333333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.actionText}>Schedule Next Session</Text>
            <Zap size={18} color={theme.colors.primary} fill={theme.colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  headerContent: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: "center",
    alignItems: "center"
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  scrollContent: {
    paddingHorizontal: 16
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden"
  },
  ticketTop: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center"
  },
  illustrationWrap: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    overflow: "hidden"
  },
  sideCutoutLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginLeft: -12
  },
  sideCutoutRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: -12
  },
  dashedContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12
  },
  dash: {
    width: 6,
    height: 1.5,
    backgroundColor: '#E5E7EB',
    borderRadius: 1
  },
  ticketBottom: {
    padding: 24
  },
  titleText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#000",
    marginBottom: 12,
    textAlign: "center"
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 24
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    paddingTop: 20
  },
  infoBox: {
    alignItems: "center"
  },
  infoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4
  },
  infoValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: "800",
    marginTop: 2
  },
  progressSection: {
    marginTop: 32
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: '#9CA3AF',
    marginBottom: 16,
    marginLeft: 4
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 60
  },
  stepLeft: {
    alignItems: "center",
    width: 24,
    marginRight: 16
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: -2,
    zIndex: 1
  },
  stepRight: {
    flex: 1,
    paddingBottom: 20
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4
  },
  stepDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: "500"
  },
  helpSection: {
    marginTop: 32
  },
  helpGrid: {
    flexDirection: "row",
    gap: 12
  },
  helpBotton: {
    flex: 1,
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  helpBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000"
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: 'rgba(243,244,246,0.95)'
  },
  primaryAction: {
    height: 64,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  actionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2
  }
});

export default NotificationDetailScreen;
