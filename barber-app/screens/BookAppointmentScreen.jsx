import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Scissors, Heart, Dog } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const BookAppointmentScreen = ({ navigation, route }) => {
  const { forFriend } = route.params || {};
  console.log('BookAppointmentScreen forFriend:', forFriend); // Debug log
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatePressIn = (scale) => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = (scale, callback) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 1, // Reduced friction for a snappier release
      tension: 100, // Increased tension for a faster snap back
      useNativeDriver: true,
    }).start(() => callback && callback());
  };

  return (
    <LinearGradient
      colors={theme.dark ? ['#1a1a1a', '#000000'] : ['#f0f0f0', '#ffffff']} // Subtle gradient for background
      style={styles.fullScreenGradient}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
        <View style={[styles.header, { backgroundColor: theme.colors.card, paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{forFriend ? 'Book Appointment for Friend' : 'Book Appointment'}</Text>
        </View>
        <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Who is this appointment for?</Text>
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scaleHim }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scaleHim)}
              onPressOut={() => animatePressOut(scaleHim)}
              onPress={() => navigation.navigate('BarberSearch', { forFriend })}
            >
              <LinearGradient
                colors={theme.dark ? ['#333', '#1a1a1a'] : ['#f0f0f0', '#e0e0e0']}
                style={[styles.optionCard, { borderColor: theme.colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Scissors size={30} color={theme.colors.primary} style={styles.optionIcon} />
                <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Him</Text>
                <Text style={[styles.optionCardSubtitle, { color: theme.colors.textSecondary }]}>Men's Grooming</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scaleHer }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scaleHer)}
              onPressOut={() => animatePressOut(scaleHer)}
              onPress={() => navigation.navigate('WomenSalonSearch', { forFriend })}
            >
              <LinearGradient
                colors={theme.dark ? ['#333', '#1a1a1a'] : ['#f0f0f0', '#e0e0e0']}
                style={[styles.optionCard, { borderColor: theme.colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Heart size={30} color={theme.colors.primary} style={styles.optionIcon} />
                <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Her</Text>
                <Text style={[styles.optionCardSubtitle, { color: theme.colors.textSecondary }]}>Women's Salon</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.optionCardWrapper, { transform: [{ scale: scalePet }] }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => animatePressIn(scalePet)}
              onPressOut={() => animatePressOut(scalePet)}
              onPress={() => navigation.navigate('PetCareSearch', { forFriend })}
            >
              <LinearGradient
                colors={theme.dark ? ['#333', '#1a1a1a'] : ['#f0f0f0', '#e0e0e0']}
                style={[styles.optionCard, { borderColor: theme.colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Dog size={30} color={theme.colors.primary} style={styles.optionIcon} />
                <Text style={[styles.optionCardTitle, { color: theme.colors.text }]}>Pet</Text>
                <Text style={[styles.optionCardSubtitle, { color: theme.colors.textSecondary }]}>Pet Care Services</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Choose an option above to find and book services.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionCardWrapper: {
    width: '90%',
    marginBottom: 20,
  },
  optionCard: {
    width: '100%',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  optionIcon: {
    marginBottom: 15,
  },
  optionCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  optionCardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoText: {
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
});

export default BookAppointmentScreen;
