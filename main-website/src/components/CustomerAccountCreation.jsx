import React, { useState, memo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence
} from 'framer-motion';
import {
  User, Phone, Mail, Lock,
  Eye, EyeOff, CheckCircle, AlertCircle, Sparkles,
  ArrowRight, Loader2, TrendingUp, Calendar, Fingerprint,
} from 'lucide-react';

// ==========================================
// 🎨 UI COMPONENTS (Visual Engine)
// ==========================================

// --- 1. Light Premium Background (Orbs + Noise) ---
const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
    </div>
    <div className="hidden lg:block absolute inset-0">
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(20px, -20px) scale(1.1)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C763B]/10 rounded-full blur-[80px]" />
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(-20px, 30px) scale(1.2)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]" />
      <div className="absolute bottom-[0%] right-[10%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px]" />
    </div>
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
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

// --- 3. Light Theme Input Field ---
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
          <label className={`text-sm font-bold uppercase tracking-wide transition-colors duration-200 ${isFocused ? 'text-[#4C763B]' : 'text-gray-500'}`}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
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
            color: isFocused ? '#4C763B' : '#6b7280' // Green when focused, gray when blur
          }}
          className="absolute left-10 top-3.5 text-sm font-medium pointer-events-none z-20 origin-left transition-colors duration-200"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </motion.label>
      )}

      {/* Icon */}
      <div className="absolute top-0 bottom-0 left-0 pl-3 flex items-center justify-center z-10 pointer-events-none">
        <Icon size={18} className={`transition-colors duration-300 ${isFocused ? 'text-[#4C763B]' : 'text-gray-400'}`} />
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
            className={`block w-full pl-10 pr-4 py-3 bg-gray-50 border ${isFocused ? 'border-[#4C763B] ring-2 ring-[#4C763B]/10' : 'border-gray-200'} rounded-xl text-gray-900 focus:outline-none resize-none transition-all shadow-sm focus:bg-white`}
          />
        ) : isSelect ? (
          <div className="relative">
            <select
              value={value}
              onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className={`block w-full pl-10 pr-10 py-3 bg-gray-50 border ${isFocused ? 'border-[#4C763B] ring-2 ring-[#4C763B]/10' : 'border-gray-200'} rounded-xl text-gray-900 focus:outline-none cursor-pointer transition-all shadow-sm focus:bg-white flex items-center ${useFloatingLabel ? 'pt-4 pb-2' : ''}`}
            >
              {!useFloatingLabel && <option value="" disabled className="text-gray-400">Select an option</option>}
              {useFloatingLabel && <option value="" disabled className="text-transparent"></option>}
              {options.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt} className="text-gray-900 bg-white">
                  {opt.label || opt}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input
            type={isPasswordToggle && showPassword ? 'text' : type}
            value={value}
            onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`block w-full pl-10 pr-10 py-3 bg-gray-50 border ${isFocused ? 'border-[#4C763B] ring-2 ring-[#4C763B]/10' : 'border-gray-200'} rounded-xl text-gray-900 focus:outline-none transition-all shadow-sm focus:bg-white`}
          />
        )}
      </div>

      {/* Password Toggle */}
      {isPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#4C763B] transition-colors z-20"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

// --- 4. Hero Section Left (Light Theme) ---
// Simplified visual that matches Hero.jsx vibe
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
            src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop"
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
              Discover <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Your Style.</span>
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm font-medium">
              Connect with top-tier professionals. Book appointments instantly and elevate your style game with our curated network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 MAIN LOGIC COMPONENT (Logic Preserved)
// ==========================================
const CustomerAccountCreation = () => {
  const { register } = useAuth();

  // Form state for creating new account
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Handle input changes
  const handleInputChange = (field, value) => {
    // Convert email to lowercase as user types
    if (field === 'email') {
      value = value.toLowerCase();
    }
    // Format phone number - remove spaces, dashes, and ensure only numbers and +
    if (field === 'phone') {
      value = value.replace(/[^\d+]/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setMessage({ type: 'error', content: 'Please fill in all required fields.' });
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', content: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    // Phone validation - allow 10 digits or +91 followed by 10 digits
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage({ type: 'error', content: 'Please enter a valid phone number (10 digits starting with 6-9, or +91 followed by 10 digits).' });
      setLoading(false);
      return;
    }

    // Password validation - Minimum 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage({ type: 'error', content: 'Password must be at least 8 chars long and include uppercase, lowercase, number, and special character.' });
      setLoading(false);
      return;
    }

    // Ensure email is lowercase (should already be from input handler, but double-check)
    const normalizedEmail = formData.email.toLowerCase();

    try {
      // Create new account
      const registrationData = {
        name: formData.name,
        email: normalizedEmail,
        phone: formData.phone,
        password: formData.password,
        role: 'customer'
      };

      const result = await register(registrationData);
      if (result && result.success) {
        setMessage({ type: 'success', content: 'Account created successfully! You are now logged in.' });
        // Reset form
        setFormData({
          name: '', phone: '', email: '', password: '', gender: ''
        });
      } else {
        setMessage({ type: 'error', content: result?.error || 'Failed to create account. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating account:', error);

      // Handle specific error types
      if (error.response?.status === 400) {
        // Validation errors from registration
        setMessage({ type: 'error', content: error.response.data.msg || 'Invalid input data. Please check your information.' });
      } else {
        // Generic server errors
        setMessage({ type: 'error', content: 'An error occurred while creating your account. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // --- RENDER ---
  return (
    <div className="min-h-screen w-full bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] overflow-hidden relative">
      <CustomCursor />
      <Background />

      {/* Main Container */}
      <div className="container mx-auto min-h-screen flex items-center justify-center relative z-10 p-4 mt-20">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

          {/* Left Side: Parallax Hero */}
          <HeroSection />

          {/* Right Side: Glass Form - Light Theme */}
          <div className="w-full lg:w-3/5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              {/* Outer Glow Border (Subtle Shadow for Light Theme) */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-[2rem] opacity-50 blur-sm group-hover:opacity-100 transition duration-500" />

              {/* The Glass Card */}
              <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[1.9rem] p-6 md:p-10 shadow-2xl shadow-gray-200/50">

                {/* Header */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Customer Account</h2>
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-200">
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Join our community of style enthusiasts. Create your account to book appointments and discover amazing services.</p>
                </div>

                {/* Customer Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Account Information</h3>
                      <p className="text-xs text-gray-500 font-medium">Your personal and contact details.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <InputField
                      label="Full Name"
                      icon={User}
                      field="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />

                    {/* Email Field */}
                    <InputField
                      label="Email Address"
                      icon={Mail}
                      type="email"
                      field="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />

                    {/* Phone Field */}
                    <InputField
                      label="Phone Number"
                      icon={Phone}
                      type="tel"
                      field="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />

                    {/* Password Field */}
                    <InputField
                      label="Password"
                      icon={Lock}
                      type="password"
                      field="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      isPasswordToggle={true}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    {/* Gender Field */}
                    <InputField
                      label="Gender"
                      icon={Fingerprint}
                      field="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      isSelect
                      useFloatingLabel
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' },
                        { value: 'Prefer not to say', label: 'Prefer not to say' }
                      ]}
                      required={false}
                    />
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
                          Create Account
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerAccountCreation;
