import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Scissors,
    CheckCircle,
    Loader2,
    User,
    Clock,
    Check,
    ChevronRight,
    Phone,
    ShieldCheck,
} from 'lucide-react';
import LocationError from './LocationError.jsx';

// Environment variable handling for CRA
const API_URL = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

const CheckInPage = () => {
    const { shopId } = useParams();

    // -- State --
    const [step, setStep] = useState('loading'); // loading, location, form, submitting, success
    const [shop, setShop] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', serviceIds: [], selectedBarberId: null });
    const [errorType, setErrorType] = useState(null);
    const [distance, setDistance] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [trackingId, setTrackingId] = useState(null);
    const [selectedGender, setSelectedGender] = useState('male'); // male, female, unisex
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categoryScrollRef = useRef(null);

    // -- Effects --
    useEffect(() => {
        fetchShopDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopId]);

    // Status Polling & Visibility Handling
    useEffect(() => {
        let interval;
        const checkStatus = async () => {
            if (!bookingId || (step !== 'success' && step !== 'confirmed')) return;
            try {
                const res = await fetch(`${API_URL}/api/offlinetools/booking-status/${bookingId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'confirmed' && step !== 'confirmed') {
                        setStep('confirmed');
                    } else if (data.status === 'cancelled' || data.status === 'rejected') {
                        setStep('cancelled');
                        clearInterval(interval);
                    } else if (data.status === 'completed' || data.status === 'started') {
                        clearInterval(interval);
                        setTimeout(() => { window.location.href = '/'; }, 2000);
                    }
                }
            } catch (err) { console.error("Polling error", err); }
        };

        if ((step === 'success' || step === 'confirmed') && bookingId) {
            interval = setInterval(checkStatus, 3000);
            checkStatus(); // Immediate check
        }

        const handleVisibility = () => { if (document.visibilityState === 'visible') checkStatus(); };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [step, bookingId]);

    // -- API Actions --
    const fetchShopDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/api/offlinetools/shop-details/${shopId}`);
            if (!res.ok) throw new Error('Shop not found');
            const data = await res.json();
            setShop(data);
            verifyLocation();
        } catch (err) {
            console.error(err);
            setStep('error');
        }
    };

    const verifyLocation = () => {
        setStep('location');
        setErrorType(null);
        if (!navigator.geolocation) { setErrorType('permission'); return; }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`${API_URL}/api/offlinetools/verify-location`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId, latitude, longitude })
                    });
                    const data = await res.json();
                    if (data.allowed) {
                        setStep('form');
                    } else {
                        setDistance(data.distance);
                        setErrorType(data.distance < 100 ? 'drift' : 'distance');
                    }
                } catch (err) {
                    console.error("Verification API Error", err);
                    setErrorType('drift');
                }
            },
            (err) => { setErrorType('permission'); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.serviceIds.length === 0) return alert("Please select at least one service.");

        setStep('submitting');
        try {
            const res = await fetch(`${API_URL}/api/offlinetools/request-join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    name: formData.name,
                    phone: formData.phone,
                    serviceIds: formData.serviceIds,
                    selectedBarberId: formData.selectedBarberId
                })
            });

            const data = await res.json();
            if (res.ok) {
                setBookingId(data.bookingId);
                setTrackingId(data.trackingId);
                setStep('success');
                trackLead();
            } else {
                alert(data.msg || "Failed to join queue");
                setStep('form');
            }
        } catch (err) {
            alert("Network error. Please try again.");
            setStep('form');
        }
    };

    const trackLead = () => {
        try {
            const ua = navigator.userAgent;
            const deviceType = /mobile/i.test(ua) ? 'Mobile' : (/iPad|tablet/i.test(ua) ? 'Tablet' : 'Desktop');
            fetch(`${API_URL}/api/qr/track-visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    salon_id: shopId,
                    device_type: deviceType,
                    customer_name: formData.name,
                    customer_phone: formData.phone
                })
            }).then(() => localStorage.setItem('qr_lead_captured', 'true'));
        } catch (qrErr) { console.error("Lead capture failed", qrErr); }
    };

    // -- Computed --
    const getCatMeta = (cat) => {
        const found = shop?.categoryMeta?.find(m => m.name === cat);
        return found ? { emoji: found.emoji, color: found.color } : { emoji: '💈', color: '#1C1C1E' };
    };

    const filteredServicesByGender = useMemo(() => {
        return (shop?.services || []).filter(service => {
            const catMeta = shop?.categoryMeta?.find(m => m.name === service.category);
            const serviceGender = catMeta?.gender?.toLowerCase() || 'unisex';
            if (selectedGender !== 'unisex' && serviceGender !== 'unisex' && serviceGender !== selectedGender) return false;

            if (!formData.selectedBarberId) return true;
            const sBarberId = typeof service.barberId === 'object' ? service.barberId.toString() : service.barberId;
            return !sBarberId || sBarberId === "" || sBarberId === formData.selectedBarberId;
        });
    }, [shop?.services, shop?.categoryMeta, selectedGender, formData.selectedBarberId]);

    const availableCategories = useMemo(() => {
        const cats = new Set();
        filteredServicesByGender.forEach(s => {
            if (s.category && s.category !== 'General') cats.add(s.category);
        });
        const sorted = Array.from(cats).sort((a, b) => {
            const order = shop?.categoryOrder || [];
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            return idxA !== -1 ? -1 : idxB !== -1 ? 1 : a.localeCompare(b);
        });
        return ['All', ...sorted];
    }, [filteredServicesByGender, shop?.categoryOrder]);

    const finalFilteredServices = useMemo(() => {
        return filteredServicesByGender.filter(s => selectedCategory === 'All' || s.category === selectedCategory);
    }, [filteredServicesByGender, selectedCategory]);

    // -- Handlers --
    const toggleService = (id) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(id)
                ? prev.serviceIds.filter(s => s !== id)
                : [...prev.serviceIds, id]
        }));
    };

    // -- Renderers --
    if (step === 'loading') return <LoadingView />;
    if (step === 'location' || errorType) return errorType ? <LocationError type={errorType} distance={distance} onRetry={verifyLocation} /> : <LoadingView status="Verifying location..." />;
    if (step === 'success') return <SuccessView trackingId={trackingId} />;
    if (step === 'confirmed') return <ConfirmedView trackingId={trackingId} />;
    if (step === 'cancelled') return <CancelledView setStep={setStep} />;

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-[#1C1C1E] selection:bg-[#22C55E]/20">
            {/* Premium Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-gradient-to-br from-[#22C55E]/10 to-transparent blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-gradient-to-tr from-purple-500/5 to-transparent blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-xl mx-auto px-5 pt-24 pb-32">
                {/* Header Section */}
                <header className="mb-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-[28px] font-black tracking-tight mb-3 bg-gradient-to-r from-[#1C1C1E] via-gray-700 to-[#1C1C1E] bg-clip-text text-transparent uppercase">
                        {shop?.name || 'Glosscut Studio'}
                    </h1>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-green-100/50 shadow-[0_4px_15px_rgba(34,197,94,0.05)]">
                        <div className="relative">
                            <ShieldCheck size={14} className="text-[#22C55E] relative z-10" />
                            <div className="absolute inset-0 bg-[#22C55E]/30 blur-md animate-pulse rounded-full" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-700/80">Verified at Studio</span>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Step 1: Customer Info */}
                    <Card wrapperClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <SectionHeader num="1" title="Your Details" />
                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={v => setFormData({ ...formData, name: v })}
                                icon={<User size={18} className="text-gray-400" />}
                            />
                            <Input
                                label="Phone Number"
                                placeholder="WhatsApp number"
                                type="tel"
                                value={formData.phone}
                                onChange={v => setFormData({ ...formData, phone: v })}
                                icon={<Phone size={18} className="text-gray-400" />}
                            />
                            <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed px-1">
                                * Your details will be saved for future GlossCut check-ins.
                            </p>
                        </div>
                    </Card>

                    {/* Step 2: Professional */}
                    <Card wrapperClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <SectionHeader num="2" title="Our Team" />
                        <div className="flex gap-4 overflow-x-auto py-5 -my-2 -mx-2 px-2 scrollbar-none snap-x snap-mandatory">
                            {/* Any Available */}
                            <BarberItem
                                name="Any Professional"
                                role="Next Available"
                                avatar={null}
                                isActive={!formData.selectedBarberId}
                                onClick={() => setFormData({ ...formData, selectedBarberId: null })}
                            />
                            {shop?.professionals?.map(pro => (
                                <BarberItem
                                    key={pro.id}
                                    name={pro.name}
                                    role={pro.role}
                                    avatar={pro.image ? (pro.image.startsWith('http') ? pro.image : `${API_URL}${pro.image}`) : null}
                                    isActive={formData.selectedBarberId === pro.id}
                                    onClick={() => setFormData({ ...formData, selectedBarberId: pro.id })}
                                />
                            ))}
                        </div>
                    </Card>

                    {/* Step 3: Services */}
                    <Card wrapperClass="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <SectionHeader num="3" title="Services" />

                        {/* Gender Switcher - Clean Pill Styling */}
                        <div className="relative flex bg-[#F3F4F6] p-1.5 rounded-[22px] mb-3 shadow-inner overflow-hidden border border-gray-200/20">
                            {/* Sliding Highlight */}
                            <div
                                className="absolute top-1.5 bottom-1.5 bg-white rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                                style={{
                                    width: 'calc(33.333% - 4px)',
                                    left: selectedGender === 'male' ? '2px' : selectedGender === 'female' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 2px)'
                                }}
                            />
                            {['male', 'female', 'unisex'].map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => { setSelectedGender(g); setSelectedCategory('All'); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 z-10 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${selectedGender === g ? 'text-[#1C1C1E]' : 'text-gray-400'}`}
                                >
                                    {g === 'male' ? '♂ Men' : g === 'female' ? '♀ Women' : '✨ Unisex'}
                                </button>
                            ))}
                        </div>

                        {/* Category Ribbon - Sync with Screenshot */}
                        <div className="relative -mx-5 mb-6">
                            <div ref={categoryScrollRef} className="flex gap-3 overflow-x-auto px-5 pb-4 scrollbar-none snap-x snap-mandatory">
                                {availableCategories.map(cat => {
                                    const meta = getCatMeta(cat);
                                    const isActive = selectedCategory === cat;
                                    const isAll = cat === 'All';

                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-full border transition-all duration-300 snap-start active:scale-95 ${isActive
                                                ? (isAll ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-black text-black shadow-md')
                                                : 'bg-white border-gray-100 text-gray-400'
                                                } text-[12px] font-black uppercase tracking-tight`}
                                        >
                                            <span className={`text-base flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale-[0.5]'}`}>
                                                {isAll ? <span className="text-yellow-400">⭐</span> : meta.emoji}
                                            </span>
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Service List */}
                        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                            {finalFilteredServices.map(service => {
                                const meta = getCatMeta(service.category);
                                const isSelected = formData.serviceIds.includes(service.id || service._id);
                                return (
                                    <ServiceCard
                                        key={service.id || service._id}
                                        service={service}
                                        isSelected={isSelected}
                                        meta={meta}
                                        onToggle={() => toggleService(service.id || service._id)}
                                    />
                                );
                            })}
                            {finalFilteredServices.length === 0 && (
                                <div className="py-16 text-center animate-in fade-in zoom-in-95">
                                    <div className="text-5xl mb-4 grayscale opacity-40">🔎</div>
                                    <p className="font-black text-gray-300 uppercase tracking-widest text-[11px]">No services in this category</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </form>
            </div>

            {/* Sticky Actions Bar */}
            <div className="fixed bottom-0 inset-x-0 p-5 lg:p-8 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Selection</span>
                        <span className="text-xl font-black">{formData.serviceIds.length} <span className="text-xs text-gray-400">ITEMS</span></span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={step === 'submitting' || formData.serviceIds.length === 0}
                        className={`flex-1 relative group overflow-hidden bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#D4AF37] text-white py-4.5 lg:py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:scale-100 shadow-[0_15px_30px_rgba(184,134,11,0.2)] hover:shadow-[0_20px_40px_rgba(184,134,11,0.3)]`}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full custom-shimmer" />

                        <div className="relative z-10 flex items-center justify-center gap-3">
                            {step === 'submitting' ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                                    <span>Syncing with Barber...</span>
                                </>
                            ) : (
                                <>
                                    <span>Request to Join Line</span>
                                    <div className="bg-white/20 p-1 rounded-lg">
                                        <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                    {/* Floating Status Badge */}
                    <div className="absolute bottom-16 right-5 sm:right-8 bg-[#1C1C1E] text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        SHOP OPEN
                    </div>
                    {/* Floating Selection Indicator for Mobile */}
                    {formData.serviceIds.length > 0 && (
                        <div className="sm:hidden absolute top-[-10px] right-8 px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-black shadow-lg animate-bounce">
                            {formData.serviceIds.length}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: #E5E7EB; 
                    border-radius: 10px; 
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .group:hover .custom-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

// -- Components --

const Card = ({ children, wrapperClass = "" }) => (
    <div className={`bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.02)] ${wrapperClass}`}>
        {children}
    </div>
);

const SectionHeader = ({ num, title }) => (
    <h3 className="flex items-center gap-4 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#1C1C1E] text-white text-[13px] font-black flex items-center justify-center shadow-lg shadow-gray-300">
            {num}
        </div>
        <span className="font-black text-xl tracking-tight uppercase text-gray-800">{title}</span>
    </h3>
);

const Input = ({ label, icon, ...props }) => (
    <div className="space-y-2 group">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1 transition-colors group-focus-within:text-[#22C55E]">
            {label}
        </label>
        <div className="relative flex items-center">
            <div className="absolute left-4 transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-[#22C55E]">
                {icon}
            </div>
            <input
                {...props}
                className="w-full bg-gray-50/80 hover:bg-white border-2 border-transparent hover:border-gray-200 focus:border-[#1C1C1E] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 font-bold text-sm outline-none transition-all shadow-inner hover:shadow-lg hover:shadow-gray-100/50"
                onChange={e => props.onChange(e.target.value)}
            />
        </div>
    </div>
);

const BarberItem = ({ name, role, avatar, isActive, onClick }) => (
    <div
        onClick={onClick}
        className={`shrink-0 w-28 h-28 snap-center rounded-[24px] p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 border-2 ${isActive
            ? 'bg-white border-black shadow-xl shadow-gray-200/50 scale-[1.02]'
            : 'bg-[#F9FAFB] border-transparent grayscale opacity-80 hover:grayscale-0 hover:bg-white hover:border-gray-100'
            }`}
    >
        <div className="relative mb-1.5 scale-[0.65]">
            <div className={`w-16 h-16 rounded-full p-1 border-2 transition-all duration-500 relative z-10 ${isActive ? 'border-none' : 'border-gray-100'}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-inner">
                    {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center">
                            <User className="text-gray-400" size={24} />
                        </div>
                    )}
                </div>
                {isActive && (
                    <div className="absolute bottom-0 right-[-2px] bg-[#22C55E] text-white p-1 rounded-full border-2 border-white shadow-lg z-20">
                        <Check size={8} strokeWidth={4} />
                    </div>
                )}
            </div>
        </div>

        <div className={`font-black text-[9px] truncate w-[90%] uppercase tracking-tighter mb-0.5 transition-colors duration-300 ${isActive ? 'text-black' : 'text-gray-800'}`}>
            {name}
        </div>
        <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            {role || 'Staff'}
        </div>
    </div>
);

const ServiceCard = ({ service, isSelected, meta, onToggle }) => (
    <div
        onClick={onToggle}
        className={`group relative flex items-center justify-between py-2 px-4 rounded-[28px] border-2 cursor-pointer transition-all duration-300 ${isSelected
            ? 'bg-white border-black shadow-[0_15px_40px_rgba(0,0,0,0.06)]'
            : 'bg-[#F9FAFB] border-transparent hover:bg-white hover:border-gray-100'
            }`}
    >
        <div className="flex items-center flex-1 min-w-0 pr-4">
            {/* Service Icon Container - Slimmer */}
            <div
                className={`w-10 h-10 rounded-[18px] flex items-center justify-center mr-3.5 transition-all duration-300 ${isSelected ? 'bg-black shadow-lg scale-105' : 'bg-white shadow-inner border border-gray-50'
                    }`}
            >
                <span className={`text-xl transition-all duration-300 ${isSelected ? 'scale-110 brightness-110' : 'grayscale-[0.4] opacity-80'}`}>
                    {meta.emoji || '✂️'}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className={`font-black text-[13px] text-[#1C1C1E] uppercase tracking-tighter mb-0.5 transition-colors duration-300 ${isSelected ? 'text-black' : 'text-gray-800'}`}>
                    {service.name}
                </h4>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-gray-400 bg-gray-100/60 px-2 py-0.5 rounded-md">
                        <Clock size={9} strokeWidth={4} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{service.time || '15'} MIN</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
            <div className={`font-black text-lg tracking-tighter transition-all duration-300 ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                ₹{service.price}
            </div>
            {/* Circular Selection Indicator - Smaller */}
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isSelected
                ? 'bg-black border-black scale-110 shadow-lg'
                : 'bg-white border-gray-200 group-hover:border-gray-300'
                }`}>
                {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50 duration-300" />
                )}
            </div>
        </div>
    </div>
);

// -- View Subcomponents --

const LoadingView = ({ status = "Fetching shop details..." }) => (
    <div className="min-h-screen relative flex items-center justify-center bg-[#FDFDFD]">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-[#22C55E] animate-spin" />
                <Scissors className="absolute inset-0 m-auto text-[#1C1C1E]" size={28} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">{status}</span>
        </div>
    </div>
);

const SuccessView = ({ trackingId }) => (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <CheckCircle size={48} className="text-green-500 relative z-10" />
                <div className="absolute inset-0 bg-green-200 blur-xl opacity-40 animate-pulse" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 text-[#1C1C1E]">REQUEST SENT</h2>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed">The barber is reviewing your request. We'll update you as soon as you're in line.</p>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-2xl shadow-gray-200/50">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Live Status Tracking</div>
                <div className="flex flex-col items-center gap-4">
                    <div className="text-4xl font-black tracking-widest text-[#1C1C1E] bg-gray-50 px-8 py-5 rounded-3xl border-2 border-dashed border-gray-200 w-full mb-2">
                        #{trackingId}
                    </div>
                    <a
                        href={`/track-queue/${trackingId}`}
                        className="w-full bg-[#1C1C1E] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-gray-300 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all"
                    >
                        Track Position <ChevronRight size={16} />
                    </a>
                    <button onClick={() => window.location.reload()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 hover:text-[#1C1C1E] transition-colors">Start New Check-in</button>
                </div>
            </div>
        </div>
    </div>
);

const ConfirmedView = ({ trackingId }) => (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <Scissors size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 text-white">YOU'RE IN LINE!</h2>
            <p className="text-gray-400 font-medium mb-12 leading-relaxed">Your professional is ready to see you. Please wait in the lounge or stay nearby.</p>

            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[40px] p-10">
                <div className="text-[10px] font-black tracking-[0.3em] text-[#22C55E] uppercase mb-3">Priority Ticket</div>
                <div className="text-5xl font-black text-white tracking-widest mb-10">#{trackingId}</div>
                <a
                    href={`/track-queue/${trackingId}`}
                    className="block w-full bg-white text-[#1C1C1E] font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                >
                    View Queue Position
                </a>
            </div>
        </div>
    </div>
);

const CancelledView = ({ setStep }) => (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={36} />
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Request Declined</h2>
            <p className="text-gray-500 mb-8">The professional is unable to take new bookings at this moment.</p>
            <button
                onClick={() => setStep('form')}
                className="bg-gray-100 text-[#1C1C1E] font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
                Try Different Barber
            </button>
        </div>
    </div>
);

export default CheckInPage;
