import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native'; // Import Linking and Platform
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Calendar, Clock, User, MapPin, Phone, Mail, Star, DollarSign, Lock } from 'lucide-react-native'; // Added DollarSign and Lock
import { format, differenceInSeconds } from 'date-fns'; // Import format and differenceInSeconds

const BookingDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { booking } = route.params;
  const [timeLeft, setTimeLeft] = useState(0);

  // Calculate time left for appointment
  useEffect(() => {
    if (booking && booking.date && booking.time) {
      const appointmentDateTime = new Date(`${format(new Date(booking.date), 'yyyy-MM-dd')}T${booking.time}`);
      const interval = setInterval(() => {
        const now = new Date();
        const seconds = differenceInSeconds(appointmentDateTime, now);
        setTimeLeft(seconds > 0 ? seconds : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking]);

  const formatTimeLeft = (seconds) => {
    if (seconds === 0) return 'Appointment started!';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  // Helper function to determine status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#28a745'; // Green for success
      case 'pending':
      case 'pending (demo)':
        return '#ffc107'; // Yellow for warning
      case 'cancelled':
        return '#dc3545'; // Red for error
      default:
        return theme.colors.text;
    }
  };

  // Handle opening map
  const openMap = (address) => {
    if (!address) {
      console.warn("Address is missing, cannot open map.");
      return;
    }
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = ''; // Assuming no lat/lng provided in the current data structure
    const label = encodeURIComponent(address);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url).catch(err => console.error('Failed to open map:', err));
  };

  // Handle calling phone number
  const callNumber = (phoneNumber) => {
    if (!phoneNumber) {
      console.warn("Phone number is missing, cannot call.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Failed to make call:', err));
  };

  // Handle sending email
  const sendEmail = (emailAddress) => {
    if (!emailAddress) {
      console.warn("Email is missing, cannot send email.");
      return;
    }
    Linking.openURL(`mailto:${emailAddress}`).catch(err => console.error('Failed to open mail app:', err));
  };

  const getStyles = (currentTheme) => StyleSheet.create({
    // --- General Layout ---
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9', // Very light background for modern look
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 15,
      marginTop: Platform.OS === 'android' ? 0 : 35,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800', // Stronger font for title
      color: currentTheme.colors.text,
    },
    content: {
      flexGrow: 1,
      padding: 15,
    },
    // --- Card Styles (Clean, elevated) ---
    detailsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      width: '100%',
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, // Subtle shadow
      shadowRadius: 6,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: currentTheme.colors.text,
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      paddingBottom: 10,
    },
    // --- Detail Rows ---
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F7F7F7', // Very light row separator
    },
    detailLabel: {
      fontSize: 15,
      color: currentTheme.colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 15,
      fontWeight: '600',
      color: currentTheme.colors.text,
      flexShrink: 1,
      textAlign: 'right',
    },
    // --- Total / Highlight Row ---
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
      paddingTop: 15,
      marginTop: 5,
      borderBottomWidth: 0, // Remove bottom border for the last row
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.primary,
    },
    statusValue: {
      fontSize: 15,
      fontWeight: '700',
      // Color set dynamically in component
    },
    // --- Interactive / Contact Rows ---
    clickableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F7F7F7',
    },
    contactText: {
      fontSize: 15,
      color: currentTheme.colors.primary, // Highlight links with primary color
      marginLeft: 15,
      textDecorationLine: 'none', // Remove underline
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0, // Last row in section
    },
    ratingText: {
      fontSize: 15,
      color: currentTheme.colors.textSecondary,
      marginLeft: 15,
    },
    // --- Time Left Card (Prominent/Accent) ---
    timeLeftCard: {
      backgroundColor: currentTheme.colors.primaryContainer, // Light accent background
      borderColor: currentTheme.colors.primary,
      borderWidth: 1,
      shadowColor: currentTheme.colors.primary,
      shadowOpacity: 0.2,
      marginBottom: 20,
    },
    timeLeftTitle: {
      color: currentTheme.colors.primary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.primary + '11', // Very light primary divider
      paddingBottom: 10,
    },
    timeLeftValue: {
      fontSize: 28,
      fontWeight: '900',
      color: currentTheme.colors.primary,
      marginLeft: 15,
    },
    timeLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: 5,
    },
    otpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FFFBE6', // Light yellow background
      padding: 15,
      borderRadius: 10,
      marginTop: 15,
      borderWidth: 1,
      borderColor: '#FFC107',
    },
    otpLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#856404', // Dark yellow text
    },
    otpValue: {
      fontSize: 24,
      fontWeight: '900',
      color: '#856404',
    },
  });

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. Core Booking Details Card --- */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Your Booking Summary</Text>

          <View style={styles.detailRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }}/>
              <Text style={styles.detailLabel}>Service:</Text>
            </View>
            <Text style={styles.detailValue}>{booking.service}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <User size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }}/>
              <Text style={styles.detailLabel}>Barber:</Text>
            </View>
            <Text style={styles.detailValue}>{booking.barberId ? booking.barberId.name : 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }}/>
              <Text style={styles.detailLabel}>Date:</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.date ? format(new Date(booking.date), 'MMM dd, yyyy') : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }}/>
              <Text style={styles.detailLabel}>Time:</Text>
            </View>
            <Text style={styles.detailValue}>{booking.time || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusValue, { color: getStatusColor(booking.status || '') }]}>
              {booking.status || 'N/A'}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.totalRow, { borderBottomWidth: 0 }]}>
                <DollarSign size={20} color={theme.colors.primary} style={{ marginRight: 10 }}/>
            <Text style={styles.totalLabel}>Total Fare:</Text>
            <Text style={styles.totalValue}>₹{booking.fare ? booking.fare.toFixed(2) : '0.00'}</Text>
          </View>

          {/* OTP Display - Highlighted */}
          {booking.otp && (
            <View style={styles.otpRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Lock size={20} color={'#856404'} style={{ marginRight: 10 }}/>
                <Text style={styles.otpLabel}>Your Booking OTP</Text>
              </View>
              <Text style={styles.otpValue}>{booking.otp}</Text>
            </View>
          )}
        </View>

        {/* --- 2. Countdown Card (Top Priority) --- */}
        <View style={[styles.detailsCard, styles.timeLeftCard]}>
          <Text style={styles.timeLeftTitle}>Time Left Until Appointment</Text>
          <View style={styles.timeLeftRow}>
            <Clock size={30} color={theme.colors.primary} />
            <Text style={styles.timeLeftValue}>
              {formatTimeLeft(timeLeft)}
            </Text>
          </View>
        </View>


        {/* --- 3. Barber & Shop Details Card (Interactive) --- */}
        {booking.barberId && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Contact & Shop Info</Text>
            
            {/* Barber Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Barber Name:</Text>
              <Text style={styles.detailValue}>{booking.barberId.name || 'N/A'}</Text>
            </View>
            
            <TouchableOpacity style={styles.clickableRow} onPress={() => sendEmail(booking.barberId.email)}>
              <Mail size={18} color={theme.colors.primary} />
              <Text style={styles.contactText}>
                {booking.barberId.email || 'Email N/A'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clickableRow} onPress={() => callNumber(booking.barberId.phone)}>
              <Phone size={18} color={theme.colors.primary} />
              <Text style={styles.contactText}>
                {booking.barberId.phone || 'Phone N/A'}
              </Text>
            </TouchableOpacity>

            {/* Rating */}
            <View style={[styles.ratingRow, { borderBottomWidth: 1, borderBottomColor: '#F7F7F7' }]}>
              <Star size={18} color={'#FFC107'} />
              <Text style={styles.ratingText}>
                Barber Rating: {booking.barberId.rating ? `${booking.barberId.rating} (${booking.barberId.reviews} reviews)` : 'N/A'}
              </Text>
            </View>

            {/* Barber Shop Details */}
            {booking.barberId.shopName && (
              <>
                <View style={[styles.detailRow, styles.totalRow, { justifyContent: 'flex-start', borderTopWidth: 0, marginTop: 15, borderBottomWidth: 0 }]}>
                  <Text style={[styles.totalLabel, { fontSize: 16, marginRight: 5 }]}>Shop:</Text>
                  <Text style={[styles.detailValue, { fontSize: 16, textAlign: 'left' }]}>{booking.barberId.shopName || 'N/A'}</Text>
                </View>
                
                <TouchableOpacity style={styles.clickableRow} onPress={() => openMap(booking.barberId.shopAddress)}>
                  <MapPin size={18} color={theme.colors.primary} />
                  <Text style={styles.contactText}>
                    {booking.barberId.shopAddress || 'Address N/A (Tap to Map)'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.clickableRow} onPress={() => callNumber(booking.barberId.shopPhone)}>
                  <Phone size={18} color={theme.colors.primary} />
                  <Text style={styles.contactText}>
                    {booking.barberId.shopPhone || 'Shop Phone N/A'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;