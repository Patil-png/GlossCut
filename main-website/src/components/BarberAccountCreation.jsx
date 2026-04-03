import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence
} from 'framer-motion';
import {
  User, MapPin, Phone, Mail, Lock, Store, Scissors,
  Eye, EyeOff, CheckCircle, AlertCircle, Sparkles,
  ArrowRight, Briefcase, Loader2, ChevronDown,
  TrendingUp, Calendar, TriangleAlert
} from 'lucide-react';

// --- CONSTANTS ---
const CATEGORIES = [
  "Men's Grooming",
  "Women's Salon",
  "Pet Care",
  "Unisex"
];

// ==========================================
// 🎨 UI COMPONENTS (Visual Engine)
// ==========================================

// --- 1. Light Premium Background (Orbs + Noise) ---
const Background = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />

      {/* Moved Global Noise here to preserve Mobile UI */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
    </div>
    <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gray-100/60" />

      {/* Top Right - Faint Green Glow (Floating) */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />

      {/* Bottom Left - Faint Green Glow (Floating Delayed) */}
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)',
        }}
      />

      {/* Center Left - Very Faint Warmth (Floating Slow) - Adds depth */}
      <div
        className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply animate-float-slow"
        style={{
          background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)', // Very light green/mint
        }}
      />

      {/* Texture Overlay (Noise) - Very Faint */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Grid Pattern Overlay for structure (Reduced Opacity for Balance) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  </div>
));

// --- 2. Custom Cursor ---
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        cursorX.set(e.clientX - 16);
        cursorY.set(e.clientY - 16);
      });
    };
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", moveCursor);
    }
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-gray-900/30 bg-gray-900/5 rounded-full pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{ translateX: cursorXSpring, translateY: cursorYSpring }}
    >
      <div className="absolute inset-0 bg-gray-900/10 rounded-full" />
    </motion.div>
  );
};

