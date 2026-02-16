import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
   CheckCircle2, Calendar, Clock, MapPin, Star,
   ArrowRight, Home, Receipt, CreditCard, Scissors,
   ShieldCheck, Download, Share2, Copy, Check
} from 'lucide-react';

const BookingSuccess = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { bookingId: urlBookingId } = useParams();
   const {
      otp: otpFromProps,
      paymentData: statePaymentData,
      bookingData: stateBookingData,
      barberData: stateBarberData,
      selectedAppointmentType: stateSelectedAppointmentType,
      totalPrice: stateTotalPrice
   } = location.state || {};

   const [otp, setOtp] = useState(otpFromProps || null);
   const [loadingOtp, setLoadingOtp] = useState(true); // Default to loading
   const [fetchedBookingData, setFetchedBookingData] = useState(null);
   const [paymentData, setPaymentData] = useState(statePaymentData || null);
   const [bookingData, setBookingData] = useState(stateBookingData || null);
   const [barberData, setBarberData] = useState(stateBarberData || null);
   const [selectedAppointmentType, setSelectedAppointmentType] = useState(stateSelectedAppointmentType || null);
   const [totalPrice, setTotalPrice] = useState(stateTotalPrice || null);
   const [copied, setCopied] = useState(false);

   // --- Receipt Action Handlers ---
   const handleCopy = useCallback(() => {
      if (otp) {
         navigator.clipboard.writeText(otp);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      }
   }, [otp]);

   const handleShare = async () => {
      const shareUrl = bookingData?._id
         ? `${window.location.origin}/booking-success/${bookingData._id}`
         : window.location.href;

      const shareData = {
         title: 'GlossCut Booking Receipt',
         text: `Successfully booked with ${barberData?.name || 'my barber'}! Entry Code: ${otp || 'N/A'}`,
         url: shareUrl
      };

      try {
         if (navigator.share) {
            await navigator.share(shareData);
         } else {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
         }
      } catch (err) {
         console.error('Share failed:', err);
      }
   };

   const handleDownload = () => {
      window.print();
   };

   useEffect(() => {
      const bId = urlBookingId || bookingData?._id;

      const fetchBookingData = async () => {
         if (bId) {
            try {
               const response = await axios.get(
                  `${process.env.REACT_APP_API_URL}/api/booking/public/${bId}`,
                  {
                     headers: {
                        'Content-Type': 'application/json',
                     },
                  }
               );
               const data = response.data;
               setOtp(data.otp);
               setFetchedBookingData(data);
               setBookingData(data);
               setBarberData(data.barberId);
               setPaymentData({
                  paymentStatus: data.paymentStatus,
                  paymentMethod: data.paymentMethod,
                  transactionId: data.transactionId
               });
               setTotalPrice(data.totalPrice);
               setSelectedAppointmentType(data.appointmentType);
            } catch (error) {
               console.error('Failed to fetch booking data:', error);
            } finally {
               setLoadingOtp(false);
            }
         } else {
            setLoadingOtp(false);
         }
      };

      // If we have state but no OTP, or if we have bookingId in URL, fetch.
      if (!otp && bId) {
         fetchBookingData();
      } else {
         setLoadingOtp(false);
      }
   }, [urlBookingId, bookingData?._id, otp]);

   const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         weekday: 'long',
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   };

   if (loadingOtp) {
      return (
         <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#4C763B] border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   if (!paymentData || !bookingData || !barberData) {
      return (
         <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background blobs to match theme */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
               <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
               <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
               <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-15 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
            </div>

            <div className="relative z-10 text-center max-w-md w-full bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-10 shadow-2xl">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-white shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#4C763B]/10 to-transparent"></div>
                  <CheckCircle2 className="w-10 h-10 text-[#4C763B] relative z-10" />
               </div>
               <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Booking Info Missing</h2>
               <p className="text-gray-500 font-medium mb-10 leading-relaxed text-lg">We couldn't retrieve the details for this booking. The link may have expired or is incorrect.</p>
               <button
                  onClick={() => navigate('/all-services-search')}
                  className="w-full py-5 bg-[#4C763B] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-900/20 hover:bg-[#3d5f2f] transition-all flex items-center justify-center gap-3 active:scale-95"
               >
                  Find a Barber <ArrowRight size={22} />
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden flex flex-col items-center justify-center pt-28 pb-12 lg:pt-36 lg:pb-16">

         {/* ==================================================================================
             BACKGROUND LAYERS (SPLIT SYSTEM - SYNCED WITH HOME.JSX)
         ================================================================================== */}

         {/* MOBILE BACKGROUND */}
         <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
            <div
               className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply"
               style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }}
            />
            <div
               className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply"
               style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }}
            />
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         </div>

         {/* DESKTOP BACKGROUND */}
         <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50 pointer-events-none">
            <div className="absolute inset-0 bg-gray-100/60" />
            <div
               className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float"
               style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }}
            />
            <div
               className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed"
               style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }}
            />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         </div>

         <div className="relative w-full max-w-md lg:max-w-6xl px-4 z-10 transition-all duration-500">

            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">

               {/* LEFT COLUMN: THE DIGITAL RECEIPT (Synced with Mobile UI) */}
               <div className="w-full lg:w-[420px] shrink-0 mx-auto">
                  {/* Header Actions (Header for Receipt) */}
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-50 rounded-xl border border-green-100 shadow-sm">
                           <Receipt size={20} className="text-[#4C763B]" />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Booking Receipt</h1>
                     </div>
                     <div className="flex gap-2.5 no-print">
                        <button
                           onClick={handleDownload}
                           className="p-2.5 bg-white hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all border border-gray-100 shadow-sm active:scale-95"
                           title="Download PDF"
                        >
                           <Download size={18} />
                        </button>
                        <button
                           onClick={handleShare}
                           className="p-2.5 bg-white hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all border border-gray-100 shadow-sm active:scale-95"
                           title="Share Booking"
                        >
                           <Share2 size={18} />
                        </button>
                     </div>
                  </div>

                  {/* The Digital Invoice Slip */}
                  <div id="printable-receipt" className="relative group animate-fade-in-up">
                     {/* Card Glow */}
                     <div className="absolute -inset-1 bg-gradient-to-r from-[#4C763B]/20 to-green-600/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                     <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/60">
                        {/* TOP SECTION: Status & Amount */}
                        <div className="bg-gray-50/50 p-8 text-center relative">
                           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#4C763B] to-green-600"></div>
                           <div className="relative z-10">
                              <div className="inline-flex items-center justify-center p-3 bg-green-100/50 rounded-full ring-1 ring-green-200 mb-4 shadow-inner">
                                 <CheckCircle2 className="w-8 h-8 text-[#4C763B]" />
                              </div>
                              <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Payment Successful</h2>
                              <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-6">Confirmed Appointment</p>

                              <div className="flex flex-col items-center">
                                 <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Total Paid Amount</p>
                                 <div className="flex items-start text-5xl font-black text-gray-900 tracking-tighter">
                                    <span className="text-xl mt-1.5 text-gray-400 font-bold mr-1">₹</span>
                                    {totalPrice?.toFixed(0)}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* CUTOUT / SEPARATOR */}
                        <div className="relative flex items-center justify-between px-4 bg-white/50">
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full -ml-3 box-content border-r border-gray-200/50"></div>
                           <div className="w-full border-b-2 border-dashed border-gray-100 my-4"></div>
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full -mr-3 box-content border-l border-gray-200/50"></div>
                        </div>

                        {/* BOTTOM SECTION: Details */}
                        <div className="p-6 md:p-8 space-y-6">
                           {/* OTP Box */}
                           {!loadingOtp && otp && (
                              <div className="bg-[#4C763B]/5 border-2 border-dashed border-[#4C763B]/20 rounded-2xl p-4 flex justify-between items-center group/otp hover:border-[#4C763B]/40 transition-all duration-300">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#4C763B] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                       <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-[#4C763B] uppercase tracking-widest leading-none mb-1">Entry Code</p>
                                       <p className="text-[10px] text-gray-400 font-medium tracking-tight">Present at the counter</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-gray-900 tracking-[0.15em]">{otp}</span>
                                    <button
                                       onClick={handleCopy}
                                       className={`p-2 rounded-xl transition-all active:scale-95 ${copied ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-[#4C763B]/10 text-[#4C763B]'}`}
                                       title="Copy Code"
                                    >
                                       {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Barber Info (Compact for Receipt) */}
                           <div className="flex items-center gap-4 py-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                              <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden ring-1 ring-gray-100 shadow-md">
                                 <img
                                    src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                                    alt={barberData.name}
                                    className="w-full h-full object-cover"
                                 />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Your Barber</p>
                                 <h3 className="text-base font-black text-gray-900 truncate tracking-tight">{barberData.name}</h3>
                                 <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 font-medium">
                                    <MapPin size={10} className="text-[#4C763B]" /> {barberData.address}
                                 </p>
                              </div>
                              <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                 <Star size={10} className="text-orange-400" fill="currentColor" />
                                 <span className="text-xs font-black text-gray-900">{(barberData.rating || 4.5).toFixed(1)}</span>
                              </div>
                           </div>

                           {/* Details Grid */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Date</p>
                                 <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar size={12} className="text-[#4C763B]" />
                                    <span className="truncate">{formatDate(bookingData.date)}</span>
                                 </p>
                              </div>
                              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Time</p>
                                 <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                    <Clock size={12} className="text-[#4C763B]" />
                                    {bookingData.time}
                                 </p>
                              </div>
                              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Service Tier</p>
                                 <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                    <Scissors size={12} className="text-[#4C763B]" />
                                    {selectedAppointmentType?.name || "Basic"}
                                 </p>
                              </div>
                              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Method</p>
                                 <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                    <CreditCard size={12} className="text-[#4C763B]" />
                                    <span className="capitalize">{paymentData.method}</span>
                                 </p>
                              </div>
                           </div>

                           {/* Order List */}
                           <div className="space-y-2.5 pt-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Services Breakdown</p>
                              <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-3">
                                 {(fetchedBookingData?.services || bookingData?.services) && (fetchedBookingData?.services || bookingData?.services).length > 0 ? (
                                    (fetchedBookingData?.services || bookingData?.services).map((service, index) => (
                                       <div key={service.id || index} className="flex justify-between items-center text-xs font-bold">
                                          <div className="flex items-center gap-2.5">
                                             <div className="w-1.5 h-1.5 rounded-full bg-[#4C763B]"></div>
                                             <span className="text-gray-600 tracking-tight">{service.name}</span>
                                          </div>
                                          <span className="text-gray-900 font-extrabold">₹{service.price}</span>
                                       </div>
                                    ))
                                 ) : (
                                    <div className="text-xs text-gray-400 italic font-medium">No services found</div>
                                 )}
                              </div>
                           </div>

                           {/* Footer Info */}
                           <div className="pt-6 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-gray-400 uppercase font-black tracking-widest">
                              <span className="flex items-center gap-1.5 text-green-600">
                                 <ShieldCheck size={12} /> SECURE TRANSACTION
                              </span>
                              <span className="font-mono">ID: {paymentData.transactionId.slice(-8)}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* MOBILE BUTTONS (Hidden on Desktop) */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 lg:hidden">
                     <button
                        onClick={() => navigate('/')}
                        className="flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                     >
                        <Home size={18} />
                        Back to Home
                     </button>
                     <button
                        onClick={() => navigate('/all-services-search')}
                        className="flex-1 py-4 bg-[#4C763B] hover:bg-[#3d5f2f] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                     >
                        Book New <ArrowRight size={18} />
                     </button>
                  </div>
               </div>

               {/* RIGHT COLUMN: DESKTOP SUMMARY & ACTIONS (Hidden on Mobile) */}
               <div className="hidden lg:flex flex-col flex-1 py-4 space-y-12">

                  {/* Desktop Header */}
                  <div className="space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-[#4C763B] rounded-full text-xs font-black uppercase tracking-widest border border-green-100 shadow-sm animate-bounce-subtle">
                        <ShieldCheck size={14} /> Confirmed & Secure
                     </div>
                     <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                        Your Style is <br />
                        <span className="text-[#4C763B]">Locked In.</span>
                     </h2>
                     <p className="text-xl text-gray-500 font-medium max-w-xl leading-relaxed">
                        We've received your booking. You're all set to get the look you want. Present the entry code on your receipt when you arrive.
                     </p>
                  </div>

                  {/* Desktop Barber Card (Spacious) */}
                  <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl flex items-center gap-8 group hover:shadow-2xl transition-all duration-500">
                     <div className="relative">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                           <img
                              src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
                              alt={barberData.name}
                              className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-lg">
                           <Star size={14} fill="white" />
                           {(barberData.rating || 4.5).toFixed(1)}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-[#4C763B] uppercase tracking-widest">Selected Professional</p>
                           <h3 className="text-4xl font-black text-gray-900 tracking-tight">{barberData.name}</h3>
                        </div>
                        <div className="flex items-center gap-6 text-gray-500 font-semibold">
                           <div className="flex items-center gap-2">
                              <MapPin size={18} className="text-[#4C763B]" />
                              {barberData.address}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Next Steps Grid */}
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2">
                        <div className="p-2 w-fit bg-white rounded-xl text-[#4C763B] shadow-sm border border-gray-100">
                           <Clock size={20} />
                        </div>
                        <h4 className="text-lg font-black text-gray-900">Arrive on Time</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                           Try to reach 5-10 minutes early to ensure a smooth transition for your session.
                        </p>
                     </div>
                     <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2">
                        <div className="p-2 w-fit bg-white rounded-xl text-[#4C763B] shadow-sm border border-gray-100">
                           <ShieldCheck size={20} />
                        </div>
                        <h4 className="text-lg font-black text-gray-900">Show Your OTP</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                           Make sure to keep your digital receipt handy to verify your entry at the counter.
                        </p>
                     </div>
                  </div>

                  {/* DESKTOP BUTTONS */}
                  <div className="flex items-center gap-6 pt-6 no-print">
                     <button
                        onClick={() => navigate('/')}
                        className="px-10 py-5 bg-white hover:bg-gray-50 text-gray-900 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 border border-gray-200 shadow-lg hover:shadow-xl active:scale-95"
                     >
                        <Home size={22} />
                        Return Home
                     </button>
                     <button
                        onClick={() => navigate('/all-services-search')}
                        className="flex-1 py-5 bg-[#4C763B] hover:bg-[#3d5f2f] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-900/20 transition-all flex items-center justify-center gap-4 active:scale-95"
                     >
                        Book Another Service <ArrowRight size={22} />
                     </button>
                  </div>
               </div>

            </div>

            {/* PRINT STYLES */}
            <style dangerouslySetInnerHTML={{
               __html: `
                @media print {
                   @page { margin: 0.5cm; size: auto; }
                   html, body { 
                      background: white !important; 
                      margin: 0 !important;
                      padding: 0 !important;
                   }
                   /* Hide everything on the page including navbar/footer from App.jsx */
                   body > div > *:not(main),
                   header, footer, nav,
                   .no-print,
                   [class*='absolute inset-0'],
                   #root > *:not(.min-h-screen),
                   main > *:not(.min-h-screen) {
                      display: none !important;
                   }
                   
                   /* Only show the printable receipt */
                   #printable-receipt {
                      visibility: visible !important;
                      display: block !important;
                      position: static !important;
                      width: 100% !important;
                      max-width: none !important;
                      margin: 0 !important;
                      padding: 1cm !important;
                      box-shadow: none !important;
                      background: white !important;
                   }

                   /* Hide card glow in print */
                   #printable-receipt > div:first-child[class*='blur-xl'] {
                      display: none !important;
                   }
                   
                   /* Re-enable visibility for children of the receipt */
                   #printable-receipt * {
                      visibility: visible !important;
                   }

                   /* Fix any overflow issues that might cause extra pages */
                   .min-h-screen { 
                      min-height: auto !important; 
                      height: auto !important;
                      overflow: visible !important;
                      display: block !important;
                      padding: 0 !important;
                   }
                }
             ` }} />
         </div>
      </div>
   );
};

export default BookingSuccess;
