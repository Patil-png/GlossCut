import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import api from '../utils/api'; // Import the custom api instance
import { useAuth } from '../contexts/AuthContext.jsx';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient for accents
import { StatusBar } from 'react-native'; // Import StatusBar
import InfoModal from '../components/InfoModal'; // Import the new InfoModal component

const { width: screenWidth } = Dimensions.get('window');

const PrimaryColor = '#007bff'; // Blue
const SecondaryColor = '#f5f5f5'; // Light Gray Background
const CardColor = '#ffffff';
const SuccessColor = '#28a745'; // Green
const DangerColor = '#dc3545'; // Red
const TextDark = '#333333';
const TextLight = '#6c757d'; // Gray

const EarningsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('month'); // Default to month for a broader view
  const [earningsData, setEarningsData] = useState(null);
  const [tierBreakdown, setTierBreakdown] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [forecast7Days, setForecast7Days] = useState(0); // New state for 7-day forecast
  const [forecast30Days, setForecast30Days] = useState(0); // New state for 30-day forecast
  const [gstSummary, setGstSummary] = useState(null); // New state for GST summary
  const [complianceGuidelines, setComplianceGuidelines] = useState(null); // New state for compliance guidelines
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal visibility states
  const [isComplianceModalVisible, setComplianceModalVisible] = useState(false);
  const [isGstModalVisible, setGstModalVisible] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchEarningsData(filter),
      fetchGstSummary(filter),
    ]).then(() => setRefreshing(false));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      if (user?.token) {
        fetchEarningsData(filter);
        fetchGstSummary(filter);
      }
    }, [filter, user])
  );

  const fetchEarningsData = async (currentFilter) => {
    if (!user?.token) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/earnings?filter=${currentFilter}`);
      setEarningsData(res.data);
      setTierBreakdown(res.data.tierBreakdown);
      setRecentTransactions(res.data.recentTransactions || []);
      setForecast7Days(res.data.forecast7Days || 0);
      setForecast30Days(res.data.forecast30Days || 0);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      if (err.response && err.response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch earnings data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGstSummary = async (currentFilter) => {
    if (!user?.token) return;
    try {
      const res = await api.get(`/api/earnings/gst-summary?filter=${currentFilter}`);
      setGstSummary(res.data);
    } catch (err) {
      console.error("Error fetching GST summary:", err);
      // Handle error, maybe set a specific GST error state
    }
  };

  const fetchComplianceGuidelines = async () => {
    if (!user?.token) {
      alert('User not authenticated. Please log in.');
      return;
    }
    try {
      const res = await api.get('/api/compliance/guidelines');
      setComplianceGuidelines(res.data);
      setComplianceModalVisible(true); // Show modal
    } catch (err) {
      console.error("Error fetching compliance guidelines:", err);
      alert('Failed to fetch compliance guidelines. Please try again later.');
    }
  };

  const generateGstInvoice = async () => {
    if (!user?.token) {
      alert('User not authenticated. Please log in.');
      return;
    }
    try {
      const res = await api.get(`/api/earnings/gst-summary?filter=${filter}`);
      setGstSummary(res.data); // Update summary in state
      setGstModalVisible(true); // Show modal
    } catch (err) {
      console.error("Error generating GST invoice:", err);
      alert('Failed to generate GST invoice. Please try again later.');
    }
  };

  const renderFilterButton = (title, filterType) => (
    <TouchableOpacity
      key={filterType}
      style={[styles.filterButton, filter === filterType && styles.activeFilterButton]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.activeFilterButtonText]}>{title}</Text>
    </TouchableOpacity>
  );

  // Use dynamic labels based on filter, but keep the chart labels fixed for 6 months
  const chartLabels = Array.from({ length: 6 }, (_, i) => moment().subtract(5 - i, 'months').format('MMM'));
  const currentTotalLabel = filter === 'day' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CardColor} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TextDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity onPress={() => fetchEarningsData(filter)} style={styles.refreshButton}>
          <Ionicons name="reload" size={22} color={PrimaryColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PrimaryColor]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={PrimaryColor} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Main Earnings Card (Total Value) */}
            <LinearGradient
              colors={['#ffffff', '#fcfdff']}
              style={styles.mainEarningsCard}
            >
              <Text style={styles.mainEarningsLabel}>Total Earnings ({currentTotalLabel})</Text>
              <Text style={styles.mainEarningsValue}>
                ₹{earningsData ? earningsData.totalEarnings.toFixed(2) : '0.00'}
              </Text>
              {earningsData?.growth !== undefined && (
                <View style={styles.growthContainer}>
                  <Feather
                    name={earningsData.growth >= 0 ? "trending-up" : "trending-down"} // Use 'trending' icons
                    size={20}
                    color={earningsData.growth >= 0 ? SuccessColor : DangerColor}
                  />
                  <Text style={[
                    styles.growthText,
                    earningsData.growth >= 0 ? styles.positiveGrowth : styles.negativeGrowth
                  ]}>
                    {Math.abs(earningsData.growth)}% {earningsData.growth >= 0 ? 'increase' : 'decrease'}
                  </Text>
                  <Text style={styles.periodText}> vs. last period</Text>
                </View>
              )}
            </LinearGradient>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {renderFilterButton('Day', 'day')}
              {renderFilterButton('Week', 'week')}
              {renderFilterButton('Month', 'month')}
            </View>

            {/* Core Metrics */}
            <View style={styles.metricsContainer}>
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('CustomersServed', {
                  totalCustomers: earningsData ? earningsData.totalCustomers : 0,
                  filter: filter,
                  customers: earningsData ? earningsData.customersServedList : [], // Pass the new list
                })}
              >
                <View style={{ alignItems: 'center' }}>
                  <Feather name="users" size={26} color={PrimaryColor} />
                  <Text style={styles.metricValue}>{earningsData ? earningsData.totalCustomers : 0}</Text>
                  <Text style={styles.metricLabel}>Customers Served</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.metricCard}>
                <View style={{ alignItems: 'center' }}>
                  <Feather name="calendar" size={26} color={SuccessColor} />
                  <Text style={styles.metricValue}>{earningsData ? earningsData.totalBookings : 0}</Text>
                  <Text style={styles.metricLabel}>Total Bookings</Text>
                </View>
              </View>
            </View>

            {/* Tier-wise Breakdown */}
            {tierBreakdown && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Tier-wise Breakdown 📊</Text>
                {Object.entries(tierBreakdown).map(([tier, data]) => (
                  <View key={tier} style={styles.tierRow}>
                    <View style={styles.tierInfo}>
                      <Text style={styles.tierName}>{tier}</Text>
                      <Text style={styles.tierDetails}>
                        {data.count} bookings ({data.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                    <Text style={styles.tierEarnings}>₹{data.earnings.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Earning Forecast Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Earning Forecast 🔮</Text>
              <View style={styles.forecastCardsContainer}>
                <View style={styles.forecastCard}>
                  <Text style={styles.forecastLabel}>Next 7 Days</Text>
                  <Text style={styles.forecastValue}>₹{forecast7Days.toFixed(2)}</Text>
                </View>
                <View style={styles.forecastCard}>
                  <Text style={styles.forecastLabel}>Next 30 Days</Text>
                  <Text style={styles.forecastValue}>₹{forecast30Days.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Legal Compliance Toolkit */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Legal Compliance Toolkit ⚖️</Text>
              <TouchableOpacity 
                style={styles.complianceButton}
                onPress={fetchComplianceGuidelines}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="book-open" size={20} color={CardColor} style={{ marginRight: 10 }} />
                  <Text style={styles.complianceButtonText}>View Compliance Guidelines</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* GST Invoice Generator Earning Summary */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>GST Invoice & Tax Summary 🧾</Text>
              <View style={styles.gstSummaryRow}>
                <Text style={styles.gstSummaryLabel}>Total Taxable Earnings:</Text>
                <Text style={styles.gstSummaryValue}>₹{gstSummary ? gstSummary.totalTaxableEarnings : '0.00'}</Text>
              </View>
              <View style={styles.gstSummaryRow}>
                <Text style={styles.gstSummaryLabel}>Total GST ({gstSummary ? gstSummary.gstRate : '0%'}):</Text>
                <Text style={styles.gstSummaryValue}>₹{gstSummary ? gstSummary.totalGSTCollected : '0.00'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.generateInvoiceButton}
                onPress={generateGstInvoice}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="file-text" size={20} color={CardColor} style={{ marginRight: 10 }} />
                  <Text style={styles.generateInvoiceButtonText}>Generate GST Invoice</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Earnings Chart */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {filter === 'month' ? 'Current Month Earnings' : 
                filter === 'week' ? 'Weekly Earnings' : 
                'Daily Earnings'} 📈
              </Text>
              <LineChart
                data={{
                  // Dynamic Labels: Use appropriate labels based on filter
                  labels: 
                    filter === 'day' ? ['12a', '2a', '4a', '6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'] :
                    filter === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] :
                    // --- UPDATED MONTH LABELS ---
                    Array.from({ length: moment().daysInMonth() }, (_, i) => {
                      const day = i + 1;
                      // Show the label only on the 1st, 5th, 10th, 15th, 20th, 25th, and last day
                      if (day === 1 || day % 5 === 0 || day === moment().daysInMonth()) {
                        return day.toString();
                      }
                      return ''; // Hide other labels
                    }),
                    // -----------------------------
                  datasets: [
                    {
                      // Dynamic Data: Check earningsData for the relevant set
                      data: 
                        (filter === 'day' && earningsData?.dailyEarnings) ||
                        (filter === 'week' && earningsData?.weeklyEarnings) ||
                        earningsData?.monthlyEarnings || // Fallback to daily data for 'month'
                        Array(moment().daysInMonth()).fill(0),
                    },
                  ],
                }}
                width={screenWidth - 32 - 30} // screenWidth - (2*margin) - (2*padding)
                height={220}
                yAxisLabel="₹"
                chartConfig={{
                  backgroundColor: CardColor,
                  backgroundGradientFrom: CardColor,
                  backgroundGradientTo: CardColor,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`, // TextLight
                  style: {
                    borderRadius: 10,
                  },
                  propsForDots: {
                    r: '4', // Slightly smaller dots
                    strokeWidth: '2',
                    stroke: PrimaryColor,
                  },
                }}
                bezier
                style={styles.chartStyle}
              />
            </View>

            {/* Recent Transactions */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recent Transactions 💸</Text>
              {recentTransactions.map((transaction, index) => (
                <View
                  key={transaction.id || index}
                  style={[
                    styles.transactionItem,
                    index === recentTransactions.length - 1 ? styles.lastTransactionItem : null,
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={PrimaryColor}
                    style={{ marginRight: 10 }}
                  />
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{moment(transaction.date).format('MMM D, YYYY')}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>₹{transaction.amount.toFixed(2)}</Text>
                </View>
              ))}
              {recentTransactions.length === 0 && (
                <Text style={styles.noTransactionsText}>No recent transactions found.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Compliance Guidelines Modal */}
      <InfoModal
        visible={isComplianceModalVisible}
        onClose={() => setComplianceModalVisible(false)}
        title={complianceGuidelines?.title || "Compliance Guidelines"}
        content={complianceGuidelines}
      />

      {/* GST Invoice Summary Modal */}
      <InfoModal
        visible={isGstModalVisible}
        onClose={() => setGstModalVisible(false)}
        title={`GST Invoice Summary (${gstSummary?.period || 'N/A'})`}
        content={
          gstSummary ? 
          `Total Earnings: ₹${gstSummary.totalEarnings}\n` +
          `Total Taxable Earnings: ₹${gstSummary.totalTaxableEarnings}\n` +
          `GST Rate: ${gstSummary.gstRate}\n` +
          `Total GST: ₹${gstSummary.totalGSTCollected}\n\n` +
          `(Note: In a full implementation, a PDF invoice would be generated and provided for download.)`
          : 'No GST summary available.'
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SecondaryColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CardColor,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Very light separator
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22, // Slightly larger
    fontWeight: '700', // Bolder
    color: TextDark,
  },
  refreshButton: {
    padding: 8,
  },
  scrollViewContent: {
    paddingVertical: 16,
    paddingHorizontal: 16, // Added horizontal padding to the scroll view
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    backgroundColor: '#fff3cd', // Light warning color
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#ffc107', // Yellow accent
  },
  errorText: {
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
  // --- Main Earnings Card ---
  mainEarningsCard: {
    borderRadius: 15,
    padding: 25, // Increased padding
    alignItems: 'center',
    marginBottom: 20,
    // Professional Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  mainEarningsLabel: {
    fontSize: 15,
    color: TextLight,
    marginBottom: 8,
    fontWeight: '500',
  },
  mainEarningsValue: {
    fontSize: 48, // Much larger and more dominant
    fontWeight: '900', // Ultra bold
    color: TextDark,
    marginBottom: 10,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  growthText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 5,
  },
  periodText: {
    fontSize: 14,
    color: TextLight,
    marginLeft: 5,
  },
  positiveGrowth: {
    color: SuccessColor,
  },
  negativeGrowth: {
    color: DangerColor,
  },
  // --- Filter Buttons ---
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CardColor,
    borderRadius: 10,
    marginBottom: 20,
    padding: 3, // Smaller internal padding
    borderWidth: 1,
    borderColor: '#e0e0e0', // Light border
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: PrimaryColor,
    shadowColor: PrimaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: TextDark,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: CardColor,
    fontWeight: '700',
  },
  // --- Metrics Cards ---
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10, // Added gap (RN 0.71+)
  },
  metricCard: {
    flex: 1,
    backgroundColor: CardColor,
    borderRadius: 15, // More rounded corners
    padding: 20, // Increased padding
    alignItems: 'center',
    marginHorizontal: 5, // Replace this with 'gap' if available
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    margin: 5, // Compensating for removed marginHorizontal
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '800',
    color: TextDark,
    marginTop: 10,
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 13,
    color: TextLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  // --- Section Card (Chart & Transactions) ---
  sectionCard: {
    backgroundColor: CardColor,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TextDark,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 10,
  },
  // --- Transactions ---
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionDetails: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  transactionDescription: {
    fontSize: 16,
    color: TextDark,
    fontWeight: '600', // Bolder description
  },
  transactionDate: {
    fontSize: 12,
    color: TextLight,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: SuccessColor,
    textAlign: 'right',
    minWidth: 80,
  },
  noTransactionsText: {
    textAlign: 'center',
    color: TextLight,
    paddingVertical: 20,
    fontSize: 15,
  },
  // --- Forecast Cards ---
  forecastCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: '#e6f2ff', // Softer blue background
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PrimaryColor + '30', // Light primary border
    margin: 5, // Adding margin to separate cards
  },
  forecastLabel: {
    fontSize: 14,
    color: TextLight,
    marginBottom: 5,
    fontWeight: '500',
  },
  forecastValue: {
    fontSize: 26, // Slightly larger value
    fontWeight: '800',
    color: PrimaryColor,
  },
  // --- Tier Breakdown ---
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    color: TextDark,
  },
  tierDetails: {
    fontSize: 13,
    color: TextLight,
    marginTop: 2,
  },
  tierEarnings: {
    fontSize: 16,
    fontWeight: '700',
    color: SuccessColor,
  },
  // --- Legal Compliance Toolkit & GST Invoice Generator Styles ---
  complianceButton: {
    flexDirection: 'row',
    backgroundColor: PrimaryColor,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: PrimaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  complianceButtonText: {
    color: CardColor,
    fontSize: 16,
    fontWeight: '700',
  },
  gstSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gstSummaryLabel: {
    fontSize: 15,
    color: TextDark,
    fontWeight: '500',
  },
  gstSummaryValue: {
    fontSize: 15,
    color: TextDark,
    fontWeight: '600',
  },
  generateInvoiceButton: {
    flexDirection: 'row',
    backgroundColor: SuccessColor, // Green for generation
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: SuccessColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  generateInvoiceButtonText: {
    color: CardColor,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EarningsScreen;
