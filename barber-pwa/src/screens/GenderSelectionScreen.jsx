import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Check, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const GenderOptionItem = ({ label, isSelected, onSelect }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            className={`w-full p-6 rounded-[32px] flex items-center justify-between border-2 transition-all duration-300 ${isSelected
                    ? 'bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-50 shadow-sm hover:border-slate-200'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'
                    }`}>
                    <User size={24} />
                </div>
                <span className={`text-lg font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                </span>
            </div>

            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-100 scale-100'
                }`}>
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                        >
                            <Check size={16} className="text-white" strokeWidth={4} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.button>
    );
};

const GenderSelectionScreen = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const { theme } = useTheme();

    const [selectedGender, setSelectedGender] = useState(user?.gender || '');
    const [loading, setLoading] = useState(false);

    const genderOptions = ['Male', 'Female', 'Other'];

    const handleUpdate = async () => {
        if (!selectedGender) return;
        if (user?.gender === selectedGender) {
            navigate(-1);
            return;
        }

        setLoading(true);
        try {
            await updateProfile({ gender: selectedGender });
            navigate(-1);
        } catch (error) {
            console.error("Gender Update Error:", error);
            alert('Failed to update gender. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center">
            {/* Ambient Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-10" />
                <div className="absolute bottom-40 -left-20 w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="w-full max-w-[450px] bg-white min-h-screen flex flex-col relative pb-32 shadow-2xl">

                {/* HEADER */}
                <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 active:scale-90 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-widest">Identity</h1>
                    <div className="w-10" />
                </div>

                <div className="flex-1 p-8 space-y-12">
                    {/* HERO SECTION */}
                    <div className="text-center space-y-6">
                        <div className="relative inline-block">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-24 h-24 rounded-[32px] bg-slate-900 flex items-center justify-center text-white shadow-2xl relative z-10"
                            >
                                <User size={44} strokeWidth={1.5} />
                            </motion.div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white z-20">
                                <Sparkles size={16} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight uppercase">How do you<br />identify?</h2>
                            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-[280px] mx-auto">
                                This helps us personalize your grooming recommendations and official communications.
                            </p>
                        </div>
                    </div>

                    {/* OPTIONS */}
                    <div className="space-y-4">
                        {genderOptions.map((gender) => (
                            <GenderOptionItem
                                key={gender}
                                label={gender}
                                isSelected={selectedGender === gender}
                                onSelect={() => setSelectedGender(gender)}
                            />
                        ))}
                    </div>
                </div>

                {/* FOOTER BUTTON */}
                <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none z-30">
                    <button
                        onClick={handleUpdate}
                        disabled={loading || !selectedGender}
                        className="w-full max-w-[386px] h-16 bg-slate-900 rounded-[24px] flex items-center justify-center gap-3 text-white font-black text-sm uppercase tracking-widest pointer-events-auto active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Selection'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GenderSelectionScreen;
