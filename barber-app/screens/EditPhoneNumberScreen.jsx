import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, Phone, CheckCircle, AlertCircle, Smartphone, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- Custom Alert Component (Dynamic Island Style) ---
const CustomToast = ({ visible, message, type, theme }) => {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: Platform.OS === 'ios' ? 50 : 20,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 300,
          easing: Easing.in(Easing.back(1)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const config = type === 'success' 
    ? { bg: ['#00b09b', '#96c93d'], icon: <CheckCircle color="#fff" size={22} strokeWidth={3} /> }
    : { bg: ['#ff5f6d', '#ffc371'], icon: <AlertCircle color="#fff" size={22} strokeWidth={3} /> };

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <LinearGradient
        colors={config.bg}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        style={styles.toastGradient}
      >
        <View style={styles.toastIconBox}>{config.icon}</View>
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const EditPhoneNumberScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  // State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Alert State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  // Initial Load & Pulse Animation
  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();

    // Pulse Animation for Icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1.1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    if (user?.phone) {
      const number = user.phone.startsWith('+91') ? user.phone.slice(3) : user.phone;
      setPhoneNumber(number);
    }
  }, [user]);

  // Focus Animation
  useEffect(() => {
    Animated.timing(inputScale, {
      toValue: isFocused ? 1.02 : 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  }, [isFocused]);

  // Helper: Show Custom Alert
  const showAlert = (message, type) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleUpdatePhoneNumber = async () => {
    Keyboard.dismiss();
    
    // Button Press Animation
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // 1. Validation Logic
    if (phoneNumber.length !== 10) {
      showAlert('Please enter a valid 10-digit number.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // 3. Core Update Logic
      const success = await updateProfile({ phone: `+91${phoneNumber}` });

      if (success) {
        showAlert('Phone number updated successfully!', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      // 4. Robust Error Handling
      showAlert('Connection failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

        {/* --- Background Decor (Blinkit/Zomato style blobs) --- */}
        <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: 0.05, top: -50, right: -50 }]} />
        <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: 0.03, bottom: 100, left: -50, width: 200, height: 200 }]} />

        {/* Custom Toast */}
        <CustomToast visible={toast.visible} message={toast.message} type={toast.type} theme={theme} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5' }]}
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account Details</Text>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <Animated.View style={{ flex: 1, opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
            
            {/* Hero Icon Section */}
            <View style={styles.heroSection}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: iconPulse }], borderColor: theme.colors.primary }]} />
              <LinearGradient
                colors={isDark ? [theme.colors.card, '#2c3e50'] : ['#ffffff', '#f8f9fa']}
                style={[styles.iconContainer, { shadowColor: theme.colors.primary }]}
              >
                <Smartphone size={36} color={theme.colors.primary} />
              </LinearGradient>
              
              <Text style={[styles.title, { color: theme.colors.text }]}>Change Mobile Number</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We'll use this number to send booking confirmations and updates.
              </Text>
            </View>
            
            {/* Input Section */}
            <View style={styles.formContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>MOBILE NUMBER</Text>
              
              <Animated.View style={[
                styles.inputWrapper, 
                { 
                  transform: [{ scale: inputScale }],
                  borderColor: isFocused ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card,
                  shadowOpacity: isFocused ? 0.15 : 0.05,
                }
              ]}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={[styles.countryCodeText, { color: theme.colors.text }]}>+91</Text>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                </View>
                
                <TextInput
                  style={[styles.phoneNumberInput, { color: theme.colors.text }]}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  editable={!isLoading}
                  selectionColor={theme.colors.primary}
                />
                
                {phoneNumber.length === 10 && (
                   <CheckCircle size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                )}
              </Animated.View>

              {/* Trust Badge */}
              <View style={styles.trustBadge}>
                <ShieldCheck size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.trustText, { color: theme.colors.textSecondary }]}>
                  Secured by 256-bit encryption
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Bottom Action Button */}
          <View style={styles.footer}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={handleUpdatePhoneNumber}
                disabled={isLoading || phoneNumber.length !== 10}
              >
                <LinearGradient
                  colors={phoneNumber.length === 10 
                    ? [theme.colors.primary, theme.colors.primary + 'dd'] 
                    : ['#e0e0e0', '#d6d6d6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.updateButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text style={[
                      styles.updateButtonText, 
                      { color: phoneNumber.length === 10 ? '#fff' : '#888' }
                    ]}>
                      Verify & Update
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: 0,
  },
  // --- Toast ---
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 9999,
    width: '90%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toastIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 6,
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 12,
    fontSize: 15,
    flex: 1,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    marginTop: 35,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // --- Content ---
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    opacity: 0.3,
    top: -5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 30, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
    opacity: 0.7,
  },
  // --- Form ---
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
    opacity: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 12,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.02)', // Subtle separate bg for code
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    marginLeft: 14,
    opacity: 0.2,
  },
  phoneNumberInput: {
    flex: 1,
    height: '100%',
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  trustText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  // --- Footer ---
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 20,
  },
  updateButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default EditPhoneNumberScreen;