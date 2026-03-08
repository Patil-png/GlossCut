import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Shield, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

function ForgotPassword() {
    const navigate = useNavigate();

    // Step 1: email, Step 2: OTP, Step 3: new password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);

    // -------  Step 1: Send OTP -------
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true); setMessage('');
        const cleanEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setMessage('Please enter a valid email address.');
            setIsLoading(false); return;
        }
        try {
            await axios.post(`${API}/api/auth/forgot-password`, { email: cleanEmail });
            setStep(2);
            setMessage('');
        } catch {
            setMessage('Something went wrong. Please try again.');
        }
        setIsLoading(false);
    };

    // ------- Step 2: Verify OTP -------
    const handleOtpChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp]; next[idx] = val;
        setOtp(next);
        if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) setOtp(pasted.split(''));
        e.preventDefault();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) { setMessage('Enter the 6-digit OTP.'); return; }
        setIsLoading(true); setMessage('');
        try {
            const res = await axios.post(`${API}/api/auth/verify-otp`, { email, otp: otpValue });
            setResetToken(res.data.resetToken);
            setStep(3);
            setMessage('');
        } catch (err) {
            setMessage(err.response?.data?.error || 'Invalid OTP. Please try again.');
        }
        setIsLoading(false);
    };

    // ------- Step 3: Reset Password -------
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { setMessage('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { setMessage('Passwords do not match.'); return; }
        setIsLoading(true); setMessage('');
        try {
            await axios.post(`${API}/api/auth/reset-password/${resetToken}`, { password: newPassword });
            setIsDone(true);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to reset password. Please try again.');
        }
        setIsLoading(false);
    };

    const bgDecorations = (
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
    );

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans flex items-center justify-center p-4 pt-20 relative overflow-hidden selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
            <Helmet>
                <title>Forgot Password | GlossCut</title>
            </Helmet>
            {bgDecorations}

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
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {step === 1 ? 'Recover Password' : step === 2 ? 'Enter OTP' : 'Set New Password'}
                            </h2>
                            <p className="text-green-50 text-sm font-medium opacity-90">
                                {step === 1 ? 'Enter your email to receive a 6-digit OTP' : step === 2 ? `OTP sent to ${email}` : 'Choose a strong new password'}
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 bg-white relative">
                        <div className="absolute top-0 left-0 right-0 h-6 bg-white -mt-6 rounded-t-[2rem]"></div>

                        {/* SUCCESS STATE */}
                        {isDone ? (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
                                    <p className="text-sm text-gray-500">Your password has been successfully reset. You can now log in.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Go to Login
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* STEP 1: Email */}
                                {step === 1 && (
                                    <form onSubmit={handleSendOtp} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email ID</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10">
                                                    <Mail size={18} />
                                                </div>
                                                <input
                                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] transition-all font-medium"
                                                    placeholder="name@example.com"
                                                />
                                            </div>
                                        </div>
                                        {message && (
                                            <div className="p-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
                                                <AlertCircle size={16} /> {message}
                                            </div>
                                        )}
                                        <button type="submit" disabled={isLoading} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 group transform active:scale-[0.98]">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <> Send OTP <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /> </>}
                                        </button>
                                        <div className="mt-4 text-center">
                                            <Link to="/login" className="text-gray-500 hover:text-[#4C763B] text-sm font-medium transition-colors flex items-center justify-center gap-1 group">
                                                <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Login
                                            </Link>
                                        </div>
                                    </form>
                                )}

                                {/* STEP 2: OTP */}
                                {step === 2 && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                                        <p className="text-sm text-gray-500 text-center">Enter the 6-digit code we sent to <strong className="text-gray-900">{email}</strong></p>
                                        <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                            {otp.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    id={`otp-${idx}`}
                                                    type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                                                    onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus(); }}
                                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] bg-gray-50 transition-all"
                                                />
                                            ))}
                                        </div>
                                        {message && (
                                            <div className="p-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
                                                <AlertCircle size={16} /> {message}
                                            </div>
                                        )}
                                        <button type="submit" disabled={isLoading} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 group transform active:scale-[0.98]">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <> Verify OTP <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /> </>}
                                        </button>
                                        <div className="text-center">
                                            <button type="button" onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setMessage(''); }} className="text-gray-500 hover:text-[#4C763B] text-sm font-medium transition-colors">
                                                ← Resend OTP
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* STEP 3: New Password */}
                                {step === 3 && (
                                    <form onSubmit={handleResetPassword} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">New Password</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10"><Lock size={18} /></div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] transition-all font-medium"
                                                    placeholder="Min 8 characters"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10"><Lock size={18} /></div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4C763B] focus:ring-1 focus:ring-[#4C763B] transition-all font-medium"
                                                    placeholder="Repeat your password"
                                                />
                                            </div>
                                        </div>
                                        {message && (
                                            <div className="p-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
                                                <AlertCircle size={16} /> {message}
                                            </div>
                                        )}
                                        <button type="submit" disabled={isLoading} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 group transform active:scale-[0.98]">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <> Update Password <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /> </>}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
