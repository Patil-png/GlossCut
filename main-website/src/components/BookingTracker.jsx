import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, ChevronLeft, MapPin, Star, MessageCircle, AlertCircle } from 'lucide-react';

const BookingTracker = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [barber, setBarber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Poll booking data every 5 seconds
    useEffect(() => {
        const fetchBookingData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/${bookingId}`, {
                    headers: { 'x-auth-token': token }
                });
                setBooking(res.data);

                // If barber not loaded yet, fetch barber details
                if (!barber && res.data.barberId) {
                    const barberRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/barber/${res.data.barberId._id || res.data.barberId}`);
                    setBarber(barberRes.data);
                }

                if (loading) setLoading(false);
            } catch (err) {
                console.error('Error fetching booking status:', err);
                if (loading) {
                    setError('Could not load booking details');
                    setLoading(false);
                }
            }
        };

        fetchBookingData();
        const intervalId = setInterval(fetchBookingData, 5000);
        return () => clearInterval(intervalId);
    }, [bookingId, barber, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-[#4C763B] rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading Tracker...</p>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <p className="text-xl font-bold text-gray-800 mb-4">{error || 'Booking not found'}</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Back to Home</button>
            </div>
        );
    }

    // --- Status Logic ---
    // States: Booked -> Confirmed -> In Chair (started sorting) -> Done (completed) -> Cancelled
    const status = booking.status || 'pending';

    let currentStep = 1;
    if (status === 'confirmed' || status === 'assigned') currentStep = 2;
    // In our system usually there isn't an "in progress" state actively tracked for customers, but if we had it:
    if (status === 'in_progress' || status === 'started') currentStep = 3;
    if (status === 'completed' || status === 'done') currentStep = 4;

    const isCancelled = status === 'cancelled' || status === 'declined' || status === 'rejected';

    const steps = [
        { id: 1, label: 'Booked', icon: <CheckCircle2 size={18} /> },
        { id: 2, label: 'Confirmed', icon: <CheckCircle2 size={18} /> },
        { id: 3, label: 'In Chair', icon: <div className="w-3 h-3 bg-current rounded-full" /> },
        { id: 4, label: 'Done ⭐', icon: <Star size={16} fill="currentColor" /> }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pt-24 pb-12 lg:pt-32">
            <Helmet>
                <title>GlossCut | Track Booking</title>
            </Helmet>

            <div className="max-w-2xl mx-auto px-4 lg:px-0">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
                            {isCancelled ? 'Booking Cancelled 😢' : 'Your Appointment 🎉'}
                        </h1>
                        <p className="text-gray-500 font-medium">
                            {barber ? barber.shopName || barber.name : 'Salon'} • {booking.date} at {booking.time}
                        </p>
                    </div>
                </div>

                {/* Zomato-style Progress Tracker */}
                {!isCancelled && (
                    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                        <div className="relative">
                            {/* Connecting Line Data */}
                            <div className="absolute top-[28px] left-[10%] right-[10%] h-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#4C763B]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((Math.max(1, currentStep) - 1) / (steps.length - 1)) * 100}%` }}
                                    transition={{ duration: 1, ease: 'easeInOut' }}
                                />
                            </div>

                            {/* Step Indicators */}
                            <div className="relative flex justify-between">
                                {steps.map((step) => {
                                    const isActive = currentStep === step.id;
                                    const isPast = currentStep > step.id;

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-3 w-1/4 z-10">
                                            <motion.div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-[#4C763B] text-white shadow-lg shadow-green-900/30 scale-110 ring-4 ring-green-50' :
                                                    isPast ? 'bg-[#4C763B] text-white' : 'bg-white border-2 border-gray-200 text-gray-300'
                                                    }`}
                                                animate={isActive ? { scale: [1, 1.1, 1], y: [0, -5, 0] } : {}}
                                                transition={isActive ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                                            >
                                                {isActive && step.id === 3 ? (
                                                    <div className="w-5 h-5 bg-white rounded-full animate-ping" />
                                                ) : (
                                                    step.icon
                                                )}
                                            </motion.div>
                                            <span className={`text-[11px] lg:text-xs font-black uppercase tracking-wider text-center ${isActive || isPast ? 'text-gray-900' : 'text-gray-400'
                                                }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            {currentStep === 1 && <p className="text-sm font-bold text-orange-500">Waiting for salon to confirm...</p>}
                            {currentStep === 2 && <p className="text-sm font-bold text-[#4C763B]">✅ Salon confirmed! Arrive 5 mins early.</p>}
                            {currentStep === 3 && <p className="text-sm font-bold text-[#4C763B]">💈 Session in progress...</p>}
                            {currentStep === 4 && <p className="text-sm font-bold text-gray-900">⭐ Complete! Thanks for choosing GlossCut.</p>}
                        </div>
                    </div>
                )}

                {isCancelled && (
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-6 lg:p-8 mb-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-red-900 mb-2">Appointment Cancelled</h3>
                        <p className="text-red-700 text-sm">We're sorry, this appointment is no longer valid. Please book another slot.</p>
                        <button onClick={() => navigate('/all-services-search')} className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700">Find Another Barber</button>
                    </div>
                )}

                {/* Barber & Booking Info Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                            <img src={barber?.image || '/GlossCut.png'} alt={barber?.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-black tracking-tight">{barber?.shopName || barber?.name || 'Loading...'}</h2>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin size={14} className="text-[#4C763B]" /> {barber?.address || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 divide-y divide-gray-100">
                        <div className="pb-3 flex justify-between items-center">
                            <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Entry Code</span>
                            <span className="text-xl font-black tracking-[0.2em]">{booking.otp || 'N/A'}</span>
                        </div>
                        <div className="pt-3 flex justify-between items-center">
                            <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total Paid</span>
                            <span className="text-base font-black">₹{booking.totalPrice}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Services</h4>
                        {booking.services && booking.services.map((srv, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-700">{srv.name}</span>
                                <span className="text-sm font-black">₹{srv.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => window.open(`https://maps.google.com/?q=${barber?.address}`, '_blank')}
                        className="flex-1 py-4 bg-[#4C763B] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-900/20 active:scale-95 transition-transform"
                    >
                        Get Directions
                    </button>
                    {barber?.phone && (
                        <button
                            onClick={() => window.location.href = `tel:${barber.phone}`}
                            className="p-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 active:scale-95 transition-transform"
                        >
                            <MessageCircle size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingTracker;
