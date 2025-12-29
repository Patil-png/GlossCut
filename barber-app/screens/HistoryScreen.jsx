// gradient of card on history page is on line 77


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Animated, // Import Animated
} from 'react-native';
import { MapPin, Star, Calendar, ChevronLeft, Clock, User, Users, Image as IconImage } from 'lucide-react-native'; // Added Clock, User, Users, IconImage
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns'; // Import format from date-fns

// Moved AnimatedTripCard outside HistoryScreen to prevent re-creation on every render
const AnimatedTripCard = ({ trip, index, navigation, theme, styles, format }) => {
  const animValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [animValue, index]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          backgroundColor: '#28a745', // Green
          borderColor: '#28a745',
        };
      case 'cancelled':
        return {
          backgroundColor: '#dc3545', // Red
          borderColor: '#dc3545',
        };
      case 'pending':
        return {
          backgroundColor: '#ffc107', // Yellow
          borderColor: '#ffc107',
        };
      default:
        return {
          backgroundColor: theme.colors.textSecondary,
          borderColor: theme.colors.textSecondary,
        };
    }
  };

  return (
    <Animated.View style={{ opacity: animValue, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingDetail', { booking: trip })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ffffffff', '#dbdbdbff']}
          style={[styles.card, { shadowColor: theme.colors.text }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.barberImageContainer}>
              {/* Placeholder for barber image */}
              <IconImage size={40} color={theme.colors.primary} />
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {trip.service}
                </Text>
                <Text style={[styles.price, { color: theme.colors.primary }]}>
                  ₹{trip.fare}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <User size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  Barber: {trip.barberId ? trip.barberId.name : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Calendar size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {trip.date ? `${format(new Date(trip.date), 'MMM dd, yyyy')} at ${trip.time}` : 'Date not available'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusContainer, getStatusStyle(trip.status)]}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HistoryScreen = () => {
  const { theme } = useTheme();
  const { user, token, isLoading: authIsLoading } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchTripHistory = async () => {
    // Please replace YOUR_COMPUTER_IP with your actual IP address.
    const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/history`;
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTrips(data);
      } else {
        throw new Error(data.message || 'Failed to fetch trip history');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authIsLoading) {
      if (user && token) {
        fetchTripHistory();
      } else {
        setLoading(false);
      }
    }
    setTimeout(() => {
      setShowAnimation(false);
    }, 1500);
  }, [user, token, authIsLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripHistory();
  };

  const renderTripCard = ({ item: trip, index }) => (
    <AnimatedTripCard trip={trip} index={index} navigation={navigation} theme={theme} styles={styles} format={format} />
  );

  if (showAnimation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/History.json')}
            autoPlay
            loop
            style={{ width: 350, height: 350 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>Loading trip history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Error</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={[styles.bookButtonText, { color: theme.colors.background }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (trips.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <MapPin size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No activity yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Your completed Appointments will appear here
          </Text>
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={[styles.bookButtonText, { color: theme.colors.background }]}>Book a new appointment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Appointment History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.card}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: 25,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30, // Extra space for status badge
  },
  barberImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default HistoryScreen;
