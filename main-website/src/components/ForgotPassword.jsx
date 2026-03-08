import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Shield, ChevronRight } from 'lucide-react';
import axios from 'axios';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const cleanEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setMessage('Please enter a valid email address.');
            setIsSuccess(false);
            setIsLoading(false);
            return;
        }

        try {
            // Assuming a standard auth endpoint structure based on AuthContext
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email: cleanEmail });
            setMessage('If an account exists for that email, we have sent a password reset link.');
            setIsSuccess(true);
        } catch (err) {
            // In a real app, you might still want to show success to prevent email enumeration,
            // but we handle errors for robustness during development.
            console.error(err);
            setMessage('Unable to send reset link. Please try again later.');
            setIsSuccess(false);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex items-center justify-center p-4 pt-20 relative overflow-hidden selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
            <Helmet>
                <title>Forgot Password | GlossCut</title>
            </Helmet>

            {/* BACKGROUND (Same premium style as Login) */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                    <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
                    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
                </div>
                <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
                    <div className="absolute inset-0 bg-gray-100/60" />
                    <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed" style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
                </div>
            </div>

            <div className="w-full max-w-md mx-auto relative z-10">
                <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden relative group hover:shadow-2xl transition-shadow duration-500">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-transparent opacity-50 pointer-events-none"></div>

                    {/* Header */}
                    <div className="bg-[#4C763B] p-8 pt-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Shield size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">Recover Password</h2>
                            <p className="text-green-50 text-sm font-medium opacity-90">Enter your email to receive a reset link</p>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="p-8 bg-white relative">
                        <div className="absolute top-0 left-0 right-0 h-6 bg-white -mt-6 rounded-t-[2rem]"></div>

                        {isSuccess ? (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
                                    <p className="text-sm text-gray-500">{message}</p>
                                </div>
                                <Link
                                    to="/login"
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        ) : (
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

                                {message && (
                                    <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 bg-red-500/10 text-red-400 border border-red-500/20`}>
                                        <AlertCircle size={16} />
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
                                            Send Reset Link <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="mt-6 text-center">
                                    <Link
                                        to="/login"
                                        className="text-gray-500 hover:text-[#4C763B] text-sm font-medium transition-colors flex items-center justify-center gap-1 group"
                                    >
                                        <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
