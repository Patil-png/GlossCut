import React, { useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Circle, 
  Path, 
  Rect, 
  G, 
  Ellipse,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  withSequence, 
  withSpring,
  interpolate,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// sketch defaults
const SK = '#111111'; // Primary sketch ink
const SD = '#555555'; // Detail sketch ink (shading)
const SW = 1.4;       // Main stroke — reduced for a clean, light feel
const SWD = 0.75;     // Detail stroke — ultra-fine for texture lines

// Shared wobble animation – gives the "picked up from a desk" feel
const applyWobble = (sv) => {
  sv.value = withSequence(
    withTiming(10, { duration: 70, easing: Easing.out(Easing.ease) }),
    withTiming(-8, { duration: 90 }),
    withTiming(5, { duration: 80 }),
    withTiming(-2, { duration: 80 }),
    withTiming(0, { duration: 100, easing: Easing.inOut(Easing.ease) })
  );
};

// --- 🔍 SKETCH MAGNIFYING GLASS (Search) ---
export const PremiumSearchIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      scale.value = withSequence(
        withTiming(0.88, { duration: 80 }),
        withSpring(1, { damping: 5, stiffness: 160 })
      );
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 22">
          {/* Lens circle */}
          <Circle cx="18" cy="18" r="11.5" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          {/* Lens inner ring - depth detail */}
          <Circle cx="18" cy="18" r="8" stroke={SD} strokeWidth={SWD} fill="none" opacity={0.4} />
          {/* Lens shine / reflection lines */}
          <Path d="M12 13 Q13.5 11.5 15.5 12.5" stroke={SK} strokeWidth={SWD + 0.2} strokeLinecap="round" fill="none" />
          <Path d="M12.5 15.5 Q13.5 14 15 14.5" stroke={SD} strokeWidth={SWD} strokeLinecap="round" fill="none" opacity={0.5} />
          {/* Handle - thick rounded bar */}
          <Path d="M26.5 26.5 L35 35" stroke={SK} strokeWidth={SW + 1.2} strokeLinecap="round" />
          {/* Handle grip texture */}
          <Path d="M28 28.8 L29.5 27.3" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Path d="M30 30.8 L31.5 29.3" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Path d="M32 32.8 L33.5 31.3" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
        </AnimatedG>
      </Svg>
    </View>
  );
});

// --- 🪙 SKETCH COIN STACK (Coins) ---
export const PremiumCoinIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      bounce.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1, { damping: 5, stiffness: 180 })
      );
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: bounce.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 26">
          {/* ── Bottom coin ── */}
          <Path d="M12 34 L12 36.5 A10 3 0 0 0 32 36.5 L32 34" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.03)" />
          <Ellipse cx="22" cy="34" rx="10" ry="3" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.04)" />
          {/* ── Middle coin ── */}
          <Path d="M12 28.5 L12 34 A10 3 0 0 0 32 34 L32 28.5" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          <Ellipse cx="22" cy="28.5" rx="10" ry="3" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.04)" />
          {/* ── Top coin (face up) ── */}
          <Path d="M12 23 L12 28.5 A10 3 0 0 0 32 28.5 L32 23" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          <Ellipse cx="22" cy="23" rx="10" ry="3" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          {/* Inner ring on top coin */}
          <Ellipse cx="22" cy="23" rx="7" ry="2.2" stroke={SD} strokeWidth={SWD} fill="none" opacity={0.5} />
          {/* Letter + hatching */}
          <SvgText x="22" y="25" textAnchor="middle" fontSize="5" fontWeight="900" fill={SK} fontFamily="sans-serif">G</SvgText>
          {/* Side hatch lines on coin walls */}
          <Line x1="12.5" y1="26.5" x2="12.5" y2="30" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="31.5" y1="26.5" x2="31.5" y2="30" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="12.5" y1="30.5" x2="12.5" y2="34" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="31.5" y1="30.5" x2="31.5" y2="34" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
        </AnimatedG>
      </Svg>
    </View>
  );
});

