import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import SalonIllustration from '../components/illustrations/SalonIllustration';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top 55%: Illustration Area */}
      <View style={styles.topArea}>
        <SalonIllustration size={180} />
        
        {/* Floating Icons */}
        <View style={[styles.floatingIcon, { top: '15%', left: '20%' }]}>
          <Text style={{ fontSize: 18 }}>✂️</Text>
        </View>
        <View style={[styles.floatingIcon, { top: '25%', right: '15%' }]}>
          <Text style={{ fontSize: 18 }}>💳</Text>
        </View>
        <View style={[styles.floatingIcon, { bottom: '20%', left: '15%' }]}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <View style={[styles.floatingIcon, { bottom: '15%', right: '20%' }]}>
          <Text style={{ fontSize: 18 }}>🌟</Text>
        </View>
      </View>

      {/* Bottom 45%: Content */}
      <View style={styles.bottomArea}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.headline}>
            Premium Salon{"\n"}
            <View style={styles.inlinePill}>
              <Text style={styles.pillText}>→</Text>
            </View> Booking{"\n"}
            Made Easy
          </Text>
          
          <Text style={styles.subtitle}>
            Find, book & glam — all in one place
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.replace('Home')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => navigation.replace('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Let's Start</Text>
            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LIME_PRIMARY,
  },
  topArea: {
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomArea: {
    height: '45%',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  headline: {
    ...Typography.HERO,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.CHARCOAL,
  },
  inlinePill: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignSelf: 'center',
    marginBottom: -8, // Tweak for midline
  },
  pillText: {
    color: Colors.LIME_PRIMARY,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    ...Typography.FONT_MED,
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    ...Typography.FONT_BOLD,
    fontSize: 14,
    color: Colors.CHARCOAL,
    opacity: 0.6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  startButtonText: {
    ...Typography.FONT_BLACK,
    fontSize: 16,
    color: Colors.CHARCOAL,
    marginRight: 10,
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.CHARCOAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: Colors.LIME_PRIMARY,
    fontSize: 20,
    fontWeight: '900',
  }
});

export default SplashScreen;
