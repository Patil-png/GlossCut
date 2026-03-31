import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { RefreshCcw, AlertCircle, Coins, ShieldCheck, Clock, Mail, MapPin, Globe } from 'lucide-react';

const RefundPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden">
            <Helmet>
                <title>Refund & Cancellation Policy | GlossCut Premium</title>
                <meta name="description" content="Official Refund and Cancellation Policy for GlossCut. Learn about our coin-based refund system and aggregator role." />
                <link rel="canonical" href="https://www.glosscut.com/refund-policy" />
            </Helmet>

            {/* BACKGROUND ATMOSPHERE */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.12] mix-blend-multiply animate-float"
                    style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.1] mix-blend-multiply animate-float-delayed"
                    style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />

                {/* Texture & Grid */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32">

                {/* HERO SECTION */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-center mb-24"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4C763B]/10 backdrop-blur-md border border-[#4C763B]/20 mb-8 cursor-default"
                    >
                        <RefreshCcw size={14} className="text-[#4C763B] animate-spin-slow" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-[#4C763B] uppercase">Service Ethics</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-7xl font-black mb-8 font-serif leading-[1.1] text-gray-900 tracking-tight">
                        Refund & <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] via-green-600 to-[#1B3014]">Cancellation Aura</span>
                    </h1>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-400 font-bold uppercase tracking-widest">
                        <span>Last Updated: Feb 10, 2026</span>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#4C763B]/40" />
                            Compliance Ver. 2.4.0
                        </span>
                    </div>
                </motion.div>

                {/* POLICY CONTENT */}
                <div className="space-y-24">

                    {/* 1. Aggregator Role */}
                    <Section number="01" title="The Aggregator Role">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gray-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                                <p className="mb-6 leading-relaxed">
                                    <strong className="text-gray-900">GlossCut</strong> operates strictly as a premium technology aggregator, maintaining the elite digital bridge between refined customers and independent grooming professionals.
                                </p>
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    We provide the platform, the booking system, and the "GlossCut Aura." However, the actual delivery of grooming services is the sole responsibility of the independent partner shops.
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 2. Cancellation Standards */}
                    <Section number="02" title="Cancellation Standards">
                        <div className="bg-white/80 backdrop-blur-3xl p-6 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C763B]/5 rounded-bl-full translate-x-10 -translate-y-10"></div>

                            <div className="grid lg:grid-cols-2 gap-12 items-start relative z-10 text-left">
                                <div className="w-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Clock className="text-[#4C763B] shrink-0" size={24} />
                                        <h4 className="text-xl font-black text-gray-900 font-serif underline decoration-[#4C763B]/20 underline-offset-8">2-Hour Window</h4>
                                    </div>
                                    <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                                        Appointments can be modified or cancelled up to <strong className="text-gray-900">2 hours prior</strong> to the scheduled time without any platform penalties.
                                    </p>
                                    <div className="p-5 md:p-6 bg-red-50 rounded-2xl border border-red-100/50">
                                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">Penalty Disclosure</p>
                                        <p className="text-xs text-red-700 leading-relaxed font-bold">
                                            Cancellations within 2 hours or "No-Shows" attract a fee of up to 50% of the service value to compensate our platform partners for the reserved time.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 w-full">
                                    <h4 className="text-sm font-black text-[#4C763B] uppercase tracking-[0.2em] mb-4">Non-Refundable Items</h4>
                                    {[
                                        { title: "Convenience Fees", desc: "Digital processing and booking platform charges." },
                                        { title: "Late Cancellations", desc: "Cancellations initiated within the 2-hour window." },
                                        { title: "Completed Services", desc: "Services already rendered at the partner shop." }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ x: 10 }}
                                            className="flex gap-4 items-start"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#4C763B] mt-2 group-hover:scale-150 transition-transform shrink-0"></div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm tracking-tight">{item.title}</p>
                                                <p className="text-[11px] text-gray-400 font-medium leading-tight">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 3. The Coin Refund System */}
                    <Section number="03" title="GlossCut Coin Ecosystem">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card
                                icon={<Coins className="text-[#4C763B]" size={28} />}
                                title="No-Cash Policy"
                                desc="Authorized refunds are strictly credited as GlossCut Coins back to your digital wallet."
                            />
                            <Card
                                icon={<RefreshCcw className="text-[#4C763B]" size={28} />}
                                title="Instant Utility"
                                desc="Coins can be used 1:1 on any future booking with zero expiration and instant application."
                            />
                        </div>
                        <div className="mt-12 p-6 bg-[#4C763B]/5 rounded-2xl border border-[#4C763B]/10 flex items-start gap-4">
                            <AlertCircle className="text-[#4C763B] shrink-0 mt-1" size={20} />
                            <p className="text-xs text-[#4C763B] font-bold leading-relaxed italic">
                                *Refund processing window: 5-7 business days for high-tier balance verification. Coins cannot be converted into Fiat currency (INR) or withdrawn.
                            </p>
                        </div>
                    </Section>

                    {/* 4. Support Aura */}
                    <Section number="04" title="Reach Support Aura">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    Should you experience a technical failure or a duplicate charge, our support elite is ready to assist within 24 hours of the incident.
                                </p>
                                <div className="space-y-6">
                                    <ContactItem
                                        icon={<Mail size={18} />}
                                        label="Dispatch Email"
                                        value="ombhaupatil@glosscut.com"
                                        link="mailto:ombhaupatil@glosscut.com"
                                    />
                                    <ContactItem
                                        icon={<MapPin size={18} />}
                                        label="Instagram Handle"
                                        value="@glosscut.india"
                                        link="https://www.instagram.com/glosscut.india/"
                                    />
                                    <ContactItem
                                        icon={<Globe size={18} />}
                                        label="Customer Aura"
                                        value="+91 87998 66811"
                                        link="tel:+918799866811"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50/80 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C763B]/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-700"></div>
                                <h4 className="text-xl font-black mb-8 font-serif text-gray-900 tracking-tight flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-[#4C763B] rounded-full"></span>
                                    Registered HQ
                                </h4>
                                <div className="space-y-6 text-sm text-gray-600 font-medium">
                                    <div>
                                        <p className="text-[#4C763B] font-black text-xl mb-1 tracking-tight">Glosscut</p>
                                        <p className="text-gray-900 font-bold opacity-70 italic text-sm">Proprietor: Om Bhaulal Patil</p>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Official Place of Business</p>
                                        <p className="text-xs text-gray-500 leading-relaxed max-sm:text-[11px]">
                                            MIDC Road, Amravati, Maharashtra - 444606
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 pt-12 border-t border-gray-100 text-center"
                >
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">© 2026 GlossCut Technologies • All Rights Reserved</p>
                </motion.div>
            </div>
        </div>
    );
};

const Section = ({ number, title, children }) => (
    <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
    >
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="w-16 h-16 md:w-14 md:h-14 rounded-full border-2 border-[#4C763B]/10 flex items-center justify-center shrink-0 font-serif text-xl md:text-lg font-black text-[#4C763B]/40">
                {number}
            </div>
            <div className="flex-1 w-full mt-2">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 font-serif tracking-tight">{title}</h2>
                <div className="text-base md:text-lg leading-relaxed text-gray-600 font-medium">
                    {children}
                </div>
            </div>
        </div>
    </motion.section>
);

const Card = ({ icon, title, desc }) => (
    <motion.div
        whileHover={{ y: -8 }}
        className="bg-white/80 backdrop-blur-md p-6 h-full md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] group hover:border-[#4C763B]/20 transition-all text-left"
    >
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-[#4C763B]/10 transition-colors duration-500">
            {icon}
        </div>
        <h4 className="text-lg font-black text-gray-900 mb-3 tracking-tight">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

const ContactItem = ({ icon, label, value, link }) => (
    <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-4 group">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#4C763B]/10 group-hover:text-[#4C763B] transition-all">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-700 group-hover:text-[#4C763B] transition-colors">{value}</p>
        </div>
    </a>
);

export default RefundPolicy;
