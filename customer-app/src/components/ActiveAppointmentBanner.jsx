import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, Key, ArrowRight, Calendar } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);
const normalize = (size) => Math.round(size * scale);

const formatOrdinal = (n) => {
  if (!n || n === 0) return '---';
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ActiveAppointmentBanner = ({ appointment }) => {
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!appointment) return null;

  const realPosition = appointment.queuePosition;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate('TrackQueue', { trackingId: appointment.trackingId });
        }}
        style={styles.bannerCard}
      >
        {/* Glow indicator at the left border */}
        <View style={styles.glowLine} />

        <View style={styles.mainContent}>
          {/* Left Info Column: Shop & Time */}
          <View style={styles.leftCol}>
            <View style={styles.shopRow}>
              <View style={styles.iconWrapper}>
                <Calendar size={normalize(14)} color="#C8FF00" strokeWidth={2.5} />
              </View>
              <View style={styles.shopTextContainer}>
                <Text style={styles.appointmentBadgeText}>TODAY'S APPOINTMENT</Text>
                <Text style={styles.shopName} numberOfLines={1}>
                  {appointment.shopName}
                </Text>
              </View>
            </View>

            <View style={styles.timeBadgeContainer}>
              <Clock size={normalize(11)} color="#A1A1AA" />
              <Text style={styles.timeText}>
                {appointment.time || 'Scheduled'}
              </Text>
            </View>
          </View>

          {/* Right Info Column: Queue Position & Access OTP */}
          <View style={styles.rightCol}>
            {/* Live Queue Position Badge */}
            <View style={styles.statusBox}>
              <View style={styles.liveIndicatorRow}>
                <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                <Text style={styles.liveLabel}>LIVE QUEUE</Text>
              </View>
              <Text style={styles.queueValue}>
                {!realPosition ? 'SYNCING...' : realPosition === 1 ? 'NEXT UP' : `${formatOrdinal(realPosition)}`}
              </Text>
            </View>

            {/* OTP Access Box */}
            <View style={styles.otpBox}>
              <Key size={normalize(11)} color="#FCD34D" style={{ marginRight: 4 }} />
              <Text style={styles.otpValueText}>{appointment.otp}</Text>
            </View>
          </View>
        </View>

        {/* Interactive Action Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Tap to open real-time tracking</Text>
          <ArrowRight size={normalize(12)} color="#C8FF00" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: normalize(16),
    marginTop: normalize(8),
    marginBottom: normalize(12),
    width: '100%',
  },
  bannerCard: {
    backgroundColor: '#121214',
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  glowLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#C8FF00',
  },
  mainContent: {
    flexDirection: 'row',
    padding: normalize(16),
    paddingLeft: normalize(20), // offset for the left indicator bar
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1.2,
    gap: normalize(8),
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  iconWrapper: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(8),
    backgroundColor: 'rgba(200, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 255, 0, 0.2)',
  },
  shopTextContainer: {
    flex: 1,
  },
  appointmentBadgeText: {
    fontSize: normalize(8),
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  shopName: {
    fontSize: normalize(14),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: normalize(2),
    letterSpacing: -0.3,
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(6),
    alignSelf: 'flex-start',
    gap: normalize(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeText: {
    fontSize: normalize(10),
    fontWeight: '700',
    color: '#E4E4E7',
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: normalize(8),
  },
  statusBox: {
    alignItems: 'flex-end',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    marginBottom: normalize(2),
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8FF00',
  },
  liveLabel: {
    fontSize: normalize(8),
    fontWeight: '800',
    color: '#C8FF00',
    letterSpacing: 0.5,
  },
  queueValue: {
    fontSize: normalize(13),
    fontWeight: '950',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  otpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.2)',
  },
  otpValueText: {
    fontSize: normalize(11),
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    paddingLeft: normalize(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: normalize(9),
    fontWeight: '600',
    color: '#A1A1AA',
  },
});

export default ActiveAppointmentBanner;
