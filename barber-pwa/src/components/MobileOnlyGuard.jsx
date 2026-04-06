import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, QrCode, ArrowRight, ShieldCheck, Zap, Globe, Sparkles, ChevronRight, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const MobileOnlyGuard = ({ children }) => {
    const [isDesktop, setIsDesktop] = useState(false);
    const partnerUrl = "https://partner.glosscut.com";

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth > 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    if (!isDesktop) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[99999] bg-[#F9FAFB] flex items-center justify-center overflow-hidden selection:bg-[#4C763B]/20 transition-colors duration-1000">

            {/* ==================================================================================
                MAIN BACKGROUND
            ================================================================================== */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at 80% 0%, rgba(76, 118, 59, 0.08) 0%, transparent 40%), radial-gradient(circle at 20% 100%, rgba(34, 197, 94, 0.05) 0%, transparent 40%)'
                    }}
                />
                <div
                    className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-10 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, #4C763B 0%, transparent 70%)',
                    }}
                />
            </div>

            <div className="relative w-full h-full overflow-y-auto no-scrollbar flex items-start lg:items-center justify-center p-6 md:p-10 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative w-full max-w-[1050px] mx-auto z-10 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center py-8 lg:py-0"
                >
                    {/* --- LEFT: CONTENT --- */}
                    <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8">

                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm group hover:border-gray-300 transition-all cursor-default"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] group-hover:scale-125 transition-transform" />
                            <span className="text-xs sm:text-sm font-semibold text-gray-600 tracking-wide">GlossCut Partner Portal</span>
                        </motion.div>

                        <div className="space-y-4 lg:max-w-[500px]">
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight text-balance">
                                <span className="block text-gray-900">Manage Your Business</span>
                                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#4C763B] to-green-600 pb-1">
                                    On the Go.
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-medium text-balance">
                                Access your salon slots, appointments, and partner settings effortlessly from your mobile device. Desktop access is optimized for customer browsing only.
                            </p>
                        </div>

                        {/* Quality Badges */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            {[
                                { icon: Smartphone, text: "Mobile Optimized" },
                                { icon: Zap, text: "Instant Sync" },
                                { icon: Globe, text: "Cloud Sync" }
                            ].map((f, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -3, backgroundColor: "rgba(255, 255, 255, 1)" }}
                                    className="flex items-center space-x-2 bg-white/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all cursor-default"
                                >
                                    <f.icon size={16} className="text-[#4C763B]" />
                                    <span className="text-xs font-bold text-gray-800">{f.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* --- RIGHT: THE CARD --- */}
                    <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center group">
                        {/* Elegant Ambient Layer */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-[#4C763B]/5 via-transparent to-green-500/5 rounded-full blur-[100px] opacity-40" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative bg-white/95 backdrop-blur-2xl border border-white rounded-[40px] p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden w-full max-w-[420px] border border-gray-100/50"
                        >
                            {/* Interactive Reflection */}
                            <motion.div
                                animate={{ x: ['-200%', '300%'] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
                            />

                            <div className="flex flex-col items-center">
                                {/* Connectivity Hub (Compact) */}
                                <div className="flex items-center justify-center space-x-5 mb-8 w-full">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                                        <Monitor size={26} className="text-gray-300" />
                                    </div>
                                    <div className="flex-1 max-w-[50px] h-[2px] bg-gray-100 relative overflow-hidden">
                                        <motion.div
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4C763B]/40 to-transparent"
                                        />
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border-2 border-[#4C763B]/40 shadow-[0_15px_30px_rgba(76,118,59,0.12)] ring-4 ring-[#4C763B]/5">
                                        <Smartphone size={32} className="text-[#4C763B]" />
                                    </div>
                                </div>

                                {/* QR Zone (Compact) */}
                                <div className="relative group/qr p-2 bg-gradient-to-tr from-gray-50 to-white rounded-[32px] border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] duration-500">
                                    <div className="bg-white rounded-[24px] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)] relative">
                                        <QRCodeCanvas
                                            value={partnerUrl}
                                            size={150}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "/LoginLogo.png",
                                                height: 32,
                                                width: 32,
                                                excavate: true,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 text-center space-y-2">
                                    <h3 className="text-gray-900 font-[900] text-lg md:text-xl tracking-tight uppercase">Transfer to Mobile</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 font-bold tracking-[0.15em] uppercase leading-relaxed max-w-[240px]">
                                        Scan the secure QR code <br className="hidden md:block" /> to continue your session
                                    </p>
                                </div>

                                {/* Action Console (Compact) */}
                                <div className="w-full mt-8 space-y-3">
                                    <button
                                        onClick={() => window.open(partnerUrl, "_blank")}
                                        className="w-full h-12 md:h-13 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-black hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200"
                                    >
                                        Launch Hub
                                        <ArrowRight size={18} />
                                    </button>

                                    <div className="flex gap-2">
                                        <div className="flex-1 h-10 md:h-11 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">iOS</div>
                                        <div className="flex-1 h-10 md:h-11 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Android</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Premium Branding Footer */}
            <div className="absolute bottom-6 md:bottom-10 left-0 w-full px-8 md:px-12 flex justify-between items-center opacity-40 z-50">
                <div className="flex items-center gap-3 md:gap-4">
                    <img src="/LoginLogo.png" alt="Logo" className="h-5 md:h-6 grayscale" />
                    <div className="w-px h-5 bg-gray-300"></div>
                    <span className="text-[10px] md:text-xs font-black text-gray-900 tracking-widest uppercase">Glosscut Partners</span>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[10px] md:text-xs font-black text-gray-400 tracking-widest uppercase">
                    <span>V2.4</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4C763B]"></span>
                    <span>SECURE NODE</span>
                </div>
            </div>
        </div>
    );
};

export default MobileOnlyGuard;
