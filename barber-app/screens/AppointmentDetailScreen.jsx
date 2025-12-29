import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, RefreshControl, Alert, Linking, Platform, StatusBar, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Clock, User, DollarSign, Calendar, RefreshCw, Phone, MessageSquare, Briefcase, CheckCircle, XCircle, MapPin, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OtpInput from '../components/OtpInput';
import SwipeButton from '../components/SwipeButton';

const { width } = Dimensions.get('window');

const AppointmentDetailScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { appointment: initialAppointment, activeAppointments, isAnyAppointmentStarted } = route.params;
  const [appointment, setAppointment] = useState(initialAppointment);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Initial fetch on component mount
  useEffect(() => {
    if (initialAppointment && initialAppointment._id) {
      fetchAppointmentDetails();
    }
  }, []);

  const fetchAppointmentDetails = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/${appointment._id}`, {
        headers: { 'x-auth-token': token },
      });
      setAppointment(res.data);
    } catch (err) {
      console.error("Failed to fetch appointment details", err);
      Alert.alert('Error', 'Failed to refresh appointment details.');
    }
    setRefreshing(false);
  };

  const handleContact = () => {
    const customerName = appointment.isOfflineBooking ? appointment.customerName : (appointment.userId?.name || 'Customer');
    const customerPhone = appointment.isOfflineBooking ? appointment.customerPhone : appointment.userId?.phone;

    Alert.alert(
      `Contact ${customerName}`,
      "How would you like to contact the customer?",
      [
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${customerPhone}`),
          style: 'default',
        },
        {
          text: "WhatsApp",
          onPress: () => Linking.openURL(`whatsapp://send?phone=${customerPhone}`),
          style: 'default',
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleStartPress = () => {
    setShowOtpInput(true);
    setOtp('');
    setOtpError('');
  };

  const handleCompletePress = async () => {
    Alert.alert(
      'Complete Appointment',
      'Are you sure you want to mark this appointment as completed? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/complete/${appointment._id}`, {}, {
                headers: { 'x-auth-token': token },
              });
              if (response.status === 200) {
                Alert.alert('Success', 'Appointment completed successfully!');
                fetchAppointmentDetails(); 
              } else {
                throw new Error(response.data.message || 'Failed to complete appointment.');
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || error.message);
            }
          },
        },
      ]
    );
  };

  const verifyOtpAndStart = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    setOtpError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/verify-otp-and-start/${appointment._id}`, { otp }, {
        headers: { 'x-auth-token': token },
      });
      if (response.status === 200) {
        Alert.alert('Success', 'Appointment started successfully!');
        setShowOtpInput(false);
        setOtp('');
        fetchAppointmentDetails();
      } else {
        setOtpError(response.data.message || 'OTP verification failed.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred during OTP verification.';
      Alert.alert('Error', errorMessage);
      setOtpError(errorMessage);
    }
  };

  // Helper function to get status colors
  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed': return { text: '#2563EB', bg: '#EFF6FF', label: 'Confirmed' }; // Blue
      case 'started': return { text: '#D97706', bg: '#FFFBEB', label: 'In Progress' }; // Amber
      case 'completed': return { text: '#059669', bg: '#ECFDF5', label: 'Completed' }; // Emerald
      case 'cancelled': return { text: '#DC2626', bg: '#FEF2F2', label: 'Cancelled' }; // Red
      case 'pending': return { text: '#D97706', bg: '#FFFBEB', label: 'Pending' }; // Amber
      default: return { text: theme.colors.textSecondary, bg: theme.colors.border, label: status };
    }
  };

  const getPaymentStyle = (status) => {
    switch (status) {
      case 'completed': return { text: theme.colors.success, bg: `${theme.colors.success}15`, icon: <CheckCircle size={14} color={theme.colors.success} /> };
      case 'pending': return { text: theme.colors.danger, bg: `${theme.colors.danger}15`, icon: <XCircle size={14} color={theme.colors.danger} /> };
      default: return { text: theme.colors.textSecondary, bg: theme.colors.border, icon: null };
    }
  };

  // Early exit for missing appointment data
  if (!appointment || !appointment._id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Appointment details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const appointmentStatusStyle = getStatusStyle(appointment.status);
  const paymentStatusStyle = getPaymentStyle(appointment.paymentStatus);
  const isActionable = appointment.status === 'confirmed' || appointment.status === 'started';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* --- Premium Header --- */}
      <View style={[styles.header, { backgroundColor: '#F8F9FA' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Booking Details</Text>
        <TouchableOpacity onPress={fetchAppointmentDetails} style={styles.refreshButton}>
          <RefreshCw size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAppointmentDetails} tintColor={theme.colors.primary} />
        }
      >
        {/* --- Status Banner --- */}
        <View style={styles.bannerContainer}>
             <View style={[styles.mainStatusBadge, { backgroundColor: appointmentStatusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: appointmentStatusStyle.text }]} />
                <Text style={[styles.mainStatusText, { color: appointmentStatusStyle.text }]}>
                    {appointmentStatusStyle.label.toUpperCase()}
                </Text>
             </View>
             <Text style={styles.orderId}>ID: #{appointment._id.slice(-6).toUpperCase()}</Text>
        </View>

        {/* --- Customer Card (The "Hero") --- */}
        <View style={[styles.card, styles.customerCard]}>
            <View style={styles.customerHeader}>
                <View style={styles.profileContainer}>
                    {appointment.isOfflineBooking ? (
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                            <User size={28} color="#FFF" />
                        </View>
                    ) : (
                        (() => {
                            console.log('Appointment userId:', appointment.userId);
                            console.log('Profile picture:', appointment.userId?.profilePicture);
                            return appointment.userId && appointment.userId.profilePicture && appointment.userId.profilePicture.trim() !== '' ? (
                                <Image
                                    source={{
                                        uri: appointment.userId.profilePicture.startsWith("http")
                                            ? appointment.userId.profilePicture
                                            : `${process.env.EXPO_PUBLIC_API_URL}${appointment.userId.profilePicture}`
                                    }}
                                    style={styles.avatar}
                                    onError={(error) => {
                                        console.log('Profile image failed to load:', error);
                                    }}
                                />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={styles.avatarText}>
                                        {appointment.userId.name ? appointment.userId.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            );
                        })()
                    )}
                    <View style={styles.customerInfo}>
                        <Text style={[styles.customerName, { color: theme.colors.text }]}>
                            {appointment.isOfflineBooking ? appointment.customerName : (appointment.userId ? appointment.userId.name : 'Unknown User')}
                        </Text>
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={12} color={theme.colors.success} />
                            <Text style={[styles.verifiedText, { color: theme.colors.success }]}>Verified Customer</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.callBtn, { backgroundColor: theme.colors.success + '15' }]} 
                    onPress={handleContact}
                    disabled={!appointment.isOfflineBooking ? !appointment.userId?.phone : !appointment.customerPhone}
                >
                    <Phone size={20} color={theme.colors.success} />
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                    <Calendar size={18} color={theme.colors.textSecondary} style={{marginBottom: 4}} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text }]}>
                        {appointment.date ? format(new Date(appointment.date), 'dd MMM, yy') : 'N/A'}
                    </Text>
                </View>
                <View style={[styles.verticalLine, { backgroundColor: theme.colors.border }]} />
                <View style={styles.metaItem}>
                    <Clock size={18} color={theme.colors.textSecondary} style={{marginBottom: 4}} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text }]}>{appointment.time || 'N/A'}</Text>
                </View>
                <View style={[styles.verticalLine, { backgroundColor: theme.colors.border }]} />
                 <View style={styles.metaItem}>
                    <Briefcase size={18} color={theme.colors.textSecondary} style={{marginBottom: 4}} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Type</Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text }]}>{appointment.appointmentType || 'Standard'}</Text>
                </View>
            </View>
        </View>

        {/* --- Service Bill / Receipt --- */}
        <View style={[styles.card, styles.receiptCard]}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Service Details</Text>
                <View style={[styles.statusBadge, { backgroundColor: paymentStatusStyle.bg }]}>
                    {paymentStatusStyle.icon}
                    <Text style={[styles.badgeText, { color: paymentStatusStyle.text }]}>
                         {appointment.paymentStatus ? appointment.paymentStatus.toUpperCase() : 'N/A'}
                    </Text>
                </View>
            </View>

            <View style={styles.serviceList}>
                {appointment.services && appointment.services.length > 0 ? (
                    appointment.services.map((service, index) => (
                    <View key={index} style={styles.serviceRow}>
                        <View style={styles.serviceInfo}>
                            <View style={styles.bullet} />
                            <Text style={[styles.serviceName, { color: theme.colors.text }]}>{service.name}</Text>
                        </View>
                        <Text style={[styles.servicePrice, { color: theme.colors.text }]}>
                        ₹{(() => {
                            const priceValue = service?.price;
                            const parsedPrice = parseFloat(priceValue);
                            return isNaN(parsedPrice) ? '0.00' : parsedPrice.toFixed(2);
                            })()}
                        </Text>
                    </View>
                    ))
                ) : (
                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No services listed.</Text>
                )}
            </View>

            {/* Dotted Line Separator */}
            <View style={styles.dottedDivider}>
                 <View style={styles.halfCircleLeft} />
                 <View style={[styles.dots, { borderColor: theme.colors.border }]} />
                 <View style={styles.halfCircleRight} />
            </View>

            <View style={styles.totalContainer}>
                <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total Amount</Text>
                <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                    ₹{appointment.totalPrice ? appointment.totalPrice.toFixed(2) : '0.00'}
                </Text>
            </View>
        </View>

        {/* --- Action Section --- */}
        <View style={styles.footerActionContainer}>
            {/* OTP Section Card */}
            {showOtpInput && (
                <View style={[styles.card, styles.otpContainer, { borderColor: theme.colors.primary }]}>
                    <Text style={[styles.otpTitle, { color: theme.colors.text }]}>Verify Customer</Text>
                    <Text style={[styles.otpSubtitle, { color: theme.colors.textSecondary }]}>
                        Ask customer for the 6-digit OTP to start.
                    </Text>
                    
                    <OtpInput length={6} onComplete={setOtp} style={styles.otpInput} />
                    
                    {otpError ? (
                        <View style={styles.errorContainer}>
                            <XCircle size={14} color={theme.colors.danger} />
                            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{otpError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.otpBtnRow}>
                        <TouchableOpacity 
                            style={[styles.btnOutline, { borderColor: theme.colors.border }]} 
                            onPress={() => setShowOtpInput(false)}
                        >
                            <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.btnSolid, { backgroundColor: otp.length === 6 ? theme.colors.primary : '#ccc' }]} 
                            onPress={verifyOtpAndStart}
                            disabled={otp.length !== 6}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '700' }}>Verify & Start</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Swipe Action */}
            {isActionable && appointment.paymentStatus === 'completed' && !showOtpInput && (
              <View style={styles.swipeWrapper}>
                <SwipeButton
                  onSwipeSuccess={appointment.status === 'confirmed' ? handleStartPress : handleCompletePress}
                  title={appointment.status === 'confirmed' ? "Slide to Start Job" : "Slide to Complete Job"}
                  containerStyles={styles.swipeBtn}
                  customerPhoneNumber={appointment.userId?.phone}
                  disabled={
                    appointment.status === 'confirmed' && 
                    (isAnyAppointmentStarted || (activeAppointments && activeAppointments.length > 0 && activeAppointments[0]._id !== appointment._id))
                  }
                  thumbColor={appointment.status === 'confirmed' ? theme.colors.primary : theme.colors.success}
                  railBackgroundColor={appointment.status === 'confirmed' ? theme.colors.primary + '20' : theme.colors.success + '20'}
                  railBorderColor="transparent"
                  titleColor={appointment.status === 'confirmed' ? theme.colors.primary : theme.colors.success}
                />
                <Text style={styles.swipeHint}>
                    {appointment.status === 'confirmed' ? "Ensure you have reached the location" : "Ensure payment is collected"}
                </Text>
              </View>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // --- Layout ---
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  // --- Status Banner ---
  bannerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  mainStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  mainStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  // --- Customer Card ---
  customerCard: {
    padding: 0, 
    overflow: 'hidden'
  },
  customerHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalLine: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // --- Receipt Card ---
  receiptCard: {
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serviceList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  // --- Dotted Divider (Ticket Style) ---
  dottedDivider: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 0,
  },
  dots: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 1,
    width: '100%',
    height: 1,
    marginTop: 0,
  },
  halfCircleLeft: {
    position: 'absolute',
    left: -10,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8F9FA', // Matches screen background
    zIndex: 2,
  },
  halfCircleRight: {
    position: 'absolute',
    right: -10,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8F9FA', // Matches screen background
    zIndex: 2,
  },
  // --- Total ---
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // --- Footer Actions ---
  footerActionContainer: {
    marginTop: 10,
  },
  // --- OTP Styles ---
  otpContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: '#FDFEFF',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  otpSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  otpInput: {
    marginBottom: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 15,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  otpBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolid: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // --- Swipe ---
  swipeWrapper: {
    alignItems: 'center',
  },
  swipeBtn: {
    width: '100%',
    borderRadius: 100, // Pill shape
    overflow: 'hidden',
  },
  swipeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentDetailScreen;
