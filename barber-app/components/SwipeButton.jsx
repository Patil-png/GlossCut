import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Easing, TouchableOpacity, Linking, Alert, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, MessageSquare, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// --- PREMIUM DESIGN SYSTEM ---
const THEME = {
  // Cred/Fintech style Gradients (Deep & Vibrant)
  primaryGradient: ['#2E3192', '#1BFFFF'],
  successGradient: ['#11998e', '#38ef7d'],
  disabledGradient: ['#F0F2F5', '#F0F2F5'],

  // Surfaces
  trackBackground: '#FFFFFF',
  trackBorder: '#EEEFFF',

  // Text
  textHint: '#8A8D9F',
  textHighlight: '#1A1D2E',

  // Shadows
  shadowColor: '#2E3192',
  successShadow: '#38ef7d',
};

const BUTTON_HEIGHT = 68; // Slightly taller for better touch target
const PADDING = 4; // Tighter fit for the "rail" look
const KNOB_SIZE = BUTTON_HEIGHT - (PADDING * 2);

const SwipeButton = ({ onSwipeSuccess, customerPhoneNumber, title = "Slide to confirm", disabled = false }) => {
  const [swiped, setSwiped] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Animation Values
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Calculate drag limit
  const maxDrag = containerWidth > BUTTON_HEIGHT ? containerWidth - BUTTON_HEIGHT : 1;

  // 1. Breathing Text Animation (Retained Logic)
  useEffect(() => {
    if (!swiped && !disabled) {
      const breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      breathing.start();
      return () => breathing.stop();
    }
  }, [swiped, disabled]);

  const onLayout = (event) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const triggerHaptic = (type) => {
    if (Platform.OS !== 'web') {
      if (type === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (type === 'selection') Haptics.selectionAsync();
    }
  };

  const handleSwipeSuccess = () => {
    triggerHaptic('success');

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: maxDrag,
        duration: 250, // Slightly snappier
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSwiped(true);
      if (onSwipeSuccess) onSwipeSuccess();

      // Pop the checkmark with a heavy spring for "impact" feel
      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContact = () => {
    triggerHaptic('impact');
    Alert.alert(
      "Concierge Support",
      "Connect with the customer securely.",
      [
        { text: "Call Now", onPress: () => Linking.openURL(`tel:${customerPhoneNumber}`), style: 'default' },
        { text: "WhatsApp", onPress: () => Linking.openURL(`whatsapp://send?phone=${customerPhoneNumber}`), style: 'default' },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // 2. PanResponder (Retained Logic)
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swiped && !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontal && Math.abs(gestureState.dx) > 5 && !swiped && !disabled;
      },
      onPanResponderGrant: () => {
        triggerHaptic('selection');
        // Visual shrinking for touch feedback
        Animated.spring(scale, { toValue: 0.92, friction: 5, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabled) return;
        const newX = Math.min(maxDrag, Math.max(0, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabled) return;
        const threshold = maxDrag * 0.60;

        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

        if (gestureState.dx > threshold) {
          handleSwipeSuccess();
        } else {
          triggerHaptic('selection');
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    })
  ).current;

  // 3. Interpolations
  const backgroundTranslateX = translateX.interpolate({
    inputRange: [0, maxDrag],
    outputRange: [-maxDrag, 0],
    extrapolate: 'clamp',
  });

  // Fade out the arrow as we swipe
  const arrowOpacity = translateX.interpolate({
    inputRange: [0, maxDrag * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.outerContainer}>

      {/* MAIN TRACK */}
      <View style={[styles.trackContainer, disabled && styles.disabledTrack]} onLayout={onLayout}>

        {/* Background Hint Text */}
        {!swiped && (
          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={styles.hintText}>{title.toUpperCase()}</Text>
            {/* Visual chevron indicator in text */}
            <Animated.View style={{ marginLeft: 6, opacity: 0.5 }}>
              <ArrowRight size={14} color={THEME.textHint} strokeWidth={3} />
            </Animated.View>
          </Animated.View>
        )}

        {/* Dynamic Gradient Fill (The Active Path) - HIDDEN */}
        <Animated.View
          style={[
            styles.activeTrackMask,
            { transform: [{ translateX: backgroundTranslateX }], opacity: 0 }
          ]}
        >
          <LinearGradient
            colors={swiped ? THEME.successGradient : (disabled ? THEME.disabledGradient : THEME.primaryGradient)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </Animated.View>

        {/* Draggable Knob */}
        <Animated.View
          style={[
            styles.knobContainer,
            swiped ? styles.knobSuccessShadow : styles.knobDefaultShadow, // Conditional Glow
            { transform: [{ translateX }, { scale }] },
          ]}
          {...pan.panHandlers}
        >
          {swiped ? (
            <Animated.View style={{ transform: [{ scale: successScale }] }}>
              <LinearGradient
                colors={THEME.successGradient}
                style={styles.successIconBubble}
              >
                <Check size={28} color="#FFF" strokeWidth={3.5} />
              </LinearGradient>
            </Animated.View>
          ) : (
            <LinearGradient
              colors={disabled ? ['#F5F5F5', '#E0E0E0'] : THEME.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.knobInterior}
            >
              <Animated.View style={{ opacity: arrowOpacity }}>
                <ArrowRight size={26} color="#FFF" strokeWidth={2.5} />
              </Animated.View>
            </LinearGradient>
          )}
        </Animated.View>

      </View>

      {/* CHAT/SUPPORT BUTTON (Floating Glass Effect) */}
      {!swiped && (
        <TouchableOpacity
          style={styles.chatButtonContainer}
          onPress={handleContact}
          activeOpacity={0.8}
        >
          <View style={styles.chatButtonShadow} />
          <LinearGradient
            colors={['#FFFFFF', '#F5F7FA']}
            style={styles.chatButton}
          >
            <MessageSquare size={22} color="#2E3192" fill="#2E3192" fillOpacity={0.15} strokeWidth={2} />
          </LinearGradient>

          {/* Notification Dot for "Online" status */}
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16, // More breathing room
    paddingVertical: 12,
  },

  // --- TRACK STYLES ---
  trackContainer: {
    height: BUTTON_HEIGHT,
    flex: 1,
    borderRadius: 34, // Fully rounded pill
    backgroundColor: THEME.trackBackground,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.trackBorder,
    // Modern soft shadow (Neumorphism-lite)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  disabledTrack: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  activeTrackMask: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    left: 0,
    zIndex: 0,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    opacity: 0.9, // Slight transparency for glass feel
  },

  // --- TEXT STYLES ---
  textContainer: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingLeft: 40, // Offset for the knob
  },
  hintText: {
    fontSize: 14,
    fontWeight: '700', // Bold for readability
    color: THEME.textHint,
    letterSpacing: 1.2, // Premium tracking
    fontFamily: Platform.select({ ios: 'Avenir', android: 'Roboto' }), // Clean fonts
  },

  // --- KNOB STYLES ---
  knobContainer: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    marginLeft: PADDING,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  knobDefaultShadow: {
    shadowColor: THEME.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8, // Strong elevation for "floating" feel
  },
  knobSuccessShadow: {
    shadowColor: THEME.successShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  knobInterior: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  successIconBubble: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- CHAT BUTTON STYLES ---
  chatButtonContainer: {
    marginLeft: 12,
    width: BUTTON_HEIGHT,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 20, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  chatButtonShadow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: "#2E3192",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  onlineDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38ef7d', // Online Green
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 2,
    zIndex: 10,
  },
});

export default SwipeButton;