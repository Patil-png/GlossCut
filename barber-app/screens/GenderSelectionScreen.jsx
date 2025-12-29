import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Dimensions,
  ActivityIndicator,
  LayoutAnimation
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, User, Check, AlertCircle, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- 1. PREMIUM DYNAMIC ISLAND ALERT ---
const ToastNotification = React.memo(({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      // "Spring" physics for a snappy, physical feel (Like Apple Dynamic Island)
      Animated.spring(translateY, {
        toValue: 40, // Specific request: Margin Top 40
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  }, [visible, onHide, translateY]);

  if (!visible && translateY._value === -150) return null;

  const isSuccess = type === 'success';
  // Premium Gradients used by apps like Zomato/PhonePe
  const gradientColors = isSuccess 
    ? ['#00b09b', '#96c93d'] 
    : ['#FF416C', '#FF4B2B'];

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContent}
      >
        <View style={styles.toastIconBox}>
          {isSuccess ? <Check size={18} color="#FFF" strokeWidth={3} /> : <AlertCircle size={18} color="#FFF" strokeWidth={3} />}
        </View>
        <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
});

// --- 2. MEMOIZED GENDER CARD (With Micro-Animations) ---
const GenderOptionItem = React.memo(({ label, isSelected, theme, onPress }) => {
  // Animation for the card press
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Animation for the checkmark popping in
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      checkScale.setValue(0);
    }
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const activeBorder = theme.colors.primary;
  const inactiveBorder = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const activeBg = theme.isDark ? 'rgba(255,255,255,0.05)' : '#F5FAFF'; // Subtle tint for selected
  const inactiveBg = theme.colors.card;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.optionItem,
          {
            backgroundColor: isSelected ? activeBg : inactiveBg,
            borderColor: isSelected ? activeBorder : inactiveBorder,
            borderWidth: isSelected ? 1.5 : 1, // Thicker border when selected
            // Dynamic Shadow
            shadowColor: isSelected ? theme.colors.primary : "#000",
            shadowOpacity: isSelected ? 0.12 : 0.03,
            shadowRadius: isSelected ? 10 : 5,
            elevation: isSelected ? 4 : 1,
          }
        ]}
      >
        <View style={styles.optionContent}>
          {/* Text */}
          <Text style={[
            styles.optionText, 
            { 
              color: theme.colors.text, 
              fontWeight: isSelected ? '700' : '500',
              opacity: isSelected ? 1 : 0.8
            }
          ]}>
            {label}
          </Text>
        </View>
        
        {/* Radio Circle */}
        <View style={[
          styles.radioCircle, 
          { 
            borderColor: isSelected ? theme.colors.primary : theme.colors.textSecondary,
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            opacity: isSelected ? 1 : 0.4
          }
        ]}>
          {isSelected && (
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
               <Check size={14} color="#FFF" strokeWidth={4} />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => prev.isSelected === next.isSelected && prev.theme.isDark === next.theme.isDark);

// --- 3. MAIN SCREEN ---
const GenderSelectionScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const [selectedGender, setSelectedGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Alert State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Memoized Data
  const genderOptions = useMemo(() => ['Male', 'Female', 'Other'], []);

  // Initial Load Effects
  useEffect(() => {
    // 1. Load Data
    if (user?.gender) {
      setSelectedGender(user.gender);
    }

    // 2. Page Entrance (Smooth Slide Up)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true })
    ]).start();

    // 3. Icon Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
      ])
    ).start();
  }, [user]);

  // Handlers
  const showToast = useCallback((message, type) => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const handleUpdate = async () => {
    if (!selectedGender) {
      showToast('Please select a gender option.', 'error');
      return;
    }
    
    if (user?.gender === selectedGender) {
      showToast('You have already selected this gender.', 'success');
      return;
    }

    setIsLoading(true);

    try {
      // Simulating network resilience logic
      const success = await updateProfile({ gender: selectedGender });
      
      if (success) {
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => navigation.goBack(), 1200);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error("Gender Update Error:", error);
      showToast('No internet connection. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Ambient Background Blobs (Premium Touch) */}
      <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: 0.06, top: -50, right: -80 }]} />
      <View style={[styles.blob, { backgroundColor: '#6dd5ed', opacity: 0.04, bottom: 100, left: -50 }]} />

      <ToastNotification 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        theme={theme}
      />

      {/* Header */}
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f5' }]}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Identity</Text>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          {/* Hero Section */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'center' }}>
            <LinearGradient
              colors={isDark ? [theme.colors.card, '#2c3e50'] : ['#ffffff', '#f0f9ff']}
              style={[styles.iconContainer, { shadowColor: theme.colors.primary }]}
            >
              <User size={40} color={theme.colors.primary} />
              <View style={styles.sparkleBadge}>
                <Sparkles size={10} color="#fff" />
              </View>
            </LinearGradient>
          </Animated.View>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>How do you identify?</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            This helps us personalize your grooming recommendations and offers.
          </Text>
          
          {/* Options List */}
          <View style={styles.optionsContainer}>
            {genderOptions.map((gender) => (
              <GenderOptionItem
                key={gender}
                label={gender}
                isSelected={selectedGender === gender}
                theme={theme}
                onPress={() => setSelectedGender(gender)}
              />
            ))}
          </View>
        </View>

        {/* Floating Footer Button (Blinkit Style) */}
        <TouchableOpacity 
          style={styles.buttonShadow}
          activeOpacity={0.9}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#bdc3c7', '#bdc3c7'] : [theme.colors.primary, theme.colors.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.updateButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Confirm Selection</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Ambient Background
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
    transform: [{ scale: 1.2 }],
  },
  // Toast
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: '92%',
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20, // Pill shape like Dynamic Island
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  toastIconBox: {
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Content Layout
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 10,
  },
  // Hero Icon
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00C853', // Zomato/Success Green
    borderRadius: 10,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    opacity: 0.6,
    paddingHorizontal: 20,
  },
  // Options
  optionsContainer: {
    marginTop: 0,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 24, // Modern "Squircle" feel
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Footer Button
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 10,
  },
  updateButton: {
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default GenderSelectionScreen;