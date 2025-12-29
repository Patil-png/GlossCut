import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

const tiers = [
  { id: 1, name: 'Premium', price: '999', place: '1st', icon: 'crown' },
  { id: 2, name: 'Gold', price: '899', place: '2nd', icon: 'star' },
  { id: 3, name: 'Silver', price: '799', place: '3rd', icon: 'medal' },
  { id: 4, name: 'Bronze', price: '699', place: '4th', icon: 'shield' },
  { id: 5, name: 'Standard', price: '599', place: '5th', icon: 'check-circle' },
  { id: 6, name: 'Basic', price: '499', place: '6th', icon: 'information' },
  { id: 7, name: 'Entry', price: '399', place: '7th', icon: 'tag' },
  { id: 8, name: 'Starter', price: '299', place: '8th', icon: 'rocket' },
  { id: 9, name: 'Lite', price: '199', place: '9th', icon: 'leaf' },
  { id: 10, name: 'Free', price: '99', place: '10th', icon: 'gift' },
];

const COLORS = {
  primary: '#6a11cb',
  primaryLight: '#f0e6ff',
  dark: '#212121',
  text: '#424242',
  textSecondary: '#757575',
  lightGray: '#F9F9F9',
  white: '#FFFFFF',
  black: '#000000',
  red: '#dc3545',
  green: '#28a745',
  gray: '#b0b0b0',
  lightBorder: '#EEEEEE',
  lockedBg: '#F5F5F5',
};

const PetCareListingTierScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState(null);
  const [lockedPlaces, setLockedPlaces] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listingConfirmed, setListingConfirmed] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const fetchShopAndLockedPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const shopRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, {
        headers: { 'x-auth-token': token }
      });
      setMyShop(shopRes.data);
      if (shopRes.data.selectedListingPlace && shopRes.data.selectedListingPlace.category === 'Pet Care') {
        setSelectedTier(tiers.find(t => t.id === shopRes.data.selectedListingPlace.tierId));
        setListingConfirmed(true);
      } else {
        setSelectedTier(null);
        setListingConfirmed(false);
      }

      const lockedRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/locked-places?category=Pet Care`);
      setLockedPlaces(lockedRes.data);

    } catch (error) {
      console.error('Error fetching shop or locked places:', error);
      Alert.alert('Error', 'Could not load listing tiers.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchShopAndLockedPlaces();
    }, [fetchShopAndLockedPlaces])
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Pet Care Listing Tiers...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.loadingText}>Please log in to manage your pet care listing tier.</Text>
      </View>
    );
  }

  const handleSelectTier = (tier) => {
    if (listingConfirmed) {
      Alert.alert('Listing Confirmed', 'You have already confirmed a listing tier. Please cancel it first if you wish to change.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    const lockedPlace = lockedPlaces.find((lp) => lp.tierId === tier.id && lp.category === 'Pet Care');

    if (lockedPlace && lockedPlace.lockedBy) {
      navigation.navigate('BarberProfileViewScreen', { barberId: lockedPlace.lockedBy._id });
      return;
    }

    if (selectedTier?.id === tier.id) {
      setSelectedTier(null);
    } else {
      setSelectedTier(tier);
    }
  };

  const handleConfirm = () => {
    if (selectedTier) {
      navigation.navigate('PaymentScreen', { tier: selectedTier, category: 'Pet Care' });
    } else {
      Alert.alert('No Tier Selected', 'Please select a tier to proceed.');
    }
  };

  const handleCancelListing = async () => {
    setShowCancelConfirmation(false);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found.');
        setLoading(false);
        return;
      }

      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/barber/cancel-listing/${user.id}`, { category: 'Pet Care' }, {
        headers: { 'x-auth-token': token }
      });

      Alert.alert('Success', 'Your listing has been successfully cancelled.');
      setListingConfirmed(false);
      setSelectedTier(null);
      fetchShopAndLockedPlaces();
    } catch (error) {
      console.error('Error cancelling listing:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not cancel listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightGray} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Pet Care Listing Tier</Text>
        <Text style={styles.subtitle}>
          Select a spot to boost your visibility in search results.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tierListContainer}>
          {tiers.map((tier) => {
            const foundLockedPlace = lockedPlaces.find(lp => lp.tierId === tier.id && lp.category === 'Pet Care');
            const isLockedByOther = user && foundLockedPlace && foundLockedPlace.lockedBy && foundLockedPlace.lockedBy._id !== user.id;
            const isLockedByYou = user && foundLockedPlace && foundLockedPlace.lockedBy && foundLockedPlace.lockedBy._id === user.id;
            const isSelected = selectedTier?.id === tier.id;
            
            const lockedTextStyle = isLockedByOther ? { color: COLORS.textSecondary } : {};

            return (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierCard,
                  isSelected && styles.selectedTierCard,
                  isLockedByOther && styles.lockedTierCard,
                ]}
                onPress={() => handleSelectTier(tier)}
                disabled={isLockedByOther || listingConfirmed}
              >
                <View style={styles.tierCardContent}>
                  <View style={styles.tierIconContainer}>
                    <MaterialCommunityIcons
                      name={tier.icon}
                      size={28}
                      color={isSelected ? COLORS.primary : (isLockedByOther ? COLORS.textSecondary : COLORS.text)}
                    />
                  </View>

                  <View style={styles.tierDetails}>
                    <Text style={[styles.tierName, lockedTextStyle]}>{tier.name} Tier</Text>
                    <Text style={[styles.tierPlace, lockedTextStyle]}>{tier.place} Place</Text>
                    <Text style={[styles.tierPrice, isSelected && { color: COLORS.primary }, lockedTextStyle]}>
                      ₹{tier.price}
                    </Text>
                  </View>

                  <View style={styles.tierStatus}>
                    {isSelected && <Ionicons name="checkmark-circle" size={26} color={COLORS.green} />}
                    {isLockedByYou && <Ionicons name="lock-closed" size={22} color={COLORS.primary} />}
                    {isLockedByOther && <Ionicons name="lock-closed" size={22} color={COLORS.textSecondary} />}
                  </View>
                </View>

                {foundLockedPlace && foundLockedPlace.lockedBy && (
                  <Text style={styles.lockedByText}>
                    {isLockedByYou ? 'Locked by you' : `Locked by ${foundLockedPlace.lockedBy.name}`}
                  </Text>
                )}
                {isLockedByOther && (
                  <Text style={styles.lockedByOtherMessage}>This spot is taken. View their profile.</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        {listingConfirmed ? (
          <View style={styles.bottomButtonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewProfileButton]}
              onPress={() => navigation.navigate('BarberProfileViewScreen', { barberId: user.id })}
            >
              <Text style={[styles.actionButtonText, styles.viewProfileButtonText]}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelListingButton]}
              onPress={() => setShowCancelConfirmation(true)}
            >
              <Text style={[styles.actionButtonText, styles.cancelListingButtonText]}>Cancel Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton, !selectedTier && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!selectedTier}
          >
            <Text style={styles.actionButtonText}>
              {selectedTier ? `Confirm ${selectedTier.name} Tier` : 'Select a Tier'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showCancelConfirmation && (
        <BlurView intensity={90} tint="dark" style={styles.confirmationModal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Cancellation</Text>
            <Text style={styles.modalMessage}>Are you sure you want to cancel your current listing? This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setShowCancelConfirmation(false)}>
                <Text style={styles.modalButtonText}>No, Keep Listing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={handleCancelListing}>
                <Text style={styles.modalButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBorder,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 120,
    paddingTop: 20,
  },
  tierListContainer: {
  },
  tierCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'column',
  },
  selectedTierCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  lockedTierCard: {
    backgroundColor: COLORS.lockedBg,
    borderColor: COLORS.lightBorder,
  },
  tierCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tierDetails: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  tierPlace: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tierStatus: {
    marginLeft: 10,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedByText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    paddingLeft: 63,
    fontWeight: '500',
  },
  lockedByOtherMessage: {
    fontSize: 13,
    color: COLORS.red,
    marginTop: 4,
    paddingLeft: 63,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 15,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewProfileButton: {
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  viewProfileButtonText: {
    color: COLORS.white,
  },
  cancelListingButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.red,
    borderWidth: 2,
    marginLeft: 8,
  },
  cancelListingButtonText: {
    color: COLORS.red,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  confirmationModal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.dark,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.red,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default PetCareListingTierScreen;
