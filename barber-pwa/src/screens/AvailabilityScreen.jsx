import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, ShieldCheck, ChevronRight, Info, Zap, Settings2 } from 'lucide-react';

const AvailabilityScreen = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Operating Hours",
            desc: "Set your daily shop opening and closing times.",
            icon: Clock,
            color: "bg-indigo-50 text-indigo-600",
            path: "/edit-operating-hours"
        },
        {
            title: "Booking Limits",
            desc: "Control maximum appointments allowed per day.",
            icon: Zap,
            color: "bg-amber-50 text-amber-600",
            path: "/edit-max-appointments"
        },
        {
            title: "Holiday Mode",
            desc: "Mark specific dates as unavailable for booking.",
            icon: Calendar,
            color: "bg-rose-50 text-rose-600",
            path: null,
            comingSoon: true
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center pb-24">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] relative min-h-screen flex flex-col">

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-widest">Availability</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pt-8">
                    {/* Hero */}
                    <div className="mb-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center justify-center text-indigo-600 mb-8"
                        >
                            <Settings2 size={28} strokeWidth={2.5} />
                        </motion.div>
                        <h2 className="text-3xl font-[950] text-gray-900 leading-tight">
                            Master Your Schedule
                        </h2>
                        <p className="text-[15px] text-gray-400 font-bold mt-4 leading-relaxed tracking-tight">
                            Define when customers can book your services. Precision scheduling leads to better business.
                        </p>
                    </div>

                    {/* Options List */}
                    <div className="space-y-4">
                        {sections.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => item.path && navigate(item.path)}
                                className={`p-5 rounded-[28px] border border-gray-100 bg-white shadow-sm flex items-center justify-between transition-all ${item.path ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : 'opacity-60 cursor-default'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                                        <item.icon size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[16px] font-black text-gray-900">{item.title}</h3>
                                            {item.comingSoon && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black text-gray-400 rounded-full uppercase tracking-widest">Soon</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                                    </div>
                                </div>
                                {item.path && <ChevronRight size={18} className="text-gray-300" />}
                            </motion.div>
                        ))}
                    </div>

                    {/* Smart Suggestion */}
                    <div className="mt-10 bg-emerald-50 rounded-[32px] p-6 border border-emerald-100 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <ShieldCheck size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-emerald-900 tracking-widest uppercase mb-1">Status: Open</h4>
                            <p className="text-[13px] text-emerald-700 font-bold leading-relaxed">
                                Your shop is currently visible to customers. Ensure your operating hours are up to date to avoid missed appointments.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="mt-auto px-8 pb-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-300 mb-2">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Automatic Sync Active</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AvailabilityScreen;
