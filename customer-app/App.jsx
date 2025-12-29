import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import SignupScreen from './screens/SignupScreen.jsx';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen.jsx';
import OTPVerificationScreen from './screens/OTPVerificationScreen.jsx';
import ResetPasswordScreen from './screens/ResetPasswordScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen.jsx';
import PersonalInfoScreen from './screens/PersonalInfoScreen.jsx';
import EditNameScreen from './screens/EditNameScreen.jsx';
import EditPhoneNumberScreen from './screens/EditPhoneNumberScreen.jsx';
import GenderSelectionScreen from './screens/GenderSelectionScreen.jsx';
import EditEmailScreen from './screens/EditEmailScreen.jsx';
import ChangePasswordScreen from './screens/ChangePasswordScreen.jsx';
import ManageNotificationsScreen from './screens/ManageNotificationsScreen.jsx';
import TwoFactorVerificationScreen from './screens/TwoFactorVerificationScreen.jsx';

import PrivacyCheckupScreen from './screens/PrivacyCheckupScreen.jsx';
import BarberSearchScreen from './screens/BarberSearchScreen.jsx';
import WomenSalonSearchScreen from './screens/WomenSalonSearchScreen.jsx';
import PetCareSearchScreen from './screens/PetCareSearchScreen.jsx';
import BookingScreen from './screens/BookingScreen.jsx';
import PaymentConfirmationScreen from './screens/PaymentConfirmationScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import BookingDetailScreen from './screens/BookingDetailScreen.jsx';
import BookAppointmentScreen from './screens/BookAppointmentScreen.jsx';
import AppointmentTypeScreen from './screens/AppointmentTypeScreen.jsx';
import NotificationsScreen from './screens/NotificationsScreen.jsx';
import NotificationDetailScreen from './screens/NotificationDetailScreen.jsx';
import RequestSentScreen from './screens/RequestSentScreen.jsx';
import AppointmentFullPage from './screens/AppointmentFullPage.jsx';
import LikedBarbersScreen from './screens/LikedBarbersScreen.jsx';
import ChatScreen from './screens/ChatScreen.jsx';
import Appointmentcheckpage from './screens/Appointmentcheckpage.jsx';
import SetkarCoinsScreen from './screens/SetkarCoinsScreen.jsx'; // Import SetkarCoinsScreen
import SetkarCoinHistoryScreen from './screens/SetkarCoinHistoryScreen.jsx'; // Import SetkarCoinHistoryScreen
import ExclusiveDealsScreen from './screens/ExclusiveDealsScreen.jsx'; // Import ExclusiveDealsScreen
import FaceSuggestorScreen from './screens/FaceSuggestorScreen.jsx'; // Import FaceSuggestorScreen (maintenance)
import OnboardingScreen from './screens/OnboardingScreen.jsx'; // Import OnboardingScreen
import CustomerReviewsScreen from './screens/CustomerReviewsScreen.jsx'; // Import CustomerReviewsScreen
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'; // Import useAuth
import { PrivacyProvider } from './contexts/PrivacyContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // Import for loading indicator

const queryClient = new QueryClient();
const Stack = createStackNavigator();

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="EditName" component={EditNameScreen} />
        <Stack.Screen name="EditPhoneNumber" component={EditPhoneNumberScreen} />
        <Stack.Screen name="GenderSelection" component={GenderSelectionScreen} />
        <Stack.Screen name="EditEmail" component={EditEmailScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ManageNotifications" component={ManageNotificationsScreen} />
        <Stack.Screen name="TwoFactorVerification" component={TwoFactorVerificationScreen} />
        <Stack.Screen name="PrivacyCheckup" component={PrivacyCheckupScreen} />
        <Stack.Screen name="BarberSearch" component={BarberSearchScreen} />
        <Stack.Screen name="WomenSalonSearch" component={WomenSalonSearchScreen} />
        <Stack.Screen name="PetCareSearch" component={PetCareSearchScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
        <Stack.Screen name="AppointmentType" component={AppointmentTypeScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
        <Stack.Screen name="RequestSent" component={RequestSentScreen} />
        <Stack.Screen name="AppointmentFull" component={AppointmentFullPage} />
        <Stack.Screen name="LikedBarbers" component={LikedBarbersScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Appointmentcheckpage" component={Appointmentcheckpage} />
        <Stack.Screen name="SetkarCoinsScreen" component={SetkarCoinsScreen} />
        <Stack.Screen name="SetkarCoinHistoryScreen" component={SetkarCoinHistoryScreen} />
        <Stack.Screen name="ExclusiveDealsScreen" component={ExclusiveDealsScreen} />
        <Stack.Screen name="FaceSuggestor" component={FaceSuggestorScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="CustomerReviewsScreen" component={CustomerReviewsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <PrivacyProvider>
            <AppContent />
          </PrivacyProvider>
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
  },
});
