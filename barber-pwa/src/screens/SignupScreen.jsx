import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Store, MapPin, Phone, User, Mail, Lock, Eye, EyeOff, ArrowRight,
    Grid, Info, CheckCircle, Briefcase, TriangleAlert, XCircle,
    ChevronDown, PlusCircle, Scissors, Sparkles, Users, Search, X, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SHARED COMPONENTS (Reused from Login to ensure consistency) ---

const ModernAlert = ({ visible, title, message, type, onHide }) => {
    if (!visible) return null;

    const getAlertStyle = () => {
        switch (type) {
            case "error": return { bg: "bg-[#3E1010]", border: "border-[#8B2E2E]", iconColor: "text-[#EF9A9A]", Icon: XCircle };
            case "success": return { bg: "bg-[#0D2115]", border: "border-[#1B4D2E]", iconColor: "text-[#81C784]", Icon: CheckCircle };
            case "warning": return { bg: "bg-[#2E2100]", border: "border-[#6D5410]", iconColor: "text-[#FFD54F]", Icon: TriangleAlert };
            default: return { bg: "bg-[#232323]", border: "border-[#444]", iconColor: "text-[#E0E0E0]", Icon: Info };
        }
    };

    const { bg, border, iconColor, Icon } = getAlertStyle();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pt-12 px-5 pointer-events-none"
            >
                <div className={`${bg} border ${border} flex items-center w-full max-w-[400px] p-4 rounded-[20px] shadow-2xl shadow-black/30 pointer-events-auto`}>
                    <div className="mr-3.5">
                        <Icon size={22} className={iconColor} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-[15px] font-extrabold mb-0.5 tracking-wide ${iconColor} uppercase`}>{title}</h3>
                        <p className="text-[14px] text-[#DDD] font-medium leading-tight">{message}</p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

// --- CUSTOM DROPDOWN COMPONENT ---

const PremiumDropdown = ({ label, icon: Icon, value, options, onSelect, placeholder = "Select an option", isLoading = false, searchable = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => {
        if (!searchable || !searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            opt.label.toLowerCase().includes(searchLower) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(searchLower))
        );
    });

    // Sort so special items (like "New Shop") are at the bottom or handled specifically if needed. 
    // In the react-native code they just filtered. Here we just map.

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-[5px]" ref={dropdownRef}>
            <label className="text-[9px] font-black text-[#8D6E63] uppercase tracking-[1px] ml-1">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-[52px] bg-[#F9F6F0] border border-[#E0D6D1] rounded-lg px-3 flex items-center justify-between shadow-sm active:bg-[#F0EBE5] transition-colors"
                >
                    <div className="flex items-center flex-1 overflow-hidden">
                        <div className="mr-3 opacity-80 text-[#8B5A2B]">
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Icon size={18} />}
                        </div>
                        <span className={`text-[14px] font-semibold truncate ${selectedOption ? 'text-[#3E2723]' : 'text-[#A1887F]'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={18} className="text-[#A1887F]" />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-50 w-full mt-2 bg-[#FAF7F2] border border-[#E6DCCA] rounded-xl shadow-xl shadow-[#5D4037]/20 overflow-hidden max-h-[300px] flex flex-col"
                        >
                            {/* Search Header */}
                            {searchable && (
                                <div className="p-3 border-b border-[#E6DCCA] bg-white sticky top-0 z-10">
                                    <div className="relative flex items-center bg-white border border-[#D7CCC8] rounded-lg h-[40px] px-3">
                                        <Search size={16} className="text-[#8B5A2B] mr-2" />
                                        <input
                                            type="text"
                                            className="flex-1 h-full text-[14px] text-[#3E2723] font-semibold bg-transparent focus:outline-none placeholder:text-[#BCAAA4]"
                                            placeholder={`Search ${label}...`}
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                            autoFocus
                                        />
                                        {searchText && (
                                            <button onClick={() => setSearchText("")} className="text-[#5D4037]">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Options List */}
                            <div className="overflow-y-auto p-2 space-y-2 no-scrollbar flex-1">
                                {filteredOptions.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center text-[#BCAAA4]">
                                        <Store size={32} className="mb-2 text-[#D7CCC8]" />
                                        <span className="text-sm italic">No matches found</span>
                                    </div>
                                ) : (
                                    filteredOptions.map((opt) => {
                                        const isSelected = opt.value === value;
                                        const isSpecial = opt.special;
                                        const OptIcon = opt.icon || Grid;

                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    onSelect(opt.value);
                                                    setIsOpen(false);
                                                    setSearchText("");
                                                }}
                                                className={`w-full flex items-center p-3 rounded-lg border text-left transition-all ${isSelected
                                                    ? 'bg-[#FFF8E1] border-[#D4AF37]'
                                                    : isSpecial
                                                        ? 'bg-[#F1F8E9] border-[#AED581]'
                                                        : 'bg-white border-[#E6DCCA] hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 border ${isSelected
                                                    ? 'bg-[#3E2723] border-[#3E2723] text-white'
                                                    : isSpecial
                                                        ? 'bg-[#F1F8E9] border-[#AED581] text-[#33691E]'
                                                        : 'bg-[#FAF7F2] border-[#E6DCCA] text-[#8D6E63]'
                                                    }`}>
                                                    <OptIcon size={18} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className={`text-[14px] truncate ${isSelected ? 'font-bold text-[#3E2723]' : isSpecial ? 'font-bold text-[#33691E]' : 'font-bold text-[#5D4037]'
                                                        }`}>
                                                        {opt.label}
                                                    </div>
                                                    {opt.subLabel && (
                                                        <div className="text-[11px] text-[#8D6E63] italic truncate">
                                                            {opt.subLabel}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && <CheckCircle size={20} className="text-[#3E2723] ml-2 flex-shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const InputItem = ({ icon: Icon, placeholder, value, onChange, type = "text", id, onFocus, onBlur, error, prefix }) => {
    const [showPass, setShowPass] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === "password";
    const hasValue = value && value.length > 0;
    const isFloating = isFocused || hasValue;

    return (
        <div className="relative pt-2">
            <div className={`relative flex items-center h-[56px] bg-[#F9F6F0] border-[1.5px] rounded-xl px-4 transition-all duration-300 ${error ? 'border-red-500 bg-red-50/10' : isFocused ? 'border-[#D4AF37] bg-white shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-[#E0D6D1]'}`}>
                <div className={`mr-3 transition-colors duration-300 ${error ? 'text-red-500' : isFocused ? 'text-[#8B4513]' : 'text-[#8B5A2B]/60'}`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 relative h-full flex items-center">
                    <motion.label
                        htmlFor={id}
                        initial={false}
                        animate={{
                            y: isFloating ? -28 : 0,
                            scale: isFloating ? 0.85 : 1,
                            x: isFloating ? 0 : (prefix ? 38 : 0),
                            backgroundColor: isFocused ? "#FFFFFF" : isFloating ? "#F9F6F0" : "transparent",
                            color: error ? "#EF4444" : isFocused ? "#8B4513" : isFloating ? "#8D6E63" : "#BCAAA4"
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute left-0 pointer-events-none text-[13px] font-bold uppercase tracking-wider origin-left px-1.5 z-10"
                    >
                        {placeholder}
                    </motion.label>
                    
                    <div className="flex items-center w-full h-full mt-0.5">
                        {prefix && (
                            <span className={`text-[15px] font-black mr-2 transition-colors duration-300 ${isFloating ? 'text-[#3E2723]' : 'text-[#BCAAA4]'}`}>
                                {prefix}
                            </span>
                        )}
                        <input
                            id={id}
                            name={id}
                            type={isPassword ? (showPass ? "text" : "password") : type}
                            value={value}
                            onChange={onChange}
                            onFocus={(e) => {
                                setIsFocused(true);
                                if (onFocus) onFocus(e);
                            }}
                            onBlur={(e) => {
                                setIsFocused(false);
                                if (onBlur) onBlur(e);
                            }}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            autoComplete={id === 'email' ? 'username email' : id === 'password' ? 'new-password' : 'off'}
                            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#3E2723] font-bold"
                        />
                    </div>
                </div>

                {isPassword && (
                    <button type="button" onClick={() => setShowPass(!showPass)} className="ml-2 p-2 text-[#8B5A2B] hover:text-[#8B4513] transition-colors">
                        {showPass ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                    </button>
                )}
            </div>

            {/* Inline Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 mt-1 px-2"
                    >
                        <TriangleAlert size={10} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center mb-4">
        <div className="w-6 h-6 rounded-full bg-[#F5F0EB] flex items-center justify-center mr-2.5">
            <Icon size={14} className="text-[#8B4513]" />
        </div>
        <span className="text-[12px] font-extrabold text-[#5D4037] uppercase tracking-[1.5px] mr-3">{title}</span>
        <div className="flex-1 h-px bg-[#E0E0E0]"></div>
    </div>
);

const Loader2 = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// --- MAIN COMPONENT ---

const SignupScreen = () => {
    const navigate = useNavigate();

    // State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [shopName, setShopName] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopPhone, setShopPhone] = useState("");
    const [category, setCategory] = useState("");

    const [existingShops, setExistingShops] = useState([]);
    const [selectedShopId, setSelectedShopId] = useState("new");
    const [isNewShop, setIsNewShop] = useState(true);
    const [loadingShops, setLoadingShops] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" });

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    const showAlert = (title, message, type) => {
        setAlert({ visible: true, title, message, type });
        setTimeout(() => setAlert(prev => ({ ...prev, visible: false })), 4000);
    };

    // Detect if redirected from failed Google Login
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (error === 'signup_not_allowed') {
            showAlert("Account Not Found", "We couldn't find a partner account for that Google email. Please apply here to join GlossCut!", "info");
        } else if (error === 'role_not_allowed') {
            showAlert("Access Denied", "That Google account is not authorized as a barber partner. Please apply here to register.", "warning");
        }
    }, []);

    // Fetch Shops
    useEffect(() => {
        const fetchExistingShops = async () => {
            try {
                const response = await api.get('/api/shop/all');
                setExistingShops(response.data || []);
            } catch (error) {
                showAlert("Connection Issue", "Could not load shops.", "warning");
            } finally {
                setLoadingShops(false);
            }
        };
        fetchExistingShops();
    }, []);

    const handleShopSelection = (val) => {
        if (val === "new") {
            setIsNewShop(true);
            setSelectedShopId("new");
            setShopName("");
            setShopAddress("");
            setShopPhone("");
            setCategory("");
        } else {
            setIsNewShop(false);
            setSelectedShopId(val);
            const selectedShop = existingShops.find(s => s._id === val);
            if (selectedShop) {
                setShopName(selectedShop.name || "");
                setShopAddress(selectedShop.address || "");
                setShopPhone(selectedShop.phone || "");
                setCategory(selectedShop.category || "Barber");
            }
        }
    };

    const shopOptions = [
        {
            label: "Establish New Shop",
            subLabel: "Register your own business",
            value: "new",
            icon: PlusCircle,
            special: true
        },
        ...existingShops.map(shop => ({
            label: shop.name,
            subLabel: shop.address,
            value: shop._id,
            icon: Store
        })),
    ];

    const handleCheckExists = async (field, val) => {
        if (!val) return;
        
        // Real-time Format Validation
        const isFieldPhone = field === 'phone' || field === 'shopPhone';
        if (field === 'email' && !validateEmail(val)) {
            setFormErrors(prev => ({ ...prev, email: "Invalid email format" }));
            return;
        }
        if (isFieldPhone && (val.length < 10)) {
            setFormErrors(prev => ({ ...prev, [field]: "Number must be 10 digits" }));
            return;
        }

        try {
            const query = isFieldPhone ? `phone=+91${val}` : `email=${val}`;
            const response = await api.get(`/api/auth/check-exists?${query}`);
            
            if (response.data.exists) {
                // If it's a Shop Phone check, the backend returns field='shopPhone' for Shop hits
                // or field='phone' for User hits. We map both to the current field we're checking.
                setFormErrors(prev => ({ ...prev, [field]: response.data.msg }));
            } else {
                setFormErrors(prev => ({ ...prev, [field]: null }));
            }
        } catch (err) {
            console.error('Error checking existence:', err);
        }
    };

    const categoryOptions = [
        { label: "Barber", value: "Barber", icon: Scissors },
        { label: "Women's Salon", value: "Women's Salon", icon: Sparkles },
        { label: "Pet Care", value: "Pet Care", icon: CheckCircle },
        { label: "Unisex", value: "Unisex", icon: Users },
    ];

    const handleSignup = async (e) => {
        e.preventDefault();

        // Check if any real-time errors exist
        const hasErrors = Object.values(formErrors).some(err => err !== null);
        if (hasErrors) {
            showAlert("Correct Errors", "Please fix the issues highlighted in red.", "warning");
            return;
        }

        if (!name || !email || !password || !phone) {
            showAlert("Missing Fields", "Please fill in all personal details.", "warning");
            return;
        }
        if (isNewShop) {
            if (!shopName || !shopAddress || !shopPhone) {
                showAlert("Shop Details Missing", "Please fill in all shop details.", "warning");
                return;
            }
            if (!category) {
                showAlert("Category Required", "Please select a shop specialization.", "warning");
                return;
            }
        }
        if (!selectedShopId) {
            showAlert("Selection Required", "Please select a workplace.", "warning");
            return;
        }

        const sanitizedEmail = email.trim().toLowerCase();
        console.log('[DEBUG] Signup attempt details:', {
            name: name.trim(),
            email: sanitizedEmail,
            phone: phone.trim(),
            role: "barber"
        });

        try {
            await api.post('/api/auth/register', {
                name: name.trim(),
                phone: phone.trim(),
                email: sanitizedEmail,
                password,
                role: "barber",
                shopName: shopName.trim(),
                shopAddress: shopAddress.trim(),
                shopPhone: shopPhone.trim(),
                category,
                isShopOwner: isNewShop,
                selectedShopId: isNewShop ? null : selectedShopId,
            });

            showAlert("Success", "Account created successfully.", "success");
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            const msg = err.response?.data?.msg || err.message || "Something went wrong.";
            showAlert("Signup Failed", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F0EAD6] to-[#E6DCCA] flex flex-col items-center">

            {/* Background Decorations */}
            <div className="absolute top-[-150px] right-[-120px] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 pointer-events-none"></div>
            <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#5D4037]/5 pointer-events-none"></div>

            <ModernAlert {...alert} onHide={() => setAlert({ ...alert, visible: false })} />

            <div className="w-full h-full overflow-y-auto no-scrollbar py-[60px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, type: "spring", bounce: 0.3 }}
                    className="w-full max-w-[440px] mx-auto"
                >
                    {/* Header */}
                    <div className="flex flex-col items-center mb-9">
                        <div className="mb-6 shadow-xl shadow-[#5D4037]/20 rounded-[32px] p-[3px] bg-[#D4AF37]">
                            <div className="w-[84px] h-[84px] rounded-[29px] bg-[#FAF7F2] border border-[#E6DCCA] flex items-center justify-center">
                                <img src="/SetKarr.png" alt="Logo" className="w-[60px] h-[60px] object-contain" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-[10px] font-extrabold text-[#8B5A2B] tracking-[2.5px] mb-1">EXCLUSIVE ACCESS</h3>
                            <h1 className="text-[28px] font-black text-[#3E2723] tracking-[2px]">JOIN THE CLUB</h1>
                            <div className="w-[50px] h-[3px] bg-[#D4AF37] rounded-full mx-auto mt-3"></div>
                        </div>
                        <p className="text-[14px] text-[#6D4C41] text-center font-medium italic mt-3">
                            Excellence in grooming. Register your chair.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl shadow-2xl shadow-[#3E2723]/15 mb-5 border border-[#E0D6D1] overflow-hidden">
                        <div className="h-1 w-full bg-[#D4AF37]"></div>
                        <div className="p-6">

                            {/* Business Details Section */}
                            <SectionHeader icon={Briefcase} title="Business Details" />
                            <div className="space-y-[14px]">
                                <div className="flex items-center p-3 rounded-lg mb-2 gap-2.5 bg-[#FFF8E1] border border-[#FEEBC8]">
                                    <Crown size={16} className="text-[#B7791F]" />
                                    <span className="flex-1 text-[11px] text-[#975A16] font-bold">New Establishment Registration</span>
                                </div>

                                <InputItem icon={Store} placeholder="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} id="shopName" />
                                <InputItem icon={MapPin} placeholder="Shop address" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} id="shopAddress" />
                                <InputItem 
                                    icon={Phone} 
                                    placeholder="Business Phone" 
                                    value={shopPhone} 
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setShopPhone(clean);
                                        if (formErrors.shopPhone) setFormErrors(prev => ({ ...prev, shopPhone: null }));
                                    }} 
                                    onBlur={() => handleCheckExists('shopPhone', shopPhone)}
                                    error={formErrors.shopPhone}
                                    prefix="+91"
                                    id="shopPhone" 
                                />

                                <PremiumDropdown
                                    label="SPECIALIZATION"
                                    icon={Grid}
                                    value={category}
                                    options={categoryOptions}
                                    onSelect={setCategory}
                                    placeholder="Select category..."
                                />
                            </div>

                            {/* Ornamental Divider */}
                            <div className="flex items-center my-6 px-5">
                                <div className="flex-1 h-px bg-[#E0D6D1]"></div>
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45 mx-3"></div>
                                <div className="flex-1 h-px bg-[#E0D6D1]"></div>
                            </div>

                            {/* Owner Info Section */}
                            <SectionHeader icon={User} title="Owner Info" />
                            <div className="space-y-[14px]">
                                <InputItem icon={User} placeholder="Owner name" value={name} onChange={(e) => setName(e.target.value)} id="name" />
                                <InputItem 
                                    icon={Phone} 
                                    placeholder="Owner Number" 
                                    value={phone} 
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setPhone(clean);
                                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: null }));
                                    }} 
                                    onBlur={() => handleCheckExists('phone', phone)}
                                    error={formErrors.phone}
                                    prefix="+91"
                                    id="phone" 
                                />
                                <InputItem 
                                    icon={Mail} 
                                    placeholder="Email Address" 
                                    value={email} 
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: null }));
                                    }} 
                                    onBlur={() => handleCheckExists('email', email)}
                                    error={formErrors.email}
                                    id="email" 
                                />
                                <InputItem icon={Lock} placeholder="Secure Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" id="password" />
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8 h-[56px] rounded-lg shadow-lg shadow-[#3E2723]/40">
                                <button
                                    onClick={handleSignup}
                                    disabled={loading}
                                    className="w-full h-full rounded-lg bg-gradient-to-r from-[#8B4513] to-[#5D4037] p-[3px] active:scale-[0.98] transition-all"
                                >
                                    <div className="w-full h-full border-[1.5px] border-white/30 border-dashed rounded-[8px] flex items-center justify-center gap-2.5">
                                        {loading ? (
                                            <Loader2 size={24} className="animate-spin text-white" />
                                        ) : (
                                            <>
                                                <span className="text-[#F5F5F5] text-[15px] font-extrabold tracking-[2px]">SUBMIT APPLICATION</span>
                                                <ArrowRight size={20} className="text-[#F5F5F5]" strokeWidth={2.5} />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6">
                        <div className="text-[13px] font-medium text-[#8D6E63] mb-5">
                            Already a member? <button onClick={() => navigate('/login')} className="text-[#8B4513] font-black underline decoration-2 tracking-wide">SIGN IN</button>
                        </div>
                        <p className="text-[10px] text-[#A1887F] font-bold tracking-[3px] uppercase">GlossCut Inc. • Est. 2026</p>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default SignupScreen;
