import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Keyboard,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';

// ---------------------------------------------------------
// 1. OPTIMIZED TOAST COMPONENT (Memoized)
// ---------------------------------------------------------
// Wrapped in React.memo to prevent re-renders when user types
const CustomToast = memo(({ visible, message, type, translateY }) => {
  const { theme } = useTheme();

  // Helper to get color without causing re-renders
  const getBackgroundColor = (msgType) => {
    switch (msgType) {
      case 'success': return '#00C853';
      case 'error': return '#FF3D00';
      default: return theme.colors.primary;
    }
  };

  const getIcon = (msgType) => {
    switch (msgType) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      default: return 'info';
    }
  };

  if (!visible && translateY._value === -150) return null; // Performance bailout

  return (
    <Animated.View style={[
      styles.toastContainer, 
      { transform: [{ translateY }] } 
    ]}>
      <View style={[styles.toastContent, { backgroundColor: getBackgroundColor(type) }]}>
        <Icon name={getIcon(type)} size={20} color="#fff" style={styles.toastIcon} />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

// ---------------------------------------------------------
// 2. OPTIMIZED HEADER COMPONENT (Memoized)
// ---------------------------------------------------------
// Static UI elements that should NEVER re-render during typing
const StaticHeader = memo(({ onBackPress, theme }) => (
  <View style={styles.topBar}>
    <TouchableOpacity 
      onPress={onBackPress} 
      style={[styles.backButton, { backgroundColor: theme.colors.card }]}
      hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
    >
      <Icon name="chevron-left" size={26} color={theme.colors.text} />
    </TouchableOpacity>
  </View>
));

const StaticTitle = memo(({ theme }) => (
  <View style={styles.titleContainer}>
    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Forgot Password?</Text>
    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
      Enter your registered email below to receive your password reset instructions.
    </Text>
  </View>
));

// ---------------------------------------------------------
// 3. MAIN SCREEN
// ---------------------------------------------------------
const ChangePasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  // State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Toast State
  const [toastState, setToastState] = useState({ visible: false, message: '', type: 'info' });
  
  // Refs
  const toastTimeout = useRef(null);
  
  // Animations (Native Driver Enabled)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const toastAnim = useRef(new Animated.Value(-150)).current; 

  // Initial Mount Animation
  useEffect(() => {
    // Run animations in parallel on the UI thread for zero lag
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      }),
      Animated.spring(slideAnim, { 
        toValue: 0, 
        friction: 8, 
        tension: 40, 
        useNativeDriver: true 
      }),
    ]).start();

    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  // Optimized Toast Handlers
  const hideToast = useCallback(() => {
    Animated.timing(toastAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
        setToastState(prev => ({ ...prev, visible: false }));
    });
  }, [toastAnim]);

  const showToast = useCallback((type, message) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    
    setToastState({ visible: true, message, type });
    
    Animated.spring(toastAnim, {
      toValue: 40, 
      friction: 5, 
      tension: 40, 
      useNativeDriver: true
    }).start();

    toastTimeout.current = setTimeout(hideToast, 3000);
  }, [toastAnim, hideToast]);

  // Optimized Handlers
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  
  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    // Only hide toast if it's currently showing an error to reduce state updates
    if (toastState.visible && toastState.type === 'error') {
        hideToast(); 
    }
  }, [toastState.visible, toastState.type, hideToast]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleClear = useCallback(() => setEmail(''), []);
  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  const handleSendOTP = useCallback(async () => {
    Keyboard.dismiss();
    
    // Quick validation to avoid API call lag
    if (!email) {
      showToast('error', 'Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('error', 'That email address looks invalid.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/password/forgot`, { email });
      showToast('success', 'OTP sent successfully!');
      setTimeout(() => navigation.navigate('OTPVerification', { email }), 1000);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Network error. Please try again.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [email, showToast, navigation]);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.colors.background === '#000' ? "light-content" : "dark-content"} />

        {/* Memoized Toast - Only re-renders when toastState changes */}
        <CustomToast 
          visible={toastState.visible} 
          message={toastState.message} 
          type={toastState.type} 
          translateY={toastAnim} 
        />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.flexContainer}
        >
          {/* Memoized Header - Never re-renders on typing */}
          <StaticHeader onBackPress={handleBack} theme={theme} />

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Memoized Title - Never re-renders on typing */}
            <StaticTitle theme={theme} />

            {/* Input Section */}
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: isFocused ? theme.colors.primary : 'transparent',
                backgroundColor: theme.colors.card,
                shadowColor: theme.colors.primary,
                shadowOpacity: isFocused ? 0.15 : 0, // Reduced shadow opacity for performance
              }
            ]}>
              <View style={styles.iconBox}>
                <Icon name="mail" size={20} color={isFocused ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ex: john@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={handleFocus}
                onBlur={handleBlur}
                cursorColor={theme.colors.primary}
                // Performance props for TextInput
                autoCorrect={false} 
                importantForAutofill="yes"
              />

              {email.length > 0 && (
                 <TouchableOpacity onPress={handleClear} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Icon name="x" size={18} color={theme.colors.textSecondary} />
                 </TouchableOpacity>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                { 
                  backgroundColor: theme.colors.primary,
                  opacity: (email && !loading) ? 1 : 0.6 
                }
              ]} 
              onPress={handleSendOTP}
              disabled={loading || !email}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                  Send Instructions
                </Text>
              )}
            </TouchableOpacity>

          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

// ---------------------------------------------------------
// 4. STYLES
// ---------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6, // Reduced elevation for smoother rendering on Android
    minWidth: '80%',
    justifyContent: 'center',
  },
  toastIcon: {
    marginRight: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleContainer: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1.5,
  },
  iconBox: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%',
    fontWeight: '500',
  },
  button: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Reduced shadow
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;