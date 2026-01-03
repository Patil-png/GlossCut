import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2, Calendar, Clock, MapPin, Star,
  CreditCard, ArrowRight, Home, Receipt,
  Scissors, ShieldCheck, Download, Share2, Copy
} from 'lucide-react';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    paymentData,
    bookingData,
    barberData,
    selectedServices,
    selectedAppointmentType,
    customerInfo,
    totalPrice
  } = location.state || {};

  const [otp, setOtp] = useState(null);
  const [loadingOtp, setLoadingOtp] = useState(true);
  const [fetchedBookingData, setFetchedBookingData] = useState(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (bookingData?._id) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/booking/${bookingData._id}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          setOtp(response.data.otp);
          setFetchedBookingData(response.data);
        } catch (error) {
          console.error('Failed to fetch booking data:', error);
        } finally {
          setLoadingOtp(false);
        }
      } else {
        setLoadingOtp(false);
      }
    };

    fetchBookingData();
  }, [bookingData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!paymentData || !bookingData || !barberData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/30">
            <CheckCircle2 className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Booking Data Not Found</h2>
          <p className="text-gray-400 mb-8">We couldn't retrieve the details for this booking.</p>
          <button
            onClick={() => navigate('/all-services-search')}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pt-24 pb-12 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md px-3 sm:px-4 z-10">

        {/* Header Actions */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
           <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Receipt size={18} className="text-indigo-400" />
              </div>
              <h1 className="text-md sm:text-xl font-bold text-white tracking-tight">Booking Receipt</h1>
           </div>
           <div className="flex gap-2 sm:gap-3">
              <button className="p-2 sm:p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-gray-400 hover:text-white transition-all border border-white/5 backdrop-blur-sm">
                 <Download size={16} className="sm:w-4 sm:h-4" />
              </button>
              <button className="p-2 sm:p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-gray-400 hover:text-white transition-all border border-white/5 backdrop-blur-sm">
                 <Share2 size={16} className="sm:w-4 sm:h-4" />
              </button>
           </div>
        </div>

        {/* The Digital Invoice Slip */}
        <div className="relative group">
           {/* Card Shadow/Glow */}
           <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/20 to-indigo-500/20 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
           
           <div className="relative bg-slate-900 rounded-[1.75rem] shadow-2xl overflow-hidden border border-white/10">
              
              {/* TOP SECTION: Status & Amount */}
              <div className="bg-slate-800/50 p-6 sm:p-8 text-center relative overflow-hidden">
                 {/* Decorative background elements */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_70%)]"></div>

                 <div className="relative z-10">
                    <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20 mb-3 sm:mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                       <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Payment Successful</h2>
                    <p className="text-emerald-400/80 text-sm font-medium mb-4 sm:mb-6">Your appointment is confirmed</p>

                    <div className="flex flex-col items-center">
                       <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Total Amount</p>
                       <div className="flex items-start text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tighter">
                          <span className="text-lg sm:text-xl lg:text-2xl mt-1 text-slate-500 font-medium mr-1">₹</span>
                          {totalPrice?.toFixed(2)}
                       </div>
                    </div>
                 </div>
              </div>

              {/* CUTOUT / SEPARATOR */}
              <div className="relative flex items-center justify-between px-4 bg-slate-900">
                 {/* Left Circle Cutout */}
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#020617] rounded-full -ml-3 box-content border-r border-white/10 shadow-inner"></div>
                 {/* Dashed Line */}
                 <div className="w-full border-b-2 border-dashed border-slate-700/50 my-4"></div>
                 {/* Right Circle Cutout */}
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#020617] rounded-full -mr-3 box-content border-l border-white/10 shadow-inner"></div>
              </div>

              {/* BOTTOM SECTION: Details */}
              <div className="p-4 sm:p-6 md:p-8 bg-slate-900 space-y-4 sm:space-y-6">

                 {/* OTP Box */}
                 {!loadingOtp && otp && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-3 sm:p-4 flex justify-between items-center group/otp hover:bg-indigo-500/10 transition-colors">
                       <div>
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Entry Code</p>
                          <p className="text-[10px] text-slate-400">Present to barber</p>
                       </div>
                       <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">{otp}</span>
                          <button className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors">
                             <Copy size={12} className="sm:w-3.5 sm:h-3.5" />
                          </button>
                       </div>
                    </div>
                 )}

                 {/* Barber Info */}
                 <div className="flex items-center gap-3 sm:gap-4 py-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 overflow-hidden ring-1 ring-white/10 shadow-lg">
                       <img
                          src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                          alt={barberData.name}
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs text-slate-400 mb-0.5">Barber</p>
                       <h3 className="text-sm sm:text-base font-bold text-white truncate">{barberData.name}</h3>
                       <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <MapPin size={8} className="sm:w-2.5 sm:h-2.5" /> {barberData.address}
                       </p>
                    </div>
                    <div className="text-amber-400 flex flex-col items-end">
                       <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/10">
                          <Star size={8} className="sm:w-2.5 sm:h-2.5" fill="currentColor" />
                          <span className="text-xs font-bold">{barberData.rating?.toFixed(1) || '4.9'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Key Details Grid */}
                 <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-white/5">
                    <div>
                       <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Date</p>
                       <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                          <Calendar size={10} className="sm:w-3 sm:h-3 text-indigo-400" />
                          <span className="truncate">{formatDate(bookingData.date)}</span>
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Time</p>
                       <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                          <Clock size={10} className="sm:w-3 sm:h-3 text-indigo-400" />
                          {bookingData.time}
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Service Tier</p>
                       <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                          <Scissors size={10} className="sm:w-3 sm:h-3 text-indigo-400" />
                          {selectedAppointmentType?.name}
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Method</p>
                       <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                          <CreditCard size={10} className="sm:w-3 sm:h-3 text-indigo-400" />
                          <span className="capitalize">{paymentData.method}</span>
                       </p>
                    </div>
                 </div>

                 {/* Order List */}
                 <div className="space-y-2 sm:space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services Breakdown</p>
                    {fetchedBookingData?.services && fetchedBookingData.services.length > 0 ? (
                       fetchedBookingData.services.map((service, index) => (
                          <div key={service.id || index} className="flex justify-between items-center text-xs sm:text-sm group">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors"></div>
                                <span className="text-slate-300 truncate">{service.name}</span>
                             </div>
                             <span className="text-slate-200 font-medium font-mono">₹{service.price}</span>
                          </div>
                       ))
                    ) : (
                       <div className="text-xs sm:text-sm text-gray-500 italic">Loading details...</div>
                    )}
                 </div>

                 {/* Footer Info */}
                 <div className="pt-4 sm:pt-6 border-t border-dashed border-slate-800 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                       <ShieldCheck size={10} className="sm:w-3 sm:h-3" /> Verified
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px]">ID: {paymentData.transactionId.slice(-8)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
           <button
             onClick={() => navigate('/')}
             className="flex-1 py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-white/5 transition-all flex items-center justify-center gap-2 group shadow-lg text-sm sm:text-base"
           >
             <Home size={16} className="sm:w-4.5 sm:h-4.5 text-slate-400 group-hover:text-white transition-colors" />
             Home
           </button>
           <button
             onClick={() => navigate('/all-services-search')}
             className="flex-1 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
           >
             Book New <ArrowRight size={16} className="sm:w-4.5 sm:h-4.5" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default BookingSuccess;
