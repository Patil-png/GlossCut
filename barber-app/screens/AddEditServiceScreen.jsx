import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Modal, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Tag, IndianRupee, Clock, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AddEditServiceScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { service, shopId } = route.params;
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedService, setSelectedService] = useState(service?.serviceId || null);
  const [price, setPrice] = useState(service?.price || '');
  const [time, setTime] = useState(service?.time || '');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  const fetchAvailableServices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/services`, {
        headers: { 'x-auth-token': token }
      });
      setAvailableServices(res.data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    const selectedServiceData = availableServices.find(s => s._id === selectedService);
    const serviceToSave = {
      ...service,
      serviceId: selectedService,
      name: selectedServiceData.name,
      price,
      time: time.replace(/[^0-9]/g, '')
    };

    try {
      const token = await AsyncStorage.getItem('token');
      // Update barber card services instead of shop services
      const barberCardRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`, {
        headers: { 'x-auth-token': token }
      });
      const barberCard = barberCardRes.data;
      const services = barberCard.services || [];
      let updatedServices;
      if (serviceToSave.id) {
        updatedServices = services.map(s => s.id === serviceToSave.id ? serviceToSave : s);
      } else {
        updatedServices = [...services, { ...serviceToSave, id: Date.now().toString() }];
      }

      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`, { services: updatedServices }, {
        headers: { 'x-auth-token': token }
      });
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save service", err);
    }
  };

  const getSelectedServiceName = () => {
    const service = availableServices.find(s => s._id === selectedService);
    return service ? service.name : 'Select a service';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{service ? 'Edit Service' : 'Add Service'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{service ? 'Edit Service' : 'Add Service'}</Text>
      </View>

      <ScrollView style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>SELECT SERVICE</Text>
        <TouchableOpacity
          style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setShowServiceModal(true)}
        >
          <Tag color={theme.colors.primary} size={20} />
          <Text style={[styles.input, { color: selectedService ? theme.colors.text : '#9E9E9E' }]}>
            {getSelectedServiceName()}
          </Text>
          <ChevronDown color={theme.colors.primary} size={20} />
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>YOUR PRICE</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <IndianRupee color={theme.colors.primary} size={20} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={price}
            onChangeText={setPrice}
            placeholder="300"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>AVERAGE TIME (MINUTES)</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Clock color={theme.colors.primary} size={20} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={time}
            onChangeText={setTime}
            placeholder="30"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity onPress={handleSave}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.saveButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>SAVE SERVICE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Service Selection Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableServices}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.serviceItem,
                    {
                      backgroundColor: selectedService === item._id ? theme.colors.primary + '20' : theme.colors.card,
                      borderColor: selectedService === item._id ? theme.colors.primary : theme.colors.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedService(item._id);
                    setShowServiceModal(false);
                  }}
                >
                  <View>
                    <Text style={[styles.serviceName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>
                    <Text style={[styles.serviceCategory, { color: theme.colors.primary }]}>{item.category}</Text>
                  </View>
                  {selectedService === item._id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                      <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 24,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddEditServiceScreen;
