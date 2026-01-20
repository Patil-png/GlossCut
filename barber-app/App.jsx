import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/RootNavigation';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'; // Import useAuth
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator.jsx';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native'; // Import for loading indicator
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import BiometricLockScreen from './components/BiometricLockScreen';

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading, isLocked, authenticateBiometric } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  // Show Lock Screen if locked
  if (isLocked) {
    return <BiometricLockScreen onUnlock={authenticateBiometric} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '80%',
    borderRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  unlockText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
