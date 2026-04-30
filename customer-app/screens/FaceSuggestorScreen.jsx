import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Stars,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Zap,
  Target,
  ShieldCheck,
  Award,
  BookOpen,
  Fingerprint
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get("window");

// --- TYPEWRITER COMPONENT ---
const TypewriterText = ({ text, style, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const index = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    index.current = 0;
    const interval = setInterval(() => {
      if (index.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index.current));
        index.current += 1;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={style}>{displayedText}<Text style={{ opacity: 0.5 }}>|</Text></Text>;
};

// --- MODERN ALERT COMPONENT ---
const ModernAlert = ({ visible, message, type, onClose }) => {
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + (Platform.OS === 'android' ? 10 : 0);
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: topOffset, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => handleClose(), 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -150, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (onClose && visible) onClose();
    });
  };

  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle color="#fff" size={20} fill="#4C763B" />;
      case "error": return <AlertTriangle color="#fff" size={20} fill="#ef4444" />;
      default: return <Info color="#fff" size={20} fill="#3b82f6" />;
    }
  };

  return (
    <Animated.View style={[styles.alertContainer, { transform: [{ translateY }], opacity, backgroundColor: theme.colors.card, shadowColor: "#000", borderColor: theme.colors.border + "40" }]}>
      <View style={styles.alertContent}>
        <View style={styles.alertIconWrapper}>{getIcon()}</View>
        <View style={styles.alertTextWrapper}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{type === "success" ? "System Confirmed" : type === "error" ? "System Error" : "System Note"}</Text>
          <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleClose}><X size={18} color={theme.colors.textSecondary} /></TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// --- INSANE SCANNING HUD COMPONENT ---
