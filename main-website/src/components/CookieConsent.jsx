import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Delay slightly to not overwhelm user immediately on load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

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
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
                >
                    <div className="max-w-6xl mx-auto bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                        <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-amber-500/10 rounded-full shrink-0">
                                <Cookie className="text-amber-500" size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-white font-bold text-lg">We value your privacy</h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                                    We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
                                    By clicking "Accept All", you consent to our use of cookies in accordance with our
                                    <Link to="/privacy" className="text-amber-500 hover:text-amber-400 ml-1 underline">Privacy Policy</Link>.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                            <button
                                onClick={handleDecline}
                                className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold transition-colors text-sm shadow-lg shadow-amber-500/20"
                            >
                                Accept All
                            </button>
                        </div>

                        {/* Close button for "dismiss without choice" - functionality equivalent to decline/defer */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white md:hidden"
                        >
                            <X size={20} />
                        </button>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
