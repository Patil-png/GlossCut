import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import CustomerAccountCreation from './components/CustomerAccountCreation.jsx';
import BarberAccountCreation from './components/BarberAccountCreation.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import PartnerLanding from './components/PartnerLanding.jsx';
import AdminChat from './components/AdminChat.jsx';
// Optimized: Lazy load search page
import CityLanding from './components/CityLanding.jsx';
import Blog from './components/Blog.jsx';
import CustomerHistory from './components/CustomerHistory.jsx';
import CustomerSetkarCoins from './components/CustomerSetkarCoins.jsx';
import BookingDetails from './components/BookingDetails.jsx';
import Navbar from './components/Navbar.jsx';
import BookingAppointment from './components/BookingAppointment.jsx';
import BookingConfirmationWaiting from './components/BookingConfirmationWaiting.jsx';
import PaymentScreen from './components/PaymentScreen.jsx';
import BookingSuccess from './components/BookingSuccess.jsx';
import AppointmentFullPage from './components/AppointmentFullPage.jsx';
import QueueStatus from './components/QueueStatus.jsx';
import PersonalInfo from './components/PersonalInfo.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import NotFound from './components/NotFound.jsx';
import Footer from './components/Footer.jsx';
import AboutUs from './components/AboutUs.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import RefundPolicy from './components/RefundPolicy.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Pricing from './components/Pricing.jsx';
import ContactUs from './components/ContactUs.jsx';

import QrTracker from './components/QrTracker.jsx';
import CheckInPage from './components/CheckInPage.jsx';
import TrackQueue from './components/TrackQueue.jsx';

import ShopsMapPage from './components/ShopsMapPage.jsx';
import QRScannerPage from './components/QRScannerPage.jsx';
import GlobalBookingBanner from './components/GlobalBookingBanner.jsx';

// Lazy loaded component defined AFTER all imports
const AllServicesSearch = lazy(() => import('./components/AllServicesSearch.jsx'));

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            <Navbar className="no-print" />

            <main className="flex-grow flex flex-col">
              <QrTracker className="no-print" />
              <Suspense fallback={
                <div className="flex h-screen items-center justify-center bg-[#050505]">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/customer-account-creation" element={<CustomerAccountCreation />} />
                  <Route path="/barber-account-creation" element={<BarberAccountCreation />} />
                  <Route path="/partner" element={<PartnerLanding />} />
                  <Route path="/all-services-search" element={<AllServicesSearch />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/checkin/:shopId" element={<CheckInPage />} />
                  <Route path="/track-queue/:trackingId?" element={<TrackQueue />} />
                  <Route path="/nagpur" element={<CityLanding city="Nagpur" />} />
                  <Route path="/amravati" element={<CityLanding city="Amravati" />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/shops-map" element={<ShopsMapPage />} />
                  <Route path="/scan" element={<QRScannerPage />} />
                  <Route path="/booking-success/:bookingId?" element={<BookingSuccess />} />

                  {/* Protected Routes - Require Authentication */}
                  <Route path="/customer-history" element={<ProtectedRoute><CustomerHistory /></ProtectedRoute>} />
                  <Route path="/customer-setkar-coins" element={<ProtectedRoute><CustomerSetkarCoins /></ProtectedRoute>} />
                  <Route path="/booking-details/:bookingId" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
                  <Route path="/booking-appointment" element={<ProtectedRoute><BookingAppointment /></ProtectedRoute>} />
                  <Route path="/booking-confirmation-waiting" element={<ProtectedRoute><BookingConfirmationWaiting /></ProtectedRoute>} />
                  <Route path="/payment" element={<ProtectedRoute><PaymentScreen /></ProtectedRoute>} />
                  <Route path="/appointment-full" element={<ProtectedRoute><AppointmentFullPage /></ProtectedRoute>} />
                  <Route path="/queue-status" element={<ProtectedRoute><QueueStatus /></ProtectedRoute>} />
                  <Route path="/admin-chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
                  <Route path="/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
                  <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            <GlobalBookingBanner />
            <Footer className="no-print" />
            <CookieConsent className="no-print" />
          </div>
        </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
