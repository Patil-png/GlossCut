import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock, CheckCircle2, AlertCircle, User, Calendar,
  MapPin, Star, ArrowRight, Shield, Copy,
  Scissors
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
  const [waitingTime, setWaitingTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [otp, setOtp] = useState(null); // Store OTP for display
  const bookingCreatedRef = useRef(false); // Use ref to prevent duplicate bookings

  const startPolling = useCallback((bookingId) => {
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
          setConfirmationStatus('timeout');
        }
      } catch (err) {
        console.error('Failed to check booking status:', err);
        // Continue polling even if one request fails
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, token, waitingTime]);

  const createBooking = useCallback(async () => {
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
        setConfirmationStatus('error');
      }
    } catch (err) {
      console.error('Booking creation failed:', err);
      setConfirmationStatus('error');
    }
  }, [barberData, selectedServices, totalPrice, selectedAppointmentType, customerInfo, isAuthenticated, token, startPolling]);

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
  }, [barberData, navigate, createBooking]); // Include dependencies

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

  // --- UI Helpers ---

  const getStatusColor = () => {
    switch (confirmationStatus) {
      case 'confirmed': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'declined': return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
      case 'timeout':
      case 'error': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      default: return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5';
    }
  };

  const getGradient = () => {
    switch (confirmationStatus) {
      case 'confirmed': return 'from-emerald-500/20 via-teal-500/5 to-transparent';
      case 'declined': return 'from-rose-500/20 via-red-500/5 to-transparent';
      default: return 'from-indigo-500/20 via-purple-500/5 to-transparent';
    }
  };

  if (!barberData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950"></div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Access</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
            This page requires booking information. Please start your booking process from the beginning.
          </p>
          <button
            onClick={() => navigate('/all-services-search')}
            className="group relative px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all hover:bg-indigo-700 flex items-center gap-2 mx-auto"
          >
            Start Booking Process
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-200 font-sans relative overflow-hidden selection:bg-indigo-500/30 flex items-center justify-center py-12 px-4 sm:px-6">
      
      {/* --- Ambient Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] bg-gradient-to-br ${getGradient()} transition-colors duration-1000`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="relative w-full max-w-5xl mx-auto z-10">
        
        {/* --- Header --- */}
        <div className="text-center mb-10 mt-16">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-6 shadow-xl shadow-black/20">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${confirmationStatus === 'waiting' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${confirmationStatus === 'waiting' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Live Connection</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
             {confirmationStatus === 'confirmed' ? 'Booking Secured' : 'Finalizing Details'}
           </h1>
           <p className="text-gray-400 text-sm md:text-base">Connecting directly with <span className="text-white font-medium">{barberData.name}</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* --- LEFT COLUMN: Status Hub --- */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className={`relative overflow-hidden rounded-[2.5rem] border backdrop-blur-2xl p-1 shadow-2xl transition-all duration-700 ${getStatusColor()}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-50"></div>
                  
                  <div className="bg-neutral-900/60 rounded-[2.3rem] p-8 md:p-12 text-center relative h-full min-h-[400px] flex flex-col items-center justify-center border border-white/[0.02]">
                    
                    {/* State: Waiting/Creating */}
                    {(confirmationStatus === 'creating' || confirmationStatus === 'waiting') && (
                        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                           <div className="relative mb-8">
                              {/* Glowing Radar Effect */}
                              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                              <div className="w-32 h-32 relative flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" className="text-indigo-500/30" />
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" className="text-indigo-500/50" />
                                </svg>
                                <div className="text-center z-10">
                                   <span className="block text-4xl font-bold font-mono text-white tracking-tighter">{timeLeft}</span>
                                   <span className="text-[9px] uppercase tracking-[0.3em] text-indigo-300/70">Seconds</span>
                                </div>
                              </div>
                           </div>
                           
                           <h2 className="text-2xl font-bold text-white mb-3">Requesting Slot</h2>
                           <p className="text-sm text-gray-400 leading-relaxed max-w-[250px] mx-auto mb-8">
                               Waiting for the barber to accept your appointment request.
                           </p>

                           {/* Timeout Progress */}
                           <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden">
                               <div 
                                   className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-linear"
                                   style={{ width: `${(timeLeft / 300) * 100}%` }}
                               ></div>
                           </div>
                        </div>
                    )}

                    {/* State: Confirmed */}
                    {confirmationStatus === 'confirmed' && (
                        <div className="flex flex-col items-center animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 size={48} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Confirmed!</h2>
                            <p className="text-emerald-400 font-medium mb-6 text-sm">Redirecting to payment gateway...</p>
                            
                            {otp && (
                                <div className="group relative">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                                  <div className="relative flex flex-col items-center bg-black/80 border border-white/10 rounded-xl px-8 py-4">
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Passcode</p>
                                      <div className="font-mono text-3xl font-bold text-white tracking-[0.2em]">{otp}</div>
                                  </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* State: Error/Declined */}
                    {(confirmationStatus === 'declined' || confirmationStatus === 'timeout' || confirmationStatus === 'error') && (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                             <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                <AlertCircle size={40} />
                             </div>
                             <h2 className="text-2xl font-bold text-white mb-2">
                                 {confirmationStatus === 'declined' ? 'Slot Unavailable' : 'Connection Timeout'}
                             </h2>
                             <p className="text-sm text-gray-400 mb-8 max-w-[240px] leading-relaxed">
                                 {confirmationStatus === 'declined' 
                                     ? 'The barber is unable to accept this specific time slot.' 
                                     : 'We didn\'t receive a response in time. Please call the shop directly.'}
                             </p>
                             <button
                                 onClick={() => navigate('/all-services-search')}
                                 className="group relative px-6 py-3 bg-white text-black rounded-xl font-bold text-sm transition-all hover:bg-gray-200 flex items-center gap-2"
                             >
                                 Find Another Barber 
                                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                             </button>
                        </div>
                    )}
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-xs text-gray-500 font-medium">End-to-end encrypted session ID: <span className="font-mono text-gray-400">{bookingId ? bookingId.slice(-6).toUpperCase() : 'INIT...'}</span></span>
                </div>
            </div>

            {/* --- RIGHT COLUMN: The Ticket --- */}
            <div className="lg:col-span-7">
                <div className="relative bg-[#0A0A0C] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl">
                    
                    {/* Ticket Texture Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>

                    {/* Ticket Header (Barber) */}
                    <div className="relative p-8 border-b border-dashed border-white/10">
                        {/* Cutout Circles Left/Right */}
                        <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-neutral-950 border border-white/10 z-10"></div>
                        <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-neutral-950 border border-white/10 z-10"></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
                                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-black">
                                    <img 
                                        src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'} 
                                        alt="Barber" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-black border border-white/10 rounded-full p-1.5 text-amber-400">
                                    <Star size={12} fill="currentColor" />
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">Provider</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{barberData.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <MapPin size={12} /> {barberData.address}
                                </p>
                            </div>

                            <div className="text-right hidden md:block">
                                <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.05]">
                                    <Scissors size={20} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Body (Details) */}
                    <div className="p-8 space-y-8 bg-[#0E0E11]/50">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-white/10 transition-colors">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-2"><Calendar size={12} /> Date</p>
                                <p className="text-white font-medium">{formatDate(new Date().toISOString().split('T')[0])}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-white/10 transition-colors">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-2"><Clock size={12} /> Time</p>
                                <p className="text-white font-medium">{new Date().toTimeString().slice(0, 5)}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{customerInfo?.name || 'Guest User'}</p>
                                    <p className="text-xs text-gray-500">{customerInfo?.phone || customerInfo?.email || 'No contact info'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Service Plan</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm py-2 border-b border-white/[0.05]">
                                    <span className="text-gray-400">Appointment Type</span>
                                    <span className="text-white font-medium bg-white/5 px-2 py-1 rounded text-xs">{selectedAppointmentType?.name}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {selectedServices && selectedServices.map((service, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/20">
                                            {service.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Footer (Total) */}
                    <div className="bg-black/80 p-8 border-t border-white/10 flex justify-between items-center relative">
                         {/* Barcode effect */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Amount</span>
                            <span className="text-3xl font-bold text-white tracking-tight">₹{totalPrice?.toFixed(2)}</span>
                        </div>

                        {bookingId && (
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 mb-1 justify-end cursor-pointer hover:text-indigo-400 transition-colors">
                                    Ref ID <Copy size={10} />
                                </div>
                                <div className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    {bookingId}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationWaiting;
