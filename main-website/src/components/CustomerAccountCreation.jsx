import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useMotionValue, useTransform, AnimatePresence, Variants } from 'framer-motion';
import { 
  User, Phone, Mail, Lock, Sparkles, 
  ArrowRight, Star, Clock, ShieldCheck, 
  CheckCircle, AlertCircle, 
  Chrome, Smartphone
} from 'lucide-react';

// --- HELPER COMPONENTS ---

const InputField = ({ 
  label, 
  icon: Icon, 
  type = "text", 
  value, 
  onChange,
  onCursorChange,
  isPasswordToggle = false, 
  showPassword = false,
  onTogglePassword = undefined,
  required = true, 
}) => (
  <div className="relative group mb-3 sm:mb-5">
    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-focus-within:text-[#1F6FEB] transition-colors duration-300" />
    </div>
    
    <input
      type={isPasswordToggle && showPassword ? 'text' : type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseEnter={() => onCursorChange("hover")}
      onMouseLeave={() => onCursorChange("default")}
      className="block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-[#0B1220]/50 border border-gray-700/50 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]/50 focus:border-[#1F6FEB] transition-all duration-300 backdrop-blur-sm shadow-inner"
      placeholder={label}
      required={required}
    />
    
    <label className={`absolute left-10 sm:left-12 transition-all duration-300 pointer-events-none text-sm sm:text-base ${value ? '-top-2.5 text-xs text-[#1F6FEB] bg-[#0f172a] px-2 rounded' : 'top-3 sm:top-4 text-gray-500'}`}>
      {label}
    </label>

    {isPasswordToggle && onTogglePassword && (
      <button
        type="button"
        onClick={onTogglePassword}
        onMouseEnter={() => onCursorChange("hover")}
        onMouseLeave={() => onCursorChange("default")}
        className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-[#1F6FEB] transition-colors cursor-pointer z-10"
      >
        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>
    )}
    
    {/* Animated Bottom Glow */}
    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#1F6FEB] to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
  </div>
);

// Eye Icons for Password Toggle
const Eye = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOff = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const CustomerAccountCreation = () => {
  // --- LOGIC (Preserved from original) ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added for UI feedback
  
  // Extra UI state
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || ''; 
      const res = await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        phone,
        email,
        password,
      });
      
      // Original logic used alert, we can keep it or use the nice UI notification. 
      // Using nice UI notification to satisfy "complete nice ui" request while keeping flow.
      setNotification({ type: 'success', msg: 'Signup Successful: ' + res.data.msg });
      
      // Optional: Clear form on success
      if (res.status === 200 || res.status === 201) {
        setTimeout(() => {
           // Redirect logic would go here
        }, 2000);
      }
    } catch (err) {
      let msg = 'Signup Failed';
      if (err.response) {
        msg = 'Signup Failed: ' + err.response.data.msg;
      } else if (err.request) {
        msg = 'Signup Failed: No response from server';
      } else {
        msg = 'Signup Failed: ' + err.message;
      }
      setNotification({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  // --- UI ANIMATION LOGIC ---
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
      className="min-h-screen bg-[#050505]  text-white font-sans overflow-hidden relative selection:bg-[#1F6FEB] selection:text-white"
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
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
        {/* Orbs */}
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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-4 pt-20 sm:pt-24">
        <motion.div
          style={{ rotateX, rotateY, z: 100 }}
          className="w-full max-w-full grid lg:grid-cols-2 gap-6 lg:gap-12 items-start perspective-1000"
        >
          {/* --- Left Column: Marketing Hologram --- */}
          <div className="hidden lg:flex flex-col justify-start items-start px-8 xl:px-16 pointer-events-none pt-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#FFB703] text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-xl shadow-lg shadow-[#FFB703]/10">
                <Sparkles size={14} />
                <span className='text-[10px]'>Experience Excellence</span>
              </div>
              <h1 className="text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-600 drop-shadow-2xl">
                Discover <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6]">Your Style.</span>
              </h1>
              <p className="text-[17px] text-gray-400 max-w-lg leading-relaxed border-l-2 border-[#1F6FEB] pl-6">
                Connect with top-tier professionals. Book appointments instantly and elevate your style game with our curated network.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
              {[
                { label: "Stylists", val: "Top Rated", icon: Star, color: "#FFB703" },
                { label: "Booking", val: "Instant", icon: Clock, color: "#1F6FEB" },
                { label: "Support", val: "24/7", icon: ShieldCheck, color: "#10B981" }
              ].slice(0, 2).map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md hover:bg-white/5 transition-colors"
                >
                  <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                  <div className="text-xl font-bold text-white mb-1">{stat.val}</div>
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
            className="relative w-full max-w-2xl mx-auto lg:mx-0 px-0 lg:pr-4 lg:mr-auto"
          >
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#1F6FEB] via-[#FFB703] to-[#1F6FEB] rounded-2xl sm:rounded-[2.5rem] blur opacity-30 sm:opacity-40 animate-pulse"></div>
            
            <div className="relative bg-[#000000]/80 backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-[2.3rem] shadow-2xl p-5 sm:p-6 md:p-10 lg:p-12 overflow-hidden">
              {/* Mobile Header Badge */}
              <div className="flex lg:hidden justify-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#FFB703]">
                  <Sparkles size={12} />
                  <span className='text-[9px] font-bold tracking-wider uppercase'>Create Account</span>
                </div>
              </div>
              
              <div className="mb-5 sm:mb-8 text-center lg:text-left border-b border-gray-800 pb-5 sm:pb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Create your account</h2>
                <p className="text-gray-400 text-sm sm:text-base">Sign up to get started with our services</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
                
                {/* Inputs */}
                <InputField 
                  label="Name" 
                  icon={User} 
                  value={name} 
                  onChange={setName} 
                  onCursorChange={setCursorVariant} 
                />
                
                <InputField 
                  label="Phone Number" 
                  icon={Phone} 
                  type="tel"
                  value={phone} 
                  onChange={setPhone} 
                  onCursorChange={setCursorVariant} 
                />
                
                <InputField 
                  label="Email" 
                  icon={Mail} 
                  type="email"
                  value={email} 
                  onChange={setEmail} 
                  onCursorChange={setCursorVariant} 
                />
                
                <InputField 
                  label="Password" 
                  icon={Lock} 
                  type="password"
                  value={password} 
                  onChange={setPassword} 
                  onCursorChange={setCursorVariant}
                  isPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {/* Notifications */}
                <AnimatePresence>
                  {notification && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.9 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.9 }}
                      className={`overflow-hidden rounded-xl border-l-4 ${notification.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'} mb-4`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {notification.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                        <span className="text-sm font-semibold">{notification.msg}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setCursorVariant("hover")}
                  onMouseLeave={() => setCursorVariant("default")}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(31, 111, 235, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full group overflow-hidden rounded-lg sm:rounded-xl p-[2px] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1F6FEB] via-[#FFB703] to-[#1F6FEB] animate-gradient-xy"></div>
                  <div className="relative bg-[#0f172a] hover:bg-black/90 transition-colors duration-300 rounded-[8px] sm:rounded-[10px] px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3">
                    {loading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="font-bold text-white text-base sm:text-lg tracking-wide group-hover:tracking-wider transition-all">Sign up</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFB703] group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>
                
                {/* Divider */}
                <div className="flex items-center gap-3 sm:gap-4 py-1 sm:py-2">
                  <div className="h-[1px] bg-gray-800 flex-1"></div>
                  <span className="text-gray-500 text-xs sm:text-sm font-medium">or</span>
                  <div className="h-[1px] bg-gray-800 flex-1"></div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    type="button"
                    onMouseEnter={() => setCursorVariant("hover")}
                    onMouseLeave={() => setCursorVariant("default")}
                    className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#0f172a]/80 border border-gray-700 hover:border-[#1F6FEB] hover:bg-[#1e293b] transition-all duration-300 group"
                  >
                    <Chrome className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-300 group-hover:text-white">Google</span>
                  </button>
                  <button 
                    type="button"
                    onMouseEnter={() => setCursorVariant("hover")}
                    onMouseLeave={() => setCursorVariant("default")}
                    className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#0f172a]/80 border border-gray-700 hover:border-[#FFB703] hover:bg-[#1e293b] transition-all duration-300 group"
                  >
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-300 group-hover:text-white">Apple</span>
                  </button>
                </div>

                <div className="text-center pt-1 sm:pt-2">
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Already have an account?{' '}
                    <a href="/login" 
                       className="text-white hover:text-[#1F6FEB] transition-colors font-semibold border-b border-transparent hover:border-[#1F6FEB]"
                       onMouseEnter={() => setCursorVariant("hover")}
                       onMouseLeave={() => setCursorVariant("default")}
                    >
                      Login
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

export default CustomerAccountCreation;
