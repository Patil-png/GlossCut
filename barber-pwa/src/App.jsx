import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './Layout';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import { ServicesScreen } from './screens/Screens';
import AppointmentsScreen from './screens/AppointmentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import TwoFactorVerificationScreen from './screens/TwoFactorVerificationScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import './styles/global.css';
import { useEffect } from 'react';

import { ThemeProvider } from './context/ThemeContext';

import QueueManagementScreen from './screens/QueueManagementScreen';
import EarningsScreen from './screens/EarningsScreen';
import BoostVisibilityScreen from './screens/BoostVisibilityScreen';
import CreateBarberCardScreen from './screens/CreateBarberCardScreen';
import ListedCardScreen from './screens/ListedCardScreen';
import EditShopNameScreen from './screens/EditShopNameScreen';
import EditShopAddressScreen from './screens/EditShopAddressScreen';
import EditShopPhoneScreen from './screens/EditShopPhoneScreen';
import EditCategoryScreen from './screens/EditCategoryScreen';
import EditNameScreen from './screens/EditNameScreen';
import EditMaxAppointmentsScreen from './screens/EditMaxAppointmentsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import AvailabilityScreen from './screens/AvailabilityScreen';
import CustomerReviewsScreen from './screens/CustomerReviewsScreen';
import CustomersServedScreen from './screens/CustomersServedScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatScreen from './screens/ChatScreen';
import AllAppointmentsScreen from './screens/AllAppointmentsScreen';
import BarberProfileViewScreen from './screens/BarberProfileViewScreen';
import NotificationDetailScreen from './screens/NotificationDetailScreen';
import EditOperatingHoursScreen from './screens/EditOperatingHoursScreen';
import EditEmailScreen from './screens/EditEmailScreen';
import EditPhoneNumberScreen from './screens/EditPhoneNumberScreen';
import ManageNotificationsScreen from './screens/ManageNotificationsScreen';
import ManualLocationInputScreen from './screens/ManualLocationInputScreen';
import BarberSearchScreen from './screens/BarberSearchScreen';
import EditUpiScreen from './screens/EditUpiScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import PrivacyCheckupScreen from './screens/PrivacyCheckupScreen';
import RefundPolicyScreen from './screens/RefundPolicyScreen';
import OfflineBookingScreen from './screens/OfflineBookingScreen';
import QueueHistoryScreen from './screens/QueueHistoryScreen';
import QrStandeeScreen from './screens/QrStandeeScreen';
import TaxSummaryScreen from './screens/TaxSummaryScreen';
import PaymentScreen from './screens/PaymentScreen';
import PaymentConfirmationScreen from './screens/PaymentConfirmationScreen';
import ProtectedRoute from './components/ProtectedRoute';
import AddEditServiceScreen from './screens/AddEditServiceScreen';
import EditTagScreen from './screens/EditTagScreen';
import GenderSelectionScreen from './screens/GenderSelectionScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import BookingDetailScreen from './screens/BookingDetailScreen';
import BookingScreen from './screens/BookingScreen';