// --- 🗺️ SKETCH FOLDED MAP (Shop Map) ---
export const PremiumMapIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const pinBounce = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      scale.value = withSequence(
        withTiming(0.88, { duration: 100 }),
        withSpring(1, { damping: 6, stiffness: 160 })
      );
      // Pin drop effect
      pinBounce.value = withSequence(
        withTiming(-6, { duration: 0 }),
        withTiming(0, { duration: 300, easing: Easing.bounce })
      );
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }]
  }));
  const pinProps = useAnimatedProps(() => ({
    transform: [{ translateY: pinBounce.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 22">
          {/* ── Folded map body ── */}
          {/* Left fold panel */}
          <Path d="M4 9 L16 6 L16 38 L4 35 Z" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.025)" strokeLinejoin="round" />
          {/* Middle panel */}
          <Path d="M16 6 L28 9 L28 38 L16 38 Z" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.015)" strokeLinejoin="round" />
          {/* Right fold panel */}
          <Path d="M28 9 L40 6 L40 35 L28 38 Z" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.025)" strokeLinejoin="round" />

          {/* ── Road grid lines (middle panel) ── */}
          <Line x1="16" y1="20" x2="28" y2="20" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="16" y1="27" x2="28" y2="27" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="22" y1="9" x2="22" y2="38" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />

          {/* ── Road grid on left panel ── */}
          <Line x1="4" y1="22" x2="16" y2="21" stroke={SD} strokeWidth={SWD} strokeLinecap="round" opacity={0.5} />
          {/* ── Road grid on right panel ── */}
          <Line x1="28" y1="22" x2="40" y2="21" stroke={SD} strokeWidth={SWD} strokeLinecap="round" opacity={0.5} />

          {/* ── Location pin ── */}
          <AnimatedG animatedProps={pinProps} origin="22, 20">
            <Path
              d="M22 9C19.2 9 17 11.2 17 14C17 17.5 22 23 22 23C22 23 27 17.5 27 14C27 11.2 24.8 9 22 9Z"
              stroke={SK}
              strokeWidth={SW}
              fill="rgba(0,0,0,0.03)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="22" cy="14" r="2.5" fill={SK} />
          </AnimatedG>

          {/* ── Compass rose (bottom-right corner of right panel) ── */}
          <Line x1="35" y1="30" x2="35" y2="34" stroke={SK} strokeWidth={SWD + 0.3} strokeLinecap="round" />
          <Line x1="33" y1="32" x2="37" y2="32" stroke={SK} strokeWidth={SWD + 0.3} strokeLinecap="round" />
          <SvgText x="35" y="30" textAnchor="middle" fontSize="4" fontWeight="900" fill={SK} fontFamily="sans-serif">N</SvgText>
        </AnimatedG>
      </Svg>
    </View>
  );
});


// --- 🤖 SKETCH ROBOT HEAD (Face AI) ---
export const PremiumFaceIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const eyeShift = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      scale.value = withSequence(
        withTiming(0.9, { duration: 80 }),
        withSpring(1, { damping: 5 })
      );
      // Eye scan left → right
      eyeShift.value = withSequence(
        withTiming(3, { duration: 200 }),
        withTiming(-3, { duration: 300 }),
        withTiming(0, { duration: 200 })
      );
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }]
  }));
  const eyeProps = useAnimatedProps(() => ({
    transform: [{ translateX: eyeShift.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 22">
          {/* Head */}
          <Rect x="7" y="9" width="30" height="26" rx="5" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          {/* Antenna */}
          <Line x1="22" y1="9" x2="22" y2="4" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
          <Circle cx="22" cy="3.5" r="2.5" stroke={SK} strokeWidth={SWD + 0.3} fill="rgba(0,0,0,0.04)" />
          {/* Ear bolts */}
          <Circle cx="7" cy="22" r="2" stroke={SK} strokeWidth={SWD + 0.3} fill="rgba(0,0,0,0.03)" />
          <Circle cx="37" cy="22" r="2" stroke={SK} strokeWidth={SWD + 0.3} fill="rgba(0,0,0,0.03)" />
          {/* Eyes - animated pupils */}
          <Circle cx="16" cy="19" r="4" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.03)" />
          <Circle cx="28" cy="19" r="4" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.03)" />
          <AnimatedG animatedProps={eyeProps}>
            <Circle cx="16" cy="19" r="1.8" fill={SK} />
            <Circle cx="28" cy="19" r="1.8" fill={SK} />
          </AnimatedG>
          {/* Mouth / speaker grille */}
          <Rect x="12" y="26" width="20" height="6" rx="2" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          <Line x1="16.5" y1="26" x2="16.5" y2="32" stroke={SD} strokeWidth={SWD} />
          <Line x1="22" y1="26" x2="22" y2="32" stroke={SD} strokeWidth={SWD} />
          <Line x1="27.5" y1="26" x2="27.5" y2="32" stroke={SD} strokeWidth={SWD} />
          {/* Side circuit detail */}
          <Path d="M7 14 L2 14 L2 17" stroke={SD} strokeWidth={SWD} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M37 14 L42 14 L42 17" stroke={SD} strokeWidth={SWD} strokeLinecap="round" strokeLinejoin="round" />
        </AnimatedG>
      </Svg>
    </View>
  );
});

