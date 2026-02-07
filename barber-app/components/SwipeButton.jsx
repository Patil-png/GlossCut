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

const SwipeButton = ({
  onSwipeSuccess,
  customerPhoneNumber,
  title = "Slide to confirm",
  disabled = false,
  containerStyles,
  thumbColor,
  railBackgroundColor,
  railBorderColor,
  titleColor
}) => {
  const [swiped, setSwiped] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Animation Values
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Calculate drag limit
  const maxDrag = containerWidth > BUTTON_HEIGHT ? containerWidth - BUTTON_HEIGHT : 1;

  // 1. Breathing Text Animation
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

  // Refs for PanResponder to avoid stale closures
  const disabledRef = useRef(disabled);
  const swipedRef = useRef(swiped);
  const maxDragRef = useRef(0);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    swipedRef.current = swiped;
  }, [swiped]);

  useEffect(() => {
    const dragLimit = containerWidth > BUTTON_HEIGHT ? containerWidth - BUTTON_HEIGHT : 0;
    maxDragRef.current = dragLimit;
  }, [containerWidth]);

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
    const maxDrag = maxDragRef.current;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: maxDrag,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSwiped(true);
      if (onSwipeSuccess) onSwipeSuccess();

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

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipedRef.current && !disabledRef.current && maxDragRef.current > 0,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontal && Math.abs(gestureState.dx) > 5 && !swipedRef.current && !disabledRef.current && maxDragRef.current > 0;
      },
      onPanResponderGrant: () => {
        triggerHaptic('selection');
        Animated.spring(scale, { toValue: 0.92, friction: 5, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current || swipedRef.current) return;
        const maxDrag = maxDragRef.current;
        const newX = Math.min(maxDrag, Math.max(0, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabledRef.current || swipedRef.current) return;
        const maxDrag = maxDragRef.current;
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

  // Visual Interpolation for the track gradient fill
  const maxDragForInterpolation = containerWidth > BUTTON_HEIGHT ? containerWidth - BUTTON_HEIGHT : 1;
  const backgroundTranslateX = translateX.interpolate({
    inputRange: [0, maxDragForInterpolation],
    outputRange: [-maxDragForInterpolation, 0],
    extrapolate: 'clamp',
  });

  const arrowOpacity = translateX.interpolate({
    inputRange: [0, maxDragForInterpolation * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const activeTrackGlowOpacity = translateX.interpolate({
    inputRange: [0, maxDragForInterpolation * 0.5, maxDragForInterpolation],
    outputRange: [0, 0.2, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.outerContainer, containerStyles]}>

      {/* MAIN TRACK */}
      <View
        style={[
          styles.trackContainer,
          {
            backgroundColor: railBackgroundColor || THEME.trackBackground,
            borderColor: railBorderColor || THEME.trackBorder
          },
          disabled && styles.disabledTrack
        ]}
        onLayout={onLayout}
      >
        {/* Dynamic Gradient Fill (The Active Path) */}
        {!swiped && (
          <Animated.View
            style={[
              styles.activeTrackMask,
              {
                width: containerWidth,
                transform: [{ translateX: backgroundTranslateX }]
              }
            ]}
          >
            <LinearGradient
              colors={disabled ? THEME.disabledGradient : (thumbColor ? [thumbColor + '40', thumbColor] : THEME.primaryGradient)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>
        )}

        {/* Active Track Glow Effect (Subtle overlay) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: thumbColor || THEME.primaryGradient[0],
              opacity: activeTrackGlowOpacity
            }
          ]}
        />

        {/* Background Hint Text */}
        {!swiped && (
          <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
            <Text style={[styles.hintText, titleColor && { color: titleColor }]}>{title.toUpperCase()}</Text>
            <Animated.View style={{ marginLeft: 6, opacity: 0.5 }}>
              <ArrowRight size={14} color={titleColor || THEME.textHint} strokeWidth={3} />
            </Animated.View>
          </Animated.View>
        )}

        {/* Draggable Knob */}
        <Animated.View
          style={[
            styles.knobContainer,
            swiped ? styles.knobSuccessShadow : styles.knobDefaultShadow,
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
              colors={disabled ? ['#F5F5F5', '#E0E0E0'] : (thumbColor ? [thumbColor, thumbColor] : THEME.primaryGradient)}
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

      {/* CHAT/SUPPORT BUTTON */}
      {!swiped && customerPhoneNumber && (
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
            <MessageSquare size={22} color={thumbColor || "#2E3192"} fill={thumbColor || "#2E3192"} fillOpacity={0.15} strokeWidth={2} />
          </LinearGradient>
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
    paddingVertical: 12,
  },
  trackContainer: {
    height: BUTTON_HEIGHT,
    flex: 1,
    borderRadius: 34,
    backgroundColor: THEME.trackBackground,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: THEME.trackBorder,
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
    left: 0,
    zIndex: 0,
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingLeft: BUTTON_HEIGHT * 0.4,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textHint,
    letterSpacing: 1.5,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  knobSuccessShadow: {
    shadowColor: THEME.successShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
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
  chatButtonContainer: {
    marginLeft: 12,
    width: BUTTON_HEIGHT,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  chatButtonShadow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  onlineDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#38ef7d',
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 10,
  },
});

export default SwipeButton;