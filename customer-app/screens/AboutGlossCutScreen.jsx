import React, { useRef, useEffect, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ChevronLeft,
  ShieldCheck,
  Star,
  Target,
  Smartphone
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

const Header = memo(({ onBack, insets }) => (
  <View
    style={[styles.headerOuterContainer, { paddingTop: Math.max(insets.top, 16) }]}
    accessibilityRole="header"
  >
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>About Platform</Text>
      <View style={{ width: normalize(40) }} />
    </View>
  </View>
));

export default function AboutGlossCutScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(4)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  const sections = [
    {
      title: "Our Mission",
      content: "To revolutionize the grooming industry by providing a seamless, premium booking experience that bridges the gap between top-tier barbers and clients seeking excellence."
    },
    {
      title: "The Platform",
      content: "Built with cutting-edge technology, GlossCut acts as your personal digital concierge, ensuring you have access to the finest grooming services at your fingertips without any upfront costs."
    },
    {
      title: "Quality Assurance",
      content: "While we serve as an aggregator, we partner exclusively with verified professionals to maintain a standard and reliability."
    },
    {
      title: "Data Privacy",
      content: "Your personal identity and booking data are protected by state-of-the-art encryption. We believe your information is yours alone."
    }
  ];

  useEffect(() => {
    const animations = itemAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(itemFades[i], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );

    Animated.stagger(100, animations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  const handleGoBack = () => navigation.goBack();

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header onBack={handleGoBack} insets={insets} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + normalize(40) }]}
      >
        <View style={styles.centeredContentWrapper}>
          {/* 1. Hero Visual */}
          <Animated.View style={[styles.illustrationContainer, { transform: [{ translateY: floatAnim }] }, animatedStyle(0)]}>
            <Image
              source={require("../assets/about_glosscut_cartoon.png")}
              style={styles.illustration}
              resizeMode="contain"
              accessibilityLabel="GlossCut Illustration"
            />
          </Animated.View>

          {/* 2. Text Header */}
          <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
            <Text style={styles.title}>About GlossCut</Text>
            <Text style={styles.subtitle}>
              The premier aggregator for elite grooming and styling. Discover, book, and experience excellence.
            </Text>
          </Animated.View>

          {/* 3. Cards */}
          <Animated.View style={[styles.usageContainer, animatedStyle(2)]}>
            {sections.map((section, index) => (
              <View key={index} style={styles.usageItem}>
                <View style={styles.usageTextContent}>
                  <Text style={styles.usageTitle}>{section.title}</Text>
                  <Text style={styles.usageDesc}>{section.content}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* 3.5 Founder Section */}
          <Animated.View style={[styles.founderCard, animatedStyle(2)]}>
            <View style={styles.founderHeader}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                style={styles.founderAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.founderSubtitle}>Concept Founder</Text>
                <Text style={styles.founderTitle}>Om Bhaulal Patil</Text>
              </View>
            </View>
            <Text style={styles.founderContent}>
              The concept of GlossCut was originally conceived and founded by an independent idea generator. This platform was born from a vision to modernize and elevate the grooming experience.
            </Text>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                Legal Note: The concept founder acts solely as the original idea generator and is not legally affiliated with the current operations, management, or execution of the GlossCut platform. The founder holds no liability for any events or outcomes arising from the use of this app.
              </Text>
            </View>
          </Animated.View>

          {/* 4. Footer Note */}
          <Animated.View style={[styles.noteContainer, animatedStyle(3)]}>
            <View style={styles.noteHeader}>
              <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.noteTitle}>VERSION INFO</Text>
            </View>
            <Text style={styles.noteText}>
              GlossCut Customer App Version 1.0.0 Designed and engineered for the modern aesthetic.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  headerOuterContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    maxWidth: 500,
    width: "100%",
    alignSelf: "center"
  },
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  scrollContent: {
    paddingTop: normalize(10),
    width: "100%"
  },
  centeredContentWrapper: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: normalize(24)
  },
  illustrationContainer: {
    width: "100%",
    height: normalize(140),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(20)
  },
  illustration: {
    width: "85%",
    height: "100%"
  },
  textContainer: {
    marginBottom: normalize(28)
  },
  title: {
    fontSize: normalize(24),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
    marginBottom: normalize(10),
    textAlign: "center"
  },
  subtitle: {
    fontSize: normalize(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: normalize(20),
    fontWeight: "500",
    paddingHorizontal: normalize(10)
  },
  usageContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: normalize(20),
    padding: normalize(20),
    marginBottom: normalize(30),
    gap: normalize(22),
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageItem: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  usageTextContent: {
    flex: 1
  },
  usageTitle: {
    fontSize: normalize(14),
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: normalize(4)
  },
  usageDesc: {
    fontSize: normalize(12),
    color: "#64748B",
    fontWeight: "500",
    lineHeight: normalize(18)
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7"
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    marginBottom: normalize(8)
  },
  noteTitle: {
    fontSize: normalize(11),
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1
  },
  noteText: {
    fontSize: normalize(11),
    color: "#166534",
    lineHeight: normalize(18),
    fontWeight: "500"
  },
  founderCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: normalize(20),
    padding: normalize(20),
    marginBottom: normalize(30),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  founderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(12),
  },
  founderAvatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    marginRight: normalize(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  founderTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0F172A",
  },
  founderSubtitle: {
    fontSize: normalize(10),
    color: "#E21D25",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  founderContent: {
    fontSize: normalize(12),
    color: "#475569",
    lineHeight: normalize(18),
    marginBottom: normalize(16),
    fontWeight: "500",
  },
  disclaimerBox: {
    backgroundColor: "#F8FAFC",
    padding: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  disclaimerText: {
    fontSize: normalize(10),
    color: "#64748B",
    lineHeight: normalize(15),
    fontStyle: "italic",
    fontWeight: "500",
  }
});
