import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StatusBar, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';
import { Calendar, DollarSign, Video, Trash2, Image as ImageIcon, Upload, ChevronRight, CheckCircle2, Camera, X } from 'lucide-react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Dimensions } from 'react-native';
import CancelSwipeButton from '../components/CancelSwipeButton';
import * as ImagePicker from 'expo-image-picker';
import { Video as VideoPlayer } from 'expo-av';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ModernLoadingView = ({ message, theme, isDark }) => (
  <View style={styles.loadingContainer}>
    <MotiView
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.loadingCard}
    >
      <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.loadingBlur}>
        <LinearGradient
          colors={[theme.colors.primary + '15', 'transparent', theme.colors.primary + '05']}
          style={styles.loadingGradient}
        >
          <View style={styles.spinnerCoreContainer}>
            {/* Outer Rotating Ring */}
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{ loop: true, type: 'timing', duration: 4000, easing: Easing.linear }}
              style={[styles.outerRing, { borderColor: theme.colors.primary + '30' }]}
            />
            {/* Inner Spinner */}
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '-360deg' }}
              transition={{ loop: true, type: 'timing', duration: 3000, easing: Easing.linear }}
              style={[styles.spinnerWrapper, { backgroundColor: isDark ? theme.colors.card : '#fff' }]}
            >
              <Upload size={28} color={theme.colors.primary} />
            </MotiView>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
          >
            <Text style={[styles.loadingMsg, { color: theme.colors.text }]}>{message}</Text>
          </MotiView>

          <View style={styles.progressBarContainer}>
            <MotiView
              from={{ width: '10%' }}
              animate={{ width: '100%' }}
              transition={{ loop: true, type: 'timing', duration: 2500 }}
              style={[styles.progressBar, { backgroundColor: theme.colors.primary }]}
            />
          </View>

          <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
            Securely processing your ad media...
          </Text>
        </LinearGradient>
      </BlurView>
    </MotiView>
  </View>
);

