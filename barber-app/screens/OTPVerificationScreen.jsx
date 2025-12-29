import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  StatusBar as RNStatusBar 
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// --- Custom Animated Toast Component ---
const ToastNotification = ({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 50 : 20, // Adjust for Safe Area
        useNativeDriver: true,
        friction: 5,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';
  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], backgroundColor }]}>
      <Icon name={iconName} size={20} color="#fff" style={{ marginRight: 10 }} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};
// ----------------------------------------

const OTPVerificationScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  // Safe destructuring in case params are missing (prevents crash)
  const email = route.params?.email || ''; 

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const inputs = useRef([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleVerifyOTP = async () => {
    animateButtonPress();
    Keyboard.dismiss();

    const otpCode = otp.join('');

    // Validation: Check if OTP is full
    if (otpCode.length < 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
      // Intentionally waiting for the server response
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/password/verify`, { email, otp: otpCode });
      
      showToast('Verification Successful!', 'success');
      setTimeout(() => {
        navigation.navigate('ResetPassword', { email, otp: otpCode });
      }, 500); // Small delay to let user see success message

    } catch (err) {
      // Robust Error Handling for "Crash Proofing"
      if (!err.response) {
        // Network error (Server down or No Internet)
        showToast('Network error. Check your internet connection.', 'error');
      } else {
        // Server responded with error (Invalid OTP)
        const errorMessage = err.response?.data?.message || 'Invalid OTP. Please try again.';
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/password/forgot`, { email });
      showToast('New code sent to your email', 'success');
    } catch (err) {
      if (!err.response) {
        showToast('Network error. Unable to resend.', 'error');
      } else {
        showToast('User not found or error sending email', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text, index) => {
    // Ensure only numbers are entered
    const cleanedText = text.replace(/[^0-9]/g, '');

    const newOtp = [...otp];
    newOtp[index] = cleanedText;
    setOtp(newOtp);

    // Auto Focus Next
    if (cleanedText && index < 5) {
      inputs.current[index + 1].focus();
    }
    // Check if last digit entered, dismiss keyboard (Optional preference)
    if (cleanedText && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? "light" : "dark"} />
        
        {/* Top Absolute Toast Notification */}
        <ToastNotification 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onHide={hideToast}
          theme={theme}
        />

        {/* Safe Area Wrapper for Top Bar */}
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.card }]}>
              <Icon name="arrow-left" size={20} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, justifyContent: 'center' }}>
            
            <View style={styles.heroContainer}>
              <View style={[styles.lockIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name="lock" size={32} color={theme.colors.primary} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Verification Code</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We have sent the verification code to {'\n'}
                <Text style={{ fontWeight: '600', color: theme.colors.text }}>{email}</Text>
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = digit.length > 0;
                return (
                  <View key={index} style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.otpInput,
                        { 
                          backgroundColor: theme.colors.card, 
                          color: theme.colors.text,
                          borderColor: isFocused ? theme.colors.primary : (isFilled ? theme.colors.text : 'transparent'),
                          borderWidth: isFocused || isFilled ? 1.5 : 0,
                          shadowColor: isFocused ? theme.colors.primary : "#000",
                          shadowOpacity: isFocused ? 0.3 : 0.1,
                          shadowRadius: isFocused ? 8 : 4,
                          elevation: isFocused ? 5 : 2,
                        }
                      ]}
                      maxLength={1}
                      keyboardType="number-pad"
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      value={digit}
                      ref={(ref) => (inputs.current[index] = ref)}
                      selectionColor={theme.colors.primary}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={handleResendOTP} disabled={loading} style={styles.resendButton}>
                <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                  Didn't receive code? <Text style={[styles.resendLink, { color: theme.colors.primary }]}>Resend</Text>
                </Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.button, 
                    { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleVerifyOTP}
                  activeOpacity={0.9}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.background === '#000' || theme.colors.background === '#121212' ? '#000' : '#fff'} />
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { color: theme.colors.background === '#000' || theme.colors.background === '#121212' ? '#000' : '#fff' }]}>
                        Verify Identity
                      </Text>
                      <Icon name="arrow-right" size={20} color={theme.colors.background === '#000' || theme.colors.background === '#121212' ? '#000' : '#fff'} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  safeArea: {
    // This handles the status bar spacing on iOS automatically
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 10 : 0,
    zIndex: 10,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 100,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  otpInput: {
    width: width / 8.5, 
    height: 60,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  actionContainer: {
    alignItems: 'center',
  },
  resendButton: {
    marginBottom: 32,
    padding: 8,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },
  resendLink: {
    fontWeight: '800',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    width: width - 48,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OTPVerificationScreen;