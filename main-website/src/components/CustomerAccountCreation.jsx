import React, { useState, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence
} from 'framer-motion';
import {
  User, Phone, Mail, Lock,
  Eye, EyeOff, Sparkles,
  ArrowRight, Loader2, TrendingUp, Calendar, Fingerprint,
} from 'lucide-react';

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

      {/* Grid Pattern Overlay for structure (Reduced Opacity for Balance #80808012) */}
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

// --- 3. Light Theme Input Field ---
const InputField = ({
  label,
  icon: Icon,
  type = "text",
  value,
  field,
  onChange,
  isPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  required = true,
  isTextArea = false,
  isSelect = false,
  options = [],
  disabled = false,
  useFloatingLabel = false,
  prefix = "",
  maxLength
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
            y: isFocused || hasValue ? -28 : 0,
            x: isFocused || hasValue ? -5 : (prefix ? 56 : 0),
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused ? '#4C763B' : '#6b7280',
            backgroundColor: isFocused || hasValue ? '#ffffff' : 'rgba(255,255,255,0)',
            paddingLeft: isFocused || hasValue ? 4 : 0,
            paddingRight: isFocused || hasValue ? 4 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute left-10 top-3.5 text-sm font-medium pointer-events-none z-20 origin-left rounded-md"
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
          <div className="relative flex items-center">
            {prefix && (
              <span className="absolute left-10 text-gray-500 font-medium border-r border-gray-200 pr-3">
                {prefix}
              </span>
            )}
            <input
              type={isPasswordToggle && showPassword ? 'text' : type}
              value={value}
              onChange={disabled ? undefined : (e) => onChange(field, e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              maxLength={maxLength}
              className={`block w-full ${prefix ? 'pl-24' : 'pl-10'} pr-10 py-3 bg-gray-50 border ${isFocused ? 'border-[#4C763B] ring-2 ring-[#4C763B]/10' : 'border-gray-200'} rounded-xl text-gray-900 focus:outline-none transition-all shadow-sm focus:bg-white`}
            />
          </div>
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
const HeroSection = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center w-5/12 relative z-10">
      <div className="relative w-full max-w-lg">
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

        <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/50 aspect-[4/5] bg-gray-100 group">
          <img
            src="/Page1.png"
            alt="Barber Shop"
            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[2s]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />
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
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // WhatsApp OTP state
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isPhoneTaken, setIsPhoneTaken] = useState(false);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const checkUniqueness = async (type, value) => {
    if (type === 'phone' && value.length < 10) {
      setIsPhoneTaken(false);
      return;
    }
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setIsEmailTaken(false);
      return;
    }

    setIsCheckingUniqueness(true);
    try {
      const payload = type === 'phone' 
        ? { phone: value.replace(/\D/g, '').slice(-10) }
        : { email: value.toLowerCase() };

      const response = await fetch('/api/auth/check-uniqueness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      const isTaken = response.status === 409 || data.msg === (type === 'phone' ? 'Phone taken' : 'Email taken') || data.msg === 'Both taken';
      
      if (type === 'phone') {
        setIsPhoneTaken(isTaken);
        if (isTaken) {
          setMessage({ type: 'error', content: 'This phone number is already registered. Please log in.' });
        } else if (!isEmailTaken && message.content === 'This phone number is already registered. Please log in.') {
          setMessage({ type: '', content: '' });
        }
      } else {
        setIsEmailTaken(isTaken);
        if (isTaken) {
          setMessage({ type: 'error', content: 'This email is already registered. Please log in.' });
        } else if (!isPhoneTaken && message.content === 'This email is already registered. Please log in.') {
          setMessage({ type: '', content: '' });
        }
      }
    } catch (error) {
      console.error('Error checking uniqueness:', error);
    } finally {
      setIsCheckingUniqueness(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      value = value.toLowerCase();
      setFormData(prev => ({ ...prev, [field]: value }));
      if (value.includes('@') && value.includes('.')) {
        checkUniqueness('email', value);
      } else {
        setIsEmailTaken(false);
      }
      return;
    }
    
    if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: value }));
      if (value.length === 10) {
        checkUniqueness('phone', value);
      } else {
        setIsPhoneTaken(false);
      }
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setMessage({ type: 'error', content: 'Please fill in all required fields.' });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', content: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setMessage({ type: 'error', content: 'Please enter a valid 10-digit mobile number.' });
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage({ type: 'error', content: 'Password must be at least 8 chars long with uppercase, lowercase, number, and special character.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${formData.phone}` })
      });

      const data = await response.json();
      if (response.ok) {
        setStep(2);
        setTimer(60);
        setMessage({ type: 'success', content: 'Verification code sent to your WhatsApp!' });
      } else {
        setMessage({ type: 'error', content: data.error || 'Failed to send OTP.' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setMessage({ type: 'error', content: 'Enter 6-digit OTP.' });
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${formData.phone}`, otp })
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setMessage({ type: 'error', content: data.error || 'Invalid OTP.' });
        setLoading(false);
        return;
      }

      const result = await register({
        ...formData,
        role: 'customer',
        phone: `+91${formData.phone}`
      });

      if (result && result.success) {
        setMessage({ type: 'success', content: 'Account created successfully! Redirecting to services...' });
        setTimeout(() => {
          navigate('/all-services-search');
        }, 3000);
      } else {
        setMessage({ type: 'error', content: result?.error || 'Registration failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${formData.phone}` })
      });
      if (response.ok) {
        setTimer(60);
        setMessage({ type: 'success', content: 'OTP resent!' });
      }
    } catch (error) {}
    setIsResending(false);
  };

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] overflow-hidden relative">
      <CustomCursor />
      <Background />

      <div className="container mx-auto min-h-screen flex items-center justify-center relative z-10 p-4 mt-20">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          <HeroSection />

          <div className="w-full lg:w-3/5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[1.9rem] p-6 md:p-10 shadow-2xl"
            >
              <div className="mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Create Customer Account</h2>
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Join our sleek grooming community today.</p>
              </div>

              <form onSubmit={step === 1 ? handleSubmit : handleVerifyAndRegister} className="space-y-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
                    {step === 1 ? <Fingerprint size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{step === 1 ? 'Account Details' : 'Verify Identity'}</h3>
                    <p className="text-xs text-gray-500">
                      {step === 1 ? 'Start your journey with us.' : `Enter code sent to +91 ${formData.phone}`}
                    </p>
                  </div>
                </div>

                {step === 1 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Full Name" icon={User} field="name" value={formData.name} onChange={handleInputChange} />
                    <InputField label="Email Address" icon={Mail} field="email" type="email" value={formData.email} onChange={handleInputChange} />
                    <InputField label="Mobile Number" icon={Phone} field="phone" type="tel" value={formData.phone} onChange={handleInputChange} prefix="+91" maxLength={10} />
                    <InputField label="Password" icon={Lock} field="password" type="password" value={formData.password} onChange={handleInputChange} isPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                    <InputField label="Gender" icon={User} field="gender" value={formData.gender} onChange={handleInputChange} isSelect options={[{value:'Male', label:'Male'}, {value:'Female', label:'Female'}, {value:'Other', label:'Other'}]} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <InputField label="Enter 6-digit OTP" icon={Lock} field="otp" value={otp} onChange={(f,v) => setOtp(v.replace(/\D/g,'').slice(0,6))} maxLength={6} />
                    <div className="flex flex-col items-center gap-4">
                      <button type="button" onClick={handleResendOtp} disabled={timer > 0 || isResending} className="text-sm font-bold text-[#4C763B] disabled:text-gray-400">
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend via WhatsApp'}
                      </button>
                      <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 underline">Back to edit details</button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {message.content && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {message.content}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading || isPhoneTaken || isEmailTaken || isCheckingUniqueness} className="w-full h-14 bg-gray-900 rounded-xl text-white font-bold uppercase transition-all hover:shadow-xl disabled:opacity-50">
                  <div className="flex items-center justify-center gap-3">
                    {loading || isCheckingUniqueness ? <Loader2 className="animate-spin" /> : (
                      <>{step === 1 ? 'Get OTP' : 'Register Now'} <ArrowRight size={18} /></>
                    )}
                  </div>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccountCreation;
