import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginScreen = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark p-4">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white/90 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20 border-2 border-primary/50">
                        <img src="/vite.svg" alt="Logo" className="w-12 h-12" />
                    </div>
                    <div className="text-xs font-bold text-primary tracking-[0.2em] mb-1">WELCOME BACK</div>
                    <h1 className="text-3xl font-black text-white tracking-wide mb-2">GLOSSCUT PARTNER</h1>
                    <div className="w-12 h-1 bg-primary mx-auto rounded-full mb-3"></div>
                    <p className="text-gray-400 text-sm">Manage your shop, bookings, and earnings.</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-stone-900/50 border border-white/60">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="partner@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-stone-50 border-2 border-stone-200 text-stone-900 text-base rounded-2xl px-4 py-3 focus:border-primary focus:ring-0 transition-colors placeholder:text-stone-400 font-semibold"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-stone-50 border-2 border-stone-200 text-stone-900 text-base rounded-2xl px-4 py-3 focus:border-primary focus:ring-0 transition-colors placeholder:text-stone-400 font-semibold"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" className="text-xs font-bold text-stone-600 hover:text-primary transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-[#b88e2b] text-stone-900 font-black text-base py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 border-t border-white/40"
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <span>ACCESS DASHBOARD</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm font-semibold text-stone-600">
                            Don't have an account?{' '}
                            <button className="text-stone-800 font-black underline decoration-2 decoration-primary/50 hover:decoration-primary">
                                APPLY NOW
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-stone-600 tracking-[0.25em] uppercase opacity-60">© 2024 GLOSSCUT INC.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