// --- 🕒 SKETCH POCKET WATCH (History) ---
export const PremiumHistoryIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const handAngle = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      // Hands spin backward (rewind effect)
      handAngle.value = withTiming(-360, {
        duration: 700,
        easing: Easing.bezier(0.34, 1.2, 0.64, 1)
      });
      handAngle.value = withDelay(800, withTiming(0, { duration: 0 }));
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));
  const handProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${handAngle.value}deg` }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 26">
          {/* Crown / winder */}
          <Rect x="18" y="6" width="8" height="5" rx="2" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.03)" />
          {/* Lugs */}
          <Line x1="18" y1="7" x2="13" y2="11" stroke={SK} strokeWidth={SWD + 0.3} strokeLinecap="round" />
          <Line x1="26" y1="7" x2="31" y2="11" stroke={SK} strokeWidth={SWD + 0.3} strokeLinecap="round" />
          {/* Watch body */}
          <Circle cx="22" cy="28" r="14" stroke={SK} strokeWidth={SW} fill="rgba(0,0,0,0.02)" />
          {/* Inner bezel ring */}
          <Circle cx="22" cy="28" r="11" stroke={SD} strokeWidth={SWD} fill="none" strokeDasharray="2.5 4" opacity={0.5} />
          {/* Hour markers at 12, 3, 6, 9 */}
          <Line x1="22" y1="16" x2="22" y2="19" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
          <Line x1="34" y1="28" x2="31" y2="28" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
          <Line x1="22" y1="40" x2="22" y2="37" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
          <Line x1="10" y1="28" x2="13" y2="28" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
          {/* Hands */}
          <AnimatedG animatedProps={handProps} origin="22, 28">
            {/* Minute hand (long) */}
            <Path d="M22 28 L22 18" stroke={SK} strokeWidth={SW} strokeLinecap="round" />
            {/* Hour hand (short and thick) */}
            <Path d="M22 28 L28 28" stroke={SK} strokeWidth={SW + 0.5} strokeLinecap="round" />
          </AnimatedG>
          {/* Center pivot */}
          <Circle cx="22" cy="28" r="2.5" fill={SK} />
        </AnimatedG>
      </Svg>
    </View>
  );
});

// --- ❤️ SKETCH HEART (Liked) ---
export const PremiumHeartIcon = forwardRef(({ active }, ref) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    animate: () => {
      applyWobble(rotation);
      // Heartbeat: grows → shrinks → settles
      scale.value = withSequence(
        withTiming(1.35, { duration: 100 }),
        withTiming(0.88, { duration: 100 }),
        withSpring(1, { damping: 4, stiffness: 180 })
      );
    }
  }));

  const groupProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <AnimatedG animatedProps={groupProps} origin="22, 22">
          {/* Outer heart */}
          <Path
            d="M22 36C22 36 4 24 4 13C4 8.02 8.02 4 13 4C16.2 4 19 5.6 21 8L22 9.8L23 8C25 5.6 27.8 4 31 4C35.98 4 40 8.02 40 13C40 24 22 36 22 36Z"
            stroke={SK}
            strokeWidth={SW}
            fill="rgba(0,0,0,0.02)"
            strokeLinejoin="round"
          />
          {/* Inner heart (double-outline sketch effect) */}
          <Path
            d="M22 31C22 31 8 22 8 14C8 11 10.5 9 13 9C15 9 16.8 10 18.5 12L22 15.5L25.5 12C27.2 10 29 9 31 9C33.5 9 36 11 36 14C36 22 22 31 22 31Z"
            stroke={SD}
            strokeWidth={SWD}
            fill="none"
            opacity={0.45}
          />
          {/* Sketch highlight line (top-left of heart) */}
          <Path d="M14 10 Q15 8.5 17 9.5" stroke={SD} strokeWidth={SWD} strokeLinecap="round" fill="none" />
          <Path d="M12 13 Q13 11.5 15 12" stroke={SD} strokeWidth={SWD} strokeLinecap="round" fill="none" opacity={0.5} />
        </AnimatedG>
      </Svg>
    </View>
  );
});

// --- 🔔 SKETCH BELL (Header Notification) ---
export const PremiumBellIcon = forwardRef(({ active }, ref) => {
  const swing = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    animate: () => {
      swing.value = withSequence(
        withTiming(-18, { duration: 90 }),
        withTiming(18, { duration: 150 }),
        withTiming(-12, { duration: 120 }),
        withTiming(12, { duration: 120 }),
        withTiming(0, { duration: 150 })
      );
    }
  }));

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${swing.value}deg` }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Svg width="30" height="30" viewBox="0 0 34 34" fill="none">
        <AnimatedG animatedProps={animatedProps} origin="17, 8">
          {/* Bell body */}
          <Path
            d="M17 4C12.5 4 9 7.5 9 12V22L7 24.5V25.5H27V24.5L25 22V12C25 7.5 21.5 4 17 4Z"
            stroke={SK}
            strokeWidth={SW}
            fill="rgba(0,0,0,0.03)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Shine / highlight line on bell */}
          <Path d="M12 10 Q12.5 8.5 14 9" stroke={SD} strokeWidth={SWD} strokeLinecap="round" fill="none" />
          {/* Side hatch on bell body */}
          <Line x1="10" y1="19" x2="10" y2="22" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          <Line x1="24" y1="19" x2="24" y2="22" stroke={SD} strokeWidth={SWD} strokeLinecap="round" />
          {/* Clapper */}
          <Path d="M15 25.5 Q17 28.5 19 25.5" stroke={SK} strokeWidth={SW} strokeLinecap="round" fill="none" />
        </AnimatedG>
        {/* Notification badge */}
        <Circle cx="25" cy="7" r="5.5" fill="#FF2D55" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
