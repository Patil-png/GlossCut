import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Clock, Plus, Trash, User, Star, MapPin, CheckCircle,
    Zap, Camera, Sparkles, Scissors, ArrowRight, X, DollarSign,
    GripVertical, AlertCircle, RefreshCw, ChevronRight, Check, Scan, Navigation2, Lock
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Optional if not using global theme context
import api from '../utils/api';

const CategoryReorderItem = React.memo(({ tab, meta }) => {
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
});

const TopToast = React.memo(({ visible, message, type, onHide }) => {
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
});

const BarberCardPreview = React.memo(({ barberData }) => {
    const isAvailable = barberData.isAvailable !== false;
    const coverImage = barberData.image?.uri;

    return (
        <div className="bg-white rounded-[24px] mb-4 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.06)] relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
            {/* Image Area */}
            <div className="h-[225px] relative rounded-t-[24px] overflow-hidden bg-slate-100">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt="Barber Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
                        <User size={40} className="text-slate-350" />
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">No Cover Image</span>
                    </div>
                )}
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />

                {/* Top-Right: Status Badge */}
                <div className="absolute top-3 right-3 z-20">
                    <div className={`flex flex-row items-center px-[10px] py-[6px] rounded-[20px] border shadow-sm ${isAvailable ? 'bg-[#FFF] border-[#F1F5F9]' : 'bg-[#000] border-transparent'}`}>
                        {/* Pulse Dot */}
                        <div className="w-2 h-2 mr-1.5 flex items-center justify-center relative">
                            {isAvailable && (
                                <div className="absolute w-2 h-2 rounded-full bg-[#10B981] animate-ping opacity-35" />
                            )}
                            <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                        </div>
                        <span className={`text-[10px] font-[800] uppercase tracking-[0.5px] ${isAvailable ? 'text-black' : 'text-white'}`}>
                            {isAvailable ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Top-Left: Category Badge */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-[6px] items-start">
                    <div className="bg-[#0F172A] border border-white/10 px-[10px] py-[5px] rounded-[6px] self-start">
                        <span className="text-[9px] font-[900] text-white tracking-[1.2px] uppercase">
                            BARBER
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[19px] font-[800] tracking-[-0.5px] text-slate-900 flex-1 mr-2.5 truncate uppercase">
                        {barberData.name || "Your Name Here"}
                    </h3>
                    <div className="flex items-center bg-slate-100 px-2 py-1 rounded-[8px] gap-1 ml-2">
                        <Star size={12} className="text-yellow-500 fill-[#F59E0B]" />
                        <span className="text-xs font-[800] text-slate-800 ml-1">
                            {barberData.rating > 0 ? barberData.rating.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-1 text-slate-500 mb-3">
                    <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[13px] text-slate-500 ml-[6px] flex-1 leading-[18px] truncate">
                        {barberData.address || "Shop Address, City"}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-slate-100 my-3" />

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-[700] text-slate-600">{barberData.avgAppointmentTime || "30 min"}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-350" />
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Scissors size={14} className="text-slate-400" />
                        <span className="text-xs font-[700] text-slate-600">{barberData.totalServices || 0} Services</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

const DetailRow = React.memo(({ icon: Icon, label, value, onClick, canEdit = true, isLast = false }) => {
    let gradient = "from-indigo-500 to-indigo-650";
    let textLight = "text-indigo-600";
    let bgLight = "bg-indigo-50/50";
    let glowColor = "rgba(99, 102, 241, 0.08)";

    const lowerLabel = (label || '').toLowerCase();
    if (lowerLabel.includes('name')) {
        gradient = "from-amber-400 via-amber-500 to-orange-500";
        textLight = "text-amber-600";
        bgLight = "bg-amber-50/50";
        glowColor = "rgba(245, 158, 11, 0.08)";
    } else if (lowerLabel.includes('image')) {
        gradient = "from-rose-500 to-pink-500";
        textLight = "text-rose-600";
        bgLight = "bg-rose-50/50";
        glowColor = "rgba(244, 63, 94, 0.08)";
    } else if (lowerLabel.includes('duration') || lowerLabel.includes('time')) {
        gradient = "from-violet-500 to-purple-650";
        textLight = "text-violet-600";
        bgLight = "bg-violet-50/50";
        glowColor = "rgba(139, 92, 246, 0.08)";
    } else if (lowerLabel.includes('limit')) {
        gradient = "from-teal-500 to-emerald-600";
        textLight = "text-teal-600";
        bgLight = "bg-teal-50/50";
        glowColor = "rgba(20, 184, 166, 0.08)";
    }

    return (
        <div 
            onClick={canEdit ? onClick : undefined}
            className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-slate-100' : ''} ${canEdit ? 'cursor-pointer hover:bg-slate-50/40' : 'opacity-85'} transition-all duration-200 px-3 first:rounded-t-[28px] last:rounded-b-[28px] group relative overflow-hidden`}
        >
            {canEdit && (
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            )}
            
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                <div 
                    className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white shadow-md`}
                    style={{ boxShadow: `0 3px 10px ${glowColor}` }}
                >
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</div>
                    <div className="text-[13px] font-extrabold text-slate-800 truncate leading-tight">{value || "Not Configured"}</div>
                </div>
            </div>
            {canEdit ? (
                <div className={`w-7 h-7 rounded-lg ${bgLight} flex items-center justify-center transition-colors group-hover:bg-opacity-100 flex-shrink-0`}>
                    <ChevronRight size={14} strokeWidth={3} className={textLight} />
                </div>
            ) : (
                <div className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 shadow-sm flex items-center gap-1 flex-shrink-0">
                    <span className="text-[7px] font-black text-slate-500 tracking-wider uppercase">AUTO</span>
                </div>
            )}
        </div>
    );
});

const SectionHeader = React.memo(({ title, isPublicView = false, count = null }) => (
    <div className="flex items-center w-full mb-5 px-1.5">
        {/* Header Pill */}
        <div className="bg-[#F8F9FA] px-4 py-1.5 rounded-full border border-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex items-center gap-2 mr-2.5 flex-shrink-0">
            <h2 className="text-[10px] font-[900] text-[#1A1A1A] uppercase tracking-[0.1em]">{title}</h2>
            {isPublicView && (
                <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60] animate-pulse" />
                    <span className="text-[8px] font-black text-[#27AE60] uppercase tracking-wider">PUBLIC VIEW</span>
                </div>
            )}
            {count !== null && (
                <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                    {count}
                </span>
            )}
        </div>
        {/* Header Line */}
        <div className="flex-1 h-[1.5px] bg-black/[0.08] rounded-full" />
    </div>
));

const ServiceItem = React.memo(({ item, meta, onEdit, onDelete, isLocked }) => {
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
            className="bg-white flex flex-col cursor-pointer hover:bg-slate-50/40 transition-colors duration-200 relative overflow-hidden group py-3.5 px-3 first:rounded-t-[28px] last:rounded-b-[28px]"
        >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: meta.color }} />

            <div className="flex items-center justify-between flex-1 pl-2.5">
                <div className="flex items-center gap-3.5 flex-1 min-w-0 overflow-hidden">
                    {!isLocked && (
                        <div
                            className="w-6 flex items-center justify-center opacity-25 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 touch-none flex-shrink-0"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={18} className="text-slate-400" />
                        </div>
                    )}
                    <div
                        className={`flex items-center gap-3.5 flex-1 min-w-0 overflow-hidden ${isLocked ? 'pl-2' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-slate-50 border border-slate-100 text-lg flex-shrink-0 shadow-sm">
                            {meta.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-[14px] font-extrabold text-slate-800 truncate inline-flex items-center gap-2 leading-snug">
                                {item.name}
                                {item.isInherited && (
                                    <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-150">
                                        Shop Master
                                    </span>
                                )}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-slate-400">{item.time} min</span>
                                <ChevronRight size={12} strokeWidth={2.5} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 ml-2 flex-shrink-0">
                    <span className="text-[15px] font-black text-slate-800 mr-1">₹{item.price}</span>
                    {!item.isInherited && !isLocked && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                            className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100/50 shadow-sm"
                        >
                            <Trash size={14} />
                        </button>
                    )}
                    {!isLocked && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm ${item.isInherited ? 'bg-amber-50 text-amber-600 border border-amber-100/50 hover:bg-amber-100' : 'bg-indigo-50 text-[#6366F1] hover:bg-indigo-100 border border-indigo-100/50'}`}
                        >
                            {item.isInherited ? <Sparkles size={14} /> : <ChevronRight size={14} strokeWidth={2.5} />}
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
                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100/50 mt-3"
                    >
                        <div className="px-14 pb-4 pt-3">
                            <p className="text-[12px] text-slate-550 font-medium italic leading-relaxed">
                                "{item.description}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
});

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
    const [originalData, setOriginalData] = useState(null);

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

                let data = null;
                if (cardRes && cardRes.data) {
                    data = cardRes.data;
                } else if (barberCard) {
                    data = barberCard;
                }

                if (data) {
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

                    // Set baseline original data directly from database state (ignoring location.state overrides)
                    setOriginalData({
                        name: data.pendingChanges?.name || data.name || user?.name || "",
                        services: hydratedServices,
                        avgAppointmentTime: data.pendingChanges?.avgAppointmentTime || data.avgAppointmentTime,
                        maxAppointments: data.pendingChanges?.maxAppointments || data.maxAppointments || user?.maxAppointmentsPerDay || "",
                        isAvailable: data.pendingChanges?.isAvailable !== undefined ? data.pendingChanges.isAvailable : data.isAvailable,
                        image: data.pendingChanges?.image || data.image,
                        categoryOrder: data.categoryOrder || [],
                    });

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
    const handleToggleSync = useCallback(async () => {
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
    }, [isSyncEnabled, showToast]);
    const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);
    const handleSave = useCallback(async () => {
        if (!name.trim()) return showToast("Please enter your name", "error");
        if (services.length === 0) return showToast("Add at least one service", "warning");

        setLoading(true);
        try {
            const data = { name: name.trim(), isAvailable };

            // Only send services and categoryOrder if NOT locked by sync
            // Staff members under sync are not allowed to modify these.
            const isLockedBySync = !isMainOwner && isSyncEnabled;

            if (!isLockedBySync) {
                data.services = services;
                if (categoryOrder && categoryOrder.length > 0) data.categoryOrder = categoryOrder;
            }

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
    }, [name, services, isAvailable, isMainOwner, isSyncEnabled, avgAppointmentTime, maxAppointments, barberCardImage, existingCard, navigate, showToast, categoryOrder]);

    const handleImageUpload = useCallback(async (event) => {
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
    }, [showToast]);

    // --- SERVICE MODAL LOGIC ---
    const getCatMeta = useCallback((cat) => {
        if (!cat) return { color: '#64748B', emoji: '💈', gender: 'unisex' }; // Default for no category
        const found = categories.find(c => c.name === cat);
        if (found) return { color: found.color, emoji: found.emoji, gender: found.gender };
        return { color: '#64748B', emoji: '💈', gender: 'unisex' }; // Default
    }, [categories]);

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

    const showSaveButton = useMemo(() => {
        if (!existingCard) return true;
        if (!originalData) return false;

        if (name.trim() !== originalData.name.trim()) return true;
        if (isAvailable !== originalData.isAvailable) return true;

        const currentMax = maxAppointments !== null && maxAppointments !== undefined ? String(maxAppointments) : "";
        const originalMax = originalData.maxAppointments !== null && originalData.maxAppointments !== undefined ? String(originalData.maxAppointments) : "";
        if (currentMax !== originalMax) return true;

        if (barberCardImage !== originalData.image) return true;

        if (JSON.stringify(categoryOrder) !== JSON.stringify(originalData.categoryOrder)) return true;

        if (services.length !== originalData.services.length) return true;

        for (let i = 0; i < services.length; i++) {
            const s1 = services[i];
            const s2 = originalData.services[i];
            if (
                s1.serviceId !== s2.serviceId ||
                s1.name !== s2.name ||
                String(s1.price) !== String(s2.price) ||
                String(s1.time) !== String(s2.time) ||
                s1.category !== s2.category ||
                s1.description !== s2.description
            ) {
                return true;
            }
        }

        return false;
    }, [existingCard, originalData, name, isAvailable, maxAppointments, barberCardImage, categoryOrder, services]);

    const handleModalClose = useCallback(() => {
        setShowServiceModal(false);
        setEditingService(null);
        setSelectedServiceForAdding(null);
        setServicePrice('');
        setServiceTime('');
    }, []);

    const handleModalSave = useCallback(() => {
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
    }, [editingService, selectedServiceForAdding, servicePrice, serviceTime, showToast, handleModalClose]);
    const handleReorderServices = useCallback((newFilteredOrder) => {
        const newServices = [...services];
        let fIdx = 0;
        for (let i = 0; i < newServices.length; i++) {
            if (filteredServices.some(fs => fs.id === newServices[i].id)) {
                newServices[i] = newFilteredOrder[fIdx];
                fIdx++;
            }
        }
        setServices(newServices);
    }, [services, filteredServices]);

    const handleSelectMainGender = useCallback((gen) => {
        setSelectedMainGender(gen);
        setSelectedMainTab('All');
    }, []);
    const handleEditService = useCallback((item) => {
        setEditingService(item);
        setServicePrice(item.price);
        setServiceTime(item.time);
        setShowServiceModal(true);
    }, []);

    const handleDeleteService = useCallback((item) => {
        setServices(prev => prev.filter(s => s.id !== item.id));
    }, []);

    const handleStartScanning = useCallback(() => {
        if (!navigator.geolocation) return showToast("Geolocation not supported", "error");
        setShowScanner(true);
    }, []);

    const onScanSuccess = useCallback(async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.type !== 'attendance' || !data.shopId) {
                showToast("Invalid QR Code", "error");
                return;
            }

            setShowScanner(false);
            setScannerLoading(true);
            showToast("Verifying location...", "info");

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        showToast("Marking attendance...", "info");
                        const res = await api.post('/api/attendance/mark', {
                            shopId: data.shopId,
                            latitude,
                            longitude
                        });

                        if (res.data.success) {
                            showToast(res.data.msg, "success");
                        }
                    } catch (err) {
                        showToast(err.response?.data?.msg || "Failed to mark attendance", "error");
                    } finally {
                        setScannerLoading(false);
                    }
                },
                (err) => {
                    setScannerLoading(false);
                    showToast("Location access required to complete check-in", "error");
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } catch (err) {
            console.error("Scan error:", err);
            showToast("Scan Failed: Invalid Data", "error");
        }
    }, [showToast]);


    const ScannerLogic = ({ onScanSuccess, active }) => {
        const html5QrCode = useRef(null);

        useEffect(() => {
            if (active) {
                const scanner = new Html5Qrcode("qr-reader");
                html5QrCode.current = scanner;

                const config = {
                    fps: 20,
                    // Removing qrbox enables full-frame scanning, which is more reliable 
                    // and eliminates misalignment on different screen aspect ratios.
                    disableFlip: false
                };

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
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center pb-24">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative">
                <TopToast {...toast} onHide={hideToast} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                {/* HEADER */}
                <header className="sticky top-0 z-50 bg-[#F8FAFC]/85 backdrop-blur-md border-b border-slate-100 px-6 py-4 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center active:scale-95 hover:bg-slate-50 transition-all cursor-pointer text-slate-800"
                        >
                            <ArrowLeft size={18} strokeWidth={3} className="text-slate-700" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <h1 className="text-base font-[900] text-[#1C1C1E] uppercase tracking-tight leading-none">
                                {existingCard ? 'Edit Profile' : 'Create Profile'}
                            </h1>
                            <p className="text-indigo-600 text-[8px] font-black tracking-[0.2em] mt-1.5 uppercase leading-none">
                                Barber Card
                            </p>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center">
                            {existingCard ? (
                                <button
                                    onClick={handleStartScanning}
                                    className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center active:scale-95 hover:bg-slate-50 transition-all cursor-pointer text-slate-800"
                                    title="Mark Attendance"
                                >
                                    {scannerLoading ? <RefreshCw size={18} className="text-slate-700 animate-spin" /> : <Scan size={18} className="text-slate-700" />}
                                </button>
                            ) : (
                                <div className="w-10" />
                            )}
                        </div>
                    </div>
                </header>

                {/* LOCKDOWN NOTICE FOR STAFF (SERVICES ONLY) */}
                {!isMainOwner && isSyncEnabled && (
                    <div className="px-5 mt-4 relative z-20">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-amber-50 border border-amber-200 rounded-[24px] flex items-center gap-3 shadow-sm shadow-amber-100/50"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Lock size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-0.5">Centralized Service Menu</h4>
                                <p className="text-[10px] text-amber-700/70 font-bold uppercase leading-tight">
                                    Your Services are managed by the shop owner, but you can still update your profile details.
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
                        <SectionHeader title="Live Preview" isPublicView={true} />
                        <BarberCardPreview barberData={{
                            name, address: shopData?.address, image: barberCardImage ? { uri: barberCardImage } : null,
                            rating: 4.8, avgAppointmentTime, totalServices: services.length, isAvailable
                        }} />
                    </div>

                    {/* ESSENTIALS */}
                    <div className="mb-6">
                        <SectionHeader title="Essential Details" />
                        <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm p-1">
                            <DetailRow
                                icon={User}
                                label="Display Name"
                                value={name || "Set Name"}
                                onClick={() => navigate('/edit-name', { state: { currentName: name } })}
                                canEdit={true}
                                isLast={false}
                            />
                            <DetailRow
                                icon={Camera}
                                label="Cover Image"
                                value={barberCardImage ? "Image Added" : "Add Image"}
                                onClick={() => fileInputRef.current?.click()}
                                canEdit={true}
                                isLast={false}
                            />
                            <DetailRow
                                icon={Clock}
                                label="Slot Duration"
                                value={avgAppointmentTime}
                                canEdit={false}
                                isLast={false}
                            />
                            <DetailRow
                                icon={Zap}
                                label="Daily Limit"
                                value={maxAppointments && maxAppointments !== "0" ? `${maxAppointments} Slots` : "Unlimited"}
                                onClick={() => navigate('/edit-max-appointments', { state: { currentMaxAppointments: maxAppointments } })}
                                canEdit={true}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Owner-Only: Sync Services Toggle */}
                    {shopData && (shopData.owner?._id === user?.id || shopData.owner === user?.id) && (
                        <div className="mb-6 p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm overflow-hidden relative group">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                                    <div 
                                        className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-650 flex items-center justify-center flex-shrink-0 text-white shadow-md"
                                        style={{ boxShadow: `0 3px 10px rgba(99, 102, 241, 0.08)` }}
                                    >
                                        <RefreshCw size={16} className={syncLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Management Tool</p>
                                        <div className="text-[13px] font-extrabold text-slate-800 leading-tight">Sync with Staff</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleSync}
                                    disabled={syncLoading}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSyncEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSyncEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <div className="mt-4 bg-slate-50/50 p-3.5 rounded-[20px] border border-slate-100/50">
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    <Sparkles size={12} className="inline mr-1.5 text-indigo-500 fill-indigo-500/20" />
                                    When enabled, your staff members will <span className="text-indigo-600 font-bold">automatically inherit</span> all services defined in your shop master list.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mb-24">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex-1 mr-4">
                                <SectionHeader title="Service Menu" count={`${services.length} Active`} />
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                {(!isMainOwner && isSyncEnabled) ? (
                                    <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Locked</span>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowCategoryModal(true)}
                                            className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
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
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200/30">
                            {['male', 'female', 'unisex'].map(gen => (
                                <button
                                    key={gen}
                                    onClick={() => handleSelectMainGender(gen)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${selectedMainGender === gen ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-700'}`}
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
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3 px-1">
                                    <button
                                        onClick={() => setSelectedMainTab('All')}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${selectedMainTab === 'All' ? `bg-gradient-to-r from-indigo-500 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-100` : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'}`}
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
                                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${isActive ? `bg-gradient-to-r from-indigo-500 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-100` : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'}`}
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

                                {filteredServices.length === 0 ? (
                                    <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm p-8 flex flex-col items-center justify-center text-center">
                                        <Scissors size={24} className="text-slate-350 mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No services in this category</p>
                                    </div>
                                ) : (
                                    <Reorder.Group
                                        axis="y"
                                        values={filteredServices}
                                        onReorder={handleReorderServices}
                                        className="bg-white border border-slate-100 rounded-[28px] shadow-sm p-1 divide-y divide-slate-100 overflow-hidden"
                                    >
                                        <AnimatePresence mode='popLayout'>
                                            {filteredServices.map(item => (
                                                <ServiceItem
                                                    key={item.id}
                                                    item={item}
                                                    meta={getCatMeta(item.category || 'General')}
                                                    onEdit={handleEditService}
                                                    onDelete={handleDeleteService}
                                                    isLocked={!isMainOwner && isSyncEnabled}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Reorder.Group>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER - ONLY SHOW SAVE WHEN CHANGES ARE MADE */}
                <AnimatePresence>
                    {showSaveButton && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-8 flex justify-center z-40"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                                    <div id="qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:absolute [&_video]:top-0 [&_video]:left-0" />

                                    {/* CSS Override to hide library-generated white brackets/box */}
                                    <style>{`
                                        #qr-reader__scan_region { display: none !important; }
                                        #qr-reader { border: none !important; }
                                    `}</style>

                                    {/* SCANNER OVERLAY */}
                                    <div className="absolute inset-0 border-[40px] border-black/70 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.01, 1],
                                                boxShadow: [
                                                    "0 0 20px rgba(99,102,241,0.05)",
                                                    "0 0 40px rgba(99,102,241,0.15)",
                                                    "0 0 20px rgba(99,102,241,0.05)"
                                                ]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-[280px] h-[280px] border border-white/10 rounded-[40px] relative"
                                        >
                                            {/* Elite Corner Brackets - Optimized Gold */}
                                            <div className="absolute -top-1 -left-1 w-14 h-14 border-t-[5px] border-l-[5px] border-[#D4AF37] rounded-tl-[32px] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                                            <div className="absolute -top-1 -right-1 w-14 h-14 border-t-[5px] border-r-[5px] border-[#D4AF37] rounded-tr-[32px] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                                            <div className="absolute -bottom-1 -left-1 w-14 h-14 border-b-[5px] border-l-[5px] border-[#D4AF37] rounded-bl-[32px] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                                            <div className="absolute -bottom-1 -right-1 w-14 h-14 border-b-[5px] border-r-[5px] border-[#D4AF37] rounded-br-[32px] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />

                                            {/* Cinematic Scanning Laser */}
                                            <motion.div
                                                animate={{ top: ['8%', '92%'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent blur-[0.5px] shadow-[0_0_30px_#D4AF37] z-20"
                                            >
                                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-40" />
                                                <motion.div
                                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                    transition={{ duration: 0.5, repeat: Infinity }}
                                                    className="absolute -top-1 -left-1 -right-1 h-3 bg-[#D4AF37]/5 blur-md"
                                                />
                                            </motion.div>
                                        </motion.div>
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
