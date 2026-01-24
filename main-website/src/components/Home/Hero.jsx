import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Star, Users, MapPin, Search, Clock, Wallet, Check, ChevronRight } from 'lucide-react';

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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
    };

    return (
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-48 overflow-hidden bg-[#050505] selection:bg-amber-500/30">
            {/* Premium Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Primary Glow - Reduced Blur for Performance */}
                <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(217,119,6,0.08)_0%,transparent_70%)] blur-[60px] translate-z-0"></div>
                {/* Secondary Accent */}
                <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(30,58,138,0.05)_0%,transparent_70%)] blur-[50px] translate-z-0"></div>

                {/* Animated Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>

                {/* Noise Texture for that "Premium" feel */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

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
                        {/* Wider width (420px) */}
                        <div className="relative mx-auto max-w-[380px]">
                            {/* Animated Background Aura */}
                            {/* Animated Background Aura - Optimized */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-amber-500/10 rounded-full blur-[60px] will-change-transform"></div>

                            {/* iPhone Frame */}
                            <div className="bg-black rounded-[3.5rem] p-[10px] border-[1px] border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative z-10 ring-1 ring-white/20">

                                {/* Screen - Reduced height to 580px */}
                                <div className="h-[600px] overflow-hidden rounded-[2.8rem] bg-black relative flex flex-col border border-white/5">

                                    {/* Dynamic Island */}
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-50 flex items-center justify-between px-5 border border-white/5 shadow-2xl">
                                        <div className="w-2 h-2 rounded-full bg-zinc-900"></div>
                                        <div className="w-9 h-1 bg-zinc-900 rounded-full"></div>
                                    </div>

                                    {/* Status Bar */}
                                    <div className="flex justify-between items-end px-10 pt-4 pb-2 text-white text-[10px] font-bold z-40">
                                        <span>9:41</span>
                                        <div className="flex gap-1.5 items-center">
                                            <div className="flex gap-0.5">
                                                <div className="w-1 h-2 bg-white rounded-full"></div>
                                                <div className="w-1 h-2 bg-white rounded-full"></div>
                                                <div className="w-1 h-2 bg-white/30 rounded-full"></div>
                                            </div>
                                            <Smartphone size={10} className="rotate-90 opacity-80" />
                                        </div>
                                    </div>

                                    {/* App Content */}
                                    <div className="pt-8 px-8 pb-6 flex-1 overflow-y-auto no-scrollbar relative">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Welcome back,</p>
                                                <h3 className="text-white font-serif text-2xl font-medium">Aditya</h3>
                                            </div>
                                            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500 ring-1 ring-white/10">
                                                <Users size={20} />
                                            </div>
                                        </div>

                                        {/* Main Booking Card */}
                                        <div className="relative mb-8">
                                            <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 to-transparent rounded-[2.2rem] blur-sm"></div>
                                            <div className="relative bg-[#111]/80 rounded-[2.2rem] p-6 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl">
                                                <div className="absolute -top-10 -right-10 p-4 opacity-10 rotate-12 bg-amber-500 w-32 h-32 rounded-full blur-3xl"></div>

                                                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 text-[9px] font-black px-2.5 py-1 rounded-full mb-4 uppercase tracking-wider border border-amber-500/20">
                                                    <Check size={10} strokeWidth={3} /> Confirmed
                                                </div>

                                                <h3 className="text-white font-bold text-xl mb-1 tracking-tight">Fade & Beard Trim</h3>
                                                <p className="text-zinc-400 text-xs font-medium mb-6">Today • 5:00 PM</p>

                                                <div className="flex items-center gap-4 pt-5 border-t border-white/5">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-amber-500 shadow-lg ring-1 ring-white/5">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-bold">Urban Cuts Studio</p>
                                                        <p className="text-zinc-500 text-[10px]">Raja Peth, Amravati</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* List Header */}
                                        <div className="mb-5 flex justify-between items-center px-1">
                                            <h4 className="text-white text-sm font-bold tracking-tight">Nearby Experts</h4>
                                            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest cursor-pointer">View all</span>
                                        </div>

                                        {/* List Items */}
                                        <div className="space-y-3">
                                            {[1, 2].map(i => (
                                                <div key={i} className="flex gap-4 p-3.5 rounded-[1.5rem] bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/60 transition-all duration-300 cursor-pointer group/item">
                                                    <div className="h-14 w-14 rounded-xl bg-zinc-800 relative overflow-hidden shrink-0 ring-1 ring-white/10">
                                                        <img src={`https://images.unsplash.com/photo-${i === 1 ? '1585747860715-2ba37e788b70' : '1503951914875-452162b7f30a'}?w=200&q=80`} className="object-cover w-full h-full opacity-80" alt="Salon" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 py-0.5">
                                                        <h5 className="text-white font-bold text-sm truncate">The Grooming Co.</h5>
                                                        <p className="text-zinc-500 text-[10px] mb-1">Men's Salon • 1.2 km</p>
                                                        <div className="flex items-center gap-1">
                                                            <Star size={10} className="text-amber-500 fill-amber-500" />
                                                            <span className="text-[10px] text-zinc-300 font-bold">4.8</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tab Bar */}
                                    <div className="h-20 bg-black/60 border-t border-white/5 backdrop-blur-3xl flex justify-around items-center px-10 relative z-20 pb-2">
                                        <div className="flex flex-col items-center gap-1.5 text-amber-500">
                                            <Search size={22} strokeWidth={2.5} />
                                            <div className="w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,1)]"></div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5 text-zinc-600"><Clock size={22} /></div>
                                        <div className="flex flex-col items-center gap-1.5 text-zinc-600"><Wallet size={22} /></div>

                                        {/* Home Indicator */}
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Paid Notification */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute top-28 -right-12 bg-black/90 backdrop-blur-2xl px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-20 w-44 ring-1 ring-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white font-bold">Paid Successfully</p>
                                        <p className="text-[8px] text-zinc-500 font-medium tracking-tight">Booking Confirmed</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
});

export default Hero;