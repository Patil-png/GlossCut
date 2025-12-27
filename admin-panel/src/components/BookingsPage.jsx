import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [barberBookings, setBarberBookings] = useState([]);
  const [barberLoading, setBarberLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/bookings`);
        setBookings(res.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
      setLoading(false);
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchBarberBookings = async () => {
      if (!selectedDate) return;

      setBarberLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/bookings-by-date/${selectedDate}`);
        setBarberBookings(res.data);
      } catch (err) {
        console.error('Error fetching barber bookings:', err);
        setBarberBookings([]);
      }
      setBarberLoading(false);
    };

    fetchBarberBookings();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Bookings Management ({bookings.length})</h2>
      </div>

      {/* Barber Bookings Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Barber Daily Schedule</h3>
          <div className="flex items-center space-x-2">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {barberLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : barberBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings found for {new Date(selectedDate).toLocaleDateString()}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barberBookings.map((barberData) => (
              <div key={barberData.barberId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-800">{barberData.barberName}</h4>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {barberData.bookings.length} booking{barberData.bookings.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {barberData.bookings.map((booking) => (
                    <div key={booking._id} className="bg-white rounded-md p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.isOfflineBooking ? booking.customerName : (booking.userId?.name || 'N/A')}
                          {booking.isOfflineBooking && (
                            <span className="text-xs text-gray-500 block">(Offline)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{booking.time}</div>
                      </div>

                      <div className="text-xs text-gray-600 mb-2">
                        {booking.services?.map(service => service.name).join(', ') || 'N/A'}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-900">₹{booking.totalPrice}</div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status || 'Pending'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
