import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  ScrollView,
  Animated,
  Platform,
  Easing,
  Dimensions,
  ActivityIndicator,
  Vibration
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext.jsx';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  User, Mail, Phone, 
  VenetianMask, Languages, Camera, 
  CheckCircle, XCircle, AlertTriangle, Info, ArrowLeft, WifiOff, ChevronRight,
  ShieldCheck, Sparkles 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;

// ============================================================================
// 1. UTILS & MICRO-INTERACTIONS
// ============================================================================

const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    Vibration.vibrate(10); // Subtle "tick" feeling
  }
};

/**
 * ProfileStrength: Gamified progress bar to encourage completion
 */
const ProfileStrength = ({ user, theme }) => {
  // Calculate strength based on fields present
  const fields = [user?.name, user?.email, user?.phone, user?.gender, user?.profilePicture];
  const filled = fields.filter(f => f).length;
  const total = fields.length;
  const progress = filled / total;
  
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false 
    }).start();
  }, [progress]);

  const progressWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={[styles.strengthContainer, { backgroundColor: theme.colors.card }]}>
      <View style={styles.strengthHeader}>
        <View style={styles.strengthTitleRow}>
          <Sparkles size={14} color={theme.colors.primary} />
          <Text style={[styles.strengthTitle, { color: theme.colors.text }]}>Profile Strength</Text>
        </View>
        <Text style={[styles.strengthPercent, { color: theme.colors.primary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View style={styles.progressBarBg}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { 
              width: progressWidth, 
              backgroundColor: theme.colors.primary 
            }
          ]} 
        />
      </View>
      <Text style={[styles.strengthHint, { color: theme.colors.textSecondary }]}>
        {progress === 1 ? "Your profile is looking great!" : "Complete your details for better trust."}
      </Text>
    </View>
  );
};

