import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  UIManager,
  Animated,
  StatusBar,
  Dimensions,
  Pressable,
  LayoutAnimation
} from 'react-native';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  Circle,
  Sparkles,
  AlertCircle,
  XCircle,
  Check,
  Scissors,
  ChevronRight,
  CloudOff
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { defaultServices } from '../data/services'; 

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

// --- MICRO-INTERACTION: SCALE BUTTON ---
const ScalePressable = ({ children, onPress, style, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={{ opacity: disabled ? 0.7 : 1 }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// --- MICRO-INTERACTION: ANIMATED INPUT ---
const AnimatedInput = ({ icon: Icon, value, onChangeText, placeholder, keyboardType, theme }) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary]
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.card, theme.colors.background]
  });

  return (
    <Animated.View style={[
      styles.inputContainer, 
      { 
        borderColor, 
        backgroundColor,
        borderWidth: 1.5,
        elevation: isFocused ? 2 : 0,
        shadowColor: theme.colors.primary,
        shadowOpacity: isFocused ? 0.15 : 0,
        shadowRadius: 8
      }
    ]}>
      <Icon size={20} color={isFocused ? theme.colors.primary : theme.colors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </Animated.View>
  );
};

// --- PREMIUM NOTIFICATION ---
const CustomAlert = ({ visible, type, title, message, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: STATUSBAR_HEIGHT + 10,
        useNativeDriver: true,
        friction: 9,
        tension: 50
      }).start();

      const timer = setTimeout(() => {
        hideAlert();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if(onHide) onHide();
    });
  };

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: '#E6F4EA', border: '#34A853', icon: '#34A853' };
      case 'error': return { bg: '#FCE8E6', border: '#EA4335', icon: '#EA4335' };
      case 'warning': return { bg: '#FEF7E0', border: '#FBBC05', icon: '#FBBC05' };
      default: return { bg: theme.colors.card, border: theme.colors.border, icon: theme.colors.text };
    }
  };

  const colors = getColors();
  const IconComponent = type === 'success' ? Check : type === 'error' ? XCircle : AlertCircle;

  return (
    <Animated.View style={[styles.alertWrapper, { transform: [{ translateY }] }]}>
      <View style={[styles.alertContent, { backgroundColor: theme.colors.card }]}>
         <View style={[styles.alertStripe, { backgroundColor: colors.border }]} />
         <View style={[styles.alertIconBadge, { backgroundColor: colors.bg }]}>
            <IconComponent size={22} color={colors.icon} strokeWidth={2.5} />
         </View>
         <View style={styles.alertTextContainer}>
            <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
         </View>
      </View>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---
const OfflineBookingScreen = () => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [appointmentType, setAppointmentType] = useState('Basic');
  
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  useEffect(() => {
    calculateTotalPrice();
  }, [services]);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      if (!process.env.EXPO_PUBLIC_API_URL) throw new Error("API Config Missing");

      const barberCardResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`, {
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      }).catch(() => null);

      if (barberCardResponse && barberCardResponse.ok) {
        const barberCard = await barberCardResponse.json();
        if (barberCard.services && barberCard.services.length > 0) {
          const transformedServices = barberCard.services.map(service => ({
            _id: service._id || service.id,
            name: service.name,
            price: service.price,
            duration: service.time || service.duration || 30,
            category: service.category || 'General'
          }));
          setAvailableServices(transformedServices);
          setLoading(false);
          return;
        }
      }

      const shopResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/services/${user._id}`, {
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      }).catch(() => null);

      if (shopResponse && shopResponse.ok) {
        const data = await shopResponse.json();
        setAvailableServices(data);
      } else {
        throw new Error('Network Unavailable');
      }
    } catch (error) {
      if (__DEV__) console.log("Offline Mode Activated:", error.message);
      setAvailableServices(defaultServices);
      showAlert('warning', 'Offline Mode', 'Internet unreachable. Using offline service list.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    const total = services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    setTotalPrice(total);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setSelectedDate(selectedDate);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setSelectedTime(format(selectedTime, 'HH:mm'));
  };

  const toggleServiceSelection = (service) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setServices((prevServices) => {
      const isSelected = prevServices.some((s) => s.id === service._id);
      if (isSelected) {
        return prevServices.filter((s) => s.id !== service._id);
      } else {
        return [...prevServices, { id: service._id, name: service.name, price: service.price }];
      }
    });
  };

  const handleBookOfflineAppointment = async () => {
    if (!customerName.trim()) return showAlert('warning', 'Missing Name', 'Please enter the customer name.');
    if (!customerPhone.trim() || customerPhone.length < 10) return showAlert('warning', 'Invalid Phone', 'Please enter a valid phone number.');
    if (!selectedTime) return showAlert('warning', 'Time Required', 'Please select an appointment time.');
    if (services.length === 0) return showAlert('warning', 'No Service', 'Please add at least one service.');

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          barberId: user._id,
          date: selectedDate,
          time: selectedTime,
          services,
          totalPrice,
          appointmentType,
          isOfflineBooking: true,
          customerName,
          customerPhone,
        }),
      }).catch(() => { throw new Error('Network Error'); });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Booking Confirmed', 'Appointment scheduled successfully!');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(data.msg || 'Failed to book.');
      }
    } catch (error) {
      showAlert('error', 'Connection Failed', 'Could not reach server. Please check internet.');
      if (__DEV__) console.log("Booking Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} 
      />

      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 10 }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Walk-in</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Create offline booking</Text>
          </View>
          
          <View style={{ width: 44 }} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Customer Info</Text>
                <AnimatedInput 
                    icon={User}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Customer Name"
                    theme={theme}
                />
                <AnimatedInput 
                    icon={Phone}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    theme={theme}
                />
            </View>

            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date & Time</Text>
                <View style={styles.row}>
                    <ScalePressable
                        style={[styles.dateTimeCard, { backgroundColor: theme.colors.card, marginRight: 8 }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <View style={[styles.iconBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Calendar size={22} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.labelSmall, { color: theme.colors.textSecondary }]}>Date</Text>
                            <Text style={[styles.valueText, { color: theme.colors.text }]}>
                            {format(selectedDate, 'd MMM, yyyy')}
                            </Text>
                        </View>
                    </ScalePressable>

                    <ScalePressable
                        style={[styles.dateTimeCard, { backgroundColor: theme.colors.card, marginLeft: 8 }]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <View style={[styles.iconBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                            <Clock size={22} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.labelSmall, { color: theme.colors.textSecondary }]}>Time</Text>
                            <Text style={[styles.valueText, { color: theme.colors.text }]}>
                            {selectedTime || 'Select Time'}
                            </Text>
                        </View>
                    </ScalePressable>
                </View>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime ? new Date(selectedDate.toDateString() + ' ' + selectedTime) : new Date()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Select Services</Text>
                    {services.length > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.countText}>{services.length}</Text>
                        </View>
                    )}
                </View>

                {loading && availableServices.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
                ) : availableServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <CloudOff size={30} color={theme.colors.textSecondary} />
                        <Text style={{color: theme.colors.textSecondary, marginTop: 10}}>Offline - No services found</Text>
                    </View>
                ) : (
                <View style={styles.servicesList}>
                    {availableServices.map((service) => {
                    const isSelected = services.some((s) => s.id === service._id);
                    return (
                        <ScalePressable
                            key={service._id}
                            style={[
                                styles.serviceCard,
                                { 
                                    backgroundColor: isSelected ? theme.colors.primary + '08' : theme.colors.card,
                                    borderColor: isSelected ? theme.colors.primary : 'transparent',
                                    borderWidth: 1.5,
                                    // Remove shadow if selected
                                    elevation: isSelected ? 0 : 1,
                                    shadowOpacity: isSelected ? 0 : 0.03,
                                }
                            ]}
                            onPress={() => toggleServiceSelection(service)}
                        >
                            <View style={[styles.serviceIconContainer, { backgroundColor: isSelected ? theme.colors.background : theme.colors.background + '80' }]}>
                                <Scissors size={18} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                            </View>
                            
                            <View style={styles.serviceInfo}>
                                <Text style={[styles.serviceName, { color: theme.colors.text, fontWeight: isSelected ? '700' : '600' }]}>{service.name}</Text>
                                <Text style={[styles.serviceDetails, { color: theme.colors.textSecondary }]}>
                                {service.duration} mins
                                </Text>
                            </View>
                            
                            <View style={styles.priceTag}>
                                <Text style={[styles.priceText, { color: isSelected ? theme.colors.primary : theme.colors.text }]}>₹{service.price}</Text>
                                {isSelected ? (
                                    <CheckCircle2 size={20} color={theme.colors.primary} style={{marginLeft: 8}} fill={theme.colors.primary + '20'} />
                                ) : (
                                    <Circle size={20} color={theme.colors.border} style={{marginLeft: 8}} />
                                )}
                            </View>
                        </ScalePressable>
                    );
                    })}
                </View>
                )}
            </View>

            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priority Level</Text>
                <View style={styles.tierContainer}>
                {['Basic', 'Express'].map((type) => {
                    const isActive = appointmentType === type;
                    return (
                    <ScalePressable
                        key={type}
                        style={[
                        styles.tierCard,
                        {
                            backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                            borderColor: isActive ? theme.colors.primary : theme.colors.border,
                            // Remove shadow if active
                            elevation: isActive ? 0 : 1,
                            shadowOpacity: isActive ? 0 : 0.05,
                        },
                        ]}
                        onPress={() => setAppointmentType(type)}
                    >
                        {isActive ? (
                            <Sparkles size={18} color="#FFF" style={{marginBottom: 8}} />
                        ) : (
                            <View style={{height: 18, marginBottom: 8}} />
                        )}
                        <Text style={[ styles.tierTitle, { color: isActive ? '#FFF' : theme.colors.text }]}>
                            {type}
                        </Text>
                        <Text style={[ styles.tierSub, { color: isActive ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }]}>
                            {type === 'Basic' ? 'Standard Queue' : 'Priority Queue'}
                        </Text>
                    </ScalePressable>
                    );
                })}
                </View>
            </View>

            <View style={{height: 140}} /> 
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.floatingFooterContainer}>
            <View style={[styles.floatingFooter, { backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow || '#000' }]}>
                <View>
                    <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total to Pay</Text>
                    <Text style={[styles.totalAmount, { color: theme.colors.text }]}>₹{totalPrice}</Text>
                </View>

                <ScalePressable
                    style={[
                        styles.payButton, 
                        { backgroundColor: theme.colors.primary, opacity: loading ? 0.8 : 1 }
                    ]}
                    onPress={handleBookOfflineAppointment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Confirm Booking</Text>
                            <ChevronRight size={20} color="#FFF" strokeWidth={3} />
                        </>
                    )}
                </ScalePressable>
            </View>
        </View>

        <CustomAlert 
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onHide={() => setAlertConfig({ ...alertConfig, visible: false })}
          theme={theme}
        />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 58,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.7,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingRight: 16,
    borderRadius: 18,
    // Base shadow defined here, but overridden inline if selected
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  serviceIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  serviceName: {
    fontSize: 15,
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tierContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tierCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    // Base shadow defined here, but overridden inline if active
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  floatingFooterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 10,
    zIndex: 20,
  },
  floatingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA'
  },
  alertWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 32,
    padding: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  alertStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  alertIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginLeft: 8,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
  }
});

export default OfflineBookingScreen;
