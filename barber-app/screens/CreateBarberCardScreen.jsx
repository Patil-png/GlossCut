import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Image, Animated, Modal, FlatList, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ArrowLeft, Tag, IndianRupee, Clock, Plus, Trash, User, Star, MapPin, Edit, ChevronLeft, Zap, CheckCircle, AlertCircle, Info, Bookmark, ChevronDown, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

// Component that matches exactly what customers see in BarberSearchScreen
const BarberCardPreview = ({ barberData, theme }) => {
  const fullness = 50; // Default fullness for preview
  const capacityText = fullness > 90 ? "Almost Full" : "5 slots left";

  return (
    <View style={[styles.barberCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.imageContainer}>
        {barberData.image ? (
          <Image source={barberData.image} style={styles.barberImage} resizeMode="cover" />
        ) : (
          <View style={[styles.barberImage, styles.imagePlaceholder, { backgroundColor: theme.colors.border }]}>
            <Text style={[styles.barberInitialLarge, { color: theme.colors.textSecondary }]}>
              {barberData.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.imageOverlay} />
        <View style={styles.cardHeaderOverlay}>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>
              {barberData.rating?.toFixed(1) || "New"}
            </Text>
            <Star size={10} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
          </View>
          {!barberData.isAvailable ? (
            <View style={styles.offlinePill}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Closed</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.glassLikeButton}>
              <Bookmark size={18} color="#fff" fill="rgba(0,0,0,0.2)" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardBottomOverlay}>
          <Text style={styles.categoryTag} numberOfLines={1}>
            {barberData.tag || barberData.category || 'General'}
          </Text>
          <Text style={styles.imageDistanceText}>
            <MapPin size={10} color="#fff" /> Nearby
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={[styles.barberName, { color: theme.colors.text }]} numberOfLines={1}>
            {barberData.name || 'Barber Name'}
          </Text>
          <View style={styles.trendingBadge}>
            <Zap size={10} color="#FF5722" fill="#FF5722" />
            <Text style={styles.trendingText}>Popular</Text>
          </View>
        </View>
        <Text style={styles.fullAddressText} numberOfLines={1}>
          {barberData.address || 'Shop Address'}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{barberData.avgAppointmentTime || '30 min'}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statText}>{barberData.reviews || 0} Reviews</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statText}>{barberData.totalServices || 0} Services</Text>
          </View>
        </View>

        <View style={styles.capacityContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${fullness}%`,
              backgroundColor: fullness > 90 ? "#ff4757" : "#2ed573",
            }]} />
          </View>
          <Text style={[styles.capacityText, { color: fullness > 90 ? "#ff4757" : "#2ed573" }]}>
            {capacityText}
          </Text>
        </View>

        <TouchableOpacity style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
          <ChevronLeft size={16} color="#fff" strokeWidth={3} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InfoRow = ({ icon: Icon, label, value, theme, onPress, canEdit = true }) => (
  <TouchableOpacity style={styles.infoRow} onPress={canEdit ? onPress : undefined} disabled={!canEdit}>
    <Icon size={24} color={canEdit ? theme.colors.textSecondary : theme.colors.textSecondary + '80'} />
    <View style={styles.infoTextContainer}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
    {canEdit && (
      <ChevronLeft size={24} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
    )}
  </TouchableOpacity>
);

const CreateBarberCardScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { barberCard } = route.params || {};

  const [name, setName] = useState(barberCard?.name || user?.name || '');
  const [services, setServices] = useState(barberCard?.services || []);
  const [specialties, setSpecialties] = useState(barberCard?.specialties || []);
  const [avgAppointmentTime, setAvgAppointmentTime] = useState(barberCard?.avgAppointmentTime || '30 min');
  const [isAvailable, setIsAvailable] = useState(barberCard?.isAvailable !== undefined ? barberCard.isAvailable : true);
  const [barberCardImage, setBarberCardImage] = useState(barberCard?.image || null);
  const [loading, setLoading] = useState(false);
  const [existingCard, setExistingCard] = useState(!!barberCard);

  // Service selection states
  const [availableServices, setAvailableServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [servicePrice, setServicePrice] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [selectedServiceForAdding, setSelectedServiceForAdding] = useState(null);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const [newSpecialty, setNewSpecialty] = useState('');
  const [shopData, setShopData] = useState(null);

  const pickBarberCardImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll permissions are needed to select a new barber card image.');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('barberCardImage', { uri: localUri, name: filename, type });

      try {
        const token = await AsyncStorage.getItem('token');
        const uploadRes = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/upload-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token,
          },
        });

        if (uploadRes.data && uploadRes.data.imageUrl) {
          const imageUrl = `${process.env.EXPO_PUBLIC_API_URL}${uploadRes.data.imageUrl}`;
          setBarberCardImage(imageUrl);
        } else {
          Alert.alert('Upload Failed', 'No image URL returned from server.');
        }
      } catch (error) {
        console.error("Image upload error:", error.response?.data || error.message);
        Alert.alert('Upload Error', `An error occurred during image upload: ${error.response?.data?.msg || error.message}`);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // First fetch available services
      await fetchAvailableServices();

      // Fetch shop data
      await fetchShopData();

      // Then fetch existing card
      if (barberCard) {
        // If barberCard is passed as prop, use it
        setName(barberCard.name);
        setServices(barberCard.services || []);
        setSpecialties(barberCard.specialties || []);
        setAvgAppointmentTime(barberCard.avgAppointmentTime);
        setIsAvailable(barberCard.isAvailable);
        setExistingCard(true);
      } else {
        // Otherwise, try to fetch existing card
        await fetchExistingCard();
      }
    };

    initializeData();
  }, [barberCard]);

  const fetchExistingCard = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data) {
        console.log('Loaded existing services:', response.data.services);
        setName(response.data.name);
        setServices(response.data.services || []);
        setSpecialties(response.data.specialties || []);
        setAvgAppointmentTime(response.data.avgAppointmentTime);
        setIsAvailable(response.data.isAvailable);
        setExistingCard(true);
      }
    } catch (err) {
      // No existing card found, use defaults
      console.log('No existing barber card found');
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/services`, {
        headers: { 'x-auth-token': token }
      });
      setAvailableServices(res.data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  const fetchShopData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`, {
        headers: { 'x-auth-token': token }
      });
      setShopData(res.data);
    } catch (err) {
      console.error("Failed to fetch shop data", err);
    }
  };

  const addService = () => {
    if (!newService.name.trim() || !newService.price.trim() || !newService.time.trim()) {
      Alert.alert('Error', 'Please fill all service fields');
      return;
    }
    setServices([...services, { ...newService, id: Date.now().toString() }]);
    setNewService({ name: '', price: '', time: '' });
  };

  const removeService = (serviceId) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  const addSpecialty = () => {
    if (!newSpecialty.trim()) {
      Alert.alert('Error', 'Please enter a specialty');
      return;
    }
    if (specialties.includes(newSpecialty.trim())) {
      Alert.alert('Error', 'Specialty already exists');
      return;
    }
    setSpecialties([...specialties, newSpecialty.trim()]);
    setNewSpecialty('');
  };

  const removeSpecialty = (specialty) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleDeleteBarberCard = async () => {
    Alert.alert(
      'Delete Barber Card',
      'Are you sure you want to delete your barber card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`, {
                headers: { 'x-auth-token': token }
              });
              if (res.status === 200) {
                Alert.alert('Success', 'Barber card deleted successfully');
                navigation.goBack();
              }
            } catch (err) {
              console.error('Error deleting barber card:', err);
              Alert.alert('Error', err.response?.data?.msg || 'Failed to delete barber card');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your barber name');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const data = {
        name: name.trim(),
        services,
        specialties,
        isAvailable,
      };

      // Only include avgAppointmentTime if it's not the default '30 min'
      if (avgAppointmentTime !== '30 min') {
        data.avgAppointmentTime = avgAppointmentTime;
      }

      // Include image if uploaded
      if (barberCardImage) {
        data.image = barberCardImage;
      }

      let response;
      if (existingCard) {
        response = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`, data, {
          headers: { 'x-auth-token': token }
        });
      } else {
        response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`, data, {
          headers: { 'x-auth-token': token }
        });
      }

      Alert.alert('Success', existingCard ? 'Barber card updated successfully!' : 'Barber card created successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Error saving barber card:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to save barber card';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[theme.colors.background, theme.colors.card]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {barberCard ? 'Edit Your Card' : 'Create Your Card'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card Preview - Exactly as shown in BarberSearchScreen */}
        <BarberCardPreview
          barberData={{
            name: name || 'Your Name',
            address: 'Shop Address',
            image: barberCardImage ? { uri: barberCardImage } : (user?.profilePicture ? { uri: user.profilePicture } : null),
            rating: 0,
            reviews: 0,
            avgAppointmentTime,
            totalServices: services.length,
            isAvailable,
            tag: specialties[0] || 'General',
            category: 'Barber'
          }}
          theme={theme}
        />

        {/* Delete Button Section */}
        {existingCard && (!shopData?.isMainOwner || (shopData?.isMainOwner && shopData?.staff?.length === 0)) && (
          <View style={[styles.deleteContainer, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity onPress={handleDeleteBarberCard} style={styles.deleteCardButton}>
              <Trash size={20} color="#fff" />
              <Text style={styles.deleteCardButtonText}>Delete Barber Card</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barber Information */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Barber Information</Text>
          <InfoRow
            icon={User}
            label="Name"
            value={name || 'Enter your name'}
            theme={theme}
            onPress={() => {
              // Could open a modal or inline edit
              Alert.prompt('Barber Name', 'Enter your barber name', (text) => setName(text));
            }}
          />
          <InfoRow
            icon={Camera}
            label="Card Image"
            value={barberCardImage ? 'Image uploaded' : 'Tap to upload image'}
            theme={theme}
            onPress={pickBarberCardImage}
          />
          <InfoRow
            icon={Clock}
            label="Avg. Appointment Time"
            value={avgAppointmentTime}
            theme={theme}
            onPress={() => {
              Alert.prompt('Appointment Time', 'Enter average time (e.g., 30 min)', (text) => setAvgAppointmentTime(text));
            }}
          />
          <InfoRow
            icon={Tag}
            label="Availability"
            value={isAvailable ? 'Available' : 'Offline'}
            theme={theme}
            onPress={() => setIsAvailable(!isAvailable)}
          />
        </View>

        {/* Services Section */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Services</Text>
            <TouchableOpacity onPress={() => setShowServiceModal(true)}>
              <Plus size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {services.map(service => (
            <View key={service.id} style={[styles.serviceItem, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.serviceName, {color: theme.colors.text}]}>{service.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                  <Text style={[styles.servicePrice, {color: theme.colors.textSecondary}]}>₹{service.price}</Text>
                  <Text style={[styles.separator, {color: theme.colors.textSecondary}]}>|</Text>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.detailText, {color: theme.colors.textSecondary, marginLeft: 4}]}>{service.time} min</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => {
                setEditingService(service);
                setServicePrice(service.price);
                setServiceTime(service.time);
                setShowServiceModal(true);
              }} style={{marginRight: 15}}>
                <Edit size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeService(service.id)}>
                <Trash size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {services.length === 0 && (
            <Text style={[styles.noServicesText, { color: theme.colors.textSecondary }]}>
              No services added yet. Add your services to get started.
            </Text>
          )}
        </View>

        {/* Specialties Section */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Specialties</Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt('Add Specialty', 'Enter specialty (e.g., Haircut, Shave)', (specialty) => {
                if (specialty && !specialties.includes(specialty.trim())) {
                  setSpecialties([...specialties, specialty.trim()]);
                }
              });
            }}>
              <Plus size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.specialtiesContainer}>
            {specialties.map((specialty) => (
              <View key={specialty} style={[styles.specialtyTag, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                <Text style={[styles.specialtyText, { color: theme.colors.primary }]}>{specialty}</Text>
                <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                  <Text style={[styles.removeSpecialty, { color: theme.colors.primary }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {specialties.length === 0 && (
            <Text style={[styles.noServicesText, { color: theme.colors.textSecondary }]}>
              No specialties added yet. Add your specialties to stand out.
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={[styles.saveButton, loading && { opacity: 0.6 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>
              {loading ? 'SAVING...' : barberCard ? 'UPDATE CARD' : 'CREATE CARD'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Service Selection Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
          setServicePrice('');
          setServiceTime('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowServiceModal(false);
                setEditingService(null);
                setServicePrice('');
                setServiceTime('');
              }}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            {editingService ? (
              // Edit existing service
              <View style={styles.editServiceForm}>
                <Text style={[styles.editServiceName, { color: theme.colors.text }]}>
                  {editingService.name}
                </Text>
                <TextInput
                  style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  placeholder="Price"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.editInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={serviceTime}
                  onChangeText={setServiceTime}
                  placeholder="Time (minutes)"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.saveEditButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    if (!servicePrice.trim() || !serviceTime.trim()) {
                      Alert.alert('Error', 'Please fill all fields');
                      return;
                    }
                    const updatedServices = services.map(s =>
                      s.id === editingService.id
                        ? { ...s, price: servicePrice, time: serviceTime }
                        : s
                    );
                    setServices(updatedServices);
                    setShowServiceModal(false);
                    setEditingService(null);
                    setServicePrice('');
                    setServiceTime('');
                  }}
                >
                  <Text style={styles.saveEditButtonText}>Update Service</Text>
                </TouchableOpacity>
              </View>
            ) : selectedServiceForAdding ? (
              // Show price and time inputs for selected service
              <View style={styles.addServiceForm}>
                <Text style={[styles.selectedServiceName, { color: theme.colors.text }]}>
                  {selectedServiceForAdding.name}
                </Text>
                <Text style={[styles.selectedServiceDescription, { color: theme.colors.textSecondary }]}>
                  {selectedServiceForAdding.description}
                </Text>
                <TextInput
                  style={[styles.addServiceInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  placeholder="Enter price (₹)"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.addServiceInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={serviceTime}
                  onChangeText={setServiceTime}
                  placeholder="Enter time (minutes)"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                />
                <View style={styles.addServiceButtons}>
                  <TouchableOpacity
                    style={[styles.cancelAddButton, { borderColor: theme.colors.primary }]}
                    onPress={() => {
                      setSelectedServiceForAdding(null);
                      setServicePrice('');
                      setServiceTime('');
                    }}
                  >
                    <Text style={[styles.cancelAddButtonText, { color: theme.colors.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmAddButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      if (!servicePrice.trim() || !serviceTime.trim()) {
                        Alert.alert('Error', 'Please enter both price and time');
                        return;
                      }
                      const newService = {
                        id: Date.now().toString(),
                        serviceId: selectedServiceForAdding._id,
                        name: selectedServiceForAdding.name,
                        price: servicePrice.trim(),
                        time: serviceTime.trim()
                      };
                      setServices([...services, newService]);
                      setSelectedServiceForAdding(null);
                      setServicePrice('');
                      setServiceTime('');
                    }}
                  >
                    <Text style={styles.confirmAddButtonText}>Add Service</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Show available services to select from
              <FlatList
                data={availableServices.filter(service => {
                  const isAlreadySelected = services.some(s => {
                    const match = s.serviceId === service._id;
                    if (match) {
                      console.log(`Filtering out service ${service.name} (${service._id}) - already selected`);
                    }
                    return match;
                  });
                  return !isAlreadySelected;
                })}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.serviceItem,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border }
                    ]}
                    onPress={() => {
                      console.log(`Attempting to select service: ${item.name} (${item._id})`);
                      const alreadySelected = services.some(s => s.serviceId === item._id);
                      if (alreadySelected) {
                        console.log('Service already selected, should not be visible');
                        return;
                      }
                      setSelectedServiceForAdding(item);
                      setServicePrice('300'); // Default price
                      setServiceTime('30'); // Default time
                    }}
                  >
                    <View>
                      <Text style={[styles.serviceName, { color: theme.colors.text }]}>{item.name}</Text>
                      <Text style={[styles.serviceDescription, { color: theme.colors.textSecondary }]}>{item.description}</Text>
                      <Text style={[styles.serviceCategory, { color: theme.colors.primary }]}>{item.category}</Text>
                    </View>
                    <View style={[styles.addIndicator, { backgroundColor: theme.colors.primary }]}>
                      <Text style={{ color: 'white', fontSize: 12 }}>+</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                      All available services have been added to your card.
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                      You can edit prices and times for your selected services.
                    </Text>
                  </View>
                }
              />
            )}
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
    justifyContent: 'space-between',
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
  deleteButton: {
    padding: 8,
  },
  deleteContainer: {
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteCardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // BarberCard styles (matching BarberSearchScreen)
  barberCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 20,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  barberImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.4)',
    opacity: 0.6,
  },
  cardHeaderOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  glassLikeButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4757',
    marginRight: 6,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
  },
  imageDistanceText: {
    color: '#f0f0f0',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barberName: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  trendingText: {
    fontSize: 10,
    color: '#FF5722',
    fontWeight: '700',
    marginLeft: 2,
  },
  fullAddressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 4,
  },
  barberInitialLarge: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  detailsContainer: {
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'sans-serif-medium',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 20,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'sans-serif',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
  },
  servicePrice: {
    fontSize: 14,
  },
  separator: {
    color: '#999',
    marginHorizontal: 8,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 4,
  },
  noServicesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  addServiceForm: {
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  smallInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  addButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  removeSpecialty: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
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
  editServiceForm: {
    paddingHorizontal: 10,
  },
  editServiceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  saveEditButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  addIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedServiceName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectedServiceDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  addServiceInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  addServiceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelAddButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmAddButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CreateBarberCardScreen;
