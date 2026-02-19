import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Globe, Languages, Check,
    Info, Loader2, Sparkles, Languages as LangIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LanguageSelectionScreen = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();

    const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'English');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const languages = useMemo(() => [
        { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
        { id: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
        { id: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    ], []);

    useEffect(() => {
        // Show "Coming Soon" notification as in native
        const timer = setTimeout(() => {
            showToast("Multiple language support is coming soon", "info");
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleSave = async () => {
        if (selectedLanguage === user?.language) {
            navigate(-1);
            return;
        }

        setLoading(true);
        try {
            await updateProfile({ language: selectedLanguage });
            showToast(`Language updated to ${selectedLanguage}`, "success");
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            showToast("Failed to update language", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center pb-12">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] relative min-h-screen flex flex-col">

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                        'bg-gray-900/90 border-gray-700 text-white'
                                }`}>
                                {toast.type === 'success' ? <Check size={20} /> : <Info size={20} />}
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
                    <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-widest">Language</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pt-6 flex-1">
                    {/* Hero */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-200 relative mb-8"
                        >
                            <Globe size={36} className="text-white" strokeWidth={2} />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                                <Sparkles size={16} className="text-indigo-500" />
                            </motion.div>
                        </motion.div>
                        <h2 className="text-3xl font-[950] text-gray-900 leading-tight">
                            Prefer your language?
                        </h2>
                        <p className="text-[14px] text-gray-400 font-bold mt-4 leading-relaxed max-w-[280px]">
                            We speak your language. Choose one that makes you feel most at home.
                        </p>
                    </div>

                    {/* Language List */}
                    <div className="space-y-4">
                        {languages.map((lang, index) => (
                            <motion.div
                                key={lang.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedLanguage(lang.name)}
                                className={`p-5 rounded-[28px] border-2 transition-all cursor-pointer flex items-center justify-between ${selectedLanguage === lang.name
                                        ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-[1.02]'
                                        : 'bg-white border-transparent border-gray-100/50 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${selectedLanguage === lang.name ? 'bg-indigo-50' : 'bg-gray-50'
                                        }`}>
                                        {lang.flag}
                                    </div>
                                    <div>
                                        <p className={`text-base font-black ${selectedLanguage === lang.name ? 'text-indigo-600' : 'text-gray-900'}`}>
                                            {lang.name}
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            {lang.native}
                                        </p>
                                    </div>
                                </div>
                                {selectedLanguage === lang.name ? (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Check size={16} className="text-white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-100" />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Info Card */}
                    <div className="mt-10 bg-indigo-50 rounded-[32px] p-6 border border-indigo-100 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <LangIcon size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-[13px] text-indigo-700 font-bold leading-relaxed">
                                Don't see your language? We are constantly adding more options to serve you better. Keep an eye on updates!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="px-8 pb-10 mt-8">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-16 bg-gray-900 rounded-[32px] text-white font-[950] text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span>Save Preference</span>
                                <Check size={20} strokeWidth={3} />
                            </>
                        )}
                    </button>
                    <p className="text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] mt-6">
                        Version 1.4 • SetKarr Global
                    </p>
                </div>

            </div>
        </div>
    );
};

export default LanguageSelectionScreen;
