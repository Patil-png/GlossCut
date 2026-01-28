import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard, Tag, ShieldCheck } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const ValueProps = memo(() => {
    const props = [
        {
            icon: <Clock className="w-5 h-5 text-[#4C763B]" />,
            title: "Instant Booking",
            desc: "Real-time slots. No more waiting in queues.",
            border: "hover:border-[#4C763B]/30",
            bg: "hover:bg-[#4C763B]/5"
        },
        {
            icon: <CreditCard className="w-5 h-5 text-gray-900" />,
            title: "UPI Payments",
            desc: "Safe, direct payments to your barber via any app.",
            border: "hover:border-zinc-500/30",
            bg: "hover:bg-zinc-500/5"
        },
        {
            icon: <Tag className="w-5 h-5 text-[#4C763B]" />,
            title: "Smart Deals",
            desc: "Dynamic pricing and festival promos.",
            border: "hover:border-[#4C763B]/30",
            bg: "hover:bg-[#4C763B]/5"
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-gray-900" />,
            title: "Verified Shops",
            desc: "100% verified barbers with genuine reviews.",
            border: "hover:border-zinc-500/30",
            bg: "hover:bg-zinc-500/5"
        },
    ];

    return (
        // Compact: py-10
        <section id="features" className="py-10 relative z-10 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {props.map((prop, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeInUp}
                            // Compact: p-5/6
                            className={`group relative bg-white border border-gray-100 rounded-xl p-5 lg:p-6 overflow-hidden transition-all duration-500 shadow-sm hover:shadow-md ${prop.border} ${prop.bg}`}
                        >
                            {/* Subtle Gradient Spot */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full blur-[50px] group-hover:bg-gray-100 transition-all duration-500"></div>

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out`}>
                                    {prop.icon}
                                </div>

                                <h3 className="text-base font-bold text-gray-900 mb-2 tracking-tight">{prop.title}</h3>
                                <p className="text-gray-500 text-sm leading-snug group-hover:text-gray-700 transition-colors">{prop.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
});

export default ValueProps;
