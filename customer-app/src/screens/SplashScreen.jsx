import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { useAuth } from '../../contexts/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);
  const containerOpacity = new Animated.Value(1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true}),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true}),
    ]).start();

    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true}).start(() => {
        navigation.replace(user ? 'Home' : 'Login');
      });
    }, 1100);

    return () => clearTimeout(exitTimer);
  }, [user]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/Glosscut_1.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <View style={styles.logoRow}>
          <Text style={styles.logoGloss}>Gloss</Text>
          <Text style={styles.logoCut}>Cut</Text>
        </View>

        <Text style={styles.subHeadline}>India's Smartest Salon App</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_PAGE,
    justifyContent: 'center',
    alignItems: 'center'},
  centerContent: {
    alignItems: 'center'},
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 120,
    overflow: 'hidden',
    marginBottom: -20},
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline'},
  logoGloss: {
    ...Typography.DISPLAY_TITLE,
    fontSize: 52,
    lineHeight: 52 * 1.4},
  logoCut: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 52,
    letterSpacing: -0.02,
    color: Colors.TEXT_PRIMARY},
  subHeadline: {
    ...Typography.BODY,
    fontSize: 15,
    marginTop: 8,
    color: Colors.TEXT_SECONDARY}});

export default SplashScreen;
