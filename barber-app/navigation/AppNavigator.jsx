import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen.jsx';
import HomeScreen from '../screens/HomeScreen.jsx';
import SignupScreen from '../screens/SignupScreen.jsx';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen.jsx';
import OTPVerificationScreen from '../screens/OTPVerificationScreen.jsx';
import ResetPasswordScreen from '../screens/ResetPasswordScreen.jsx';
import ProfileScreen from '../screens/ProfileScreen.jsx';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen.jsx';
import PersonalInfoScreen from '../screens/PersonalInfoScreen.jsx';
import EditNameScreen from '../screens/EditNameScreen.jsx';
import EditPhoneNumberScreen from '../screens/EditPhoneNumberScreen.jsx';
import GenderSelectionScreen from '../screens/GenderSelectionScreen.jsx';
import EditEmailScreen from '../screens/EditEmailScreen.jsx';
import ChangePasswordScreen from '../screens/ChangePasswordScreen.jsx';
import ManageNotificationsScreen from '../screens/ManageNotificationsScreen.jsx';
import TwoFactorVerificationScreen from '../screens/TwoFactorVerificationScreen.jsx';

import PrivacyCheckupScreen from '../screens/PrivacyCheckupScreen.jsx';
import BarberSearchScreen from '../screens/BarberSearchScreen.jsx';
import WomenSalonSearchScreen from '../screens/WomenSalonSearchScreen.jsx';
import PetCareSearchScreen from '../screens/PetCareSearchScreen.jsx';
import BookingScreen from '../screens/BookingScreen.jsx';
import PaymentConfirmationScreen from '../screens/PaymentConfirmationScreen.jsx';
import HistoryScreen from '../screens/HistoryScreen.jsx';
import BookingDetailScreen from '../screens/BookingDetailScreen.jsx';
import BookAppointmentScreen from '../screens/BookAppointmentScreen.jsx';
import ShopInfoScreen from '../screens/ShopInfoScreen.jsx';
import EditShopNameScreen from '../screens/EditShopNameScreen.jsx';
import EditShopAddressScreen from '../screens/EditShopAddressScreen.jsx';
import EditShopPhoneScreen from '../screens/EditShopPhoneScreen.jsx';
import ListedCardScreen from '../screens/ListedCardScreen.jsx';
import AddEditServiceScreen from '../screens/AddEditServiceScreen.jsx';
import AllAppointmentsScreen from '../screens/AllAppointmentsScreen.jsx';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen.jsx';
import AvailabilityScreen from '../screens/AvailabilityScreen.jsx';
import EarningsScreen from '../screens/EarningsScreen.jsx';
import CustomersServedScreen from '../screens/CustomersServedScreen.jsx';
import CustomerReviewsScreen from '../screens/CustomerReviewsScreen.jsx';
import EditCategoryScreen from '../screens/EditCategoryScreen.jsx';
import NotificationsScreen from '../screens/NotificationsScreen.jsx';
import QueueManagementScreen from '../screens/QueueManagementScreen.jsx';
import AppointmentSettingsScreen from '../screens/AppointmentSettingsScreen.jsx';
import QueueHistoryScreen from '../screens/QueueHistoryScreen.jsx';
import BarberListingTierScreen from '../screens/ListingTierScreen.jsx';
import WomenSalonListingTierScreen from '../screens/WomenSalonListingTierScreen.jsx';
import PetCareListingTierScreen from '../screens/PetCareListingTierScreen.jsx';
import BarberProfileViewScreen from '../screens/BarberProfileViewScreen.jsx';
import EditTagScreen from '../screens/EditTagScreen.jsx';
import PaymentScreen from '../screens/PaymentScreen.jsx';
import AdPlacementBookingScreen from '../screens/AdPlacementBookingScreen.jsx';
import NotificationDetailScreen from '../screens/NotificationDetailScreen.jsx';
import ChatScreen from '../screens/ChatScreen.jsx';
import OfflineBookingScreen from '../screens/OfflineBookingScreen.jsx';
import EditUpiScreen from '../screens/EditUpiScreen.jsx';
import CreateShopCardScreen from '../screens/CreateShopCardScreen.jsx';
import CreateBarberCardScreen from '../screens/CreateBarberCardScreen.jsx';
import ManualLocationInputScreen from '../screens/ManualLocationInputScreen.jsx';
import EditOperatingHoursScreen from '../screens/EditOperatingHoursScreen.jsx';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ShopInfo" component={ShopInfoScreen} />
      <Stack.Screen name="EditShopName" component={EditShopNameScreen} />
      <Stack.Screen name="EditShopAddress" component={EditShopAddressScreen} />
      <Stack.Screen name="EditShopPhone" component={EditShopPhoneScreen} />
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
      <Stack.Screen name="ListedCard" component={ListedCardScreen} />
      <Stack.Screen name="AddEditService" component={AddEditServiceScreen} />
      <Stack.Screen name="AllAppointments" component={AllAppointmentsScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="CustomersServed" component={CustomersServedScreen} />
      <Stack.Screen name="CustomerReviews" component={CustomerReviewsScreen} />
      <Stack.Screen name="EditCategory" component={EditCategoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="QueueManagement" component={QueueManagementScreen} />
      <Stack.Screen name="AppointmentSettings" component={AppointmentSettingsScreen} />
      <Stack.Screen name="QueueHistory" component={QueueHistoryScreen} />
      <Stack.Screen name="ListingTier" component={BarberListingTierScreen} />
      <Stack.Screen name="WomenSalonListingTier" component={WomenSalonListingTierScreen} />
      <Stack.Screen name="PetCareListingTier" component={PetCareListingTierScreen} />
      <Stack.Screen name="BarberProfileViewScreen" component={BarberProfileViewScreen} />
      <Stack.Screen name="EditTag" component={EditTagScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="AdPlacementBooking" component={AdPlacementBookingScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="OfflineBooking" component={OfflineBookingScreen} />
      <Stack.Screen name="EditUpi" component={EditUpiScreen} />
      <Stack.Screen name="CreateBarberCard" component={CreateBarberCardScreen} />
      <Stack.Screen name="ManualLocationInput" component={ManualLocationInputScreen} />
      <Stack.Screen name="EditOperatingHours" component={EditOperatingHoursScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
