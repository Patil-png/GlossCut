import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, Platform, StatusBar, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api'; // Assuming you have an API utility
import * as SecureStore from 'expo-secure-store';
import { Calendar, DollarSign, Video, Trash2, Image as ImageIcon, Upload } from 'lucide-react-native'; // Icons
import YoutubeIframe from 'react-native-youtube-iframe'; // Import YoutubeIframe
import { Dimensions } from 'react-native';
import CancelSwipeButton from '../components/CancelSwipeButton'; // Import CancelSwipeButton
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker
import { Video as VideoPlayer } from 'expo-av'; // Import Video component from expo-av

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
  const price = 999; // Fixed price for 10 days

  useEffect(() => {
    fetchAdData();
  }, []);

  const fetchAdData = async () => {
    setLoading(true);
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
        quality: 1,
      });
    } else { // mediaType === 'video'
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
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
        const token = await SecureStore.getItemAsync('token');
        const url = `${process.env.EXPO_PUBLIC_API_URL}/api/ads`;
        console.log('Uploading via fetch to', url);
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Accept': 'application/json',
          },
          body: formData,
        });
        const resJson = await fetchRes.json();
        if (!fetchRes.ok) {
          console.error('Fetch upload failed:', fetchRes.status, resJson);
          throw { response: { data: resJson } };
        }

        Alert.alert('Success', 'Ad placement booked successfully! You will be redirected to payment.', [
          { text: 'OK', onPress: () => navigation.navigate('PaymentScreen', { adPlacementId: resJson._id, amount: price }) }
        ]);
        fetchAdData(); // Refresh ads after booking and update latest ad end date for barber
        setSelectedMedia(null); // Clear selected media
        setSelectedMediaType(null);
        setVideoUrl('');
      } else {
        const response = await api.post('/api/ads', formData);
        if (response.data) {
          Alert.alert('Success', 'Ad placement booked successfully! You will be redirected to payment.', [
            { text: 'OK', onPress: () => navigation.navigate('PaymentScreen', { adPlacementId: response.data._id, amount: price }) }
          ]);
          fetchAdData(); // Refresh ads after booking and update latest ad end date for barber
          setSelectedMedia(null); // Clear selected media
          setSelectedMediaType(null);
          setVideoUrl('');
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
          <Text style={{ color: theme.colors.text }}>Loading ad placements...</Text>
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isMyAd ? 'Your Active Ad Placement' : 'Ad Placement Currently Booked'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isMyAd
              ? 'Your ad is currently running or pending approval.'
              : `An ad is currently booked by ${barberName}. No new ad placements can be created.`}
          </Text>

          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.barberInfoContainer}>
              {profilePicture ? (
                <Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${profilePicture}` }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.profilePicture, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.profilePictureText}>{barberName.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.barberDetails}>
                <Text style={[styles.barberName, { color: theme.colors.text }]}>{barberName}</Text>
                <Text style={[styles.shopName, { color: theme.colors.textSecondary }]}>{shopName}</Text>
              </View>
            </View>

            {overallActiveAd.mediaType === 'youtube' && (
              <View style={styles.infoRow}>
                <Video size={20} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>Video URL:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text, flexShrink: 1 }]}>{overallActiveAd.videoUrl}</Text>
              </View>
            )}
            {(overallActiveAd.mediaType === 'image' || overallActiveAd.mediaType === 'video') && (
              <View style={styles.infoRow}>
                <Upload size={20} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>Uploaded Media:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text, flexShrink: 1 }]}>{overallActiveAd.mediaUrl.split('/').pop()}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>Start Date:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{format(new Date(overallActiveAd.startDate), 'PPP')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>End Date:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{format(new Date(overallActiveAd.endDate), 'PPP')}</Text>
            </View>
            <View style={styles.infoRow}>
              <DollarSign size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>Price:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>₹{overallActiveAd.price}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: theme.colors.text, marginLeft: 30 }]}>Status:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{overallActiveAd.status}</Text>
            </View>
          </View>

          {overallActiveAd.mediaType === 'youtube' && overallActiveAd.videoId && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={[styles.label, { color: theme.colors.text, marginBottom: 10 }]}>Video Preview:</Text>
              <YoutubeIframe
                height={screenHeight * 0.3}
                width={screenWidth - 40} // Adjust width to fit padding
                videoId={overallActiveAd.videoId}
                play={false}
                webViewProps={{
                  allowsFullscreenVideo: true,
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                }}
              />
            </View>
          )}
          {overallActiveAd.mediaType === 'image' && overallActiveAd.mediaUrl && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={[styles.label, { color: theme.colors.text, marginBottom: 10 }]}>Image Preview:</Text>
              <Image source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${overallActiveAd.mediaUrl}` }} style={styles.mediaPreview} />
            </View>
          )}
          {overallActiveAd.mediaType === 'video' && overallActiveAd.mediaUrl && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={[styles.label, { color: theme.colors.text, marginBottom: 10 }]}>Video Preview:</Text>
              <VideoPlayer
                source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}${overallActiveAd.mediaUrl}` }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={false}
                isLooping
                useNativeControls
                style={styles.mediaPreview}
              />
            </View>
          )}

          {isMyAd && (
            <CancelSwipeButton
              onSwipeSuccess={handleCancelAd}
              title="Swipe to Cancel Ad"
              theme={theme}
              backgroundColor={theme.colors.error}
              color="#fff"
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Book Ad Placement</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Showcase your barber shop on the homepage banner for 10 days.
        </Text>

        {latestAdEndDateForBarber && (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginBottom: 25 }]}>
            <View style={styles.infoRow}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>Your Last Ad Booked Until:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{format(latestAdEndDateForBarber, 'PPP')}</Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary, marginTop: 10, textAlign: 'center' }]}>
              Your new ad will be booked starting from the day after this date.
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.infoRow}>
            <DollarSign size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>Price:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>₹{price} for 10 days</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Ad Media:</Text>
          <View style={styles.mediaSelectionContainer}>
            <TouchableOpacity
              style={[styles.mediaPickerButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }]}
              onPress={() => pickMedia('image')}
            >
              <ImageIcon size={20} color="#fff" style={styles.inputIcon} />
              <Text style={styles.mediaPickerButtonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaPickerButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }]}
              onPress={() => pickMedia('video')}
            >
              <Video size={20} color="#fff" style={styles.inputIcon} />
              <Text style={styles.mediaPickerButtonText}>Pick Video</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>OR</Text>

          <View style={[styles.inputContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
            <Video size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter YouTube video URL"
              placeholderTextColor={theme.colors.textSecondary}
              value={videoUrl}
              onChangeText={(text) => {
                setVideoUrl(text);
                setSelectedMedia(null); // Clear selected media if YouTube URL is entered
                setSelectedMediaType(null);
              }}
              autoCapitalize="none"
            />
          </View>

          {selectedMedia && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={[styles.label, { color: theme.colors.text, marginBottom: 10 }]}>Selected Media Preview:</Text>
              {selectedMediaType === 'image' && (
                <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} />
              )}
              {selectedMediaType === 'video' && (
                <VideoPlayer
                  source={{ uri: selectedMedia }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode="cover"
                  shouldPlay={false}
                  isLooping
                  useNativeControls
                  style={styles.mediaPreview}
                />
              )}
              <TouchableOpacity onPress={() => { setSelectedMedia(null); setSelectedMediaType(null); }} style={styles.clearMediaButton}>
                <Text style={styles.clearMediaButtonText}>Clear Media</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Start Date:</Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Calendar size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {format(startDate, 'PPP')}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              minimumDate={latestAdEndDateForBarber ? new Date(latestAdEndDateForBarber.getTime() + 24 * 60 * 60 * 1000) : new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>End Date (10 days duration):</Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
            onPress={() => setShowEndDatePicker(true)}
            disabled // End date is automatically calculated
          >
            <Calendar size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {format(endDate, 'PPP')}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={startDate}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleBookAd}
        >
          <Text style={styles.bookButtonText}>Book Ad Placement</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    marginLeft: 'auto',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'flex-start',
  },
  dateText: {
    fontSize: 16,
  },
  bookButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  mediaPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  mediaPickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  orText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mediaPreviewContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  mediaPreview: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.25,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  clearMediaButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#dc3545',
    borderRadius: 8,
  },
  clearMediaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  barberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  barberDetails: {
    flex: 1,
  },
  barberName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shopName: {
    fontSize: 16,
    opacity: 0.8,
  },
});
