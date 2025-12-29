import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Switch,
  LayoutAnimation,
  UIManager,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Clock, Save, Copy, ChevronDown, ChevronUp, Calendar, CheckCircle, AlertCircle, WifiOff } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

/**
 * Custom Animated Toast Component
 * Slides down from the top of the screen
 */
const ToastNotification = ({ message, type, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0, // Slide down
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150, // Slide up off screen
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  if (!visible && translateY._value === -100) return null;

  const bgColor = type === 'success' ? '#10B981' : '#EF4444'; // Green or Red
  const Icon = type === 'success' ? CheckCircle : (type === 'network' ? WifiOff : AlertCircle);

  return (
    <Animated.View 
      style={[
        styles.toastContainer, 
        { transform: [{ translateY }], backgroundColor: bgColor }
      ]}
    >
      <SafeAreaView>
        <View style={styles.toastContent}>
          <Icon color="#fff" size={24} />
          <Text style={styles.toastText}>{message}</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const EditOperatingHoursScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  // Safe destructuring with fallback to prevent crashes if context is missing
  const { user } = useAuth() || {}; 
  
  // --- STATE ---
  const [operatingHours, setOperatingHours] = useState(() => {
    // Safe initialization
    const defaultHours = {};
    DAYS_OF_WEEK.forEach(day => {
      defaultHours[day.key] = { open: '', close: '' };
    });
    return route.params?.currentOperatingHours || defaultHours;
  });

  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentEditing, setCurrentEditing] = useState({ day: null, field: null });
  const [tempTime, setTempTime] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState(null);
  
  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // --- EFFECT ---
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (route.params?.currentOperatingHours) {
      setOperatingHours(route.params.currentOperatingHours);
    }
  }, [route.params]);

  // --- HELPERS ---
  
  const showNotification = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const toggleDayExpansion = (dayKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(expandedDay === dayKey ? null : dayKey);
  };

  const updateDayHours = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day] || { open: '', close: '' }, // Crash prevention
        [field]: value
      }
    }));
  };

  const validateTime = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return time === '' || timeRegex.test(time);
  };

  // --- ACTIONS ---

  const handleSave = async () => {
    // Validation
    for (const day of DAYS_OF_WEEK) {
      const dayHours = operatingHours[day.key];
      if (dayHours?.open && !validateTime(dayHours.open)) {
        showNotification(`Invalid time for ${day.label}. Use HH:MM`, 'error');
        return;
      }
      if (dayHours?.close && !validateTime(dayHours.close)) {
        showNotification(`Invalid closing time for ${day.label}`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Network Check Mock (Axios usually handles this, but good to catch explicitly)
      // If we had NetInfo we would use it here. 
      // Instead we rely on the try/catch to catch network failures gracefully.

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        { operatingHours },
        { 
          headers: { 'x-auth-token': token },
          timeout: 10000 // 10s timeout to prevent hanging
        }
      );

      showNotification('Schedule updated successfully!', 'success');
      setTimeout(() => navigation.goBack(), 1500);

    } catch (error) {
      console.error('Error updating operating hours:', error);
      
      // Smart Error Messages
      let msg = 'Failed to update. Please try again.';
      let type = 'error';

      if (error.code === 'ECONNABORTED') {
        msg = 'Request timed out. Check your internet.';
        type = 'network';
      } else if (!error.response) {
        msg = 'Network error. Are you online?';
        type = 'network';
      } else if (error.response?.data?.msg) {
        msg = error.response.data.msg;
      }

      showNotification(msg, type);
    } finally {
      setLoading(false);
    }
  };

  const copyToAllDays = (sourceDay) => {
    const sourceHours = operatingHours[sourceDay];
    if (!sourceHours?.open || !sourceHours?.close) {
      showNotification('Set valid hours before copying.', 'error');
      return;
    }
    
    // We remove the Alert.alert here for a smoother UX, just do it and show a success toast
    const newHours = { ...operatingHours };
    DAYS_OF_WEEK.forEach(day => {
      newHours[day.key] = { ...sourceHours };
    });
    setOperatingHours(newHours);
    showNotification(`Copied ${sourceHours.open}-${sourceHours.close} to all days`, 'success');
  };

  const toggleOpenStatus = (dayKey, currentValue) => {
    if (currentValue) {
      setOperatingHours(prev => ({
        ...prev,
        [dayKey]: { open: '', close: '' }
      }));
    } else {
      setOperatingHours(prev => ({
        ...prev,
        [dayKey]: { open: '09:00', close: '21:00' }
      }));
    }
  };

  const showTimePickerFor = (day, field) => {
    const currentTime = operatingHours[day]?.[field];
    if (currentTime) {
      const [hours, minutes] = currentTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0, 0);
      setTempTime(date);
    } else {
      setTempTime(new Date());
    }
    setCurrentEditing({ day, field });
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && currentEditing.day && currentEditing.field) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateDayHours(currentEditing.day, currentEditing.field, timeString);
    }
    setCurrentEditing({ day: null, field: null });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />
      
      {/* --- TOAST NOTIFICATION LAYER --- */}
      <ToastNotification 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />

      {/* --- PREMIUM HEADER --- */}
      <SafeAreaView style={{ backgroundColor: theme.colors.background, zIndex: 1 }}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Schedule</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Shop Availability</Text>
          </View>
          <View style={{ width: 40 }} /> 
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
      >
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16 }}>
          
          <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '15' }]}>
            <Calendar size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.infoText, { color: theme.colors.primary }]}>
              Manage your shop timings here. Turn off days when you are closed.
            </Text>
          </View>

          <View style={styles.listContainer}>
            {DAYS_OF_WEEK.map((day) => {
              // Safe access
              const currentDayHours = operatingHours[day.key] || { open: '', close: '' };
              const isOpen = currentDayHours.open !== '' && currentDayHours.close !== '';
              const isExpanded = expandedDay === day.key;

              return (
                <View 
                  key={day.key} 
                  style={[
                    styles.dayCard, 
                    { 
                      backgroundColor: theme.colors.card,
                      borderColor: isExpanded ? theme.colors.primary : 'transparent',
                      borderWidth: isExpanded ? 1.5 : 0,
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.dayHeader} 
                    activeOpacity={0.7}
                    onPress={() => toggleDayExpansion(day.key)}
                  >
                    <View style={styles.dayLabelContainer}>
                      <View style={[styles.dayIconBubble, { backgroundColor: isOpen ? theme.colors.primary + '20' : theme.colors.border }]}>
                        <Text style={[styles.dayShortText, { color: isOpen ? theme.colors.primary : theme.colors.textSecondary }]}>
                          {day.short}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.dayLabel, { color: theme.colors.text }]}>{day.label}</Text>
                        <Text style={[styles.statusLabel, { color: isOpen ? theme.colors.success : theme.colors.textSecondary }]}>
                          {isOpen ? `${currentDayHours.open} - ${currentDayHours.close}` : 'Closed'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.headerRight}>
                      <Switch
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        thumbColor={'#fff'}
                        ios_backgroundColor={theme.colors.border}
                        onValueChange={() => toggleOpenStatus(day.key, isOpen)}
                        value={isOpen}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                      {isExpanded ? 
                        <ChevronUp size={20} color={theme.colors.textSecondary} style={{marginLeft: 8}}/> : 
                        <ChevronDown size={20} color={theme.colors.textSecondary} style={{marginLeft: 8}}/>
                      }
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.divider} />
                      
                      {isOpen ? (
                        <>
                          <View style={styles.timeSelectorRow}>
                            <TouchableOpacity 
                              style={[styles.timeInputBox, { backgroundColor: theme.colors.background }]}
                              onPress={() => showTimePickerFor(day.key, 'open')}
                            >
                                <Text style={[styles.timeLabelSmall, { color: theme.colors.textSecondary }]}>OPEN</Text>
                                <View style={styles.timeValueRow}>
                                    <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                                        {currentDayHours.open || '--:--'}
                                    </Text>
                                    <Clock size={14} color={theme.colors.primary} />
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.dash, { backgroundColor: theme.colors.border }]} />

                            <TouchableOpacity 
                              style={[styles.timeInputBox, { backgroundColor: theme.colors.background }]}
                              onPress={() => showTimePickerFor(day.key, 'close')}
                            >
                                <Text style={[styles.timeLabelSmall, { color: theme.colors.textSecondary }]}>CLOSE</Text>
                                <View style={styles.timeValueRow}>
                                    <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                                        {currentDayHours.close || '--:--'}
                                    </Text>
                                    <Clock size={14} color={theme.colors.primary} />
                                </View>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity 
                            style={[styles.copyButton, { borderColor: theme.colors.border }]}
                            onPress={() => copyToAllDays(day.key)}
                          >
                            <Copy size={16} color={theme.colors.textSecondary} />
                            <Text style={[styles.copyText, { color: theme.colors.textSecondary }]}>Apply to all days</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={styles.closedStateContainer}>
                          <Text style={[styles.closedStateText, { color: theme.colors.textSecondary }]}>
                            Closed on {day.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* --- STICKY BOTTOM BAR --- */}
      <View style={[styles.footerContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveFab, { backgroundColor: theme.colors.primary, opacity: loading ? 0.8 : 1 }]}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveFabText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + 10 : 12, // Adaptive padding
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollContent: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  dayCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  dayLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dayIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayShortText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  timeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInputBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  timeLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  timeValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dash: {
    width: 12,
    height: 2,
    marginHorizontal: 12,
    opacity: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closedStateContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedStateText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  footerContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  saveFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveFabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditOperatingHoursScreen;