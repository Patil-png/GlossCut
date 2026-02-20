import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl, Alert, Linking, Platform, StatusBar, Dimensions, Image, Modal, FlatList } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import CustomToast from '../components/CustomToast';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Clock, User, DollarSign, Calendar, RefreshCw, Phone, MessageSquare, Briefcase, CheckCircle, XCircle, MapPin, ShieldCheck, ChevronRight, ArrowRightCircle, Plus, X } from 'lucide-react-native';
import { format } from 'date-fns';
import api from "../utils/api";
import OtpInput from '../components/OtpInput';


const { width } = Dimensions.get('window');

const AppointmentDetailScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { appointment: initialAppointment, activeAppointments, isAnyAppointmentStarted } = route.params;
  const [appointment, setAppointment] = useState(initialAppointment);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Add Services Modal States
  const [showAddServicesModal, setShowAddServicesModal] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isAddingServices, setIsAddingServices] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (initialAppointment && initialAppointment._id) {
      fetchAppointmentDetails();
    }
  }, []);

  const fetchAppointmentDetails = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/api/booking/${appointment._id}`);
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
              const response = await api.put(`/api/booking/complete/${appointment._id}`, {});
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
      const response = await api.post(`/api/booking/verify-otp-and-start/${appointment._id}`, { otp });
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

  // Fetch barber's available services
  const fetchAvailableServices = async () => {
    try {
      console.log('🔍 Fetching services from barber card...');
      console.log('📋 Appointment services:', JSON.stringify(appointment.services, null, 2));

      // Fetch from barber card endpoint which contains services
      const response = await api.get('/api/barber-card/my-card');
      console.log('✅ Barber card response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.services) {
        // Filter out services already in the appointment
        // Appointment stores barber card service._id in its id field
        // BUT some old bookings may use the timestamp-based id instead
        const currentServiceIds = appointment.services.map(s => s.id);
        const newServices = response.data.services.filter(
          service => !currentServiceIds.includes(service._id) && !currentServiceIds.includes(service.id)
        );

        console.log(`✅ Total services: ${response.data.services.length}, Already added: ${appointment.services.length}, Available to add: ${newServices.length}`);
        setAvailableServices(newServices);

        if (newServices.length === 0) {
          showToast('This customer already has all your available services!', 'info');
        }
      } else {
        console.log('❌ No services found in barber card');
        showToast('You haven\'t added any services to your barber card yet.', 'warning');
      }
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      if (error.response?.status === 404) {
        showToast('Please create your barber card first to add services.', 'error');
      } else {
        showToast('Failed to load services', 'error');
      }
    }
  };

  // Handle opening add services modal
  const handleOpenAddServices = () => {
    setSelectedServices([]); // Clear any previous selections
    setAvailableServices([]); // Clear old services list to prevent flash
    setShowAddServicesModal(true);
    fetchAvailableServices();
  };

  // Handle closing add services modal
  const handleCloseAddServices = () => {
    setSelectedServices([]); // Clear selections on close
    setShowAddServicesModal(false);
  };

  // Toggle service selection
  const toggleServiceSelection = (service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Add selected services to appointment
  const handleAddServices = async () => {
    if (selectedServices.length === 0) {
      showToast('Please select at least one service to add', 'warning');
      return;
    }

    setIsAddingServices(true);
    try {
      const response = await api.put(`/api/booking/${appointment._id}/add-services`, {
        services: selectedServices
      });

      if (response.data) {
        showToast(`Added ${selectedServices.length} service(s) successfully!`, 'success');
        setShowAddServicesModal(false);
        setSelectedServices([]);
        fetchAppointmentDetails(); // Refresh appointment data
      }
    } catch (error) {
      console.error('Error adding services:', error);
      showToast(error.response?.data?.msg || 'Failed to add services', 'error');
    } finally {
      setIsAddingServices(false);
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

      {/* Toast Notification */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* --- Premium Header --- */}
      <View style={[styles.header, { backgroundColor: '#F8F9FA' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              <Image
                source={require('../assets/GlossCut.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
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

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[
                  styles.contactBtn,
                  { backgroundColor: appointment.status === 'completed' ? '#9CA3AF15' : '#2563EB15' },
                  appointment.status === 'completed' && { opacity: 0.5 }
                ]}
                onPress={() => {
                  navigation.navigate('Chat', { recipientId: appointment.userId?._id, recipientName: appointment.userId?.name });
                }}
                disabled={appointment.isOfflineBooking || !appointment.userId || appointment.status === 'completed'}
              >
                <MessageSquare size={20} color={appointment.status === 'completed' ? '#9CA3AF' : "#2563EB"} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactBtn,
                  { backgroundColor: appointment.status === 'completed' ? '#9CA3AF15' : theme.colors.success + '15' },
                  appointment.status === 'completed' && { opacity: 0.5 }
                ]}
                onPress={handleContact}
                disabled={(!appointment.isOfflineBooking ? !appointment.userId?.phone : !appointment.customerPhone) || appointment.status === 'completed'}
              >
                <Phone size={20} color={appointment.status === 'completed' ? '#9CA3AF' : theme.colors.success} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Calendar size={18} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Date</Text>
              <Text style={[styles.metaValue, { color: theme.colors.text }]}>
                {appointment.date ? format(new Date(appointment.date), 'dd MMM, yy') : 'N/A'}
              </Text>
            </View>
            <View style={[styles.verticalLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.metaItem}>
              <Clock size={18} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Time</Text>
              <Text style={[styles.metaValue, { color: theme.colors.text }]}>{appointment.time || 'N/A'}</Text>
            </View>
            <View style={[styles.verticalLine, { backgroundColor: theme.colors.border }]} />
            <View style={styles.metaItem}>
              <Briefcase size={18} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
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
                    <CheckCircle size={18} color="#059669" fill="#059669" style={{ marginRight: 10 }} />
                    <Text style={[styles.serviceName, { color: theme.colors.text }]}>{service.name}</Text>
                  </View>
                  <Text style={[styles.servicePrice, { color: '#059669' }]}>
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

          {/* Add More Services Button - For Started Appointments */}
          {appointment.status === 'started' && !showOtpInput && (
            <TouchableOpacity
              style={[styles.addServicesButton, { backgroundColor: '#F0F7FF', borderColor: '#DBEAFE' }]}
              onPress={handleOpenAddServices}
            >
              <View style={styles.addServicesIcon}>
                <Plus size={24} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addServicesTitle}>Add More Services</Text>
                <Text style={styles.addServicesSubtitle}>Customer wants additional services?</Text>
              </View>
              <ChevronRight size={20} color="#2563EB" />
            </TouchableOpacity>
          )}

        </View>

      </ScrollView>

      {/* Add Services Modal */}
      <Modal
        visible={showAddServicesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAddServices}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Services</Text>
                <Text style={styles.modalSubtitle}>Select additional services for this customer</Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseAddServices}
                style={styles.closeButton}
              >
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedText}>
                  {selectedServices.length} service(s) selected
                </Text>
                <Text style={styles.selectedPrice}>
                  +₹{selectedServices.reduce((sum, s) => sum + parseFloat(s.price || 0), 0).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Services List */}
            <FlatList
              data={availableServices}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.serviceListContent}
              style={styles.serviceList}
              nestedScrollEnabled={true}
              renderItem={({ item }) => {
                const isSelected = selectedServices.some(s => s.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.serviceItem, isSelected && styles.serviceItemSelected]}
                    onPress={() => toggleServiceSelection(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceIconContainer}>
                      <Briefcase size={20} color={isSelected ? '#2563EB' : '#6B7280'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.servicePrice}>₹{parseFloat(item.price || 0).toFixed(2)}</Text>
                        {item.time && (
                          <>
                            <Text style={{ color: '#D1D5DB', marginHorizontal: 8 }}>•</Text>
                            <Clock size={14} color="#9CA3AF" />
                            <Text style={styles.serviceTime}> {item.time} min</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <CheckCircle size={24} color="#2563EB" fill="#2563EB" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyServiceContainer}>
                  <Text style={styles.emptyText}>No services available</Text>
                  <Text style={styles.emptySubtext}>Add services to your barber card first</Text>
                </View>
              }
            />

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddServicesModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd,
                selectedServices.length === 0 && styles.modalButtonDisabled]}
                onPress={handleAddServices}
                disabled={isAddingServices || selectedServices.length === 0}
              >
                <Text style={styles.modalButtonTextAdd}>
                  {isAddingServices ? 'Adding...' : `Add ${selectedServices.length || ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
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

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // --- Add Services Button ---
  addServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 12,
    gap: 12,
  },
  addServicesIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addServicesTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  addServicesSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93C5FD',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectedPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  serviceList: {
    maxHeight: 400,
  },
  serviceListContent: {
    paddingBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  serviceItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  serviceNameSelected: {
    color: '#2563EB',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  serviceTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#2563EB',
  },
  emptyServiceContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  modalButtonAdd: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalButtonTextAdd: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default AppointmentDetailScreen;
