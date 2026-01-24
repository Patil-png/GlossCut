import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Star, ChevronRight } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

const Hero = memo(() => {
    const navigate = useNavigate();

    // Animation Variants for staggered entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 0.8
            }
        }
    };

    return (
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-48 overflow-hidden bg-[#050505] selection:bg-amber-500/30">
            {/* Premium Background Atmosphere - Fade in for smoothness */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 pointer-events-none"
            >
                {/* Primary Glow - Reduced Blur for Performance */}
                <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(217,119,6,0.08)_0%,transparent_70%)] blur-[40px] lg:blur-[60px] translate-z-0 opacity-50 lg:opacity-100"></div>
                {/* Secondary Accent */}
                <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(30,58,138,0.05)_0%,transparent_70%)] blur-[30px] lg:blur-[50px] translate-z-0 opacity-50 lg:opacity-100"></div>

                {/* Animated Grid Overlay */}
                {/* Animated Grid Overlay - Reduced opacity on mobile */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-30 lg:opacity-100"></div>

                {/* Noise Texture for that "Premium" feel */}
                {/* Noise Texture - Desktop Only */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] hidden lg:block"></div>
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left Content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center lg:text-left flex flex-col items-center lg:items-start"
                    >
                        {/* Live Badge */}
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/80 border border-white/10 mb-8 backdrop-blur-xl shadow-2xl ring-1 ring-white/5"
                        >
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                            </div>
                            <span className="text-zinc-300 text-[11px] font-bold tracking-[0.1em] uppercase">
                                Live in <span className="text-amber-400">Amravati & Nagpur</span>
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl sm:text-6xl lg:text-8xl font-black text-white tracking-tight leading-[1] mb-8 font-serif"
                        ><span className="block relative mt-2">
                                Find{" "}
                                <span className="absolute -inset-2 blur-3xl bg-amber-500/25 rounded-full"></span>
                                <span className="relative text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-400 to-amber-700">
                                    Best Salon Shop
                                </span>
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            variants={itemVariants}
                            className="text-lg lg:text-xl text-zinc-400 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
                        >
                            GlossCut elevates your grooming experience. Discover nearby talent, skip the queue with real-time slots, and pay instantly via UPI.
                        </motion.p>

                        {/* Buttons */}
                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-12">
                            <button className="group relative flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-bold text-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] w-full sm:w-auto overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Smartphone className="w-5 h-5 relative z-10 transition-transform group-hover:-rotate-12" />
                                <span className="relative z-10">Download App</span>
                            </button>

                            <button
                                onClick={() => navigate('/barber-account-creation')}
                                className="flex items-center justify-center gap-3 bg-zinc-900/40 text-zinc-100 border border-zinc-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 hover:border-zinc-600 transition-all w-full sm:w-auto backdrop-blur-md group"
                            >
                                List Your Shop
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div variants={itemVariants} className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center overflow-hidden shadow-xl ring-1 ring-white/10">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 w-px bg-zinc-800"></div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="flex text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    </div>
                                    <span className="font-black text-white ml-1">4.9</span>
                                </div>
                                <p className="text-zinc-500 text-[13px] font-semibold uppercase tracking-wider">Trusted by 10k+ users</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Side Visual - Wide iOS Mockup (Original Height) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                        animate={{ opacity: 1, scale: 1, rotateY: -8 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative hidden lg:block perspective-2000 will-change-transform"
                    >
                        <PhoneMockup />
                    </motion.div>
                </div>
            </div>
        </section>
    );
});

export default Hero;