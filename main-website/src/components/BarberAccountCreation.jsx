import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Phone, Mail, Lock, Store, Scissors, 
  Eye, EyeOff, CheckCircle, AlertCircle, Sparkles, 
  ArrowRight, TrendingUp, Calendar, ShieldCheck
} from 'lucide-react';

// --- CONSTANTS ---
const CATEGORIES = [
  "Men's Grooming",
  "Women's Salon", 
  "Pet Care",
  "Unisex"
];

// --- HELPER COMPONENT (Moved Outside to fix focus issue) ---
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
  options = []
}) => (
  <div className="relative group mb-4 md:mb-6">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
      <Icon className="w-5 h-5 text-gray-500 group-focus-within:text-[#1F6FEB] transition-colors duration-300" />
    </div>
    
    {isTextArea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onMouseEnter={() => onCursorChange("hover")}
        onMouseLeave={() => onCursorChange("default")}
        className="block w-full pl-12 pr-4 py-3 md:py-4 bg-[#0B1220]/50 border border-gray-700/50 rounded-xl text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]/50 focus:border-[#1F6FEB] transition-all duration-300 backdrop-blur-sm resize-none shadow-inner"
        placeholder={label}
        rows={3}
        required={required}
      />
    ) : isSelect ? (
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onMouseEnter={() => onCursorChange("hover")}
        onMouseLeave={() => onCursorChange("default")}
        className="block w-full pl-12 pr-10 py-3 md:py-4 bg-[#0B1220]/50 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]/50 focus:border-[#1F6FEB] transition-all duration-300 backdrop-blur-sm shadow-inner appearance-none cursor-pointer"
        required={required}
      >
        {options.map((cat) => (
          <option key={cat} value={cat} className="bg-[#0B1220] text-gray-100">{cat}</option>
        ))}
      </select>
    ) : (
      <input
        type={isPasswordToggle && showPassword ? 'text' : type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onMouseEnter={() => onCursorChange("hover")}
        onMouseLeave={() => onCursorChange("default")}
        className="block w-full pl-12 pr-12 py-3 md:py-4 bg-[#0B1220]/50 border border-gray-700/50 rounded-xl text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]/50 focus:border-[#1F6FEB] transition-all duration-300 backdrop-blur-sm shadow-inner"
        placeholder={label}
        required={required}
      />
    )}
    
    <label className={`absolute left-12 transition-all duration-300 pointer-events-none ${value ? '-top-2.5 text-xs text-[#1F6FEB] bg-[#0f172a] px-2 rounded' : 'top-4 text-gray-500'}`}>
      {label}
    </label>

    {isPasswordToggle && onTogglePassword && (
      <button
        type="button"
        onClick={onTogglePassword}
        onMouseEnter={() => onCursorChange("hover")}
        onMouseLeave={() => onCursorChange("default")}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#1F6FEB] transition-colors cursor-pointer z-10"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    )}
    
    {isSelect && (
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
        <ArrowRight className="w-4 h-4 rotate-90" />
      </div>
    )}
    
    {/* Animated Bottom Glow */}
    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#1F6FEB] to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
  </div>
);

const BarberAccountCreation = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    category: "Men's Grooming"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // NOTE: Ensure your backend endpoint is correct
      // const response = await axios.post('/api/auth/register', { ...formData, role: 'barber' });
      
      // Simulating network request for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ 
        type: 'success', 
        content: 'Account created successfully! You can now log in to your barber dashboard.' 
      });
      
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
        shopName: '',
        shopAddress: '',
        shopPhone: '',
        category: "Men's Grooming"
      });
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error?.response?.data?.msg || 'Account creation failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- NEW UI ANIMATION LOGIC ---
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState("default");

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", mouseMove);
    return () => window.removeEventListener("mousemove", mouseMove);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const cursorVariants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      backgroundColor: "transparent",
      border: "2px solid #1F6FEB",
      height: 32,
      width: 32,
      transition: { type: "spring", mass: 0.6 }
    },
    hover: {
      x: mousePosition.x - 40,
      y: mousePosition.y - 40,
      backgroundColor: "rgba(31, 111, 235, 0.1)",
      border: "1px solid #FFB703",
      height: 80,
      width: 80,
      transition: { type: "spring", mass: 0.6 }
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#050505]  text-white font-sans overflow-hidden relative selection:bg-[#1F6FEB] selection:text-white"
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>

      {/* --- Custom Cursor --- */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[100] hidden md:block backdrop-invert"
        variants={cursorVariants}
        animate={cursorVariant}
      />
      
      {/* --- Animated Background Universe --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#1F6FEB]/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#FFB703]/10 rounded-full blur-[140px]"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 mt-24 md:p-8">
        <motion.div
          style={{ rotateX, rotateY, z: 100 }}
          className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-start perspective-1000"
        >
          {/* --- Left Column: Hero Hologram --- */}
          <div className="hidden lg:block space-y-10 pointer-events-none pt-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[#FFB703] text-sm font-bold tracking-widest uppercase mb-8 backdrop-blur-xl shadow-lg shadow-[#FFB703]/10">
                <Sparkles size={16} />
                <span className='text-[10px]'>Join The Elite</span>
              </div>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-600 drop-shadow-2xl">
                Redefine <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6]">Grooming.</span>
              </h1>
              <p className="text-[17px] text-gray-400 max-w-lg leading-relaxed border-l-2 border-[#1F6FEB] pl-6">
                Step into the future of salon management. Seamless bookings, automated growth, and a premium interface designed for visionaries.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Daily Revenue", val: "+45%", icon: TrendingUp, color: "#1F6FEB" },
                { label: "Bookings", val: "Infinite", icon: Calendar, color: "#FFB703" },
                { label: "Security", val: "Bank Grade", icon: ShieldCheck, color: "#10B981" }
              ].slice(0, 2).map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md hover:bg-white/5 transition-colors"
                >
                  <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                  <div className="text-2xl font-bold text-white mb-1">{stat.val}</div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* --- Right Column: The Glass Form Portal --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#1F6FEB] via-[#FFB703] to-[#1F6FEB] rounded-[2.5rem] blur opacity-40 animate-pulse"></div>
            
            <div className="relative bg-[#000000]/80 backdrop-blur-3xl border border-white/10 rounded-[2.3rem] shadow-2xl p-4 md:p-6 lg:p-12 overflow-hidden">
              <div className="mb-6 md:mb-8 text-center lg:text-left border-b border-gray-800 pb-6 md:pb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Initialize Profile</h2>
                <p className="text-gray-400 text-sm md:text-base">Complete the matrix to launch your digital shop.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-extrabold text-[#1F6FEB] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[2px] bg-[#1F6FEB]"></span> Identity Protocol
                  </h3>
                  <div className="grid md:grid-cols-2 gap-2 md:gap-4">
                    <InputField 
                      label="Full Name" 
                      icon={User} 
                      field="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      onCursorChange={setCursorVariant} 
                    />
                    <InputField 
                      label="Phone" 
                      icon={Phone} 
                      type="tel" 
                      field="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      onCursorChange={setCursorVariant} 
                    />
                  </div>
                  <InputField 
                    label="Email" 
                    icon={Mail} 
                    type="email" 
                    field="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    onCursorChange={setCursorVariant} 
                  />
                  <InputField 
                    label="Password" 
                    icon={Lock} 
                    type="password" 
                    field="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    onCursorChange={setCursorVariant} 
                    isPasswordToggle 
                    showPassword={showPassword} 
                    onTogglePassword={() => setShowPassword(!showPassword)} 
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <h3 className="text-[10px] font-extrabold text-[#FFB703] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[2px] bg-[#FFB703]"></span> Operation Details
                  </h3>
                  <InputField 
                    label="Shop Name" 
                    icon={Store} 
                    field="shopName" 
                    value={formData.shopName} 
                    onChange={handleInputChange} 
                    onCursorChange={setCursorVariant} 
                  />
                  <InputField 
                    label="Shop Address" 
                    icon={MapPin} 
                    field="shopAddress" 
                    value={formData.shopAddress} 
                    onChange={handleInputChange} 
                    onCursorChange={setCursorVariant} 
                    isTextArea 
                  />
                  <div className="grid md:grid-cols-2 gap-2 md:gap-4">
                    <InputField 
                      label="Shop Phone" 
                      icon={Phone} 
                      type="tel" 
                      field="shopPhone" 
                      value={formData.shopPhone} 
                      onChange={handleInputChange} 
                      onCursorChange={setCursorVariant} 
                    />
                    <InputField 
                      label="Category" 
                      icon={Scissors} 
                      field="category" 
                      value={formData.category} 
                      onChange={handleInputChange} 
                      onCursorChange={setCursorVariant} 
                      isSelect 
                      options={CATEGORIES} 
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {message.content && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.9 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.9 }}
                      className={`overflow-hidden rounded-xl border-l-4 ${message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {message.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                        <span className="text-sm font-semibold">{message.content}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setCursorVariant("hover")}
                  onMouseLeave={() => setCursorVariant("default")}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(31, 111, 235, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full group overflow-hidden rounded-xl p-[2px] mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1F6FEB] via-[#FFB703] to-[#1F6FEB] animate-gradient-xy"></div>
                  <div className="relative bg-[#0f172a] hover:bg-black/90 transition-colors duration-300 rounded-[10px] px-2 py-1.5 md:px-8 md:py-5 flex items-center justify-center gap-1.5 md:gap-3">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="font-bold text-white text-lg tracking-wide group-hover:tracking-wider transition-all">LAUNCH PROFILE</span>
                        <ArrowRight className="w-5 h-5 text-[#FFB703] group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>
                
                <div className="text-center pt-4">
                  <p className="text-gray-500 text-sm">
                    Already operational?{' '}
                    <a href="/login" 
                       className="text-white hover:text-[#1F6FEB] transition-colors font-semibold border-b border-transparent hover:border-[#1F6FEB]"
                       onMouseEnter={() => setCursorVariant("hover")}
                       onMouseLeave={() => setCursorVariant("default")}
                    >
                      Access Dashboard
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BarberAccountCreation;
