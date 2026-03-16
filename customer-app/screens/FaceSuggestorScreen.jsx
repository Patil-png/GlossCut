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
  Rocket, 
  Stars, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  Download,
  Calendar
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get("window");

// --- MODERN ALERT COMPONENT ---
// Highly optimized, macro-interaction based alert system
const ModernAlert = ({ visible, message, type, onClose, topInset = 40 }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      // Entrance Animation: Springy and fast
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: topInset,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
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

  const getBgColor = () => {
    return theme.colors.card;
  };

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBgColor(),
          shadowColor: theme.colors.shadow || "#000",
          borderColor: theme.colors.border + "40",
        },
      ]}
    >
      <View style={styles.alertContent}>
        <View style={styles.alertIconWrapper}>{getIcon()}</View>
        <View style={styles.alertTextWrapper}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
            {type === "success" ? "Success" : type === "error" ? "Action Failed" : "Note"}
          </Text>
          <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={18} color={theme.colors.textSecondary} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const FaceSuggestorScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // States
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [usesLeft, setUsesLeft] = useState(user?.faceSuggestorUses ?? 2);
  const [alertConfig, setAlertConfig] = useState({ visible: false, message: "", type: "info" });

  const showAlert = useCallback((message, type = "info") => {
    setAlertConfig({ visible: true, message, type });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setSuggestions(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert("Permission to access camera is required!", "error");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setSuggestions(null);
    }
  };

  const getSuggestions = async () => {
    if (!image) {
      showAlert("Please select or take an image first.");
      return;
    }

    if (usesLeft <= 0) {
      showAlert("You have exhausted your free suggestions.", "error");
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        type: 'image/jpeg',
        name: 'face.jpg',
      });

      const response = await api.post('/api/ai/suggest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuggestions(response.data.suggestions);
      setUsesLeft(response.data.usesLeft);
      showAlert("Styles generated successfully!", "success");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to process image.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, { backgroundColor: theme.colors.card }]}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Style Suggester</Text>
        <View style={styles.usesBadge}>
          <Text style={styles.usesText}>{usesLeft} Left</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Note */}
        <View style={styles.topInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Find Your Perfect Look</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Upload a clear photo of your face, and our AI will suggest the best haircuts and beard styles for you.
          </Text>
        </View>

        {/* Image Display / Selector */}
        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={[styles.imageCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={image ? null : pickImage}
            activeOpacity={0.9}
          >
            {image ? (
              <View style={styles.previewContainer}>
                <LottieView
                  source={require("../assets/Confetti.json")}
                  autoPlay={suggestions !== null}
                  loop={false}
                  style={styles.confetti}
                />
                <Image source={{ uri: image }} style={styles.previewImage} />
                {processing && (
                  <View style={styles.overlay}>
                    <Loader2 size={40} color="#fff" />
                    <Text style={styles.overlayText}>Analysing Features...</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImage} onPress={() => {setImage(null); setSuggestions(null);}}>
                  <X color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <View style={styles.uploadIconCircle}>
                  <Camera size={32} color={theme.colors.primary} />
                </View>
                <Text style={[styles.uploadText, { color: theme.colors.text }]}>Tap to Capture or Upload</Text>
                <Text style={[styles.uploadSubtext, { color: theme.colors.textSecondary }]}>Make sure your face is clearly visible</Text>
              </View>
            )}
          </TouchableOpacity>

          {!image && (
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: theme.colors.card}]} onPress={takePhoto}>
                <Camera size={20} color={theme.colors.text} />
                <Text style={[styles.actionText, {color: theme.colors.text}]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: theme.colors.card}]} onPress={pickImage}>
                <ImageIcon size={20} color={theme.colors.text} />
                <Text style={[styles.actionText, {color: theme.colors.text}]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Button */}
        {image && !suggestions && !processing && (
          <TouchableOpacity 
            style={styles.primaryBtnWrapper} 
            onPress={getSuggestions}
          >
            <LinearGradient colors={[theme.colors.primary, "#4c669f"]} style={styles.gradientBtn}>
              <Stars size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Generate Suggestions</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Results Section */}
        {suggestions && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>AI Recommendations</Text>
            
            <View style={styles.resultBlock}>
              <Text style={[styles.blockTitle, { color: theme.colors.textSecondary }]}>Recommended Hairstyles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
                {suggestions.hairstyles.map((style, idx) => (
                  <View key={idx} style={[styles.styleCard, { backgroundColor: theme.colors.card }]}>
                    <Image source={{ uri: style.image }} style={styles.styleImage} />
                    <Text style={[styles.styleName, { color: theme.colors.text }]}>{style.name}</Text>
                    <TouchableOpacity style={styles.bookTiny} onPress={() => navigation.navigate('Search', { q: style.name })}>
                       <Text style={styles.bookTinyText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.resultBlock}>
              <Text style={[styles.blockTitle, { color: theme.colors.textSecondary }]}>Best Beard Styles</Text>
              <View style={styles.tagCloud}>
                {suggestions.beards.map((beard, idx) => (
                  <View key={idx} style={[styles.beardTag, { backgroundColor: theme.colors.primary + "15" }]}>
                    <Text style={[styles.beardText, { color: theme.colors.primary }]}>{beard}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.resetBtn, {borderColor: theme.colors.border}]} 
              onPress={() => {setImage(null); setSuggestions(null);}}
            >
              <Text style={{color: theme.colors.textSecondary, fontWeight: '700'}}>Try Another Photo</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Modern Alert */}
      <ModernAlert 
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  usesBadge: {
    backgroundColor: '#4C763B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  usesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  imageSection: {
    width: '100%',
    marginVertical: 10,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4C763B15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '800',
  },
  removeImage: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtnWrapper: {
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#4C763B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  resultsContainer: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
  },
  resultBlock: {
    marginBottom: 30,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  styleScroll: {
    flexDirection: 'row',
  },
  styleCard: {
    width: 150,
    borderRadius: 20,
    padding: 10,
    marginRight: 15,
    alignItems: 'center',
  },
  styleImage: {
    width: 130,
    height: 130,
    borderRadius: 15,
    marginBottom: 10,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookTiny: {
    backgroundColor: '#4C763B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookTinyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  beardTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  beardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  alertContainer: {
    position: "absolute",
    alignSelf: "center",
    width: width * 0.9,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
  },
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconWrapper: {
    marginRight: 14,
  },
  alertTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default FaceSuggestorScreen;