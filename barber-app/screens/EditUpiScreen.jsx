import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditUpiScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const { currentUpiId } = route.params;
  const [upiId, setUpiId] = useState(currentUpiId || '');
  const [loading, setLoading] = useState(false);

  const handleSaveUpiId = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/shop`, { upiId }, {
          headers: { 'x-auth-token': token },
        });
        Alert.alert('Success', 'UPI ID updated successfully!');
        navigation.goBack();
      } catch (err) {
        console.error("Failed to update UPI ID", err);
        Alert.alert('Error', 'Failed to update UPI ID. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit UPI ID</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Your UPI ID</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="Enter your UPI ID (e.g., yourname@bank)"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveUpiId}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.buttonText }]}>
            {loading ? 'Saving...' : 'Save UPI ID'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditUpiScreen;
