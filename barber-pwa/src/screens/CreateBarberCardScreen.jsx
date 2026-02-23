import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Clock, Plus, Trash, User, Star, MapPin, CheckCircle,
    Zap, Camera, Sparkles, Scissors, ArrowRight, X, DollarSign,
    GripVertical, AlertCircle, RefreshCw, ChevronRight, Check, Scan, Navigation2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Optional if not using global theme context
import api from '../utils/api';

const CategoryReorderItem = ({ tab, meta }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item
            value={tab}
            dragListener={false}
            dragControls={controls}
            className="bg-white border border-gray-100 rounded-2xl flex flex-col shadow-sm cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden group mb-3"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.color || '#6366F1' }} />

            <div className="flex items-center justify-between p-4 flex-1">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div
                        className="w-6 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 touch-none"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical size={20} className="text-gray-400" />
                    </div>
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-lg flex-shrink-0">
                            {meta.emoji}
                        </div>
                        <h4 className="text-[15px] font-bold text-[#1C1C1E] truncate">{tab}</h4>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
};

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
    else if (type === 'warning') { bg = 'rgba(242, 153, 74, 1)'; icon = <Zap size={18} color="#fff" />; }

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

const ServiceItem = ({ item, meta, onEdit, onDelete, isLocked }) => {
    const controls = useDragControls();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Reorder.Item
            key={item.id}
            value={item}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-gray-100 rounded-2xl flex flex-col shadow-sm cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden group"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.color }} />

            <div className="flex items-center justify-between p-4 flex-1">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    {!isLocked && (
                        <div
                            className="w-6 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 touch-none"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={20} className="text-gray-400" />
                        </div>
                    )}
                    <div
                        className={`flex items-center gap-3 flex-1 overflow-hidden ${isLocked ? 'pl-2' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-lg flex-shrink-0">
                            {meta.emoji}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-[15px] font-bold text-[#1C1C1E] truncate inline-flex items-center gap-2">
                                {item.name}
                                {item.isInherited && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                        Shop Master
                                    </span>
                                )}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                {item.category && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{item.category}</span>
                                )}
                                <span className="text-xs text-gray-400">{item.time} min</span>
                                <ChevronRight size={12} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                    <span className="text-base font-bold text-[#1C1C1E]">₹{item.price}</span>
                    {!item.isInherited && !isLocked && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                        >
                            <Trash size={14} />
                        </button>
                    )}
                    {!isLocked && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.isInherited ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-[#6366F1] hover:bg-indigo-100'}`}
                        >
                            {item.isInherited ? <Sparkles size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && item.description && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-50 bg-gray-50/30"
                    >
                        <div className="px-14 pb-4 pt-2">
                            <p className="text-sm text-gray-500 font-medium italic leading-relaxed">
                                "{item.description}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};

// --- MAIN COMPONENT ---

const CreateBarberCardScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isMainOwner } = useAuth();
    const { barberCard } = location.state || {}; // Expect location state for params

    // File Input Ref
    const fileInputRef = useRef(null);

    // Initial Data
    const initialData = barberCard ? {
        name: barberCard.pendingChanges?.name || barberCard.name,
        services: barberCard.pendingChanges?.services || barberCard.services || [],
        avgAppointmentTime: barberCard.pendingChanges?.avgAppointmentTime || barberCard.avgAppointmentTime,
        maxAppointments: barberCard.pendingChanges?.maxAppointments || barberCard.maxAppointments || user?.maxAppointmentsPerDay,
        isAvailable: barberCard.pendingChanges?.isAvailable !== undefined ? barberCard.pendingChanges.isAvailable : barberCard.isAvailable,
        image: barberCard.pendingChanges?.image || barberCard.image,
        approvalStatus: barberCard.approvalStatus || 'approved',
        categoryOrder: barberCard.categoryOrder || [],
    } : {
        name: user?.name || "",
        services: [],
        avgAppointmentTime: "30 min",
        maxAppointments: user?.maxAppointmentsPerDay || "",
        isAvailable: true,
        image: null,
        approvalStatus: 'approved',
        categoryOrder: [],
    };

    // State
    const [name, setName] = useState(initialData.name);
    const [services, setServices] = useState(initialData.services);
    const [avgAppointmentTime, setAvgAppointmentTime] = useState(initialData.avgAppointmentTime);
    const [maxAppointments, setMaxAppointments] = useState(initialData.maxAppointments);
    const [isAvailable, setIsAvailable] = useState(initialData.isAvailable);
    const [barberCardImage, setBarberCardImage] = useState(initialData.image);
    const [approvalStatus, setApprovalStatus] = useState(initialData.approvalStatus);
    const [categoryOrder, setCategoryOrder] = useState(initialData.categoryOrder);
    const [isSyncEnabled, setIsSyncEnabled] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [hasPendingChanges, setHasPendingChanges] = useState(
        (!!barberCard?.pendingChanges && Object.keys(barberCard.pendingChanges).length > 0) ||
        (!!barberCard?.changeDetails && barberCard.changeDetails.length > 0)
    );
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
    const [selectedCatalogGender, setSelectedCatalogGender] = useState('male'); // Default to male

    // Attendance State
    const [showScanner, setShowScanner] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedServiceForAdding, setSelectedServiceForAdding] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [servicePrice, setServicePrice] = useState('');
    const [serviceTime, setServiceTime] = useState('');
    const [selectedMainTab, setSelectedMainTab] = useState('All'); // Main screen sorting
    const [categories, setCategories] = useState([]);
    const [selectedMainGender, setSelectedMainGender] = useState('male'); // Default for main menu

    // --- DATA FETCHING ---
    useEffect(() => {
        const init = async () => {
            try {
                // Check for updates from navigation state
                if (location.state?.updatedName) setName(location.state.updatedName);
                if (location.state?.updatedMaxAppointments) setMaxAppointments(location.state.updatedMaxAppointments);

                const [servicesRes, shopRes, catRes, cardRes] = await Promise.all([
                    api.get(`/api/barber-card/services?shopId=${user?.shopId || ''}`),
                    api.get('/api/shop/my-shop'),
                    api.get(`/api/categories?shopId=${user?.shopId || ''}`),
                    !barberCard ? api.get('/api/barber-card/my-card').catch(() => ({ data: null })) : Promise.resolve({ data: null })
                ]);

                setAvailableServices(servicesRes.data);
                setShopData(shopRes.data);
                if (catRes.data) setCategories(catRes.data);

                if (cardRes && cardRes.data) {
                    const data = cardRes.data;

                    // HYDRATION: Restore category from master list since backend doesn't persist it
                    const rawServices = data.pendingChanges?.services || data.services || [];
                    const hydratedServices = rawServices.map(s => {
                        const masterService = servicesRes.data.find(ms => (ms._id === s.serviceId || ms.id === s.serviceId));
                        return {
                            ...s,
                            category: s.category || masterService?.category || '',
                            description: s.description || masterService?.description || '',
                            isInherited: s.isInherited || false,
                            source: s.source || 'barber'
                        };
                    });

                    const currentData = {
                        name: location.state?.updatedName || user?.name || data.pendingChanges?.name || data.name,
                        services: hydratedServices,
                        avgAppointmentTime: data.pendingChanges?.avgAppointmentTime || data.avgAppointmentTime,
                        maxAppointments: location.state?.updatedMaxAppointments || data.pendingChanges?.maxAppointments || data.maxAppointments || user?.maxAppointmentsPerDay,
                        isAvailable: data.pendingChanges?.isAvailable !== undefined ? data.pendingChanges?.isAvailable : data.isAvailable,
                        image: data.pendingChanges?.image || data.image,
                        categoryOrder: data.categoryOrder || [],
                    };

                    setName(currentData.name);
                    setServices(currentData.services);
                    setAvgAppointmentTime(currentData.avgAppointmentTime);
                    setMaxAppointments(currentData.maxAppointments);
                    setIsAvailable(currentData.isAvailable);
                    setBarberCardImage(currentData.image);
                    setCategoryOrder(currentData.categoryOrder);
                    setApprovalStatus(data.approvalStatus);
                    setExistingCard(true);

                    if (shopRes.data) {
                        setIsSyncEnabled(shopRes.data.forceStaffServiceSync);
                    }
                } else if (shopRes.data && shopRes.data.forceStaffServiceSync && shopRes.data.services?.length > 0) {
                    // NEW BARBER + SYNC ENABLED: Pre-populate from Shop Master List
                    console.log("🛠️ Pre-populating new card with Shop Master services");
                    const shopServices = shopRes.data.services.map(s => ({
                        id: s.id || Date.now().toString() + Math.random(),
                        serviceId: s.id,
                        name: s.name,
                        price: s.price,
                        time: s.time,
                        category: s.category || 'General',
                        isInherited: true,
                        source: 'shop'
                    }));
                    setServices(shopServices);
                    setIsSyncEnabled(true);
                }
            } catch (err) {
                console.error("Init Error", err);
            }
        };
        init();
    }, [barberCard, user?.name, location.state]);

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
    const handleToggleSync = async () => {
        setSyncLoading(true);
        try {
            const nextState = !isSyncEnabled;
            const res = await api.put('/api/shop/toggle-service-sync', { enabled: nextState });
            if (res.data.success) {
                setIsSyncEnabled(nextState);
                showToast(nextState ? "Sync enabled for all staff" : "Sync disabled", "success");
            }
        } catch (err) {
            showToast("Failed to toggle sync", "error");
        } finally {
            setSyncLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return showToast("Please enter your name", "error");
        if (services.length === 0) return showToast("Add at least one service", "warning");

        setLoading(true);
        try {
            const data = { name: name.trim(), services, isAvailable };
            if (avgAppointmentTime !== "30 min") data.avgAppointmentTime = avgAppointmentTime;
            if (maxAppointments) data.maxAppointments = maxAppointments;
            if (barberCardImage) data.image = barberCardImage;
            if (categoryOrder && categoryOrder.length > 0) data.categoryOrder = categoryOrder;

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
    const getCatMeta = (cat, fetchedCats = []) => {
        if (!cat) return { color: '#64748B', emoji: '💈', gender: 'unisex' }; // Default for no category
        const source = (fetchedCats && fetchedCats.length > 0) ? fetchedCats : categories;
        const found = source.find(c => c.name === cat);
        if (found) return { color: found.color, emoji: found.emoji, gender: found.gender };
        return { color: '#64748B', emoji: '💈', gender: 'unisex' }; // Default
    };

    const catalogTabs = useMemo(() => {
        // Filter categories by selected gender
        const filteredCats = categories.filter(c =>
            c.gender === 'unisex' || c.gender === selectedCatalogGender
        );

        const shopCats = availableServices
            .filter(s => {
                const meta = getCatMeta(s.category);
                return meta.gender === 'unisex' || meta.gender === selectedCatalogGender;
            })
            .map(s => s.category);

        const globalCats = filteredCats.map(c => c.name);
        const combined = [...new Set([...shopCats, ...globalCats])]
            .filter(Boolean)
            .filter(cat => cat !== 'General');
        return ['All', ...combined];
    }, [availableServices, categories, selectedCatalogGender]);

    const catalogList = useMemo(() => {
        // Create templates from global categories
        const templates = categories.map(cat => ({
            _id: `cat-${cat._id}`,
            name: cat.name,
            category: cat.name,
            description: `Select to configure ${cat.name}`,
            isTemplate: true
        }));

        const combined = [...availableServices, ...templates];

        return combined.filter(svc => {
            // Filter by gender first
            const meta = getCatMeta(svc.category);
            if (meta.gender !== 'unisex' && meta.gender !== selectedCatalogGender) return false;

            // If it's already in our profile, don't show in catalog
            if (services.some(s => s.name.toLowerCase() === svc.name.toLowerCase())) return false;

            if (selectedCatalogTab !== 'All' && svc.category !== selectedCatalogTab) return false;
            if (catalogSearch && !svc.name.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
            return true;
        });
    }, [availableServices, categories, services, selectedCatalogTab, catalogSearch, selectedCatalogGender]);

    // --- MAIN SCREEN SORTING ---
    const mainTabs = useMemo(() => {
        const filteredServicesByGender = services.filter(s => {
            const meta = getCatMeta(s.category);
            return meta.gender === 'unisex' || meta.gender === selectedMainGender;
        });
        const cats = [...new Set(filteredServicesByGender.map(s => s.category))]
            .filter(Boolean)
            .filter(cat => cat !== 'General');

        // Sort by custom order if available
        if (categoryOrder && categoryOrder.length > 0) {
            cats.sort((a, b) => {
                const idxA = categoryOrder.indexOf(a);
                const idxB = categoryOrder.indexOf(b);
                if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
        }
        return ['All', ...cats];
    }, [services, selectedMainGender, categoryOrder]);

    const filteredServices = useMemo(() => {
        const genderMatched = services.filter(s => {
            const meta = getCatMeta(s.category);
            return meta.gender === 'unisex' || meta.gender === selectedMainGender;
        });

        if (selectedMainTab === 'All') return genderMatched;
        return genderMatched.filter(s => s.category === selectedMainTab);
    }, [services, selectedMainTab, selectedMainGender]);

    const handleModalSave = () => {
        if (!servicePrice || !serviceTime) return showToast("Price and Duration required", "error");

        const target = editingService || selectedServiceForAdding;
        const newService = {
            id: editingService ? editingService.id : Date.now().toString(),
            serviceId: target.serviceId || target._id,
            name: target.name,
            price: servicePrice,
            time: serviceTime,
            category: target.category || 'General',
            description: target.description || ''
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

    const handleStartScanning = () => {
        if (!navigator.geolocation) return showToast("Geolocation not supported", "error");

        setScannerLoading(true);
        showToast("Verifying location...", "info");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ latitude, longitude });
                setScannerLoading(false);
                setShowScanner(true);
            },
            (err) => {
                setScannerLoading(false);
                showToast("Location permission required", "error");
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    const onScanSuccess = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.type !== 'attendance' || !data.shopId) {
                showToast("Invalid QR Code", "error");
                return;
            }

            setShowScanner(false);
            showToast("Marking attendance...", "info");

            const res = await api.post('/api/attendance/mark', {
                shopId: data.shopId,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
            });

            if (res.data.success) {
                showToast(res.data.msg, "success");
            }
        } catch (err) {
            console.error("Scan error:", err);
            showToast(err.response?.data?.msg || "Failed to mark attendance", "error");
        }
    };

    const handleModalClose = () => {
        setShowServiceModal(false);
        setEditingService(null);
        setSelectedServiceForAdding(null);
        setServicePrice('');
        setServiceTime('');
    };

    const ScannerLogic = ({ onScanSuccess, active }) => {
        const html5QrCode = useRef(null);

        useEffect(() => {
            if (active) {
                const scanner = new Html5Qrcode("qr-reader");
                html5QrCode.current = scanner;

                const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                scanner.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScanSuccess(decodedText);
                        scanner.stop().catch(err => console.error("Scanner stop error", err));
                    }
                ).catch(err => console.error("Scanner start error", err));
            } else {
                if (html5QrCode.current && html5QrCode.current.isScanning) {
                    html5QrCode.current.stop().catch(err => console.error("Scanner stop error", err));
                }
            }

            return () => {
                if (html5QrCode.current && html5QrCode.current.isScanning) {
                    html5QrCode.current.stop().catch(err => console.error("Scanner unmount stop error", err));
                }
            };
        }, [active, onScanSuccess]);

        return null;
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
                        <div className="w-10">
                            {existingCard && (
                                <button
                                    onClick={handleStartScanning}
                                    className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform"
                                    title="Mark Attendance"
                                >
                                    {scannerLoading ? <RefreshCw size={20} className="animate-spin" /> : <Scan size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* LOCKDOWN NOTICE FOR STAFF */}
                {!isMainOwner && isSyncEnabled && (
                    <div className="px-5 mt-4 relative z-20">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-center gap-3 shadow-sm shadow-amber-100/50"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Lock size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-0.5">Centralized Management</h4>
                                <p className="text-[10px] text-amber-700/70 font-bold uppercase leading-tight">
                                    Your Profile & Services are managed by the Shop Owner.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* PENDING APPROVAL WARNING */}
                {(approvalStatus === 'pending' || hasPendingChanges) && approvalStatus !== 'rejected' && (
                    <div className="px-5 mt-4 relative z-20 mb-[-10px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[28px] shadow-sm flex items-start gap-4 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl" />
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-200">
                                <Sparkles size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-sm font-black text-[#1C1C1E] mb-1">Profile Under Review</h4>
                                <p className="text-[12px] leading-relaxed text-gray-500 font-medium italic">
                                    "Your professional profile updates are pending GLOSSCUT approval. Your existing live profile remains unchanged for now."
                                </p>
                            </div>
                        </motion.div>
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
                            onPress={(!isMainOwner && isSyncEnabled) ? null : () => navigate('/edit-name', { state: { currentName: name } })}
                            canEdit={!(!isMainOwner && isSyncEnabled)}
                        />
                        <InfoRow
                            icon={Camera} label="Cover Image"
                            value={barberCardImage ? "Image Added" : "Add Image"}
                            onPress={(!isMainOwner && isSyncEnabled) ? null : () => fileInputRef.current?.click()}
                            canEdit={!(!isMainOwner && isSyncEnabled)}
                        />
                        <InfoRow
                            icon={Clock} label="Slot Duration"
                            value={avgAppointmentTime}
                            canEdit={false}
                        />
                        <InfoRow
                            icon={Zap} label="Daily Limit"
                            value={maxAppointments && maxAppointments !== "0" ? `${maxAppointments} Slots` : "Unlimited"}
                            onPress={(!isMainOwner && isSyncEnabled) ? null : () => navigate('/edit-max-appointments', { state: { currentMaxAppointments: maxAppointments } })}
                            canEdit={!(!isMainOwner && isSyncEnabled)}
                        />

                    </div>

                    {/* Owner-Only: Sync Services Toggle */}
                    {shopData && (shopData.owner?._id === user?.id || shopData.owner === user?.id) && (
                        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <RefreshCw size={22} className={syncLoading ? 'animate-spin' : ''} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#1C1C1E] uppercase tracking-tighter">Sync with Staff</h3>
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase opacity-70">
                                            {isSyncEnabled ? 'Force active' : 'Manual mode'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleSync}
                                    disabled={syncLoading}
                                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSyncEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSyncEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <div className="mt-3 bg-white/60 p-2.5 rounded-2xl border border-indigo-50/50">
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                    <Sparkles size={10} className="inline mr-1 text-indigo-500" />
                                    When enabled, your staff members will <span className="text-indigo-600 font-bold">automatically inherit</span> all services defined in your shop master list.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mb-24">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div>
                                <h2 className="text-lg font-extrabold text-[#1C1C1E]">Service Menu</h2>
                                <p className="text-xs text-gray-500 font-medium">{services.length} Active Services</p>
                            </div>
                            <div className="flex gap-2">
                                {(!isMainOwner && isSyncEnabled) ? (
                                    <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Locked</span>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowCategoryModal(true)}
                                            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
                                            title="Manage Categories"
                                        >
                                            <GripVertical size={18} />
                                        </button>
                                        <button
                                            onClick={() => setShowServiceModal(true)}
                                            className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Gender Filter for Main Menu */}
                        <div className="flex bg-gray-200/50 p-1 rounded-xl mb-4">
                            {['male', 'female', 'unisex'].map(gen => (
                                <button
                                    key={gen}
                                    onClick={() => {
                                        setSelectedMainGender(gen);
                                        setSelectedMainTab('All'); // Reset category tab
                                    }}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${selectedMainGender === gen ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                                >
                                    {gen === 'male' ? '♂ Men' : gen === 'female' ? '♀ Women' : '✨ Unisex'}
                                </button>
                            ))}
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
                                    <button
                                        onClick={() => setSelectedMainTab('All')}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-colors ${selectedMainTab === 'All' ? `bg-indigo-500 border-indigo-500 text-white` : 'bg-white border-gray-200 text-gray-600'}`}
                                    >
                                        <span>💈</span>
                                        All
                                    </button>

                                    {mainTabs.filter(t => t !== 'All').map(tab => {
                                        const isActive = selectedMainTab === tab;
                                        const meta = getCatMeta(tab);
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setSelectedMainTab(tab)}
                                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-colors ${isActive ? `bg-indigo-500 border-indigo-500 text-white` : 'bg-white border-gray-200 text-gray-600'}`}
                                            >
                                                <span>{meta.emoji}</span>
                                                {tab}
                                                {meta.gender && meta.gender !== 'unisex' && (
                                                    <span className={`text-[8px] uppercase px-1 rounded ${meta.gender === 'male' ? 'bg-blue-100/20' : 'bg-pink-100/20'}`}>
                                                        {meta.gender === 'male' ? '♂' : '♀'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Reorder.Group
                                    axis="y"
                                    values={filteredServices}
                                    onReorder={(newFilteredOrder) => {
                                        const newServices = [...services];
                                        let fIdx = 0;
                                        for (let i = 0; i < newServices.length; i++) {
                                            if (filteredServices.some(fs => fs.id === newServices[i].id)) {
                                                newServices[i] = newFilteredOrder[fIdx];
                                                fIdx++;
                                            }
                                        }
                                        setServices(newServices);
                                    }}
                                    className="space-y-3"
                                >
                                    <AnimatePresence mode='popLayout'>
                                        {filteredServices.map(item => (
                                            <ServiceItem
                                                key={item.id}
                                                item={item}
                                                meta={getCatMeta(item.category || 'General')}
                                                onEdit={() => { setEditingService(item); setServicePrice(item.price); setServiceTime(item.time); setShowServiceModal(true); }}
                                                onDelete={() => setServices(prev => prev.filter(s => s.id !== item.id))}
                                                isLocked={!isMainOwner && isSyncEnabled}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER - ONLY SHOW SAVE IF NOT LOCKED */}
                {(!isMainOwner && isSyncEnabled) ? (
                    <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 flex justify-center z-40 bg-white/80 backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm uppercase tracking-widest">
                            READ ONLY MODE ACTIVE
                        </p>
                    </div>
                ) : (
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
                )}

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
                                            {(editingService || selectedServiceForAdding).description && (
                                                <p className="mt-3 text-sm text-gray-500 font-medium italic px-4">
                                                    "{(editingService || selectedServiceForAdding).description}"
                                                </p>
                                            )}
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
                                            {/* Gender Filter */}
                                            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                                {['male', 'female', 'unisex'].map(gen => (
                                                    <button
                                                        key={gen}
                                                        onClick={() => {
                                                            setSelectedCatalogGender(gen);
                                                            setSelectedCatalogTab('All'); // Reset category tab
                                                        }}
                                                        className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${selectedCatalogGender === gen ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                                                    >
                                                        {gen === 'male' ? '♂ Men' : gen === 'female' ? '♀ Women' : '✨ Unisex'}
                                                    </button>
                                                ))}
                                            </div>

                                            <input
                                                type="text"
                                                placeholder={`Search for ${selectedCatalogGender} services...`}
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
                                                            {meta.gender && meta.gender !== 'unisex' && (
                                                                <span className={`text-[8px] uppercase px-1 rounded ${meta.gender === 'male' ? 'bg-blue-100/20' : 'bg-pink-100/20'}`}>
                                                                    {meta.gender === 'male' ? '♂' : '♀'}
                                                                </span>
                                                            )}
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
                                                                onClick={() => {
                                                                    setSelectedServiceForAdding(item);
                                                                    setServicePrice(item.isTemplate ? '' : item.price || '');
                                                                    setServiceTime(item.isTemplate ? '30' : item.time || '30');
                                                                }}
                                                                className={`p-4 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform ${item.isTemplate ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-gray-100'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${item.isTemplate ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50'}`}>
                                                                        {meta.emoji}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="text-[15px] font-bold text-[#1C1C1E]">{item.name}</h4>
                                                                            {item.isTemplate && (
                                                                                <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">NEW</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                                                                            {item.description && (
                                                                                <span className="text-[10px] text-gray-300 font-medium truncate max-w-[150px]">
                                                                                    • {item.description}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isTemplate ? 'bg-indigo-600' : 'bg-indigo-50'}`}>
                                                                    <Plus size={16} className={item.isTemplate ? 'text-white' : 'text-[#6366F1]'} strokeWidth={3} />
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

                {/* --- MANAGE CATEGORIES MODAL --- */}
                <AnimatePresence>
                    {showCategoryModal && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl flex flex-col max-h-[90vh] shadow-2xl"
                            >
                                <div className="p-6 border-b flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-[#1C1C1E]">Manage Order</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Drag items to rearrange</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCategoryModal(false)}
                                        className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    <Reorder.Group
                                        axis="y"
                                        values={mainTabs.filter(t => t !== 'All')}
                                        onReorder={(newOrder) => setCategoryOrder(newOrder)}
                                        className="space-y-3"
                                    >
                                        {mainTabs.filter(t => t !== 'All').map(tab => {
                                            const meta = getCatMeta(tab);
                                            return (
                                                <CategoryReorderItem
                                                    key={tab}
                                                    tab={tab}
                                                    meta={meta}
                                                />
                                            );
                                        })}
                                    </Reorder.Group>
                                </div>

                                <div className="p-6 bg-gray-50 border-t rounded-b-[32px] sm:rounded-b-3xl">
                                    <button
                                        onClick={() => setShowCategoryModal(false)}
                                        className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- ATTENDANCE SCANNER MODAL --- */}
                <AnimatePresence>
                    {showScanner && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative w-full h-full flex flex-col"
                            >
                                <div className="absolute top-8 left-6 right-6 flex justify-between items-start z-[110]">
                                    <div>
                                        <h2 className="text-white text-2xl font-black mb-1">Verify Shift</h2>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Scanning Daily QR</p>
                                    </div>
                                    <button
                                        onClick={() => setShowScanner(false)}
                                        className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* SCANNER VIEWPORT */}
                                <div className="flex-1 relative flex items-center justify-center">
                                    <div id="qr-reader" className="w-full h-full" />

                                    {/* SCANNER OVERLAY */}
                                    <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
                                        <div className="w-[280px] h-[280px] border-2 border-indigo-400 rounded-3xl relative">
                                            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-indigo-500 rounded-tl-3xl" />
                                            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-indigo-500 rounded-tr-3xl" />
                                            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-indigo-500 rounded-bl-3xl" />
                                            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-indigo-500 rounded-br-3xl" />

                                            {/* SCANNING LINE ANIMATION */}
                                            <motion.div
                                                animate={{ top: ['10%', '90%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute left-4 right-4 h-1 bg-indigo-500/50 blur-sm shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20"
                                            />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-32 left-0 right-0 text-center px-10">
                                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                            <Navigation2 size={14} className="text-indigo-400 fill-indigo-400" />
                                            <span className="text-white/80 text-[10px] font-black uppercase tracking-wider">Location Verified</span>
                                        </div>
                                        <p className="mt-4 text-white/40 text-[11px] font-bold leading-relaxed">
                                            Align the Attendance QR Code within the frame to automatically log your shift.
                                        </p>
                                    </div>
                                </div>
                                <ScannerLogic onScanSuccess={onScanSuccess} active={showScanner} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreateBarberCardScreen;
