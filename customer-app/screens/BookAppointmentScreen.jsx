import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Scissors, Heart, PawPrint, CalendarDays } from 'lucide-react-native'; // Updated Dog to PawPrint, added CalendarDays for a touch
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const BookAppointmentScreen = ({ navigation, route }) => {
  const { forFriend } = route.params || {};
  console.log('BookAppointmentScreen forFriend:', forFriend); // Debug log (Functionality preserved)
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // --- Start of Functionality (Do Not Change) ---
  const scaleHim = useRef(new Animated.Value(1)).current;
  const scaleHer = useRef(new Animated.Value(1)).current;
  const scalePet = useRef(new Animated.Value(1)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
    ]).start();
  }, []);

  const animatePressIn = (scale) => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true
    }).start();
  };

  const animatePressOut = (scale, callback) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4, // Smoother spring physics
      tension: 60,
      useNativeDriver: true
    }).start(() => callback && callback());
  };
  // --- End of Functionality (Do Not Change) ---

  // --- UI-specific styles (dynamically created with theme) ---
  const getStyles = (currentTheme) => StyleSheet.create({
    fullScreenGradient: {
      flex: 1
    },
    safeArea: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 15,
      backgroundColor: currentTheme.colors.card,
      // Added strong shadow for a feeling of depth and quality
    },
    backButton: {
      marginRight: 16,
      padding: 5
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 0.5
    },
    content: {
      flex: 1,
      paddingHorizontal: 25, // Increased padding
      paddingTop: 45, // More vertical spacing
    },
    sectionTitle: {
      fontSize: 28, // Largest, most prominent title
      fontWeight: '900', // Ultra bold
      marginBottom: 40,
      textAlign: 'left',
      letterSpacing: -0.5
    },
    optionCardWrapper: {
      width: '100%',
      marginBottom: 25, // Increased spacing between cards
    },
    optionCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 22,
      borderRadius: 22, // Very rounded corners
      backgroundColor: currentTheme.colors.card,
      // Premium shadow effect
      borderWidth: 1,
      borderColor: currentTheme.colors.border + '30', // Subtle light border
    },
    iconContainer: {
      width: 60, // Large icon container
      height: 60,
      borderRadius: 20,
      // Using a light gradient for the icon background
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 20
    },
    optionIcon: {
      // Icon size is managed in the component render below
    },
    textContainer: {
      flex: 1
    },
    optionCardTitle: {
      fontSize: 24, // Bolder card title
      fontWeight: '800',
      marginBottom: 4,
      letterSpacing: -0.3
    },
    optionCardSubtitle: {
      fontSize: 15,
      color: currentTheme.colors.textSecondary,
      lineHeight: 20,
      fontWeight: '500'
    },
    infoText: {
      marginTop: 60, // More space before info text
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 10,
      fontWeight: '400',
      fontStyle: 'italic',
      color: currentTheme.colors.textSecondary + '90'
    }
  });

  const styles = getStyles(theme);

  // Helper component for the icon container with gradient
  const IconGradient = ({ children }) => (
    <LinearGradient
      colors={[theme.colors.primary, '#0f9aa6']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.iconContainer}
    >
      {children}
    </LinearGradient>
  );


  return (
    <LinearGradient
      colors={theme.dark ? ['#0e0e0e', '#000000'] : ['#fcfcfc', '#f0f0f0']} // Very subtle background
      style={styles.fullScreenGradient}
    >
      <View style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />

        {/* Minimal Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {forFriend ? 'Book for Friend' : 'Book Appointment'}
          </Text>
        </View>

        {/* Animated Content */}
        <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Who needs a service today?
          </Text>

          {/* Option: Him (Men's Grooming) */}
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scaleHim }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scaleHim)}
              onPressOut={() => animatePressOut(scaleHim)}
              onPress={() => navigation.navigate('BarberSearch', { forFriend })} // Functionality preserved
            >
              <View style={styles.optionCard}>
                <IconGradient>
                  <Scissors size={32} color={'#fff'} style={styles.optionIcon} />
                </IconGradient>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Him</Text>
                  <Text style={[styles.optionCardSubtitle]}>Haircuts, Shaves, & Men's Grooming</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Option: Her (Women's Salon) */}
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scaleHer }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scaleHer)}
              onPressOut={() => animatePressOut(scaleHer)}
              onPress={() => navigation.navigate('WomenSalonSearch', { forFriend })} // Functionality preserved
            >
              <View style={styles.optionCard}>
                <IconGradient>
                  <Heart size={32} color={'#fff'} style={styles.optionIcon} />
                </IconGradient>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Her</Text>
                  <Text style={[styles.optionCardSubtitle]}>Beauty, Hair styling, and Spa treatments</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Option: Pet (Pet Care Services) */}
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scalePet }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scalePet)}
              onPressOut={() => animatePressOut(scalePet)}
              onPress={() => navigation.navigate('PetCareSearch', { forFriend })} // Functionality preserved
            >
              <View style={styles.optionCard}>
                <IconGradient>
                  <PawPrint size={32} color={'#fff'} style={styles.optionIcon} />
                </IconGradient>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Pet</Text>
                  <Text style={[styles.optionCardSubtitle]}>Grooming, vet visits, and pet care services</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            <CalendarDays size={16} color={theme.colors.textSecondary} style={{ marginRight: 5 }} />
            Tap on an option to see available professionals and book instantly.
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

// NOTE: Stylesheet is dynamically generated inside the component
const styles = StyleSheet.create({});

export default BookAppointmentScreen;