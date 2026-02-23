import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './Layout';
import { useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// --- LAZY LOADED SCREENS ---
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ServicesScreen = lazy(() => import('./screens/Screens').then(m => ({ default: m.ServicesScreen })));
const AppointmentsScreen = lazy(() => import('./screens/AppointmentsScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SignupScreen = lazy(() => import('./screens/SignupScreen'));
const ForgotPasswordScreen = lazy(() => import('./screens/ForgotPasswordScreen'));
const OTPVerificationScreen = lazy(() => import('./screens/OTPVerificationScreen'));
const TwoFactorVerificationScreen = lazy(() => import('./screens/TwoFactorVerificationScreen'));
const ResetPasswordScreen = lazy(() => import('./screens/ResetPasswordScreen'));
const QueueManagementScreen = lazy(() => import('./screens/QueueManagementScreen'));
const EarningsScreen = lazy(() => import('./screens/EarningsScreen'));
const BoostVisibilityScreen = lazy(() => import('./screens/BoostVisibilityScreen'));
const CreateBarberCardScreen = lazy(() => import('./screens/CreateBarberCardScreen'));
const ListedCardScreen = lazy(() => import('./screens/ListedCardScreen'));
const EditShopNameScreen = lazy(() => import('./screens/EditShopNameScreen'));
const EditShopAddressScreen = lazy(() => import('./screens/EditShopAddressScreen'));
const EditShopPhoneScreen = lazy(() => import('./screens/EditShopPhoneScreen'));
const EditCategoryScreen = lazy(() => import('./screens/EditCategoryScreen'));
const EditNameScreen = lazy(() => import('./screens/EditNameScreen'));
const EditMaxAppointmentsScreen = lazy(() => import('./screens/EditMaxAppointmentsScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const NotificationSettingsScreen = lazy(() => import('./screens/NotificationSettingsScreen'));
const LanguageSelectionScreen = lazy(() => import('./screens/LanguageSelectionScreen'));
const AvailabilityScreen = lazy(() => import('./screens/AvailabilityScreen'));
const CustomerReviewsScreen = lazy(() => import('./screens/CustomerReviewsScreen'));
const CustomersServedScreen = lazy(() => import('./screens/CustomersServedScreen'));
const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const AllAppointmentsScreen = lazy(() => import('./screens/AllAppointmentsScreen'));
const BarberProfileViewScreen = lazy(() => import('./screens/BarberProfileViewScreen'));
const NotificationDetailScreen = lazy(() => import('./screens/NotificationDetailScreen'));
const EditOperatingHoursScreen = lazy(() => import('./screens/EditOperatingHoursScreen'));
const EditEmailScreen = lazy(() => import('./screens/EditEmailScreen'));
const EditPhoneNumberScreen = lazy(() => import('./screens/EditPhoneNumberScreen'));
const ManageNotificationsScreen = lazy(() => import('./screens/ManageNotificationsScreen'));
const ManualLocationInputScreen = lazy(() => import('./screens/ManualLocationInputScreen'));
const BarberSearchScreen = lazy(() => import('./screens/BarberSearchScreen'));
const EditUpiScreen = lazy(() => import('./screens/EditUpiScreen'));
const PersonalInfoScreen = lazy(() => import('./screens/PersonalInfoScreen'));
const PrivacyCheckupScreen = lazy(() => import('./screens/PrivacyCheckupScreen'));
const RefundPolicyScreen = lazy(() => import('./screens/RefundPolicyScreen'));
const OfflineBookingScreen = lazy(() => import('./screens/OfflineBookingScreen'));
const QueueHistoryScreen = lazy(() => import('./screens/QueueHistoryScreen'));
const QrStandeeScreen = lazy(() => import('./screens/QrStandeeScreen'));
const TaxSummaryScreen = lazy(() => import('./screens/TaxSummaryScreen'));
const PaymentScreen = lazy(() => import('./screens/PaymentScreen'));
const PaymentConfirmationScreen = lazy(() => import('./screens/PaymentConfirmationScreen'));
const AddEditServiceScreen = lazy(() => import('./screens/AddEditServiceScreen'));
const EditTagScreen = lazy(() => import('./screens/EditTagScreen'));
const GenderSelectionScreen = lazy(() => import('./screens/GenderSelectionScreen'));
const AppointmentDetailScreen = lazy(() => import('./screens/AppointmentDetailScreen'));
const BookingDetailScreen = lazy(() => import('./screens/BookingDetailScreen'));
const BookingScreen = lazy(() => import('./screens/BookingScreen'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-8">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <span className="text-xs font-black text-indigo-900/40 uppercase tracking-widest">Loading Experience</span>
    </div>
  </div>
);


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
    <Suspense fallback={<LoadingFallback />}>
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
    </Suspense>
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
