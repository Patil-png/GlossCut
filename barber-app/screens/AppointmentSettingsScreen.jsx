import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// --- 1. MEMOIZED COMPONENTS ---

const CustomToast = memo(({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, onHide]);

  if (!visible && opacity._value === 0) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? '#E7F9ED' : '#FDE8E8';
  const borderColor = isSuccess ? '#27AE60' : '#EB5757';
  const iconName = isSuccess ? 'check-circle' : 'alert-circle';
  const textColor = isSuccess ? '#1E5936' : '#781E1E';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity: opacity,
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
      ]}
    >
      <Feather name={iconName} size={24} color={borderColor} style={styles.toastIcon} />
      <Text style={[styles.toastText, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}, (prev, next) => prev.visible === next.visible && prev.message === next.message && prev.type === next.type);

// --- UPDATED PREMIUM HEADER ---
const HeaderContent = memo(({ theme, onBack }) => (
  <View style={styles.headerSection}>
    {/* Top Navigation Bar */}
    <View style={styles.topNav}>
      <TouchableOpacity 
        onPress={onBack} 
        style={[
            styles.backButton, 
            { 
                borderColor: theme.colors.border || '#E0E0E0',
                backgroundColor: theme.colors.surface || theme.colors.background 
            }
        ]}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
      >
         <Feather name="arrow-left" size={22} color={theme.colors.text} />
      </TouchableOpacity>
    </View>

    {/* Page Title & Context */}
    <View style={styles.headerTitles}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
           <MaterialCommunityIcons name="calendar-clock" size={28} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Daily Capacity</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text + '80' }]}>
          Manage your booking limits to prevent overbooking.
        </Text>
    </View>
  </View>
));

const SaveButton = memo(({ onPress, isLoading, theme }) => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        disabled={isLoading}
        style={[
          styles.button,
          { 
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            opacity: isLoading ? 0.8 : 1
          }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- 2. MAIN SCREEN COMPONENT ---

const AppointmentSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  
  const [maxAppointments, setMaxAppointments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const inputScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (user && user.maxAppointmentsPerDay) {
      setMaxAppointments(user.maxAppointmentsPerDay.toString());
    }
  }, [user]);

  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);
  const showToast = useCallback((message, type = 'success') => setToast({ visible: true, message, type }), []);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(inputScale, { toValue: 1.02, friction: 5, useNativeDriver: true }).start();
  }, [inputScale]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.spring(inputScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [inputScale]);

  const handleChangeText = useCallback((text) => {
    if (/^\d*$/.test(text)) setMaxAppointments(text);
  }, []);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    if (!maxAppointments || maxAppointments.trim() === '') {
      showToast('Please enter a valid number.', 'error');
      return;
    }
    const numValue = parseInt(maxAppointments, 10);
    if (isNaN(numValue) || numValue <= 0) {
      showToast('Capacity must be greater than 0.', 'error');
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`,
        { maxAppointmentsPerDay: numValue },
        { headers: { 'x-auth-token': token }, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      showToast('Settings saved successfully!', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      let errorMsg = 'Failed to save settings.';
      if (err.message === 'Network Error') errorMsg = 'No internet connection.';
      else if (err.code === 'ECONNABORTED') errorMsg = 'Server timeout.';
      else if (err.response?.data?.msg) errorMsg = err.response.data.msg;
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [maxAppointments, token, navigation, showToast]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      
      <View style={styles.alertOverlay} pointerEvents="box-none">
         <CustomToast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} theme={theme} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
              
              <HeaderContent theme={theme} onBack={handleBack} />

              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: theme.colors.text }]}>MAX APPOINTMENTS / DAY</Text>
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    { 
                      transform: [{ scale: inputScale }],
                      borderColor: isFocused ? theme.colors.primary : theme.colors.border,
                      backgroundColor: theme.colors.surface || theme.colors.background,
                      shadowColor: isFocused ? theme.colors.primary : "#000",
                      shadowOpacity: isFocused ? 0.15 : 0.02,
                    }
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={maxAppointments}
                    onChangeText={handleChangeText}
                    keyboardType="number-pad"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text + '40'}
                    maxLength={3}
                  />
                </Animated.View>
              </View>

              <View style={styles.spacer} />
              <SaveButton onPress={handleSave} isLoading={isLoading} theme={theme} />

            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- ALERT ---
  alertOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 0, 
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    minWidth: '85%',
    maxWidth: '90%',
    justifyContent: 'center',
    marginTop: 10,
  },
  toastIcon: { marginRight: 12 },
  toastText: { fontSize: 14, fontWeight: '600', flex: 1 },

  // --- CONTAINER ---
  innerContainer: { flex: 1 },
  contentWrapper: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  
  // --- PREMIUM TOP BAR ---
  headerSection: {
    marginTop: 40,
    marginBottom: 40,
  },
  topNav: {
    height: 50, // Fixed height for alignment
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14, // Squircle shape
    borderWidth: 1, // Subtle border
    justifyContent: 'center',
    alignItems: 'center',
    // Soft shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitles: {
      alignItems: 'flex-start'
  },
  iconContainer: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '500' },

  // --- INPUT ---
  inputSection: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1, opacity: 0.6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 20, height: 68,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, fontSize: 24, fontWeight: '700', height: '100%' },
  
  spacer: { flex: 1 },
  
  // --- BUTTON ---
  button: {
    height: 58, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
});

export default AppointmentSettingsScreen;