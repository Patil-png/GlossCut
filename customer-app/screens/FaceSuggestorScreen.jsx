import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
  Image,
} from "react-native";
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
  BookOpen
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get("window");

// --- MODERN ALERT COMPONENT ---
const ModernAlert = ({ visible, message, type, onClose, topInset = 40 }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: topInset, friction: 6, tension: 50, useNativeDriver: true }),
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
      case "success": return <CheckCircle color="#fff" size={20} fill={theme.colors.success || "#22c55e"} />;
      case "error": return <AlertTriangle color="#fff" size={20} fill={theme.colors.error || "#ef4444"} />;
      default: return <Info color="#fff" size={20} fill={theme.colors.primary || "#3b82f6"} />;
    }
  };

  return (
    <Animated.View style={[styles.alertContainer, { transform: [{ translateY }], opacity, backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow || "#000", borderColor: theme.colors.border + "40" }]}>
      <View style={styles.alertContent}>
        <View style={styles.alertIconWrapper}>{getIcon()}</View>
        <View style={styles.alertTextWrapper}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{type === "success" ? "Success" : type === "error" ? "Action Failed" : "Note"}</Text>
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
  
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
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
                outputRange: [0, width * 0.8] 
              }) 
            }] 
          }
        ]} 
      />
      {/* Decorative HUD points */}
      <View style={[styles.hudPoint, { top: '25%', left: '30%' }]} />
      <View style={[styles.hudPoint, { top: '25%', right: '30%' }]} />
      <View style={[styles.hudPoint, { bottom: '40%', left: '50%' }]} />
      <View style={[styles.hudPoint, { bottom: '20%', left: '20%' }]} />
      <View style={[styles.hudPoint, { bottom: '20%', right: '20%' }]} />
    </View>
  );
};

const FaceSuggestorScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  
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
    if (!image) return showAlert("Select an image first.");
    if (usesLeft <= 0) return showAlert("Free limit reached.", "error");

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: image, type: 'image/jpeg', name: 'face.jpg' });
      const response = await api.post('/api/ai/suggest', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(response.data.analysis);
      setSuggestions(response.data.suggestions);
      setUsesLeft(response.data.usesLeft);
      showAlert("Analysis complete!", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Analysis failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.card }]}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Neural Stylist</Text>
        <LinearGradient colors={['#4C763B', '#22c55e']} style={styles.usesBadge}>
          <Text style={styles.usesText}>{usesLeft} Left</Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]}>AI Recognition <Stars size={24} color="#f59e0b" /></Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Our neural engine analyzes biometric data to curate your ultimate visual identity.</Text>
        </View>

        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={[styles.imageCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary + "30" }]}
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
                    <Text style={styles.overlayText}>MAPPING FACIAL GEOMETRY...</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImage} onPress={() => {setImage(null); setSuggestions(null); setAnalysis(null);}}>
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <Target size={48} color={theme.colors.primary} style={{ opacity: 0.5 }} />
                <Text style={[styles.uploadText, { color: theme.colors.text }]}>Initialize Scanner</Text>
                <Text style={[styles.uploadSubtext, { color: theme.colors.textSecondary }]}>Position face within the frame</Text>
              </View>
            )}
          </TouchableOpacity>

          {!image && (
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: theme.colors.card}]} onPress={takePhoto}>
                <Camera size={20} color={theme.colors.primary} />
                <Text style={[styles.actionText, {color: theme.colors.text}]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: theme.colors.card}]} onPress={pickImage}>
                <ImageIcon size={20} color={theme.colors.primary} />
                <Text style={[styles.actionText, {color: theme.colors.text}]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {image && !suggestions && !processing && (
          <TouchableOpacity style={styles.primaryBtnWrapper} onPress={getSuggestions}>
            <LinearGradient colors={['#4C763B', '#15803d']} style={styles.gradientBtn}>
              <Award size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>START DEEP ANALYSIS</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {analysis && (
          <View style={styles.reportContainer}>
            <LinearGradient colors={[theme.colors.card, theme.colors.background]} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <ShieldCheck size={20} color={theme.colors.primary} />
                <Text style={[styles.reportTitle, { color: theme.colors.text }]}>BIOMETRIC REPORT</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{Math.round(analysis.confidence * 100)}% Match</Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>SHAPE</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{analysis.faceShape}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>JAWLINE</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{analysis.details.jawline}/10</Text>
                </View>
                <View style={[styles.metricItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.metricLabel}>ARCHETYPE</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.primary }]}>{analysis.archetype}</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <BookOpen size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.stylistNote, { color: theme.colors.textSecondary }]}>"{analysis.stylistNote}"</Text>
              </View>
            </LinearGradient>

            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsSectionTitle, { color: theme.colors.text }]}>CURATED SELECTIONS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
                {suggestions.hairstyles.map((style, idx) => (
                  <View key={idx} style={[styles.styleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Image source={{ uri: style.image }} style={styles.styleImage} />
                    <View style={styles.styleDetails}>
                      <Text style={[styles.styleName, { color: theme.colors.text }]}>{style.name}</Text>
                      <Text style={styles.archetypeLabel}>{style.archetype}</Text>
                    </View>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Search', { q: style.name })}>
                      <Calendar size={14} color="#fff" />
                      <Text style={styles.bookBtnText}>Book Style</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity style={styles.resetBtn} onPress={() => {setImage(null); setSuggestions(null); setAnalysis(null);}}>
              <Text style={{color: theme.colors.textSecondary, fontWeight: '800'}}>RE-INITIALIZE SENSOR</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ModernAlert visible={alertConfig.visible} message={alertConfig.message} type={alertConfig.type} onClose={closeAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  usesBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  usesText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  topInfo: { alignItems: 'center', marginVertical: 25 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.7, paddingHorizontal: 20 },
  imageSection: { width: '100%', marginVertical: 10 },
  imageCard: { width: '100%', aspectRatio: 1, borderRadius: 35, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewContainer: { width: '100%', height: '100%', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#fff', marginTop: 15, fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  scanningLottie: { width: 120, height: 120 },
  removeImage: { position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#4C763B', shadowColor: '#4C763B', shadowOpacity: 1, shadowRadius: 10, elevation: 5, zIndex: 5 },
  hudPoint: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#4C763B', opacity: 0.6 },
  placeholderContent: { alignItems: 'center' },
  uploadText: { fontSize: 20, fontWeight: '900', marginTop: 15 },
  uploadSubtext: { fontSize: 13, opacity: 0.6, marginTop: 5 },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 18 },
  actionText: { fontSize: 14, fontWeight: '800' },
  primaryBtnWrapper: { marginTop: 30, borderRadius: 22, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 22 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  reportContainer: { marginTop: 35 },
  reportCard: { borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(76,118,59,0.2)' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  reportTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5, marginLeft: 10, flex: 1 },
  confidenceBadge: { backgroundColor: 'rgba(76,118,59,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  confidenceText: { color: '#4C763B', fontSize: 10, fontWeight: '900' },
  metricsGrid: { flexDirection: 'row', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  metricItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  metricLabel: { fontSize: 9, fontWeight: '800', opacity: 0.5, marginBottom: 5 },
  metricValue: { fontSize: 16, fontWeight: '900' },
  noteBox: { marginTop: 20, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(0,0,0,0.03)', padding: 15, borderRadius: 15 },
  stylistNote: { flex: 1, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  resultsContainer: { marginTop: 40 },
  resultsSectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 2, marginBottom: 20, opacity: 0.8 },
  styleScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  styleCard: { width: 180, borderRadius: 25, overflow: 'hidden', padding: 8, marginRight: 20, borderWidth: 1 },
  styleImage: { width: '100%', height: 180, borderRadius: 20 },
  styleDetails: { padding: 12 },
  styleName: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  archetypeLabel: { fontSize: 10, fontWeight: '700', color: '#4C763B', textTransform: 'uppercase' },
  bookBtn: { backgroundColor: '#4C763B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, margin: 8, marginTop: 0 },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  resetBtn: { alignSelf: 'center', marginTop: 30, padding: 15 },
  alertContainer: { position: "absolute", alignSelf: "center", width: width * 0.9, padding: 16, borderRadius: 16, borderWidth: 1, zIndex: 100, flexDirection: "row", alignItems: "center" },
  alertContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  alertIconWrapper: { marginRight: 14 },
  alertTextWrapper: { flex: 1, marginRight: 10 },
  alertTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  alertMessage: { fontSize: 13, lineHeight: 18 },
});

export default FaceSuggestorScreen;