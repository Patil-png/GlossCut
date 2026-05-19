import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Star as StarIcon, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../utils/api';


const CustomerReviewsScreen = ({ navigation, route }) => {
  const { shopId, shopName } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    fetchShopReviews();
  }, []);

  const fetchShopReviews = async () => {
    try {
      setLoading(true);

      // First, get the shop details to find all barbers
      const shopRes = await api.get(`/api/shop/${shopId}`);
      const shop = shopRes.data;

      const barberIds = [];
      if (shop.owner && shop.owner._id) {
        barberIds.push(shop.owner._id);
      }
      if (shop.staff && shop.staff.length > 0) {
        shop.staff.forEach(staff => {
          if (staff._id) barberIds.push(staff._id);
        });
      }

      setBarbers(shop.staff || []);

      if (barberIds.length === 0) {
        setReviews([]);
        return;
      }

      // Fetch reviews for all barbers
      const reviewPromises = barberIds.map(barberId =>
        api.get(`/api/review/barber/${barberId}`, { timeout: 10000 })
      );

      const responses = await Promise.all(reviewPromises);
      const allReviews = responses.flatMap(response => response.data);

      // Sort reviews by creation date (newest first)
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching shop reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        size={14}
        color={star <= rating ? "#FFD700" : "#ddd"}
        fill={star <= rating ? "#FFD700" : "#ddd"}
      />
    ));
  };

  const renderReviewItem = (review) => {
    const customerName = review.userId?.name || 'Anonymous';
    const customerImage = review.userId?.profilePicture;

    return (
      <View key={review._id} style={[styles.reviewCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.customerInfo}>
            {customerImage ? (
              <Image
                source={{ uri: customerImage.startsWith('http') ? customerImage : `${process.env.EXPO_PUBLIC_API_URL}${customerImage}` }}
                style={styles.customerAvatar}
              />
            ) : (
              <View style={[styles.customerAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                <User size={16} color={theme.colors.primary} />
              </View>
            )}
            <View>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {customerName}
              </Text>
              <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
                {formatDate(review.createdAt)}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            {renderStars(review.rating)}
          </View>
        </View>

        {review.title && (
          <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
            {typeof review.title === 'object' && review.title !== null ? (review.title.content || '') : String(review.title)}
          </Text>
        )}

        {review.comment && (
          <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]} numberOfLines={0}>
            {typeof review.comment === 'object' && review.comment !== null ? (review.comment.content || '') : String(review.comment)}
          </Text>
        )}

        {review.barberResponse && (
          <View style={[styles.barberResponse, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.responseLabel, { color: theme.colors.primary }]}>
              Barber Response:
            </Text>
            <Text style={[styles.responseText, { color: theme.colors.text }]}>
              {typeof review.barberResponse === 'object' && review.barberResponse !== null ? (review.barberResponse.content || '') : String(review.barberResponse)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, {
        backgroundColor: theme.colors.card,
        paddingTop: Math.max(insets.top, 10)
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {shopName} Reviews
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {reviews.length} reviews
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading reviews...
            </Text>
          </View>
        ) : reviews.length > 0 ? (
          reviews.map(renderReviewItem)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Reviews Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Be the first to leave a review for this shop!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  backButton: {
    marginRight: 16,
    padding: 8
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2
  },
  content: {
    flex: 1
  },
  scrollContent: {
    padding: 20
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24
  },
  reviewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12
  },
  barberResponse: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20
  }
});

export default CustomerReviewsScreen;
