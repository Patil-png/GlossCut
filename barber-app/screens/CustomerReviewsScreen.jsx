import React, { useState, useEffect, Fragment, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { format } from 'date-fns';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 1. Custom Animated Toast Component ---
const ToastNotification = ({ message, type, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 50
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide && onHide());
  };

  if (!visible) return null;

  const bgColors = {
    success: '#059669', // Deep Emerald
    error: '#DC2626',   // Deep Red
    info: '#2563EB',    // Deep Blue
  };

  const icons = {
    success: 'check-circle',
    error: 'alert-triangle',
    info: 'info',
  };

  return (
    <Animated.View style={[styles.toastWrapper, { transform: [{ translateY }] }]}>
      <View style={styles.toastContainer}>
        <View style={[styles.toastIconBox, { backgroundColor: bgColors[type] || bgColors.info }]}>
          <Feather name={icons[type] || 'info'} size={20} color="#FFF" />
        </View>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const CustomerReviewsScreen = ({ navigation, route }) => {
  const { customerId, customerName } = route.params;
  const { user, token } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const [responseInput, setResponseInput] = useState('');
  const [respondingToReviewId, setRespondingToReviewId] = useState(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const fetchCustomerReviews = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setErrorState(false);

    try {
      const res = await api.get(`/api/review/customer/${customerId}/barber/${user.id}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching customer reviews:", err);
      setErrorState(true);
      if (refreshing) {
        showToast('Connection unstable. Could not update.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, customerId, user, refreshing]);

  useEffect(() => {
    if (token && customerId && user?.id) {
      fetchCustomerReviews();
    }
  }, [fetchCustomerReviews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomerReviews();
  }, [fetchCustomerReviews]);

  const toggleResponseInput = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (respondingToReviewId === id) {
      setRespondingToReviewId(null);
      setResponseInput('');
    } else {
      setRespondingToReviewId(id);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseInput.trim()) {
      showToast('Please enter a response.', 'error');
      return;
    }
    setIsSubmittingResponse(true);
    try {
      await api.put(`/api/review/${reviewId}/respond`, { barberResponse: responseInput });
      showToast('Response sent successfully!', 'success');
      setResponseInput('');
      setRespondingToReviewId(null);
      fetchCustomerReviews();
    } catch (err) {
      showToast('Failed to send response.', 'error');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userMeta}>
          <Image
            source={{ uri: item.userId?.profilePicture || 'https://ui-avatars.com/api/?background=random&name=' + (item.userId?.name || 'User') }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{item.userId?.name || 'Customer'}</Text>
            <Text style={styles.timestamp}>{format(new Date(item.createdAt), 'd MMM yyyy')}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingValue}>{item.rating}</Text>
          <Ionicons name="star" size={10} color="#FFD700" />
        </View>
      </View>

      <View style={styles.commentContainer}>
        <Text style={styles.commentText}>
          {item.comment ? String(item.comment) : 'No comment.'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        {item.barberResponse ? (
          <View style={styles.respondedContainer}>
            <View style={styles.respondedHeader}>
              <View style={styles.blueDot} />
              <Text style={styles.respondedLabel}>Response Sent</Text>
            </View>
            <Text style={styles.respondedText}>{item.barberResponse}</Text>
          </View>
        ) : (
          <View>
            {respondingToReviewId === item._id ? (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputField}
                  placeholder="Write your reply here..."
                  placeholderTextColor="#9CA3AF"
                  value={responseInput}
                  onChangeText={setResponseInput}
                  multiline
                  autoFocus
                />
                <View style={styles.inputActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => toggleResponseInput(item._id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => handleRespond(item._id)}
                    disabled={isSubmittingResponse}
                  >
                    {isSubmittingResponse ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Reply</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => toggleResponseInput(item._id)}
              >
                <Feather name="corner-down-right" size={16} color="#4F46E5" />
                <Text style={styles.replyButtonText}>Reply to review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* --- Premium Header Start --- */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Customer Reviews</Text>
            <View style={styles.subtitleBadge}>
              <Text style={styles.headerSubtitle}>{customerName}</Text>
            </View>
          </View>

          {/* Invisible placeholder for perfect centering */}
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>
      {/* --- Premium Header End --- */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Fragment>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : errorState ? (
            <View style={styles.centerContainer}>
              <Feather name="cloud-off" size={40} color="#EF4444" />
              <Text style={styles.errorTitle}>Connection Error</Text>
              <Text style={styles.errorSub}>Please check your internet and try again.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchCustomerReviews}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : reviews.length > 0 ? (
            <FlatList
              data={reviews}
              keyExtractor={(item) => String(item._id)}
              renderItem={renderReviewItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#111827"]} />
              }
            />
          ) : (
            <View style={styles.centerContainer}>
              <Feather name="message-square" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Reviews</Text>
              <Text style={styles.emptySub}>{customerName} hasn't left any feedback yet.</Text>
            </View>
          )}
        </Fragment>
      </KeyboardAvoidingView>

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // --- Header Styles ---
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14, // Squircle shape
    backgroundColor: '#F3F4F6', // Light gray bg
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  subtitleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 44, // Matches back button width
  },

  // --- List & Layout ---
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // --- Review Card ---
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // More rounded
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    paddingTop: 12,
  },

  // --- Interaction Area ---
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  replyButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  respondedContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  respondedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  respondedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  respondedText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },

  // --- Input ---
  inputWrapper: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputField: {
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // --- States ---
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  errorSub: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  retryBtn: { backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  // --- Toast ---
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  toastContainer: {
    backgroundColor: '#1F2937', // Dark toast
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  toastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});

export default CustomerReviewsScreen;