const BiometricScan = ({ active }) => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2500, easing: Easing.linear, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{
              translateY: scanAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, width * 0.85]
              })
            }]
          }
        ]}
      />

      {/* HUD Points with Pulsing */}
      <Animated.View style={[styles.hudPoint, { top: '25%', left: '30%', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.hudPoint, { top: '25%', right: '30%', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.hudPoint, { bottom: '40%', left: '50%', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.hudPoint, { bottom: '30%', left: '35%', transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.hudPoint, { bottom: '30%', right: '35%', transform: [{ scale: pulseAnim }] }]} />

      {/* Corner brackets */}
      <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View style={[styles.corner, { bottom: 20, left: 20, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.corner, { bottom: 20, right: 20, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </View>
  );
};

const FaceSuggestorScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [usesLeft, setUsesLeft] = useState(user?.faceSuggestorUses ?? 2);
  const [alertConfig, setAlertConfig] = useState({ visible: false, message: "", type: "info" });

  const showAlert = useCallback((message, type = "info") => setAlertConfig({ visible: true, message, type }), []);
  const closeAlert = useCallback(() => setAlertConfig((prev) => ({ ...prev, visible: false })), []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) { setImage(result.assets[0].uri); setSuggestions(null); setAnalysis(null); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return showAlert("Camera permission needed", "error");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) { setImage(result.assets[0].uri); setSuggestions(null); setAnalysis(null); }
  };

  const getSuggestions = async () => {
    if (!image) return showAlert("Initialize scanner first.");
    if (usesLeft <= 0) return showAlert("Neural limit reached.", "error");

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: image, type: 'image/jpeg', name: 'face.jpg' });
      const response = await api.post('/api/ai/suggest', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(response.data.analysis);
      setSuggestions(response.data.suggestions);
      setUsesLeft(response.data.usesLeft);
      showAlert("Inference Cycle Complete", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Inference failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.card }]}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerIndicator}>
          <Fingerprint size={14} color="#4C763B" />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>NEURAL V3.0</Text>
        </View>
        <LinearGradient colors={['#4C763B', '#15803d']} style={styles.usesBadge}>
          <Text style={styles.usesText}>{usesLeft} SCANS</Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Facial Inference <Stars size={24} color="#4C763B" /></Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Deploying advanced neural networks to map your unique structural signature.</Text>
        </View>

        <View style={styles.imageSection}>
          <TouchableOpacity
            style={[styles.imageCard, { backgroundColor: '#000', borderColor: '#4C763B30' }]}
            onPress={image ? null : pickImage}
            activeOpacity={0.9}
          >
            {image ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <BiometricScan active={processing} />
                {processing && (
                  <View style={styles.processingOverlay}>
                    <LottieView source={require("../assets/Scanning.json")} autoPlay loop style={styles.scanningLottie} />
                    <View style={styles.terminalContainer}>
                      <Text style={styles.terminalText}>{'>'} BOOTING SELECTION ENGINE</Text>
                      <Text style={styles.terminalText}>{'>'} RUNNING STRUCTURAL ANALYSIS</Text>
                      <Text style={[styles.terminalText, { color: '#4C763B' }]}>{'>'} MAPPING VECTORS...</Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImage} onPress={() => { setImage(null); setSuggestions(null); setAnalysis(null); }}>
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <Target size={64} color="#4C763B" style={{ opacity: 0.3 }} />
                <Text style={[styles.uploadText, { color: '#fff' }]}>MOUNT SENSOR</Text>
                <Text style={[styles.uploadSubtext, { color: '#666' }]}>Position facial data within brackets</Text>
              </View>
            )}
          </TouchableOpacity>

          {!image && (
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card }]} onPress={takePhoto}>
                <Camera size={20} color="#4C763B" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>SENSOR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card }]} onPress={pickImage}>
                <ImageIcon size={20} color="#4C763B" />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>ARCHIVE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {image && !suggestions && !processing && (
          <TouchableOpacity style={styles.primaryBtnWrapper} onPress={getSuggestions}>
            <LinearGradient colors={['#4C763B', '#0f766e']} style={styles.gradientBtn}>
              <Fingerprint size={24} color="#fff" />
              <Text style={styles.primaryBtnText}>INITIATE FULL SCAN</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {analysis && (
          <View style={styles.reportContainer} key={analysis.stylistNote}>
            <LinearGradient colors={['#0a0a0a', '#111']} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <ShieldCheck size={20} color="#4C763B" />
                <Text style={[styles.reportTitle, { color: '#fff' }]}>BIOMETRIC MANIFEST</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{Math.round(analysis.confidence * 100)}% LOAD</Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>GEOMETRY</Text>
                  <Text style={[styles.metricValue, { color: '#fff' }]}>{analysis.faceShape}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CONFIDENCE</Text>
                  <Text style={[styles.metricValue, { color: '#fff' }]}>{Math.round(analysis.confidence * 100)}%</Text>
                </View>
                <View style={[styles.metricItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.metricLabel}>ARCHETYPE</Text>
                  <Text style={[styles.metricValue, { color: '#4C763B' }]}>{analysis.archetype}</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <BookOpen size={16} color="#888" />
                <TypewriterText
                  text={analysis.stylistNote}
                  style={[styles.stylistNote, { color: '#ccc' }]}
                />
              </View>
            </LinearGradient>

            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsSectionTitle, { color: theme.colors.text }]}>// RECOMMENDED PROFILES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
                {suggestions.hairstyles.map((style, idx) => (
                  <Animated.View key={idx} style={[styles.styleCard, { backgroundColor: '#0a0a0a', borderColor: '#4C763B20' }]}>
                    <Image source={{ uri: style.image }} style={styles.styleImage} />
                    <View style={styles.styleDetails}>
                      <Text style={[styles.styleName, { color: '#fff' }]}>{style.name}</Text>
                      <Text style={styles.archetypeLabel}>{style.archetype}</Text>
                    </View>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Search', { q: style.name })}>
                      <Calendar size={14} color="#fff" />
                      <Text style={styles.bookBtnText}>DEPLOY STYLE</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={() => { setImage(null); setSuggestions(null); setAnalysis(null); }}>
              <Text style={{ color: '#666', fontWeight: '900', letterSpacing: 2 }}>RE-INITIALIZE CORE</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ModernAlert visible={alertConfig.visible} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { width: 44, height: 44, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  usesBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  usesText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  topInfo: { alignItems: 'center', marginVertical: 35 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -1.5 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 22, opacity: 0.6, paddingHorizontal: 30 },
  imageSection: { width: '100%', marginVertical: 10 },
  imageCard: { width: '100%', aspectRatio: 1, borderRadius: 45, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewContainer: { width: '100%', height: '100%', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  terminalContainer: { marginTop: 20, width: '80%' },
  terminalText: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  scanningLottie: { width: 140, height: 140 },
  removeImage: { position: 'absolute', top: 25, right: 25, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#4C763B', shadowColor: '#4C763B', shadowOpacity: 1, shadowRadius: 15, elevation: 10, zIndex: 10 },
  hudPoint: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#4C763B', shadowColor: '#4C763B', shadowOpacity: 1, shadowRadius: 5 },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#4C763B', opacity: 0.5 },
  placeholderContent: { alignItems: 'center' },
  uploadText: { fontSize: 24, fontWeight: '900', marginTop: 20, letterSpacing: 3 },
  uploadSubtext: { fontSize: 12, opacity: 0.5, marginTop: 8, letterSpacing: 1 },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 25 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 30, paddingVertical: 16, borderRadius: 22 },
  actionText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  primaryBtnWrapper: { marginTop: 35, borderRadius: 30, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingVertical: 25 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  reportContainer: { marginTop: 40 },
  reportCard: { borderRadius: 40, padding: 30, borderWidth: 1, borderColor: '#4C763B30', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  reportTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginLeft: 12, flex: 1 },
  confidenceBadge: { backgroundColor: '#4C763B20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  confidenceText: { color: '#4C763B', fontSize: 9, fontWeight: '900' },
  metricsGrid: { flexDirection: 'row', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metricItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metricLabel: { fontSize: 8, fontWeight: '900', color: '#666', marginBottom: 6, letterSpacing: 1 },
  metricValue: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  noteBox: { marginTop: 25, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 25, minHeight: 120 },
  stylistNote: { flex: 1, fontSize: 14, fontStyle: 'italic', lineHeight: 22, color: '#aaa' },
  resultsContainer: { marginTop: 50 },
  resultsSectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 3, marginBottom: 25, opacity: 0.5 },
  styleScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  styleCard: { width: 220, borderRadius: 35, overflow: 'hidden', padding: 10, marginRight: 20, borderWidth: 1 },
  styleImage: { width: '100%', height: 240, borderRadius: 30 },
  styleDetails: { padding: 15 },
  styleName: { fontSize: 18, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  archetypeLabel: { fontSize: 9, fontWeight: '800', color: '#4C763B', textTransform: 'uppercase', letterSpacing: 1 },
  bookBtn: { backgroundColor: '#4C763B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 20, margin: 8, marginTop: 0 },
  bookBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  resetBtn: { alignSelf: 'center', marginTop: 40, padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  alertContainer: { position: "absolute", alignSelf: "center", width: width * 0.9, padding: 18, borderRadius: 22, borderWidth: 1, zIndex: 100, flexDirection: "row", alignItems: "center" },
  alertContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  alertIconWrapper: { marginRight: 15 },
  alertTextWrapper: { flex: 1, marginRight: 10 },
  alertTitle: { fontSize: 14, fontWeight: "900", marginBottom: 3, letterSpacing: 0.5 },
  alertMessage: { fontSize: 12, lineHeight: 18, opacity: 0.7 }
});

export default FaceSuggestorScreen;