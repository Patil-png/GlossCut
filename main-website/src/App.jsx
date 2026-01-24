import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import CustomerAccountCreation from './components/CustomerAccountCreation.jsx';
import BarberAccountCreation from './components/BarberAccountCreation.jsx';
import AdminChat from './components/AdminChat.jsx';
import AllServicesSearch from './components/AllServicesSearch.jsx';
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
import CityLanding from './components/CityLanding.jsx';
import Blog from './components/Blog.jsx';

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
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/customer-account-creation" element={<CustomerAccountCreation />} />
              <Route path="/barber-account-creation" element={<BarberAccountCreation />} />
              <Route path="/all-services-search" element={<AllServicesSearch />} />
              <Route path="/customer-history" element={<CustomerHistory />} />
              <Route path="/customer-setkar-coins" element={<CustomerSetkarCoins />} />
              <Route path="/booking-details/:bookingId" element={<BookingDetails />} />
              <Route path="/booking-appointment" element={<BookingAppointment />} />
              <Route path="/booking-confirmation-waiting" element={<BookingConfirmationWaiting />} />
              <Route path="/payment" element={<PaymentScreen />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/appointment-full" element={<AppointmentFullPage />} />
              <Route path="/queue-status" element={<QueueStatus />} />
              <Route path="/admin-chat" element={<AdminChat />} />
              <Route path="/personal-info" element={<PersonalInfo />} />
              <Route path="/personal-info" element={<PersonalInfo />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {/* Local SEO Landing Pages */}
              <Route path="/nagpur" element={<CityLanding city="Nagpur" />} />
              <Route path="/amravati" element={<CityLanding city="Amravati" />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
