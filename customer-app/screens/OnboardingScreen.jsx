import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
  FadeInUp,
  FadeInDown,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../src/theme/typography";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive Scaling Helpers
const resScale = (size) => {
  'worklet';
  return (SCREEN_WIDTH / 375) * size;
};

const mScale = (size, factor = 0.5) => {
  'worklet';
  return size + (resScale(size) - size) * factor;
};

const ONBOARDING_DATA = [
  {
    id: 1,
    tag: "SMART SEARCH",
    title: "Smart Discovery,\nLive Availability.",
    description: "View a digital live board of available slots and shop status. Book your favorite professional from anywhere in India.",
    image: require('../assets/Page1.jpeg'),
    color: '#FFF9F9' // Soft Red Tint
  },
  {
    id: 2,
    tag: "EASY BOOKING",
    title: "One-Tap Booking,\nReal-Time Tracking.",
    description: "Booking a haircut is now as easy as ordering food. Get a tracking ID to see exactly how much time is left for your turn.",
    image: require('../assets/Page2.jpeg'),
    color: '#F9F9FF' // Soft Blue Tint
  },
  {
    id: 3,
    tag: "TIME SAVING",
    title: "No More Waiting,\nJust Show Up.",
    description: "Stop sitting for hours at the salon. Get automated reminders and only arrive when your barber is ready for you.",
    image: require('../assets/Page3.jpeg'),
    color: '#FDF8F6' // Warm Off-White
  },
];

const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    const nextIndex = Math.min(currentIndex + 1, ONBOARDING_DATA.length - 1);
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      navigation.replace("Home");
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({ x: prevIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const handleSkip = () => navigation.replace("Home");

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* 1. Dynamic Morphing Background */}
      <View style={StyleSheet.absoluteFill}>
        {ONBOARDING_DATA.map((item, index) => (
          <BackgroundLayer 
            key={index} 
            index={index} 
            scrollX={scrollX} 
            color={item.color} 
          />
        ))}
      </View>

      {/* 2. Header */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <View />
        <TouchableOpacity onPress={handleSkip} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Character Image Slider with 3D Depth */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
        }}
      >
        {ONBOARDING_DATA.map((item, index) => (
          <View key={item.id} style={[styles.slide, { paddingTop: insets.top }]}>
            <ImageParallax index={index} scrollX={scrollX} source={item.image} />
          </View>
        ))}
      </Animated.ScrollView>

      {/* 4. Glassmorphic Content Card */}
      <View style={[styles.contentCard]}>
        <View style={styles.metaRow}>
          <Animated.View key={`tag-${currentIndex}`} entering={FadeInDown.duration(400)}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{ONBOARDING_DATA[currentIndex].tag}</Text>
            </View>
          </Animated.View>
          <Pagination dots={ONBOARDING_DATA} scrollX={scrollX} />
        </View>

        <Animated.View key={`content-${currentIndex}`} entering={FadeInUp.delay(100).duration(600)} style={styles.textContent}>
          <Text style={styles.title}>{ONBOARDING_DATA[currentIndex].title}</Text>
          <Text style={styles.description}>{ONBOARDING_DATA[currentIndex].description}</Text>
        </Animated.View>

        <View style={[styles.footer, { bottom: insets.bottom + resScale(15) }]}>
          <View style={styles.ctaRow}>
            {currentIndex > 0 && (
              <TouchableOpacity 
                style={styles.ctaSquareIconSecondary} 
                onPress={handleBack} 
                activeOpacity={0.8}
              >
                <ChevronLeft size={20} color="#1A1A1A" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.ctaMainPart, { flex: 1 }]} 
              onPress={handleNext} 
              activeOpacity={0.9}
            >
              <View style={[
                styles.ctaTextPart, 
                { borderRadius: 26, paddingLeft: 0, alignItems: 'center' }
              ]}>
                <Text style={styles.ctaText}>
                  {currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Continue"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const ImageParallax = ({ index, scrollX, source }) => {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleVal = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.7, 1, 0.7],
      Extrapolate.CLAMP
    );
    const rotate = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(float.value, [0, 1], [0, -15]);

    return { transform: [{ scale: scaleVal }, { rotate: `${rotate}deg` }, { translateY }], opacity };
  });

  return (
    <Animated.View style={[styles.imageWrapper, animatedStyle]}>
      <Image source={source} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
};

const BackgroundLayer = ({ index, scrollX, color }) => {
  const style = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return { opacity, backgroundColor: color };
  });

  return <Animated.View style={[StyleSheet.absoluteFill, style]} />;
};

const Pagination = ({ dots, scrollX }) => {
  return (
    <View style={styles.pagination}>
      {dots.map((_, index) => (
        <PaginationDot key={index} index={index} scrollX={scrollX} />
      ))}
    </View>
  );
};

const PaginationDot = ({ index, scrollX }) => {
  const style = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [resScale(8), resScale(24), resScale(8)],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );
    return { width, opacity, backgroundColor: '#E21D25' };
  });

  return <Animated.View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF8F6' },
  header: { 
    position: 'absolute', 
    left: resScale(25), 
    right: resScale(25), 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    zIndex: 1000 
  },
  headerButton: { 
    backgroundColor: "#fac71eff",
    paddingVertical: resScale(8), 
    paddingHorizontal: resScale(16), 
    borderRadius: 100, 
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerButtonText: { 
    ...Typography.FONT_BOLD, 
    fontSize: mScale(12), 
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slide: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT * 0.58, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  imageWrapper: { 
    width: SCREEN_WIDTH * 0.8, 
    height: SCREEN_HEIGHT * 0.35, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  image: { width: '100%', height: '100%' },
  contentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: resScale(25),
    paddingTop: resScale(30),
    height: SCREEN_HEIGHT * 0.42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 25,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: resScale(20),
  },
  tagPill: {
    backgroundColor: '#FFF2F2',
    paddingHorizontal: resScale(18),
    paddingVertical: resScale(8),
    borderRadius: 30,
  },
  tagText: {
    ...Typography.FONT_BOLD,
    fontSize: mScale(9),
    color: '#E21D25',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: resScale(5),
    borderRadius: 3,
    marginHorizontal: 3,
  },
  textContent: {
    marginBottom: resScale(20),
  },
  title: {
    ...Typography.FONT_BLACK,
    fontSize: mScale(28),
    lineHeight: mScale(36),
    color: '#1A1A1A',
    marginBottom: resScale(10),
    letterSpacing: -1,
  },
  description: {
    ...Typography.FONT_REGULAR,
    fontSize: mScale(15),
    lineHeight: mScale(24),
    color: '#555',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    left: resScale(25),
    right: resScale(25),
  },
  ctaRow: {
    flexDirection: 'row',
    height: resScale(52),
    alignItems: 'center',
    width: '100%',
  },
  ctaMainPart: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  ctaTextPart: {
    flex: 1,
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: resScale(26),
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  ctaSquareIconSecondary: {
    width: resScale(52),
    height: resScale(52),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: resScale(16),
    marginRight: resScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    ...Typography.FONT_BOLD,
    color: '#fff',
    fontSize: mScale(13),
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default OnboardingScreen;
