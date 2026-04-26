import React, { useState, useRef, useEffect, useCallback, useMemo, memo, forwardRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Animated,
  Platform, ScrollView, StatusBar, KeyboardAvoidingView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      style={[styles.otpInput, { borderColor: digit ? '#FF4B2B' : '#E5E7EB' }]}
      maxLength={1}
      keyboardType="number-pad"
      onKeyPress={(e) => onKeyPress(e, index)}
      onChangeText={(text) => onChangeText(text, index)}
      value={digit}
      editable={!loading}
      selectionColor="#FF4B2B"
    />
  );
}));

const BookingOTPVerificationScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { bookingPayload, paymentParams } = route.params || {};

  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: "success", title: "", message: "" });
  const inputs = useRef([]);

  const ticketRef = useMemo(() => {
    if (user && user._id) return `ORD-${user._id.slice(-6).toUpperCase()}`;
    return `ORD-PENDING`;
  }, [user]);

  const queuePosition = useMemo(() => Math.floor(Math.random() * 4) + 2, []);

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
      await api.post(`/api/auth/whatsapp/send-booking-otp`, { phone });
      setPhoneSubmitted(true);
    } catch (err) {
      showAlert("error", "Failed", err.response?.data?.error || "Could not send OTP.");
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
      style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}
    >
      <StatusBar barStyle="dark-content" />
      <ModernAlert {...alertState} onClose={() => setAlertState(p => ({ ...p, visible: false }))} theme={theme} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Icon name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Information</Text>
        <TouchableOpacity>
          <Icon name="maximize" size={20} color="#111" />
        </TouchableOpacity>
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
            No upfront payment. You will pay securely at the shop after your service.
          </Text>
        </View>

        {/* Progress Bar Mock */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: '#FF4B2B' }]} />
          <View style={[styles.progressLine, { backgroundColor: '#FF4B2B' }]} />
          <View style={[styles.progressDot, { backgroundColor: phoneSubmitted ? '#FF4B2B' : '#E5E7EB' }]} />
          <View style={[styles.progressLine, { backgroundColor: phoneSubmitted ? '#FF4B2B' : '#E5E7EB' }]} />
          <View style={[styles.progressDot, { backgroundColor: '#E5E7EB' }]} />
        </View>



        {/* Package Details (Mapped to Booking Details) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileText size={16} color="#555" />
            <Text style={styles.cardTitle}>Booking details</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Shop</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{paymentParams?.shopName || "Unknown Shop"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment Mode</Text>
            <Text style={[styles.cardValue, { color: '#059669' }]}>Pay at Shop</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount to Pay</Text>
            <Text style={styles.cardValue}>INR {Number(paymentParams?.totalPrice || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Est. Queue</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Icon name="users" size={12} color="#EA580C" style={{ marginRight: 6 }} />
              <Text style={[styles.cardValue, { color: '#EA580C', fontSize: 13 }]}>Position #{queuePosition}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Services</Text>
            <Text style={styles.cardValue}>{paymentParams?.selectedServices?.length || 0} Selected</Text>
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
        <View style={[styles.card, { marginBottom: 40 }]}>
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

      </ScrollView>

      {/* Sticky Verification Footer */}
      <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Clean, Minimal Footer */}
        {!phoneSubmitted ? (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
              Verification code will be sent to your account:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Icon name="lock" size={12} color="#111827" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginLeft: 6, letterSpacing: 0.5 }}>
                +91 {phone || "No Linked Number"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.otpGrid}>
            {otp.map((d, i) => (
              <DigitInput key={i} index={i} digit={d} loading={loading} onChangeText={handleChange} onKeyPress={handleKeyPress} ref={el => inputs.current[i] = el} />
            ))}
          </View>
        )}

        {/* Giant Orange Button */}
        <TouchableOpacity
          style={[styles.giantButton, { marginBottom: phoneSubmitted ? 16 : 0 }]}
          onPress={phoneSubmitted ? handleVerifyAndBook : handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.giantButtonText}>
            {loading ? "Processing..." : (phoneSubmitted ? "Confirm & Book" : `Send Verification Code`)}
          </Text>
        </TouchableOpacity>

        {phoneSubmitted && (
          <TouchableOpacity onPress={!loading ? handleSendOTP : null} style={styles.resendBtn}>
            <Text style={styles.resendText}>Didn't receive code? <Text style={{ color: '#FF4B2B' }}>Resend</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
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
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10
  },

  // Progress Bar
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingHorizontal: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressLine: { flex: 1, height: 2, marginHorizontal: 4 },

  // Inputs & Button
  inputSection: { marginBottom: 20 },
  simpleInput: { backgroundColor: '#F9FAFB', height: 60, borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  otpGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  otpInput: { width: 44, height: 55, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1.5, fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#111' },

  giantButton: { backgroundColor: '#FF4B2B', height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF4B2B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  giantButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  resendBtn: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  resendText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },

  // Cards
  card: { backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardHeaderSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginLeft: 8, color: '#111827' },
  seeMore: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  cardValue: { color: '#111827', fontSize: 14, fontWeight: '700' },

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
  safeBadgeText: { color: '#059669', fontSize: 11, fontWeight: '800' }
});

export default BookingOTPVerificationScreen;
