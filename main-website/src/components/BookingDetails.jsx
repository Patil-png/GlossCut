import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format, differenceInSeconds } from 'date-fns';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, Mail,
  CreditCard, CheckCircle2, Star,
  Receipt, Timer, ShieldCheck, XCircle, AlertCircle,
  Activity, Copy
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
      case 'completed': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2 };
      case 'confirmed': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: ShieldCheck };
      case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Timer };
      case 'cancelled':
      default: return { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', icon: XCircle };
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#4C763B]/30 border-t-[#4C763B] rounded-full animate-spin"></div>
          <p className="text-[#4C763B] font-medium animate-pulse text-sm sm:text-base">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white/80 backdrop-blur-md border border-red-100 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/customer-history')}
            className="w-full py-2.5 sm:py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all text-sm sm:text-base font-bold"
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
    <div className="min-h-screen bg-white text-gray-900 font-sans pt-20 sm:pt-24 pb-8 sm:pb-12 relative overflow-hidden selection:bg-[#4C763B]/30 selection:text-[#4C763B]">

      {/* Background System */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
          <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-15 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        {/* Desktop Background */}
        <div className="hidden lg:block absolute inset-0 bg-gray-50">
          <div className="absolute inset-0 bg-gray-100/40" />
          <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-20 mix-blend-multiply animate-float" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[-10%] left-[-20%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-15 mix-blend-multiply animate-float-delayed" style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/customer-history')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/60 hover:bg-[#4C763B]/10 rounded-xl text-gray-500 hover:text-[#4C763B] transition-all border border-gray-100 group text-sm font-bold shadow-sm"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">

            {/* Hero Card: Countdown & Status */}
            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <div className={`relative overflow-hidden rounded-[2.5rem] p-5 sm:p-8 border border-white shadow-xl ${isStarted
                ? 'bg-gradient-to-br from-red-50 to-white'
                : 'bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-md'
                }`}>
                {/* Background glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-10 ${isStarted ? 'bg-red-500' : 'bg-[#4C763B]'}`} />

                <div className="relative z-10 flex flex-col items-center text-center font-sans">
                  <div className={`p-4 rounded-2xl mb-4 sm:mb-5 shadow-xl ${isStarted ? 'bg-red-500 text-white animate-pulse' : 'bg-[#4C763B] text-white shadow-[#4C763B]/20'}`}>
                    {isStarted ? <Timer size={24} className="sm:w-8 sm:h-8" /> : <Clock size={24} className="sm:w-8 sm:h-8" />}
                  </div>

                  <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block">
                    {isStarted ? 'Session In Progress' : 'Estimate Arrival'}
                  </p>

                  {!isStarted && (
                    <div className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter mb-4 sm:mb-6 leading-none">
                      {formatTimeLeft(timeLeft)}
                    </div>
                  )}

                  <div className={`px-4 py-1.5 rounded-full border ${statusColors.border} ${statusColors.bg} ${statusColors.text} text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-sm`}>
                    <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                    {booking.status}
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barber Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2rem] p-5 sm:p-7 shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl opacity-50 group-hover:bg-green-50 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#4C763B]/10 flex items-center justify-center text-[#4C763B] shrink-0 shadow-sm border border-white">
                    <CheckCircle2 size={24} className="sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Professional</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 truncate leading-tight tracking-tight">{booking.barberId?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Date Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2rem] p-5 sm:p-7 shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-50 transition-colors" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-sm border border-white">
                    <Calendar size={24} className="sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Appointment</p>
                    <p className="text-base sm:text-xl font-black text-gray-900 leading-tight tracking-tight">
                      {booking.date ? format(new Date(booking.date), 'MMM dd') : 'N/A'} <span className="text-gray-300 mx-1">/</span> {booking.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            {(booking.barberId?.phone || booking.barberId?.email || booking.barberId?.shopName) && (
              <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#4C763B] to-green-400 opacity-50" />
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2 bg-green-50 rounded-xl text-[#4C763B]"><Phone size={20} /></div>
                  Location & Contact
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {booking.barberId.phone && (
                    <a href={`tel:${booking.barberId.phone}`} className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group shadow-sm">
                      <div className="p-3 bg-white rounded-xl text-[#4C763B] shadow-sm group-hover:scale-110 transition-transform"><Phone size={18} /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Call Shop</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-md truncate">{booking.barberId.phone}</p>
                      </div>
                    </a>
                  )}
                  {booking.barberId.email && (
                    <a href={`mailto:${booking.barberId.email}`} className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group shadow-sm">
                      <div className="p-3 bg-white rounded-xl text-purple-500 shadow-sm group-hover:scale-110 transition-transform"><Mail size={18} /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Official Mail</p>
                        <p className="font-bold text-gray-900 text-sm sm:text-md truncate">{booking.barberId.email}</p>
                      </div>
                    </a>
                  )}
                  {booking.barberId.shopAddress && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(booking.barberId.shopAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm:col-span-2 flex items-center gap-4 p-5 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[2rem] transition-all group shadow-sm"
                    >
                      <div className="p-4 bg-white rounded-2xl text-red-500 shadow-sm group-hover:scale-110 transition-transform"><MapPin size={24} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">Open in Maps</p>
                        <p className="font-black text-gray-900 text-base sm:text-lg tracking-tight">{booking.barberId.shopName || 'Shop Address'}</p>
                        <p className="text-xs text-gray-400 font-semibold mt-1 truncate">{booking.barberId.shopAddress}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {booking.status === 'completed' && (
              <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl">
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500 shadow-sm"><Star size={24} fill="currentColor" /></div>
                  {hasReviewed ? 'Your Experience' : 'Leave a Review'}
                </h3>

                {hasReviewed ? (
                  <div className="bg-gray-50/50 rounded-[2rem] p-6 sm:p-8 border border-white shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl opacity-50" />
                    <div className="text-center mb-6 relative z-10">
                      <span className="text-6xl sm:text-7xl drop-shadow-2xl inline-block transform group-hover:scale-110 transition-transform duration-500">{RATING_EMOJIS[customerReview?.rating - 1]?.char}</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-center text-gray-900 mb-3 tracking-tight">{customerReview?.title}</h4>
                    <p className="text-gray-500 text-center leading-relaxed mb-8 text-sm sm:text-base font-semibold italic">"{customerReview?.comment}"</p>

                    {customerReview?.barberResponse && (
                      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-[#4C763B] uppercase tracking-[0.15em] mb-2">Barber Response</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{customerReview.barberResponse}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center px-4 max-w-sm mx-auto">
                      {RATING_EMOJIS.map((emoji) => (
                        <button
                          key={emoji.id}
                          onClick={() => setRating(emoji.id)}
                          className={`text-4xl sm:text-5xl transition-all duration-500 hover:scale-125 transform ${rating > 0 && rating !== emoji.id ? 'opacity-20 grayscale' : 'opacity-100 grayscale-0'
                            }`}
                        >
                          {emoji.char}
                        </button>
                      ))}
                    </div>

                    {rating > 0 && (
                      <div className="text-center animate-bounce">
                        <span className="text-[#4C763B] font-black text-lg tracking-tight px-6 py-2 bg-green-50 rounded-full border border-green-100">{RATING_EMOJIS[rating - 1].label}!</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">How was everything?</p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all border ${isSelected
                                ? 'bg-[#4C763B] border-[#4C763B] text-white shadow-xl shadow-green-900/20'
                                : 'bg-white border-gray-100 text-gray-400 hover:border-[#4C763B]/30 hover:text-[#4C763B]'
                                }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Review Title (e.g. Sharp Cut!)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-[#4C763B] transition-all placeholder-gray-300 text-sm sm:text-base shadow-sm"
                      />
                      <textarea
                        placeholder="Anything else you want to share about your visit?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 text-gray-900 font-bold focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-[#4C763B] transition-all placeholder-gray-300 resize-none text-sm sm:text-base shadow-sm"
                      />
                    </div>

                    <button
                      onClick={handleReviewSubmit}
                      disabled={rating === 0}
                      className="w-full py-5 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black shadow-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed transform active:scale-95 text-base tracking-tight uppercase"
                    >
                      Post Experience
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Column: Payment & Actions */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">

            {/* Payment Receipt */}
            <div className="bg-white border border-white rounded-[2.5rem] shadow-2xl overflow-hidden relative group/receipt">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4C763B] to-green-500" />

              <div className="p-6 sm:p-8 pb-4">
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2 bg-green-50 rounded-xl text-[#4C763B]"><Receipt size={18} /></div>
                  Order Summary
                </h3>
                <div className="space-y-4">
                  {booking.services.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm sm:text-base group/item">
                      <span className="text-gray-400 font-semibold truncate pr-4 group-hover/item:text-gray-600 transition-colors uppercase tracking-tight text-[11px] sm:text-xs mt-0.5">{service.name}</span>
                      <span className="text-gray-900 font-bold shrink-0 font-mono">₹{service.price?.toFixed(0) || '0'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="relative h-6 w-full overflow-hidden">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 border border-gray-100 rounded-full -ml-4" />
                <div className="border-b-4 border-dashed border-gray-50 w-full absolute top-1/2" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 border border-gray-100 rounded-full -mr-4" />
              </div>

              <div className="p-6 sm:p-8 pt-4">
                <div className="flex justify-between items-center mb-8">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Final Balance</p>
                    <p className="text-xs text-[#4C763B] font-bold">Pay at shop</p>
                  </div>
                  <div className="flex items-start text-3xl font-black text-gray-900 tracking-tighter">
                    <span className="text-sm mt-1 text-gray-400 mr-1 font-bold">₹</span>
                    {booking.totalPrice?.toFixed(0)}
                  </div>
                </div>

                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                  <button
                    onClick={() => navigate(`/track-queue/${booking.queueTrackingId || booking._id}`)}
                    className="w-full py-4.5 mb-3 bg-[#111] hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-3 text-sm sm:text-base group active:scale-95"
                  >
                    <Activity size={18} className="text-green-500 group-hover:scale-110 transition-transform" />
                    Track Live Queue
                  </button>
                )}

                {booking.paymentStatus === 'pending' && booking.status === 'confirmed' && (
                  <button
                    onClick={handlePayment}
                    className="w-full py-4.5 bg-[#4C763B] hover:bg-[#3D5F2F] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-3 text-sm sm:text-base active:scale-95"
                  >
                    <CreditCard size={18} /> Pay Securely
                  </button>
                )}

                {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                  <button
                    onClick={handleCancelBooking}
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>

            {/* Tracking ID Info Card */}
            <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2.5rem] p-5 sm:p-7 shadow-xl space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-3 ml-2">Digital Signature</p>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Global Order Ref</p>
                    <p className="text-xs font-mono font-bold text-gray-900 truncate pr-4">{booking._id}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(booking._id);
                      const btn = document.activeElement;
                      btn.classList.add('text-green-600');
                      setTimeout(() => btn.classList.remove('text-green-600'), 2000);
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-all active:scale-90"
                    title="Copy Order ID"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              {booking.queueTrackingId && (
                <div className="flex items-center justify-between p-5 bg-green-50/50 rounded-[1.5rem] border border-green-100 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full blur-3xl opacity-30 group-hover:scale-150 transition-transform duration-700" />
                  <div className="min-w-0 relative z-10">
                    <p className="text-[10px] text-[#4C763B] font-black uppercase tracking-[0.15em] mb-1">Queue Identity</p>
                    <p className="text-2xl font-black text-gray-900 tracking-[0.2em] uppercase font-mono">{booking.queueTrackingId}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#4C763B] shadow-sm relative z-10">
                    <Activity size={20} />
                  </div>
                </div>
              )}
            </div>

            {/* OTP Card - Show when payment is completed */}
            {booking.otp && booking.paymentStatus === 'completed' && (
              <div className="bg-[#4C763B] rounded-[2.5rem] p-6 sm:p-8 text-center shadow-2xl shadow-green-900/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="relative z-10">
                  <p className="text-green-100/60 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] mb-4">Entry Passcode</p>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl py-4 px-6 inline-block border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-[0.4em] sm:tracking-[0.5em] ml-[0.5em]">{booking.otp}</span>
                  </div>
                  <p className="text-green-100/40 text-[9px] sm:text-[10px] mt-4 font-bold uppercase tracking-widest">Share this at shop counter</p>
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
