import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');

  const handleSendOTP = async () => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/password/forgot`, { email });
      navigation.navigate('OTPVerification', { email });
    } catch (err) {
      if (err.response) {
        Alert.alert('Error', err.response.data.msg);
      } else if (err.request) {
        Alert.alert('Error', 'No response from server');
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color={theme.colors.text} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Forgot Password</Text>
      </TouchableOpacity>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Enter your email address to receive a password reset OTP.</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder="Email"
        placeholderTextColor={theme.colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleSendOTP}>
        <Text style={[styles.buttonText, { color: theme.colors.background }]}>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 48,
  },
  input: {
    height: 56,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
