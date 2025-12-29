import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  Easing
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wallet, ShieldCheck, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CUSTOM TOAST COMPONENT (To replace Alert.alert) ---
const ToastNotification = ({ visible, message, type, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 60 : 40, // Adjust for status bar
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Wallet;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], backgroundColor: bgColor }]}>
      <Icon size={24} color="#FFF" style={{ marginRight: 10 }} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const EditUpiScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentUpiId } = route.params;
  
  // State
  const [upiId, setUpiId] = useState(currentUpiId || '');
  const [loading, setLoading] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animation Refs
  const inputScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Validation Logic (Regex for UPI)
  // Format: username@bankname
  const isValidUpi = (text) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(text);
  const isInputValid = isValidUpi(upiId);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Helper to show custom toast
  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleSaveUpiId = async () => {
    // 1. Validation Check on UI
    if (!isInputValid) {
      // Shake animation or similar could go here
      showToast('Please enter a valid UPI ID (e.g., name@bank)', 'error');
      return;
    }

    setLoading(true);
    
    // 2. Token Check
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showToast('Authentication error. Please login again.', 'error');
      setLoading(false);
      return;
    }

    // 3. Robust API Call
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, { upiId }, {
        headers: { 'x-auth-token': token },
        timeout: 10000, // 10 second timeout to prevent hanging
      });

      showToast('UPI ID Linked Successfully!', 'success');
      
      // Delay navigation slightly so user sees the success message
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (err) {
      console.log("Update Error:", err);
      
      // 4. Intelligent Error Handling (Crash Proofing)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        showToast('No Internet or Server Unreachable.', 'error');
      } else if (err.response) {
        // Server responded with an error (4xx, 5xx)
        showToast(err.response.data.msg || 'Failed to update details.', 'error');
      } else {
        // Unknown error
        showToast('Something went wrong. Try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* --- CUSTOM TOAST OVERLAY --- */}
      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} theme={theme} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* --- PREMIUM HEADER --- */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.backButton, { backgroundColor: theme.colors.card }]}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Payment Settings</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Manage your payouts</Text>
            </View>
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            
            {/* Trust Badge */}
            <View style={[styles.trustBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <ShieldCheck size={32} color={theme.colors.primary} />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={[styles.trustTitle, { color: theme.colors.text }]}>Secure Payments</Text>
                <Text style={[styles.trustDesc, { color: theme.colors.textSecondary }]}>
                  Your banking details are encrypted and never shared.
                </Text>
              </View>
            </View>

            {/* Input Label */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Link UPI ID</Text>

            {/* Input Container */}
            <View style={[
              styles.inputWrapper, 
              { 
                backgroundColor: theme.colors.inputBackground || '#F5F5F5',
                borderColor: isInputValid ? '#22c55e' : (upiId.length > 0 ? '#ef4444' : theme.colors.border),
                borderWidth: upiId.length > 0 ? 1.5 : 1
              }
            ]}>
              <Wallet size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
              
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. yourname@oksbi"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Status Indicator inside Input */}
              {upiId.length > 0 && (
                <View>
                  {isInputValid ? (
                    <CheckCircle2 size={20} color="#22c55e" />
                  ) : (
                    <AlertCircle size={20} color="#ef4444" />
                  )}
                </View>
              )}
            </View>

            {/* Validation Message (Subtle, not an error alert) */}
            {upiId.length > 0 && !isInputValid && (
               <Text style={styles.validationText}>
                 Format should be username@bankname
               </Text>
            )}

          </Animated.View>

          {/* Footer Button */}
          <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              onPress={handleSaveUpiId}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[
                styles.saveButton, 
                { 
                  backgroundColor: isInputValid ? theme.colors.primary : '#A0A0A0', // Gray out if invalid
                  shadowColor: theme.colors.primary,
                }
              ]}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Verify & Save</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  // Header Styles
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10, // Handle Android Status Bar
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    marginTop: 10,
  },
  trustTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Input Styles
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },
  validationText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditUpiScreen;