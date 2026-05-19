import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, Zap, MoveRight, Navigation, Clock } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const resScale = (size) => (SCREEN_WIDTH / 375) * size;
const mScale = (size, factor = 0.5) => size + (resScale(size) - size) * factor;

const formatOrdinal = (n) => {
  if (!n || n === 0) return '---';
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ActiveAppointmentBanner = ({ appointment }) => {
  const navigation = useNavigation();
  const [protocolIdx, setProtocolIdx] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const PROTOCOLS = ["ON TIME", "PROCEED", "READY", "BOARDING"];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      Animated.timing(slideAnim, { toValue: -mScale(14), duration: 500, useNativeDriver: true }).start(() => {
        setProtocolIdx((prev) => (prev + 1) % PROTOCOLS.length);
        slideAnim.setValue(mScale(14));
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  if (!appointment) return null;

  const realPosition = appointment.queuePosition;

  return (
    <View style={styles.masterWrapper}>
      {/* GUARANTEED SYNCED SUSPENSION SYSTEM */}
      <View style={styles.suspensionSystem}>
        <View style={styles.ropeGroup}>
          <View style={styles.ropeLine} />
          <View style={styles.hookBlock} />
        </View>
        <View style={styles.ropeGroup}>
          <View style={styles.ropeLine} />
          <View style={styles.hookBlock} />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.signageBoard}
        onPress={() => navigation.navigate('TrackQueue', { trackingId: appointment.trackingId })}
      >
        <View style={styles.signageInner}>
          <View style={styles.leftSection}>
            <View style={styles.brandGroup}>
              <Navigation size={mScale(20)} color="#0A2520" style={{ transform: [{ rotate: '45deg' }] }} />
              <View>
                <Text style={styles.shopText} numberOfLines={1}>{appointment.shopName?.toUpperCase()}</Text>
                <View style={styles.timeRow}>
                   {appointment.time && appointment.time.includes(' ') && (
                      <View style={styles.timeAmPmContainer}>
                         <Text style={styles.timeAmPmText}>{appointment.time.split(' ')[1]}</Text>
                      </View>
                   )}
                   <Text style={styles.timeText}>
                      {appointment.time ? (appointment.time.includes(' ') ? appointment.time.split(' ')[0] : appointment.time) : 'NOW'}
                   </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rightSection}>
            <View style={styles.statusGroup}>
              <View style={styles.infoLabelGroup}>
                <Text style={styles.subLabel}>QUEUE POSITION</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.liveDot, { backgroundColor: realPosition ? '#10B981' : 'rgba(10,37,32,0.4)' }]} />
                  <View>
                    <Text style={[styles.statusMainText, { color: realPosition ? '#10B981' : 'rgba(10,37,32,0.6)' }]}>
                      {!realPosition ? 'SYNCING...' : realPosition === 1 ? 'NEXT UP' : `${formatOrdinal(realPosition)} IN LINE`}
                    </Text>
                  </View>
                </View>
              </View>
              <Animated.View style={[styles.statusCircle, { opacity: pulseAnim, backgroundColor: realPosition ? '#EF4444' : '#D1D5DB' }]}>
                <Text style={[styles.circleText, { color: realPosition ? '#FFF' : '#4B5563' }]}>{realPosition || '-'}</Text>
              </Animated.View>
              <MoveRight size={mScale(18)} color="#0A2520" strokeWidth={2.5} />
            </View>

            <View style={styles.otpGroup}>
              <View style={styles.infoLabelGroup}>
                <Text style={styles.subLabel}>SECURE GATE</Text>
                <Text style={styles.otpLabel}>ACCESS CODE</Text>
              </View>
              <View style={styles.otpBox}>
                <Text style={styles.otpValueText}>{appointment.otp}</Text>
              </View>
              <MoveRight size={mScale(18)} color="#0A2520" strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  masterWrapper: {
    paddingHorizontal: mScale(12),
    paddingTop: mScale(28), // Room for ropes + hooks
    paddingBottom: mScale(15),
    width: '100%',
    alignItems: 'center',
  },
  suspensionSystem: {
    position: 'absolute',
    top: 0,
    width: '60%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    zIndex: 10,
  },
  ropeGroup: {
    alignItems: 'center', // This guarantees rope feeds into hook center
  },
  ropeLine: {
    width: 1.5,
    height: mScale(26),
    backgroundColor: '#CCCCCC',
  },
  hookBlock: {
    width: mScale(5),
    height: mScale(5),
    backgroundColor: '#0A2520',
    borderRadius: mScale(2.5),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: -mScale(2), // Overlap onto the banner frame
  },
  signageBoard: {
    backgroundColor: '#FFFFFF',
    borderRadius: mScale(50),
    borderWidth: mScale(3),
    borderColor: '#0A2520',
    minHeight: mScale(100),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
    transform: [{ perspective: 1000 }, { rotateX: '5deg' }],
  },
  signageInner: {
    flexDirection: 'row',
    padding: mScale(15),
    paddingHorizontal: mScale(25),
    alignItems: 'center',
    flex: 1,
  },
  leftSection: {
    flex: 1.2,
    justifyContent: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mScale(12),
  },
  shopText: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-condensed',
    fontSize: mScale(16),
    fontWeight: '900',
    color: '#0A2520',
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    backgroundColor: '#1A1A1A', 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeAmPmContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  timeAmPmText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: mScale(5.5),
    color: '#39FF14',
    fontWeight: '900',
    lineHeight: 7,
  },
  timeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: mScale(13),
    color: '#39FF14', 
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(57, 255, 20, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(10, 37, 32, 0.1)',
    marginHorizontal: mScale(10),
  },
  rightSection: {
    flex: 1.8,
    justifyContent: 'space-between',
    gap: mScale(8),
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: mScale(10),
  },
  otpGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: mScale(10),
  },
  infoLabelGroup: {
    alignItems: 'flex-end',
    flex: 1,
  },
  subLabel: {
    fontSize: mScale(7.5),
    fontWeight: '900',
    color: 'rgba(10, 37, 32, 0.4)',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: mScale(16),
    overflow: 'hidden',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusMainText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: mScale(12),
    fontWeight: '900',
  },
  otpLabel: {
    fontSize: mScale(9),
    fontWeight: '700',
    color: '#0A2520',
  },
  statusCircle: {
    width: mScale(26),
    height: mScale(26),
    borderRadius: mScale(13),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    color: '#FFF',
    fontSize: mScale(12),
    fontWeight: '900',
  },
  otpBox: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: mScale(10),
    paddingVertical: mScale(3),
    borderRadius: mScale(4),
    minWidth: mScale(50),
    alignItems: 'center',
  },
  otpValueText: {
    color: '#FCD34D',
    fontSize: mScale(12),
    fontWeight: '900',
    letterSpacing: 1,
  },
  tickerLine: {
    backgroundColor: 'rgba(10, 37, 32, 0.03)',
    paddingVertical: mScale(4),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 37, 32, 0.05)',
  },
  tickerText: {
    fontSize: mScale(7),
    fontWeight: '800',
    color: 'rgba(10, 37, 32, 0.3)',
    letterSpacing: 0.5,
  }
});

export default ActiveAppointmentBanner;
