import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, User, Check, AlertCircle, X, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EditNameScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();

    // Split name or use state
    const currentName = location.state?.currentName || user?.name || '';
    const nameParts = currentName.split(' ');

    const [firstName, setFirstName] = useState(nameParts[0] || '');
    const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleUpdate = async () => {
        const fName = firstName.trim();
        const lName = lastName.trim();

        if (!fName) return showToast("First name is required", "error");

        setLoading(true);
        const newName = `${fName} ${lName}`.trim();

        try {
            await api.put('/api/auth/user', { name: newName });
            await refreshUser();
            showToast("Profile updated successfully!", "success");

            // Navigate back with updated data
            setTimeout(() => {
                navigate('/create-barber-card', {
                    state: { ...location.state, updatedName: newName },
                    replace: true
                });
            }, 1500);
        } catch (err) {
            showToast(err.response?.data?.msg || "Update failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center pb-12">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] relative min-h-screen flex flex-col">

                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-6"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                        'bg-gray-900/90 border-gray-700 text-white'
                                }`}>
                                {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-widest">Identity</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pt-8 flex-1">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center mb-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200 relative mb-6"
                        >
                            <User size={40} className="text-white" strokeWidth={2.5} />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white border-4 border-[#F8F9FA] flex items-center justify-center shadow-lg">
                                <Sparkles size={16} className="text-indigo-500" />
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-[950] text-gray-900 text-center leading-tight">
                            How should we<br />call you?
                        </h2>
                        <p className="text-sm text-gray-400 font-bold text-center mt-3 max-w-[280px]">
                            Your professional name appears on bookings and digital cards.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 block">First Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="e.g. Rahul"
                                    className="w-full bg-white border-2 border-gray-50 rounded-[28px] px-8 py-5 text-lg font-black text-gray-900 placeholder:text-gray-200 focus:border-indigo-500/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md"
                                />
                                {firstName.length >= 2 && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="group">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 block">Last Name (Optional)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="e.g. Sharma"
                                    className="w-full bg-white border-2 border-gray-50 rounded-[28px] px-8 py-5 text-lg font-black text-gray-900 placeholder:text-gray-200 focus:border-indigo-500/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 flex items-center gap-3 bg-white/50 border border-gray-100 p-5 rounded-3xl">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck size={18} className="text-indigo-600" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-wider">
                            Verified identity build trust with customers and shop owners.
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="px-8 pb-10">
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="w-full h-16 bg-gray-900 rounded-[28px] text-white font-[950] text-lg shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Confirm Changes"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditNameScreen;
