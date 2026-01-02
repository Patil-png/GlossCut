import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock, CheckCircle2, AlertCircle, User, Calendar,
  MapPin, Star, ArrowRight, Phone, MessageSquare,
  Shield, Loader2, Sparkles, Receipt, Mail, FileText,
  Hash, UserCheck
} from 'lucide-react';

const BookingConfirmationWaiting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const {
    barberData,
    selectedServices,
    selectedAppointmentType,
    customerInfo,
    totalPrice
  } = location.state || {};

  const [confirmationStatus, setConfirmationStatus] = useState('creating'); // 'creating', 'waiting', 'confirmed', 'declined', 'timeout'
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [otp, setOtp] = useState(null); // Store OTP for display
  const bookingCreatedRef = useRef(false); // Use ref to prevent duplicate bookings

  useEffect(() => {
    if (!barberData) {
      navigate('/all-services-search');
      return;
    }

    // Only create booking once to prevent duplicates
    if (!bookingCreatedRef.current) {
      bookingCreatedRef.current = true;
      console.log('Creating booking...');
      createBooking();
    } else {
      console.log('Booking already created, skipping...');
    }
  }, []); // Empty dependency array to run only once on mount

  const createBooking = async () => {
    try {
      setConfirmationStatus('creating');

      // selectedServices is now an array of service objects with id, name, price
      const services = selectedServices || [];

      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      // Prepare booking data
      const bookingData = {
        barberId: barberData.owner._id, // Use barber's user ID, not shop ID
        shopId: barberData.id, // Shop ID for reference
        services,
        totalPrice,
        date: currentDate,
        time: currentTime,
        appointmentType: selectedAppointmentType?.name,
        customerInfo,
        status: 'pending'
      };

      // Choose endpoint based on authentication status
      const endpoint = isAuthenticated ? '/api/booking' : '/api/booking/public';
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth token if authenticated
      if (isAuthenticated && token) {
        headers['x-auth-token'] = token;
      }

      // Create booking
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        bookingData,
        { headers }
      );

      if (response.data && response.data._id) {
        setBookingId(response.data._id);
        setOtp(response.data.otp); // Store OTP from response
        setConfirmationStatus('waiting');
        // Start polling for booking status changes
        startPolling(response.data._id);
      } else {
        setError('Failed to create booking. Please try again.');
        setConfirmationStatus('error');
      }
    } catch (err) {
      console.error('Booking creation failed:', err);
      setError('Failed to create booking. Please try again.');
      setConfirmationStatus('error');
    }
  };

  const startPolling = (bookingId) => {
    // Poll every 3 seconds for booking status changes
    const pollInterval = setInterval(async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };

        // Add auth token if authenticated
        if (isAuthenticated && token) {
          headers['x-auth-token'] = token;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`,
          { headers }
        );

        const booking = response.data;
        setWaitingTime(prev => prev + 3);
        setTimeLeft(prev => Math.max(0, prev - 3));

        if (booking.status === 'confirmed') {
          setConfirmationStatus('confirmed');
          clearInterval(pollInterval);
        } else if (booking.status === 'declined' || booking.status === 'cancelled') {
          setConfirmationStatus('declined');
          clearInterval(pollInterval);
        }

        // Stop polling after 5 minutes (300 seconds) to prevent infinite polling
        if (waitingTime >= 297) { // Close to 300 to account for timing
          clearInterval(pollInterval);
          setError('Booking confirmation timeout. Please contact the barber directly.');
          setConfirmationStatus('timeout');
        }
      } catch (err) {
        console.error('Failed to check booking status:', err);
        // Continue polling even if one request fails
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  };

  useEffect(() => {
    if (confirmationStatus === 'confirmed') {
      // Auto-navigate to payment after 2 seconds of showing confirmed status
      const paymentTimer = setTimeout(() => {
        navigate('/payment', {
          state: {
            barberData,
            selectedServices,
            selectedAppointmentType,
            customerInfo,
            totalPrice,
            bookingId,
            bookingData: {
              _id: bookingId,
              barberId: barberData.owner._id,
              shopId: barberData.id,
              services: selectedServices,
              totalPrice,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().slice(0, 5),
              appointmentType: selectedAppointmentType?.name,
              customerInfo,
              status: 'confirmed'
            }
          }
        });
      }, 2000);

      return () => clearTimeout(paymentTimer);
    }
  }, [confirmationStatus, navigate, barberData, selectedServices, selectedAppointmentType, customerInfo, totalPrice, bookingId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!barberData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-white">Loading booking details...</p>
          <button
            onClick={() => navigate('/all-services-search')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pt-16 pb-8 relative overflow-hidden">
      {/* Background Decor - Mobile Optimized */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-md mx-auto px-4 sm:px-6">

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl mb-4 shadow-lg">
             <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full" />
                <Clock className="w-6 h-6 text-indigo-400 relative z-10" />
             </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Booking Confirmation</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Securing your session with <span className="text-indigo-400 font-semibold">{barberData.name}</span>.
          </p>
        </div>

        {/* Status Section - Mobile Optimized */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden text-center">
          {/* Status Background Glow */}
          <div className={`absolute inset-0 opacity-10 transition-colors duration-500 pointer-events-none ${
             confirmationStatus === 'waiting' ? 'bg-indigo-500' :
             confirmationStatus === 'confirmed' ? 'bg-emerald-500' :
             confirmationStatus === 'declined' ? 'bg-red-500' : 'bg-slate-500'
          }`} />

          <div className="relative z-10">
             {confirmationStatus === 'waiting' && (
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 relative mb-4">
                      <div className="absolute inset-0 border-3 border-indigo-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-3 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-indigo-400 tabular-nums">
                         {timeLeft}
                      </div>
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">Awaiting Approval</h2>
                   <p className="text-gray-400 text-sm">The barber has 5 minutes to confirm your request.</p>
                   {bookingId && (
                      <div className="mt-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-xs text-gray-500 font-mono">
                         ID: {bookingId}
                      </div>
                   )}
                </div>
             )}

             {confirmationStatus === 'confirmed' && (
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Accepted!</h2>
                   <p className="text-emerald-400 text-sm mb-4">Redirecting to payment...</p>
                   {otp && (
                      <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg px-6 py-3 mb-3">
                         <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Appointment Code</span>
                         <span className="text-3xl font-mono font-bold text-white tracking-widest">{otp}</span>
                      </div>
                   )}
                </div>
             )}

             {(confirmationStatus === 'declined' || confirmationStatus === 'timeout' || confirmationStatus === 'error') && (
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">
                      {confirmationStatus === 'declined' ? 'Booking Declined' : 'Request Timeout'}
                   </h2>
                   <p className="text-gray-400 text-sm mb-4 max-w-xs">
                      {confirmationStatus === 'declined'
                         ? 'The barber is unable to accept this specific time slot.'
                         : 'We didn\'t receive a confirmation in time. Please try again.'}
                   </p>
                   <button
                      onClick={() => navigate('/all-services-search')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/10 transition-all flex items-center gap-2 text-sm"
                   >
                      Find Another Barber <ArrowRight size={16} />
                   </button>
                </div>
             )}
          </div>
        </div>

        {/* Mobile-First Single Column Layout */}
        <div className="space-y-4">

           {/* Booked For Section */}
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><UserCheck size={16} /></div>
                 Booked For
              </h3>
              <div className="space-y-3">
                 <div className="flex items-start gap-3">
                    <User size={16} className="text-gray-500 mt-0.5" />
                    <div>
                       <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Name</p>
                       <p className="text-white font-medium">{customerInfo?.name || 'Guest'}</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-500 mt-0.5" />
                    <div>
                       <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone</p>
                       <p className="text-white font-medium">{customerInfo?.phone || '-'}</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <Mail size={16} className="text-gray-500 mt-0.5" />
                    <div>
                       <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</p>
                       <p className="text-white font-medium break-all text-sm">{customerInfo?.email || '-'}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Appointment Details Section */}
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Receipt size={16} /></div>
                 Appointment
              </h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm flex items-center gap-2"><Calendar size={14} /> Date</span>
                    <span className="text-white font-medium text-sm">{formatDate(new Date().toISOString().split('T')[0])}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm flex items-center gap-2"><Clock size={14} /> Time</span>
                    <span className="text-white font-medium text-sm">{new Date().toTimeString().slice(0, 5)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm flex items-center gap-2"><Sparkles size={14} /> Tier</span>
                    <span className="text-white font-medium text-sm">{selectedAppointmentType?.name}</span>
                 </div>
                 <div className="pt-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Services ({selectedServices?.length})</p>
                    <div className="flex flex-wrap gap-2">
                       {selectedServices && selectedServices.map((service, idx) => (
                          <span key={idx} className="text-xs font-medium bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded-md">
                             {service.name}
                          </span>
                       ))}
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/10">
                    <span className="text-gray-300 font-bold text-sm">Total Due</span>
                    <span className="text-lg font-bold text-indigo-400">₹{totalPrice?.toFixed(2)}</span>
                 </div>
              </div>
           </div>

           {/* Barber Profile Section */}
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><User size={16} /></div>
                 Barber Profile
              </h3>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden ring-1 ring-white/20 shadow-lg">
                    <img
                       src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                       alt={barberData.name}
                       className="w-full h-full object-cover"
                    />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">{barberData.name}</h4>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1">
                       <Star size={12} fill="currentColor" />
                       <span>{barberData.rating?.toFixed(1) || '4.9'} Rating</span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                       <MapPin size={10} /> {barberData.address}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium border border-white/5">
                    <Phone size={14} /> Call
                 </button>
                 <button className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600/20 transition-colors text-sm font-medium border border-indigo-500/20">
                    <MessageSquare size={14} /> Chat
                 </button>
              </div>
           </div>

        </div>

        {/* Footer - Mobile Optimized */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
           <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
              <Shield size={14} />
              <span>Secure Booking Process</span>
           </div>
           <p className="text-gray-600 text-xs">
              Transaction ID: <span className="font-mono text-gray-500">{bookingId || 'Generating...'}</span>
           </p>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmationWaiting;
