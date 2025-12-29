import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Image, 
  Animated 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, User, Clock, DollarSign, Tag, Calendar } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';

const AllAppointmentsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const isFocused = useIsFocused();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Define Filter Options and their index
  const filterOptions = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
  ];

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const index = filterOptions.findIndex(opt => opt.key === newFilter);
    
    // Animate the indicator to the new position
    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      damping: 15, // Controls the oscillation
      stiffness: 150, // Controls the speed of the spring
    }).start();
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber`, {
          headers: { 'x-auth-token': token },
        });
        // Filter out cancelled appointments
        setAppointments(res.data.filter(a => a.status !== 'cancelled'));
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }
      setLoading(false);
    };

    if (isFocused) {
      fetchAppointments();
      // Set initial position of indicator based on default filter
      const initialIndex = filterOptions.findIndex(opt => opt.key === filter);
      slideAnim.setValue(initialIndex);
    }
  }, [isFocused]);

  // Utility to determine badge styles
  const getStatusBadge = (status, paymentStatus) => {
    if (paymentStatus === 'pending') {
        return { text: 'PAYMENT PENDING', color: theme.colors.danger, icon: DollarSign };
    }
    switch (status) {
        case 'pending':
            return { text: 'NEW REQUEST', color: theme.colors.warning, icon: Clock };
        case 'confirmed':
            return { text: 'CONFIRMED', color: theme.colors.primary, icon: Clock };
        case 'started':
            return { text: 'IN PROGRESS', color: theme.colors.success, icon: Clock };
        case 'completed':
            return { text: 'COMPLETED', color: theme.colors.info, icon: Clock };
        default:
            return { text: status.toUpperCase(), color: theme.colors.textSecondary, icon: Clock };
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const statusBadge = getStatusBadge(item.status, item.paymentStatus);

    return (
      <View style={[
        styles.appointmentCard, 
        { 
          backgroundColor: theme.colors.card, 
          borderColor: theme.colors.border,
        }
      ]}>
        
        {/* TOP ROW: Status Badge & Total Price */}
        <View style={styles.cardTopRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                <Text style={styles.statusBadgeText}>{statusBadge.text}</Text>
            </View>
            <Text style={[styles.totalPrice, { color: theme.colors.primary }]}>
                <DollarSign size={16} color={theme.colors.primary} /> **₹{item.totalPrice.toFixed(2)}**
            </Text>
        </View>

        {/* CUSTOMER INFO */}
        <View style={styles.customerInfoRow}>
          {item.userId?.profilePicture ? (
            <Image
              source={{ uri: item.userId.profilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileIconContainer, { backgroundColor: theme.colors.border }]}>
              <User size={20} color={theme.colors.textSecondary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.customerName, { color: theme.colors.text }]}>
              {item.userId?.name || 'Unknown User'}
            </Text>
            <Text style={[styles.customerContact, { color: theme.colors.textSecondary }]}>
              {item.userId?.email || 'N/A'} | {item.userId?.phone || 'N/A'}
            </Text>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
                Date: <Text style={{fontWeight: '500'}}>{format(new Date(item.date), 'MMM dd, yyyy')}</Text>
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
                Time: <Text style={{fontWeight: '500'}}>{item.time}</Text>
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Tag size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
                Type: <Text style={{fontWeight: '500'}}>{item.appointmentType || 'Standard'}</Text>
            </Text>
          </View>
        </View>

        {/* SERVICES LIST */}
        <Text style={[styles.serviceListTitle, { color: theme.colors.textSecondary }]}>
            Services Booked:
        </Text>
        <Text style={[styles.serviceListText, { color: theme.colors.text }]}>
            {item.services.map(s => s.name).join(', ')}
        </Text>
        
      </View>
    );
  };

  const filterWidth = 100 / filterOptions.length;
  const translateX = slideAnim.interpolate({
    inputRange: filterOptions.map((_, index) => index),
    outputRange: filterOptions.map((_, index) => `${index * filterWidth}%`),
  });

  // --- STYLESHEET (Refined for Modern Aesthetics) ---
  const getStyles = (theme) => StyleSheet.create({
    container: {
      flex: 1,
    },
    // --- Header Styles ---
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 10, // Adjust for safer top margin
      borderBottomWidth: 0, // Removed hard separator line
      marginTop: 25,
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 26, // Even larger, more prominent title
      fontWeight: '800', // Bold
    },
    // --- Filter Styles (Modern Pill Design) ---
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderRadius: 25, // More rounded for a distinct pill shape
      marginHorizontal: 16,
      marginVertical: 15,
      padding: 5, // Increased padding for a thicker pill
      position: 'relative',
      overflow: 'hidden',
    },
    filterButton: {
      flex: 1,
      paddingVertical: 14, // Increased vertical padding for larger touch area
      alignItems: 'center',
      zIndex: 2,
    },
    activeFilter: {
      position: 'absolute',
      top: 5, // Match new padding
      bottom: 5, // Match new padding
      borderRadius: 20, // Match filter container for smooth pill look
      zIndex: 1,
    },
    filterText: {
      fontSize: 16, // Slightly larger font
      fontWeight: '700',
    },
    // --- List & Empty State ---
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30, // Increased padding
    },
    emptyText: {
      fontSize: 20, // Slightly larger font
      fontWeight: '600',
    },
    // --- Appointment Card Styles (Simplified and Hierarchy-focused) ---
    appointmentCard: {
      borderRadius: 15, // Slightly more rounded
      padding: 20, // Increased padding
      marginBottom: 20, // Increased margin for more separation
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    statusBadgeText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    totalPrice: {
      fontSize: 16,
      fontWeight: '700',
      flexDirection: 'row',
      alignItems: 'center',
    },
    customerInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // Use theme color for consistency
    },
    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 15,
    },
    profileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 15,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    userDetails: {
      flex: 1,
    },
    customerName: {
      fontSize: 18,
      fontWeight: '700',
    },
    customerContact: {
      fontSize: 13,
      marginTop: 2,
    },
    detailsSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
      marginBottom: 5,
    },
    detailText: {
      fontSize: 13,
      marginLeft: 5,
    },
    serviceListTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 5,
      marginBottom: 5,
    },
    serviceListText: {
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic',
    },
  });

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Appointments</Text>
      </View>
      
      {/* FILTER BUTTONS (Modern Pill Design) */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.border }]}>
        <Animated.View 
          style={[
            styles.activeFilter, 
            {
              width: `${filterWidth}%`,
              backgroundColor: 'transparent', // Changed to transparent
              transform: [{ translateX }],
            }
          ]} 
        />
        {filterOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.filterButton}
            onPress={() => handleFilterChange(opt.key)}
          >
            <Text style={[
              styles.filterText, 
              { color: filter === opt.key ? theme.colors.primary : theme.colors.text } // Changed active text color to primary
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* LIST CONTENT */}
      {appointments.filter(a => a.status === filter).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginBottom: 10 }]}>
            No **{filter}** appointments found.
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            Check another status filter or wait for new bookings.
          </Text>
        </View>
      ) : (
        <FlatList
          data={appointments.filter(a => a.status === filter)}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
};

export default AllAppointmentsScreen;
