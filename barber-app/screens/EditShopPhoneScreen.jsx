import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
  UIManager,
  LayoutAnimation,
  Dimensions
} from 'react-native';
import api from "../utils/api";
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, ShieldCheck, CheckCircle2, Lock, Smartphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const EditShopPhoneScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  // eslint-disable-next-line no-unused-vars
  const { user, updateProfile } = useAuth();
  const [shopPhone, setShopPhone] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isShopOwner, setIsShopOwner] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // --- ANIMATION STATE VALUES ---
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const validAnim = useRef(new Animated.Value(0)).current;

  // ==========================================
  // LOGIC SECTION (UNCHANGED)
  // ==========================================
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const res = await api.get('/api/shop/my-shop');
        if (res.data.isMainOwner) {
          setIsShopOwner(true);
        } else {
          setIsShopOwner(false);
          Alert.alert(
            'Permission Denied',
            'Only the main shop owner can edit shop details.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (err) {
        console.error(err);
        setIsShopOwner(false);
        Alert.alert(
          'Permission Denied',
          'Only the main shop owner can edit shop details.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [navigation]);

  useEffect(() => {
    if (route.params.currentPhone) {
      const number = route.params.currentPhone.startsWith('+91') ? route.params.currentPhone.slice(3) : route.params.currentPhone;
      setShopPhone(number);
    }
  }, [route.params.currentPhone]);

  const handleUpdate = async () => {
    if (shopPhone.length !== 10) {
      Vibration.vibrate(50);
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const response = await api.put('/api/shop', { phone: `+91${shopPhone}` });

      if (response.status === 200) {
        Vibration.vibrate([0, 50, 50, 50]);
        Alert.alert('Success', 'Shop phone number updated successfully! Your changes are pending admin approval.');
        navigation.goBack();
      } else {
        Alert.alert('Update Failed', 'Could not update shop phone number. Please try again.');
      }
    } catch (err) {
      console.error('Error updating shop phone:', err);
      Alert.alert('Update Failed', 'Could not update shop phone number. Please try again.');
    }
  };
  // ==========================================
  // END LOGIC SECTION
  // ==========================================

  // --- UI INTERACTIONS ---
  const handleTextChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setShopPhone(cleaned);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (cleaned.length === 10) {
      Animated.spring(validAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
      Vibration.vibrate(10);
    } else {
      Animated.timing(validAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, { toValue: 1.02, friction: 8, useNativeDriver: true }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, speed: 20, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, speed: 20, useNativeDriver: true }).start();
  };

  const isValid = shopPhone.length === 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />

      {/* 1. PREMIUM TOP BAR (Updated) */}
      <View style={[
        styles.headerContainer,
        {
          backgroundColor: theme.colors.background,
          // Handle Android Status Bar Height manually if translucent, or rely on SafeAreaView
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10
        }
      ]}>

        {/* Left: Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, { backgroundColor: isDark ? '#2D2D2D' : '#F3F4F6' }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Center: Title */}
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Update Contact
        </Text>

        {/* Right: Invisible Spacer for perfect center alignment */}
        <View style={styles.headerSpacer} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>

            {/* 2. Hero Section */}
            <View style={styles.heroContainer}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1E293B' : '#F0F9FF' }]}>
                <Smartphone size={32} color={theme.colors.primary} />
                <View style={[styles.pulseCircle, { borderColor: theme.colors.primary, opacity: 0.1 }]} />
              </View>

              <Text style={[styles.mainHeading, { color: theme.colors.text }]}>
                New Shop Number
              </Text>
              <Text style={[styles.subHeading, { color: theme.colors.textSecondary }]}>
                This number will be visible to customers on your booking page.
              </Text>
            </View>

            {/* 3. The Input Card */}
            <Animated.View style={[
              styles.inputCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isFocused ? theme.colors.primary : 'transparent',
                borderWidth: isFocused ? 1.5 : 0,
                transform: [{ scale: scaleAnim }],
                shadowColor: isFocused ? theme.colors.primary : "#000",
                shadowOpacity: isFocused ? 0.12 : 0.06,
                shadowRadius: isFocused ? 16 : 12,
                shadowOffset: { width: 0, height: 8 }
              }
            ]}>
              <View style={styles.countryBadge}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={[styles.countryCode, { color: theme.colors.text }]}>+91</Text>
                <View style={[styles.divider, { backgroundColor: isDark ? '#404040' : '#E5E7EB' }]} />
              </View>

              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={shopPhone}
                onChangeText={handleTextChange}
                placeholder="00000 00000"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={10}
                onFocus={handleFocus}
                onBlur={handleBlur}
                selectionColor={theme.colors.primary}
              />

              <Animated.View style={{ transform: [{ scale: validAnim }], opacity: validAnim }}>
                <View style={styles.checkCircle}>
                  <CheckCircle2 size={18} color="#fff" />
                </View>
              </Animated.View>
            </Animated.View>

            {/* 4. Trust Indicator */}
            <View style={styles.trustRow}>
              <ShieldCheck size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.trustText, { color: theme.colors.textSecondary }]}>
                Verified connection secured by encryption
              </Text>
            </View>

          </Animated.View>

          {/* 5. Bottom Action */}
          <Animated.View style={{ transform: [{ scale: buttonScale }], paddingBottom: 10 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={handleUpdate}
            >
              <LinearGradient
                colors={isValid
                  ? [theme.colors.primary, '#6366F1']
                  : [isDark ? '#333' : '#E0E0E0', isDark ? '#333' : '#E0E0E0']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ctaButton, {
                  shadowColor: isValid ? theme.colors.primary : 'transparent',
                }]}
              >
                <Text style={[styles.ctaText, { color: isValid ? '#fff' : '#9CA3AF' }]}>
                  {isValid ? "Update Number" : "Enter 10 Digits"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.disclaimerRow}>
              <Lock size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.disclaimerText, { color: theme.colors.textSecondary }]}>
                Changes require admin approval
              </Text>
            </View>
          </Animated.View>

        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- NEW HEADER STYLES ---
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14, // Consistent squircle
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44, // Matches button width for perfect centering
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // --- END HEADER STYLES ---
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 30,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '85%',
    fontWeight: '500',
    opacity: 0.7,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 22,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '700',
    marginRight: 14,
  },
  divider: {
    width: 1.5,
    height: 24,
    marginRight: 16,
    borderRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 1.2,
    height: '100%',
  },
  checkCircle: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disclaimerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6
  },
  disclaimerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  }
});

export default EditShopPhoneScreen;