import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  StatusBar,
  Platform,
  Easing,
} from "react-native";
import { ArrowRight, Scissors, Calendar, Star } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// ---------------------------------------------------------
// DATA WITH LOCAL IMAGES
// ---------------------------------------------------------
const ONBOARDING_DATA = [
  {
    id: 1,
    tag: "CONVENIENCE",
    icon: <Calendar size={14} color="#fff" />,
    title: "Tired of waiting\nat the salon?",
    description:
      "Skip the lobby. Book your seat before you even leave your house.",
    image: require('../assets/Page1.png'),
  },
  {
    id: 2,
    tag: "EASY PROCESS",
    icon: <Scissors size={14} color="#fff" />,
    title: "Book. Sit.\nGet Styled.",
    description:
      "1. Choose a top-rated barber.\n2. Book your slot.\n3. Walk in like a VIP.",
    image: require('../assets/Page2.png'),
  },
  {
    id: 3,
    tag: "TRUSTED PROS",
    icon: <Star size={14} color="#fff" />,
    title: "Your Style,\nDelivered.",
    description:
      "Transparent pricing, verified reviews, and a history of your best cuts.",
    image: require('../assets/Page3.png'),
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Entry Animation Ref
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger Entry Animation on Mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  const pages = ONBOARDING_DATA;

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * screenWidth,
        animated: true,
      });
    } else {
      navigation.replace("Home");
    }
  };

  const handleSkip = () => {
    navigation.replace("Home");
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const page = Math.round(scrollPosition / screenWidth);
    setCurrentPage(page);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, opacity: fadeAnim },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* 2. Full Bleed Image ScrollView with ENHANCED ANIMATIONS */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
        bounces={false}
      >
        {pages.map((page, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          // 1. Enhanced Parallax: Image moves faster than scroll
          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [-screenWidth * 0.8, 0, screenWidth * 0.8],
          });

          // 2. Scale Effect: Image scales down as it comes into focus (Zoom Out effect)
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1.4, 1.1, 1.4], // Active image is 1.1, inactive are 1.4
            extrapolate: "clamp",
          });

          // 3. Opacity Effect: Dim the side images
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <View
              key={page.id}
              style={{ width: screenWidth, height: screenHeight }}
            >
              <View style={styles.imageContainer}>
                <Animated.Image
                  source={page.image}
                  style={[
                    styles.fullImage,
                    {
                      opacity,
                      transform: [
                        { translateX },
                        { scale }, // Added Scale Transform
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />
                {/* Dark Gradient Overlay */}
                <View style={styles.gradientOverlay} />
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Top Header (Skip) */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipPill}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Content */}
      <View
        style={[
          styles.bottomSheetContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Dynamic Content Switching */}
        <View style={styles.contentArea}>
          {pages.map((page, index) => {
            const inputRange = [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ];

            // Text Animation: Slide Up + Fade In
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0, 1, 0],
            });
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [40, 0, 40], // Text slides up from bottom
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.slideContent,
                  { opacity, transform: [{ translateY }] },
                ]}
                pointerEvents={index === currentPage ? "auto" : "none"}
              >
                <View
                  style={[
                    styles.tagContainer,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  {page.icon}
                  <Text style={styles.tagText}>{page.tag}</Text>
                </View>

                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {page.title}
                </Text>

                <Text
                  style={[styles.description, { color: theme.colors.text }]}
                >
                  {page.description}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.indicatorRow}>
            {pages.map((_, index) => {
              const inputRange = [
                (index - 1) * screenWidth,
                index * screenWidth,
                (index + 1) * screenWidth,
              ];
              const width = scrollX.interpolate({
                inputRange,
                outputRange: [8, 30, 8],
                extrapolate: "clamp",
              });
              const color = scrollX.interpolate({
                inputRange,
                outputRange: [
                  theme.colors.border,
                  theme.colors.primary,
                  theme.colors.border,
                ],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={index}
                  style={[styles.dot, { width, backgroundColor: color }]}
                />
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.mainButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.mainButtonText}>
              {currentPage === pages.length - 1 ? "Get Started" : "Next"}
            </Text>
            <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight * 0.65, // Image takes top 65%
    overflow: "hidden",
    backgroundColor: "#000", // Black background prevents white flashes during transitions
  },
  fullImage: {
    width: screenWidth * 1.5, // 50% wider than screen to allow parallax movement
    height: "100%",
    marginLeft: -screenWidth * 0.25, // Center the extra width
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  topHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 50,
    right: 24,
    zIndex: 20,
  },
  skipPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.42,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  contentArea: {
    flex: 1,
    position: "relative",
  },
  slideContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  tagContainer: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.6,
    maxWidth: "95%",
  },
  footer: {
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  indicatorRow: {
    flexDirection: "row",
    marginBottom: 24,
    height: 8, // Slightly taller for better visual
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;
