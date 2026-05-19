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
  ShieldCheck
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
      <Text style={styles.headerTitle}>Legal & Policies</Text>
      <View style={{ width: normalize(40) }} />
    </View>
  </View>
));

export default function RefundPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(5)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  const sections = [
    {
      title: "Zero Upfront Payments",
      content: "GlossCut is completely free to use for booking appointments. We do not ask for your credit card, nor do we collect any money from you upfront."
    },
    {
      title: "Direct Shop Payments",
      content: "All payments for haircuts and services are handled entirely between you and the barber or salon in person, after your appointment is complete."
    },
    {
      title: "No Refunds Processed",
      content: "Because we never take any money from you, we do not process or issue refunds. Any payment disputes or service quality issues must be resolved directly with the shop owner."
    },
    {
      title: "Platform Protection & Rights",
      content: "We reserve the right to suspend or ban accounts that abuse our free booking system (e.g., repeatedly booking and not showing up) to protect our partner shops and ensure fair usage."
    },
    {
      title: "Account Deletion & Data Privacy",
      content: "When you delete your account, your personal data (name, email, phone) is archived securely for 30 days and then permanently deleted. Past reviews and bookings will remain visible but will be anonymized as 'GlossCut Member' to protect your privacy."
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
              source={require("../assets/booking_policy_cartoon.png")}
              style={styles.illustration}
              resizeMode="contain"
              accessibilityLabel="Legal Illustration"
            />
          </Animated.View>

          {/* 2. Text Header */}
          <Animated.View style={[styles.textContainer, animatedStyle(1)]}>
            <Text style={styles.title}>Booking Policy</Text>
            <Text style={styles.subtitle}>
              Please read our booking and payment guidelines carefully. By using GlossCut, you agree to these terms.
            </Text>
          </Animated.View>

          {/* 3. Policy Cards */}
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

          {/* 4. Footer Note */}
          <Animated.View style={[styles.noteContainer, animatedStyle(3)]}>
            <View style={styles.noteHeader}>
              <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.noteTitle}>AGREEMENT</Text>
            </View>
            <Text style={styles.noteText}>
              These terms constitute a legally binding agreement between you and GlossCut. Last Updated: May 2026.
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
  }
});
