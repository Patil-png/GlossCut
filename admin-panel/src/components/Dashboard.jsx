import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const Dashboard = () => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  const sections = [
    { id: 'overview', name: 'Overview', path: '/' },
    { id: 'users', name: 'Users', path: '/users' },
    { id: 'bookings', name: 'Bookings', path: '/bookings' },
    { id: 'reviews', name: 'Reviews', path: '/reviews' },
    { id: 'earnings', name: 'Earnings', path: '/earnings' },
    { id: 'ads', name: 'Ads', path: '/ads' },
    { id: 'deals', name: 'Deals', path: '/deals' },
    { id: 'services', name: 'Services', path: '/services' },
    { id: 'approvals', name: 'Approvals', path: '/approvals' },
    { id: 'audit-logs', name: 'Audit Logs', path: '/audit-logs' },
  ];

  const getCurrentPageName = () => {
    const currentSection = sections.find(section => section.path === location.pathname);
    return currentSection ? currentSection.name : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">SetKarr Admin</h2>
          <p className="text-sm text-gray-600 mt-1">Management Panel</p>
        </div>
        <nav className="mt-6">
          {sections.map((section) => (
            <Link
              key={section.id}
              to={section.path}
              className={`block px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                location.pathname === section.path
                  ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {section.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {admin?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
              <p className="text-xs text-gray-500">{admin?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {getCurrentPageName()}
            </h1>
            <div className="text-sm text-gray-500">
              Welcome back, {admin?.name}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
