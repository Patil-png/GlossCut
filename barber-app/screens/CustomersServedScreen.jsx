import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList, 
  RefreshControl, 
  Animated, 
  Platform,
  StatusBar,
  Dimensions,
  Easing
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import api from '../utils/api'; 
import { useAuth } from '../contexts/AuthContext.jsx';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

// --- PREMIUM COLOR PALETTE ---
const COLORS = {
  primaryDark: '#3730A3', // Deep Indigo
  primaryLight: '#6366F1', // Electric Violet
  background: '#F9FAFB',  // Ghost White
  cardBg: '#FFFFFF',
  textMain: '#111827',    // Near Black (Sharp)
  textSub: '#6B7280',     // Cool Gray
  accentGold: '#F59E0B',  // Amber
  success: '#10B981',     // Emerald
  error: '#EF4444',       // Rose Red
  divider: '#F3F4F6',
  pillBg: '#EEF2FF',      // Very light indigo
};

// --- 1. Custom Animated Toast Component ---
const CustomToast = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current; 

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)), 
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      if(visible && onHide) onHide();
    });
  };

  const backgroundColor = type === 'error' ? COLORS.error : COLORS.success;
  const iconName = type === 'error' ? 'alert-circle' : 'checkmark-circle';

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <View style={[styles.toastCard, { backgroundColor }]}>
        <Ionicons name={iconName} size={24} color="#FFF" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 2. Micro-interaction: Scale Button ---
