import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CookieConsent = ({ className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Exclude specific pages that should have a seamless experience (QR-driven)
        const excludedPaths = ['/checkin', '/track-queue', '/booking-success', '/booking-appointment', '/payment', '/booking-confirmation-waiting'];
        const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));

        // Also check for source=qr in query params OR in session-level storage (from QrTracker/previous scan)
        const params = new URLSearchParams(location.search);
        const isQrSource = params.get('source') === 'qr' || localStorage.getItem('referral_source') === 'qr';

        if (isExcludedPath || isQrSource) {
            setIsVisible(false);
            return;
        }

        // Check if user has already made a choice
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Delay slightly to not overwhelm user immediately on load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
        // Here you would typically initialize analytics (e.g., GA4, Pixel)
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] max-w-md w-auto ${className}`}
                >
                    <div className="relative overflow-hidden bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-8">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl border border-amber-500/20 shadow-inner">
                                    <Cookie className="text-amber-500" size={24} />
                                </div>
                                <h3 className="text-white font-semibold text-xl tracking-tight">Cookie Settings</h3>
                            </div>

                            <div className="space-y-3">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    We use cookies to enhance your experience and analyze our traffic.
                                    By clicking "Accept All", you agree to our use of cookies.
                                </p>
                                <Link
                                    to="/privacy"
                                    className="inline-block text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors hover:underline"
                                >
                                    Review Privacy Policy
                                </Link>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold transition-all duration-300 text-sm shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold transition-all duration-300 text-sm hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>

                        {/* Optional Dismiss button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
