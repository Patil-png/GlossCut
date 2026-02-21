import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, Info, TriangleAlert, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ModernAlert = ({ visible, title, message, type, onHide }) => {
    if (!visible) return null;

    const getAlertStyle = () => {
        switch (type) {
            case "error": return { bg: "bg-[#3E1010]", border: "border-[#8B2E2E]", iconColor: "text-[#EF9A9A]", Icon: XCircle };
            case "success": return { bg: "bg-[#0D2115]", border: "border-[#1B4D2E]", iconColor: "text-[#81C784]", Icon: CheckCircle };
            case "warning": return { bg: "bg-[#2E2100]", border: "border-[#6D5410]", iconColor: "text-[#FFD54F]", Icon: TriangleAlert };
            default: return { bg: "bg-[#232323]", border: "border-[#444]", iconColor: "text-[#E0E0E0]", Icon: Info };
        }
    };

    const { bg, border, iconColor, Icon } = getAlertStyle();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] flex justify-center header-safe-pt mt-4 px-5"
            >
                <div className={`${bg} border ${border} flex items-center w-full max-w-[400px] p-4 rounded-[20px] shadow-2xl shadow-black/30`}>
                    <div className="mr-3.5">
                        <Icon size={22} className={iconColor} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-[15px] font-extrabold mb-0.5 tracking-wide ${iconColor}`}>{title}</h3>
                        <p className="text-[13px] text-gray-300 font-medium leading-tight">{message}</p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const LoginScreen = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" });

    const handleGoogleLogin = () => {
        const redirectUrl = window.location.origin;
        window.location.href = `https://api.glosscut.com/api/auth/google?mobile_redirect=${encodeURIComponent(redirectUrl)}&role=barber&login_only=true`;
    };

    const showAlert = (title, message, type) => {
        setAlert({ visible: true, title, message, type });
        setTimeout(() => setAlert(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showAlert("Missing Fields", "Please fill in both email and password.", "warning");
            return;
        }

        setIsLoading(true);
        const sanitizedEmail = email.trim().toLowerCase();
        console.log('[DEBUG] Login attempt details:', {
            providedEmail: email,
            sanitizedEmail: sanitizedEmail,
            passwordLength: password ? password.length : 0
        });

        const result = await login(sanitizedEmail, password);

        if (result.success) {
            showAlert("Success", "Welcome back to SetKarr!", "success");
            setTimeout(() => navigate('/'), 800);
        } else {
            showAlert("Login Failed", result.message || "Incorrect email or password.", "error");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F0EAD6] to-[#E6DCCA] flex flex-col items-center">

            {/* Background Decorations */}
            <div className="absolute top-[-120px] right-[-80px] w-[350px] h-[350px] rounded-full bg-[#D4AF37]/20 blur-xl transform scale-110 pointer-events-none"></div>
            <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#8B4513]/10 blur-xl pointer-events-none"></div>

            <ModernAlert {...alert} onHide={() => setAlert({ ...alert, visible: false })} />

            <div className="w-full flex-1 overflow-y-auto no-scrollbar flex flex-col items-center header-safe-pt pb-6 px-4">
                <div className="w-full max-w-[400px] flex flex-col items-center">

                    {/* Header */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center mb-8 mt-4"
                    >
                        <div className="w-[110px] h-[110px] rounded-full bg-white/90 flex items-center justify-center mb-4 shadow-lg shadow-[#8B4513]/20 border border-[#D4AF37]/50 overflow-hidden relative">
                            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/50 pointer-events-none"></div>
                            <img src="/LoginLogo.png" alt="Logo" className="w-[70%] h-[70%] object-contain" />
                        </div>

                        <div className="flex flex-col items-center mb-1.5">
                            <span className="text-[11px] font-extrabold text-[#8B4513] tracking-[2.5px] mb-1 opacity-90">WELCOME BACK</span>
                            <h1 className="text-[28px] font-black text-[#3E2723] text-center tracking-wide leading-tight">GLOSSCUT PARTNER</h1>
                            <div className="w-12 h-1 bg-[#D4AF37] mt-2 rounded-full"></div>
                        </div>

                        <p className="text-sm text-[#5D4037] text-center max-w-[290px] mt-2.5 opacity-85 leading-5 font-medium">
                            Manage your shop, bookings, and earnings with ease.
                        </p>
                    </motion.div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="w-full bg-white/92 rounded-[24px] p-[22px] shadow-xl shadow-[#5D4037]/10 border border-white/60 space-y-[14px]"
                    >
                        {/* Google Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full h-[52px] bg-white border border-[#EFEBE9] rounded-[14px] flex items-center justify-center space-x-3 shadow-sm active:scale-[0.98] transition-all"
                        >
                            <img src="https://developers.google.com/identity/images/g-logo.png" alt="G" className="w-5 h-5" />
                            <span className="text-sm font-bold text-[#4E342E]">Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="flex items-center py-1 text-[#A1887F]">
                            <div className="flex-1 h-px bg-[#E6DCCA] opacity-80"></div>
                            <span className="px-3 text-[11px] font-bold uppercase tracking-wider">or sign in with email</span>
                            <div className="flex-1 h-px bg-[#E6DCCA] opacity-80"></div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-[14px]">
                            <div className="space-y-[5px]">
                                <label htmlFor="email" className="text-[11px] font-extrabold text-[#6D4C41] uppercase tracking-[0.8px] ml-1">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    placeholder="partner@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-[52px] bg-[#FAFAFA] border-[1.5px] border-[#E0E0E0] rounded-[14px] px-[18px] text-[15px] font-semibold text-[#3E2723] focus:border-[#D4AF37]/50 focus:outline-none placeholder:text-[#A1887F] transition-colors"
                                />
                            </div>

                            <div className="space-y-[5px]">
                                <label htmlFor="password" className="text-[11px] font-extrabold text-[#6D4C41] uppercase tracking-[0.8px] ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-[52px] bg-[#FAFAFA] border-[1.5px] border-[#E0E0E0] rounded-[14px] px-[18px] text-[15px] font-semibold text-[#3E2723] focus:border-[#D4AF37]/50 focus:outline-none placeholder:text-[#A1887F] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8B4513]"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end mt-[4px]">
                                <button type="button" className="text-[13px] font-bold text-[#8D6E63] hover:text-[#5D4037]">
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[54px] bg-[#D4AF37] hover:bg-[#C5A028] text-[#3E2723] font-black text-base rounded-[16px] shadow-lg shadow-[#D4AF37]/35 border-t border-white/40 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-2"
                            >
                                {isLoading ? (
                                    <Loader2 size={24} className="animate-spin text-[#3E2723]" />
                                ) : (
                                    <>
                                        <span className="mr-2 tracking-[0.8px]">ACCESS DASHBOARD</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    <div className="text-center mt-5 mb-8">
                        <p className="text-[13px] font-semibold text-[#795548]">
                            Don't have an account?{' '}
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-[#8B4513] font-black underline decoration-2 decoration-[#8B4513]/30 hover:decoration-[#8B4513]"
                            >
                                APPLY NOW
                            </button>
                        </p>
                        <p className="text-[10px] font-extrabold text-[#A1887F] tracking-[2.5px] uppercase mt-8">© 2024 GLOSSCUT INC.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
