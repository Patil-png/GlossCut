import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Platform, 
  Animated, 
  Easing,
  Dimensions
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext.jsx';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  ChevronLeft, Edit2, Store, MapPin, Phone, Tag, 
  Camera, CheckCircle, XCircle, AlertTriangle, 
  Info, ArrowLeft, WifiOff, ShieldCheck, Lock
} from 'lucide-react-native';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;

// ============================================================================
// 1. OPTIMIZED UI COMPONENTS
// ============================================================================

/**
 * AnimatedPressable: Memoized touch wrapper with "Bouncy" physics (Tier-1 Feel)
 */
const AnimatedPressable = memo(({ children, onPress, style, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      disabled={disabled}
      style={[{ width: '100%' }, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

/**
 * PremiumInfoRow: The "Apple Settings" style row.
 * Wrapped in memo to prevent entire list re-renders.
 */
const PremiumInfoRow = memo(({ icon: Icon, label, value, theme, onPress, isLast, canEdit = true }) => {
  return (
    <AnimatedPressable onPress={canEdit ? onPress : undefined} disabled={!canEdit}>
      <View style={[
        styles.premiumRow, 
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border + '40' } 
      ]}>
        {/* Pastel Icon Box */}
        <View style={[styles.premiumIconBox, { backgroundColor: canEdit ? theme.colors.primary + '15' : theme.colors.textSecondary + '10' }]}>
          <Icon size={22} color={canEdit ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={2} />
        </View>

        <View style={styles.premiumTextContainer}>
          <Text style={[styles.premiumLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
          <Text 
            style={[styles.premiumValue, { color: value ? theme.colors.text : theme.colors.textSecondary + '80' }]} 
            numberOfLines={1}
          >
            {value || 'Not set'}
          </Text>
          {!canEdit && (
            <View style={styles.readOnlyBadge}>
              <Text style={[styles.readOnlyText, { color: theme.colors.textSecondary }]}>View Only</Text>
            </View>
          )}
        </View>

        {/* Action Indicator */}
        <View style={[styles.actionIconContainer]}>
           {canEdit ? (
             <Edit2 size={14} color={theme.colors.textSecondary} />
           ) : (
             <Lock size={14} color={theme.colors.textSecondary} style={{ opacity: 0.5 }} />
           )}
        </View>
      </View>
    </AnimatedPressable>
  );
}, (prev, next) => {
  // Strict equality check for performance
  return prev.value === next.value && prev.label === next.label && prev.canEdit === next.canEdit;
});

/**
 * GlassBackButton: Consistent navigation button
 */
const GlassBackButton = memo(({ onPress, theme }) => (
  <TouchableOpacity 
    onPress={onPress} 
    activeOpacity={0.7}
    style={[styles.glassButton, { 
      backgroundColor: theme.colors.card, 
      borderColor: theme.colors.border 
    }]}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <ChevronLeft size={24} color={theme.colors.text} />
  </TouchableOpacity>
));

/**
 * ModernAlert: Optimized Floating Alert
 */
const ModernAlert = memo(({ visible, title, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 12,
        stiffness: 100,
        mass: 1,
        useNativeDriver: true
      }).start();
      const timer = setTimeout(() => handleClose(), 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-150); 
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      if (onHide) onHide();
    });
  }, [onHide]);

  const config = useMemo(() => {
    switch (type) {
      case 'error': return { bg: '#FEF2F2', border: '#FECACA', iconColor: '#DC2626', Icon: XCircle };
      case 'success': return { bg: '#F0FDF4', border: '#86EFAC', iconColor: '#16A34A', Icon: CheckCircle };
      case 'warning': return { bg: '#FFFBEB', border: '#FDE68A', iconColor: '#D97706', Icon: AlertTriangle };
      case 'network': return { bg: '#EFF6FF', border: '#BFDBFE', iconColor: '#2563EB', Icon: WifiOff };
      default: return { bg: '#FFFFFF', border: '#E5E7EB', iconColor: '#4B5563', Icon: Info };
    }
  }, [type]);

  if (!visible && translateY._value === -150) return null;

  return (
    <Animated.View style={[styles.alertWrapper, { transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleClose} style={[styles.alertContainer, { backgroundColor: config.bg, borderColor: config.border }]}>
        <View style={styles.alertIconBox}>
          <config.Icon size={24} color={config.iconColor} />
        </View>
        <View style={styles.alertTextBox}>
          <Text style={[styles.alertTitle, { color: config.iconColor }]}>{title}</Text>
          <Text style={styles.alertMessage} numberOfLines={2}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ============================================================================
// 2. MAIN SCREEN LOGIC
// ============================================================================

const ShopInfoScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Stable Alert Handlers
  const showAlert = useCallback((title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
  }, []);

  // Optimized Data Fetching & Page Animation
  useEffect(() => {
    let isMounted = true;
    
    // Animate In
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    const fetchShop = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`, {
            headers: { 'x-auth-token': token },
          });
          
          if (isMounted) {
            setShop(res.data);
            setIsShopOwner(res.data.isMainOwner);
            const shopImageUri = res.data.image || user?.profileImage;
            if (shopImageUri) setImage(shopImageUri);
          }
        } catch (err) {
          console.error(err);
          if (isMounted) {
            if (err.response?.status === 404) {
              setShop(null);
              setIsShopOwner(false);
            } else if (err.code === "ERR_NETWORK") {
               showAlert("Network Error", "Unable to connect to server.", "network");
            }
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchShop();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation, user, fadeAnim, showAlert]);

  // Image Picker
  const pickImage = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera roll permissions are needed.', 'warning');
        return;
      }
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true);
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('shopImage', { uri: localUri, name: filename, type });

      try {
        const token = await AsyncStorage.getItem('token');
        const uploadRes = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token },
        });

        if (uploadRes.data && uploadRes.data.imageUrl) {
          const imageUrl = `${process.env.EXPO_PUBLIC_API_URL}${uploadRes.data.imageUrl}`;
          setImage(imageUrl);
          const shopUpdateRes = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, { image: imageUrl }, {
            headers: { 'x-auth-token': token },
          });

          if (shopUpdateRes.status === 200) {
            showAlert('Success', 'Shop image updated! Pending approval.', 'success');
          } else {
            showAlert('Warning', 'Image uploaded but DB update failed.', 'warning');
          }
        } else {
          showAlert('Error', 'No image URL returned.', 'error');
        }
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
           showAlert("Connection Error", "Please check your internet.", "network");
        } else {
           showAlert('Upload Failed', 'Could not upload image.', 'error');
        }
      } finally {
        setUploading(false);
      }
    }
  }, [showAlert]);

  // Navigation Callbacks
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleEditName = useCallback(() => navigation.navigate('EditShopName', { currentName: shop?.name }), [navigation, shop?.name]);
  const handleEditAddress = useCallback(() => navigation.navigate('EditShopAddress', { currentAddress: shop?.address }), [navigation, shop?.address]);
  const handleEditPhone = useCallback(() => navigation.navigate('EditShopPhone', { currentPhone: shop?.phone }), [navigation, shop?.phone]);
  const handleEditCategory = useCallback(() => navigation.navigate('EditCategory', { currentCategory: shop?.category }), [navigation, shop?.category]);
  const handleCreateCard = useCallback(() => navigation.navigate('CreateBarberCard'), [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      <ModernAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.message} 
        type={alert.type} 
        onHide={hideAlert} 
      />

      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerRow}>
          <GlassBackButton onPress={handleGoBack} theme={theme} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile & Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        overScrollMode="never"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          
          {loading ? (
             <View style={{ marginTop: 100 }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
             </View>
          ) : shop ? (
            <>
              {/* --- Hero Profile Section (Updated UI) --- */}
              <View style={styles.heroSection}>
                <View style={styles.imageWrapper}>
                  {/* Dashed Ring Effect */}
                  <View style={[styles.avatarRing, { borderColor: theme.colors.primary }]}>
                    <Image
                      source={image ? { uri: image } : require('../assets/SetKarr.png')}
                      style={styles.avatar}
                    />
                  </View>
                  
                  {isShopOwner && (
                    <TouchableOpacity
                      style={[styles.floatingEditBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
                      onPress={pickImage}
                      disabled={uploading}
                      activeOpacity={0.8}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Camera size={18} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.heroTextContainer}>
                  <Text style={[styles.heroShopName, { color: theme.colors.text }]}>
                    {shop?.name || 'Untitled Shop'}
                  </Text>
                  
                  <View style={[styles.ownerBadge, { backgroundColor: theme.colors.card }]}>
                    <ShieldCheck size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.heroOwnerName, { color: theme.colors.textSecondary }]}>
                      {user?.name || 'Unknown Owner'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* --- Grouped Info Card (Apple Settings Style) --- */}
              <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>SHOP DETAILS</Text>

              <View style={[styles.groupedCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
                <PremiumInfoRow
                  icon={Store}
                  label="Shop Name"
                  value={shop?.name}
                  theme={theme}
                  onPress={handleEditName}
                  canEdit={isShopOwner}
                />
                <PremiumInfoRow
                  icon={MapPin}
                  label="Location"
                  value={shop?.address}
                  theme={theme}
                  onPress={handleEditAddress}
                  canEdit={isShopOwner}
                />
                <PremiumInfoRow
                  icon={Phone}
                  label="Phone"
                  value={shop?.phone}
                  theme={theme}
                  onPress={handleEditPhone}
                  canEdit={isShopOwner}
                />
                <PremiumInfoRow
                  icon={Tag}
                  label="Category"
                  value={shop?.category || 'Uncategorized'}
                  theme={theme}
                  onPress={handleEditCategory}
                  canEdit={isShopOwner}
                  isLast={true}
                />
              </View>
              
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                Information shown here is visible to all customers on your barber card.
              </Text>
            </>
          ) : (
            /* --- Empty State --- */
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Store size={40} color={theme.colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Setup Your Business</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  Create a professional profile to start accepting appointments and managing your queue.
                </Text>
                
                <AnimatedPressable onPress={handleCreateCard}>
                  <View style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.ctaText}>Create Barber Profile</Text>
                    <ChevronLeft size={20} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
                  </View>
                </AnimatedPressable>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// 3. STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  // Header
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    padding: 6,
    borderRadius: 70, // Slightly larger than avatar + padding
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  floatingEditBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  heroTextContainer: {
    alignItems: 'center',
  },
  heroShopName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroOwnerName: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Grouped Card Styles (Apple Settings Style)
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
    opacity: 0.8,
  },
  groupedCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  premiumIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  premiumLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  premiumValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    opacity: 0.8,
  },
  readOnlyBadge: {
    marginTop: 4,
  },
  readOnlyText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    opacity: 0.6,
  },

  // Empty State
  emptyStateContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    opacity: 0.8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  // Alert Styles
  alertWrapper: {
    position: 'absolute',
    top: 40, 
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  alertTextBox: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  alertMessage: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
});

export default ShopInfoScreen;