function AppContent() {
  const { setOauthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      navigate('/', { replace: true });
    }

    if (error) {
      if (error === 'signup_not_allowed' || error === 'role_not_allowed') {
        // Only redirect if we are NOT already on the signup page
        if (location.pathname !== '/signup') {
          navigate(`/signup?error=${error}`, { replace: true });
        }
      } else {
        setOauthError(error);
        // Clear the error param from URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location, navigate, setOauthError]);

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/otp-verification" element={<OTPVerificationScreen />} />
      <Route path="/two-factor-verification" element={<TwoFactorVerificationScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />

      <Route element={<Layout />}>
        <Route path="/create-barber-card" element={
          <ProtectedRoute>
            <CreateBarberCardScreen />
          </ProtectedRoute>
        } />
        <Route path="/listed-card" element={
          <ProtectedRoute>
            <ListedCardScreen />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        } />
        <Route path="/queue" element={
          <ProtectedRoute>
            <QueueManagementScreen />
          </ProtectedRoute>
        } />
        <Route path="/earnings" element={
          <ProtectedRoute>
            <EarningsScreen />
          </ProtectedRoute>
        } />
        <Route path="/walk-in" element={
          <ProtectedRoute>
            <OfflineBookingScreen />
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentsScreen />
          </ProtectedRoute>
        } />
        <Route path="/boost-visibility" element={
          <ProtectedRoute>
            <BoostVisibilityScreen />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute>
            <ServicesScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-shop-name" element={
          <ProtectedRoute>
            <EditShopNameScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-shop-address" element={
          <ProtectedRoute>
            <EditShopAddressScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-shop-phone" element={
          <ProtectedRoute>
            <EditShopPhoneScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-category" element={
          <ProtectedRoute>
            <EditCategoryScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-name" element={
          <ProtectedRoute>
            <EditNameScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-max-appointments" element={
          <ProtectedRoute>
            <EditMaxAppointmentsScreen />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsScreen />
          </ProtectedRoute>
        } />
        <Route path="/notification-settings" element={
          <ProtectedRoute>
            <NotificationSettingsScreen />
          </ProtectedRoute>
        } />
        <Route path="/notifications/:id" element={
          <ProtectedRoute>
            <NotificationDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-operating-hours" element={
          <ProtectedRoute>
            <EditOperatingHoursScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-upi" element={
          <ProtectedRoute>
            <EditUpiScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-email" element={
          <ProtectedRoute>
            <EditEmailScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-phone" element={
          <ProtectedRoute>
            <EditPhoneNumberScreen />
          </ProtectedRoute>
        } />
        <Route path="/manage-notifications" element={
          <ProtectedRoute>
            <ManageNotificationsScreen />
          </ProtectedRoute>
        } />
        <Route path="/manual-location" element={
          <ProtectedRoute>
            <ManualLocationInputScreen />
          </ProtectedRoute>
        } />
        <Route path="/barber-search" element={
          <ProtectedRoute>
            <BarberSearchScreen />
          </ProtectedRoute>
        } />
        <Route path="/personal-info" element={
          <ProtectedRoute>
            <PersonalInfoScreen />
          </ProtectedRoute>
        } />
        <Route path="/privacy-checkup" element={
          <ProtectedRoute>
            <PrivacyCheckupScreen />
          </ProtectedRoute>
        } />
        <Route path="/refund-policy" element={
          <ProtectedRoute>
            <RefundPolicyScreen />
          </ProtectedRoute>
        } />
        <Route path="/language-selection" element={
          <ProtectedRoute>
            <LanguageSelectionScreen />
          </ProtectedRoute>
        } />
        <Route path="/availability" element={
          <ProtectedRoute>
            <AvailabilityScreen />
          </ProtectedRoute>
        } />
        <Route path="/queue-history" element={
          <ProtectedRoute>
            <QueueHistoryScreen />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryScreen />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatScreen />
          </ProtectedRoute>
        } />
        <Route path="/all-appointments" element={
          <ProtectedRoute>
            <AllAppointmentsScreen />
          </ProtectedRoute>
        } />
        <Route path="/qr-standee" element={
          <ProtectedRoute>
            <QrStandeeScreen />
          </ProtectedRoute>
        } />
        <Route path="/tax-summary" element={
          <ProtectedRoute>
            <TaxSummaryScreen />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentScreen />
          </ProtectedRoute>
        } />
        <Route path="/payment-confirmation" element={
          <ProtectedRoute>
            <PaymentConfirmationScreen />
          </ProtectedRoute>
        } />
        <Route path="/add-edit-service" element={
          <ProtectedRoute>
            <AddEditServiceScreen />
          </ProtectedRoute>
        } />
        <Route path="/edit-tag" element={
          <ProtectedRoute>
            <EditTagScreen />
          </ProtectedRoute>
        } />
        <Route path="/gender-selection" element={
          <ProtectedRoute>
            <GenderSelectionScreen />
          </ProtectedRoute>
        } />
        <Route path="/barber-profile/:barberId" element={
          <ProtectedRoute>
            <BarberProfileViewScreen />
          </ProtectedRoute>
        } />
        <Route path="/customer-reviews/:customerId" element={
          <ProtectedRoute>
            <CustomerReviewsScreen />
          </ProtectedRoute>
        } />
        <Route path="/customers-served" element={
          <ProtectedRoute>
            <CustomersServedScreen />
          </ProtectedRoute>
        } />
        <Route path="/appointments/:id" element={
          <ProtectedRoute>
            <AppointmentDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/booking-detail" element={
          <ProtectedRoute>
            <BookingDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/book/:barberId" element={
          <ProtectedRoute>
            <BookingScreen />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
