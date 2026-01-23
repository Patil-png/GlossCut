import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import api from "../utils/api";
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ChevronLeft, Store, MapPin, Phone, Tag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

const CreateShopCardScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [barberName, setBarberName] = useState(user?.name || '');
  const [specialty, setSpecialty] = useState(user?.tag || '');
  const [barberPhone, setBarberPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleCreateBarberCard = async () => {
    if (!barberName || !barberPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Update user profile with barber details
      const res = await api.put('/api/auth/user', {
        name: barberName,
        phone: barberPhone,
        tag: specialty,
      });

      Alert.alert('Success', 'Your barber card has been created successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create barber card:', err);
      Alert.alert('Error', 'Failed to create barber card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Your Barber Card</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={isDark ? [theme.colors.card, '#2c3e50'] : [theme.colors.primary, '#6dd5ed']}
            style={styles.iconContainer}
          >
            <Store size={40} color="#fff" />
          </LinearGradient>

          <Text style={[styles.title, { color: theme.colors.text }]}>Create Your Barber Card</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create your own barber card that customers will see. Decide what information to include.
          </Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            <Store size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={barberName}
              onChangeText={setBarberName}
              placeholder="Barber Name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            <Tag size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="Specialty"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            <Phone size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={barberPhone}
              onChangeText={setBarberPhone}
              placeholder="Phone"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateBarberCard}
            disabled={loading}
          >
            <Text style={[styles.createButtonText, { color: theme.colors.buttonText || '#fff' }]}>
              {loading ? 'Creating...' : 'Create Barber Card'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
  },
  picker: {
    flex: 1,
    height: 55,
    fontSize: 16,
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateShopCardScreen;
