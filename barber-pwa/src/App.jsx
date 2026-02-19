import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './Layout';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import { ServicesScreen } from './screens/Screens';
import AppointmentsScreen from './screens/AppointmentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignupScreen from './screens/SignupScreen';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Placeholder for screens not yet implemented
const WalkInPlaceholder = () => <div className="p-8 text-center text-gray-500">Walk-In Screen (Coming Soon)</div>;

import { ThemeProvider } from './context/ThemeContext';

import QueueManagementScreen from './screens/QueueManagementScreen';
import EarningsScreen from './screens/EarningsScreen';
import CreateBarberCardScreen from './screens/CreateBarberCardScreen';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />

            <Route element={<Layout />}>
              <Route path="/create-barber-card" element={
                <ProtectedRoute>
                  <CreateBarberCardScreen />
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
                  <WalkInPlaceholder />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <AppointmentsScreen />
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
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
