import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
    ChevronLeft, Award, TrendingUp,
    ShieldCheck, Zap, Star, Crown,
    CheckCircle2, AlertCircle, Info,
    ChevronRight, Sparkles, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SwipeButton = ({ onSwipe, amount, isLoading, isSuccess }) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [0, 150], [1, 0]);
    const [isSwiped, setIsSwiped] = useState(false);

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 180) {
            setIsSwiped(true);
            onSwipe();
        }
    };

    useEffect(() => {
        if (!isLoading && !isSuccess && isSwiped) {
            setIsSwiped(false);
            x.set(0);
        }
    }, [isLoading, isSuccess]);

    return (
        <div className="relative w-full h-[72px] bg-slate-200 rounded-[36px] p-1.5 overflow-hidden">
            <motion.div
                style={{ opacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <span className="text-slate-500 font-black text-sm uppercase tracking-[2px]">
                    Swipe to Pay • ₹{amount}
                </span>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 280 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative z-10 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing transition-colors ${isSuccess ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                    <CheckCircle2 size={28} className="text-white" />
                ) : (
                    <ChevronRight size={28} className="text-white" strokeWidth={3} />
                )}
            </motion.div>
        </div>
    );
};

const PaymentScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { tier, adPlacementId, amount, adId, category } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const details = useMemo(() => {
        if (adId) return { title: "Ad Campaign", sub: "Banner Promotion", price: parseFloat(amount), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' };
        if (adPlacementId) return { title: "Home Banner", sub: "Priority Ad Slot", price: parseFloat(amount), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' };
        return { title: tier?.name || "Premium", sub: "Top Search Listing", price: parseFloat(tier?.price || 0), icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    }, [tier, adPlacementId, amount, adId]);

    const handlePayment = async () => {
        if (loading || isSuccess) return;
        setLoading(true);

        try {
            // 1. Create Order
            let orderEndpoint = adId ? "/api/payment/ad-order" : "/api/payment/listing-order";
            let orderPayload = adId ? { adId, price: parseFloat(amount) } : { tierId: tier.id, price: tier.price, category };

            const orderRes = await api.post(orderEndpoint, orderPayload);
            const { amount: rzpAmount, id: orderId, currency } = orderRes.data;

            // 2. Fetch Config
            const configRes = await api.get("/api/payment/config");
            const rzpKey = configRes.data.key;

            const options = {
                key: rzpKey,
                amount: rzpAmount,
                currency,
                name: "GlossCut",
                description: `Payment for ${details.title}`,
                order_id: orderId,
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ""
                },
                theme: { color: "#4F46E5" },
                handler: async (response) => {
                    setLoading(true);
                    try {
                        const verifyEndpoint = adId ? "/api/payment/verify-ad" : "/api/payment/verify-listing";
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            ...(adId ? { adId } : { tierId: tier.id, price: tier.price, category })
                        };

                        const verifyRes = await api.post(verifyEndpoint, verifyPayload);
                        if (verifyRes.data.success) {
                            setIsSuccess(true);
                            showToast("Payment Successful!", "success");
                            setTimeout(() => navigate('/payment-confirmation', { state: { details, transactionId: response.razorpay_payment_id } }), 1500);
                        }
                    } catch (err) {
                        showToast("Verification failed", "error");
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        showToast("Payment cancelled", "warning");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            showToast(err.response?.data?.msg || "Payment failure", "error");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Checkout</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-8 space-y-8">
                {/* PROMOTION IMPACT CARD */}
                <div className="bg-slate-900 rounded-[32px] p-6 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-12 translate-y-[-20%]" />
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Guaranteed Growth</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Reach</p>
                            <p className="text-xl font-black text-white">+240%</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Bookings</p>
                            <p className="text-xl font-black text-white">3.5x</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Impact</p>
                            <p className="text-xl font-black text-white">High</p>
                        </div>
                    </div>
                </div>

                {/* RECEIPT CARD */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${details.bg}`}>
                            <details.icon size={28} className={details.color} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 leading-tight">{details.title}</h3>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">{details.sub}</p>
                        </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200 my-6" />
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Payable</span>
                        <div className="text-right">
                            <span className="text-3xl font-black text-gray-900">₹{details.price}</span>
                        </div>
                    </div>
                </div>

                {/* BENEFITS */}
                <section>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-1">Included Benefits</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Zap, label: 'Instant Live' },
                            { icon: ShieldCheck, label: 'Verified Badge' },
                            { icon: Star, label: 'Top Rated' },
                            { icon: Sparkles, label: 'More Clients' }
                        ].map((b, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <b.icon size={16} className="text-indigo-600" />
                                <span className="text-xs font-bold text-gray-700">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECURE PAYMENT INDICATOR */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <p className="text-[11px] font-bold text-emerald-800/60 uppercase tracking-tight">Secure Payment by Razorpay</p>
                </div>
            </main>

            {/* ACTION DOCK */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent z-40">
                <div className="max-w-[500px] mx-auto">
                    <SwipeButton
                        onSwipe={handlePayment}
                        amount={details.price}
                        isLoading={loading}
                        isSuccess={isSuccess}
                    />
                </div>
            </div>

            {/* TOAST */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-8 left-6 right-6 z-[100] flex justify-center"
                >
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl font-bold text-sm flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                        {toast.message}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PaymentScreen;
