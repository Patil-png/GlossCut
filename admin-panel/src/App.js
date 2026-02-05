import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OverviewPage from './components/OverviewPage';
import UsersPage from './components/UsersPage';
import BookingsPage from './components/BookingsPage';
import ReviewsPage from './components/ReviewsPage';
import AdsPage from './components/AdsPage';
import DealsPage from './components/DealsPage';
import ServicesPage from './components/ServicesPage';
import CardApprovalsPage from './components/CardApprovalsPage';
import EarningsPage from './components/EarningsPage';
import AuditLogsPage from './components/AuditLogsPage';
import SecuritySettings from './components/SecuritySettings';
import ChatPage from './components/ChatPage';
import SubscriptionPlansPage from './components/SubscriptionPlansPage';
import './App.css';

function AppContent() {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!admin) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<OverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="ads" element={<AdsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="approvals" element={<CardApprovalsPage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="security" element={<SecuritySettings />} />
          <Route path="subscriptions" element={<SubscriptionPlansPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  );
}

export default App;
