import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle2, ArrowRight, Share2,
    Download, Home, Calendar,
    ExternalLink, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

const PaymentConfirmationScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { details, transactionId } = location.state || {};

    useEffect(() => {
        if (!details) {
            navigate('/profile');
        }
    }, [details, navigate]);

    if (!details) return null;

    return (
        <div className="min-h-screen bg-white pb-12 flex justify-center">
            <div className="w-full max-w-[450px] bg-white min-h-screen flex flex-col">

                {/* SUCCESS ANIMATION AREA */}
                <div className="pt-20 pb-10 flex flex-col items-center px-6 text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-200"
                    >
                        <CheckCircle2 size={48} className="text-white" strokeWidth={3} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-black text-gray-900 leading-tight mb-2"
                    >
                        Payment Successful!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-500 font-bold"
                    >
                        Your {details.title} is now active
                    </motion.p>
                </div>

                {/* TRANSACTION DETAILS */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-6 space-y-4"
                >
                    <div className="bg-slate-50 rounded-[32px] p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Transaction ID</span>
                            <span className="text-xs font-bold text-gray-900 select-all">{transactionId?.slice(0, 16)}...</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Date</span>
                            <span className="text-xs font-bold text-gray-900">{format(new Date(), "MMM dd, yyyy • hh:mm a")}</span>
                        </div>

                        <div className="border-t border-dashed border-gray-200" />

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${details.bg}`}>
                                    <details.icon size={20} className={details.color} />
                                </div>
                                <span className="text-sm font-black text-gray-900">{details.title}</span>
                            </div>
                            <span className="text-lg font-black text-gray-900">₹{details.price}</span>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[32px] gap-2 active:scale-95 transition-transform">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Download size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-[32px] gap-2 active:scale-95 transition-transform">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Share2 size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share</span>
                        </button>
                    </div>

                    {/* LIVE PREVIEW BANNER */}
                    <div className="bg-indigo-600 rounded-[32px] p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-base font-black leading-none mb-1">Boost Active!</h4>
                                <p className="text-[10px] font-bold text-white/60 uppercase">Visible on Discovery Map</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/listed-card')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
                            <ArrowRight size={20} className="text-white" />
                        </button>
                    </div>
                </motion.div>

                {/* BOTTOM BUTTON */}
                <div className="mt-auto px-6 py-8">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full h-[72px] bg-slate-900 rounded-[36px] flex items-center justify-center gap-3 text-white font-black text-lg active:scale-95 transition-transform"
                    >
                        <Home size={24} />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmationScreen;
