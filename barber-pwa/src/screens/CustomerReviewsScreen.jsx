import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Star, MessageSquare, CornerDownRight,
    Send, X, Loader2, Calendar, User,
    AlertCircle, RefreshCw, Trash2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const CustomerReviewsScreen = () => {
    const navigate = useNavigate();
    const { customerId } = useParams();
    const location = useLocation();
    const { user } = useAuth();

    // Fallback name from state or "Customer"
    const customerName = location.state?.customerName || 'Customer';

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [responseInput, setResponseInput] = useState('');
    const [respondingToId, setRespondingToId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const fetchReviews = useCallback(async () => {
        if (!refreshing) setLoading(true);
        setError(null);
        try {
            // Updated endpoint to match native: /api/review/customer/:customerId/barber/:barberId
            const res = await api.get(`/api/review/customer/${customerId}/barber/${user.id}`);
            setReviews(res.data);
        } catch (err) {
            setError("Failed to load reviews");
            showToast("Could not fetch reviews", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [customerId, user.id, refreshing]);

    useEffect(() => {
        if (customerId && user?.id) {
            fetchReviews();
        }
    }, [fetchReviews, customerId, user?.id]);

    const handleRespond = async (reviewId) => {
        if (!responseInput.trim()) return;
        setIsSubmitting(true);
        try {
            await api.put(`/api/review/${reviewId}/respond`, { barberResponse: responseInput });
            showToast("Response sent!", "success");
            setResponseInput('');
            setRespondingToId(null);
            fetchReviews();
        } catch (err) {
            showToast("Failed to send response", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const ReviewCard = ({ review, index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-indigo-500 font-bold">
                        {review.userId?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 leading-none">{review.userId?.name || 'Customer'}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {format(new Date(review.createdAt), 'dd MMM yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-900 px-3 py-1.5 rounded-full">
                    <span className="text-[11px] font-black text-white">{review.rating}</span>
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                </div>
            </div>

            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
                {review.comment || "No comment provided."}
            </p>

            <div className="pt-6 border-t border-dashed border-gray-100">
                {review.barberResponse ? (
                    <div className="bg-indigo-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Your Response</span>
                        </div>
                        <p className="text-[13px] text-indigo-900 font-bold leading-relaxed">
                            {review.barberResponse}
                        </p>
                    </div>
                ) : respondingToId === review._id ? (
                    <div className="space-y-3">
                        <textarea
                            value={responseInput}
                            onChange={(e) => setResponseInput(e.target.value)}
                            placeholder="Write your response..."
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px]"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRespondingToId(null)}
                                className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRespond(review._id)}
                                disabled={isSubmitting || !responseInput.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Submit"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setRespondingToId(review._id)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        <CornerDownRight size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Reply to review</span>
                    </button>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col">

                {/* Header */}
                <div className="px-4 pt-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Reviews</h1>
                        <p className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">{customerName}</p>
                    </div>
                    <button onClick={fetchReviews} className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform">
                        <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-gray-400`} />
                    </button>
                </div>

                <div className="p-4 flex-1 space-y-4">
                    {loading && !refreshing ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Feedback...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">No Reviews Yet</h3>
                            <p className="text-xs font-bold text-gray-500 text-center max-w-[200px] mt-2">
                                {customerName} hasn't left any feedback for your services yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {reviews.map((rev, idx) => (
                                <ReviewCard key={rev._id} review={rev} index={idx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: -20, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 bg-gray-900 text-white`}>
                                {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />}
                                <p className="font-bold text-sm tracking-tight">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CustomerReviewsScreen;
