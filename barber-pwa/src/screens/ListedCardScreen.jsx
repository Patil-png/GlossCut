import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowLeft, Store, Phone, Tag, ChevronRight, Navigation,
    WifiOff, AlertCircle, CheckCircle, Info, Camera, Trash2, Sparkles, Zap, User, Star, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// --- UTILS ---
const getProcessedImageUri = (imagePath, userProfilePic) => {
    if (!imagePath) return userProfilePic || null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'https://api.glosscut.com'}${imagePath}`;
};

// --- COMPONENTS ---

const TopToast = ({ visible, message, type, onHide }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide]);

    if (!visible) return null;

    let bg = '#333';
    let icon = <Sparkles size={18} color="#fff" />;

    if (type === 'success') { bg = '#10B981'; icon = <CheckCircle size={18} color="#fff" />; }
    else if (type === 'error') { bg = '#EF4444'; icon = <AlertCircle size={18} color="#fff" />; }
    else if (type === 'warning') { bg = '#F59E0B'; icon = <Zap size={18} color="#fff" />; }

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        >
            <div
                className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl min-w-[300px] pointer-events-auto"
                style={{ backgroundColor: bg }}
            >
                <div>{icon}</div>
                <span className="text-white font-bold text-sm flex-1">{message}</span>
            </div>
        </motion.div>
    );
};

const ScalePress = ({ onClick, children, disabled, className }) => (
    <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={!disabled ? onClick : undefined}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        {children}
    </motion.div>
);

const ModernHeader = ({ title, subtitle, onBack }) => (
    <div className="bg-gradient-to-br from-[#6366F1] to-[#4338CA] pt-6 pb-8 px-6 rounded-b-[36px] relative overflow-hidden mb-6">
        <div className="absolute top-[-40px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5 blur-lg pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
            <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-colors"
            >
                <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
                {subtitle && <p className="text-white/80 text-xs font-semibold mt-0.5">{subtitle}</p>}
            </div>
            <div className="w-10" />
        </div>
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-base font-black text-gray-800 uppercase tracking-wider">{title}</h2>
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100">LIVE</span>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, onClick, canEdit = true }) => (
    <ScalePress onClick={onClick} disabled={!canEdit} className="mb-3 w-full">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={22} className="text-indigo-600" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-base font-bold text-gray-900 truncate pr-4">{value}</p>
                </div>
            </div>
            {canEdit ? (
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <ChevronRight size={18} className="text-indigo-600" />
                </div>
            ) : (
                <div className="bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    <span className="text-[10px] font-bold text-green-600 tracking-wide">OFFICIAL</span>
                </div>
            )}
        </div>
    </ScalePress>
);

const ShopCardPreview = ({ shopData }) => {
    const totalBarbers = 1 + (shopData?.staff?.length || 0);
    const avgRating = shopData?.rating > 0 ? shopData.rating.toFixed(1) : "New Member";
    const imageUri = getProcessedImageUri(shopData?.image, null);

    return (
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 mb-6 relative group transform transition-transform hover:scale-[1.01]">
            <div className="h-[200px] bg-gray-100 relative overflow-hidden">
                {imageUri ? (
                    <img src={imageUri} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Store size={48} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                        <Sparkles size={12} className="text-yellow-400" />
                        <span className="text-white text-xs font-bold">{avgRating}</span>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-2xl font-black text-gray-900 truncate pr-2">
                        {shopData?.name || "Initializing..."}
                    </h3>
                    <CheckCircle size={18} className="text-indigo-500 flex-shrink-0" fill="white" />
                </div>
                <div className="flex items-center gap-1 text-gray-500 mb-4">
                    <MapPin size={12} />
                    <p className="text-sm font-medium truncate">{shopData?.address || "Address pending"}</p>
                </div>

                <div className="h-px bg-gray-100 mb-4" />

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-gray-600">{totalBarbers} Professionals</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-1.5 text-indigo-600">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{shopData?.category || "Premium Service"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN SCREEN ---

const ListedCardScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingStaff, setPendingStaff] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => setToast({ visible: true, message, type });

    const fetchPendingStaff = useCallback(async () => {
        try {
            const res = await api.get('/api/shop/staff/pending');
            setPendingStaff(res.data);
        } catch (err) { console.error("Error fetching pending staff:", err); }
    }, []);

    const fetchShopData = useCallback(async () => {
        try {
            const res = await api.get('/api/shop/my-shop');
            setShopData(res.data);
            if (res.data?.isMainOwner) fetchPendingStaff();
        } catch (err) {
            console.error("Fetch Error:", err);
            showToast("Failed to load shop data", "error");
        } finally {
            setLoading(false);
        }
    }, [fetchPendingStaff]);

    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('shopImage', file);

        try {
            showToast("Uploading...", "info");
            const res = await api.post('/api/shop/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            let imageUrl = res.data.imageUrl;
            if (imageUrl.includes('r2.dev')) {
                imageUrl = imageUrl.replace("https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev", "https://images.glosscut.com");
            }

            // Optimize: Optimistic update
            setShopData(prev => ({ ...prev, image: imageUrl }));
            await api.put('/api/shop', { image: imageUrl });
            showToast("Cover image updated!", "success");
        } catch (err) {
            showToast("Upload failed", "error");
        }
    };

    const handleApproveStaff = async (barberId) => {
        try {
            await api.put(`/api/shop/staff/approve/${barberId}`);
            showToast("Staff approved", "success");
            fetchPendingStaff();
            fetchShopData(); // Refresh to see them in team
        } catch (err) { showToast("Action failed", "error"); }
    };

    const handleRejectStaff = async (barberId) => {
        try {
            await api.put(`/api/shop/staff/reject/${barberId}`);
            showToast("Request rejected", "info");
            fetchPendingStaff();
        } catch (err) { showToast("Action failed", "error"); }
    };

    const handleRemoveStaff = async (barber) => {
        if (!window.confirm(`Remove ${barber.name} from your team?`)) return;

        try {
            const res = await api.post('/api/barber-card/request-delete', {
                reason: "Barber card deletion requested by shop owner",
                targetBarberId: barber._id
            });
            if (res.status === 200) {
                showToast("Removal request sent", "success");
                fetchShopData();
            }
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to remove", "error");
        }
    };

    const handlePinLocation = async () => {
        if (!navigator.geolocation) return showToast("Geolocation not supported", "error");

        showToast("Getting location...", "info");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                await api.put('/api/shop', { location: { type: "Point", coordinates: [longitude, latitude] } });
                showToast("Location pinned!", "success");
                setShopData(prev => ({ ...prev, location: { type: "Point", coordinates: [longitude, latitude] } }));
            } catch (err) {
                showToast("Failed to save location", "error");
            }
        }, () => showToast("Location denied", "error"));
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
            <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    const isMainOwner = shopData?.isMainOwner;

    return (
        <div className="min-h-screen bg-[#F4F5F7] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative">
                <TopToast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <ModernHeader title="Premium Profile" subtitle="Managing your digital presence" onBack={() => navigate(-1)} />

                <div className="px-5">
                    <div className="mb-8">
                        <SectionHeader title="Live Appearance" />
                        <ShopCardPreview shopData={shopData} />
                    </div>

                    <div className="mb-8">
                        <SectionHeader title="Establishment Details" />
                        <InfoRow icon={Store} label="Shop Name" value={shopData?.name} canEdit={false} />
                        <InfoRow icon={MapPin} label="Location" value={shopData?.address} canEdit={false} />
                        <InfoRow icon={Phone} label="Contact" value={shopData?.phone} canEdit={false} />
                        <InfoRow
                            icon={Camera}
                            label="Portfolio Media"
                            value="Update Cover Image"
                            onClick={() => fileInputRef.current?.click()}
                            canEdit={isMainOwner}
                        />
                    </div>

                    <div className="mb-8">
                        <SectionHeader title="Map Presence" />
                        <ScalePress onClick={handlePinLocation} className="w-full">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Navigation size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Visibility Status</p>
                                    <p className={`text-base font-bold ${shopData?.location?.coordinates ? 'text-emerald-500' : 'text-gray-900'}`}>
                                        {shopData?.location?.coordinates ? "Live on GlossCut Map" : "Pin Your Location"}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ChevronRight size={18} className="text-indigo-600" />
                                </div>
                            </div>
                        </ScalePress>
                    </div>

                    {isMainOwner && shopData?.staff?.length > 0 && (
                        <div className="mb-8">
                            <SectionHeader title="Team Members" />
                            <div className="space-y-3">
                                {shopData.staff.map(staff => (
                                    <div key={staff._id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                            {staff.profilePicture ? (
                                                <img src={getProcessedImageUri(staff.profilePicture)} alt="Staff" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={16} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Staff Member</p>
                                            <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStaff(staff)}
                                            className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isMainOwner && pendingStaff.length > 0 && (
                        <div className="mb-8">
                            <SectionHeader title="Barber Partnerships" />
                            <div className="space-y-4">
                                {pendingStaff.map(staff => (
                                    <div key={staff._id} className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-yellow-900">{staff.name}</h4>
                                                <p className="text-xs font-medium text-yellow-700">Requested to join</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleRejectStaff(staff._id)}
                                                className="flex-1 py-2.5 rounded-xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleApproveStaff(staff._id)}
                                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600"
                                            >
                                                Accept Partner
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListedCardScreen;
