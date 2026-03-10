import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format, differenceInSeconds } from 'date-fns';
import { motion } from 'framer-motion';
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
        await axios.put(`${process.env.REACT_APP_API_URL}/api/booking/cancel/${booking._id}`, {}, {
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

  // --- Tracking Step Logic ---
  let currentStep = 1;
  const currentStatus = booking?.status || 'pending';
  if (currentStatus === 'confirmed' || currentStatus === 'assigned') currentStep = 2;
  if (currentStatus === 'in_progress' || currentStatus === 'started') currentStep = 3;
  if (currentStatus === 'completed' || currentStatus === 'done') currentStep = 4;

  const steps = [
    { id: 1, label: 'Booked', icon: <CheckCircle2 size={16} /> },
    { id: 2, label: 'Confirmed', icon: <CheckCircle2 size={16} /> },
    { id: 3, label: 'In Chair', icon: <div className="w-2.5 h-2.5 bg-current rounded-full" /> },
    { id: 4, label: 'Done ⭐', icon: <Star size={14} fill="currentColor" /> }
  ];

  return (
    <div className="min-h-screen bg-[#Fcfcfc] text-[#1d1d1f] font-sans pb-12 sm:pb-20 relative selection:bg-[#4C763B]/20 selection:text-[#4C763B]">

      {/* Super Minimal Header */}
      <div className="sticky top-0 z-50 bg-[#Fcfcfc]/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/customer-history')}
            className="flex items-center gap-2 text-[#4C763B] font-medium transition-opacity hover:opacity-70 active:opacity-50"
          >
            <ArrowLeft size={20} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="text-base sm:text-[17px]">History</span>
          </button>
          <div className="text-[13px] sm:text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
            Appointment Details
          </div>
          <div className="w-[60px]" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6 sm:space-y-8">

        {/* Hero Section: Status & Tracker */}
        <div className="flex flex-col items-center justify-center py-4 sm:py-6">
          {booking.status !== 'completed' && booking.status !== 'cancelled' ? (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-gray-400 mb-1 sm:mb-2">
                  {isStarted ? 'In Progress' : 'Time Remaining'}
                </p>
                {!isStarted && (
                  <div className="text-5xl sm:text-7xl font-semibold tracking-tighter text-[#1d1d1f] tabular-nums leading-none">
                    {formatTimeLeft(timeLeft)}
                  </div>
                )}
                {isStarted && (
                  <div className="flex items-center justify-center gap-2 text-[#e3000f] font-semibold mt-2">
                    <Activity size={24} className="animate-pulse" />
                    <span className="text-xl sm:text-2xl">Session Started</span>
                  </div>
                )}

                <div className={`mt-4 sm:mt-5 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[11px] sm:text-[13px] font-medium tracking-wide ${statusColors.text}`}>
                  <StatusIcon size={14} />
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
              </div>

              {/* Minimal Apple-style Step Tracker */}
              <div className="w-full max-w-sm mx-auto relative pt-2">
                <div className="absolute top-[14px] left-[12%] right-[12%] h-[3px] bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${isStarted ? 'bg-[#e3000f]' : 'bg-[#4C763B]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((Math.max(1, currentStep) - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                  />
                </div>
                <div className="relative flex justify-between">
                  {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isPast = currentStep > step.id;
                    const color = isActive || isPast ? (isStarted ? 'text-[#e3000f]' : 'text-[#4C763B]') : 'text-gray-300';
                    const bgColor = isActive || isPast ? (isStarted ? 'bg-[#e3000f]' : 'bg-[#4C763B]') : 'bg-gray-200';
                    const iconColor = isActive || isPast ? 'text-white' : 'text-transparent';

                    return (
                      <div key={step.id} className="flex flex-col items-center gap-2 z-10 w-1/4">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-500 border-2 border-[#Fcfcfc] shadow-sm ${bgColor} ${iconColor}`}>
                          {isActive && step.id === 3 ? (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          ) : (
                            React.cloneElement(step.icon, { size: 12 })
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-medium ${color}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${statusColors.bg} ${statusColors.text}`}>
                <StatusIcon size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                {booking.status === 'completed' ? 'Appointment Completed' : 'Appointment Cancelled'}
              </h2>
            </div>
          )}
        </div>

        {/* Minimal OTP / Entry Code (If Paid) */}
        {booking.otp && booking.paymentStatus === 'completed' && (
          <div className="bg-white rounded-2xl sm:rounded-[24px] p-6 sm:p-8 flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6 sm:mb-8">
            <div>
              <p className="text-[12px] sm:text-[13px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Entry Code</p>
              <p className="text-[13px] sm:text-[15px] font-medium text-gray-400">Show to professional</p>
            </div>
            <div className="text-3xl sm:text-4xl font-semibold tracking-widest text-[#1d1d1f]">
              {booking.otp}
            </div>
          </div>
        )}

        {/* Apple iOS Settings Style Unified Info List */}
        <div className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">

          {/* Barber Info Row */}
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <div className="w-12 h-12 bg-gray-100 rounded-[14px] flex items-center justify-center text-gray-500">
              <Star size={20} className={booking.barberId?.rating > 4.5 ? 'text-[#eab308] fill-current' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#1d1d1f] truncate leading-tight">
                {booking.barberId?.name || 'Professional'}
              </h3>
              <p className="text-[13px] sm:text-[15px] text-gray-500 mt-0.5 truncate">
                {booking.barberId?.shopName || 'Independent Stylist'}
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 ml-16" />

          {/* Date & Time Row */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center text-gray-400"><Calendar size={20} /></div>
              <span className="text-[15px] sm:text-[17px] text-[#1d1d1f]">Date & Time</span>
            </div>
            <div className="text-[15px] sm:text-[17px] text-gray-500 font-medium">
              {booking.date ? format(new Date(booking.date), 'MMM dd') : 'N/A'} at {booking.time}
            </div>
          </div>

          {(booking.barberId?.phone || booking.barberId?.email) && (
            <>
              <div className="h-[1px] bg-gray-100 flex-1 ml-16" />
              <div className="p-2 sm:p-3 bg-[#fcfcfc]">
                <div className="flex justify-start gap-2 px-2">
                  {booking.barberId.phone && (
                    <a href={`tel:${booking.barberId.phone}`} className="flex-1 min-w-[120px] py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[#4C763B] hover:bg-gray-50 transition-colors">
                      <Phone size={16} /> <span className="text-[14px] font-medium">Call</span>
                    </a>
                  )}
                  {booking.barberId.email && (
                    <a href={`mailto:${booking.barberId.email}`} className="flex-1 min-w-[120px] py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[#4C763B] hover:bg-gray-50 transition-colors">
                      <Mail size={16} /> <span className="text-[14px] font-medium">Email</span>
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {booking.barberId?.shopAddress && (
            <>
              <div className="h-[1px] bg-gray-100" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.barberId.shopAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 flex justify-center text-gray-400 mt-0.5"><MapPin size={20} /></div>
                  <div className="pr-4">
                    <span className="text-[15px] sm:text-[17px] text-[#1d1d1f] block mb-0.5">Location</span>
                    <span className="text-[13px] sm:text-[15px] text-gray-500 line-clamp-2">{booking.barberId.shopAddress}</span>
                  </div>
                </div>
                <ArrowLeft size={16} className="text-gray-300 rotate-180 group-hover:text-gray-500" />
              </a>
            </>
          )}
        </div>

        {/* Clean Review Section (If Completed) */}
        {booking.status === 'completed' && (
          <div className="bg-white rounded-2xl sm:rounded-[24px] p-6 sm:p-8 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center mt-6">

            {hasReviewed ? (
              <div className="space-y-4">
                <div className="text-5xl sm:text-6xl mb-4">{RATING_EMOJIS[customerReview?.rating - 1]?.char}</div>
                <h4 className="text-[17px] sm:text-[19px] font-semibold text-[#1d1d1f]">{customerReview?.title}</h4>
                <p className="text-[15px] sm:text-[17px] text-gray-500 leading-relaxed max-w-sm mx-auto">"{customerReview?.comment}"</p>

                {customerReview?.barberResponse && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                    <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Shop Reply</p>
                    <p className="text-[14px] text-gray-700">{customerReview.barberResponse}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[17px] sm:text-[19px] font-semibold text-[#1d1d1f]">Rate your experience</h3>

                <div className="flex justify-center gap-2 sm:gap-4">
                  {RATING_EMOJIS.map((emoji) => (
                    <button
                      key={emoji.id}
                      onClick={() => setRating(emoji.id)}
                      className={`text-3xl sm:text-4xl transition-transform ${rating > 0 && rating !== emoji.id ? 'opacity-30 grayscale' : 'hover:scale-110'}`}
                    >
                      {emoji.char}
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <div className="animate-fade-in space-y-4 pt-4 text-left">
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-4 py-2 rounded-full text-[13px] sm:text-[14px] font-medium transition-colors border ${isSelected ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="Headline (e.g. Sharp Cut!)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-[12px] px-4 py-3.5 text-[15px] text-[#1d1d1f] focus:bg-white focus:border-gray-300 focus:ring-0 transition-all font-medium placeholder-gray-400"
                    />

                    <textarea
                      placeholder="Add details..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 border border-transparent rounded-[12px] px-4 py-3.5 text-[15px] text-[#1d1d1f] focus:bg-white focus:border-gray-300 focus:ring-0 transition-all font-medium placeholder-gray-400 resize-none"
                    />

                    <button
                      onClick={handleReviewSubmit}
                      disabled={rating === 0}
                      className="w-full py-3.5 sm:py-4 bg-[#1d1d1f] text-white rounded-[14px] sm:rounded-[16px] text-[15px] sm:text-[17px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Column: Summary & Actions */}
      <div className="lg:col-span-4 space-y-4 sm:space-y-6">

        {/* Minimal Order Summary List */}
        <div className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="text-[15px] sm:text-[17px] font-semibold text-[#1d1d1f] mb-4">Summary</h3>
            <div className="space-y-3 sm:space-y-4 mt-2">
              {booking.services.map((service, index) => (
                <div key={index} className="flex justify-between items-center text-[15px] sm:text-[17px]">
                  <span className="text-gray-500">{service.name}</span>
                  <span className="text-[#1d1d1f] font-medium tracking-tight">₹{service.price?.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-5" />
          <div className="p-4 sm:p-5 flex justify-between items-center bg-[#fcfcfc]">
            <span className="text-[15px] sm:text-[17px] font-semibold text-[#1d1d1f]">Total Amount</span>
            <span className="text-[19px] sm:text-[22px] font-semibold text-[#1d1d1f] tracking-tight">₹{booking.totalPrice?.toFixed(0)}</span>
          </div>
        </div>

        {/* Minimal Actions (Payment, Cancel) */}
        <div className="space-y-3 sm:space-y-4">
          {booking.paymentStatus === 'pending' && booking.status === 'confirmed' && (
            <button
              onClick={handlePayment}
              className="w-full py-3.5 sm:py-4 bg-[#4C763B] text-white rounded-[14px] sm:rounded-[16px] text-[15px] sm:text-[17px] font-semibold transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CreditCard size={18} /> Pay Securely
            </button>
          )}

          {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
            <button
              onClick={handleCancelBooking}
              className="w-full py-3.5 sm:py-4 bg-white border border-gray-200 text-[#e3000f] rounded-[14px] sm:rounded-[16px] text-[15px] sm:text-[17px] font-medium transition-colors hover:bg-gray-50 active:scale-[0.98]"
            >
              Cancel Appointment
            </button>
          )}
        </div>

        {/* Minimal Metadata (ID) */}
        <div className="flex items-center justify-between px-2 pt-2 pb-6 border-b border-gray-100 mb-6">
          <span className="text-[12px] text-gray-400 font-medium">ID: <span className="font-mono">{booking._id}</span></span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(booking._id);
              const btn = document.activeElement;
              btn.textContent = 'Copied';
              setTimeout(() => btn.textContent = 'Copy', 2000);
            }}
            className="text-[12px] text-[#4C763B] font-medium"
          >
            Copy
          </button>
        </div>

        {booking.queueTrackingId && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm mt-4">
            <div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Queue ID</p>
              <p className="text-[16px] font-mono font-semibold text-[#1d1d1f]">{booking.queueTrackingId}</p>
            </div>
            <Activity size={20} className="text-[#4C763B]" />
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingDetails;
