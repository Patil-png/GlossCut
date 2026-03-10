import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Scissors, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GlobalBookingBanner = () => {
    const { isAuthenticated, userType } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeBooking, setActiveBooking] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    // Hide banner on specific pages where it might overlap (like the tracker itself)
    const hiddenRoutes = ['/track-booking', '/booking-success', '/payment-screen', '/qr-scanner'];
    const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));

    useEffect(() => {
        // Only customers should see this, and only if authenticated
        if (!isAuthenticated || userType !== 'customer' || shouldHide) {
            setIsVisible(false);
            return;
        }

        let isMounted = true;
        let timeoutId;

        const fetchActiveBooking = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/active`, {
                    headers: { 'x-auth-token': token }
                });

                if (isMounted) {
                    if (res.data.activeBooking) {
                        setActiveBooking(res.data.activeBooking);
                        setIsVisible(true);
                    } else {
                        setIsVisible(false);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch active booking for banner:', err);
                // Keep silently failing to not disrupt UX
            } finally {
                if (isMounted && !shouldHide) {
                    // Poll fairly frequently to give that "live" feel (15 seconds)
                    timeoutId = setTimeout(fetchActiveBooking, 15000);
                }
            }
        };

        fetchActiveBooking();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [isAuthenticated, userType, shouldHide]);

    if (!isVisible || !activeBooking) return null;

    const barberName = activeBooking.barberId?.shopName || activeBooking.barberId?.name || 'Salon';
    const isStarted = activeBooking.status === 'started';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[90] max-w-sm cursor-pointer"
                onClick={() => navigate(`/track-booking/${activeBooking._id}`)}
            >
                {/* Zomato-style Floating Banner */}
                <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-gray-800 hover:bg-black transition-colors group">

                    <div className="flex items-center gap-4">
                        {/* Status Icon Indicator */}
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center relative z-10">
                                {isStarted ? (
                                    <Scissors className="w-6 h-6 text-[#4C763B]" />
                                ) : (
                                    <Activity className="w-6 h-6 text-orange-400" />
                                )}
                            </div>
                            {/* Pulse effect mapping to status */}
                            <div className={`absolute inset-0 rounded-xl animate-ping opacity-50 ${isStarted ? 'bg-[#4C763B]' : 'bg-orange-400'}`}></div>
                        </div>

                        {/* Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-black text-sm tracking-tight">{barberName}</h4>
                                <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    {activeBooking.time}
                                </span>
                            </div>
                            <p className={`text-xs font-bold ${isStarted ? 'text-[#4C763B]' : 'text-orange-400'}`}>
                                {isStarted ? 'Session In Progress' : 'Booking Confirmed'}
                            </p>
                        </div>
                    </div>

                    {/* Arrow Action */}
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-[#4C763B] group-hover:text-white transition-colors">
                        <ArrowRight size={16} />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GlobalBookingBanner;
