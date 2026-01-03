import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format, differenceInSeconds } from 'date-fns';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, Mail,
  CreditCard, CheckCircle2, Star,
  Receipt, Timer, ShieldCheck, XCircle, AlertCircle
} from 'lucide-react';

const RATING_EMOJIS = [
  { id: 1, char: '😠', label: 'Terrible' },
  { id: 2, char: '😞', label: 'Bad' },
  { id: 3, char: '😐', label: 'Okay' },
  { id: 4, char: '🙂', label: 'Good' },
  { id: 5, char: '🤩', label: 'Amazing' },
];

const QUICK_TAGS = [
  'Professional 👔', 'Punctual ⏰', 'Clean Shop 🧹',
  'Great Cut ✂️', 'Friendly 🤝', 'Good Value 💰'
];

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [customerReview, setCustomerReview] = useState(null);

  const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`, {
        headers: { 'x-auth-token': token },
      });
      setBooking(response.data);

      // Fetch review if booking is completed
      if (response.data.status === 'completed') {
        try {
          const reviewRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/review/${bookingId}`, {
            headers: { 'x-auth-token': token }
          });
          if (reviewRes.data) {
            setCustomerReview(reviewRes.data);
            setHasReviewed(true);
            setRating(reviewRes.data.rating);
            setComment(reviewRes.data.comment);
            setTitle(reviewRes.data.title);
          }
        } catch (err) {
          console.error("Error fetching review details:", err);
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      alert('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    if (bookingId && token) {
      fetchBookingDetails();
    }
  }, [bookingId, token, fetchBookingDetails]);

  useEffect(() => {
    if (booking && booking.date && booking.time) {
      const appointmentDateTime = new Date(`${format(new Date(booking.date), 'yyyy-MM-dd')}T${booking.time}`);
      const interval = setInterval(() => {
        const now = new Date();
        const seconds = differenceInSeconds(appointmentDateTime, now);
        setTimeLeft(seconds > 0 ? seconds : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking]);

  const formatTimeLeft = (seconds) => {
    if (seconds === 0) return 'Started';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (hours === 0 && days === 0) parts.push(`${remainingSeconds}s`);
    return parts.join(' : ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2 };
      case 'confirmed': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: ShieldCheck };
      case 'pending': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Timer };
      case 'cancelled':
      default: return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle };
    }
  };

  const handlePayment = () => {
    navigate('/payment', {
      state: {
        providerName: booking.barberId.name,
        providerId: booking.barberId._id,
        selectedServices: booking.services,
        totalPrice: booking.totalPrice,
        bookingId: booking._id,
        fromHistory: true,
      }
    });
  };

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/booking/cancel-pending/${booking._id}`, {}, {
          headers: { 'x-auth-token': token }
        });
        alert('Booking cancelled successfully');
        navigate('/customer-history');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking');
      }
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    let finalTitle = title.trim();
    if (!finalTitle && selectedTags.length > 0) {
      finalTitle = `Great experience!`;
    } else if (!finalTitle) {
      alert('Please add a title for your review');
      return;
    }

    let finalComment = comment.trim();
    if (selectedTags.length > 0) {
      const tagsString = selectedTags.join(', ');
      finalComment = finalComment ? `${finalComment}\n\nHighlights: ${tagsString}` : `Highlights: ${tagsString}`;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/review`, {
        bookingId: booking._id,
        rating,
        comment: finalComment,
        title: finalTitle,
      }, {
        headers: { 'x-auth-token': token }
      });

      setCustomerReview({
        rating,
        comment: finalComment,
        title: finalTitle,
      });
      setHasReviewed(true);

      alert('Review submitted successfully');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-indigo-400 font-medium animate-pulse text-sm sm:text-base">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 sm:p-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/customer-history')}
            className="w-full py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/5 text-sm sm:text-base"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const isStarted = timeLeft === 0 && !booking.status.match(/completed|cancelled/i);
  const statusColors = getStatusColor(booking.status);
  const StatusIcon = statusColors.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pt-20 sm:pt-24 pb-8 sm:pb-12 relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-[80px] sm:blur-[128px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/customer-history')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-900/50 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5 group text-sm"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-800/50 rounded-full border border-white/5">
             <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-pulse"></span>
             <span className="text-[10px] sm:text-xs font-mono text-slate-400">ID: {bookingId.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Hero Card: Countdown & Status */}
            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <div className={`relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/10 shadow-2xl ${
                isStarted 
                  ? 'bg-gradient-to-br from-red-500/10 to-slate-900' 
                  : 'bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900'
              }`}>
                {/* Background glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-20 ${isStarted ? 'bg-red-500' : 'bg-indigo-500'}`} />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                   <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 ${isStarted ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {isStarted ? <Timer size={24} className="sm:w-8 sm:h-8 animate-pulse" /> : <Clock size={24} className="sm:w-8 sm:h-8" />}
                   </div>
                   
                   <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">
                     {isStarted ? 'Session In Progress' : 'Time Remaining'}
                   </p>
                   
                   {!isStarted && (
                     <div className="text-3xl sm:text-5xl lg:text-7xl font-black text-white font-mono tracking-tight mb-3 sm:mb-4 tabular-nums drop-shadow-2xl">
                       {formatTimeLeft(timeLeft)}
                     </div>
                   )}
                   
                   <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${statusColors.border} ${statusColors.bg} ${statusColors.text} text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2`}>
                      <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                      {booking.status}
                   </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
               {/* Barber Card */}
               <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                     <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                        <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Professional</p>
                        <p className="text-sm sm:text-lg font-bold text-white truncate">{booking.barberId?.name || 'Unknown'}</p>
                     </div>
                  </div>
               </div>

               {/* Date Card */}
               <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                     <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <Calendar size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Appointment</p>
                        <p className="text-sm sm:text-lg font-bold text-white">
                           {booking.date ? format(new Date(booking.date), 'MMM dd') : 'N/A'} <span className="text-slate-500">•</span> {booking.time}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Contacts Section */}
            {(booking.barberId?.phone || booking.barberId?.email || booking.barberId?.shopName) && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                   <Phone size={16} className="sm:w-5 sm:h-5 text-indigo-400" /> Contacts & Location
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   {booking.barberId.phone && (
                      <a href={`tel:${booking.barberId.phone}`} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl sm:rounded-2xl transition-all group">
                         <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform"><Phone size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                         <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-slate-400">Call Mobile</p>
                            <p className="font-medium text-white text-sm sm:text-base truncate">{booking.barberId.phone}</p>
                         </div>
                      </a>
                   )}
                   {booking.barberId.email && (
                      <a href={`mailto:${booking.barberId.email}`} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl sm:rounded-2xl transition-all group">
                         <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform"><Mail size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                         <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-slate-400">Send Email</p>
                            <p className="font-medium text-white text-sm sm:text-base truncate">{booking.barberId.email}</p>
                         </div>
                      </a>
                   )}
                   {booking.barberId.shopAddress && (
                      <a 
                         href={`https://maps.google.com/?q=${encodeURIComponent(booking.barberId.shopAddress)}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="sm:col-span-2 flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl sm:rounded-2xl transition-all group"
                      >
                         <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform"><MapPin size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-slate-400">Shop Location</p>
                            <p className="font-medium text-white text-sm sm:text-base">{booking.barberId.shopName || 'View Map'}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{booking.barberId.shopAddress}</p>
                         </div>
                      </a>
                   )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {booking.status === 'completed' && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
                 <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <Star size={18} className="sm:w-5 sm:h-5 text-amber-400" fill="currentColor" /> 
                    {hasReviewed ? 'Your Feedback' : 'Rate Experience'}
                 </h3>

                 {hasReviewed ? (
                    <div className="bg-slate-950/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5">
                       <div className="text-center mb-3 sm:mb-4">
                          <span className="text-4xl sm:text-5xl drop-shadow-lg filter grayscale-0">{RATING_EMOJIS[customerReview?.rating - 1]?.char}</span>
                       </div>
                       <h4 className="text-base sm:text-lg font-bold text-center text-white mb-2">{customerReview?.title}</h4>
                       <p className="text-slate-400 text-center leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{customerReview?.comment}</p>
                       
                       {customerReview?.barberResponse && (
                          <div className="p-3 sm:p-4 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-r-xl">
                             <p className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Response</p>
                             <p className="text-xs sm:text-sm text-indigo-200">{customerReview.barberResponse}</p>
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="space-y-4 sm:space-y-6">
                       <div className="flex justify-between items-center px-1 sm:px-2">
                          {RATING_EMOJIS.map((emoji) => (
                             <button
                                key={emoji.id}
                                onClick={() => setRating(emoji.id)}
                                className={`text-2xl sm:text-4xl transition-all duration-300 hover:scale-125 transform ${
                                   rating > 0 && rating !== emoji.id ? 'opacity-30 grayscale scale-90' : 'opacity-100 grayscale-0'
                                }`}
                             >
                                {emoji.char}
                             </button>
                          ))}
                       </div>
                       
                       {rating > 0 && (
                          <div className="text-center">
                             <span className="text-indigo-400 font-bold text-base sm:text-lg animate-fade-in-up">{RATING_EMOJIS[rating - 1].label}!</span>
                          </div>
                       )}

                       <div className="space-y-2 sm:space-y-3">
                          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Highlights</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                             {QUICK_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                   <button
                                      key={tag}
                                      onClick={() => toggleTag(tag)}
                                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${
                                         isSelected
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                      }`}
                                   >
                                      {tag}
                                   </button>
                                );
                             })}
                          </div>
                       </div>

                       <div className="space-y-3 sm:space-y-4">
                          <input
                             type="text"
                             placeholder="Title (e.g. Awesome Cut!)"
                             value={title}
                             onChange={(e) => setTitle(e.target.value)}
                             className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600 text-sm sm:text-base"
                          />
                          <textarea
                             placeholder="Tell us more about your visit..."
                             value={comment}
                             onChange={(e) => setComment(e.target.value)}
                             rows={3}
                             className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600 resize-none text-sm sm:text-base"
                          />
                       </div>

                       <button
                          onClick={handleReviewSubmit}
                          disabled={rating === 0}
                          className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 text-sm sm:text-base"
                       >
                          Submit Review
                       </button>
                    </div>
                 )}
              </div>
            )}
          </div>

          {/* Sidebar Column: Payment & Actions */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
             
             {/* Payment Receipt */}
             <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden relative">
                {/* Decorative cutouts */}
                <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                
                <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                   <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                      <Receipt size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-400" /> Summary
                   </h3>
                   <div className="space-y-2 sm:space-y-3">
                      {booking.services.map((service, index) => (
                         <div key={index} className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-400 truncate pr-2">{service.name}</span>
                            <span className="text-white font-mono shrink-0">₹{service.price?.toFixed(2) || '0.00'}</span>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Dashed Separator */}
                <div className="relative h-3 sm:h-4 w-full">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-slate-950 rounded-full -ml-1.5 sm:-ml-2"></div>
                   <div className="border-b-2 border-dashed border-slate-800 w-full absolute top-1/2"></div>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-slate-950 rounded-full -mr-1.5 sm:-mr-2"></div>
                </div>

                <div className="p-4 sm:p-6 pt-2 bg-slate-900/50">
                   <div className="flex justify-between items-end mb-4 sm:mb-6">
                      <span className="text-slate-400 font-bold text-xs sm:text-sm">Total Paid</span>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400">₹{booking.totalPrice?.toFixed(2)}</span>
                   </div>
                   
                   {booking.paymentStatus === 'pending' && booking.status === 'confirmed' && (
                      <button
                        onClick={handlePayment}
                        className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base"
                      >
                        <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" /> Pay Now
                      </button>
                   )}

                   {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                      <button
                        onClick={handleCancelBooking}
                        className="w-full py-2.5 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        Cancel Booking
                      </button>
                   )}
                </div>
             </div>

             {/* OTP Card */}
             {booking.otp && booking.status === 'confirmed' && (
                <div className="bg-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                   <div className="relative z-10">
                      <p className="text-indigo-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Entry Pass Code</p>
                      <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl py-2 sm:py-3 px-3 sm:px-4 inline-block border border-white/20">
                         <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-[0.15em] sm:tracking-[0.2em]">{booking.otp}</span>
                      </div>
                      <p className="text-indigo-100 text-[9px] sm:text-[10px] mt-2 opacity-80">Show this to your barber</p>
                   </div>
                </div>
             )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