export default function AdPlacementBookingScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null); // Stores URI of selected image/video
  const [selectedMediaType, setSelectedMediaType] = useState(null); // 'image' or 'video'
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const initialEndDate = new Date();
    initialEndDate.setDate(initialEndDate.getDate() + 9); // 10 days from today
    return initialEndDate;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [overallActiveAd, setOverallActiveAd] = useState(null); // State to store the overall active ad
  const [latestAdEndDateForBarber, setLatestAdEndDateForBarber] = useState(null); // Stores the end date of the latest booked ad for the current barber
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading ad placements...');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalMediaType, setModalMediaType] = useState('image'); // 'image' or 'video'
  const [currentBarberAd, setCurrentBarberAd] = useState(null); // The barber's own ad (paid/active/pending)
  const price = 999; // Fixed price for 10 days

  useEffect(() => {
    fetchAdData();
  }, []);

  const fetchAdData = async () => {
    setLoading(true);
    setLoadingMessage('Updating ad database...');
    await fetchOverallActiveAd();
    await fetchLatestAdEndDateForBarber();
    await fetchCurrentBarberAd();
    setLoading(false);
  };

  const fetchCurrentBarberAd = async () => {
    if (!user || !user.id) return;
    try {
      const response = await api.get(`/api/ads/barber/${user.id}`);
      if (response.data && response.data.length > 0) {
        // Find the most recent ad that is either pending payment or paid but needs media
        const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const relevant = sorted.find(ad => ad.status === 'paid' || ad.status === 'active' || ad.status === 'pending');
        setCurrentBarberAd(relevant);
      } else {
        setCurrentBarberAd(null);
      }
    } catch (error) {
      console.error('Error fetching current barber ad:', error);
    }
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchOverallActiveAd = async () => {
    try {
      const response = await api.get('/api/ads/active');
      if (response.data) {
        let adWithMedia = { ...response.data };
        if (response.data.mediaType === 'youtube') {
          adWithMedia.videoId = getYouTubeVideoId(response.data.videoUrl);
        }
        setOverallActiveAd(adWithMedia);
      } else {
        setOverallActiveAd(null);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setOverallActiveAd(null); // No active ad found
      } else {
        console.error('Error fetching overall active ad:', error.response?.data || error.message);
      }
    }
  };

  const fetchLatestAdEndDateForBarber = async () => {
    if (!user || !user.id) {
      setLatestAdEndDateForBarber(null);
      return;
    }
    try {
      const response = await api.get(`/api/ads/barber/${user.id}/latest-end-date`);
      if (response.data && response.data.latestEndDate) {
        setLatestAdEndDateForBarber(new Date(response.data.latestEndDate));
      } else {
        setLatestAdEndDateForBarber(null);
      }
    } catch (error) {
      console.error('Error fetching latest ad end date for barber:', error.response?.data || error.message);
      setLatestAdEndDateForBarber(null);
    }
  };

  const pickMedia = (mediaType) => {
    setModalMediaType(mediaType);
    setShowMediaModal(true);
  };

  const handleMediaLaunch = async (source, mediaType) => {
    setShowMediaModal(false); // Close modal before launching
    try {
      // 1. Request Permissions
      let permissionResult;
      if (source === 'gallery') {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', `We need ${source} permissions to upload media. Please enable them in settings.`);
        return;
      }

      // 2. Configure Picker
      const pickerOptions = ImagePicker.MediaType || ImagePicker.MediaTypeOptions || {};
      const actualType = mediaType === 'image' ? (pickerOptions.Images || 'images') : (pickerOptions.Videos || 'videos');

      const config = {
        mediaTypes: actualType,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        videoExportPreset: mediaType === 'video' ? ImagePicker.VideoExportPreset.H264_1280x720 : undefined,
      };

      // 3. Launch
      let result;
      if (source === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync(config);
      } else {
        result = await ImagePicker.launchCameraAsync(config);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia(result.assets[0]);
        setSelectedMediaType(mediaType);
        setVideoUrl('');
      }
    } catch (error) {
      console.error('Media Launch Error:', error);
      Alert.alert('Error', 'Failed to open media source. Please try again.');
    }
  };

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);

    // Automatically set end date 9 days after the selected start date
    const newEndDate = new Date(currentDate);
    newEndDate.setDate(newEndDate.getDate() + 9);
    setEndDate(newEndDate);
  };

  useEffect(() => {
    if (latestAdEndDateForBarber) {
      const nextAvailableDate = new Date(latestAdEndDateForBarber);
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 1); // Start date is day after latest ad ends
      setStartDate(nextAvailableDate);
      const newEndDate = new Date(nextAvailableDate);
      newEndDate.setDate(newEndDate.getDate() + 9); // 10 days from the new start date
      setEndDate(newEndDate);
    } else {
      // If no previous ad, set start date to today and end date 10 days from today
      const today = new Date();
      setStartDate(today);
      const newEndDate = new Date(today);
      newEndDate.setDate(newEndDate.getDate() + 9);
      setEndDate(newEndDate);
    }
  }, [latestAdEndDateForBarber]);

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  const handleBookAd = async () => {
    // 1. Validation Logic
    if (currentBarberAd && currentBarberAd.status === 'paid') {
      // Step 2: Media Upload Mode
      if (!videoUrl && !selectedMedia) {
        Alert.alert('Error', 'Please select media to complete your ad.');
        return;
      }
    } else {
      // Step 1: Reservation Mode - NO media validation needed here
      if (startDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
        Alert.alert('Error', 'Start date cannot be in the past.');
        return;
      }
      if (startDate >= endDate) {
        Alert.alert('Error', 'End date must be after start date.');
        return;
      }
    }

    try {
      setLoading(true);
      setLoadingMessage('Processing...');

      // CASE A: MEDIA UPLOAD (After Payment)
      if (currentBarberAd && currentBarberAd.status === 'paid') {
        setLoadingMessage('Uploading your media content...');
        let updatedMediaUrl = null;
        let finalType = null;
        let finalVidUrl = null;

        if (selectedMedia) {
          const uri = selectedMedia.uri || selectedMedia;
          const fallbackExtMatch = uri && uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
          const ext = selectedMedia.fileName ? selectedMedia.fileName.split('.').pop() : (fallbackExtMatch ? fallbackExtMatch[1] : (selectedMediaType === 'image' ? 'jpg' : 'mp4'));
          const mimeMap = {
            mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska',
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png'
          };
          const mime = (selectedMedia.type && selectedMedia.type.includes('/') ? selectedMedia.type : (mimeMap[ext.toLowerCase()] || `${selectedMediaType}/${ext}`)) || `application/octet-stream`;
          const fileName = selectedMedia.fileName || `ad_media_${Date.now()}.${ext}`;

          const isVideo = mime.startsWith('video');
          const fileSize = selectedMedia.fileSize || 0;

          // Direct Upload for large files or videos
          if (isVideo || fileSize > 5 * 1024 * 1024) {
            setLoadingMessage('Uploading large media directly...');
            const presignedRes = await api.post('/api/ads/presigned-url', { fileName, contentType: mime });
            const { signedUrl, publicUrl } = presignedRes.data;
            const blobFetch = await fetch(uri);
            const blob = await blobFetch.blob();
            await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: blob });
            updatedMediaUrl = publicUrl;
          } else {
            // Multipart upload for small images
            const uploadFd = new FormData();
            uploadFd.append('media', { uri, name: fileName, type: mime });
            const token = await SecureStore.getItemAsync('token');
            const uploadRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ads/${currentBarberAd._id}`, {
              method: 'PUT',
              headers: { 'x-auth-token': token, 'Accept': 'application/json' },
              body: uploadFd
            });
            const resJson = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(resJson.msg || 'Upload failed');
            updatedMediaUrl = resJson.mediaUrl;
          }
          finalType = isVideo ? 'video' : 'image';
        } else {
          finalVidUrl = videoUrl;
          finalType = 'youtube';
        }

        // Final Activation
        await api.put(`/api/ads/${currentBarberAd._id}`, {
          mediaUrl: updatedMediaUrl,
          videoUrl: finalVidUrl,
          mediaType: finalType,
          status: 'active'
        });

        Alert.alert('Success', 'Your ad is now LIVE! 🚀');
        fetchAdData();
        setSelectedMedia(null);
        setSelectedMediaType(null);
        setVideoUrl('');
        return;
      }

      // CASE B: RESERVATION (Before Payment)
      setLoadingMessage('Creating your reservation...');
      const reservationData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        price: price
      };

      const response = await api.post('/api/ads', reservationData);
      setLoading(false);
      navigation.navigate('PaymentScreen', { adId: response.data._id, amount: price });
      fetchAdData();
      setSelectedMedia(null);
      setSelectedMediaType(null);
      setVideoUrl('');

    } catch (error) {
      console.error('Action error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to complete action.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAd = async () => {
    if (!overallActiveAd || !overallActiveAd._id) {
      Alert.alert('Error', 'No active ad to cancel.');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this ad placement? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await api.delete(`/api/ads/${overallActiveAd._id}`);
              Alert.alert('Success', 'Ad placement cancelled successfully.');
              setOverallActiveAd(null); // Clear active ad state
              setVideoUrl(''); // Clear form fields
              setStartDate(new Date());
              const newEndDate = new Date();
              newEndDate.setDate(newEndDate.getDate() + 9);
              setEndDate(newEndDate);
            } catch (error) {
              console.error('Ad cancellation error:', error.response?.data || error.message);
              Alert.alert('Error', error.response?.data?.msg || 'Failed to cancel ad placement. Please try again.');
            } finally {
              fetchAdData(); // Refresh all ad data
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
        <ModernLoadingView message={loadingMessage} theme={theme} isDark={isDark} />
      </SafeAreaView>
    );
  }

  if (overallActiveAd) {
    const isMyAd = overallActiveAd.barberId && user && overallActiveAd.barberId?._id === user.id;
    const barberName = overallActiveAd.barberId?.name || 'Unknown Barber';
    const shopName = overallActiveAd.barberId?.shopName || 'Unknown Shop';
    const profilePicture = overallActiveAd.barberId?.profilePicture || null;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <Text style={styles.headerTitle}>
                {isMyAd ? 'Your Ad Space' : 'Reserved Space'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isMyAd ? 'Managing your active campaign' : 'Currently secured by another partner'}
              </Text>
            </LinearGradient>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 200 }}
            style={[styles.premiumCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.barberProfileInfo}>
                {profilePicture ? (
                  <Image
                    source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${profilePicture}` }}
                    style={styles.modernProfilePic}
                  />
                ) : (
                  <View style={[styles.modernProfilePic, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.profileInitials}>{barberName.charAt(0)}</Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.modernBarberName, { color: theme.colors.text }]}>{barberName}</Text>
                  <Text style={[styles.modernShopName, { color: theme.colors.textSecondary }]}>{shopName}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: overallActiveAd.status === 'active' ? '#4CAF5022' : '#FF980022' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: overallActiveAd.status === 'active' ? '#4CAF50' : '#FF9800' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: overallActiveAd.status === 'active' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {overallActiveAd.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Calendar size={18} color={theme.colors.primary} />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {format(new Date(overallActiveAd.startDate), 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={18} color={theme.colors.primary} />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {format(new Date(overallActiveAd.endDate), 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <DollarSign size={18} color={theme.colors.primary} />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Amount Paid</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>₹{overallActiveAd.price}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Video size={18} color={theme.colors.primary} />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Media Type</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text, textTransform: 'capitalize' }]}>
                    {overallActiveAd.mediaType}
                  </Text>
                </View>
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400 }}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Live Preview</Text>
            <View style={[styles.previewWrapper, { borderColor: theme.colors.border }]}>
              {overallActiveAd.mediaType === 'youtube' && overallActiveAd.videoId && (
                <YoutubeIframe
                  height={screenHeight * 0.25}
                  width={screenWidth - 40}
                  videoId={overallActiveAd.videoId}
                  play={false}
                  webViewProps={{
                    allowsFullscreenVideo: true,
                    allowsInlineMediaPlayback: true,
                  }}
                />
              )}
              {overallActiveAd.mediaType === 'image' && overallActiveAd.mediaUrl && (
                <Image
                  source={{
                    uri: (typeof overallActiveAd.mediaUrl === 'string' && overallActiveAd.mediaUrl.startsWith('http'))
                      ? overallActiveAd.mediaUrl
                      : `${process.env.EXPO_PUBLIC_API_URL}${overallActiveAd.mediaUrl}`
                  }}
                  style={styles.fullPreview}
                />
              )}
              {overallActiveAd.mediaType === 'video' && overallActiveAd.mediaUrl && (
                <VideoPlayer
                  source={{
                    uri: (typeof overallActiveAd.mediaUrl === 'string' && overallActiveAd.mediaUrl.startsWith('http'))
                      ? overallActiveAd.mediaUrl
                      : `${process.env.EXPO_PUBLIC_API_URL}${overallActiveAd.mediaUrl}`
                  }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode="cover"
                  shouldPlay={false}
                  isLooping
                  useNativeControls
                  style={styles.fullPreview}
                />
              )}
            </View>
          </MotiView>

          {isMyAd && (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 600 }}
              style={styles.actionContainer}
            >
              <CancelSwipeButton
                onSwipeSuccess={handleCancelAd}
                title="Swipe to remove ad"
                theme={theme}
                backgroundColor={theme.colors.error}
                color="#fff"
              />
            </MotiView>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Ad Placement</Text>
            <Text style={styles.headerSubtitle}>Boost your shop's visibility on the home banner</Text>
          </LinearGradient>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          style={styles.formContainer}
        >
          {latestAdEndDateForBarber && (
            <View style={[styles.infoBanner, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '33' }]}>
              <Calendar size={18} color={theme.colors.primary} />
              <Text style={[styles.bannerText, { color: theme.colors.text }]}>
                Next slot starts after <Text style={{ fontWeight: 'bold' }}>{format(latestAdEndDateForBarber, 'PPP')}</Text>
              </Text>
            </View>
          )}

          <View style={[styles.priceCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.priceInfo}>
              <DollarSign size={24} color={theme.colors.primary} />
              <View>
                <Text style={[styles.priceTag, { color: theme.colors.text }]}>₹{price}</Text>
                <Text style={[styles.priceDuration, { color: theme.colors.textSecondary }]}>for 10 days duration</Text>
              </View>
            </View>
            <CheckCircle2 size={24} color={theme.colors.primary} />
          </View>

          {(!currentBarberAd || (currentBarberAd.status !== 'active' && currentBarberAd.status !== 'paid')) && (
            <View style={[styles.infoBanner, { backgroundColor: theme.colors.primary + '10' }]}>
              <DollarSign size={20} color={theme.colors.primary} />
              <Text style={[styles.infoBannerText, { color: theme.colors.text }]}>
                Select dates below and pay to unlock media uploads.
              </Text>
            </View>
          )}

          {currentBarberAd && currentBarberAd.status === 'paid' && (
            <View style={[styles.infoBanner, { backgroundColor: '#4CAF5015' }]}>
              <CheckCircle2 size={20} color="#4CAF50" />
              <Text style={[styles.infoBannerText, { color: theme.colors.text }]}>
                Payment confirmed! Now upload your ad content.
              </Text>
            </View>
          )}

          <View style={styles.sectionDivider}>
            <Text style={[styles.sectionTitleSmall, { color: theme.colors.text }]}>CHOOSE MEDIA TYPE</Text>
          </View>

          <View style={[styles.mediaOptionsRow, (!currentBarberAd || currentBarberAd.status === 'pending') && { opacity: 0.5 }]}>
            <TouchableOpacity
              disabled={!currentBarberAd || currentBarberAd.status === 'pending'}
              style={[
                styles.mediaTypeCard,
                { backgroundColor: theme.colors.card, borderColor: selectedMediaType === 'image' ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={() => pickMedia('image')}
            >
              <View style={[styles.mediaIconCircle, { backgroundColor: selectedMediaType === 'image' ? theme.colors.primary + '15' : theme.colors.background }]}>
                <ImageIcon size={24} color={selectedMediaType === 'image' ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.mediaTypeText, { color: selectedMediaType === 'image' ? theme.colors.primary : theme.colors.text }]}>Image</Text>
              {(!currentBarberAd || currentBarberAd.status === 'pending') && <DollarSign size={12} color={theme.colors.textSecondary} style={styles.lockIcon} />}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!currentBarberAd || currentBarberAd.status === 'pending'}
              style={[
                styles.mediaTypeCard,
                { backgroundColor: theme.colors.card, borderColor: selectedMediaType === 'video' ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={() => pickMedia('video')}
            >
              <View style={[styles.mediaIconCircle, { backgroundColor: selectedMediaType === 'video' ? theme.colors.primary + '15' : theme.colors.background }]}>
                <Video size={24} color={selectedMediaType === 'video' ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.mediaTypeText, { color: selectedMediaType === 'video' ? theme.colors.primary : theme.colors.text }]}>Video</Text>
              {(!currentBarberAd || currentBarberAd.status === 'pending') && <DollarSign size={12} color={theme.colors.textSecondary} style={styles.lockIcon} />}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!currentBarberAd || currentBarberAd.status === 'pending'}
              style={[
                styles.mediaTypeCard,
                { backgroundColor: theme.colors.card, borderColor: videoUrl || selectedMediaType === 'youtube' ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={() => {
                setSelectedMediaType('youtube');
                setSelectedMedia(null);
              }}
            >
              <View style={[styles.mediaIconCircle, { backgroundColor: videoUrl ? theme.colors.primary + '15' : theme.colors.background }]}>
                <Video size={24} color={videoUrl ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.mediaTypeText, { color: videoUrl ? theme.colors.primary : theme.colors.text }]}>YouTube</Text>
              {(!currentBarberAd || currentBarberAd.status === 'pending') && <DollarSign size={12} color={theme.colors.textSecondary} style={styles.lockIcon} />}
            </TouchableOpacity>
          </View>

          <AnimatePresence>
            {(selectedMediaType === 'youtube' || videoUrl) && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 70 }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.youtubeInputWrapper}
              >
                <View style={[styles.modernInputContainer, { borderColor: theme.colors.primary, backgroundColor: theme.colors.inputBackground }]}>
                  <TextInput
                    style={[styles.modernInput, { color: theme.colors.text }]}
                    placeholder="Paste YouTube Link here..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={videoUrl}
                    onChangeText={(text) => {
                      setVideoUrl(text);
                      setSelectedMedia(null);
                      setSelectedMediaType(null);
                    }}
                    autoCapitalize="none"
                  />
                  <Video size={20} color={theme.colors.primary} />
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedMedia && (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={styles.selectedPreviewBox}
              >
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewLabel, { color: theme.colors.text }]}>Selected {selectedMediaType}</Text>
                  <TouchableOpacity onPress={() => { setSelectedMedia(null); setSelectedMediaType(null); }}>
                    <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>Change</Text>
                  </TouchableOpacity>
                </View>
                {selectedMediaType === 'image' ? (
                  <Image source={{ uri: selectedMedia?.uri || selectedMedia }} style={styles.formMediaPreview} />
                ) : (
                  <VideoPlayer
                    source={{ uri: selectedMedia?.uri || selectedMedia }}
                    style={styles.formMediaPreview}
                    useNativeControls
                    resizeMode="cover"
                  />
                )}
              </MotiView>
            )}
          </AnimatePresence>

          <View style={styles.sectionDivider}>
            <Text style={[styles.sectionTitleSmall, { color: theme.colors.text }]}>SCHEDULE</Text>
          </View>

          <View style={styles.dateGrid}>
            <TouchableOpacity
              style={[styles.modernDateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Calendar size={18} color={theme.colors.primary} />
              <View style={styles.dateBoxText}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Starts On</Text>
                <Text style={[styles.dateValue, { color: theme.colors.text }]}>{format(startDate, 'MMM d, yyyy')}</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.modernDateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, opacity: 0.6 }]}>
              <Calendar size={18} color={theme.colors.textSecondary} />
              <View style={styles.dateBoxText}>
                <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Ends On (Fixed)</Text>
                <Text style={[styles.dateValue, { color: theme.colors.textSecondary }]}>{format(endDate, 'MMM d, yyyy')}</Text>
              </View>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              minimumDate={latestAdEndDateForBarber ? new Date(latestAdEndDateForBarber.getTime() + 24 * 60 * 60 * 1000) : new Date()}
            />
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBookAd}
            style={styles.primaryActionButton}
          >
            <LinearGradient
              colors={[
                (currentBarberAd && currentBarberAd.status === 'paid') ? '#4CAF50' : theme.colors.primary,
                (currentBarberAd && currentBarberAd.status === 'paid') ? '#45a049' : theme.colors.primary + 'DD'
              ]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {currentBarberAd && currentBarberAd.status === 'paid' ? 'Publish Ad Content' : 'Pay & Reserve Space'}
              </Text>
              {(currentBarberAd && currentBarberAd.status === 'paid') ? <Upload size={20} color="#fff" /> : <ChevronRight size={20} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      <Modal
        visible={showMediaModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMediaModal(false)}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <MotiView
            from={{ translateY: 300, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 400,
              easing: Easing.out(Easing.quad)
            }}
            style={[styles.modalContent, { backgroundColor: isDark ? theme.colors.card : '#fff' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select {modalMediaType === 'image' ? 'Image' : 'Video'}
              </Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptionRow}>
              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: isDark ? theme.colors.background : '#F8F9FA' }]}
                onPress={() => handleMediaLaunch('gallery', modalMediaType)}
              >
                <View style={[styles.modalIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
                  <ImageIcon size={28} color={theme.colors.primary} />
                </View>
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>Photo Gallery</Text>
                <Text style={[styles.modalOptionSub, { color: theme.colors.textSecondary }]}>Pick from your device</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: isDark ? theme.colors.background : '#F8F9FA' }]}
                onPress={() => handleMediaLaunch('camera', modalMediaType)}
              >
                <View style={[styles.modalIconBox, { backgroundColor: '#FF6B6B15' }]}>
                  <Camera size={28} color="#FF6B6B" />
                </View>
                <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>Take Camera Shot</Text>
                <Text style={[styles.modalOptionSub, { color: theme.colors.textSecondary }]}>Use your camera</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerGradient: {
    padding: 30,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffffCC',
    marginTop: 5,
    fontWeight: '500',
  },
  premiumCard: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  barberProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modernBarberName: {
    fontSize: 18,
    fontWeight: '700',
  },
  modernShopName: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff10',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  detailItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 5,
  },
  detailTextContainer: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitleSmall: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
  },
  previewWrapper: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#000',
    height: screenHeight * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionContainer: {
    padding: 20,
    marginTop: 10,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerText: {
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceTag: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 15,
  },
  priceDuration: {
    fontSize: 12,
    marginLeft: 15,
    marginTop: 2,
  },
  sectionDivider: {
    marginBottom: 15,
  },
  mediaOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mediaTypeCard: {
    width: (screenWidth - 60) / 3,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  mediaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  youtubeInputWrapper: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  modernInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedPreviewBox: {
    marginBottom: 25,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  formMediaPreview: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  dateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  modernDateButton: {
    width: (screenWidth - 50) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
  },
  dateBoxText: {
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  primaryActionButton: {
    marginBottom: 30,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingBlur: {
    width: '100%',
  },
  loadingGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerCoreContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  outerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  loadingMsg: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    padding: 25,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOption: {
    width: (screenWidth - 70) / 2,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalOptionSub: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.6,
  },
});
