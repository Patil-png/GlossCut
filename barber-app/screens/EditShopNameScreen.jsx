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
  Animated,
  Easing,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, Store, Check, AlertCircle, X, Sparkles, Edit3, MapPin, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- 1. PREMIUM "DYNAMIC ISLAND" TOAST (Unchanged Logic, Refined Motion) ---
const ToastNotification = React.memo(({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: Platform.OS === 'ios' ? 60 : 40,
          damping: 15,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();

      const timer = setTimeout(() => handleClose(), 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.back(1.5)),
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  if (!visible && translateY._value === -150) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? '#059669' : '#DC2626'; // Darker shades for better contrast
  const icon = isSuccess ? <Check size={18} color="#fff" strokeWidth={3} /> : <AlertCircle size={18} color="#fff" strokeWidth={3} />;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }, { scale }] }]}>
      <View style={[styles.toastContent, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
        <View style={[styles.toastIcon, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        <Text style={[styles.toastText, { color: theme.colors.text }]}>{message}</Text>
      </View>
    </Animated.View>
  );
});

// --- 2. MAIN SCREEN ---
const EditShopNameScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth() || {}; 
  
  // --- BUSINESS LOGIC (UNCHANGED) ---
  const [shopName, setShopName] = useState(route.params?.currentName || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // --- UI STATE & ANIMATIONS ---
  const [isFocused, setIsFocused] = useState(false);
  
  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Interactive Animations
  const inputScale = useRef(new Animated.Value(1)).current;
  const inputShadow = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Preview Card Animation
  const previewRotate = useRef(new Animated.Value(0)).current;

  // --- Initial Load Logic ---
  useEffect(() => {
    // Entrance Sequence
    Animated.stagger(100, [
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 12, stiffness: 90, useNativeDriver: true })
    ]).start();

    // Data Fetch (Existing Logic)
    const checkOwnership = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`, {
          headers: { 'x-auth-token': token },
          timeout: 10000 
        });

        if (!res.data.isMainOwner) {
          showToast('Access Restricted', 'error');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } catch (err) {
        console.error("Ownership Check Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [navigation]);

  // --- Animation Handlers ---
  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true }),
      Animated.timing(inputShadow, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(inputScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(inputShadow, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  // --- Helpers (Existing Logic) ---
  const showToast = useCallback((message, type) => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // --- Handlers (Existing Logic) ---
  const handleUpdate = useCallback(async () => {
    Keyboard.dismiss();
    if (!shopName.trim()) { showToast('Please enter a name.', 'error'); return; }
    if (shopName === route.params?.currentName) { showToast('No changes made.', 'info'); return; }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        { name: shopName },
        { headers: { 'x-auth-token': token }, timeout: 15000 }
      );

      if (response.status === 200) {
        showToast('Saved Successfully!', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else { throw new Error('Status Error'); }
    } catch (err) {
      showToast(err.response?.data?.msg || 'Update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [shopName, route.params, navigation, showToast]);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    handleUpdate();
  };

  // --- Colors & Styles ---
  const primaryColor = theme.colors.primary;
  // Subtle tint for input background based on theme
  const inputBg = isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF';
  const borderColor = isFocused ? primaryColor : (isDark ? '#334155' : '#E2E8F0');
  
  // Interpolations
  const shadowOpacity = inputShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15]
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      {/* 1. Modern Abstract Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={isDark ? ['#0F172A', '#020617'] : ['#F8FAFC', '#F1F5F9']}
          style={{ flex: 1 }}
        />
        {/* Soft decorative blur circles */}
        <View style={[styles.blurCircle, { backgroundColor: primaryColor, top: -100, right: -100, opacity: 0.08 }]} />
        <View style={[styles.blurCircle, { backgroundColor: primaryColor, bottom: -100, left: -50, opacity: 0.05, width: 300, height: 300 }]} />
      </View>

      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} theme={theme} />

      {/* 2. Minimalist Header */}
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.roundBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#fff' }]}
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Shop Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.flexContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <Animated.ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            
            {/* 3. Live Preview Card (The "Premium" Touch) */}
            <View style={styles.previewSection}>
              <View style={styles.sectionHeader}>
                <Sparkles size={14} color={primaryColor} />
                <Text style={[styles.sectionLabel, { color: primaryColor }]}>LIVE PREVIEW</Text>
              </View>
              
              {/* Mock Shop Card */}
              <View style={[styles.previewCard, { backgroundColor: theme.colors.card }]}>
                {/* Mock Image Area */}
                <View style={styles.mockImageContainer}>
                  <LinearGradient colors={['#e2e8f0', '#cbd5e1']} style={styles.mockImagePlaceholder}>
                    <Store size={32} color="#94a3b8" />
                  </LinearGradient>
                  <View style={[styles.mockBadge, { backgroundColor: primaryColor }]}>
                     <Text style={styles.mockBadgeText}>4.8 <Star size={10} color="#fff" fill="#fff"/></Text>
                  </View>
                </View>
                
                {/* Mock Details */}
                <View style={styles.mockDetails}>
                  <Text style={[styles.mockTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {shopName || "Your Shop Name"}
                  </Text>
                  <View style={styles.mockRow}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.mockSubtext}>City Center • Unisex Salon</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.previewHint}>This is how customers will see your shop.</Text>
            </View>

            {/* 4. Main Input Section */}
            <View style={styles.formSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Shop Name <Text style={{color: '#ef4444'}}>*</Text>
              </Text>
              
              <Animated.View style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  transform: [{ scale: inputScale }],
                  shadowOpacity: shadowOpacity,
                }
              ]}>
                <View style={styles.inputIcon}>
                  <Store size={20} color={isFocused ? primaryColor : '#94A3B8'} />
                </View>
                
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="e.g. The Barber Club"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  editable={!loading && !submitting}
                />

                {shopName.length > 0 && (
                  <TouchableOpacity onPress={() => setShopName('')} hitSlop={10}>
                    <View style={styles.clearBtn}>
                      <X size={12} color="#fff" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                )}
              </Animated.View>
              
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                Use a unique name to stand out in search results.
              </Text>
            </View>

          </Animated.ScrollView>

          {/* 5. Floating Action Footer */}
          <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
            {/* Gradient Mask for footer fade */}
            <LinearGradient
              colors={isDark ? ['transparent', theme.colors.background] : ['rgba(255,255,255,0)', '#fff']}
              style={styles.footerGradient}
              pointerEvents="none"
            />
            
            {loading ? (
               <View style={styles.loaderBox}>
                 <ActivityIndicator size="small" color={primaryColor} />
                 <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Syncing...</Text>
               </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={animateButtonPress}
                  disabled={submitting}
                  style={[
                    styles.primaryButton,
                    { 
                      shadowColor: primaryColor,
                      opacity: submitting ? 0.7 : 1
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[primaryColor, theme.colors.primaryDark || primaryColor]} // Assumes theme has primaryDark, else falls back
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.btnText}>Save Changes</Text>
                        <View style={styles.btnIconBubble}>
                           <Check size={16} color={primaryColor} strokeWidth={3} />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  blurCircle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    transform: [{ scale: 1.2 }],
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Scroll Content
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100, // Space for footer
  },
  // Preview Section
  previewSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  previewCard: {
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.08)',
  },
  mockImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    position: 'relative',
    marginRight: 16,
  },
  mockImagePlaceholder: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mockDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  mockTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  previewHint: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  // Form Section
  formSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    height: '100%',
  },
  clearBtn: {
    backgroundColor: '#cbd5e1',
    borderRadius: 10,
    padding: 3,
  },
  helperText: {
    fontSize: 13,
    marginLeft: 4,
    marginTop: 6,
    lineHeight: 18,
  },
  // Footer
  footer: {
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
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  loaderBox: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontWeight: '600',
  },
  primaryButton: {
    height: 60,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  btnGradient: {
    flex: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnIconBubble: {
    backgroundColor: '#fff',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Toast
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIcon: {
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
  },
});

export default EditShopNameScreen;