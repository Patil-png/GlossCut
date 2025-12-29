import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, User, Sparkles, Check, AlertCircle, XCircle, CheckCircle2, Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- 1. OPTIMIZED Toast Notification (Dynamic Island Style) ---
const ToastNotification = memo(({ visible, message, type, onClose, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // IOS-like Snappy Spring Animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: Platform.OS === 'ios' ? 60 : 30,
          useNativeDriver: true,
          damping: 12,
          mass: 0.8,
          stiffness: 150,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        })
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (visible && onClose) onClose();
    });
  }, [visible, onClose, translateY]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return { bg: ['#00b09b', '#96c93d'], icon: <CheckCircle2 size={20} color="#fff" strokeWidth={3} /> };
      case 'error':
        return { bg: ['#ff5f6d', '#ffc371'], icon: <XCircle size={20} color="#fff" strokeWidth={3} /> };
      case 'warning':
        return { bg: ['#f7971e', '#ffd200'], icon: <AlertCircle size={20} color="#fff" strokeWidth={3} /> };
      default:
        return { bg: [theme.colors.card, theme.colors.card], icon: <Sparkles size={20} color={theme.colors.primary} /> };
    }
  };

  const styleConfig = getStyles();

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }, { scale }] }]}>
      <LinearGradient
        colors={styleConfig.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContent}
      >
        <View style={styles.toastIconBox}>{styleConfig.icon}</View>
        <Text style={[styles.toastText, { color: '#fff', fontWeight: '700' }]}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.visible === nextProps.visible && prevProps.message === nextProps.message;
});

// --- 2. PREMIUM Input (Scale & Glow Interaction) ---
const PremiumInput = memo(({ label, value, onChangeText, placeholder, theme, isLast = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedFocus = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedFocus, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false, 
    }).start();
  }, [isFocused]);

  const borderColor = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary] 
  });

  const backgroundColor = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.card, theme.colors.card] // Keeping card bg but adding border glow
  });

  const scale = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02] // Subtle scale up on focus
  });

  return (
    <View style={styles.inputWrapper}>
      <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Animated.View style={[
        styles.inputContainer,
        { 
          borderColor, 
          backgroundColor,
          transform: [{ scale }], // Macro-interaction
          shadowColor: theme.colors.primary,
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: isFocused ? 5 : 0
        }
      ]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary + '80'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType={isLast ? "done" : "next"}
        />
        {value.length > 1 && (
          <Animated.View style={styles.validCheck}>
             <Check size={20} color={theme.colors.primary} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}, (prev, next) => prev.value === next.value && prev.theme === next.theme);

// --- 3. Main Screen ---
const EditNameScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Alert State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current; // For Avatar breathing

  // Initial Load & Pulse Effect
  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.exp) })
    ]).start();

    // Breathing Avatar Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    if (user?.name) {
      const nameParts = user.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const handleUpdateName = async () => {
    Keyboard.dismiss();

    // Tactile Button Press
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start();

    const fName = firstName.trim();
    const lName = lastName.trim();

    if (!fName) {
      showToast("First name cannot be empty.", "error");
      return;
    }
    if (fName.length < 2) {
      showToast("First name is too short.", "warning");
      return;
    }

    setLoading(true);
    const newName = `${fName} ${lName}`.trim();

    try {
      if (!updateProfile) throw new Error("Service unavailable");

      const success = await updateProfile({ name: newName });
      
      if (success) {
        showToast("Profile updated successfully!", "success");
        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        throw new Error("Update failed");
      }

    } catch (error) {
      const errorMessage = error.message === "Network request failed" 
        ? "Please check your internet connection." 
        : "Something went wrong. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* --- Background Ambient Blobs (Premium Feel) --- */}
      <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: isDark ? 0.08 : 0.05, top: -50, right: -50 }]} />
      <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: isDark ? 0.05 : 0.03, bottom: 100, left: -50, width: 250, height: 250 }]} />

      <ToastNotification 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={handleCloseToast}
        theme={theme}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f5' }]}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Identity</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <Animated.View 
            style={{ 
              flex: 1, 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              justifyContent: 'space-between' 
            }}
          >
            <View>
              {/* --- Hero Avatar Section --- */}
              <View style={styles.avatarSection}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient
                    colors={isDark ? [theme.colors.card, '#2c3e50'] : ['#ffffff', '#f0f9ff']}
                    style={[styles.iconContainer, { shadowColor: theme.colors.primary }]}
                    >
                    <User size={42} color={theme.colors.primary} />
                    <View style={[styles.editBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
                        <Edit3 size={12} color="#fff" />
                    </View>
                    </LinearGradient>
                </Animated.View>
                
                {/* Ripple Effect Ring */}
                <Animated.View style={[styles.rippleRing, { borderColor: theme.colors.primary, transform: [{ scale: pulseAnim }] }]} />
              </View>

              <View style={styles.textSection}>
                <Text style={[styles.title, { color: theme.colors.text }]}>How should we{"\n"}call you?</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Your name will be displayed on bookings and invoices for the shops.
                </Text>
              </View>

              <View style={styles.formContainer}>
                <PremiumInput 
                  label="FIRST NAME"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Rahul"
                  theme={theme}
                />
                <PremiumInput 
                  label="LAST NAME"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Sharma"
                  theme={theme}
                  isLast={true}
                />
              </View>
            </View>

            {/* --- Footer --- */}
            <View style={styles.footer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  activeOpacity={0.9}
                  style={styles.buttonShadow}
                  onPress={!loading ? handleUpdateName : null}
                >
                  <LinearGradient
                    colors={!loading ? [theme.colors.primary, theme.colors.primary + 'DD'] : ['#bdc3c7', '#bdc3c7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.updateButton}
                  >
                    <Text style={[styles.updateButtonText, { color: '#fff' }]}>
                      {loading ? "Updating Profile..." : "Confirm Changes"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  toastIconBox: {
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 6,
  },
  toastText: {
    fontSize: 14,
    flex: 1,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
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
    zIndex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    position: 'relative',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 35, // Squircle shape
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  rippleRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 45,
    borderWidth: 1.5,
    opacity: 0.2,
    top: -10,
    zIndex: 1,
  },
  editBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  textSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.7,
    maxWidth: '90%',
  },
  formContainer: {
    marginTop: 5,
  },
  inputWrapper: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
    opacity: 0.6,
  },
  inputContainer: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 10,
  },
  validCheck: {
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
    borderRadius: 12,
  },
  footer: {
    marginBottom: 20,
    paddingTop: 10,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  updateButton: {
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default EditNameScreen;