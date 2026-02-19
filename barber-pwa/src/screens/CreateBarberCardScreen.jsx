import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Clock, Plus, Trash, User, Star, MapPin, CheckCircle,
    Zap, Camera, Sparkles, Scissors, ArrowRight, X, DollarSign,
    GripVertical, AlertCircle, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Optional if not using global theme context
import api from '../utils/api';

// --- HELPER COMPONENTS ---

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

    if (type === 'success') { bg = '#27AE60'; icon = <CheckCircle size={18} color="#fff" />; }
    else if (type === 'error') { bg = '#EB5757'; icon = <AlertCircle size={18} color="#fff" />; }
    else if (type === 'warning') { bg = '#F2994A'; icon = <Zap size={18} color="#fff" />; }

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
        >
            <div
                className="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg min-w-[300px]"
                style={{ backgroundColor: bg }}
            >
                <div>{icon}</div>
                <span className="text-white font-bold text-sm flex-1">{message}</span>
            </div>
        </motion.div>
    );
};

const BarberCardPreview = ({ barberData }) => {
    return (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-xl border border-gray-100 relative">
            <div className="h-[180px] bg-gray-200 relative">
                {barberData.image?.uri ? (
                    <img
                        src={barberData.image.uri}
                        alt="Barber Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-4xl font-bold">
                        {barberData.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-[#27AE60] text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        {barberData.rating > 0 ? barberData.rating.toFixed(1) : "New"} <Star size={10} fill="#fff" />
                    </div>
                </div>
            </div>

            <div className="p-4 relative">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-extrabold text-[#1C1C1E] flex-1 truncate pr-2">
                        {barberData.name || "Your Name Here"}
                    </h3>
                    <CheckCircle size={16} className="text-[#6366F1] flex-shrink-0" fill="white" />
                </div>
                <p className="text-sm text-gray-500 font-medium mb-3">
                    {barberData.address || "Shop Address, City"}
                </p>

                <div className="h-px bg-gray-100 my-3" />

                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Clock size={14} />
                        <span className="text-[13px] font-semibold">{barberData.avgAppointmentTime || "30 min"}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Scissors size={14} />
                        <span className="text-[13px] font-semibold">{barberData.totalServices || 0} Services</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl w-fit">
                    <div className={`w-2 h-2 rounded-full ${barberData.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-xs font-bold ${barberData.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {barberData.isAvailable ? "Accepting Bookings" : "Currently Offline"}
                    </span>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value, onPress, canEdit = true }) => (
    <div
        onClick={canEdit ? onPress : undefined}
        className={`mb-3 bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] ${canEdit ? 'cursor-pointer' : 'opacity-80'}`}
    >
        <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-[#6366F1]" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-base font-bold text-[#1C1C1E] truncate">{value}</p>
            </div>
        </div>
        {canEdit ? (
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <ChevronRight size={16} className="text-[#6366F1]" />
            </div>
        ) : (
            <div className="bg-green-50 px-2 py-1 rounded-lg">
                <span className="text-[10px] font-bold text-green-600 tracking-wide">AUTO</span>
            </div>
        )}
    </div>
);

// --- MAIN COMPONENT ---

const CreateBarberCardScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { barberCard } = location.state || {}; // Expect location state for params

    // File Input Ref
    const fileInputRef = useRef(null);

    // Initial Data
    const initialData = barberCard ? {
        name: barberCard.pendingChanges?.name || barberCard.name,
        services: barberCard.pendingChanges?.services || barberCard.services || [],
        avgAppointmentTime: barberCard.pendingChanges?.avgAppointmentTime || barberCard.avgAppointmentTime,
        maxAppointments: barberCard.pendingChanges?.maxAppointments || barberCard.maxAppointments,
        isAvailable: barberCard.pendingChanges?.isAvailable !== undefined ? barberCard.pendingChanges.isAvailable : barberCard.isAvailable,
        image: barberCard.pendingChanges?.image || barberCard.image,
        approvalStatus: barberCard.approvalStatus || 'approved',
    } : {
        name: user?.name || "",
        services: [],
        avgAppointmentTime: "30 min",
        maxAppointments: "",
        isAvailable: true,
        image: null,
        approvalStatus: 'approved',
    };

    // State
    const [name, setName] = useState(initialData.name);
    const [services, setServices] = useState(initialData.services);
    const [avgAppointmentTime, setAvgAppointmentTime] = useState(initialData.avgAppointmentTime);
    const [maxAppointments, setMaxAppointments] = useState(initialData.maxAppointments);
    const [isAvailable, setIsAvailable] = useState(initialData.isAvailable);
    const [barberCardImage, setBarberCardImage] = useState(initialData.image);
    const [approvalStatus, setApprovalStatus] = useState(initialData.approvalStatus);
    const [loading, setLoading] = useState(false);
    const [existingCard, setExistingCard] = useState(!!barberCard);
    const [shopData, setShopData] = useState(null);

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const showToast = (message, type = 'info') => setToast({ visible: true, message, type });

    // Modal State
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [availableServices, setAvailableServices] = useState([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [selectedCatalogTab, setSelectedCatalogTab] = useState('All');
    const [selectedServiceForAdding, setSelectedServiceForAdding] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [servicePrice, setServicePrice] = useState('');
    const [serviceTime, setServiceTime] = useState('');
    const [selectedMainTab, setSelectedMainTab] = useState('All'); // Main screen sorting

    // --- DATA FETCHING ---
    useEffect(() => {
        const init = async () => {
            try {
                const [servicesRes, shopRes, cardRes] = await Promise.all([
                    api.get('/api/barber-card/services'),
                    api.get('/api/shop/my-shop'),
                    !barberCard ? api.get('/api/barber-card/my-card').catch(() => ({ data: null })) : Promise.resolve({ data: null })
                ]);

                setAvailableServices(servicesRes.data);
                setShopData(shopRes.data);

                if (cardRes && cardRes.data) {
                    const data = cardRes.data;

                    // HYDRATION: Restore category from master list since backend doesn't persist it
                    const rawServices = data.pendingChanges?.services || data.services || [];
                    const hydratedServices = rawServices.map(s => {
                        const masterService = servicesRes.data.find(ms => ms._id === s.serviceId);
                        return { ...s, category: masterService?.category || 'General' };
                    });

                    const currentData = {
                        name: user?.name || data.pendingChanges?.name || data.name,
                        services: hydratedServices,
                        avgAppointmentTime: data.pendingChanges?.avgAppointmentTime || data.avgAppointmentTime,
                        maxAppointments: data.pendingChanges?.maxAppointments || data.maxAppointments,
                        isAvailable: data.pendingChanges?.isAvailable !== undefined ? data.pendingChanges?.isAvailable : data.isAvailable,
                        image: data.pendingChanges?.image || data.image,
                    };

                    setName(currentData.name);
                    setServices(currentData.services);
                    setAvgAppointmentTime(currentData.avgAppointmentTime);
                    setMaxAppointments(currentData.maxAppointments);
                    setIsAvailable(currentData.isAvailable);
                    setBarberCardImage(currentData.image);
                    setApprovalStatus(data.approvalStatus);
                    setExistingCard(true);
                }
            } catch (err) {
                console.error("Init Error", err);
            }
        };
        init();
    }, [barberCard, user?.name]);

    // --- LOGIC: Auto-Calc Time ---
    useEffect(() => {
        if (services.length > 0) {
            const totalTime = services.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0);
            const avg = Math.round(totalTime / services.length);
            setAvgAppointmentTime(`${avg} min`);
        } else {
            setAvgAppointmentTime("30 min");
        }
    }, [services]);

    // --- HANDLERS ---
    const handleSave = async () => {
        if (!name.trim()) return showToast("Please enter your name", "error");
        if (services.length === 0) return showToast("Add at least one service", "warning");

        setLoading(true);
        try {
            const data = { name: name.trim(), services, isAvailable };
            if (avgAppointmentTime !== "30 min") data.avgAppointmentTime = avgAppointmentTime;
            if (maxAppointments) data.maxAppointments = maxAppointments;
            if (barberCardImage) data.image = barberCardImage;

            if (existingCard) await api.put('/api/barber-card', data);
            else await api.post('/api/barber-card', data);

            showToast(existingCard ? "Profile updated!" : "Profile created!", "success");
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            showToast(err.response?.data?.msg || "Save Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('barberCardImage', file);

        try {
            showToast("Uploading...", "info");
            const res = await api.post('/api/barber-card/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            let imageUrl = res.data.imageUrl;
            // Basic URL correction if needed
            if (imageUrl.startsWith('http') && imageUrl.includes('r2.dev')) {
                imageUrl = imageUrl.replace("https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev", "https://images.glosscut.com");
            }

            setBarberCardImage(imageUrl);
            showToast("Cover image updated", "success");
        } catch (err) {
            showToast("Upload failed", "error");
        }
    };

    // --- SERVICE MODAL LOGIC ---
    const CAT_META = {
        'Hair': { color: '#6366F1', emoji: '✂️' },
        'Beard': { color: '#F59E0B', emoji: '🧔' },
        'Skin': { color: '#10B981', emoji: '✨' },
        'Color': { color: '#EC4899', emoji: '🎨' },
        'Shave': { color: '#3B82F6', emoji: '🪒' },
        'Kids': { color: '#8B5CF6', emoji: '🧒' },
        'Eyebrow': { color: '#14B8A6', emoji: '👁️' },
        'Massage': { color: '#F97316', emoji: '💆' },
        'General': { color: '#64748B', emoji: '💈' },
    };

    const getCatMeta = (cat) => CAT_META[cat] || CAT_META['General'];

    const catalogTabs = useMemo(() => {
        const cats = [...new Set(availableServices.map(s => s.category || 'General'))];
        return ['All', ...cats];
    }, [availableServices]);

    const catalogList = useMemo(() => {
        return availableServices.filter(svc => {
            if (services.some(s => s.serviceId === svc._id)) return false; // Exclude added
            if (selectedCatalogTab !== 'All' && (svc.category || 'General') !== selectedCatalogTab) return false;
            if (catalogSearch && !svc.name.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
            return true;
        });
    }, [availableServices, services, selectedCatalogTab, catalogSearch]);

    // --- MAIN SCREEN SORTING ---
    const mainTabs = useMemo(() => {
        const cats = [...new Set(services.map(s => s.category || 'General'))];
        return ['All', ...cats];
    }, [services]);

    const filteredServices = useMemo(() => {
        if (selectedMainTab === 'All') return services;
        return services.filter(s => (s.category || 'General') === selectedMainTab);
    }, [services, selectedMainTab]);

    const handleModalSave = () => {
        if (!servicePrice || !serviceTime) return showToast("Price and Duration required", "error");

        const target = editingService || selectedServiceForAdding;
        const newService = {
            id: editingService ? editingService.id : Date.now().toString(),
            serviceId: target.serviceId || target._id,
            name: target.name,
            price: servicePrice,
            time: serviceTime,
            category: target.category || 'General'
        };

        if (editingService) {
            setServices(prev => prev.map(s => s.id === editingService.id ? newService : s));
            showToast("Service updated", "success");
        } else {
            setServices(prev => [...prev, newService]);
            showToast("Service added", "success");
        }

        handleModalClose();
    };

    const handleModalClose = () => {
        setShowServiceModal(false);
        setEditingService(null);
        setSelectedServiceForAdding(null);
        setServicePrice('');
        setServiceTime('');
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center pb-24">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative">
                <TopToast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                {/* HEADER */}
                <div className="bg-gradient-to-br from-[#6366F1] to-[#4338CA] pt-3 pb-4 px-6 rounded-b-[30px] relative overflow-hidden">
                    <div className="absolute top-[-30px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5 blur-lg pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10 mb-2">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col items-center">
                            <h1 className="text-lg font-black text-white">{existingCard ? 'Edit Profile' : 'Create Profile'}</h1>
                        </div>
                        <div className="w-10" />
                    </div>
                </div>

                {/* PENDING APPROVAL WARNING */}
                {approvalStatus === 'pending' && (
                    <div className="px-5 mt-4 relative z-20 mb-[-10px]">
                        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                                <Clock size={20} className="text-[#D97706]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#92400E]">Changes Pending Approval</h3>
                                <p className="text-xs text-[#B45309] font-medium leading-tight mt-0.5">
                                    You can continue editing, updates will be merged once approved.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-5 mt-4 relative z-20">
                    {/* PREVIEW */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h2 className="text-lg font-extrabold text-[#1C1C1E]">Live Preview</h2>
                            <span className="bg-[#E8F5E9] text-[#27AE60] text-[10px] font-bold px-2 py-0.5 rounded-md">PUBLIC VIEW</span>
                        </div>
                        <BarberCardPreview barberData={{
                            name, address: shopData?.address, image: barberCardImage ? { uri: barberCardImage } : null,
                            rating: 4.8, avgAppointmentTime, totalServices: services.length, isAvailable
                        }} />
                    </div>

                    {/* ESSENTIALS */}
                    <div className="mb-6">
                        <h2 className="text-lg font-extrabold text-[#1C1C1E] mb-3 px-1">Essential Details</h2>
                        <InfoRow
                            icon={User} label="Display Name"
                            value={name || "Set Name"}
                            onPress={() => {
                                const newName = prompt("Enter your professional name:", name);
                                if (newName) setName(newName);
                            }}
                        />
                        <InfoRow
                            icon={Camera} label="Cover Image"
                            value={barberCardImage ? "Image Added" : "Add Image"}
                            onPress={() => fileInputRef.current?.click()}
                        />
                        <InfoRow
                            icon={Clock} label="Slot Duration"
                            value={avgAppointmentTime}
                            canEdit={false}
                        />
                        <InfoRow
                            icon={Zap} label="Daily Limit"
                            value={maxAppointments ? `${maxAppointments} Slots` : "Unlimited"}
                            onPress={() => {
                                const newLimit = prompt("Enter max appointments per day (leave empty for unlimited):", maxAppointments);
                                if (newLimit !== null) setMaxAppointments(newLimit);
                            }}
                        />

                    </div>

                    {/* SERVICES */}
                    <div className="mb-24">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 className="text-lg font-extrabold text-[#1C1C1E]">Service Menu</h2>
                                <p className="text-xs text-gray-500 font-medium">{services.length} Active Services</p>
                            </div>
                            <button
                                onClick={() => setShowServiceModal(true)}
                                className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {services.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center">
                                <Scissors size={32} className="text-gray-300 mb-2" />
                                <p className="text-sm font-bold text-gray-400">No services added yet</p>
                                <button onClick={() => setShowServiceModal(true)} className="mt-3 text-[#6366F1] text-sm font-bold hover:underline">
                                    + Add Services
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-2 px-1">
                                    {mainTabs.map(tab => {
                                        const isActive = selectedMainTab === tab;
                                        const meta = getCatMeta(tab === 'All' ? 'General' : tab);
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setSelectedMainTab(tab)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-colors ${isActive ? `bg-indigo-500 border-indigo-500 text-white` : 'bg-white border-gray-200 text-gray-600'}`}
                                            >
                                                <span>{meta.emoji}</span>
                                                {tab}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-3">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredServices.map(item => {
                                            const meta = getCatMeta(item.category || 'General');
                                            return (
                                                <motion.div
                                                    layout
                                                    key={item.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    onClick={() => { setEditingService(item); setServicePrice(item.price); setServiceTime(item.time); setShowServiceModal(true); }}
                                                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.color }} />

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-lg">
                                                            {meta.emoji}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[15px] font-bold text-[#1C1C1E]">{item.name}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{item.category}</span>
                                                                <span className="text-xs text-gray-400">{item.time} min</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-base font-bold text-[#1C1C1E]">₹{item.price}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setServices(prev => prev.filter(s => s.id !== item.id)); }}
                                                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 flex justify-center z-40">
                    <div className="w-full max-w-[450px]">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-14 rounded-full bg-gradient-to-r from-[#6366F1] to-[#4338CA] text-white font-bold text-lg shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : (
                                <>
                                    {existingCard ? "Save Changes" : "Create Profile"} <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* MODAL */}
                <AnimatePresence>
                    {showServiceModal && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                            <motion.div
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="bg-[#F8FAFC] w-full max-w-[450px] h-[90vh] rounded-t-[30px] sm:rounded-[30px] overflow-hidden flex flex-col shadow-2xl"
                            >
                                {/* Header */}
                                <div className="bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10">
                                    <h3 className="text-xl font-extrabold text-[#1C1C1E]">
                                        {editingService ? "Edit Service" : selectedServiceForAdding ? "Configure" : "Add Service"}
                                    </h3>
                                    <button onClick={handleModalClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                {(editingService || selectedServiceForAdding) ? (
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-3xl">
                                                {getCatMeta((editingService || selectedServiceForAdding).category).emoji}
                                            </div>
                                            <h2 className="text-2xl font-bold text-[#1C1C1E] mb-1">
                                                {(editingService || selectedServiceForAdding).name}
                                            </h2>
                                            <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 uppercase">
                                                {(editingService || selectedServiceForAdding).category || 'General'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Price (₹)</label>
                                                <div className="flex items-center">
                                                    <span className="text-xl font-bold text-gray-400 mr-1">₹</span>
                                                    <input
                                                        type="number"
                                                        value={servicePrice}
                                                        onChange={(e) => setServicePrice(e.target.value)}
                                                        className="w-full text-2xl font-bold text-[#1C1C1E] bg-transparent focus:outline-none"
                                                        placeholder="0"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Duration</label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        value={serviceTime}
                                                        onChange={(e) => setServiceTime(e.target.value)}
                                                        className="w-full text-2xl font-bold text-[#1C1C1E] bg-transparent focus:outline-none"
                                                        placeholder="30"
                                                    />
                                                    <span className="text-sm font-bold text-gray-400">min</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleModalSave}
                                            className="w-full py-4 rounded-xl bg-[#1C1C1E] text-white font-bold shadow-lg active:scale-[0.98] transition-transform"
                                        >
                                            {editingService ? "Update Service" : "Add Service"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Search & Tabs */}
                                        <div className="bg-white p-4 border-b border-gray-100">
                                            <input
                                                type="text"
                                                placeholder="Search haircut, beard, skin..."
                                                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 font-semibold text-[#1C1C1E] focus:ring-2 focus:ring-indigo-500/20 mb-4"
                                                value={catalogSearch}
                                                onChange={(e) => setCatalogSearch(e.target.value)}
                                            />
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                {catalogTabs.map(tab => {
                                                    const isActive = selectedCatalogTab === tab;
                                                    const meta = getCatMeta(tab === 'All' ? 'General' : tab);
                                                    return (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setSelectedCatalogTab(tab)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-colors ${isActive ? `bg-indigo-500 border-indigo-500 text-white` : 'bg-white border-gray-200 text-gray-600'}`}
                                                        >
                                                            <span>{meta.emoji}</span>
                                                            {tab}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 content-start">
                                            {catalogList.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                    <Scissors size={40} className="mb-2 opacity-50" />
                                                    <p className="font-semibold">No services found</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {catalogList.map(item => {
                                                        const meta = getCatMeta(item.category || 'General');
                                                        return (
                                                            <div
                                                                key={item._id || item.id}
                                                                onClick={() => { setSelectedServiceForAdding(item); setServicePrice('300'); setServiceTime('30'); }}
                                                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">
                                                                        {meta.emoji}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[15px] font-bold text-[#1C1C1E]">{item.name}</h4>
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                                                    <Plus size={16} className="text-[#6366F1]" strokeWidth={3} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreateBarberCardScreen;
