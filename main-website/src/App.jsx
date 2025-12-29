import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#050505] text-white">
          <Navbar />

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
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