// --- 3. Light Theme Input Field (Enhanced & Fixed Alignment) ---
const InputField = ({
  label,
  icon: Icon,
  type = "text",
  value,
  field,
  onChange,
  onCursorChange,
  isPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  required = true,
  isTextArea = false,
  isSelect = false,
  options = [],
  disabled = false,
  useFloatingLabel = true, // Default to true now
  maxLength,
  prefix,
  error,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className="relative pt-1.5 group">
      <div className={`relative flex items-center bg-white border-[1.5px] rounded-xl px-4 transition-all duration-300 ${error ? 'border-red-500 bg-red-50/5' : isFocused ? 'border-[#4C763B] shadow-[0_0_20px_rgba(76,118,59,0.08)]' : 'border-gray-200'} ${isTextArea ? 'h-auto py-2' : 'h-[50px]'}`}>

        {/* Left Icon */}
        <div className={`mr-3 transition-colors duration-300 ${error ? 'text-red-500' : isFocused ? 'text-[#4C763B]' : 'text-gray-400'}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>

        <div className="flex-1 relative h-full flex items-center">
          {/* Enhanced Floating Label - Breaking Border style */}
          <motion.label
            htmlFor={field}
            initial={false}
            animate={{
              y: isFloating ? -25 : 0,
              scale: isFloating ? 0.8 : 1,
              x: isFloating ? 0 : (prefix ? 38 : 0),
              backgroundColor: isFocused || hasValue ? "#FFFFFF" : "transparent",
              color: error ? "#EF4444" : isFocused ? "#4C763B" : isFloating ? "#6b7280" : "#9ca3af"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-0 pointer-events-none text-[12px] font-bold uppercase tracking-wider origin-left px-1.5 z-10"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </motion.label>

          <div className="flex items-center w-full h-full mt-0.5">
            {prefix && (
              <span className={`text-[15px] font-medium mr-2 transition-colors duration-300 ${isFloating ? 'text-gray-900' : 'text-gray-400'}`}>
                {prefix}
              </span>
            )}

            {isTextArea ? (
              <textarea
                id={field}
                value={value}
                onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  setIsFocused(false);
                  if (onBlur) onBlur(e);
                }}
                rows={3}
                disabled={disabled}
                maxLength={maxLength}
                className="w-full bg-transparent border-none outline-none text-[15px] text-gray-900 font-medium py-2 resize-none"
              />
            ) : isSelect ? (
              <div className="relative w-full">
                <select
                  id={field}
                  value={value}
                  onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    setIsFocused(false);
                    if (onBlur) onBlur(e);
                  }}
                  disabled={disabled}
                  className="w-full bg-transparent border-none outline-none text-[15px] text-gray-900 font-medium appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-transparent"></option>
                  {options.map((opt) => (
                    <option key={opt.value || opt} value={opt.value || opt} className="text-gray-900 bg-white">
                      {opt.label || opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            ) : (
              <input
                id={field}
                type={isPasswordToggle && showPassword ? 'text' : type}
                value={value}
                onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  setIsFocused(false);
                  if (onBlur) onBlur(e);
                }}
                disabled={disabled}
                maxLength={maxLength}
                autoComplete={field === 'email' ? 'username email' : field === 'password' ? 'new-password' : 'off'}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 font-medium"
              />
            )}
          </div>
        </div>

        {/* Password Toggle */}
        {isPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="ml-2 p-2 text-gray-400 hover:text-[#4C763B] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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


// --- 5. Hero Section Left (Light Theme) ---
const HeroSection = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center w-5/12 relative z-10">
      <div className="relative w-full max-w-lg">
        {/* Floating Stat 1 - White Glass */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-8 top-12 z-30 bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-xl shadow-gray-200/50 w-56 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-[#4C763B]">
              <TrendingUp size={18} />
            </div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Revenue</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">+24.5%</div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-green-400 to-[#4C763B]"
            />
          </div>
        </motion.div>

        {/* Floating Stat 2 - White Glass */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -right-4 top-1/3 z-30 bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-xl shadow-gray-200/50 flex items-center gap-4 hover:scale-105 transition-transform"
        >
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 ring-1 ring-blue-100">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">12 Bookings</div>
            <div className="text-xs text-blue-600/80 font-medium">Scheduled Today</div>
          </div>
        </motion.div>

        {/* Main Image Card - Kept Dark for Contrast, but with softer shadow */}
        <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/50 aspect-[4/5] bg-gray-100 group">
          <img
            src="/Page1.png"
            alt="Barber Shop"
            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[2s]"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />

          {/* Text Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-sm"
            >
              <Sparkles size={12} /> System 2.0
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-3">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Craft & Business.</span>
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm font-medium">
              The operating system designed for high-performance barbering. Automate bookings, secure payments, and scale effortlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 MAIN LOGIC COMPONENT (Func Logic Preserved)
// ==========================================
const BarberAccountCreation = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '',
    shopName: '', shopAddress: '', shopPhone: '', category: "Men's Grooming"
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Shop selection state - Default to New Shop initialization logic
  const [selectedShopId, setSelectedShopId] = useState('new');
  const [isNewShop, setIsNewShop] = useState(true);


  // --- HANDLERS ---
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleInputChange = (field, value) => {
    if (field === 'phone' || field === 'shopPhone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: null }));
  };

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/check-exists?${query}`);

      if (response.data.exists) {
        setFormErrors(prev => ({ ...prev, [field]: response.data.msg }));
      } else {
        setFormErrors(prev => ({ ...prev, [field]: null }));
      }
    } catch (err) {
      console.error('Error checking existence:', err);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for real-time validation errors
    const hasActiveErrors = Object.values(formErrors).some(err => err !== null);
    if (hasActiveErrors) {
      setMessage({ type: 'error', content: 'Please correct the red highlighted errors before continuing.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', content: '' });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', content: 'Please enter a valid email address.' });
      setLoading(false); return;
    }

    if (formData.email !== formData.email.toLowerCase()) {
      setMessage({ type: 'error', content: 'Email address must be in lowercase.' });
      setLoading(false); return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage({ type: 'error', content: 'Password must be at least 8 chars long and include uppercase, lowercase, number, and special character.' });
      setLoading(false); return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      setMessage({ type: 'error', content: 'Please fill in all personal details.' });
      setLoading(false); return;
    }

    // Phone validation - allow 10 digits or +91 followed by 10 digits
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage({ type: 'error', content: 'Please enter a valid phone number (10 digits starting with 6-9, or +91 followed by 10 digits).' });
      setLoading(false);
      return;
    }

    if (isNewShop && (!formData.shopName || !formData.shopAddress || !formData.shopPhone)) {
      setMessage({ type: 'error', content: 'Please fill in all shop details.' });
      setLoading(false); return;
    }

    // Shop Phone validation if new shop
    if (isNewShop && !phoneRegex.test(formData.shopPhone)) {
      setMessage({ type: 'error', content: 'Please enter a valid shop phone number (10 digits starting with 6-9, or +91 followed by 10 digits).' });
      setLoading(false);
      return;
    }
    if (!selectedShopId) {
      setMessage({ type: 'error', content: 'Please select a shop or create a new one.' });
      setLoading(false); return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/check-uniqueness`, {
        email: formData.email,
        phone: formData.phone
      });
    } catch (error) {
      if (error.response?.status === 409) {
        setMessage({ type: 'error', content: error.response.data.msg });
        setLoading(false); return;
      }
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: "barber",
        shopName: formData.shopName,
        shopAddress: formData.shopAddress,
        shopPhone: formData.shopPhone,
        category: formData.category,
        isShopOwner: isNewShop,
        selectedShopId: isNewShop ? null : selectedShopId,
      });

      setMessage({ type: 'success', content: 'Account created! Your profile is hidden until Admin approval.' });
      setFormData({ name: '', phone: '', email: '', password: '', shopName: '', shopAddress: '', shopPhone: '', category: "Men's Grooming" });
      setIsNewShop(true);
      setSelectedShopId('new');

    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Something went wrong.';
      setMessage({ type: 'error', content: msg });
    } finally {
      setLoading(false);
    }
  };


  // --- RENDER ---
  return (
    <div className="min-h-screen w-full bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] overflow-hidden relative">
      <CustomCursor />
      <Background />

      <div className="container mx-auto min-h-screen flex items-center justify-center relative z-10 p-4 mt-20">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

          {/* Left Side: Parallax Hero */}
          <HeroSection />

          {/* Right Side: Glass Form */}
          <div className="w-full lg:w-3/5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              {/* Outer Glow Border */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-[2rem] opacity-50 blur-sm group-hover:opacity-100 transition duration-500" />

              {/* The Glass Card */}
              <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[1.9rem] p-6 md:p-10 shadow-2xl shadow-gray-200/50">

                {/* Header - Restored */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-left">Owner Registration</h2>
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-200">
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium text-left">Join the network and configure your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-6">
                    {/* Business Details Section - Aligned to Customer UI */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
                        <Briefcase size={20} className="text-[#4C763B]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Business Details</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Initialize your establishment profile.</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <InputField label="Shop name" icon={Store} field="shopName" value={formData.shopName} onChange={handleInputChange} required={isNewShop} maxLength={50} />
                      <InputField label="Shop address" icon={MapPin} field="shopAddress" value={formData.shopAddress} onChange={handleInputChange} required={isNewShop} maxLength={200} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <InputField
                          label="Business Phone"
                          icon={Phone}
                          field="shopPhone"
                          value={formData.shopPhone}
                          onChange={handleInputChange}
                          required={isNewShop}
                          maxLength={10}
                          prefix="+91"
                          onBlur={() => handleCheckExists('shopPhone', formData.shopPhone)}
                          error={formErrors.shopPhone}
                        />
                        <InputField label="Category" icon={Scissors} field="category" value={formData.category} onChange={handleInputChange} isSelect options={CATEGORIES} useFloatingLabel required={isNewShop} />
                      </div>
                    </div>

                    {/* Owner Info Section - Aligned to Customer UI */}
                    <div className="flex items-center gap-3 mt-20 mb-6 pb-4 border-b border-gray-100">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
                        <User size={20} className="text-[#4C763B]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Owner Information</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Personal credentials for your account.</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <InputField label="Owner name" icon={User} field="name" value={formData.name} onChange={handleInputChange} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <InputField
                          label="Owner Number"
                          icon={Phone}
                          type="tel"
                          field="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength={10}
                          prefix="+91"
                          onBlur={() => handleCheckExists('phone', formData.phone)}
                          error={formErrors.phone}
                        />
                        <InputField
                          label="Email Address"
                          icon={Mail}
                          type="email"
                          field="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={() => handleCheckExists('email', formData.email)}
                          error={formErrors.email}
                        />
                      </div>
                      <InputField label="Secure Password" icon={Lock} type="password" field="password" value={formData.password} onChange={handleInputChange} isPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                    </div>
                  </div>

                  {/* Status Messages */}
                  <AnimatePresence>
                    {message.content && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
                      >
                        <div className="mt-0.5">{message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}</div>
                        <div className="font-bold">{message.content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl h-14 mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200 hover:shadow-xl hover:shadow-gray-300 transition-shadow duration-300 bg-gray-900"
                  >
                    <div className="absolute inset-0 bg-gray-900" />
                    {/* Subtle shine effect */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-white/10 group-hover:animate-shine" />

                    <div className="relative flex items-center justify-center gap-3 text-white font-bold tracking-wide uppercase text-sm">
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          Launch System
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>

                  <div className="text-center mt-6">
                    <p className="text-gray-500 text-xs font-medium">
                      Already initialized? <a href="/login" className="text-[#4C763B] hover:text-green-700 font-bold transition-colors">Access Dashboard</a>
                    </p>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BarberAccountCreation;