const ScaleButton = ({ onPress, disabled, style, children }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.97, useNativeDriver: true, friction: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={!disabled ? handlePressIn : null}
      onPressOut={!disabled ? handlePressOut : null}
      disabled={disabled}
      style={{ width: '100%' }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Helper: Premium Avatar Gradient-ish Colors ---
const getAvatarColor = (name) => {
  const safeName = name || 'User';
  // Slightly more saturated/premium palette
  const colors = ['#F87171', '#60A5FA', '#34D399', '#A78BFA', '#FBBF24', '#F472B6']; 
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CustomersServedScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const { totalCustomers: initialTotalCustomers = 0, filter = 'month', customers: initialCustomers = [] } = params;
  
  const { user, token } = useAuth();
  const [totalCustomers, setTotalCustomers] = useState(initialTotalCustomers);
  const [customers, setCustomers] = useState(initialCustomers);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const getFilterText = (currentFilter) => {
    if (currentFilter === 'day') return 'Today';
    if (currentFilter === 'week') return 'This Week';
    if (currentFilter === 'month') return 'This Month';
    return '';
  };

  const fetchCustomersServed = useCallback(async () => {
    try {
      const res = await api.get(`/api/earnings?filter=${filter}`);
      
      if (res && res.data) {
        setTotalCustomers(res.data.totalCustomers || 0);
        setCustomers(res.data.customersServedList || []);
      } else {
        throw new Error("Invalid data format");
      }

    } catch (err) {
      console.log("Fetch Error handled gracefully:", err);
      let errorMsg = "Could not refresh data.";
      if (err.message === "Network Error") errorMsg = "Please check your internet connection.";
      showToast(errorMsg, 'error');
    } finally {
      setRefreshing(false);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchCustomersServed();
  }, [fetchCustomersServed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomersServed();
  }, [fetchCustomersServed]);

  const renderCustomerItem = ({ item }) => {
    if (!item) return null;

    const name = item.name || 'Unknown User';
    const avatarColor = getAvatarColor(name);
    const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <ScaleButton
        style={styles.customerCardContainer}
        disabled={item.isOffline}
        onPress={() => {
          if (!item.isOffline) {
            navigation.navigate('CustomerReviews', {
              customerId: item.id,
              customerName: name,
            });
          }
        }}
      >
        <View style={[styles.customerCard, item.isOffline && styles.offlineCard]}>
          <View style={styles.cardHeader}>
            {/* Avatar with Shadow */}
            <View style={[styles.avatar, { backgroundColor: item.isOffline ? '#D1D5DB' : avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            
            <View style={styles.headerTextContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.customerName, item.isOffline && styles.offlineText]}>
                  {name}
                </Text>
                {item.isOffline && (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}
              </View>
              
              {!item.isOffline && (
                <View style={styles.starRow}>
                   {/* Premium Gold Star */}
                   <MaterialIcons name="star" size={15} color={COLORS.accentGold} />
                   <Text style={styles.ratingText}>{item.averageRating || 'New'}</Text>
                   {item.reviewCount > 0 && (
                     <Text style={styles.reviewCountSubtext}> • {item.reviewCount} Reviews</Text>
                   )}
                </View>
              )}
               {item.isOffline && (
                 <Text style={styles.phoneText}><Ionicons name="call-outline" size={12} /> {item.phone || 'N/A'}</Text>
               )}
            </View>
            
            {!item.isOffline && (
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.cardBody}>
             {!item.isOffline && item.review ? (
                <Text style={styles.reviewSnippet} numberOfLines={2}>
                  "{item.review}"
                </Text>
             ) : !item.isOffline ? (
                <Text style={styles.noReviewText}>No written review yet.</Text>
             ) : null}
             
             <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <FontAwesome5 name="walking" size={12} color={COLORS.primaryLight} />
                  <Text style={styles.statText}>{item.bookingCount || 0} Visits</Text>
                </View>
                {!item.isOffline && (
                   <Text style={styles.tapToView}>Tap to view history</Text>
                )}
             </View>
          </View>
        </View>
      </ScaleButton>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customers Served</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <FlatList
        data={customers && customers.filter(item => !item.isOffline)}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primaryLight} 
            colors={[COLORS.primaryLight, COLORS.primaryDark]} 
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.heroContainer}>
              {/* PREMIUM INDIGO GRADIENT */}
              <LinearGradient
                colors={[COLORS.primaryDark, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <View style={styles.summaryContent}>
                  <View>
                    <Text style={styles.summaryLabel}>Total Served</Text>
                    <Text style={styles.summarySubLabel}>{getFilterText(filter)}</Text>
                  </View>
                  <View style={styles.iconCircle}>
                    <Ionicons name="people" size={24} color={COLORS.primaryDark} />
                  </View>
                </View>
                <Text style={styles.summaryValue}>{totalCustomers}</Text>
                <View style={styles.summaryFooter}>
                   <Text style={styles.summaryFooterText}>Keep up the great work!</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Interactions</Text>
              <View style={styles.badgeContainer}>
                 <Text style={styles.sectionBadge}>{customers ? customers.length : 0}</Text>
              </View>
            </View>

            {(!customers || customers.filter(item => !item.isOffline).length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No active customers found.</Text>
                <Text style={styles.emptyStateSubtext}>
                  {refreshing ? "Refreshing data..." : "Pull down to refresh data"}
                </Text>
              </View>
            )}
          </>
        }
      />

      <CustomToast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header Styles
  headerWrapper: {
    backgroundColor: COLORS.background,
    paddingTop: STATUSBAR_HEIGHT,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: 0.3,
  },
  iconButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 2 },
    }),
  },
  placeholder: { width: 42 },

  // List Styles
  listContent: {
    paddingBottom: 40,
  },

  // Hero Section
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
  },
  summaryCard: {
    borderRadius: 26,
    padding: 24,
    // Colored Shadow for Premium Feel
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  summarySubLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  summaryValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.5,
  },
  iconCircle: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  summaryFooterText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800', // Extra bold for sections
    color: COLORS.textMain,
  },
  badgeContainer: {
    marginLeft: 10,
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },

  // Customer Card Styles
  customerCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6', // Very subtle border
    ...Platform.select({
        ios: { shadowColor: COLORS.primaryDark, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
        android: { elevation: 3 },
    }),
  },
  offlineCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
    elevation: 2
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textMain,
    marginRight: 8,
  },
  offlineText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  offlineBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offlineBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  reviewCountSubtext: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  chevronContainer: {
    padding: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 14,
  },
  cardBody: {
    //
  },
  reviewSnippet: {
    fontSize: 14,
    color: '#4B5563', // Slightly darker than sub for readability
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 22,
  },
  noReviewText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pillBg, // Light Indigo Pill
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  tapToView: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + 15,
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    width: '100%',
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

export default CustomersServedScreen;
