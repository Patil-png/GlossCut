import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
  ActivityIndicator // Added for the loading spinner
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, MapPin, Check, X, Globe, AlertCircle } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- 1. Premium Alert Component ---
const FloatingAlert = ({ visible, message, type, onClose }) => {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();

      const timer = setTimeout(() => hideAlert(), 3000);
      return () => clearTimeout(timer);
    } else {
      hideAlert();
    }
  }, [visible]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose && onClose());
  };

  if (!visible) return null;

  const isError = type === 'error';
  // Modern pastel colors
  const bgColor = isError ? '#FEF2F2' : '#F0FDF4'; 
  const borderColor = isError ? '#FECACA' : '#BBF7D0';
  const iconColor = isError ? '#EF4444' : '#22C55E';
  const textColor = isError ? '#991B1B' : '#166534';

  return (
    <Animated.View style={[styles.alertContainer, { transform: [{ translateY }] }]}>
      <View style={[styles.alertContent, { backgroundColor: bgColor, borderColor: borderColor }]}>
        {isError ? <AlertCircle size={22} color={iconColor} /> : <Check size={22} color={iconColor} />}
        <Text style={[styles.alertText, { color: textColor }]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 2. Bouncy Button with Haptics ---
const ScaleButton = ({ onPress, style, children, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      // Light vibration for feedback
      if (Platform.OS === 'android') Vibration.vibrate(10); 
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- 3. Main Screen ---
const ManualLocationInputScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentLocation, onSave } = route.params || {};

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    if (currentLocation?.coordinates) {
      setLatitude(currentLocation.coordinates[1]?.toString() || '');
      setLongitude(currentLocation.coordinates[0]?.toString() || '');
    }
  }, [currentLocation]);

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    setTimeout(() => setAlert(prev => ({ ...prev, visible: false })), 3000);
  };

  const validateCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!lat || !lng) return 'Please enter both latitude and longitude';
    if (isNaN(latNum) || isNaN(lngNum)) return 'Coordinates must be valid numbers';
    if (latNum < -90 || latNum > 90) return 'Latitude must be between -90 and 90';
    if (lngNum < -180 || lngNum > 180) return 'Longitude must be between -180 and 180';
    return null;
  };

  const handleSaveLocation = async () => {
    Keyboard.dismiss();
    const validationError = validateCoordinates(latitude, longitude);
    if (validationError) {
      showAlert(validationError, 'error');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error("Please login to update location");

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        {
          location: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          }
        },
        { headers: { 'x-auth-token': token } }
      );

      showAlert('Location updated successfully!', 'success');
      
      setTimeout(() => {
        if (onSave) onSave([parseFloat(longitude), parseFloat(latitude)]);
        navigation.goBack();
      }, 1500);

    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Update failed. Check connection.';
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearCoordinates = () => {
    setLatitude('');
    setLongitude('');
    setFocusedField(null);
    Keyboard.dismiss();
  };

  // Modern Input Style logic
  const getInputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return {
      borderColor: isFocused ? theme.colors.primary : 'transparent',
      backgroundColor: isFocused ? theme.colors.card : (theme.dark ? '#2a2a2a' : '#F3F4F6'),
      borderWidth: 2,
      shadowOpacity: isFocused ? 0.05 : 0,
      elevation: isFocused ? 2 : 0,
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.dark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            
            {/* --- Header --- */}
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.backButton, { backgroundColor: theme.colors.card }]}
              >
                <ArrowLeft size={22} color={theme.colors.text} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  Edit Location
                </Text>
              </View>
              <View style={styles.backButtonPlaceholder} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                
                {/* Hero Icon */}
                <View style={styles.heroSection}>
                  <View style={[styles.iconRing, { borderColor: `${theme.colors.primary}20` }]}>
                    <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                      <MapPin size={32} color={theme.colors.primary} fill={`${theme.colors.primary}20`} />
                    </View>
                  </View>
                  <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                    Pinpoint Your Shop
                  </Text>
                  <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
                    Enter exact coordinates to help delivery partners and customers find you easily.
                  </Text>
                </View>

                {/* Inputs */}
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>LATITUDE</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }, getInputStyle('lat')]}
                      value={latitude}
                      onChangeText={setLatitude}
                      placeholder="e.g. 20.9136"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onFocus={() => setFocusedField('lat')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>LONGITUDE</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }, getInputStyle('lng')]}
                      value={longitude}
                      onChangeText={setLongitude}
                      placeholder="e.g. 77.7680"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveLocation}
                      onFocus={() => setFocusedField('lng')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Pro Tip Box */}
                <View style={[styles.tipBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: '#E0F2FE' }]}>
                    <Globe size={18} color="#0284C7" />
                  </View>
                  <View style={styles.tipTextContainer}>
                    <Text style={[styles.tipTitle, { color: theme.colors.text }]}>How to find this?</Text>
                    <Text style={[styles.tipDesc, { color: theme.colors.textSecondary }]}>
                      Open Google Maps → Long press your shop's location → Copy the numbers.
                    </Text>
                  </View>
                </View>

              </Animated.View>
            </ScrollView>

            {/* --- Updated Bottom Bar --- */}
            <View style={[styles.bottomContainer, { 
                backgroundColor: theme.colors.background, 
                borderTopColor: theme.colors.border 
            }]}>
              
              {/* Secondary Button (Close/Clear) */}
              <ScaleButton 
                onPress={clearCoordinates} 
                style={[styles.btnSecondary, { backgroundColor: theme.dark ? '#333' : '#F3F4F6' }]}
              >
                <X size={22} color={theme.colors.text} />
              </ScaleButton>

              {/* Primary Button (Update) */}
              <ScaleButton 
                onPress={handleSaveLocation} 
                disabled={loading}
                style={[
                  styles.btnPrimary, 
                  { 
                    backgroundColor: theme.colors.primary, 
                    // Create a "Glow" effect using the primary color
                    shadowColor: theme.colors.primary, 
                    opacity: loading ? 0.8 : 1 
                  }
                ]}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>Saving...</Text>
                  </View>
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnPrimaryText}>Update Location</Text>
                  </View>
                )}
              </ScaleButton>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      <FloatingAlert 
        visible={alert.visible} 
        message={alert.message} 
        type={alert.type} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Alert Styles ---
  alertContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  // --- Header Styles ---
  headerContainer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // --- Content Styles ---
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120, // Space for bottom bar
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconRing: {
    borderWidth: 1,
    borderRadius: 100,
    padding: 6,
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    paddingHorizontal: 10,
  },
  // --- Form Styles ---
  formSection: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 4,
    opacity: 0.6,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // --- Tip Box ---
  tipBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  // --- Bottom Bar Updated ---
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    gap: 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 100,
  },
  btnSecondary: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    paddingHorizontal: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconBadge: {
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ManualLocationInputScreen;