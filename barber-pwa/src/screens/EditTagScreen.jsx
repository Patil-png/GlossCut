import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Tag, Info, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const EditTagScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();

    const params = location.state || {};
    const currentTag = params.currentTag || "";

    const [tag, setTag] = useState(currentTag);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [shake, setShake] = useState(false);

    const handleSave = async () => {
        setError("");
        if (!tag.trim()) {
            setError("Tag name cannot be empty");
            triggerShake();
            return;
        }
        if (tag.length < 3) {
            setError("Tag is too short (min 3 chars)");
            triggerShake();
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/shop/tag', { tag });
            navigate(-1);
        } catch (err) {
            console.error("Update Error:", err);
            setError("Failed to save changes. Try again.");
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    return (
        <div className="min-h-screen bg-white flex justify-center">
            <div className="w-full max-w-[450px] bg-white min-h-screen flex flex-col relative pb-32">

                {/* HEADER */}
                <div className="px-6 pt-8 pb-4 flex items-center gap-4 border-b border-slate-50 sticky top-0 bg-white z-10">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 active:scale-95 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Shop Tag</h1>
                </div>

                <div className="p-8 space-y-10">
                    {/* INFO CARD */}
                    <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <Info size={20} />
                        </div>
                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                            Tags help customers find you easily. Choose keywords that describe your niche like "Fade Master" or "Classic Cuts".
                        </p>
                    </div>

                    {/* INPUT SECTION */}
                    <motion.div
                        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Tag Name</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${tag.length > 30 ? 'text-red-500' : 'text-slate-300'}`}>
                                {tag.length}/30
                            </span>
                        </div>

                        <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
                            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-indigo-600' : 'text-slate-300'}`}>
                                <Tag size={20} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => {
                                    setTag(e.target.value);
                                    if (error) setError("");
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="e.g. Premium Haircuts"
                                maxLength={30}
                                className={`w-full h-16 bg-slate-50 rounded-[28px] pl-14 pr-6 text-lg font-black text-slate-900 border-2 transition-all outline-none ${error ? 'border-red-100 bg-red-50/30' : (isFocused ? 'border-indigo-100 bg-white shadow-xl shadow-indigo-100/50' : 'border-transparent shadow-sm')}`}
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-4 text-red-500"
                            >
                                <XCircle size={14} strokeWidth={3} />
                                <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* SAVE BUTTON */}
                <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-30">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full max-w-[402px] h-16 bg-slate-900 rounded-[24px] flex items-center justify-center gap-3 text-white font-black text-sm uppercase tracking-widest pointer-events-auto active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Tag'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditTagScreen;
