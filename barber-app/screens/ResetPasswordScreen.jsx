import React, { useState, useEffect } from 'react';
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
  StatusBar,
  ScrollView // Added for scrollability on smaller screens
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import api from "../utils/api";
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
  interpolateColor,
  useAnimatedProps
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- 1. Custom Animated Toast Component ---
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#27AE60' : '#E74C3C';
  const iconName = type === 'success' ? 'check-circle' : 'alert-triangle';

  useEffect(() => {
    const timer = setTimeout(() => { onHide(); }, 3000);
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

// --- 2. Enhanced Input Component ---
const AnimatedInput = ({ value, onChangeText, placeholder, iconName, secureTextEntry, theme, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(secureTextEntry);

  const borderColor = error ? '#FF4444' : isFocused ? theme.colors.primary : 'transparent';

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(isFocused ? 1.02 : 1, { duration: 200 }) }],
      borderColor: withTiming(borderColor, { duration: 200 }),
      borderWidth: 1,
    };
  });

  return (
    <Animated.View style={[styles.inputContainer, { backgroundColor: theme.colors.card }, animatedStyle]}>
      <Icon name={iconName} size={20} color={error ? '#FF4444' : (isFocused ? theme.colors.primary : theme.colors.textSecondary)} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={showPassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        cursorColor={theme.colors.primary}
      />
      {secureTextEntry !== undefined && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Icon name={showPassword ? "eye" : "eye-off"} size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// --- 3. NEW: Password Guidelines Component ---
const PasswordGuidelines = ({ password, confirmPassword, theme }) => {
  const isLengthValid = password.length >= 6;
  const isMatchValid = password.length > 0 && password === confirmPassword;

  // Helper for check items
  const CheckItem = ({ label, isValid }) => (
    <View style={styles.checkItem}>
      <Icon
        name={isValid ? "check" : "circle"}
        size={16}
        color={isValid ? "#27AE60" : theme.colors.textSecondary}
      />
      <Text style={[
        styles.checkText,
        { color: isValid ? theme.colors.text : theme.colors.textSecondary, textDecorationLine: isValid ? 'none' : 'none' }
      ]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={[styles.guidelinesContainer, { backgroundColor: theme.colors.card + '80' }]}>
      <Text style={[styles.guidelinesTitle, { color: theme.colors.textSecondary }]}>Security Requirements:</Text>
      <CheckItem label="At least 6 characters long" isValid={isLengthValid} />
      <CheckItem label="Passwords match perfectly" isValid={isMatchValid} />
    </View>
  );
};

// --- Main Screen ---
const ResetPasswordScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { email, otp } = route?.params || {};
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type) => {
    setToast({ visible: true, message, type });
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    setInputError(null);

    if (!password || password.length < 6) {
      setInputError('password');
      showToast('Password is too short.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      setInputError('confirm');
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await api.post(
        '/api/password/reset',
        { email, otp, password },
        { timeout: 10000 }
      );

      setIsLoading(false);
      showToast('Password Reset Successfully!', 'success');
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 1500);

    } catch (err) {
      setIsLoading(false);
      if (!err.response) showToast('Connection failed. Check internet.', 'error');
      else if (err.response.status === 400 || err.response.status === 401) showToast('Invalid Request or OTP Expired.', 'error');
      else showToast('Something went wrong. Try again.', 'error');
    }
  };

  if (!theme) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[theme.colors.background, theme.colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.toastWrapper}>
        <ToastNotification
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
          topInset={insets.top}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.card }]}>
              <Icon name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            {/* NEW: Security Pill Badge */}
            <View style={[styles.securityBadge, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary + '30' }]}>
              <Icon name="lock" size={12} color={theme.colors.primary} />
              <Text style={[styles.securityText, { color: theme.colors.primary }]}>Secure Environment</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Your identity has been verified. Create a new strong password to protect your account.
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

                {/* NEW: Password Guidelines Section */}
                <PasswordGuidelines
                  password={password}
                  confirmPassword={confirmPassword}
                  theme={theme}
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
                    <Text style={[styles.buttonText, { color: theme.colors.background }]}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* NEW: Footer Help Section */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Having trouble?</Text>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
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
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500', height: '100%' },
  eyeButton: { padding: 8 },

  // New Guidelines Styles
  guidelinesContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '500',
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
  buttonText: { fontSize: 18, fontWeight: '700' },

  footer: {
    marginTop: 'auto',
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },

  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
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
  toastContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});

export default ResetPasswordScreen;