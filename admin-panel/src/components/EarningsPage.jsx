import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EarningsPage = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/earnings?t=${timestamp}`);
      setEarningsData(res.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Unable to load earnings data</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Analytics</h1>
          <p className="text-gray-600">Real-time platform revenue and performance data</p>
        </div>
        <button
          onClick={() => fetchEarnings(true)}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Barber Earnings */}
      {earningsData.barberEarnings && earningsData.barberEarnings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Barber Revenue Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Booking</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earningsData.barberEarnings.map((barber, index) => (
                  <tr key={barber.barberId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {barber.barberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {barber.barberEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(barber.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {barber.bookingCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(barber.averageBooking)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Type Popularity */}
      {earningsData.appointmentTypes && earningsData.appointmentTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Appointment Type Popularity</h3>
          <div className="space-y-4">
            {earningsData.appointmentTypes.map((type, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 capitalize">
                      {type.appointmentType}
                    </span>
                    {index === 0 && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{type.percentage}%</span>
                    <span className="text-sm text-gray-600 ml-1">({type.bookingCount} bookings)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-600">Total Revenue: {formatCurrency(type.totalEarnings)}</span>
                  <span className="text-indigo-600 font-medium">Platform Fees: {formatCurrency(type.platformFees)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Fees Summary */}
          <div className="mt-6 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-indigo-800 mb-2">Total Platform Revenue</h4>
              <p className="text-3xl font-bold text-indigo-600">
                {formatCurrency(earningsData.totalPlatformFees)}
              </p>
              <p className="text-xs text-indigo-500 mt-1">
                From {earningsData.totalBookings} completed bookings
              </p>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-2 text-sm">
              {earningsData.appointmentTypes.map((type) => {
                const rate = type.appointmentType === 'basic' ? 7 :
                           type.appointmentType === 'express' ? 20 :
                           type.appointmentType === 'standard' ? 5 : 5;
                return (
                  <div key={type.appointmentType} className="flex justify-between items-center text-indigo-700">
                    <span>{type.appointmentType.charAt(0).toUpperCase() + type.appointmentType.slice(1)} bookings ({type.percentage}% = {type.bookingCount} bookings):</span>
                    <span className="font-medium">{type.bookingCount} × ₹{rate} = {formatCurrency(type.platformFees)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{earningsData.appointmentTypes.length}</p>
              <p className="text-sm text-gray-600">Appointment Types</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {earningsData.appointmentTypes[0]?.appointmentType || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Most Popular</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {earningsData.appointmentTypes[0]?.percentage || 0}%
              </p>
              <p className="text-sm text-gray-600">Market Share</p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default EarningsPage;
