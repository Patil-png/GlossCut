import React, { useState, useRef, useEffect, useCallback, useMemo, memo, forwardRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Animated,
  Platform, ScrollView, StatusBar, KeyboardAvoidingView, Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};
import { Feather as Icon } from "@expo/vector-icons";
import { ShieldCheck, Calendar, Copy, FileText, MapPin, User as UserIcon, CheckCircle2 } from "lucide-react-native";
import api from "../utils/api";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { format } from "date-fns";
import * as Haptics from 'expo-haptics';

const formatBookingDate = (dateStr) => {
  if (!dateStr) return "Today";
  try {
    return format(new Date(dateStr), "dd MMM yyyy • hh:mm a");
  } catch (e) {
    return dateStr;
  }
};

const formatTimeOnly = () => format(new Date(), "hh:mm a");
const formatDateOnly = () => format(new Date(), "dd.MM.yyyy");

const ModernAlert = memo(({ visible, type, title, message, onClose, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }).start();
      const timer = setTimeout(() => handleClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(translateY, { toValue: -150, duration: 300, useNativeDriver: true }).start(() => {
      if (onClose) onClose();
    });
  }, [onClose, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.alertWrapper, { transform: [{ translateY }] }]}>
      <View style={[styles.alertContainer, { backgroundColor: '#333' }]}>
        <View style={[styles.accentStrip, { backgroundColor: type === "success" ? "#10B981" : "#EF4444" }]} />
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: '#FFF' }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: '#DDD' }]}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const DigitInput = memo(forwardRef(({ digit, index, loading, onChangeText, onKeyPress }, ref) => {
  return (
    <TextInput
      ref={ref}
      style={[styles.otpInput, { borderColor: digit ? '#FF4B2B' : '#334155' }]}
      maxLength={1}
      keyboardType="number-pad"
      onKeyPress={(e) => onKeyPress(e, index)}
      onChangeText={(text) => onChangeText(text, index)}
      value={digit}
      editable={!loading}
      selectionColor="#FF4B2B"
      placeholder="0"
      placeholderTextColor="#475569"
    />
  );
}));

const BookingOTPVerificationScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { bookingPayload, paymentParams } = route.params || {};

  // Normalize phone: strip +91 prefix if present, keep only 10 digits
  const cleanPhone = (raw) => {
    if (!raw) return '';
    const stripped = raw.replace(/^(\+91|91)/, '').replace(/\D/g, '');
    return stripped.slice(-10);
  };

  const [phone, setPhone] = useState(cleanPhone(user?.phone));
  const formattedPhone = useMemo(() => {
    if (phone && phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  }, [phone]);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: "success", title: "", message: "" });
  const inputs = useRef([]);

  const ticketRef = useMemo(() => {
    if (user && user._id) return `ORD-${user._id.slice(-6).toUpperCase()}`;
    return `ORD-PENDING`;
  }, [user]);

  const [queuePosition, setQueuePosition] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [estWaitTime, setEstWaitTime] = useState(null);

  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const barberId = bookingPayload?.barberId;
        if (!barberId) return;
        const today = new Date().toISOString().split('T')[0];

        const [countRes, waitRes] = await Promise.all([
          api.get(`/api/booking/barber-appointments-batch?barberIds=${barberId}&date=${today}`),
          api.post('/api/booking/public/batch-wait-times', { barberIds: [barberId] })
        ]);

        const count = countRes?.data?.[barberId];
        if (typeof count === 'number') setQueuePosition(count + 1);

        const wait = waitRes?.data?.waitTimes?.[barberId];
        if (typeof wait === 'number') setEstWaitTime(wait);
      } catch (e) {
        // silently fail
      }
    };
    fetchQueueData();
  }, [bookingPayload?.barberId]);

  const showAlert = useCallback((type, title, message) => {
    setAlertState({ visible: true, type, title, message });
    Haptics.notificationAsync(type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      showAlert("error", "Invalid Phone", "Please enter a valid 10-digit number.");
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Backend expects raw 10-digit or +91XXXXXXXXXX format
      await api.post(`/api/auth/whatsapp/send-booking-otp`, { phone: phone.replace(/^(\+91|91)/, '') });
      setPhoneSubmitted(true);
    } catch (err) {
      showAlert("error", "Failed", err.response?.data?.error || "Could not send OTP. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((text, index) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = cleaned ? cleaned.charAt(cleaned.length - 1) : "";
      return newOtp;
    });
    if (cleaned && index < 5) inputs.current[index + 1]?.focus();
    else if (cleaned && index === 5) Keyboard.dismiss();
  }, []);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0) {
      setOtp(prev => {
        if (!prev[index]) {
          inputs.current[index - 1]?.focus();
          const newOtp = [...prev];
          newOtp[index - 1] = "";
          return newOtp;
        }
        return prev;
      });
    }
  }, []);

  const handleVerifyAndBook = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      showAlert("error", "Incomplete Code", "Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    try {
      await api.post(`/api/auth/whatsapp/verify-booking-otp`, { phone, otp: otpCode });
      let res;
      try {
        res = await api.post(`/api/booking`, bookingPayload, { timeout: 12000 });
      } catch (err) {
        showAlert("error", "Booking Failed", err.response?.data?.msg || "Failed to book.");
        setLoading(false);
        return;
      }
      setTimeout(() => {
        navigation.replace("PaymentConfirmation", {
          ...paymentParams, bookingId: res.data._id, paymentConfirmed: true, bookingOtp: res.data.otp,
        });
      }, 500);
    } catch (err) {
      showAlert("error", "Verification Failed", err.response?.data?.error || "Incorrect OTP.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}
    >
      <StatusBar barStyle="dark-content" />
      <ModernAlert {...alertState} onClose={() => setAlertState(p => ({ ...p, visible: false }))} theme={theme} />

      {/* Simple Professional Header */}
      <View style={styles.premiumHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtnBox}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Icon name="chevron-left" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleMain}>Verify Booking</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Box: Order # */}
        <View style={styles.topBox}>
          <View style={styles.topIconBox}>
            <ShieldCheck size={26} color="#FF4B2B" strokeWidth={2} />
          </View>
          <View>
            <View style={styles.orderRow}>
              <Text style={styles.orderTitle}>Ref: {ticketRef}</Text>
              <Copy size={16} color="#888" style={{ marginLeft: 8 }} />
            </View>
            <Text style={styles.orderSub}>Status: Awaiting Verification</Text>
          </View>
        </View>

        {/* Payment Disclaimer Banner */}
        <View style={{ backgroundColor: '#ECFDF5', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#D1FAE5' }}>
          <Icon name="check-circle" size={20} color="#059669" />
          <Text style={{ marginLeft: 10, fontSize: 13.5, color: '#065F46', fontWeight: '700', flex: 1 }}>
            Book for Free! Pay at the shop later.
          </Text>
        </View>

        {/* Dynamic Progress Timeline */}
        <View style={styles.timelineWrapper}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineNode, styles.nodeCompleted]}>
              <Icon name="check" size={10} color="#FFF" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timelineLabelActive}>Services</Text>
          </View>

          <View style={[styles.timelineConnector, styles.connectorCompleted]} />

          <View style={styles.timelineItem}>
            <View style={[styles.timelineNode, styles.nodeActive]}>
              <View style={styles.nodeInnerPulse} />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timelineLabelActive}>Verification</Text>
          </View>

          <View style={[styles.timelineConnector, phoneSubmitted ? styles.connectorCompleted : styles.connectorPending]} />

          <View style={styles.timelineItem}>
            <View style={[styles.timelineNode, styles.nodePending]} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timelineLabelPending}>Confirmed</Text>
          </View>
        </View>



        {/* Package Details (Mapped to Booking Details) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="file-text" size={16} color="#FF4B2B" />
            <Text style={styles.cardTitle}>Booking Summary</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Shop</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{paymentParams?.shopName || "Our Shop"}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Barber</Text>
            <Text style={styles.cardValue}>{paymentParams?.providerName || "Any Barber"}</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Services</Text>
            <Text style={[styles.cardValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {paymentParams?.selectedServices?.map(s => s.name).join(', ') || "Custom Service"}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Est. Queue</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="users" size={12} color="#6B7280" />
              <Text style={styles.cardValue}>{queuePosition ? `Pos #${queuePosition}` : "Searching..."}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Est. Wait Time</Text>
            <Text style={[styles.cardValue, { color: '#FF4B2B' }]}>
              {estWaitTime !== null ? `~${estWaitTime} mins` : "Calculating..."}
            </Text>
          </View>

          <View style={[styles.cardRow, { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
            <Text style={[styles.cardLabel, { fontWeight: '800', color: '#111827' }]}>Amount to pay</Text>
            <Text style={[styles.cardValue, { fontSize: 18, color: '#111827' }]}>
              ₹{Number(paymentParams?.totalPrice || paymentParams?.totalAmount || 0).toFixed(0)}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment Mode</Text>
            <View style={styles.paymentPillSmall}>
              <Text style={styles.paymentPillText}>Pay at Shop</Text>
            </View>
          </View>
        </View>

        {/* Vintage Scalloped Ticket Preview */}
        <View style={styles.scallopedTicket}>
          {/* Left Scallops */}
          <View style={styles.leftScallops}>
            {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={[styles.scallopCircle, { transform: [{ translateX: -5 }] }]} />)}
          </View>

          <View style={styles.ticketMainSection}>
            <View style={styles.innerTicketBorder}>
              <View style={styles.ticketHeaderVintage}>
                <Text style={styles.shopNameVintage} numberOfLines={1}>{paymentParams?.shopName || "GLOSSCUT STUDIO"}</Text>
                <Text style={styles.serviceVintage} numberOfLines={1}>
                  {paymentParams?.selectedServices?.length || 0} SERVICES • ₹{Number(paymentParams?.totalPrice || 0).toFixed(0)}
                </Text>
              </View>
              <View style={styles.vintageDivider} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <Icon name="lock" size={14} color="#5D4037" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, color: '#5D4037', fontWeight: '800', letterSpacing: 1 }}>TOKEN LOCKED</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#8D6E63', textAlign: 'center', marginTop: 4, fontWeight: '600' }}>Verify OTP to reveal Entry Code</Text>
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
              <View style={styles.barcodeContainer}>
                {[2, 4, 1, 3, 2, 5, 1, 4, 2].map((w, i) => (
                  <View key={i} style={[styles.barcodeLine, { width: w }]} />
                ))}
              </View>
              <Text style={styles.stubOtpText}>***</Text>
            </View>
          </View>

          {/* Right Scallops */}
          <View style={styles.rightScallops}>
            {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={[styles.scallopCircle, { transform: [{ translateX: 5 }] }]} />)}
          </View>
        </View>

        {/* Sender Details (Mapped to Customer Details) */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={styles.cardHeader}>
            <UserIcon size={16} color="#555" />
            <Text style={styles.cardTitle}>Customer details</Text>
          </View>

          <View style={styles.customerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.customerAvatar}>
                <Text style={{ fontSize: 20, color: '#FFF', fontWeight: '800' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.customerName}>{user?.name || "Guest User"}</Text>
                <Text style={styles.customerSub}>{user?.email || phone || "User Account"}</Text>
              </View>
            </View>

            <View style={styles.safeBadge}>
              <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.safeBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* WhatsApp Phone Input Section (styled like EditPhoneNumberScreen) */}
        {!phoneSubmitted && (
          <View style={[styles.card, { marginBottom: 40 }]}>
            <View style={styles.cardHeader}>
              <Icon name="phone" size={16} color="#FF4B2B" />
              <Text style={styles.cardTitle}>Verification Number</Text>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputOutline}>
                <View style={styles.labelBackground}>
                  <Text style={styles.inputLabel}>WHATSAPP MOBILE</Text>
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  <View style={styles.verticalDivider} />
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setPhone(cleaned.slice(0, 10));
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="WhatsApp phone number"
                  />
                  {phone.length === 10 && <CheckCircle2 size={18} color="#10B981" />}
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Sticky Verification Footer */}
      <View
        style={[
          styles.footerContainer,
          {
            height: phoneSubmitted
              ? (keyboardVisible ? 172 : 172 + insets.bottom)
              : (keyboardVisible ? 60 : 62 + insets.bottom),
            paddingBottom: keyboardVisible ? 4 : insets.bottom,
            paddingTop: 10,
            justifyContent: 'flex-start'
          }
        ]}
      >
        {!phoneSubmitted ? (
          <TouchableOpacity
            style={[styles.giantButton, { backgroundColor: '#FF4B2B' }]}
            onPress={handleSendOTP}
            disabled={loading || phone.length !== 10}
          >
            <Text style={styles.giantButtonText}>
              {loading ? "Processing..." : "Get OTP via WhatsApp"}
            </Text>
          </TouchableOpacity>
        ) : (
          // OTP entry state
          <View style={{ width: '100%' }}>
            <View style={[styles.otpHeader, { justifyContent: 'center' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.liveIndicator} />
                <Text style={styles.otpStatusText}>We sent a code to +91 {formattedPhone}</Text>
              </View>
            </View>

            <View style={styles.otpGrid}>
              {otp.map((d, i) => (
                <DigitInput key={i} index={i} digit={d} loading={loading} onChangeText={handleChange} onKeyPress={handleKeyPress} ref={el => inputs.current[i] = el} />
              ))}
            </View>

            <TouchableOpacity
              style={styles.giantButton}
              onPress={handleVerifyAndBook}
              disabled={loading}
            >
              <Text style={styles.giantButtonText}>
                {loading ? "Processing..." : "Confirm & Book"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={!loading ? handleSendOTP : null} style={styles.resendBtn}>
              <Text style={styles.resendText}>
                Didn't receive code? <Text style={{ color: '#FF4B2B', fontWeight: '800' }}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Premium Header
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backBtnBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3
  },
  headerRightBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  // Alerts
  alertWrapper: { position: 'absolute', top: 60, width: '100%', zIndex: 999, paddingHorizontal: 20 },
  alertContainer: { flexDirection: "row", borderRadius: 12, overflow: "hidden", elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  accentStrip: { width: 5 },
  alertContent: { padding: 15, flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: "700" },
  alertMessage: { fontSize: 13, marginTop: 2 },

  // Top Box
  topBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  topIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  orderTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  orderSub: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Sticky Footer
  footerContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#0F172A', // Premium Dark Navy
    borderTopLeftRadius: 30, // More rounded for premium look
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  phonePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E272E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#2F3640'
  },
  pillIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 75, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pillLabel: { fontSize: 9, color: '#808E9B', fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  phonePillText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  compactBtn: {
    backgroundColor: '#FF4B2B',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  compactBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Progress Bar
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingHorizontal: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressLine: { flex: 1, height: 2, marginHorizontal: 4 },

  // Inputs & Button
  inputSection: { marginBottom: 12 },
  simpleInput: { backgroundColor: '#1E293B', height: 50, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155', color: '#FFFFFF' },

  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  otpStatusText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', letterSpacing: 0.2 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71' },

  otpGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 },
  otpInput: { width: 44, height: 50, borderRadius: 14, backgroundColor: '#1E293B', borderWidth: 1.5, borderColor: '#334155', fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#FFFFFF' },

  giantButton: { backgroundColor: '#FF4B2B', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#FF4B2B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  giantButtonText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  resendBtn: { alignItems: 'center', paddingVertical: 2 },
  resendText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },

  // Timeline Progress
  timelineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  nodeCompleted: {
    backgroundColor: '#FF4B2B',
    borderColor: '#FF4B2B',
  },
  nodeActive: {
    backgroundColor: '#FFF',
    borderColor: '#FF4B2B',
  },
  nodeInnerPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B2B',
  },
  nodePending: {
    backgroundColor: '#FFF',
    borderColor: '#E5E7EB',
  },
  timelineLabelActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  timelineLabelPending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  timelineConnector: {
    height: 2,
    flex: 1,
    marginTop: -20, // Align with nodes
    zIndex: 1,
  },
  connectorCompleted: {
    backgroundColor: '#FF4B2B',
  },
  connectorPending: {
    backgroundColor: '#E5E7EB',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardHeaderSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginLeft: 8, color: '#111827' },
  seeMore: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  cardValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
  paymentPillSmall: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  paymentPillText: { color: '#166534', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Scalloped Ticket Preview
  scallopedTicket: {
    flexDirection: 'row',
    backgroundColor: '#F8F1E7',
    overflow: 'hidden',
    marginBottom: 16,
    height: 190,
  },
  leftScallops: { width: 10, justifyContent: 'space-around', alignItems: 'flex-start', backgroundColor: '#FFFFFF' },
  rightScallops: { width: 10, justifyContent: 'space-around', alignItems: 'flex-end', backgroundColor: '#FFFFFF' },
  scallopCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', marginVertical: 2 },
  ticketMainSection: { flex: 1, paddingVertical: 10, paddingLeft: 8, paddingRight: 6 },
  innerTicketBorder: { flex: 1, borderWidth: 1, borderColor: '#8D6E63', borderStyle: 'dashed', borderRadius: 8, padding: 8, justifyContent: 'center' },
  ticketHeaderVintage: { alignItems: 'center' },
  shopNameVintage: { fontSize: 13, fontWeight: '900', color: '#5D4037', letterSpacing: 1, textTransform: 'uppercase' },
  serviceVintage: { fontSize: 10, color: '#5D4037', fontWeight: '700', marginTop: 2 },
  vintageDivider: { height: 1, backgroundColor: '#8D6E63', opacity: 0.4, marginVertical: 6 },
  vintagePerforation: { width: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  perfCutoutTop: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', position: 'absolute', top: -10 },
  perfCutoutBottom: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', position: 'absolute', bottom: -10 },
  perfLine: { width: 1, height: '100%', borderWidth: 1, borderColor: '#D7CCC8', borderStyle: 'dashed' },
  ticketStubSection: { width: 80, paddingVertical: 10, paddingRight: 8 },
  innerStubBorder: { flex: 1, borderWidth: 1, borderColor: '#8D6E63', borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  barcodeContainer: { flexDirection: 'row', height: 22, alignItems: 'flex-end', marginBottom: 4, opacity: 0.5 },
  barcodeLine: { height: '100%', backgroundColor: '#5D4037', marginHorizontal: 1 },
  stubOtpText: { fontSize: 22, fontWeight: '900', color: '#5D4037', letterSpacing: 2 },

  // Customer Card
  customerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customerAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  customerName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  customerSub: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  safeBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  safeBadgeText: { color: '#059669', fontSize: 11, fontWeight: '800' },

  // Input Section Styles (like EditPhoneNumberScreen)
  inputWrapper: {
    width: "100%",
    marginTop: normalize(12)
  },
  inputOutline: {
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    backgroundColor: "#F8FAFC"
  },
  labelBackground: {
    position: "absolute",
    top: normalize(-8),
    left: normalize(12),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: normalize(4),
    zIndex: 1
  },
  inputLabel: {
    fontSize: normalize(9),
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.8
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  countryCode: {
    fontSize: normalize(15),
    color: "#0F172A",
    fontWeight: "800"
  },
  verticalDivider: {
    width: 2,
    height: normalize(24),
    backgroundColor: "#E2E8F0",
    marginHorizontal: normalize(16),
    borderRadius: 1
  },
  textInput: {
    flex: 1,
    fontSize: normalize(16),
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: 1
  }
});

export default BookingOTPVerificationScreen;
