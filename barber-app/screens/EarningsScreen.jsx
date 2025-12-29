import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  Dimensions, 
  Animated, 
  Easing,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import api from '../utils/api'; 
import { useAuth } from '../contexts/AuthContext.jsx';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient'; 

const { width: screenWidth } = Dimensions.get('window');

// --- PREMIUM PALETTE ---
const COLORS = {
  primary: '#4F46E5', // Electric Indigo
  primarySoft: '#E0E7FF',
  bg: '#F8FAFC', // Ultra Light Gray/Blue tint
  card: '#FFFFFF',
  textMain: '#0F172A', // Slate 900
  textSec: '#64748B', // Slate 500
  success: '#10B981', 
  successBg: '#ECFDF5',
  error: '#EF4444', 
  errorBg: '#FEF2F2',
  divider: '#F1F5F9',
  gradientStart: '#4338CA', 
  gradientEnd: '#6366F1',   
};

// --- COMPONENT: ANIMATED TOP TOAST ---
const TopToast = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 50
      }).start();

      const timer = setTimeout(() => hide(), 3000);
      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide && onHide());
  };

  if (!visible && translateY._value === -150) return null;

  const isError = type === 'error';
  const bg = isError ? COLORS.errorBg : COLORS.successBg;
  const textCol = isError ? COLORS.error : COLORS.success;
  const iconName = isError ? 'alert-circle' : 'checkmark-circle';

  return (
    <Animated.View style={[styles.toastWrapper, { transform: [{ translateY }] }]}>
      <View style={[styles.toastContainer, { backgroundColor: bg }]}>
        <Ionicons name={iconName} size={20} color={textCol} />
        <Text style={[styles.toastText, { color: textCol }]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- COMPONENT: MICRO-INTERACTION BUTTON ---
const ScaleButton = ({ onPress, children, style, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if(disabled) return;
    Animated.spring(scaleValue, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
  };

  const onPressOut = () => {
    if(disabled) return;
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ width: style?.width, flex: style?.flex }} 
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const EarningsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Data State
  const [filter, setFilter] = useState('month'); 
  const [earningsData, setEarningsData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [forecast7Days, setForecast7Days] = useState(0); 
  const [forecast30Days, setForecast30Days] = useState(0); 
  
  // UI State
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Animation
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  // --- ACTIONS ---
  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarningsData(filter).then(() => setRefreshing(false));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      if (user?.token) fetchEarningsData(filter);
    }, [filter, user])
  );

  const fetchEarningsData = async (currentFilter) => {
    if (!user?.token) {
      setLoading(false);
      return; 
    }

    if(!earningsData) setLoading(true);

    try {
      const res = await api.get(`/api/earnings?filter=${currentFilter}`);
      
      if(res && res.data) {
        setEarningsData(res.data);
        setRecentTransactions(res.data.recentTransactions || []);
        setForecast7Days(res.data.forecast7Days || 0);
        setForecast30Days(res.data.forecast30Days || 0);
        
        Animated.parallel([
          Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(contentSlide, { toValue: 0, damping: 15, useNativeDriver: true })
        ]).start();
      } else {
        throw new Error("Invalid data format");
      }

    } catch (err) {
      console.error("Error fetching earnings:", err);
      let msg = 'Could not update data.';
      if (err.message === 'Network Error' || !err.response) {
        msg = 'No internet connection.';
      } else if (err.response?.status === 401) {
        msg = 'Session expired. Please log in.';
      } else if (err.response?.status >= 500) {
        msg = 'Server is currently down.';
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED RENDER FILTER BUTTON ---
  const renderFilterButton = (title, filterType) => {
    const isActive = filter === filterType;
    return (
      <ScaleButton
        key={filterType}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(filterType)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {title}
        </Text>
      </ScaleButton>
    );
  };

  const currentTotalLabel = filter === 'day' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <TopToast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ScaleButton onPress={() => navigation.goBack()} style={styles.navButton}>
          <Feather name="arrow-left" size={24} color={COLORS.textMain} />
        </ScaleButton>
        <Text style={styles.headerTitle}>Earnings</Text>
        <ScaleButton onPress={() => fetchEarningsData(filter)} style={styles.navButton}>
          <Ionicons name="sync-outline" size={22} color={COLORS.textMain} />
        </ScaleButton>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        {loading && !earningsData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Gathering financial data...</Text>
          </View>
        ) : !earningsData && !loading ? (
          <View style={styles.errorState}>
            <View style={styles.errorIconBg}>
              <Feather name="wifi-off" size={32} color={COLORS.textSec} />
            </View>
            <Text style={styles.errorTitle}>Connection Lost</Text>
            <Text style={styles.errorSub}>Please check your internet connection and try again.</Text>
            <ScaleButton onPress={() => fetchEarningsData(filter)} style={styles.retryBtn}>
               <Text style={styles.retryBtnText}>Retry</Text>
            </ScaleButton>
          </View>
        ) : (
          <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
            
            {/* Hero Card */}
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroDecorCircle} />
              
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>{currentTotalLabel} Balance</Text>
                  <Text style={styles.heroAmount}>
                    ₹{earningsData?.totalEarnings?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </Text>
                </View>
                <View style={styles.heroIconGlass}>
                  <Ionicons name="wallet" size={24} color="#FFF" />
                </View>
              </View>

              {earningsData?.growth !== undefined && (
                <View style={styles.growthBadge}>
                  <Feather
                    name={earningsData.growth >= 0 ? "trending-up" : "trending-down"}
                    size={14}
                    color={earningsData.growth >= 0 ? '#A7F3D0' : '#FECACA'}
                  />
                  <Text style={[styles.growthText, { color: earningsData.growth >= 0 ? '#A7F3D0' : '#FECACA' }]}>
                    {Math.abs(earningsData.growth)}% {earningsData.growth >= 0 ? 'Increase' : 'Decrease'}
                  </Text>
                </View>
              )}
            </LinearGradient>

            {/* --- NEW PREMIUM FILTER SECTION --- */}
            <View style={styles.filterRow}>
              {renderFilterButton('Day', 'day')}
              {renderFilterButton('Week', 'week')}
              {renderFilterButton('Month', 'month')}
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <ScaleButton
                style={styles.metricBox}
                onPress={() => navigation.navigate('CustomersServed', {
                  totalCustomers: earningsData ? earningsData.totalCustomers : 0,
                  filter: filter,
                  customers: earningsData ? earningsData.customersServedList : [],
                })}
              >
                <View style={[styles.metricIcon, { backgroundColor: COLORS.primarySoft }]}>
                  <Feather name="users" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.metricVal}>{earningsData ? earningsData.totalCustomers : 0}</Text>
                <Text style={styles.metricLbl}>Customers</Text>
              </ScaleButton>

              <ScaleButton style={styles.metricBox}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.successBg }]}>
                  <Feather name="calendar" size={20} color={COLORS.success} />
                </View>
                <Text style={styles.metricVal}>{earningsData ? earningsData.totalBookings : 0}</Text>
                <Text style={styles.metricLbl}>Bookings</Text>
              </ScaleButton>
            </View>

            {/* Forecast Section */}
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Earning Forecast</Text>
               <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI PROJECTION</Text></View>
            </View>
            
            <View style={styles.forecastRow}>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLbl}>Next 7 Days</Text>
                <Text style={styles.forecastVal}>₹{forecast7Days.toLocaleString('en-IN')}</Text>
                <View style={styles.barBg}><View style={[styles.barFill, { width: '45%' }]} /></View>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLbl}>Next 30 Days</Text>
                <Text style={styles.forecastVal}>₹{forecast30Days.toLocaleString('en-IN')}</Text>
                <View style={styles.barBg}><View style={[styles.barFill, { backgroundColor: COLORS.success, width: '70%' }]} /></View>
              </View>
            </View>

            {/* Analytics Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Performance</Text>
                <Text style={styles.chartSub}>{filter === 'month' ? 'Monthly' : 'Recent'} Trend</Text>
              </View>
              
              <LineChart
                data={{
                  labels: 
                    filter === 'day' ? ['12a', '4a', '8a', '12p', '4p', '8p'] :
                    filter === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] :
                    Array.from({ length: moment().daysInMonth() }, (_, i) => {
                      const day = i + 1;
                      return (day === 1 || day === 15 || day === moment().daysInMonth()) ? day.toString() : ''; 
                    }),
                  datasets: [{
                    data: 
                      (filter === 'day' && earningsData?.dailyEarnings) ||
                      (filter === 'week' && earningsData?.weeklyEarnings) ||
                      earningsData?.monthlyEarnings || 
                      Array(moment().daysInMonth()).fill(0),
                  }],
                }}
                width={screenWidth - 48} 
                height={200}
                yAxisLabel="₹"
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={false}
                chartConfig={{
                  backgroundColor: COLORS.card,
                  backgroundGradientFrom: COLORS.card,
                  backgroundGradientTo: COLORS.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, 
                  labelColor: (opacity = 1) => COLORS.textSec,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
                  fillShadowGradientFrom: COLORS.primary,
                  fillShadowGradientTo: '#FFF',
                  fillShadowGradientFromOpacity: 0.2,
                  fillShadowGradientToOpacity: 0,
                }}
                bezier
                style={{ borderRadius: 16, paddingRight: 0, paddingLeft: 0 }}
              />
            </View>

            {/* Transactions List */}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Recent Activity</Text>
            <View style={styles.transactionCard}>
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id || index} style={styles.transRow}>
                  <View style={styles.transIconBox}>
                    <MaterialCommunityIcons name="arrow-bottom-left" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.transMeta}>
                    <Text style={styles.transTitle} numberOfLines={1}>{transaction.description}</Text>
                    <Text style={styles.transTime}>{moment(transaction.date).format('MMM D, h:mm A')}</Text>
                  </View>
                  <Text style={styles.transAmt}>+₹{transaction.amount.toFixed(2)}</Text>
                </View>
              ))}
              
              {recentTransactions.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No recent transactions found</Text>
                </View>
              )}
            </View>
            
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  navButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // --- TOAST ---
  toastWrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },

  // --- LAYOUT ---
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: '500',
  },
  errorState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconBg: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.textMain,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // --- HERO CARD ---
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  heroDecorCircle: {
    position: 'absolute',
    top: -50, right: -50,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroIconGlass: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  // --- NEW FILTER SECTION STYLES ---
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // Light Gray Track (iOS Style)
    borderRadius: 25, // Fully rounded pill
    padding: 5, // Gap between track edge and button
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Subtle border definition
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20, // Inner rounded shape
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF', // Pure White Active Button
    shadowColor: '#64748B', // Soft shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8', // Gray for inactive
    letterSpacing: 0.3,
  },
  filterTextActive: {
    color: COLORS.primary, // Indigo for active text (Matches Hero/Chart)
    fontWeight: '800',
  },

  // --- METRICS ---
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  metricIcon: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: '500',
  },

  // --- FORECAST ---
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.3,
  },
  aiBadge: {
    marginLeft: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: '#9333EA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forecastRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  forecastItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  forecastLbl: {
    fontSize: 11,
    color: COLORS.textSec,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  forecastVal: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  barBg: {
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    width: '100%',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // --- CHART ---
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  chartSub: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: '600',
  },

  // --- TRANSACTIONS ---
  transactionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  transIconBox: {
    width: 42, height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  transMeta: {
    flex: 1,
  },
  transTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 3,
  },
  transTime: {
    fontSize: 12,
    color: COLORS.textSec,
  },
  transAmt: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: -0.5,
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSec,
    fontSize: 14,
  }
});

export default EarningsScreen;