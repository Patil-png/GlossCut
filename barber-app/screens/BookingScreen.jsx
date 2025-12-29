import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Linking, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { ArrowLeft, Star, Clock, MapPin, Tag, Users, Scissors, Map } from 'lucide-react-native';
import { barbersData } from '../data/barbers.js';
import { salonsData } from '../data/salons.js';
import { petCareProvidersData } from '../data/petcare.js';

const BookingScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { barberId, salonId, providerId, forFriend } = route.params;
  console.log('BookingScreen forFriend:', forFriend); // Debug log

  let provider = {};
  let serviceType = '';
  if (barberId) {
    provider = barbersData.find(b => b.id === barberId) || {};
    serviceType = 'barber';
  } else if (salonId) {
    provider = salonsData.find(s => s.id === salonId) || {};
    serviceType = 'salon';
  } else if (providerId) {
    provider = petCareProvidersData.find(p => p.id === providerId) || {};
    serviceType = 'pet';
  }

  const services = provider.services || [];
  const [selectedServices, setSelectedServices] = useState([]);

  const handleSelectService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalPrice = useMemo(() => {
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.replace('₹', ''));
        return total + price;
      }, 0);
  }, [selectedServices, services]);

  const getStyles = (currentTheme) => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 35,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 8,
    },
    address: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginBottom: 20,
    },
    locationContainer: {
      marginTop: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: currentTheme.colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    locationTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 12,
    },
    locationAddress: {
      fontSize: 16,
      color: currentTheme.colors.text,
    },
    viewMapButton: {
      backgroundColor: currentTheme.colors.secondary,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
    },
    viewMapButtonText: {
      color: currentTheme.colors.onSecondary,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    detailsContainer: {
      marginBottom: 20,
    },
    servicesContainer: {
      marginTop: 20,
    },
    servicesTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 12,
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: currentTheme.colors.card,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.text,
    },
    servicePrice: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      marginTop: 4,
    },
    selectedServiceItem: {
      borderColor: currentTheme.colors.primary,
      backgroundColor: currentTheme.colors.primary + '1A',
      shadowOpacity: 0,
      elevation: 0,
    },
    addButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: currentTheme.colors.primary,
    },
    addButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    selectedButton: {
      backgroundColor: '#fff',
      borderColor: currentTheme.colors.primary,
      borderWidth: 1.5,
    },
    selectedButtonText: {
      color: currentTheme.colors.primary,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailText: {
      fontSize: 16,
      color: currentTheme.colors.text,
      marginLeft: 10,
    },
    bookingButton: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
    },
    bookingButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.onPrimary,
    },
  });

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{provider.name}</Text>
      </View>
      <ScrollView style={styles.content}>
        <Image source={provider.image} style={styles.image} />
        <Text style={styles.title}>{provider.name}</Text>
        <View style={styles.detailRow}>
          <MapPin size={16} color={theme.colors.textSecondary} />
          <Text style={styles.address}>{provider.address}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Star size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>Rating: {provider.rating} ({provider.reviews} reviews)</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>Avg. Appointment Time: {provider.avgAppointmentTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Tag size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>Tag: {provider.tag}</Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{provider.customersServed} Customers | {provider.totalServices} Services</Text>
          </View>
        </View>
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>Select Services</Text>
          {services.map(service => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <View key={service.id} style={[styles.serviceItem, isSelected && styles.selectedServiceItem]}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, isSelected && styles.selectedButton]}
                  onPress={() => handleSelectService(service.id)}
                >
                  <Text style={[styles.addButtonText, isSelected && styles.selectedButtonText]}>
                    {isSelected ? 'Added' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Location</Text>
          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={styles.locationAddress}>{provider.address}</Text>
          </View>
          <TouchableOpacity style={styles.viewMapButton} onPress={() => {
            const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
            const latLng = '37.7749,-122.4194'; // Placeholder coordinates, ideally from provider data
            const label = encodeURIComponent(provider.name);
            const url = Platform.select({
              ios: `${scheme}${label}@${latLng}`,
              android: `${scheme}${latLng}(${label})`
            });
            Linking.openURL(url);
          }}>
            <Map size={20} color={theme.colors.onSecondary} />
            <Text style={styles.viewMapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={styles.bookingButton}
          disabled={selectedServices.length === 0}
          onPress={() => navigation.navigate('PaymentConfirmation', {
            providerName: provider.name,
            providerId: provider.id,
            selectedServices: services.filter(s => selectedServices.includes(s.id)),
            totalPrice: totalPrice,
            forFriend,
            serviceType,
          })}
        >
          <Text style={styles.bookingButtonText}>
            {selectedServices.length > 0
              ? `Book ${selectedServices.length} Service${selectedServices.length > 1 ? 's' : ''} - ₹${totalPrice.toFixed(2)}`
              : 'Select a Service'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingScreen;
