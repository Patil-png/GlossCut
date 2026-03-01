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
                    initial={{ y: 20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[100] max-w-sm md:max-w-md w-auto ${className}`}
                >
                    <div className="relative overflow-hidden bg-[#121212]/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] p-4 md:p-6 lg:p-7">
                        {/* Subtle decorative glow */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />

                        <div className="relative flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-amber-400/10 to-amber-600/10 rounded-xl border border-amber-500/10">
                                    <Cookie className="text-amber-500" size={20} />
                                </div>
                                <h3 className="text-white font-medium text-lg tracking-tight">Privacy Settings</h3>
                            </div>

                            <div className="space-y-2">
                                <p className="text-gray-400 text-[13px] md:text-sm leading-relaxed">
                                    We use cookies to improve your experience.
                                    By clicking "Accept All", you agree to our use of cookies.
                                </p>
                                <Link
                                    to="/privacy"
                                    className="inline-block text-amber-500/90 hover:text-amber-400 text-[12px] md:text-sm font-medium transition-colors hover:underline"
                                >
                                    Learn More
                                </Link>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={handleAccept}
                                    className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold transition-all duration-300 text-xs md:text-sm shadow-lg shadow-amber-500/10 hover:-translate-y-0.5"
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-gray-400 font-medium transition-all duration-300 text-xs md:text-sm hover:-translate-y-0.5"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-3 right-3 p-1.5 text-gray-600 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
