import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PLATFORM_FEE = 7; // ₹7 platform fee
const FRIEND_BOOKING_FEE = 10; // ₹10 fee for booking for a friend
const BACKEND_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/payment`; // Replace with your backend URL

const PaymentConfirmationScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user, token } = useAuth(); // Get user and token from AuthContext
  const { providerName, selectedServices, totalPrice, providerId, forFriend, serviceType } = route.params;
  console.log('PaymentConfirmationScreen forFriend:', forFriend, 'serviceType:', serviceType); // Debug log
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [bookingOtp, setBookingOtp] = useState('');

  const getConfirmationFee = () => {
    if (forFriend) {
      if (serviceType === 'salon') return 15;
      if (serviceType === 'pet') return 20;
      return 10; // Default for barber
    } else {
      if (serviceType === 'salon') return 10;
      if (serviceType === 'pet') return 20;
      return 7; // Default for barber
    }
  };

  const confirmationFee = getConfirmationFee();
  const remainingAmount = totalPrice;

  const handlePayment = async () => {
    setPaymentInitiated(true);
    // Generate OTP before the API call
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    setBookingOtp(otp); // Set it here so it's available for display immediately

    try {
      // Directly create booking without Razorpay payment
      const response = await fetch(`${BACKEND_URL}/book-without-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          barberId: providerId,
          service: selectedServices.map(s => s.name).join(', '),
          date: new Date(),
          time: new Date().toLocaleTimeString(),
          fare: totalPrice,
          otp: otp, // Pass the generated OTP
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setPaymentConfirmed(true);
        // Send OTP to user's email
        try {
          await fetch(`${BACKEND_URL}/send-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user?.email, // Use user's email from AuthContext
              otp,
            }),
          });
        } catch (emailError) {
          console.error('Error sending OTP email:', emailError);
        }
      } else {
        Alert.alert('Error', data.message || 'Booking failed.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Could not create booking. Please try again.');
    } finally {
      setPaymentInitiated(false);
    }
  };

  const getStyles = (currentTheme) => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 35,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: 20,
    },
    confirmationIcon: {
      marginBottom: 25,
    },
    confirmationText: {
      fontSize: 28,
      fontWeight: '800',
      color: currentTheme.colors.success,
      marginBottom: 15,
      textAlign: 'center',
    },
    subText: {
      fontSize: 17,
      color: currentTheme.colors.textSecondary,
      marginBottom: 35,
      textAlign: 'center',
      lineHeight: 24,
    },
    detailsCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 20,
      padding: 30,
      width: '100%',
      marginBottom: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 10,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 17,
      color: currentTheme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 17,
      fontWeight: '700',
      color: currentTheme.colors.text,
    },
    feeRow: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
      paddingTop: 15,
      marginTop: 15,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
      paddingTop: 15,
      marginTop: 15,
    },
    totalLabel: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.primary,
    },
    paymentButton: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 18,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 25,
      flexDirection: 'row',
    },
    paymentButtonText: {
      fontSize: 19,
      fontWeight: 'bold',
      color: currentTheme.colors.onPrimary,
      marginLeft: 10,
    },
    homeButton: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 18,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 25,
    },
    homeButtonText: {
      fontSize: 19,
      fontWeight: 'bold',
      color: currentTheme.colors.onPrimary,
    },
    paymentStatusText: {
      fontSize: 18,
      color: currentTheme.colors.text,
      marginTop: 10,
    },
    loadingIndicator: {
      marginTop: 20,
    },
  });

  const styles = getStyles(theme);

  const getOtpStyles = (currentTheme) => StyleSheet.create({
    otpContainer: {
      marginTop: 20,
      borderRadius: 20,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 15,
      overflow: 'hidden',
    },
    otpContent: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpLabel: {
      fontSize: 20,
      color: currentTheme.colors.text,
      marginBottom: 15,
      fontWeight: 'bold',
    },
    otpText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      letterSpacing: 8,
    },
    otpInstructionText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginTop: 20,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  const otpStyles = getOtpStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{paymentConfirmed ? 'Booking Confirmed' : 'Confirm Payment'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {paymentConfirmed ? (
          <>
            <LottieView
              source={require('../assets/Order Confirmed.json')}
              autoPlay
              loop={false}
              style={{ width: 250, height: 250, marginBottom: 20 }}
            />
            <LottieView
              source={require('../assets/Confetti.json')}
              autoPlay
              loop={true}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', zIndex: 1000 }}
            />
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Provider:</Text>
                <Text style={styles.detailValue}>{providerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Services:</Text>
                <Text style={styles.detailValue}>{selectedServices.length} items</Text>
              </View>
              {selectedServices.map((service, index) => (
                <View key={index} style={[styles.detailRow, { marginLeft: 10 }]}>
                  <Text style={styles.detailLabel}>- {service.name}</Text>
                  <Text style={styles.detailValue}>{service.price}</Text>
                </View>
              ))}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Total:</Text>
                <Text style={styles.detailValue}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.detailRow, styles.feeRow]}>
                <Text style={styles.detailLabel}>{forFriend ? 'Friend Booking Fee Paid:' : 'Platform Fee Paid:'}</Text>
                <Text style={styles.detailValue}>₹{confirmationFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Remaining Amount:</Text>
                <Text style={styles.totalValue}>₹{remainingAmount.toFixed(2)}</Text>
              </View>
            </View>

            {bookingOtp ? (
              <View style={otpStyles.otpContainer}>
                <LinearGradient
                  colors={[theme.colors.card, theme.colors.background]}
                  style={otpStyles.otpContent}
                >
                  <Text style={otpStyles.otpLabel}>Your Booking OTP:</Text>
                  <Text style={otpStyles.otpText}>{bookingOtp}</Text>
                  <Text style={otpStyles.otpInstructionText}>
                    Please show this OTP to {providerName} for confirmation.
                  </Text>
                </LinearGradient>
              </View>
            ) : null}

            <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.confirmationText}>Confirm Booking with Platform Fee</Text>
            <Text style={styles.subText}>
              A non-refundable {forFriend ? 'friend booking fee' : 'platform fee'} of ₹{confirmationFee.toFixed(2)} is required to confirm your booking.
              The remaining amount of ₹{remainingAmount.toFixed(2)} will be paid at the service provider.
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Provider:</Text>
                <Text style={styles.detailValue}>{providerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Services:</Text>
                <Text style={styles.detailValue}>{selectedServices.length} item(s)</Text>
              </View>
              {selectedServices.map((service, index) => (
                <View key={index} style={[styles.detailRow, { marginLeft: 10 }]}>
                  <Text style={styles.detailLabel}>- {service.name}</Text>
                  <Text style={styles.detailValue}>{service.price}</Text>
                </View>
              ))}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Total:</Text>
                <Text style={styles.detailValue}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.detailRow, styles.feeRow]}>
                <Text style={styles.detailLabel}>{forFriend ? 'Friend Booking Fee:' : 'Platform Fee:'}</Text>
                <Text style={styles.detailValue}>₹{confirmationFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Amount to Pay Now:</Text>
                <Text style={styles.totalValue}>₹{confirmationFee.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handlePayment}
              disabled={paymentInitiated}
            >
              <CreditCard size={20} color={theme.colors.onPrimary} />
              <Text style={styles.paymentButtonText}>
                {paymentInitiated ? 'Processing Booking...' : `Confirm Booking Now`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentConfirmationScreen;
