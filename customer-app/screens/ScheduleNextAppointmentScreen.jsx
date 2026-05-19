import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Animated,
  TextInput,
  Dimensions,
  Easing,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Bell, Calendar as CalendarIcon, Clock, ChevronRight, FileText, Sparkles, Zap, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

export default function ScheduleNextAppointmentScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const now = new Date();
  const defaultDate = new Date();
  defaultDate.setDate(now.getDate() + 10);
  
  const [selectedDay, setSelectedDay] = useState(defaultDate.getDate());
  const [note, setNote] = useState(`book an appoinment on date ${defaultDate.getDate()} ${monthNames[defaultDate.getMonth()]} ${defaultDate.getFullYear()} as remainder`);
  
  const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
  const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());
  const [direction, setDirection] = useState('next');
  
  const [savedReminders, setSavedReminders] = useState([]);
  
  // Animation values
  const calendarFadeAnim = useRef(new Animated.Value(1)).current;
  const calendarSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Entrance Animations
  const itemAnims = useRef([...Array(7)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(7)].map(() => new Animated.Value(0))).current;
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  useEffect(() => {
    // Android Channel Setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: theme.colors.primary,
      });
    }

    // Define Category for Action Buttons
    Notifications.setNotificationCategoryAsync('reminder_actions', [
      {
        identifier: 'book_now',
        buttonTitle: 'Book Now',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // Handle Action Response
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionIdentifier = response.actionIdentifier;
      if (actionIdentifier === 'book_now') {
        navigation.navigate('BarberSearch');
      }
    });

    // Load saved reminders
    const loadReminders = async () => {
      if (user) {
        const key = `reminders_${user._id}`;
        const existing = await AsyncStorage.getItem(key);
        if (existing) {
          const allReminders = JSON.parse(existing);
          const now = new Date();
          
          // Filter out reminders where the date is in the past
          const validReminders = allReminders.filter(rem => {
            // Set time to end of day to keep today's reminders visible until midnight
            const remDate = new Date(rem.year, rem.month, rem.day, 23, 59, 59);
            return remDate >= now;
          });
          
          setSavedReminders(validReminders);
          
          // Clean up storage by removing expired ones
          if (validReminders.length !== allReminders.length) {
            await AsyncStorage.setItem(key, JSON.stringify(validReminders));
          }
        }
      }
    };
    loadReminders();
    
    // Staggered Entrance Animation
    const animations = itemAnims.map((anim, i) => 
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(itemFades[i], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );
    Animated.stagger(100, animations).start();

    return () => subscription.remove();
  }, [user]);
  
  useEffect(() => {
    // Run animation when month changes
    const startX = direction === 'next' ? 30 : -30;
    calendarSlideAnim.setValue(startX);
    calendarFadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(calendarFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(calendarSlideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentMonth, currentYear]);
  
  const handlePrevMonth = () => {
    setDirection('prev');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };
  
  const handleNextMonth = () => {
    setDirection('next');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };
  
  const scheduleBlinkitNotifications = async (day, month, year, noteText) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Please enable notifications to receive reminders.");
      return;
    }

    const schedules = [
      { hour: 0, minute: 1, title: "✂️ Midnight Reminder!", body: "Your grooming session is booked for today! Get ready to look fresh. 🔥" },
      { hour: 7, minute: 0, title: "🌅 Rise & Shine!", body: "Don't forget your scheduled grooming today. A fresh look awaits! ✂️" },
      { hour: 11, minute: 59, title: "🕛 Midday Check-in!", body: "Ready for your look upgrade? Your session is today. Tap to view! 💇‍♂️" },
      { hour: 17, minute: 0, title: "🌆 Evening Reminder!", body: "Your grooming appointment is waiting for you. Don't miss it! ✨" },
      { hour: 19, minute: 0, title: "🌙 Last Call!", body: "Time to get fresh and clean! Final reminder for today. 🧼" }
    ];

    for (const item of schedules) {
      const triggerDate = new Date(year, month, day, item.hour, item.minute);
      
      if (triggerDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `GlossCut: ${item.title}`,
            body: item.body,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'reminder_actions',
            largeIcon: Image.resolveAssetSource(require('../assets/ic_stat_notification_icon.png')).uri,
          },
          trigger: {
            date: triggerDate,
            channelId: 'reminders',
          },
        });
      }
    }
  };

  const handleSaveReminder = async () => {
    if (!selectedDay) {
      Alert.alert("Error", "Please select a date first.");
      return;
    }
    
    if (!user) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }
    
    const reminderData = {
      day: selectedDay,
      month: currentMonth,
      year: currentYear,
      note: note,
      timestamp: Date.now()
    };
    
    try {
      const key = `reminders_${user._id}`;
      const existing = await AsyncStorage.getItem(key);
      const reminders = existing ? JSON.parse(existing) : [];
      reminders.push(reminderData);
      await AsyncStorage.setItem(key, JSON.stringify(reminders));
      
      // Schedule the 5 notifications
      await scheduleBlinkitNotifications(selectedDay, currentMonth, currentYear, note);
      
      Alert.alert("Success", `Reminder set for ${monthNames[currentMonth]} ${selectedDay}, ${currentYear}!`);
      setSavedReminders(reminders);
    } catch (error) {
      console.error("Error saving reminder:", error);
      Alert.alert("Error", "Failed to save reminder.");
    }
  };
  
  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={[styles.headerOuterContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
          >
            <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Next</Text>
          <View style={{ width: normalize(40) }} />
        </View>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(20) }]}
      >
        <View style={styles.centeredContentWrapper}>
          
          {/* 1. Premium Icon Composition */}
          <Animated.View style={[styles.illustrationContainer, animatedStyle(0)]}>
            <View style={[styles.iconCircleLarge, { backgroundColor: theme.colors.primary + "1A" }]}>
              <CalendarIcon size={normalize(40)} color={theme.colors.primary} strokeWidth={2} />
              <View style={[styles.floatingDot, { top: 10, left: 10, width: 8, height: 8, backgroundColor: theme.colors.primary }]} />
              <View style={[styles.floatingDot, { bottom: 15, right: 10, width: 6, height: 6, backgroundColor: "#38BDF8" }]} />
              <View style={[styles.floatingDot, { top: 30, right: 5, width: 10, height: 10, backgroundColor: "#FBBF24" }]} />
            </View>
          </Animated.View>
          
          {/* 2. Title Section */}
          <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
            <Text style={styles.title}>Plan Your Next Visit</Text>
            <Text style={styles.subtitle}>
              Select a date and set a reminder so you never miss your grooming session.
            </Text>
          </Animated.View>
          
          {/* 3. Calendar Card */}
          <Animated.View style={[styles.usageContainer, animatedStyle(2)]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                <ChevronLeft size={20} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                <ChevronRight size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dayNamesRow}>
              {dayNames.map((day, index) => (
                <Text key={index} style={styles.dayNameText}>{day}</Text>
              ))}
            </View>
            
            <Animated.View style={[
              styles.daysGrid,
              {
                opacity: calendarFadeAnim,
                transform: [{ translateX: calendarSlideAnim }]
              }
            ]}>
              {calendarDays.map((day, index) => {
                const isSelected = day === selectedDay;
                const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                      isToday && !isSelected && { borderColor: theme.colors.primary, borderWidth: 1 },
                      !day && { backgroundColor: "transparent" }
                    ]}
                    onPress={() => {
                      if (day) {
                        setSelectedDay(day);
                        setNote(`book an appoinment on date ${day} ${monthNames[currentMonth]} ${currentYear} as remainder`);
                      }
                    }}
                    disabled={!day}
                  >
                    {day && (
                      <Text style={[
                        styles.dayCellText,
                        isSelected && { color: "#FFFFFF", fontWeight: "800" },
                        isToday && !isSelected && { color: theme.colors.primary, fontWeight: "800" }
                      ]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </Animated.View>
          
          {/* 5. Note Card */}
          <Animated.View style={[styles.noteContainer, animatedStyle(4)]}>
            <View style={styles.noteHeader}>
              <FileText size={16} color="#166534" strokeWidth={2.5} />
              <Text style={styles.noteTitle}>SCHEDULE NOTE</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="E.g., Remind me to get a fade cut..."
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            {/* Action Button inside Note Card */}
            {selectedDay && (
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, marginTop: normalize(16) }]}
                onPress={handleSaveReminder}
              >
                <Text style={styles.btnText}>Save Reminder</Text>
                <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </Animated.View>
          
          {/* New Section: Saved Reminders */}
          {savedReminders.length > 0 && (
            <Animated.View style={[styles.remindersContainer, animatedStyle(5)]}>
              <Text style={styles.sectionLabel}>YOUR SAVED REMINDERS</Text>
              {savedReminders.map((rem, index) => (
                <View key={index} style={styles.reminderListItem}>
                  <View style={styles.iconCircle}>
                    <CalendarIcon size={normalize(14)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.usageTextContent}>
                    <Text style={styles.usageTitle}>{rem.day} {monthNames[rem.month]} {rem.year}</Text>
                    <Text style={styles.usageDesc}>{rem.note}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* 4. Usage Benefits Section (Moved to bottom) */}
          <Animated.View style={[styles.usageContainer, animatedStyle(3), { marginTop: normalize(10) }]}>
            <Text style={styles.sectionLabel}>WHY SCHEDULE AHEAD?</Text>
            
            <View style={styles.usageItem}>
              <View style={styles.iconCircle}>
                <Zap size={normalize(14)} color={theme.colors.primary} />
              </View>
              <View style={styles.usageTextContent}>
                <Text style={styles.usageTitle}>Priority Queue</Text>
                <Text style={styles.usageDesc}>Get notified to book before the weekend rush.</Text>
              </View>
            </View>
            
            <View style={styles.usageItem}>
              <View style={styles.iconCircle}>
                <Sparkles size={normalize(14)} color={theme.colors.primary} />
              </View>
              <View style={styles.usageTextContent}>
                <Text style={styles.usageTitle}>Consistent Style</Text>
                <Text style={styles.usageDesc}>Keep your look fresh by sticking to a routine.</Text>
              </View>
            </View>
          </Animated.View>
          
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  headerOuterContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    maxWidth: 500,
    width: "100%",
    alignSelf: "center"
  },
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  scrollContent: {
    paddingTop: normalize(10),
    width: "100%"
  },
  centeredContentWrapper: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: normalize(24)
  },
  illustrationContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: normalize(15)
  },
  iconCircleLarge: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  floatingDot: {
    position: "absolute",
    borderRadius: 50
  },
  textContainer: {
    marginBottom: normalize(20)
  },
  title: {
    fontSize: normalize(22),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
    marginBottom: normalize(8),
    textAlign: "center"
  },
  subtitle: {
    fontSize: normalize(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: normalize(18),
    fontWeight: "500",
    paddingHorizontal: normalize(10)
  },
  usageContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: normalize(20),
    padding: normalize(20),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  remindersContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: normalize(16),
    padding: normalize(18),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  sectionLabel: {
    fontSize: normalize(10),
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: normalize(14)
  },
  usageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(14),
    marginBottom: normalize(16)
  },
  iconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageTextContent: {
    flex: 1
  },
  usageTitle: {
    fontSize: normalize(13),
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: normalize(2)
  },
  usageDesc: {
    fontSize: normalize(11),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: normalize(14)
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(16)
  },
  monthTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A"
  },
  monthNavBtn: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  dayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: normalize(10)
  },
  dayNameText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#64748B"
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: "14.28%",
    height: normalize(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: normalize(10),
    marginBottom: normalize(4)
  },
  dayCellText: {
    fontSize: normalize(14),
    fontWeight: "500",
    color: "#0F172A"
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: normalize(20),
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    marginBottom: normalize(8)
  },
  noteTitle: {
    fontSize: normalize(11),
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: normalize(12),
    padding: normalize(12),
    fontSize: normalize(13),
    fontWeight: "500",
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    minHeight: normalize(80),
    textAlignVertical: "top"
  },
  actionSection: {
    marginTop: normalize(10),
    marginBottom: normalize(20)
  },
  primaryBtn: {
    height: normalize(58),
    borderRadius: normalize(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(12),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  btnText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.2
  },
  reminderListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(14),
    marginBottom: normalize(12),
    backgroundColor: "#FFFFFF",
    padding: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "#E2E8F0"
  }
});
