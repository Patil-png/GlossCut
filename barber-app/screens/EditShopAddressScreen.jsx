import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
  Keyboard
} from 'react-native';
import api from "../utils/api";
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, MapPin, AlertCircle, CheckCircle, Info, Navigation, ShieldCheck, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- 1. PREMIUM TOAST (Unchanged Logic, Refined Styling) ---
const ToastNotification = React.memo(({ visible, message, type, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: Platform.OS === 'ios' ? 60 : 40,
          damping: 15,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const getStyles = () => {
    switch (type) {
      case 'success': return { bg: '#10B981', icon: <CheckCircle color="#fff" size={20} strokeWidth={2.5} /> };
      case 'error': return { bg: '#EF4444', icon: <AlertCircle color="#fff" size={20} strokeWidth={2.5} /> };
      default: return { bg: '#3B82F6', icon: <Info color="#fff" size={20} strokeWidth={2.5} /> };
    }
  };

  const styleConfig = getStyles();

  return (
    <Animated.View style={[styles.toastWrapper, { transform: [{ translateY }], opacity }]}>
      <View style={[styles.toastContainer, { backgroundColor: theme.colors.card, borderLeftColor: styleConfig.bg }]}>
        <View style={[styles.toastIconBubble, { backgroundColor: styleConfig.bg }]}>
          {styleConfig.icon}
        </View>
        <Text style={[styles.toastText, { color: theme.colors.text }]}>{message}</Text>
      </View>
    </Animated.View>
  );
});

// --- 2. MAIN SCREEN ---
const EditShopAddressScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // --- BUSINESS LOGIC (UNCHANGED) ---
  const [shopAddress, setShopAddress] = useState(route.params?.currentAddress || '');
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pinBounce = useRef(new Animated.Value(0)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // --- HELPERS ---
  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // --- OWNERSHIP CHECK ---
  useEffect(() => {
    let isMounted = true;

    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    // Loop Pin Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinBounce, { toValue: -10, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pinBounce, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();

    const checkOwnership = async () => {
      try {
        const res = await api.get('/api/shop/my-shop', {
          timeout: 5000
        });

        if (isMounted) {
          if (res.data.isMainOwner) {
            setIsShopOwner(true);
          } else {
            setIsShopOwner(false);
            showToast('Permission Denied: Only the main owner can edit.', 'error');
            setTimeout(() => navigation.goBack(), 2000);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setIsShopOwner(false);
          const msg = err.response?.data?.message || 'Unable to verify ownership.';
          showToast(msg, 'error');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    checkOwnership();
    return () => { isMounted = false; };
  }, [navigation, fadeAnim, showToast]);

  // --- SUBMIT HANDLER ---
  const handleUpdate = async () => {
    Keyboard.dismiss();
    if (!shopAddress.trim()) {
      showToast('Address cannot be empty.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Button Press Animation
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const response = await api.put('/api/shop',
        { address: shopAddress }
      );

      if (response.status === 200) {
        showToast('Address updated! Pending admin approval.', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showToast('Failed to update shop address.', 'error');
      }
    } catch (err) {
      console.error('Error updating shop address:', err);
      const errorMsg = !err.response
        ? 'Network Error. Check your internet.'
        : 'Failed to update. Server error.';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputFocus = () => {
    Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true }).start();
  };

  // --- RENDER HELPERS ---
  const primaryColor = theme.colors.primary;
  const cardBg = theme.colors.card;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} theme={theme} />

      {/* --- HEADER --- */}
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#fff' }]}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Location</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >

          {/* --- HERO: ABSTRACT MAP VISUALIZATION --- */}
          <View style={[styles.mapCard, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}>
            {/* Decorative Map Lines (CSS Art) */}
            <View style={[styles.road, { top: '30%', height: 12, backgroundColor: isDark ? '#334155' : '#DBEAFE' }]} />
            <View style={[styles.roadVertical, { left: '40%', width: 12, backgroundColor: isDark ? '#334155' : '#DBEAFE' }]} />

            {/* Animated Pin */}
            <Animated.View style={[styles.pinContainer, { transform: [{ translateY: pinBounce }] }]}>
              <View style={[styles.pinHead, { backgroundColor: primaryColor }]}>
                <Home size={20} color="#fff" fill="#fff" />
              </View>
              <View style={[styles.pinStick, { backgroundColor: primaryColor }]} />
            </Animated.View>

            {/* Pulse Shadow on Ground */}
            <View style={[styles.pinShadow, { backgroundColor: primaryColor }]} />

            <View style={styles.mapTextContainer}>
              <Text style={[styles.mapTitle, { color: theme.colors.text }]}>Precisely Locate Your Shop</Text>
              <Text style={[styles.mapSubtitle, { color: theme.colors.textSecondary }]}>
                Accurate addresses reduce cancellations by 30%
              </Text>
            </View>
          </View>

          {initialLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
            </View>
          ) : (
            <View style={styles.formContainer}>

              {/* --- INPUT SECTION --- */}
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>COMPLETE ADDRESS</Text>
                {shopAddress.length > 0 && <CheckCircle size={14} color="#10B981" />}
              </View>

              <Animated.View style={[
                styles.inputWrapper,
                {
                  backgroundColor: inputBg,
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  transform: [{ scale: inputScale }]
                }
              ]}>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  value={shopAddress}
                  onChangeText={setShopAddress}
                  placeholder="Flat No, Building, Street, Landmark..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  textAlignVertical="top"
                />
                <View style={styles.inputIcon}>
                  <MapPin size={20} color="#9CA3AF" />
                </View>
              </Animated.View>

              {/* --- TRUST BADGE --- */}
              <View style={[styles.trustBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                <ShieldCheck size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trustTitle, { color: '#059669' }]}>Privacy Protected</Text>
                  <Text style={[styles.trustDesc, { color: isDark ? '#A7F3D0' : '#34D399' }]}>
                    Your exact address is only shared with customers after a confirmed booking.
                  </Text>
                </View>
              </View>

            </View>
          )}

        </Animated.ScrollView>

        {/* --- FLOATING FOOTER --- */}
        <View style={[styles.footerContainer, { backgroundColor: theme.colors.background }]}>
          <LinearGradient
            colors={[isDark ? 'rgba(15,23,42,0)' : 'rgba(255,255,255,0)', theme.colors.background]}
            style={styles.footerGradient}
            pointerEvents="none"
          />
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleUpdate}
              disabled={isSubmitting || initialLoading}
              style={[
                styles.submitButton,
                {
                  backgroundColor: primaryColor,
                  shadowColor: primaryColor,
                  opacity: (isSubmitting || initialLoading) ? 0.7 : 1
                }
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitText}>Save Location</Text>
                  <Navigation size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // --- Content ---
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120, // Space for footer
  },
  // --- Map Visualization (CSS Art) ---
  mapCard: {
    height: 180,
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  road: {
    position: 'absolute',
    width: '120%',
    transform: [{ rotate: '-10deg' }],
  },
  roadVertical: {
    position: 'absolute',
    height: '120%',
    transform: [{ rotate: '15deg' }],
  },
  pinContainer: {
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 4,
  },
  pinHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  pinStick: {
    width: 4,
    height: 10,
    borderRadius: 2,
    marginTop: -2,
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 100,
    opacity: 0.2,
    transform: [{ scaleX: 2 }],
  },
  mapTextContainer: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  mapSubtitle: {
    fontSize: 11,
    opacity: 0.7,
  },
  // --- Form ---
  formContainer: {
    gap: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.7,
  },
  inputWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginRight: 10,
    paddingTop: 0,
  },
  inputIcon: {
    marginTop: 2,
  },
  // --- Trust Badge ---
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  // --- Footer ---
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 10,
  },
  footerGradient: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  submitButton: {
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- Toast ---
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    width: width * 0.9,
    maxWidth: 400,
  },
  toastIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default EditShopAddressScreen;