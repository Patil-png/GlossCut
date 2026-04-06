import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Info, Shield, Star, Zap, ChevronRight } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from booking flow
  const isFromBooking = location.state?.returnTo === '/booking-appointment';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const cleanEmail = email.trim();
    const cleanPassword = password;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setMessage('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    const result = await login(cleanEmail, cleanPassword);

    if (result.success) {
      setMessage('Login successful!');
      const queryParams = new URLSearchParams(location.search);
      const redirectFromQuery = queryParams.get('redirect');
      const returnTo = redirectFromQuery || location.state?.returnTo || '/all-services-search';
      const barberData = location.state?.barberData;

      if (returnTo === '/booking-appointment' && barberData) {
        navigate(returnTo, { state: { barberData } });
      } else {
        navigate(returnTo);
      }
    } else {
      if (result.error && (result.error.toLowerCase().includes('user') || result.error.toLowerCase().includes('credential') || result.error.toLowerCase().includes('found'))) {
        setMessage('user not exists');
      } else {
        setMessage(result.error || 'user not exists');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex items-center justify-center p-4 pt-32 lg:pt-40 relative overflow-hidden selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
      <Helmet>
        <title>Login | GlossCut - Secure Access</title>
        <meta name="description" content="Login to your GlossCut account to manage appointments, view history." />
        <link rel="canonical" href="https://www.glosscut.com/login" />
      </Helmet>

      {/* DYNAMIC BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-mesh-gradient">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            translateX: [0, 100, 0],
            translateY: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 mix-blend-multiply"
          style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            translateX: [0, -50, 0],
            translateY: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[100px] opacity-15 mix-blend-multiply"
          style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 px-4">

        {/* Left Side: Marketing */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-8 pr-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/50 text-[#4C763B] text-[10px] font-black tracking-[0.2em] uppercase shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#4C763B] animate-pulse"></span>
            Est. 2024 • Excellence in Grooming
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl xl:text-7xl font-sans font-black text-gray-900 leading-[1.1] tracking-tighter"
          >
            Your Style, <br />
            <span className="text-gradient-green">
              Digitally Secured.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 max-w-lg leading-[1.7] font-medium"
          >
            Welcome back to <strong className="text-gray-900 font-bold">GlossCut</strong>. Access your personalized grooming dashboard and manage your style journey with ease.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="glass p-6 rounded-3xl border-white/40 hover:bg-white/80 transition-all duration-500 group shadow-lg shadow-green-900/5">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-[#4C763B] mb-4 group-hover:scale-110 transition-transform">
                <Star size={24} fill="currentColor" className="opacity-80" />
              </div>
              <h3 className="text-gray-900 font-extrabold mb-2 text-lg tracking-tight">Top Rated</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">Connect with verified professionals in your city.</p>
            </div>
            <div className="glass p-6 rounded-3xl border-white/40 hover:bg-white/80 transition-all duration-500 group shadow-lg shadow-green-900/5">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Zap size={24} fill="currentColor" className="opacity-80" />
              </div>
              <h3 className="text-gray-900 font-extrabold mb-2 text-lg tracking-tight">Instant Access</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">Booking availability 24/7 at your fingertips.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-10 pt-4"
          >
            <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <Shield size={16} className="text-[#4C763B]" />
              </div>
              <span>Secure Data</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <CheckCircle2 size={16} className="text-[#4C763B]" />
              </div>
              <span>Instant Confirmation</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto lg:ml-auto"
        >
          <AnimatePresence>
            {isFromBooking && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-5 glass border-[#4C763B]/20 rounded-3xl flex items-start gap-4 shadow-xl shadow-green-900/10"
              >
                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-[#4C763B]" />
                </div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  Please login to finalize your booking appointment. We've saved your selection!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-card ring-1 ring-white/50 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden relative group">
            {/* Top Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#4C763B] via-green-400 to-[#4C763B]"></div>
            <div className="p-10">
              <div className="text-center mb-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 bg-gradient-to-br from-[#4C763B] to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-600/30 border border-white/20"
                >
                  <Shield size={40} className="text-white" />
                </motion.div>
                <h2 className="text-3xl font-sans font-black text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-gray-500 font-bold text-xs tracking-[0.2em] uppercase opacity-80">Secure access to your style portal</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#4C763B] transition-colors z-10">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/50 hover:bg-white border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:bg-white transition-all font-bold shadow-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Password</label>
                    <Link to="/forgot-password" title="Recover your password" className="text-[10px] text-[#4C763B] hover:text-green-700 font-black uppercase tracking-widest transition-colors">Forgot?</Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#4C763B] transition-colors z-10">
                      <Lock size={20} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/50 hover:bg-white border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:bg-white transition-all font-bold shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${message.includes('successful')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                    >
                      {message.includes('successful') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black py-4 rounded-full shadow-xl shadow-amber-600/30 hover:shadow-2xl hover:shadow-amber-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                >
                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  
                  <div className="relative flex items-center gap-3">
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-[0.2em] text-xs">Access Account</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>
              </form>

              <div className="mt-8 text-center text-xs font-bold text-gray-500">
                New to GlossCut? 
                <Link
                  to="/customer-account-creation"
                  className="text-[#4C763B] hover:underline uppercase tracking-widest ml-2"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/all-services-search"
                  className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 group"
                >
                  <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Explore
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-8 opacity-60">
            Protected by SSL Encryption & subjected to our <Link to="/privacy-policy" className="hover:text-[#4C763B] underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>

    </div>
  );
}

export default Login;
