import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Dimensions
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 50;

// --- CUSTOM TOAST COMPONENT ---
const ToastNotification = ({ message, type, visible, translateY }) => {
  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444'; // Emerald Green vs Red
  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <View style={[styles.toastContent, { backgroundColor }]}>
        <Icon name={iconName} size={20} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current; // For error feedback

  // Toast State & Animation
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Initial Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Email Validation Logic (Regex)
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  // --- ANIMATION HELPERS ---
  
  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    // Slide In
    Animated.spring(toastAnim, {
      toValue: STATUSBAR_HEIGHT + 10, 
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ ...toast, visible: false }));
    }, 3000);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // --- MAIN LOGIC ---

  const handleSendOTP = async () => {
    animateButtonPress();
    Keyboard.dismiss();

    // 1. Local Validation
    if (!email) {
      triggerShake();
      showToast('Please enter your email address', 'error');
      return;
    }
    
    if (!isValidEmail) {
      triggerShake();
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      // 2. API Call
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/password/forgot`, { email });
      
      // Success
      showToast('OTP sent successfully!', 'success');
      setTimeout(() => {
        navigation.navigate('OTPVerification', { email });
      }, 1000); // Small delay to let user read the toast

    } catch (err) {
      // 3. Error Handling (No Crashes)
      let errorMessage = 'Something went wrong';
      
      if (err.message === 'Network Error') {
        errorMessage = 'No internet connection. Please check your settings.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Server is taking too long to respond.';
      } else if (err.response) {
        errorMessage = err.response.data.msg || 'Account not found.';
      } else {
        errorMessage = err.message;
      }

      triggerShake();
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Styles
  const dynamicStyles = {
    background: theme.colors.background,
    text: theme.colors.text,
    card: theme.colors.card,
    primary: theme.colors.primary,
    // Input border turns Green if valid, Primary if focused, else transparent
    inputBorder: isValidEmail ? '#10B981' : (isFocused ? theme.colors.primary : 'transparent'),
    iconColor: isFocused ? theme.colors.primary : theme.colors.textSecondary,
  };

  return (
    <View style={{ flex: 1, backgroundColor: dynamicStyles.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Custom Toast Layer (Z-Index High) */}
      <ToastNotification 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        translateY={toastAnim} 
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Universal Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.card }]}>
                  <Icon name="arrow-left" size={24} color={dynamicStyles.text} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: dynamicStyles.text }]}>Reset Password</Text>
            </View>

            {/* Animated Content */}
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              
              <View style={[styles.heroContainer, { backgroundColor: theme.colors.card + '40' }]}>
                <Icon name="lock" size={48} color={theme.colors.primary} />
              </View>

              <Text style={[styles.title, { color: dynamicStyles.text }]}>
                Forgot Password?
              </Text>
              
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Enter your email securely. We'll send you a One Time Password to reset your account.
              </Text>

              {/* Input Field with Visual Validation */}
              <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                <Text style={[styles.inputLabel, { color: dynamicStyles.text }]}>Email Address</Text>
                <View 
                  style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: dynamicStyles.card,
                      borderColor: dynamicStyles.inputBorder,
                    }
                  ]}
                >
                  <Icon 
                    name="mail" 
                    size={20} 
                    color={isValidEmail ? '#10B981' : dynamicStyles.iconColor} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, { color: dynamicStyles.text }]}
                    placeholder="glosscut@company.com"
                    placeholderTextColor={theme.colors.textSecondary + '80'}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {isValidEmail && (
                    <Icon name="check" size={20} color="#10B981" style={{ marginLeft: 8 }} />
                  )}
                </View>
              </Animated.View>

              {/* Action Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { 
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                      opacity: loading ? 0.7 : 1
                    }
                  ]}
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.background} />
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                        Send OTP
                      </Text>
                      <Icon name="arrow-right" size={20} color={theme.colors.background} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Universal Header Styling
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.9,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  // Content Layout
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  heroContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.7,
  },
  inputWrapper: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Toast Notification Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it's above everything
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    minWidth: '80%',
    justifyContent: 'flex-start',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ForgotPasswordScreen;