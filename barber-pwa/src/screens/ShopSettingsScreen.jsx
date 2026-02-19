import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Edit2, Store, MapPin, Phone, Tag,
    Camera, ShieldCheck, Lock, ChevronRight, Loader2, Sparkles
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SettingsRow = ({ icon: Icon, label, value, onClick, isLast, canEdit = true }) => (
    <motion.div
        whileTap={canEdit ? { scale: 0.98 } : {}}
        onClick={canEdit ? onClick : undefined}
        className={`flex items-center p-4 min-h-[72px] cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}
    >
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mr-4 ${canEdit ? 'bg-purple-50' : 'bg-gray-50'}`}>
            <Icon size={20} className={canEdit ? 'text-[#6A1B9A]' : 'text-gray-400'} strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className={`text-[15px] font-bold truncate ${value ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                {value || 'Not provided'}
            </p>
        </div>

        <div className="ml-3">
            {canEdit ? (
                <ChevronRight size={18} className="text-gray-300" />
            ) : (
                <Lock size={14} className="text-gray-300 opacity-50" />
            )}
        </div>
    </motion.div>
);

const ShopSettingsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchShop = useCallback(async () => {
        try {
            const res = await api.get('/api/shop/my-shop');
            setShop(res.data);
        } catch (err) {
            console.error("Failed to fetch shop:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShop();
    }, [fetchShop]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('shopImage', file);

        setUploading(true);
        try {
            const res = await api.post('/api/shop/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = res.data.imageUrl;

            // Optimistic update
            setShop(prev => ({ ...prev, image: imageUrl }));
            await api.put('/api/shop', { image: imageUrl });
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#6A1B9A]" size={32} />
            </div>
        );
    }

    const isOwner = shop?.isMainOwner;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center pb-12">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] relative min-h-screen">

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900">Profile & Settings</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                            <div className="w-[124px] h-[124px] rounded-full p-1.5 border-2 border-dashed border-[#6A1B9A] relative">
                                <img
                                    src={shop?.image || '/SetKarr.png'}
                                    alt="Shop"
                                    className="w-full h-full rounded-full object-cover bg-white"
                                />
                                {isOwner && (
                                    <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#6A1B9A] border-4 border-[#F8F9FA] flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg">
                                        {uploading ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 text-center">
                            <h2 className="text-2xl font-[900] text-gray-900 tracking-tight leading-tight">
                                {shop?.name || 'Untitled Shop'}
                            </h2>
                            <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm mt-3">
                                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center mr-2">
                                    <ShieldCheck size={12} className="text-[#6A1B9A]" strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-gray-500">{user?.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Settings Group */}
                    <div className="mb-2">
                        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 ml-1 opacity-80">
                            Shop Details
                        </p>
                        <div className="bg-white rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
                            <SettingsRow
                                icon={Store}
                                label="Shop Name"
                                value={shop?.name}
                                onClick={() => navigate('/edit-shop-name', { state: { currentName: shop?.name } })}
                                canEdit={isOwner}
                            />
                            <SettingsRow
                                icon={MapPin}
                                label="Location"
                                value={shop?.address}
                                onClick={() => navigate('/edit-shop-address', { state: { currentAddress: shop?.address } })}
                                canEdit={isOwner}
                            />
                            <SettingsRow
                                icon={Phone}
                                label="Phone Number"
                                value={shop?.phone}
                                onClick={() => navigate('/edit-shop-phone', { state: { currentPhone: shop?.phone } })}
                                canEdit={isOwner}
                            />
                            <SettingsRow
                                icon={Tag}
                                label="Category"
                                value={shop?.category || 'Uncategorized'}
                                onClick={() => navigate('/edit-category', { state: { currentCategory: shop?.category } })}
                                canEdit={isOwner}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-center mt-12 px-6">
                        <div className="inline-flex items-center bg-indigo-50/50 px-4 py-2 rounded-xl mb-4">
                            <Sparkles size={14} className="text-[#6A1B9A] mr-2" />
                            <p className="text-[12px] font-bold text-gray-500">
                                Premium Display Active
                            </p>
                        </div>
                        <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                            Information shown here is visible to all customers on your barber card. Updates might require admin verification.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ShopSettingsScreen;
