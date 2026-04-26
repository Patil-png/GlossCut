import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/RootNavigation';
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
import SearchScreen from './screens/SearchScreen.jsx';
import BookingScreen from './screens/BookingScreen.jsx';
import BookingOTPVerificationScreen from './screens/BookingOTPVerificationScreen.jsx';
import PaymentConfirmationScreen from './screens/PaymentConfirmationScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import BookingDetailScreen from './screens/BookingDetailScreen.jsx';
import BookAppointmentScreen from './screens/BookAppointmentScreen.jsx';

import NotificationsScreen from './screens/NotificationsScreen.jsx';
import NotificationDetailScreen from './screens/NotificationDetailScreen.jsx';

import AppointmentFullPage from './screens/AppointmentFullPage.jsx';
import LikedBarbersScreen from './screens/LikedBarbersScreen.jsx';
import ChatScreen from './screens/ChatScreen.jsx';
import Appointmentcheckpage from './screens/Appointmentcheckpage.jsx';
import FaceSuggestorScreen from './screens/FaceSuggestorScreen.jsx';
import TrackQueueScreen from './screens/TrackQueueScreen.jsx';
import OnboardingScreen from './screens/OnboardingScreen.jsx';
import CustomerReviewsScreen from './screens/CustomerReviewsScreen.jsx';
import MapScreen from './screens/MapScreen.jsx';
import RefundPolicyScreen from './screens/RefundPolicyScreen.jsx';
import BarberReviewsScreen from './screens/BarberReviewsScreen.jsx';
import SplashScreen from './src/screens/SplashScreen.jsx';

import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { PrivacyProvider } from './contexts/PrivacyContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

const queryClient = new QueryClient();
const Stack = createStackNavigator();

const AppContent = () => {
  const { isLoading, user, isNewLogin } = useAuth();
  const { theme } = useTheme();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [isAppReady, setIsAppReady] = React.useState(false);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAppReady ? (
            <Stack.Screen name="Splash">
              {(props) => <SplashScreen {...props} onFinish={() => setIsAppReady(true)} />}
            </Stack.Screen>
          ) : !user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          ) : (
            <>
              {/* Dynamic Initial Route based on login type */}
              {isNewLogin ? (
                <>
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  <Stack.Screen name="Home" component={HomeScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                </>
              )}
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
              <Stack.Screen name="BarberSearch" component={SearchScreen} />
              <Stack.Screen name="WomenSalonSearch" component={SearchScreen} />
              <Stack.Screen name="PetCareSearch" component={SearchScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="BookingOTPVerification" component={BookingOTPVerificationScreen} />
              <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} />
              <Stack.Screen name="TrackQueue" component={TrackQueueScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
              <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />

              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
              
              <Stack.Screen name="AppointmentFull" component={AppointmentFullPage} />
              <Stack.Screen name="LikedBarbers" component={LikedBarbersScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Appointmentcheckpage" component={Appointmentcheckpage} />
              <Stack.Screen name="FaceSuggestor" component={FaceSuggestorScreen} />
              <Stack.Screen name="CustomerReviewsScreen" component={CustomerReviewsScreen} />
              <Stack.Screen name="MapScreen" component={MapScreen} />
              <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
              <Stack.Screen name="BarberReviews" component={BarberReviewsScreen} />
            </>
          )}
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <PrivacyProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </PrivacyProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F4F0'
  }
});
