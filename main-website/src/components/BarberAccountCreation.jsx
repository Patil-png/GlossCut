import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  motion, 
  useMotionValue, 
  useTransform, 
  AnimatePresence 
} from 'framer-motion';
import {
  User, MapPin, Phone, Mail, Lock, Store, Scissors,
  Eye, EyeOff, CheckCircle, AlertCircle, Sparkles,
  ArrowRight, Briefcase, Info, Loader2, ChevronDown, 
  TrendingUp, Calendar,
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

// --- 1. Background Grid & Spotlight ---
const BackgroundSystem = ({ mouseX, mouseY }) => {
  const gridX = useTransform(mouseX, [0, 1], [20, -20]);
  const gridY = useTransform(mouseY, [0, 1], [20, -20]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Dark Base */}
      <div className="absolute inset-0 bg-[#030305]" />
      
      {/* Moving Grid */}
      <motion.div 
        style={{ x: gridX, y: gridY }}
        className="absolute -inset-[10%] opacity-20"
      >
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </motion.div>

      {/* Radial Gradient Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030305_90%)]" />
      
      {/* Mouse Spotlight */}
      <Spotlight mouseX={mouseX} mouseY={mouseY} />
    </div>
  );
};

const Spotlight = ({ mouseX, mouseY }) => {
  // Convert relative 0-1 cords back to pixels roughly for the effect
  const x = useTransform(mouseX, [0, 1], [0, window.innerWidth]);
  const y = useTransform(mouseY, [0, 1], [0, window.innerHeight]);
  
  return (
    <motion.div
      className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-screen"
      style={{
        background: useTransform(
          [x, y],
          ([latestX, latestY]) => `radial-gradient(600px circle at ${latestX}px ${latestY}px, rgba(56, 189, 248, 0.15), transparent 80%)`
        )
      }}
    />
  );
};

// --- 2. Input Field with Micro-Interactions ---
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
  useFloatingLabel = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="relative group">
      {/* Label for select fields (above) */}
      {isSelect && !useFloatingLabel && (
        <div className="mb-2">
          <label className={`text-sm font-medium transition-colors duration-200 ${isFocused ? 'text-blue-400' : 'text-gray-400'}`}>
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        </div>
      )}

      {/* Floating Label for select fields with useFloatingLabel or non-select fields */}
      {(!isSelect || useFloatingLabel) && (
        <motion.label
          initial={false}
          animate={{
            y: isFocused || hasValue ? -24 : 0,
            x: isFocused || hasValue ? -4 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused ? '#60A5FA' : '#94A3B8'
          }}
          className="absolute left-10 top-3.5 text-sm font-medium pointer-events-none z-20 origin-left transition-colors duration-200"
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </motion.label>
      )}

      {/* Icon */}
      <div className="absolute top-0 bottom-0 left-0 pl-3 flex items-center justify-center z-10 pointer-events-none">
        <Icon size={18} className={`transition-colors duration-300 ${isFocused ? 'text-blue-400' : 'text-gray-500'}`} />
      </div>

      {/* Inputs */}
      <div className="relative">
        {isTextArea ? (
          <textarea
            value={value}
            onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3}
            disabled={disabled}
            className={`block w-full pl-10 pr-4 py-3 bg-[#0F1115]/80 border ${isFocused ? 'border-blue-500/50' : 'border-white/10'} rounded-xl text-gray-100 focus:outline-none resize-none transition-all shadow-inner`}
          />
        ) : isSelect ? (
          <div className="relative">
            <select
              value={value}
              onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className={`block w-full pl-10 pr-10 py-3 bg-[#0F1115]/80 border ${isFocused ? 'border-blue-500/50' : 'border-white/10'} rounded-xl text-gray-100 focus:outline-none appearance-none cursor-pointer transition-all shadow-inner`}
            >
              <option value="" disabled className="bg-[#0F1115] text-gray-500">Select an option</option>
              {options.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt} className="bg-[#0F1115] text-gray-200">
                  {opt.label || opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
          </div>
        ) : (
          <input
            type={isPasswordToggle && showPassword ? 'text' : type}
            value={value}
            onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`block w-full pl-10 pr-10 py-3 bg-[#0F1115]/80 border ${isFocused ? 'border-blue-500/50' : 'border-white/10'} rounded-xl text-gray-100 focus:outline-none transition-all shadow-inner`}
          />
        )}
      </div>

      {/* Password Toggle */}
      {isPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400 transition-colors z-20"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      {/* Bottom Glow Line */}
      <div className={`absolute bottom-0 left-2 right-2 h-[1px] bg-blue-500 transition-all duration-500 ${isFocused ? 'opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'opacity-0'}`} />
    </div>
  );
};