/**
 * ModernAlert: Premium floating notification
 */
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 120,
        mass: 1,
        useNativeDriver: true
      }).start();

      const timer = setTimeout(() => handleClose(), 4000);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-150); 
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const config = useMemo(() => {
    switch (type) {
      case 'error': return { bg: '#FEF2F2', border: '#FECACA', iconColor: '#EF4444', Icon: XCircle };
      case 'success': return { bg: '#F0FDF4', border: '#86EFAC', iconColor: '#22C55E', Icon: CheckCircle };
      case 'warning': return { bg: '#FFFBEB', border: '#FDE68A', iconColor: '#F59E0B', Icon: AlertTriangle };
      case 'network': return { bg: '#EFF6FF', border: '#BFDBFE', iconColor: '#3B82F6', Icon: WifiOff };
      default: return { bg: '#FFFFFF', border: '#E5E7EB', iconColor: '#6B7280', Icon: Info };
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

/**
 * ScaleButton: High-fidelity tactile feedback
 */
const ScaleButton = React.memo(({ onPress, style, children, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    triggerHaptic();
    Animated.spring(scaleValue, { toValue: 0.97, useNativeDriver: true }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  }, []);

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={onPress} 
      onPressIn={onPressIn} 
      onPressOut={onPressOut} 
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }], width: '100%' }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

/**
 * InfoCard: The core "Action Row" component
 */
const InfoCard = React.memo(({ icon: Icon, label, value, onPress, theme, index, isLast }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = 50 * index;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 15, delay, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScaleButton onPress={onPress}>
        <View style={[
          styles.rowContainer, 
          { backgroundColor: theme.colors.card },
          isLast && styles.rowContainerLast
        ]}>
          <View style={[styles.iconBox, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
            <Icon size={20} color={theme.colors.primary} strokeWidth={2} />
          </View>
          
          <View style={[styles.rowContent, !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.textStack}>
              <Text style={[styles.rowLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]} numberOfLines={1}>
                {value || (label === 'Email' ? 'No Email' : 'Tap to add')}
              </Text>
            </View>

            <View style={styles.actionIcon}>
              <View style={[styles.editBadge, { backgroundColor: theme.colors.primary + '10' }]}>
                <ChevronRight size={16} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </ScaleButton>
    </Animated.View>
  );
});

// ============================================================================
// 2. MAIN SCREEN LOGIC
// ============================================================================

const PersonalInfoScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, setUser, updateProfile } = useAuth();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });

  // Animation for Header
  const scrollY = useRef(new Animated.Value(0)).current;

  const showAlert = useCallback((title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const onEditName = useCallback(() => navigation.navigate('EditName'), [navigation]);
  const onEditEmail = useCallback(() => navigation.navigate('EditEmail'), [navigation]);
  const onEditPhone = useCallback(() => navigation.navigate('EditPhoneNumber'), [navigation]);
  const onEditGender = useCallback(() => navigation.navigate('GenderSelection'), [navigation]);
  const onEditLanguage = useCallback(() => navigation.navigate('LanguageSelection'), [navigation]);

  const fetchBarberCardImage = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`,
        {
          headers: { "x-auth-token": token },
        }
      );

      if (response.data && response.data.image) {
        // Process the image URL the same way as CreateBarberCardScreen
        const barberCardImageUri = response.data.image.startsWith("http")
          ? response.data.image
          : `${process.env.EXPO_PUBLIC_API_URL}${response.data.image}`;

        setImage(barberCardImageUri);
      }
    } catch (err) {
      // Silently handle errors - barber card might not exist yet
      console.log('Could not fetch barber card image:', err.message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const loadData = async () => {
        try {
          const storedToken = await AsyncStorage.getItem('token');
          if (storedToken) {
            axios.defaults.headers.common['x-auth-token'] = storedToken;
            // Load user data
            const userRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`);
            setUser(userRes.data);

            // Load barber card image
            await fetchBarberCardImage();
          }
        } catch (err) {
          console.log("Silent Refresh Error");
        }
      };
      loadData();
    });
    return unsubscribe;
  }, [navigation, setUser, fetchBarberCardImage]);

  const avatarSource = useMemo(() => 
    image ? { uri: image } : require('../assets/SetKarr.png'), 
  [image]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      <ModernAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.message} 
        type={alert.type} 
        onHide={() => setAlert({ ...alert, visible: false })} 
      />

      {/* --- Sticky Header --- */}
      <View style={[styles.headerWrapper, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={[styles.glassButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Profile</Text>
          <View style={{ width: 44 }} /> 
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        
        {/* --- Avatar & Hero Section --- */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            {/* Pulse Effect */}
            <View style={[styles.pulseCircle, { borderColor: theme.colors.primary, opacity: 0.15 }]} />
            <View style={[styles.pulseCircleInner, { borderColor: theme.colors.primary, opacity: 0.3 }]} />

            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.card }]}>
              {uploading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <Image source={avatarSource} style={styles.avatar} />
              )}
            </View>
            

          </View>
          
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name || "User"}
          </Text>
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={12} color={theme.colors.primary} />
            <Text style={[styles.verifiedText, { color: theme.colors.primary }]}>Verified Account</Text>
          </View>
        </View>

        {/* --- Gamification: Profile Strength --- */}
        <View style={styles.sectionContainer}>
            <ProfileStrength user={user} theme={theme} />
        </View>

        {/* --- Info List Group --- */}
        <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.colors.textSecondary }]}>PERSONAL DETAILS</Text>
        </View>

        <View style={[styles.groupedList, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <InfoCard index={0} icon={User} label="Full Name" value={user?.name} theme={theme} onPress={onEditName} />
          <InfoCard index={1} icon={Mail} label="Email Address" value={user?.email} theme={theme} onPress={onEditEmail} />
          <InfoCard index={2} icon={Phone} label="Phone Number" value={user?.phone} theme={theme} onPress={onEditPhone} />
          <InfoCard index={3} icon={VenetianMask} label="Gender" value={user?.gender || "Not provided"} theme={theme} onPress={onEditGender} />
          <InfoCard index={4} icon={Languages} label="Language" value={user?.language || "English"} theme={theme} onPress={onEditLanguage} isLast={true} />
        </View>

        <View style={styles.footerSpace} />
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
    paddingBottom: 50,
  },

  // --- Header ---
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_HEIGHT + 6,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 14, // Modern "Squircle"
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // --- Hero / Avatar ---
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4, // creates a gap effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
  },
  pulseCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
  },
  pulseCircleInner: {
    position: 'absolute',
    width: 135,
    height: 135,
    borderRadius: 67.5,
    borderWidth: 1,
  },
  editFab: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)', // Subtle primary tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // --- Strength Widget ---
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  strengthContainer: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  strengthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  strengthPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthHint: {
    fontSize: 12,
    fontWeight: '500',
  },

  // --- Grouped List ---
  listHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.6,
  },
  groupedList: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    // Soft shadow for the whole group
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 72,
  },
  rowContainerLast: {
    // Styling for last item if needed
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    height: '100%',
    paddingVertical: 18,
  },
  textStack: {
    flex: 1,
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  actionIcon: {
    marginLeft: 12,
  },
  editBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Alert ---
  alertWrapper: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + 10,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconBox: {
    marginRight: 12,
  },
  alertTextBox: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  alertMessage: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

  footerSpace: {
    height: 40,
  },
});

export default PersonalInfoScreen;
