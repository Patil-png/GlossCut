import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, RefreshCcw, ShieldCheck,
    AlertCircle, Coins, Scale,
    ExternalLink, FileText, Lock
} from 'lucide-react';

const SECTIONS = [
    {
        number: '01',
        title: 'Aggregator Role',
        icon: ShieldCheck,
        accent: '#6366F1',
        bg: 'bg-indigo-50',
        content: "GlossCut acts strictly as a technology aggregator connecting customers with service providers (barbers/salons). We do not directly provide salon services and are not responsible for the service quality provided by individual shops.",
    },
    {
        number: '02',
        title: 'Cancellation Policy',
        icon: AlertCircle,
        accent: '#F59E0B',
        bg: 'bg-amber-50',
        content: "Appointments can be cancelled up to 2 hours before the scheduled time. Cancellations made within shorter windows may be subject to a cancellation fee as determined by the specific vendor.",
    },
    {
        number: '03',
        title: 'Refund as GlossCut Coins',
        icon: RefreshCcw,
        accent: '#10B981',
        bg: 'bg-emerald-50',
        content: "GlossCut operates on a 'No Cash Refund' policy. In the event of a valid issue, authorized refunds will be issued exclusively in the form of GlossCut Coins. These coins can be used for future bookings and have no monetary value outside the GlossCut platform.",
    },
    {
        number: '04',
        title: 'Dispute Resolution',
        icon: Scale,
        accent: '#EF4444',
        bg: 'bg-red-50',
        content: "Any disputes regarding service quality must be settled directly with the shop owner. GlossCut will facilitate communication but cannot guarantee cash compensation for service-related grievances.",
    },
];

const RefundPolicyScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HERO HEADER */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-500 pt-12 pb-16 px-6 overflow-hidden">
                <div className="relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-10 transition-transform active:scale-95"
                    >
                        <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
                    </button>

                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-full mb-6 border border-white/10">
                        <FileText size={13} className="text-indigo-200" strokeWidth={3} />
                        <span className="text-[10px] font-black text-white uppercase tracking-[1.5px]">Legal Document</span>
                    </div>

                    <h1 className="text-4xl font-[900] text-white mb-4 tracking-tight">Refund Policy</h1>
                    <p className="text-indigo-100 text-sm leading-relaxed max-w-[90%] font-medium">
                        Please read our Refund and Cancellation policies carefully.
                        By using GlossCut, you agree to these terms.
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-[-20px] right-[-40px] w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute bottom-[-60px] left-[-30px] w-32 h-32 rounded-full bg-white/5" />
            </div>

            <main className="px-6 -mt-8 relative z-20 pb-12">
                {/* BANNER */}
                <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-200 mb-8 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-200/50 flex items-center justify-center shrink-0">
                        <Coins size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-amber-900 mb-0.5 uppercase tracking-wide">No Cash Refund Policy</h4>
                        <p className="text-xs font-bold text-amber-700 opacity-80">All valid refunds are issued exclusively as GlossCut Coins.</p>
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
                            <p className="text-sm leading-relaxed text-slate-600 font-medium">
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
                            <span className="text-xs font-bold text-slate-700">Terms & Conditions</span>
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <ExternalLink size={12} />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-center gap-3 py-6 opacity-30">
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Updated: 07 February 2026</span>
                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                </div>
            </main>
        </div>
    );
};

export default RefundPolicyScreen;
