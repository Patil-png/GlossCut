import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);
  const containerOpacity = new Animated.Value(1);

  useEffect(() => {
    // 1. Start Entrance Animation (Super fast)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Schedule Exit Animation for the Blinkit-style fade out
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400, // Smooth fade out over 400ms
        useNativeDriver: true,
      }).start(() => {
        // 3. Complete navigation EXACTLY at the 1.5s mark (1100ms + 400ms)
        navigation.replace(user ? 'Home' : 'Login');
      });
    }, 1100); 

    return () => clearTimeout(exitTimer);
  }, [user]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* IMAGE LOGO */}
        <Image
          source={require('../../assets/Glosscut_1.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* LOGO TEXT */}
        <View style={styles.logoRow}>
          <Text style={styles.logoGloss}>Gloss</Text>
          <Text style={styles.logoCut}>Cut</Text>
        </View>

        {/* SUB HEADLINE */}
        <Text style={styles.subHeadline}>
          India's Smartest Salon App
        </Text>
    </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LIME_PRIMARY, // Signature warm yellow/lime background
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 120, // Perfect circle
    overflow: 'hidden',
    marginBottom: -20,// Negative margin to pull the text up close, or 0 if -10 is too tight
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoGloss: {
    fontFamily: 'Inter_900Black', // Extremely bold, like Blinkit
    fontSize: 58,
    color: '#000000',
    letterSpacing: -2.5,
  },
  logoCut: {
    fontFamily: 'Inter_900Black',
    fontSize: 58,
    color: '#10B981', // Emerald green representing the "it" equivalent
    letterSpacing: -2.5,
  },
  subHeadline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: 'rgba(0,0,0,0.8)',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 3, // Wide tracking like "AN ETERNAL COMPANY"
  }
});

export default SplashScreen;
