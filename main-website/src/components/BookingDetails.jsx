import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format, differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, Mail,
  CreditCard, CheckCircle2, Star,
  ShieldCheck, XCircle, AlertCircle,
  Activity, Users, ArrowRight, ChevronRight, Copy, Check, Scissors,
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
  'Great Cut ✂️', 'Friendly 🤝', 'Good Value 💰',
];

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [customerReview, setCustomerReview] = useState(null);
  const [otpCopied, setOtpCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`, {
        headers: { 'x-auth-token': token },
      });
      setBooking(res.data);
      if (res.data.status === 'completed') {
        try {
          const rr = await axios.get(`${process.env.REACT_APP_API_URL}/api/review/${bookingId}`, {
            headers: { 'x-auth-token': token },
          });
          if (rr.data) {
            setCustomerReview(rr.data);
            setHasReviewed(true);
            setRating(rr.data.rating);
            setComment(rr.data.comment);
            setTitle(rr.data.title);
          }
        } catch (_) {}
      }
    } catch (e) {
      alert('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => { if (bookingId && token) fetchBookingDetails(); }, [bookingId, token, fetchBookingDetails]);

  useEffect(() => {
    if (booking?.date && booking?.time) {
      const dt = new Date(`${format(new Date(booking.date), 'yyyy-MM-dd')}T${booking.time}`);
      const iv = setInterval(() => {
        const s = differenceInSeconds(dt, new Date());
        setTimeLeft(s > 0 ? s : 0);
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [booking]);

  const fmtTime = (s) => {
    if (s === 0) return 'Now';
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p = [];
    if (d) p.push(`${d}d`);
    if (h) p.push(`${h}h`);
    if (m) p.push(`${m}m`);
    if (!h && !d) p.push(`${sec}s`);
    return p.join(' : ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusConfig = (status) => {
    const map = {
      completed: { label: 'Completed', color: 'text-[#4C763B]', bg: 'bg-green-50', border: 'border-green-100', icon: CheckCircle2 },
      confirmed: { label: 'Confirmed', color: 'text-[#4C763B]', bg: 'bg-green-50', border: 'border-green-100', icon: ShieldCheck },
      pending: { label: 'Awaiting Confirmation', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock },
      cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: XCircle },
    };
    return map[status] || map.cancelled;
  };

  const handlePayment = () => navigate('/payment', {
    state: { providerName: booking.barberId.name, providerId: booking.barberId._id, selectedServices: booking.services, totalPrice: booking.totalPrice, bookingId: booking._id, fromHistory: true },
  });

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/booking/cancel/${booking._id}`, {}, { headers: { 'x-auth-token': token } });
      navigate('/customer-history');
    } catch { alert('Failed to cancel booking'); }
  };

  const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleReview = async () => {
    if (!rating) { alert('Please select a rating'); return; }
    let ft = title.trim() || (selectedTags.length ? 'Great experience!' : null);
    if (!ft) { alert('Please add a title'); return; }
    let fc = comment.trim();
    if (selectedTags.length) fc = fc ? `${fc}\n\nHighlights: ${selectedTags.join(', ')}` : `Highlights: ${selectedTags.join(', ')}`;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/review`, { bookingId: booking._id, rating, comment: fc, title: ft }, { headers: { 'x-auth-token': token } });
      setCustomerReview({ rating, comment: fc, title: ft });
      setHasReviewed(true);
      alert('Review submitted!');
    } catch { alert('Failed to submit review'); }
  };

  const handleCopyOtp = () => {
    if (booking?.otp) { navigator.clipboard.writeText(booking.otp); setOtpCopied(true); setTimeout(() => setOtpCopied(false), 2000); }
  };
  const handleCopyId = () => {
    navigator.clipboard.writeText(booking?._id); setIdCopied(true); setTimeout(() => setIdCopied(false), 2000);
  };

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#4C763B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Not Found ──
  if (!booking) return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
        <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-20 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      </div>
      <div className="relative z-10 text-center max-w-md w-full bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-white shadow-lg">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Booking Not Found</h2>
        <button onClick={() => navigate('/customer-history')} className="w-full py-5 bg-[#4C763B] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-900/20 hover:bg-[#3d5f2f] transition-all flex items-center justify-center gap-3 active:scale-95">
          Back to History <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );

  const statusCfg = getStatusConfig(booking.status);
  const StatusIcon = statusCfg.icon;
  const isActive = !booking.status.match(/completed|cancelled/i);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden flex flex-col items-center pt-24 pb-12 lg:pt-32 lg:pb-16">

      {/* ── Background Blobs (same as BookingSuccess) ── */}
      <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
        <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
        <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
      <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50 pointer-events-none">
        <div className="absolute inset-0 bg-gray-100/60" />
        <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative w-full max-w-md lg:max-w-6xl px-4 z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">

          {/* ═══════ LEFT: RECEIPT CARD ═══════ */}
          <div className="w-full lg:w-[420px] shrink-0 mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/customer-history')} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-100 shadow-sm active:scale-95">
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Booking Details</h1>
              </div>
            </div>

            {/* Live Tracking Card (New High-Visibility placement) */}
            {(booking.trackingId || booking._id) && isActive && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/track-queue/${booking.trackingId || booking._id}`)}
                className="w-full mb-4 group relative overflow-hidden bg-white rounded-3xl p-5 shadow-xl border border-green-100 flex items-center justify-between transition-all active:scale-95 active:shadow-md"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#4C763B] text-white flex items-center justify-center shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform">
                    <Users size={22} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4C763B]">Live Session</p>
                    </div>
                    <p className="text-lg font-black text-gray-900 leading-none">Track Appointment</p>
                    <p className="text-[10px] text-gray-400 font-mono font-bold mt-1">ID: #{booking.trackingId || booking._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                <div className="relative z-10 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#4C763B] group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={20} />
                </div>
              </motion.button>
            )}

            {/* The Receipt Card */}
            <div className="relative group">
              {/* Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#4C763B]/20 to-green-600/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

              <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/60">

                {/* Status Header */}
                <div className="bg-gray-50/50 p-6 sm:p-8 text-center relative">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#4C763B] to-green-600" />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center p-3 ${statusCfg.bg} rounded-full ring-1 ${statusCfg.border} mb-4 shadow-inner`}>
                      <StatusIcon className={`w-8 h-8 ${statusCfg.color}`} />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
                      {booking.status === 'completed' ? 'Appointment Done!' : booking.status === 'cancelled' ? 'Booking Cancelled' : 'Appointment ' + statusCfg.label}
                    </h2>
                    <p className={`${statusCfg.color} text-[10px] font-black uppercase tracking-[0.15em] mb-6`}>{statusCfg.label}</p>

                    {/* Timer for active bookings */}
                    {isActive && (
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1">
                          {timeLeft === 0 ? 'Session In Progress' : 'Time Until Appointment'}
                        </p>
                        <div className="flex items-start text-5xl font-extrabold text-gray-900 tracking-tighter">
                          {fmtTime(timeLeft)}
                        </div>
                      </div>
                    )}

                    {/* Total for completed */}
                    {!isActive && (
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1">Total Paid</p>
                        <div className="flex items-start text-5xl font-extrabold text-gray-900 tracking-tighter">
                          <span className="text-xl mt-1.5 text-gray-400 font-bold mr-1">₹</span>
                          {booking.totalPrice?.toFixed(0)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cutout Separator */}
                <div className="relative flex items-center justify-between px-4 bg-white/50">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full -ml-3 box-content border-r border-gray-200/50" />
                  <div className="w-full border-b-2 border-dashed border-gray-100 my-4" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full -mr-3 box-content border-l border-gray-200/50" />
                </div>

                {/* Details Section */}
                <div className="p-5 sm:p-8 space-y-5">

                  {/* OTP */}
                  {booking.otp && booking.paymentStatus === 'completed' && (
                    <div className="bg-[#4C763B]/5 border-2 border-dashed border-[#4C763B]/20 rounded-2xl p-4 flex justify-between items-center hover:border-[#4C763B]/40 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4C763B] flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[#4C763B] uppercase tracking-[0.15em] leading-none mb-1">Entry Code</p>
                          <p className="text-[10px] text-gray-400 font-semibold tracking-tight">Present at the counter</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-gray-900 tracking-[0.15em]">{booking.otp}</span>
                        <button onClick={handleCopyOtp}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${otpCopied ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-[#4C763B]/10 text-[#4C763B]'}`}>
                          {otpCopied ? <Check size={16}/> : <Copy size={16}/>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tracking ID */}
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex justify-between items-center hover:bg-gray-100 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm ring-1 ring-gray-100">
                        <Activity size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-1">Booking ID</p>
                        <p className="text-[11px] text-gray-900 font-mono font-bold truncate">{booking._id}</p>
                      </div>
                    </div>
                    <button onClick={handleCopyId}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${idCopied ? 'bg-[#4C763B] text-white shadow-lg' : 'hover:bg-[#4C763B]/10 text-[#4C763B]'}`}>
                      {idCopied ? <Check size={16}/> : <Copy size={16}/>}
                    </button>
                  </div>

                  {/* Barber Info */}
                  <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4C763B] to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-md ring-1 ring-white overflow-hidden flex-shrink-0">
                      {(booking.barberId?.name || 'P')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Your Barber</p>
                      <h3 className="text-base font-extrabold text-gray-900 truncate tracking-tight">{booking.barberId?.name || 'Professional'}</h3>
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 font-semibold">
                        <MapPin size={10} className="text-[#4C763B]"/> {booking.barberId?.shopAddress || booking.barberId?.shopName || 'Independent'}
                      </p>
                    </div>
                    {booking.barberId?.rating && (
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex-shrink-0">
                        <Star size={10} className="text-orange-400" fill="currentColor" />
                        <span className="text-xs font-black text-gray-900">{Number(booking.barberId.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Buttons */}
                  {isActive && (booking.barberId?.phone || booking.barberId?.email) && (
                    <div className="flex gap-3">
                      {booking.barberId.phone && (
                        <a href={`tel:${booking.barberId.phone}`}
                          className="flex-1 py-3 bg-[#4C763B]/5 border border-[#4C763B]/20 text-[#4C763B] rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-[#4C763B]/10 transition-all active:scale-95">
                          <Phone size={14}/> Call
                        </a>
                      )}
                      {booking.barberId.email && (
                        <a href={`mailto:${booking.barberId.email}`}
                          className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-gray-100 transition-all active:scale-95">
                          <Mail size={14}/> Email
                        </a>
                      )}
                    </div>
                  )}

                  {/* Get Directions */}
                  {booking.barberId?.shopAddress && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(booking.barberId.shopAddress)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm ring-1 ring-gray-100">
                          <MapPin size={18}/>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">Get Directions</span>
                          <span className="text-[11px] text-gray-500 font-medium">{booking.barberId.shopAddress}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-[#4C763B] transition-colors"/>
                    </a>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Date</p>
                      <p className="text-xs font-extrabold text-gray-900 flex items-center gap-2">
                        <Calendar size={12} className="text-[#4C763B]"/>
                        <span className="truncate">{booking.date ? formatDate(booking.date) : 'N/A'}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Time</p>
                      <p className="text-xs font-extrabold text-gray-900 flex items-center gap-2">
                        <Clock size={12} className="text-[#4C763B]"/>
                        {booking.time}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Status</p>
                      <p className={`text-xs font-extrabold flex items-center gap-2 ${statusCfg.color}`}>
                        <StatusIcon size={12}/>
                        {statusCfg.label}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">Payment</p>
                      <p className="text-xs font-extrabold text-gray-900 flex items-center gap-2">
                        <CreditCard size={12} className="text-[#4C763B]"/>
                        <span className="capitalize">{booking.paymentStatus}</span>
                      </p>
                    </div>
                  </div>

                  {/* Services Breakdown */}
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Services Breakdown</p>
                    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-3">
                      {booking.services.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-bold">
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4C763B]" />
                            <span className="text-gray-600 tracking-tight">{s.name}</span>
                          </div>
                          <span className="text-gray-900 font-extrabold">₹{s.price?.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-black text-gray-900">Total</span>
                      <span className="text-2xl font-extrabold text-[#4C763B]">₹{booking.totalPrice?.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-6 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-gray-400 uppercase font-black tracking-[0.15em]">
                    <span className="flex items-center gap-1.5 text-green-600">
                      <ShieldCheck size={12}/> GlossCut Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile Buttons ── */}
            <div className="mt-8 flex flex-col gap-3 lg:hidden">
              {/* Pay */}
              {booking.paymentStatus === 'pending' && booking.status === 'confirmed' && (
                <button onClick={handlePayment}
                  className="w-full py-4 bg-gradient-to-r from-[#4C763B] to-green-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <CreditCard size={18}/> Pay ₹{booking.totalPrice?.toFixed(0)}
                </button>
              )}

              {/* Cancel */}
              {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                <button onClick={handleCancel}
                  className="w-full py-4 bg-white border-2 border-red-200 text-red-500 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 active:scale-95 hover:bg-red-50">
                  Cancel Appointment
                </button>
              )}

              {/* Home */}
              <button onClick={() => navigate('/')}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                Back to Home
              </button>
            </div>

            {/* Review Section (Mobile + Desktop) */}
            {booking.status === 'completed' && (
              <div className="mt-8">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-200/30 to-orange-200/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/60 p-6 sm:p-8">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

                    {hasReviewed ? (
                      <div className="text-center space-y-3 pt-2">
                        <div className="text-6xl">{RATING_EMOJIS[customerReview?.rating - 1]?.char}</div>
                        <h4 className="text-lg font-extrabold text-gray-900 tracking-tight">{customerReview?.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed italic max-w-sm mx-auto">"{customerReview?.comment}"</p>
                        {customerReview?.barberResponse && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Shop Reply</p>
                            <p className="text-sm text-gray-700">{customerReview.barberResponse}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-5 pt-2">
                        <div className="text-center">
                          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Rate Your Experience</h3>
                          <p className="text-xs text-gray-400 mt-1 font-semibold">Tap an emoji to get started</p>
                        </div>
                        <div className="flex justify-center gap-4">
                          {RATING_EMOJIS.map((e) => (
                            <button key={e.id} onClick={() => setRating(e.id)}
                              className={`text-[36px] transition-all duration-200 select-none ${rating > 0 && rating !== e.id ? 'opacity-20 scale-[0.85] grayscale' : 'hover:scale-110'} ${rating === e.id ? 'scale-[1.3] drop-shadow-lg' : ''}`}>
                              {e.char}
                            </button>
                          ))}
                        </div>
                        <AnimatePresence>
                          {rating > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] text-center">{RATING_EMOJIS[rating-1]?.label}</p>
                              <div className="flex flex-wrap gap-2">
                                {QUICK_TAGS.map((t) => (
                                  <button key={t} onClick={() => toggleTag(t)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedTags.includes(t) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                    {t}
                                  </button>
                                ))}
                              </div>
                              <input type="text" placeholder="Give it a headline (e.g. Sharp Cut!)" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#4C763B]/50 transition-all placeholder-gray-400 font-medium"/>
                              <textarea placeholder="Share more details…" value={comment} onChange={e => setComment(e.target.value)} rows={3}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-[#4C763B]/50 transition-all placeholder-gray-400 font-medium resize-none"/>
                              <button onClick={handleReview} disabled={!rating}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-black disabled:opacity-40 active:scale-95 transition-all hover:bg-black">
                                Submit Review
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════ RIGHT: DESKTOP SUMMARY ═══════ */}
          <div className="hidden lg:flex flex-col flex-1 py-4 space-y-12">

            {/* Desktop Header */}
            <div className="space-y-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${statusCfg.bg} ${statusCfg.color} rounded-full text-xs font-black uppercase tracking-[0.15em] border ${statusCfg.border} shadow-sm`}>
                <StatusIcon size={14}/> {statusCfg.label}
              </div>
              <h2 className="text-5xl font-extrabold text-gray-900 tracking-tighter leading-[0.85]">
                {booking.status === 'completed' ? (<>Service<br/><span className="bg-gradient-to-r from-[#4C763B] to-green-600 bg-clip-text text-transparent">Complete.</span></>) :
                 booking.status === 'cancelled' ? (<>Appointment<br/><span className="text-red-500">Cancelled.</span></>) :
                 (<>Your Style is<br/><span className="bg-gradient-to-r from-[#4C763B] to-green-600 bg-clip-text text-transparent">Locked In.</span></>)}
              </h2>
              <p className="text-base text-gray-500 font-semibold max-w-xl leading-relaxed">
                {booking.status === 'completed' ? 'Your appointment is complete. We hope you enjoyed the experience!' :
                 booking.status === 'cancelled' ? 'This appointment has been cancelled.' :
                 "We've received your booking. Present the entry code on your receipt when you arrive."}
              </p>
            </div>

            {/* Desktop Barber Card */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#4C763B]/10 to-green-600/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center gap-10 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#4C763B] to-emerald-600 flex items-center justify-center text-white text-6xl font-black overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    {(booking.barberId?.name || 'P')[0].toUpperCase()}
                  </div>
                  {booking.barberId?.rating && (
                    <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-400 to-orange-500 text-white px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-xl shadow-orange-500/30">
                      <Star size={14} fill="white"/> {Number(booking.barberId.rating).toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#4C763B] uppercase tracking-[0.15em] mb-1">Professional</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tighter leading-none">{booking.barberId?.name || 'Professional'}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    {booking.barberId?.shopAddress && (
                      <div className="flex items-center gap-2.5 text-gray-500 font-extrabold bg-white px-4 py-2 rounded-xl ring-1 ring-gray-100/50 shadow-sm">
                        <MapPin size={20} className="text-[#4C763B]"/>
                        <span className="text-sm tracking-tight">{booking.barberId.shopAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Grid */}
            <div className="grid grid-cols-3 gap-6">
              {(booking.trackingId || booking._id) && isActive && (
                <button onClick={() => navigate(`/track-queue/${booking.trackingId || booking._id}`)}
                  className="p-6 bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-md rounded-[2.5rem] border border-white shadow-lg space-y-4 hover:shadow-xl transition-all duration-500 group/tile text-left relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span className="text-[8px] font-black text-[#4C763B] uppercase tracking-widest">Live</span>
                  </div>
                  <div className="p-4 w-fit bg-[#4C763B] rounded-2xl text-white shadow-xl shadow-green-900/20 group-hover/tile:scale-110 transition-transform">
                    <Users size={24}/>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-gray-900 tracking-tight uppercase">Track Appt.</h4>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">View your live queue position and ETAs.</p>
                  </div>
                </button>
              )}
              <div className="p-6 bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-md rounded-[2.5rem] border border-white shadow-lg space-y-4 hover:shadow-xl transition-all duration-500 group/tile">
                <div className="p-4 w-fit bg-gray-900 rounded-2xl text-white shadow-xl shadow-black/20 group-hover/tile:scale-110 transition-transform">
                  <Scissors size={24}/>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-gray-900 tracking-tight uppercase">{booking.services.length} Services</h4>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">{booking.services.map(s => s.name).join(', ')}</p>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-md rounded-[2.5rem] border border-white shadow-lg space-y-4 hover:shadow-xl transition-all duration-500 group/tile">
                <div className="p-4 w-fit bg-white border border-gray-100 rounded-2xl text-[#4C763B] shadow-xl shadow-green-900/5 group-hover/tile:scale-110 transition-transform">
                  <ShieldCheck size={24}/>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-gray-900 tracking-tight uppercase">Verified</h4>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">Secure & verified booking.</p>
                </div>
              </div>
            </div>

            {/* Desktop Buttons */}
            <div className="flex items-center gap-6 pt-6">
              {booking.paymentStatus === 'pending' && booking.status === 'confirmed' && (
                <button onClick={handlePayment}
                  className="px-10 py-5 bg-[#4C763B] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-900/20 transition-all flex items-center justify-center gap-4 hover:bg-[#3d5f2f] active:scale-95">
                  <CreditCard size={22}/> Pay ₹{booking.totalPrice?.toFixed(0)}
                </button>
              )}
              {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                <button onClick={handleCancel}
                  className="px-8 py-5 bg-white hover:bg-red-50 text-red-500 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 border-2 border-red-200 shadow-lg active:scale-95">
                  Cancel Appointment
                </button>
              )}
              <button onClick={() => navigate('/')}
                className="px-8 py-5 bg-white hover:bg-gray-50 text-gray-900 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 border border-gray-200 shadow-lg hover:shadow-xl active:scale-95">
                Exit to Home
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
