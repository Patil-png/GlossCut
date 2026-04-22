import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, useWindowDimensions, Linking, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../theme/typography';
import Svg, { Path, G, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';
import { Menu, Play, X as CloseX, Instagram } from 'lucide-react-native';

const SplashScreen = ({ navigation, onFinish }) => {
  const { user } = useAuth();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Responsive scaling factor (based on standard 375px width)
  const scale = SCREEN_WIDTH / 375;
  const normalize = (size) => Math.round(size * scale);

  // Custom styles for dynamic dimensions
  const dynamicStyles = getDynamicStyles(SCREEN_WIDTH, SCREEN_HEIGHT, normalize);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const cornerBannerAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const barberFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of entrance animations
    Animated.stagger(120, [
      // 1. Header Entrance
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(headerTranslate, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      // 2. Central Image Spring
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      // 3. Main Text Entrance
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(contentTranslate, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      // 4. Footer & Banner Entrance
      Animated.parallel([
        Animated.timing(footerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(cornerBannerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Start a floating animation for the barber after entrance
      Animated.loop(
        Animated.sequence([
          Animated.timing(barberFloatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(barberFloatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    });

    // Automatic navigation to Home/Login after sequence
    const exitTimer = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      } else {
        navigation.replace(user ? 'Home' : 'Login');
      }
    }, 1300);

    return () => clearTimeout(exitTimer);
  }, [user]);

  const floatY = barberFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <Animated.View style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }
        ]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Image
                source={require('../../assets/Glosscut_1.png')}
                style={styles.headerLogoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.headerTextMain}>
                Gloss<Text style={{ color: '#E21D25' }}>Cut</Text>
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.menuIconContainer}>
              <View style={[styles.menuLine, { width: 20 }]} />
              <View style={[styles.menuLine, { width: 18 }]} />
            </View>
          </View>
        </Animated.View>

        {/* Main Center Content */}
        <View style={styles.centerSection}>
          <Animated.View style={[
            dynamicStyles.geometricContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: floatY }
              ]
            }
          ]}>
            {/* SVG Background Geometric X with Clipping */}
            <View style={styles.svgWrapper}>
              <Svg width={SCREEN_WIDTH * 1.1} height={SCREEN_WIDTH * 1.1} viewBox="0 0 100 100">
                <Defs>
                  <ClipPath id="clipX">
                    <Path d="M10 25 L25 10 L40 10 L50 20 L60 10 L75 10 L90 25 L90 40 L80 50 L90 60 L90 75 L75 90 L60 90 L50 80 L40 90 L25 90 L10 75 L10 60 L20 50 L10 40 Z" />
                  </ClipPath>
                </Defs>

                {/* Background Red X */}
                <Path
                  d="M10 25 L25 10 L40 10 L50 20 L60 10 L75 10 L90 25 L90 40 L80 50 L90 60 L90 75 L75 90 L60 90 L50 80 L40 90 L25 90 L10 75 L10 60 L20 50 L10 40 Z"
                  fill="#E21D25"
                />

                {/* Barber/Stylist Illustration Clipped to X */}
                <SvgImage
                  href={require('../../assets/splash_barber.png')}
                  width="110"
                  height="110"
                  x="-5"
                  y="-5"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#clipX)"
                />
              </Svg>
            </View>

          </Animated.View>

        </View>

        {/* Text Section */}
        <Animated.View style={[
          dynamicStyles.textSection,
          { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }
        ]}>
          <Text
            style={dynamicStyles.mainHeadline}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Elevate Your{"\n"}Style <Text style={{ color: '#5b0d0dff' }}>Experience</Text>
          </Text>
          <Text
            style={dynamicStyles.subHeadline}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            India's Smartest Grooming Destination
          </Text>
        </Animated.View>

        {/* Footer Decorations */}
        <Animated.View style={[styles.footerDecor, { opacity: footerAnim, transform: [{ scale: footerAnim }] }]}>
          <View style={styles.bottomLeftContainer}>
            <View style={styles.footerRedLine} />
            <View style={styles.footerDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </Animated.View>

      </SafeAreaView>

      {/* Bottom Right Corner Banner */}
      <Animated.View style={[
        styles.cornerBannerContainer,
        { transform: [{ translateX: cornerBannerAnim }] }
      ]}>
        <TouchableOpacity
          style={styles.bannerBlackBar}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://www.instagram.com/glosscut.india')}
        >
          <View style={styles.bannerContent}>
            <Instagram color="white" size={14} style={{ marginRight: 6, transform: [{ translateY: +1 }] }} />
            <Text style={styles.bannerText}>glosscut.india</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.bannerRedStripe} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FDF8F6', // Warm off-white from image
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginRight: 10,
  },
  headerLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E21D25',
    backgroundColor: '#E21D25',
  },
  headerTextMain: {
    ...Typography.FONT_BLACK,
    fontSize: 26,
    color: '#000000',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  headerTextSub: {
    ...Typography.FONT_BLACK,
    fontSize: 18,
    color: '#000000',
    lineHeight: 20,
  },
  menuIconContainer: {
    alignItems: 'flex-end',
  },
  menuLine: {
    height: 3,
    backgroundColor: '#000000',
    marginVertical: 3,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geometricContainer: {
    // Responsive sizes handled in getDynamicStyles
  },
  svgWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationWrapper: {
    zIndex: 1,
  },
  navigatorImage: {
    width: '100%',
    height: '100%',
  },
  bracketContainer: {
    marginTop: 20,
  },
  bracketText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
  },
  textSection: {
    marginBottom: 80,
  },
  mainHeadline: {
    ...Typography.FONT_BLACK,
    fontSize: 48,
    color: '#000000',
    lineHeight: 52,
    letterSpacing: -1,
  },
  subHeadline: {
    ...Typography.FONT_SEMI,
    fontSize: 12,
    color: '#000000',
    opacity: 0.5,
    marginTop: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerDecor: {
    position: 'absolute',
    bottom: 60,
    left: 30,
  },
  bottomLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRedLine: {
    width: 60,
    height: 4,
    backgroundColor: '#E21D25',
    marginRight: 15,
  },
  footerDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
    marginHorizontal: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    ...Typography.FONT_BOLD,
    color: 'white',
    fontSize: 12,
    letterSpacing: 1,
  },
  cornerBannerContainer: {
    position: 'absolute',
    bottom: -30,
    right: -50,
    width: 250,
    height: 100,
    transform: [{ rotate: '-45deg' }],
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBlackBar: {
    backgroundColor: '#000000',
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10, // Reduced as we are now centering
  },
  bannerRedStripe: {
    backgroundColor: '#E21D25',
    width: '100%',
    height: 12,
  },
  bannerLogoContainer: {
    backgroundColor: '#E21D25',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginLeft: 15,
  }
});

// Helper for dynamic responsive styles
const getDynamicStyles = (width, height, normalize) => StyleSheet.create({
  geometricContainer: {
    // Responsive size: 1.1x width, but capped at 45% of height to avoid overlapping text on short screens
    width: Math.min(width * 1.1, height * 0.45),
    height: Math.min(width * 1.1, height * 0.45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    marginTop: -normalize(40), // Shift text up closer to the image
    marginBottom: height * 0.08,
  },
  mainHeadline: {
    ...Typography.FONT_BLACK,
    fontSize: normalize(44), // Scaled font size
    color: '#000000',
    lineHeight: normalize(42), // Reduced from 48 to bring lines closer
    letterSpacing: -1,
  },
  subHeadline: {
    ...Typography.FONT_SEMI,
    fontSize: normalize(12),
    color: '#000000',
    opacity: 0.5,
    marginTop: normalize(8),
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});

export default SplashScreen;
