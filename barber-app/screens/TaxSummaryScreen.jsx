import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';

const TaxSummaryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxSummary, setTaxSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(moment().year().toString());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const currentYear = moment().year();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
    setAvailableYears(years);
  }, []);

  const fetchTaxSummary = useCallback(async (year) => {
    if (!user?.token) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/earnings/tax-summary?year=${year}`);
      setTaxSummary(res.data);
    } catch (err) {
      console.error("Error fetching tax summary:", err);
      if (err.response && err.response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch tax summary. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTaxSummary(selectedYear);
  }, [selectedYear, fetchTaxSummary]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Earning Summary for Tax</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Financial Year</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={{ color: theme.colors.text }}
              dropdownIconColor={theme.colors.textSecondary}
            >
              {availableYears.map(year => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>

        {taxSummary ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Summary for {selectedYear}</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Gross Earnings:</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{taxSummary.totalGrossEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total GST:</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{taxSummary.totalGSTCollected.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Net Earnings (after GST):</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{taxSummary.totalNetEarnings.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Number of Bookings:</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{taxSummary.numberOfBookings}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Average Booking Value:</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{taxSummary.averageBookingValue.toFixed(2)}</Text>
            </View>
            {/* Add more tax-relevant fields as needed */}
          </View>
        ) : (
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No tax summary data available for {selectedYear}.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.downloadReportButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => Alert.alert('Download Report', 'This feature would download a detailed tax report.')}
        >
          <Text style={[styles.downloadReportButtonText, { color: theme.colors.buttonText }]}>Download Detailed Report</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scrollViewContent: {
    padding: 16,
  },
  sectionCard: {
    borderRadius: 10,
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
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
  },
  downloadReportButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  downloadReportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TaxSummaryScreen;
