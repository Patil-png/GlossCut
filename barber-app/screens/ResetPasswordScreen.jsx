import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  SlideInUp,
  SlideOutUp,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- 1. Custom Animated Toast Component (Replaces Alert) ---
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#27AE60' : '#E74C3C'; // Premium Green / Red
  const iconName = type === 'success' ? 'check-circle' : 'alert-triangle';

  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 3000); // Auto hide after 3 seconds
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Animated.View 
      entering={SlideInUp.springify().damping(15)} 
      exiting={SlideOutUp}
      style={[styles.toastContainer, { backgroundColor, top: topInset + 10 }]}
    >
      <View style={styles.toastContent}>
        <Icon name={iconName} size={24} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 2. Enhanced Input Component with Error States ---
const AnimatedInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  iconName, 
  secureTextEntry, 
  theme,
  error 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(secureTextEntry);

  // Dynamic Border Color: Error Red -> Focused Primary -> Transparent
  const borderColor = error 
    ? '#FF4444' 
    : isFocused 
      ? theme.colors.primary 
      : 'transparent';

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(isFocused ? 1.02 : 1, { duration: 200 }) }],
      borderColor: withTiming(borderColor, { duration: 200 }),
      borderWidth: 1,
    };
  });

  return (
    <Animated.View style={[
      styles.inputContainer, 
      { backgroundColor: theme.colors.card },
      animatedStyle
    ]}>
      <Icon 
        name={iconName} 
        size={20} 
        color={error ? '#FF4444' : (isFocused ? theme.colors.primary : theme.colors.textSecondary)} 
        style={styles.inputIcon} 
      />
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
        }}
        secureTextEntry={showPassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        cursorColor={theme.colors.primary}
      />
      {secureTextEntry !== undefined && (
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          <Icon 
            name={showPassword ? "eye" : "eye-off"} 
            size={20} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// --- Main Screen ---
const ResetPasswordScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { email, otp } = route.params;
  const insets = useSafeAreaInsets();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State for Validation & Toasts
  const [inputError, setInputError] = useState(null); // 'password', 'confirm', or null
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type) => {
    setToast({ visible: true, message, type });
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    setInputError(null);

    // --- Validation Logic ---
    if (!password || password.length < 6) {
      setInputError('password');
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      setInputError('confirm');
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // API Call
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/password/reset`, 
        { email, otp, password },
        { timeout: 10000 } // 10s timeout to prevent infinite hanging
      );
      
      setIsLoading(false);
      showToast('Password Reset Successfully!', 'success');

      // Delay navigation slightly so user sees the success toast
      setTimeout(() => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
      }, 1500);

    } catch (err) {
      setIsLoading(false);
      
      // --- Crash Prevention & Network Handling ---
      if (!err.response) {
        // Network Error (No Internet or Server Down)
        showToast('Connection failed. Check internet.', 'error');
      } else if (err.response.status === 400 || err.response.status === 401) {
        // Logic Error from Backend
        showToast('Invalid Request or OTP Expired.', 'error');
      } else {
        // Generic Server Error
        showToast('Something went wrong. Try again.', 'error');
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.card]} // Subtle gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Custom Toast Notification Overlay */}
      <View style={styles.toastWrapper}>
        <ToastNotification 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
          topInset={insets.top}
        />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.backButton, { backgroundColor: theme.colors.card }]}
              >
                <Icon name="arrow-left" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              {/* Optional: Add Logo here if needed */}
            </View>

            <View style={styles.contentContainer}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  Reset Password
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Set your new secure password.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formContainer}>
                <AnimatedInput
                  theme={theme}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New Password"
                  iconName="lock"
                  secureTextEntry={true}
                  error={inputError === 'password'}
                />
                
                <AnimatedInput
                  theme={theme}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm New Password"
                  iconName="shield"
                  secureTextEntry={true}
                  error={inputError === 'confirm'}
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300).springify()}>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                      Update Password
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80, // Adjust for visual balance
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 16,
    // Modern Shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Toast Styles
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999, // Ensure it sits on top of everything
    alignItems: 'center',
  },
  toastContainer: {
    width: '90%',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default ResetPasswordScreen;