import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, MapPin, Check, X,
    Globe, AlertCircle, Loader2, IndianRupee,
    Navigation, Save, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ManualLocationInputScreen = () => {
    const navigate = useNavigate();
    const { user, shop, refreshAuth } = useAuth();

    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    useEffect(() => {
        if (shop?.location?.coordinates) {
            setLatitude(shop.location.coordinates[1]?.toString() || '');
            setLongitude(shop.location.coordinates[0]?.toString() || '');
        }
    }, [shop]);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    const validateCoordinates = (lat, lng) => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (!lat || !lng) return 'Please enter both latitude and longitude';
        if (isNaN(latNum) || isNaN(lngNum)) return 'Coordinates must be valid numbers';
        if (latNum < -90 || latNum > 90) return 'Latitude must be between -90 and 90';
        if (lngNum < -181 || lngNum > 181) return 'Longitude must be between -180 and 180';
        return null;
    };

    const handleSaveLocation = async (e) => {
        e?.preventDefault();
        const validationError = validateCoordinates(latitude, longitude);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/shop', {
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                }
            });

            showToast('Location updated successfully!', 'success');
            await refreshAuth();
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            const msg = err.response?.data?.msg || err.message || 'Update failed. Check connection.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40 border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">Edit Location</h1>
                    <div className="w-10" />
                </div>

                <form onSubmit={handleSaveLocation} className="p-8 flex-1 flex flex-col">

                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center mb-12"
                    >
                        <div className="w-24 h-24 rounded-[32px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-6 relative">
                            <MapPin size={40} strokeWidth={1.5} />
                            <motion.div
                                className="absolute inset-[-10px] border-2 border-indigo-200 rounded-[42px]"
                                animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                        </div>
                        <h2 className="text-3xl font-[1000] text-gray-900 mb-4 tracking-tighter">Coordinates</h2>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed max-w-[300px]">
                            Enter precise latitude and longitude to pinpoint your shop visibility on the live map.
                        </p>
                    </motion.div>

                    {/* Inputs */}
                    <div className="space-y-6 mb-10">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                            <input
                                type="text"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="e.g. 20.9136"
                                className="h-16 w-full rounded-[24px] bg-white border border-gray-100 px-6 font-bold text-gray-900 outline-none focus:border-indigo-600 focus:shadow-sm transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                            <input
                                type="text"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="e.g. 77.7680"
                                className="h-16 w-full rounded-[24px] bg-white border border-gray-100 px-6 font-bold text-gray-900 outline-none focus:border-indigo-600 focus:shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="bg-white rounded-[32px] p-6 border border-gray-100 flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
                            <Globe size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight">How to find this?</h4>
                            <p className="text-[11px] font-bold text-gray-400 mt-1 leading-relaxed">
                                Open Google Maps → Long press your shop → Copy the numbers in the search bar.
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={() => { setLatitude(''); setLongitude(''); }}
                            className="w-16 h-16 bg-gray-100 rounded-[24px] flex items-center justify-center text-gray-400 active:scale-95 transition-all"
                        >
                            <Trash2 size={24} />
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all text-[12px]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Update Location
                                    <Save size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: -100, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-[13px] tracking-wide">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManualLocationInputScreen;