// --- 3. Hero Section with 3D Float ---
const HeroSection = ({ mouseX, mouseY }) => {
  // Parallax calculations
  const moveX = useTransform(mouseX, [0, 1], [15, -15]);
  const moveY = useTransform(mouseY, [0, 1], [15, -15]);
  const reverseMoveX = useTransform(mouseX, [0, 1], [-10, 10]);

  // Floating animations
  const floatY1 = useTransform(mouseY, [0, 1], [-5, 5]);
  const floatY2 = useTransform(mouseY, [0, 1], [5, -5]);
  const rotate1 = useTransform(mouseX, [0, 1], [-2, 2]);
  const rotate2 = useTransform(mouseX, [0, 1], [2, -2]);

  return (
    <div className="hidden lg:flex flex-col justify-center w-5/12 relative z-10 perspective-1000">
      <motion.div 
        style={{ x: moveX, y: moveY, rotateX: useTransform(mouseY, [0,1], [2, -2]), rotateY: useTransform(mouseX, [0,1], [-2, 2]) }}
        className="relative w-full max-w-lg preserve-3d"
      >
        {/* Floating Stat 1 */}
        <motion.div
          style={{
            x: reverseMoveX,
            y: floatY1,
            rotate: rotate1
          }}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -left-8 top-12 z-30 bg-[#0F1115]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-56 hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
              <TrendingUp size={18} />
            </div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Revenue</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">+24.5%</div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
             <motion.div
               initial={{ width: 0 }}
               animate={{ width: "75%" }}
               transition={{ duration: 1.5, delay: 0.5 }}
               className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
             />
          </div>
        </motion.div>

        {/* Floating Stat 2 */}
        <motion.div
           style={{
             x: reverseMoveX,
             y: floatY2,
             rotate: rotate2
           }}
           animate={{
             y: [0, 8, 0],
           }}
           transition={{
             duration: 8,
             repeat: Infinity,
             ease: "easeInOut",
             delay: 1
           }}
           className="absolute -right-4 bottom-24 z-30 bg-[#0F1115]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform"
        >
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400 ring-1 ring-blue-500/30">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">12 Bookings</div>
            <div className="text-xs text-blue-300/80">Scheduled Today</div>
          </div>
        </motion.div>

        {/* Main Image Card */}
        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] aspect-[4/5] bg-gray-900 group">
          <img 
            src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop" 
            alt="Barber Shop" 
            className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[2s]"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
          
          {/* Text Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-4"
             >
                <Sparkles size={12} /> System 2.0
             </motion.div>
             <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-3">
               Master Your <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Craft & Business.</span>
             </h1>
             <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
               The operating system designed for high-performance barbering. Automate bookings, secure payments, and scale effortlessly.
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 🚀 MAIN LOGIC COMPONENT
// ==========================================
const BarberAccountCreation = () => {
  // --- STATE (Functional Logic Preserved) ---
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '',
    shopName: '', shopAddress: '', shopPhone: '', category: "Men's Grooming"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Shop selection state
  const [existingShops, setExistingShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [isNewShop, setIsNewShop] = useState(false);

  // --- MOUSE TRACKING FOR PARALLAX ---
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth);
    mouseY.set(clientY / innerHeight);
  };

  // --- HANDLERS ---
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleShopSelection = (shopId) => {
    if (shopId === "new") {
      setIsNewShop(true);
      setSelectedShopId("new");
      setFormData(prev => ({
        ...prev, shopName: '', shopAddress: '', shopPhone: '', category: "Men's Grooming"
      }));
    } else {
      setIsNewShop(false);
      setSelectedShopId(shopId);
      const selectedShop = existingShops.find((shop) => shop._id === shopId);
      if (selectedShop) {
        setFormData(prev => ({
          ...prev,
          shopName: selectedShop.name || '',
          shopAddress: selectedShop.address || '',
          shopPhone: selectedShop.phone || '',
          category: selectedShop.category || "Men's Grooming"
        }));
      }
    }
  };

  // Shop options
  const shopOptions = useMemo(() => {
    const list = existingShops.map((shop) => ({
      label: shop.name,
      value: shop._id,
    }));
    list.push({ label: "+ Initialize New Shop", value: "new" });
    return list;
  }, [existingShops]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', content: 'Please enter a valid email address.' });
      setLoading(false); return;
    }

    // Check if email is in lowercase
    if (formData.email !== formData.email.toLowerCase()) {
      setMessage({ type: 'error', content: 'Email address must be in lowercase.' });
      setLoading(false); return;
    }

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setMessage({ type: 'error', content: 'Please fill in all personal details.' });
      setLoading(false); return;
    }
    if (isNewShop && (!formData.shopName || !formData.shopAddress || !formData.shopPhone)) {
      setMessage({ type: 'error', content: 'Please fill in all shop details.' });
      setLoading(false); return;
    }
    if (!selectedShopId) {
      setMessage({ type: 'error', content: 'Please select a shop or create a new one.' });
      setLoading(false); return;
    }

    // Check uniqueness
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
        approvalStatus: "pending",
      });

      setMessage({ type: 'success', content: 'Account created successfully! You can now log in.' });
      setFormData({ name: '', phone: '', email: '', password: '', shopName: '', shopAddress: '', shopPhone: '', category: "Men's Grooming" });
      setSelectedShopId('');
      setIsNewShop(false);

    } catch (error) {
      const msg = error.response?.data?.msg || error.message || 'Something went wrong.';
      setMessage({ type: 'error', content: msg });
    } finally {
      setLoading(false);
    }
  };

  // Fetch shops
  useEffect(() => {
    const fetchExistingShops = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
        setExistingShops(response.data || []);
      } catch (error) {
        console.log("Error fetching shops:", error);
      }
    };
    fetchExistingShops();
  }, []);

  // --- RENDER ---
  return (
    <div 
      className="min-h-screen w-full bg-[#030305] text-gray-100 font-sans selection:bg-blue-500/30 overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      <style>{`
        @keyframes shine {
          100% { left: 125%; }
        }
        .animate-shine { animation: shine 1s; }
      `}</style>

      {/* 1. Background System */}
      <BackgroundSystem mouseX={mouseX} mouseY={mouseY} />

      {/* 2. Main Container */}
      <div className="container mx-auto min-h-screen flex items-center justify-center relative z-10 p-4 mt-20">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          {/* Left Side: Parallax Hero */}
          <HeroSection mouseX={mouseX} mouseY={mouseY} />

          {/* Right Side: Glass Form */}
          <div className="w-full lg:w-3/5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              {/* Outer Glow Border */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-blue-500/30 rounded-[2rem] opacity-50 blur-sm group-hover:opacity-100 transition duration-500" />
              
              {/* The Glass Card */}
              <div className="relative bg-[#0A0C10]/80 backdrop-blur-2xl border border-white/5 rounded-[1.9rem] p-6 md:p-10 shadow-2xl">
                
                {/* Header */}
                <div className="mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Initialize Profile</h2>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Join the network and configure your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Identity Section */}
                  <InputField label="Full Name" icon={User} field="name" value={formData.name} onChange={handleInputChange} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Phone" icon={Phone} type="tel" field="phone" value={formData.phone} onChange={handleInputChange} />
                    <InputField label="Email" icon={Mail} type="email" field="email" value={formData.email} onChange={handleInputChange} />
                  </div>

                  <InputField label="Password" icon={Lock} type="password" field="password" value={formData.password} onChange={handleInputChange} isPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                  {/* Workspace Selection */}
                  <InputField
                     label="Select Workspace"
                     icon={Briefcase}
                     field="shopId"
                     value={selectedShopId}
                     onChange={(f, val) => handleShopSelection(val)}
                     isSelect
                     options={shopOptions}
                   />

                  {/* Conditional Shop Fields */}
                  <AnimatePresence>
                    {selectedShopId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4"
                      >
                         <div className={`text-xs px-4 py-3 rounded-lg border flex items-start gap-3 ${isNewShop ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : 'bg-green-500/10 border-green-500/20 text-green-200'}`}>
                            <div className="mt-0.5">{isNewShop ? <Info size={14} /> : <CheckCircle size={14} />}</div>
                            <div>
                               <span className="font-bold block mb-0.5">{isNewShop ? "New Node Initialization" : "Existing Node Connection"}</span>
                               <span className="opacity-70 leading-tight">{isNewShop ? "You will be assigned as the Owner of this new shop." : "You are joining as a staff member."}</span>
                            </div>
                         </div>

                         <InputField label="Shop Name" icon={Store} field="shopName" value={formData.shopName} onChange={handleInputChange} required={isNewShop} disabled={!isNewShop} />
                         <InputField label="Shop Address" icon={MapPin} field="shopAddress" value={formData.shopAddress} onChange={handleInputChange} isTextArea required={isNewShop} disabled={!isNewShop} />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Shop Phone" icon={Phone} field="shopPhone" value={formData.shopPhone} onChange={handleInputChange} required={isNewShop} disabled={!isNewShop} />
                            <InputField label="Category" icon={Scissors} field="category" value={formData.category} onChange={handleInputChange} isSelect options={CATEGORIES} useFloatingLabel required={isNewShop} disabled={!isNewShop} />
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Status Messages */}
                  <AnimatePresence>
                    {message.content && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`p-4 rounded-xl text-sm flex items-start gap-3 shadow-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
                      >
                        <div className="mt-0.5">{message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}</div>
                        <div className="font-medium">{message.content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl h-14 mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-shadow duration-300"
                  >
                    {/* Button Backgrounds */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-white/20 group-hover:animate-shine" />
                    
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
                    <p className="text-gray-500 text-xs">
                       Already initialized? <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Access Dashboard</a>
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
