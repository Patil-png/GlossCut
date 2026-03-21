import React from 'react';
import { ShieldCheck, Zap, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustSignals = () => {
    const signals = [
        {
            icon: ShieldCheck,
            title: 'Verified Shops',
            desc: 'Every salon is manually verified for quality.',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            icon: Zap,
            title: 'Live Tracking',
            desc: 'Real-time queue status and updates.',
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            icon: Clock,
            title: 'Instant Booking',
            desc: 'Book your slot in less than 30 seconds.',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: Star,
            title: 'Premium Styling',
            desc: 'Hand-picked stylists for the best results.',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        }
    ];

    return (
        <section className="py-12 px-4 md:hidden bg-white">
            <div className="max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    {signals.map((signal, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 flex flex-col gap-3"
                        >
                            <div className={`w-10 h-10 rounded-xl ${signal.bg} flex items-center justify-center`}>
                                <signal.icon className={signal.color} size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">{signal.title}</h3>
                                <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">
                                    {signal.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustSignals;
