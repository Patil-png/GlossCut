import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Mic, Check,
    Info, Loader2, Sparkles, Volume2, User, Users
} from 'lucide-react';

const VoiceCommandSettingsScreen = () => {
    const navigate = useNavigate();

    // Load initial settings from localStorage
    const [selectedLang, setSelectedLang] = useState(localStorage.getItem('voiceCommandLang') || 'English');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const languages = [
        { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
        { id: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
        { id: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    ];

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleSave = () => {
        setLoading(true);
        try {
            localStorage.setItem('voiceCommandLang', selectedLang);

            // Dispatch a custom event to notify VoiceNotification component
            window.dispatchEvent(new Event('voiceSettingsChanged'));

            showToast(`Settings saved successfully!`, "success");
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            showToast("Failed to save settings", "error");
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
                    <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-widest">Voice Settings</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pt-6 flex-1">
                    {/* Hero */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-200 relative mb-8"
                        >
                            <Mic size={36} className="text-white" strokeWidth={2} />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                                <Sparkles size={16} className="text-purple-500" />
                            </motion.div>
                        </motion.div>
                        <h2 className="text-3xl font-[950] text-gray-900 leading-tight">
                            Voice Controls
                        </h2>
                        <p className="text-[14px] text-gray-400 font-bold mt-4 leading-relaxed max-w-[280px]">
                            Choose your preferred language for smarter assistance.
                        </p>
                    </div>

                    {/* Section: Language */}
                    <div className="mb-10">
                        <h3 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">
                            SELECT LANGUAGE
                        </h3>
                        <div className="space-y-3">
                            {languages.map((lang, index) => (
                                <motion.div
                                    key={lang.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedLang(lang.name)}
                                    className={`p-4 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between ${selectedLang === lang.name
                                        ? 'bg-white border-purple-500 shadow-xl shadow-purple-100 scale-[1.01]'
                                        : 'bg-white border-transparent border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedLang === lang.name ? 'bg-purple-50' : 'bg-gray-50'}`}>
                                            {lang.flag}
                                        </div>
                                        <div>
                                            <p className={`text-[15px] font-black ${selectedLang === lang.name ? 'text-purple-600' : 'text-gray-900'}`}>
                                                {lang.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                {lang.native}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedLang === lang.name && (
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-200">
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-purple-50 rounded-[32px] p-6 border border-purple-100 flex gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <Volume2 size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[13px] text-purple-700 font-bold leading-relaxed">
                                Select a language to customize how GlossCut communicates with you. Voice recognition will also adapt to your choice.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="px-8 pb-10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-16 bg-gray-900 rounded-[32px] text-white font-[950] text-base shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span className="uppercase tracking-widest">Update Voice Settings</span>
                                <Check size={18} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default VoiceCommandSettingsScreen;
