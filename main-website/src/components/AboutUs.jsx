import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Clock, Sparkles, Globe, ShieldCheck, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "About GlossCut | Redefining Premium Grooming Experience";
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const teamMembers = [
        {
            name: "Om Patil",
            role: "Founder & CTO",
            image: "/GlossCut.png",
            bio: "Lead architect of the complete GlossCut ecosystem, engineering the elite digital platform that seamlessly powers the future of premium grooming."
        }
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-hidden">

            {/* BACKGROUND ATMOSPHERE (Standard across premium pages) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Mobile Background */}
                <div className="absolute inset-0 block lg:hidden z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
                    <div className="absolute top-[-10%] right-[-15%] w-[100vw] h-[100vw] rounded-full blur-[80px] opacity-30 mix-blend-multiply"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                </div>

                {/* Desktop Background */}
                <div className="hidden lg:block absolute inset-0 z-0 bg-gray-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50/50" />
                    <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.12] mix-blend-multiply animate-float"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.1] mix-blend-multiply animate-float-delayed"
                        style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
                </div>

                {/* Texture & Grid */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* HERO SECTION */}
            <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden pt-24 pb-12">
                <div className="relative z-10 text-center px-4 md:px-6 max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4C763B]/10 backdrop-blur-md border border-[#4C763B]/20 mb-6 cursor-default transition-all duration-300"
                        >
                            <Sparkles size={14} className="text-[#4C763B]" />
                            <span className="text-[10px] md:text-xs font-black tracking-[0.3em] text-[#4C763B] uppercase">Our Legacy</span>
                        </motion.div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 font-serif leading-[1.1] md:leading-[1.05] text-gray-900 tracking-tight">
                            Redefining the <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] via-green-600 to-[#1B3014]">Grooming Aura</span>
                        </h1>
                        <p className="text-base md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                            GlossCut isn't just an app—it's a premium ecosystem where high-end technology honors the timeless craft of barbering.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* PHILOSOPHY & MISSION */}
            <section className="py-10 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-[2px] bg-[#4C763B]"></div>
                            <span className="text-[#4C763B] font-black uppercase tracking-widest text-[10px] md:text-xs">The Philosophy</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 font-serif text-gray-900 leading-[1.1] tracking-tight">Merging Heritage <br /> with Innovation</h2>
                        <p className="text-gray-600 mb-6 text-base md:text-lg leading-relaxed font-medium italic border-l-4 border-[#4C763B]/20 pl-6 py-2">
                            "Finding a premium haircut shouldn't be a struggle. We built the digital bridge for modern excellence."
                        </p>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                            Founded in 2024, GlossCut emerged from a simple observation: talented barbers were struggling to get noticed while customers were tired of waiting in lines. We created a platform that honors traditional craft while bringing effortless convenience.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { icon: Users, title: "Community First", desc: "Empowering local artisans and salons to grow in the digital era." },
                            { icon: Award, title: "Unmatched Quality", desc: "Only the top-rated, strictly vetted professionals join our aura." },
                            { icon: Clock, title: "Zero Wait Time", desc: "Book your presence and walk in. Your time is as valuable as your look." },
                            { icon: ShieldCheck, title: "Secure & Verified", desc: "Trusted by thousands for safe, reliable, and premium grooming." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8 }}
                                className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-[#4C763B]/30 transition-all group"
                            >
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 md:mb-6 group-hover:bg-[#4C763B]/10 group-hover:rotate-6 transition-all duration-500">
                                    <item.icon className="text-[#4C763B] w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <h3 className="text-base md:text-lg font-black mb-2 text-gray-900 leading-tight tracking-tight">{item.title}</h3>
                                <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-medium opacity-80">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM / LEADERSHIP - Refined for single member */}
            <section className="py-12 md:py-32 bg-gray-50/50 border-y border-gray-100 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-[10px] md:text-xs font-black text-[#4C763B] uppercase tracking-[0.4em] mb-4">Behind the Aura</h2>
                        <h3 className="text-3xl md:text-5xl font-serif font-black text-gray-900 tracking-tight">The Visionary</h3>
                    </div>

                    <div className="flex justify-center">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative max-w-4xl w-full"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#4C763B]/5 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-green-500/5 rounded-full blur-3xl"></div>

                                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.06)] flex flex-col md:flex-row items-stretch group relative z-10 transition-all duration-700 hover:border-[#4C763B]/20">
                                    <div className="w-full md:w-1/2 min-h-[350px] md:min-h-0 overflow-hidden relative">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2.5s]"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white md:hidden overflow-hidden"></div>
                                    </div>
                                    <div className="p-8 md:p-14 md:w-1/2 text-center md:text-left flex flex-col justify-center bg-white relative z-10 -mt-10 md:mt-0 rounded-t-[2.5rem] md:rounded-none">
                                        <div className="inline-block self-center md:self-start px-4 py-1.5 rounded-full bg-[#4C763B]/10 text-[#4C763B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                            {member.role}
                                        </div>
                                        <h4 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 font-serif tracking-tight">{member.name}</h4>
                                        <p className="text-gray-500 text-xs md:text-lg font-medium leading-[1.6] md:leading-relaxed italic mb-8 border-l-2 border-gray-100 pl-6">
                                            "{member.bio}"
                                        </p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-[#4C763B]/40">
                                            <div className="w-8 h-[1px] bg-current"></div>
                                            <Sparkles size={16} className="text-[#4C763B]" />
                                            <div className="w-8 h-[1px] bg-current"></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DISCLOSURE CARD */}
            <section className="py-10 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
                <div className="bg-white/80 backdrop-blur-3xl p-6 md:p-14 rounded-[2.5rem] border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-6 md:gap-14 items-center group hover:border-[#4C763B]/20 transition-all duration-500">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-[#4C763B]/10 flex items-center justify-center flex-shrink-0 group-hover:rotate-3 transition-transform duration-500">
                        <Info className="text-[#4C763B] w-7 h-7 md:w-9 md:h-9" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-4 font-serif text-gray-900 tracking-tight">Platform Integrity</h3>
                        <p className="text-gray-500 text-base md:text-lg leading-relaxed font-medium mb-6 opacity-80">
                            GlossCut is an elite digital aggregator designed to bridge the gap between premium grooming services and the modern customer. We do not own physical salons, but we strictly vet every partner to ensure the "GlossCut Aura" is maintained across every service.
                        </p>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Globe size={14} className="text-[#4C763B]" />
                                <span className="text-gray-400">Serving <strong className="text-gray-600">Maharashtra</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Award size={14} className="text-[#4C763B]" />
                                <span className="text-gray-400">Contact: <strong className="text-gray-600">ombhaupatil@glosscut.com</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AboutUs.jsx Contact section replacement */}
            <section id="elevate-cta" className="py-12 md:py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-gray-100 scroll-mt-24 md:scroll-mt-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 font-serif text-gray-900 leading-tight tracking-tight">Elevate Your <br />Presence Today</h2>
                        <p className="text-base md:text-lg text-gray-600 mb-10 max-w-md font-medium leading-relaxed">
                            Whether you're a master stylist ready to scale or a client seeking the ultimate look, your journey starts here.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <Link
                                to="/all-services-search"
                                className="group px-10 py-5 bg-[#4C763B] text-white font-black text-lg rounded-2xl hover:bg-[#3d5e2f] transition-all flex items-center justify-center gap-4 shadow-[0_15px_30px_rgba(76,118,59,0.3)] hover:-translate-y-1.5"
                            >
                                <Globe size={20} className="group-hover:rotate-12 transition-transform" />
                                Find a Salon
                            </Link>
                            <Link
                                to="/barber-account-creation"
                                className="group px-10 py-5 bg-white text-[#4C763B] font-black text-lg rounded-2xl border-2 border-[#4C763B] hover:bg-gray-50 transition-all flex items-center justify-center gap-4 shadow-xl hover:-translate-y-1.5"
                            >
                                <Award size={20} className="group-hover:scale-110 transition-transform" />
                                Partner With Us
                            </Link>
                        </div>
                    </div>

                    {/* Legal Contact Info for PG Compliance */}
                    <div className="bg-gray-50/80 p-6 md:p-14 rounded-[2.5rem] border border-gray-100 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C763B]/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-700"></div>
                        <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 font-serif text-gray-900 tracking-tight flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-[#4C763B] rounded-full"></span>
                            Registered HQ
                        </h3>
                        <div className="space-y-8 text-sm md:text-base text-gray-600 font-medium">
                            <div>
                                <p className="text-[#4C763B] font-black text-xl mb-1 tracking-tight">Glosscut</p>
                                <p className="text-gray-900 font-bold opacity-70 italic text-sm">Proprietor: Om Bhaulal Patil</p>
                            </div>
                            <div className="pt-8 border-t border-gray-200 grid sm:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Electronic Mail</p>
                                    <p className="text-gray-800 font-bold hover:text-[#4C763B] transition-colors cursor-pointer">ombhaupatil@glosscut.com</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Social Aura</p>
                                    <a 
                                        href="https://www.instagram.com/glosscut.india/" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-gray-800 font-bold hover:text-[#4C763B] transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <Sparkles size={14} className="text-[#4C763B]" />
                                        @glosscut.india
                                    </a>
                                </div>
                            </div>
                            <div className="pt-6">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">Principal Place of Business</p>
                                <p className="text-[12px] text-gray-500 leading-relaxed max-w-sm">
                                    MIDC Road, Amravati, Maharashtra - 444606
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutUs;
