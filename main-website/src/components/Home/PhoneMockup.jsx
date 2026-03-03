import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Star, Users, MapPin, Search, Clock, Wallet, Check } from 'lucide-react';

const PhoneMockup = memo(() => {
    return (
        <div className="relative mx-auto max-w-[380px]">
            {/* Animated Background Aura - Optimized (No Pulse, Will Change) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-amber-500/10 rounded-full blur-[60px] will-change-transform"></div>

            {/* iPhone Frame */}
            <div className="bg-black rounded-[3.5rem] p-[10px] border-[1px] border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative z-10 ring-1 ring-white/20">

                {/* Screen - Height 600px */}
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
                            {[0, 1].map((i) => (
                                <div key={i} className="flex gap-4 p-3.5 rounded-[1.5rem] bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/60 transition-all duration-300 cursor-pointer group/item">
                                    <div className="h-14 w-14 rounded-xl bg-zinc-800 relative overflow-hidden shrink-0 ring-1 ring-white/10">
                                        <img src="/GlossCut.png" className="object-cover w-full h-full opacity-80" alt="Salon" />
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

            {/* Floating Paid Notification - Disabled Motion on Mobile via Media Query logic in CSS or Framer Motion variants */}
            {/* Added: hidden on mobile to improve performance, or reduce animation complexity */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-28 -right-12 bg-black/90 backdrop-blur-2xl px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-20 w-44 ring-1 ring-white/5 hidden sm:block"
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
    );
});

export default PhoneMockup;
