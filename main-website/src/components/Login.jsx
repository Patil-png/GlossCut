import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
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

    // Input Sanitization
    const cleanEmail = email.trim();
    const cleanPassword = password;

    // Email Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setMessage('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    const result = await login(cleanEmail, cleanPassword);

    if (result.success) {
      setMessage('Login successful!');

      // Check for redirect URL from query params (from ProtectedRoute) or location.state
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
      // User requested specific error message
      if (result.error && (result.error.toLowerCase().includes('user') || result.error.toLowerCase().includes('credential') || result.error.toLowerCase().includes('found'))) {
        setMessage('user not exists');
      } else {
        setMessage(result.error || 'user not exists');
      }
    }

    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex items-center justify-center p-4 pt-20 relative overflow-hidden selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
      <Helmet>
        <title>Login | GlossCut - Secure Access</title>
        <meta name="description" content="Login to your GlossCut account to manage appointments, view history." />
        <link rel="canonical" href="https://www.glosscut.com/login" />
      </Helmet>


      {/* SHARED BACKGROUND WRAPPER */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Mobile Background */}
        <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
          <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
          <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
          {/* Isolated Noise */}
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
        </div>

        {/* Desktop Background */}
        <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
          <div className="absolute inset-0 bg-gray-100/60" />
          <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed" style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
          <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply animate-float-slow" style={{ background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)' }} />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        </div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Side: Marketing (Matches Image Left Section) */}
        <div className="hidden mt-12 lg:block space-y-8 pr-8">
          {/* Pill Badge */}
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 text-sm font-semibold animate-fade-in-up shadow-[0_0_15px_rgba(76,118,59,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#4C763B] shadow-[0_0_10px_rgba(76,118,59,0.5)] animate-pulse"></span>
            Est. 2024 • Excellence in Grooming
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl xl:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight drop-shadow-sm">
            Your Style, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">
              Digitally Secured.
            </span>
          </h1>

          {/* Description */}
          {/* Description */}
          <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
            Welcome to the <strong className="text-gray-900">TrimMaster</strong> patient portal. Access your booking history, upcoming appointments, and style preferences with enterprise-grade security.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/60 p-5 rounded-2xl border border-gray-200 backdrop-blur-sm hover:bg-white/80 hover:border-green-200 transition-all duration-300 group hover:-translate-y-1 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Star size={20} fill="currentColor" className="opacity-75" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">Top Rated</h3>
              <p className="text-sm text-gray-500 leading-snug">Connect with verified professionals in your area.</p>
            </div>
            <div className="bg-white/60 p-5 rounded-2xl border border-gray-200 backdrop-blur-sm hover:bg-white/80 hover:border-green-200 transition-all duration-300 group hover:-translate-y-1 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Zap size={20} fill="currentColor" className="opacity-75" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">Instant Access</h3>
              <p className="text-sm text-gray-500 leading-snug">Real-time booking availability 24/7.</p>
            </div>
          </div>

          {/* Footer Ticks */}
          <div className="flex gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <CheckCircle2 size={18} className="text-[#4C763B]" />
              <span>Secure Data</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <CheckCircle2 size={18} className="text-[#4C763B]" />
              <span>Instant Confirmation</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card (Matches Image Right Section) */}
        <div className="w-full mt-12 max-w-md mx-auto lg:ml-auto">

          {/* Booking Redirect Notice */}
          {isFromBooking && (
            <div className="mb-6 p-4 bg-[#4C763B]/10 border border-[#4C763B]/20 rounded-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
              <Info className="w-5 h-5 text-[#4C763B] shrink-0 mt-0.5" />
              <p className="text-sm text-[#4C763B] leading-relaxed">
                Please login to finalize your booking appointment.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden relative group hover:shadow-2xl transition-shadow duration-500">
            {/* Decorative border gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-transparent opacity-50 pointer-events-none"></div>

            {/* Card Header (Green Section) */}
            <div className="bg-[#4C763B] p-8 pt-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Secure Login</h2>
                <p className="text-green-50 text-sm font-medium opacity-90">Enter your details to access account</p>
              </div>
            </div>

            {/* Card Body (Form Section) */}
            <div className="p-8 bg-white relative">
              {/* Curved Divider effect */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-white -mt-6 rounded-t-[2rem]"></div>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email ID</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] transition-all font-medium relative z-0"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    <button type="button" className="text-xs text-[#4C763B] hover:text-green-700 font-semibold hover:underline cursor-pointer">Forgot?</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] transition-all font-medium relative z-0"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {message && (
                  <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${message.includes('successful')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {message.includes('successful') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 group transform active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Access Account <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/customer-account-creation"
                  className="text-gray-500 hover:text-[#4C763B] text-sm font-medium transition-colors flex items-center justify-center gap-1 group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Return to Homepage
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Protected by reCAPTCHA and subject to the Privacy Policy and Terms of Service.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;
