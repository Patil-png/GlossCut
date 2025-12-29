import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing // Added for smoother custom easing
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, ArrowRight, Phone, ShieldCheck, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EditPhoneNumberScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // --- ANIMATION REFS ---
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;
  
  // --- CUSTOM ALERT STATE & REFS ---
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'success' });
  const alertTranslateY = useRef(new Animated.Value(-150)).current; // Start off-screen (top)
  const alertTimeoutRef = useRef(null);

  // --- INITIAL MOUNT ANIMATION ---
  useEffect(() => {
    if (user?.phone) {
      const number = user.phone.startsWith('+91') ? user.phone.slice(3) : user.phone;
      setPhoneNumber(number);
    }
    
    // Optimized: Parallel execution on UI thread
    Animated.parallel([
      Animated.timing(slideUp, { 
        toValue: 0, 
        duration: 500, 
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)) // Added nice bounce
      }),
      Animated.timing(fade, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      }),
    ]).start();
  }, [user]);

  // --- CUSTOM ALERT LOGIC ---
  const triggerAlert = useCallback((title, message, type = 'success') => {
    // Clear existing timeout if user triggers alert rapidly
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    setAlertConfig({ visible: true, title, message, type });

    // Slide In Animation
    Animated.spring(alertTranslateY, {
      toValue: 0, // Moves to marginTop: 40 position
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 120,
    }).start();

    // Auto Hide after 3 seconds
    alertTimeoutRef.current = setTimeout(() => {
      closeAlert();
    }, 3500);
  }, []);

  const closeAlert = useCallback(() => {
    Animated.timing(alertTranslateY, {
      toValue: -150, // Move back up off-screen
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic)
    }).start(() => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    });
  }, []);

  // --- MEMOIZED HANDLERS ---
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSupport = useCallback(() => {
    triggerAlert("Support", "Contacting support@gloss.cut...", "info");
  }, [triggerAlert]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handleUpdatePhoneNumber = useCallback(async () => {
    // Validation
    if (phoneNumber.length !== 10) {
      triggerAlert('Invalid Phone', 'Please enter a valid 10-digit number.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Safe execution to prevent crashes
      const success = await updateProfile({ phone: `+91${phoneNumber}` });

      if (success) {
        triggerAlert('Success', 'Phone number updated successfully!', 'success');
        // Small delay to let the user see the success message before leaving
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        triggerAlert('Update Failed', 'Could not update number. Try again.', 'error');
      }
    } catch (error) {
      triggerAlert('Network Error', 'Please check your internet connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, updateProfile, navigation, triggerAlert]);

  // --- MEMOIZED UI COMPONENTS ---

  const HeaderComponent = useMemo(() => (
    <View style={styles.navBar}>
      <TouchableOpacity
        onPress={handleGoBack}
        style={styles.backBtn}
        activeOpacity={0.7}
      >
        <ChevronLeft size={24} color="#000" />
      </TouchableOpacity>
    </View>
  ), [handleGoBack]);

  const IllustrationComponent = useMemo(() => (
    <View style={styles.illustrationArea}>
        <View style={[styles.circleBack, { backgroundColor: theme.colors.primary + '15' }]}>
            <View style={[styles.circleFront, { backgroundColor: theme.colors.primary + '25' }]}>
                <Phone size={48} color={theme.colors.primary} />
            </View>
        </View>
    </View>
  ), [theme.colors.primary]);

  // --- DYNAMIC STYLES CALCULATION ---
  const phoneInputContainerStyle = useMemo(() => ([
    styles.phoneInputContainer,
    {
        backgroundColor: isFocused ? '#fff' : '#F7F8F9',
        borderColor: isFocused ? theme.colors.primary : '#F7F8F9',
        borderWidth: 2
    }
  ]), [isFocused, theme.colors.primary]);

  const buttonStyle = useMemo(() => ([
    styles.submitBtn,
    { backgroundColor: theme.colors.primary, opacity: isLoading ? 0.7 : 1 }
  ]), [theme.colors.primary, isLoading]);

  // --- RENDER CUSTOM ALERT ---
  // This is rendered outside the main flow to float on top
  const renderCustomAlert = () => {
    if (!alertConfig.visible && alertTranslateY._value === -150) return null;

    const getAlertColor = () => {
        switch(alertConfig.type) {
            case 'error': return '#EF4444'; // Red
            case 'success': return '#10B981'; // Green
            case 'info': return '#3B82F6'; // Blue
            default: return '#10B981';
        }
    };

    const getAlertIcon = () => {
        switch(alertConfig.type) {
            case 'error': return <AlertTriangle size={24} color={getAlertColor()} fill={getAlertColor() + "20"} />;
            case 'success': return <CheckCircle size={24} color={getAlertColor()} fill={getAlertColor() + "20"} />;
            case 'info': return <Info size={24} color={getAlertColor()} fill={getAlertColor() + "20"} />;
            default: return <CheckCircle size={24} color={getAlertColor()} />;
        }
    };

    return (
        <Animated.View style={[styles.alertWrapper, { transform: [{ translateY: alertTranslateY }] }]}>
            <View style={[styles.alertContainer]}>
                <View style={styles.alertIconWrapper}>
                    {getAlertIcon()}
                </View>
                <View style={styles.alertTextContainer}>
                    <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alertConfig.message}</Text>
                </View>
                <TouchableOpacity onPress={closeAlert} style={styles.alertCloseBtn}>
                    <XCircle size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* RENDER ALERT AT TOP LEVEL - ABSOLUTE POSITIONED */}
      {renderCustomAlert()}

      <SafeAreaView style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}
        >
          {HeaderComponent}

          <View style={styles.contentContainer}>
            {IllustrationComponent}

            <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }] }}>
                
                <View>
                    <Text style={styles.heading}>Update Phone Number</Text>
                    <Text style={styles.subHeading}>
                      We'll send a verification code to confirm your number.
                    </Text>
                </View>

                {/* --- PHONE INPUT --- */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={phoneInputContainerStyle}>
                        <View style={styles.countryCodeContainer}>
                            <Text style={styles.flag}>🇮🇳</Text>
                            <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput
                            style={styles.phoneNumberInput}
                            value={phoneNumber}
                            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                            placeholder="98765 43210"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad" // Optimized keyboard type
                            maxLength={10}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            cursorColor={theme.colors.primary}
                        />
                    </View>
                </View>

                {/* --- MAIN BUTTON --- */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleUpdatePhoneNumber}
                    style={buttonStyle}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.btnText}>Update Phone Number</Text>
                            <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpLink} onPress={handleSupport}>
                    <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>Having trouble?</Text>
                </TouchableOpacity>

            </Animated.View>
          </View>

          {/* --- FOOTER BADGE --- */}
          <View style={styles.footer}>
             <ShieldCheck size={16} color="#10B981" />
             <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flexOne: {
    flex: 1,
  },
  // --- CUSTOM ALERT STYLES ---
  alertWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it is above everything
    alignItems: 'center',
    marginTop: 40, // Specific Requirement
  },
  alertContainer: {
    width: width - 32, // Responsive width
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // Modern shadow similar to Blinkit/Zomato
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  alertIconWrapper: {
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  alertCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // --- EXISTING STYLES ---
  navBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  backBtn: {
    marginTop: 26,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  illustrationArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circleBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleFront: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputContainer: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 17,
    color: '#111827',
    fontWeight: '600',
    height: '100%',
  },
  submitBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  helpLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  }
});

export default EditPhoneNumberScreen;