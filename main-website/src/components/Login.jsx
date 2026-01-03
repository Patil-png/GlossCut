import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Info, Shield, Star, Zap, ChevronRight } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from booking flow
  const isFromBooking = location.state?.returnTo === '/booking-appointment';

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const result = await login(email, password);

    if (result.success) {
      setMessage('Login successful!');

      // Redirect to intended page or default to all-services-search
      const returnTo = location.state?.returnTo || '/all-services-search';
      const barberData = location.state?.barberData;

      if (returnTo === '/booking-appointment' && barberData) {
        navigate(returnTo, { state: { barberData } });
      } else {
        navigate(returnTo);
      }
    } else {
      setMessage(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex items-center justify-center p-4 pt-20 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Grid Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Cursor Follower Gradient */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.15), transparent 80%)`
        }}
      />
      
      {/* Background Ambience (Fixed Blobs) */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[5000ms]" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Marketing (Matches Image Left Section) */}
        <div className="hidden mt-12 lg:block space-y-8 pr-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold animate-fade-in-up shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse"></span>
                Est. 2024 • Excellence in Grooming
            </div>

            {/* Hero Headline */}
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-2xl">
                Your Style, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                    Digitally Secured.
                </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                Welcome to the <strong className="text-white">TrimMaster</strong> patient portal. Access your booking history, upcoming appointments, and style preferences with enterprise-grade security.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-5">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Star size={20} fill="currentColor" className="opacity-75" />
                    </div>
                    <h3 className="text-white font-bold mb-1">Top Rated</h3>
                    <p className="text-sm text-slate-400 leading-snug">Connect with verified professionals in your area.</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Zap size={20} fill="currentColor" className="opacity-75" />
                    </div>
                    <h3 className="text-white font-bold mb-1">Instant Access</h3>
                    <p className="text-sm text-slate-400 leading-snug">Real-time booking availability 24/7.</p>
                </div>
            </div>

            {/* Footer Ticks */}
            <div className="flex gap-8 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <CheckCircle2 size={18} className="text-emerald-500 shadow-emerald-500/50" />
                    <span>Secure Data</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <CheckCircle2 size={18} className="text-emerald-500 shadow-emerald-500/50" />
                    <span>Instant Confirmation</span>
                </div>
            </div>
        </div>

        {/* Right Side: Login Card (Matches Image Right Section) */}
        <div className="w-full mt-12 max-w-md mx-auto lg:ml-auto">
            
            {/* Booking Redirect Notice */}
            {isFromBooking && (
                <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200 leading-relaxed">
                       Please login to finalize your booking appointment.
                    </p>
                </div>
            )}

            <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative group hover:shadow-indigo-500/10 transition-shadow duration-500">
                {/* Decorative border gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent opacity-50 pointer-events-none"></div>

                {/* Card Header (Blue Section) */}
                <div className="bg-indigo-600 p-8 pt-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Secure Login</h2>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Enter your details to access account</p>
                    </div>
                </div>

                {/* Card Body (Form Section) */}
                <div className="p-8 bg-slate-900 relative">
                    {/* Curved Divider effect */}
                    <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900 -mt-6 rounded-t-[2rem]"></div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email ID</label>
                           <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors z-10">
                                 <Mail size={18} />
                              </div>
                              <input
                                 type="email"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                                 className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium relative z-0"
                                 placeholder="name@example.com"
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <div className="flex justify-between items-center ml-1">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">Forgot?</a>
                           </div>
                           <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors z-10">
                                 <Lock size={18} />
                              </div>
                              <input
                                 type="password"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 required
                                 className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium relative z-0"
                                 placeholder="••••••••"
                              />
                           </div>
                        </div>

                        {message && (
                           <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
                              message.includes('successful')
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
                           className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 group transform active:scale-[0.98]"
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
                           className="text-slate-500 hover:text-indigo-400 text-sm font-medium transition-colors flex items-center justify-center gap-1 group"
                        >
                           <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
            
            <p className="text-center text-slate-500 text-xs mt-6">
               Protected by reCAPTCHA and subject to the Privacy Policy and Terms of Service.
            </p>
        </div>

      </div>
    </div>
  );
}

export default Login;