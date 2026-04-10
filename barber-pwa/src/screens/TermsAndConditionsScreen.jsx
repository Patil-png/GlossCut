import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, ShieldAlert, FileWarning,
    Scale, AlertTriangle, UserX,
    ExternalLink, BookOpen, Lock
} from 'lucide-react';

const SECTIONS = [
    {
        number: '01',
        title: 'Limitation of Liability',
        icon: ShieldAlert,
        accent: '#EF4444',
        bg: 'bg-red-50',
        content: "GlossCut is provided on an 'as is' basis without warranties of any kind. By using this platform, barbers and shop owners agree that Om B. Patil and GlossCut cannot be held liable for any direct, indirect, incidental, or consequential damages, including loss of revenue, data, or business interruptions.",
    },

    {
        number: '02',
        title: 'No Service Guarantee',
        icon: AlertTriangle,
        accent: '#F59E0B',
        bg: 'bg-amber-50',
        content: "GlossCut acts exclusively as a technology aggregator and queue management platform. We do not guarantee server uptime, unbroken connectivity, or the successful completion of any transaction between a shop owner and a customer.",
    },
    {
        number: '03',
        title: 'Independent Contractors',
        icon: UserX,
        accent: '#6366F1',
        bg: 'bg-indigo-50',
        content: "Barbers and Shop Owners using GlossCut are independent providers, not employees or agents of GlossCut. Any service disputes, injuries, or legal actions arising within the barber shop must be handled directly between the shop and the customer.",
    },
    {
        number: '04',
        title: 'Platform Modifications',
        icon: Scale,
        accent: '#10B981',
        bg: 'bg-emerald-50',
        content: "GlossCut and its creator (Om B. Patil) reserve the right to modify, suspend, or discontinue the platform or any service at any time without prior notice or liability to any third party.",
    },
];

const TermsAndConditionsScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HERO HEADER */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 pt-12 pb-16 px-6 overflow-hidden">
                <div className="relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-10 transition-transform active:scale-95 border border-white/5"
                    >
                        <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
                    </button>

                    <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-full mb-6 border border-red-500/30">
                        <FileWarning size={13} className="text-red-300" strokeWidth={3} />
                        <span className="text-[10px] font-black text-red-100 uppercase tracking-[1.5px]">Legal Shield</span>
                    </div>

                    <h1 className="text-4xl font-[900] text-white mb-4 tracking-tight">Terms & Liability</h1>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-[90%] font-medium">
                        By using the GlossCut platform, you explicitly agree to these governing terms and personal liability limitations.
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-[-20px] right-[-40px] w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute bottom-[-60px] left-[-30px] w-32 h-32 rounded-full bg-white/5" />
            </div>

            <main className="px-6 -mt-8 relative z-20 pb-12">
                {/* BANNER */}
                <div className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-200 mb-8 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-red-200/50 flex items-center justify-center shrink-0">
                        <ShieldAlert size={20} className="text-red-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-red-900 mb-0.5 uppercase tracking-wide">Liability Waiver Active</h4>
                        <p className="text-xs font-bold text-red-700 opacity-80">GlossCut is provided 'as is' without warranties.</p>
                    </div>
                </div>

                {/* SECTIONS */}
                <div className="space-y-4 mb-10">
                    {SECTIONS.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-3xl p-6 ${section.bg} border-l-[4px] shadow-sm flex flex-col gap-4`}
                            style={{ borderLeftColor: section.accent }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${section.accent}22` }}>
                                    <section.icon size={22} style={{ color: section.accent }} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black tracking-widest mb-1 block" style={{ color: section.accent }}>{section.number}</span>
                                    <h3 className="text-lg font-[800] text-slate-800 tracking-tight">{section.title}</h3>
                                </div>
                            </div>
                            <div className="h-[1px] w-full" style={{ backgroundColor: `${section.accent}22` }} />
                            <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-line">
                                {section.content}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* LEGAL LINKS */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 ml-1">
                        <Lock size={14} className="text-slate-400" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[1.5px]">Legal Resources</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer"
                            onClick={() => window.open('https://www.glosscut.com/privacy', '_blank')}
                        >
                            <span className="text-xs font-bold text-slate-700">Privacy Policy</span>
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <ExternalLink size={12} />
                            </div>
                        </motion.div>
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer"
                            onClick={() => window.open('https://www.glosscut.com/terms', '_blank')}
                        >
                            <span className="text-xs font-bold text-slate-700">Full Website Terms</span>
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <ExternalLink size={12} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-3 py-6 opacity-30">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Effective: March 12, 2026</span>
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditionsScreen;
