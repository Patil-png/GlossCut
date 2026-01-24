import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Zap, Wallet, LayoutDashboard, ArrowRight } from 'lucide-react';

const BarberOnboarding = () => {
    const navigate = useNavigate();

    return (
        // Compact: py-16/20
        <section className="py-16 lg:py-20 bg-[#050505] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.08),transparent_50%)]"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-[2rem] border border-zinc-800/60 overflow-hidden shadow-2xl">

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-0">

                        {/* Left Content - Compact Padding */}
                        <div className="p-6 lg:p-10 flex flex-col justify-center relative z-20">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 bg-amber-900/20 border border-amber-500/10 px-2.5 py-0.5 rounded-full text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-4 w-fit">
                                    <Store size={10} /> Partner Program
                                </div>

                                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-[1.1] font-serif">
                                    Barber Shop Owner? <br />
                                    <span className="text-zinc-500">Level up your business.</span>
                                </h2>

                                <p className="text-zinc-400 text-base mb-8 leading-relaxed max-w-md font-light">
                                    List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily.
                                </p>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        { text: 'Zero listing fees', icon: <Zap size={16} className="text-amber-400" /> },
                                        { text: 'Instant daily payouts', icon: <Wallet size={16} className="text-amber-400" /> },
                                        { text: 'Advanced analytics', icon: <LayoutDashboard size={16} className="text-amber-400" /> }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm font-medium group">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors">
                                                {item.icon}
                                            </div>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => navigate('/barber-account-creation')}
                                    className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    Start Partner Registration <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        </div>

                        {/* Right Visual Side */}
                        <div className="relative min-h-[350px] lg:min-h-auto bg-[#080808] lg:border-l border-zinc-800/50 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_60%)]"></div>

                            <motion.div
                                initial={{ opacity: 0, rotateY: 20, scale: 0.9 }}
                                whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative w-full max-w-[85%] perspective-1000"
                            >
                                <div className="bg-[#0c0c0c] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden relative">
                                    <div className="h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-[#0a0a0a]">
                                        <div className="flex gap-1.5 opacity-50">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Total Revenue</p>
                                                <h3 className="text-2xl font-bold text-white">₹24,500<span className="text-zinc-600 text-sm font-normal">.00</span></h3>
                                            </div>
                                            <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">+12%</div>
                                        </div>

                                        {/* Bars */}
                                        <div className="h-20 flex items-end gap-1.5 mb-6">
                                            {[30, 50, 45, 75, 55, 90, 80].map((h, i) => (
                                                <div key={i} className="flex-1 bg-zinc-800/50 rounded-t-sm overflow-hidden h-full flex items-end">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        whileInView={{ height: `${h}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="w-full bg-gradient-to-t from-amber-700 to-amber-500 opacity-90"
                                                    ></motion.div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* List */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">A</div>
                                                    <span className="text-zinc-300 text-[10px] font-medium">Amit K.</span>
                                                </div>
                                                <span className="text-emerald-400 text-[10px] font-bold">+₹450</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-bold">R</div>
                                                    <span className="text-zinc-300 text-[10px] font-medium">Rahul S.</span>
                                                </div>
                                                <span className="text-emerald-400 text-[10px] font-bold">+₹250</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BarberOnboarding;
