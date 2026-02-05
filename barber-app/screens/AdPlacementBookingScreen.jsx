import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';
import { Calendar, DollarSign, Video, Trash2, Image as ImageIcon, Upload, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Dimensions } from 'react-native';
import CancelSwipeButton from '../components/CancelSwipeButton';
import * as ImagePicker from 'expo-image-picker';
import { Video as VideoPlayer } from 'expo-av';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const price = 999; // Fixed price for 10 days

  useEffect(() => {
    fetchAdData();
  }, []);

  const fetchAdData = async () => {
    setLoading(true);
    setLoadingMessage('Updating ad database...');
    await fetchOverallActiveAd(); // Fetch overall active ad
    await fetchLatestAdEndDateForBarber(); // Fetch latest ad end date for the current barber
    setLoading(false);
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

  const pickMedia = async (mediaType) => {
    let result;
    if (mediaType === 'image') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7, // Reduced quality for compression
      });
    } else { // mediaType === 'video'
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7, // Reduced quality for faster upload
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720, // Compress to 720p H.264
      });
    }

    if (!result.canceled) {
      // Save the full asset (uri, fileName, type) for more robust uploads
      setSelectedMedia(result.assets[0]);
      setSelectedMediaType(mediaType);
      setVideoUrl(''); // Clear YouTube URL if media is selected
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
    if (!videoUrl && !selectedMedia) {
      Alert.alert('Error', 'Please enter a video URL or select an image/video from your gallery.');
      return;
    }
    if (startDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
      Alert.alert('Error', 'Start date cannot be in the past.');
      return;
    }
    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date.');
      return;
    }

    // Quick reachability check to fail fast and provide actionable guidance
    const isServerReachable = async (timeout = 5000) => {
      const url = `${process.env.EXPO_PUBLIC_API_URL}/api/test/ping`;
      try {
        const res = await Promise.race([
          fetch(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
        ]);
        return res && res.ok;
      } catch (err) {
        return false;
      }
    };

    const reachable = await isServerReachable();
    if (!reachable) {
      Alert.alert(
        'Server Unreachable',
        `Could not reach the backend at ${process.env.EXPO_PUBLIC_API_URL}. Check that the server is running, accessible from your device, and that any firewalls allow connections. You can also try using ngrok or Expo Tunnel.`,
        [
          { text: 'Retry', onPress: () => handleBookAd() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Preparing your ad data...');
      const formData = new FormData();
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());
      formData.append('price', price);
      formData.append('status', 'pending');

      if (selectedMedia) {
        // selectedMedia is an asset object from expo ImagePicker
        const uri = selectedMedia.uri || selectedMedia;
        // Derive filename and mime type
        const fallbackExtMatch = uri && uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = selectedMedia.fileName ? selectedMedia.fileName.split('.').pop() : (fallbackExtMatch ? fallbackExtMatch[1] : (selectedMediaType === 'image' ? 'jpg' : 'mp4'));
        const mimeMap = {
          mp4: 'video/mp4',
          mov: 'video/quicktime',
          mkv: 'video/x-matroska',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
        };
        const mime = (selectedMedia.type && selectedMedia.type.includes('/') ? selectedMedia.type : (mimeMap[ext.toLowerCase()] || `${selectedMediaType}/${ext}`)) || `application/octet-stream`;
        const fileName = selectedMedia.fileName || `ad_media_${Date.now()}.${ext}`;

        console.log('Preparing media upload (attempting blob fetch):', { uri, fileName, mime, selectedMediaType, selectedMedia });

        // Use RN file object (uri, name, type) which is reliable on Android/iOS
        try {
          formData.append('media', {
            uri,
            name: fileName,
            type: mime,
          });
          console.log('Appended RN file object to FormData for upload (uri,name,type)');
        } catch (err) {
          // As a last resort try blob fetch (mostly for web-like environments)
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const finalBlob = blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: mime });
            formData.append('media', finalBlob, fileName);
            console.log('Appended blob to FormData for upload (fallback)');
          } catch (fetchErr) {
            console.warn('Both RN file object and blob fetch failed for upload:', fetchErr.message || fetchErr);
          }
        }
      } else if (videoUrl) {
        formData.append('videoUrl', videoUrl);
      }

      // If we appended a media (file), use fetch for multipart uploads (axios+RN has boundary issues)
      if (selectedMedia) {
        setLoadingMessage('Uploading large media to cloud storage (This may take 1-2 mins depending on size)...');
        const token = await SecureStore.getItemAsync('token');
        const url = `${process.env.EXPO_PUBLIC_API_URL}/api/ads`;
        console.log('Uploading via fetch to', url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const resJson = await fetchRes.json();
        setLoadingMessage('Finalizing upload...');
        if (!fetchRes.ok) {
          console.error('Fetch upload failed:', fetchRes.status, resJson);
          throw { response: { data: resJson } };
        }

        console.log('✅ Upload successful, showing success alert');
        Alert.alert('Success', 'Ad placement booked successfully! You will be redirected to payment.', [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigate to PaymentScreen');
              navigation.navigate('PaymentScreen', { adPlacementId: resJson._id, amount: price });
              fetchAdData(); // Refresh ads after booking
              setSelectedMedia(null);
              setSelectedMediaType(null);
              setVideoUrl('');
            }
          }
        ]);
      } else {
        setLoadingMessage('Booking ad with remote URL...');
        console.log('Sending API call for YouTube ad...');
        const response = await api.post('/api/ads', formData);
        if (response.data) {
          console.log('✅ Ad booked successfully (URL)');
          Alert.alert('Success', 'Ad placement booked successfully! You will be redirected to payment.', [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('PaymentScreen', { adPlacementId: response.data._id, amount: price });
                fetchAdData(); // Refresh ads after booking
                setSelectedMedia(null);
                setSelectedMediaType(null);
                setVideoUrl('');
              }
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Ad booking error:', error.response?.data || error.message, error);
      // Network/timeouts
      if (error.isNetworkError || error.message?.toLowerCase?.().includes('network')) {
        Alert.alert(
          'Network Error',
          'Failed to reach the server. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handleBookAd() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
      } else {
        const message = error.response?.data?.msg || error.response?.data?.error || error.customMessage || error.message || 'Failed to book ad placement. Please try again.';
        Alert.alert('Error', message);
      }
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
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>{loadingMessage}</Text>
        </View>
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

          <View style={styles.sectionDivider}>
            <Text style={[styles.sectionTitleSmall, { color: theme.colors.text }]}>CHOOSE MEDIA TYPE</Text>
          </View>

          <View style={styles.mediaOptionsRow}>
            <TouchableOpacity
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
              {selectedMediaType === 'image' && <View style={[styles.activeDot, { backgroundColor: theme.colors.primary }]} />}
            </TouchableOpacity>

            <TouchableOpacity
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
              {selectedMediaType === 'video' && <View style={[styles.activeDot, { backgroundColor: theme.colors.primary }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaTypeCard,
                { backgroundColor: theme.colors.card, borderColor: videoUrl ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={() => setSelectedMediaType('youtube')}
            >
              <View style={[styles.mediaIconCircle, { backgroundColor: videoUrl ? theme.colors.primary + '15' : theme.colors.background }]}>
                <Video size={24} color={videoUrl ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.mediaTypeText, { color: videoUrl ? theme.colors.primary : theme.colors.text }]}>YouTube</Text>
              {videoUrl ? <View style={[styles.activeDot, { backgroundColor: theme.colors.primary }]} /> : null}
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
              colors={[theme.colors.primary, theme.colors.primary + 'DD']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Confirm & Book Placement</Text>
              <ChevronRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
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
  },
});
