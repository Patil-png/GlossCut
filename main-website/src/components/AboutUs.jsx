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
            name: "Shantanu Bodkhe",
            role: "Co-Founder & CMO",
            image: "/GlossCut.png",
            bio: "The driving force behind our brand's aura, dedicated to making premium grooming accessible to every modern individual."
        },
        {
            name: "Om Patil",
            role: "Co-Founder & CTO",
            image: "/GlossCut.png",
            bio: "Lead architect of the complete GlossCut ecosystem, engineering the elite digital platform that seamlessly powers the future of premium grooming."
        },
        {
            name: "Respected Partners",
            role: "The Heartbeat of GlossCut",
            image: "/GlossCut.png",
            bio: "Honoring the master artisans and dedicated professionals who deliver the premium GlossCut experience across every city."
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
                    <div className="absolute inset-0 bg-gray-100/40" />
                    <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[160px] opacity-[0.18] mix-blend-multiply animate-float"
                        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
                    <div className="absolute bottom-[-15%] left-[-5%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.15] mix-blend-multiply animate-float-delayed"
                        style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }} />
                </div>

                {/* Texture & Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4C763B]/10 backdrop-blur-md border border-[#4C763B]/20 mb-4">
                            <Sparkles size={14} className="text-[#4C763B]" />
                            <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-[#4C763B] uppercase">Our Story</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 font-serif leading-tight text-gray-900 tracking-tight">
                            Redefining the <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] via-green-600 to-[#1B3014]">Grooming Aura</span>
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
                            GlossCut isn't just an app—it's a premium ecosystem where technology honors the timeless craft of barbering.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* PHILOSOPHY & MISSION */}
            <section className="py-12 md:py-16 px-6 max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-[2px] bg-[#4C763B]"></div>
                            <span className="text-[#4C763B] font-black uppercase tracking-widest text-[10px] md:text-xs">The Philosophy</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 font-serif text-gray-900 leading-[1.1]">Merging Heritage <br /> with Innovation</h2>
                        <p className="text-gray-600 mb-4 text-sm md:text-base leading-relaxed font-medium">
                            Founded in 2024, GlossCut emerged from a simple observation: finding a premium haircut was harder than it should be. We saw talented barbers struggling to get noticed and customers tired of waiting in lines.
                        </p>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            We built a bridge. A platform that honors the traditional craft of barbering while bringing the effortless convenience of modern technology to your fingertips.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        {[
                            { icon: Users, title: "Community First", desc: "Empowering local artisans and salons to grow in the digital era." },
                            { icon: Award, title: "Unmatched Quality", desc: "Only the top-rated, strictly vetted professionals join our aura." },
                            { icon: Clock, title: "Zero Wait Time", desc: "Book your presence and walk in. Your time is as valuable as your look." },
                            { icon: ShieldCheck, title: "Secure & Verified", desc: "Trusted by thousands for safe, reliable, and premium grooming." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.03, y: -4 }}
                                className="bg-white p-6 rounded-[1.25rem] border border-gray-100 shadow-lg shadow-gray-100/50 hover:border-[#4C763B]/20 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-[#4C763B]/10 transition-colors">
                                    <item.icon className="text-[#4C763B]" size={20} />
                                </div>
                                <h3 className="text-base font-black mb-1.5 text-gray-900 leading-tight">{item.title}</h3>
                                <p className="text-gray-500 text-[12px] leading-relaxed font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM / LEADERSHIP */}
            <section className="py-12 md:py-16 bg-gray-50/50 border-y border-gray-100 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10 md:mb-12">
                        <h2 className="text-[10px] md:text-xs font-black text-[#4C763B] uppercase tracking-[0.4em] mb-2">Behind the Aura</h2>
                        <h3 className="text-2xl md:text-4xl font-serif font-black text-gray-900">Meet the Visionaries</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -6 }}
                                className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 group"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="p-6 text-center">
                                    <h4 className="text-lg font-black text-gray-900 mb-1">{member.name}</h4>
                                    <div className="inline-block px-3 py-1 rounded-full bg-[#4C763B]/10 text-[#4C763B] text-[9px] font-black uppercase tracking-widest mb-3">
                                        {member.role}
                                    </div>
                                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed">
                                        {member.bio}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DISCLOSURE CARD */}
            <section className="py-12 md:py-16 px-6 max-w-7xl mx-auto relative z-10">
                <div className="bg-white/80 backdrop-blur-3xl p-6 md:p-10 rounded-[1.5rem] border border-gray-100 shadow-xl flex flex-col md:flex-row gap-6 md:gap-10 items-center">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-[#4C763B]/10 flex items-center justify-center flex-shrink-0">
                        <Info className="text-[#4C763B]" size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black mb-3 font-serif text-gray-900">Important Platform Disclosure</h3>
                        <p className="text-gray-500 text-[13px] md:text-sm leading-relaxed font-medium mb-3">
                            GlossCut is an elite digital platform and aggregator designed to connect customers with independent premium barbershops. We do not own or operate physical salons. Service excellence is the responsibility of our third-party partners.
                        </p>
                        <p className="text-gray-400 text-[11px] italic">
                            Currently serving <span className="text-[#4C763B] font-bold">Maharashtra</span>. For inquiries: <span className="font-bold text-gray-600">support@glosscut.com</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 md:py-20 px-6 text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black mb-4 font-serif text-gray-900 leading-tight">Elevate Your Presence</h2>
                    <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md mx-auto font-medium">
                        Whether you're a stylist ready to scale or a client seeking the best look, the revolution starts here.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/all-services-search"
                            className="group px-8 py-3 bg-[#4C763B] text-white font-black text-base rounded-[1.25rem] hover:bg-[#3d5e2f] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-[#4C763B]/20 hover:-translate-y-1"
                        >
                            <Globe size={18} className="group-hover:rotate-12 transition-transform" />
                            Find a Salon
                        </Link>
                        <Link
                            to="/barber-account-creation"
                            className="group px-8 py-3 bg-white text-[#4C763B] font-black text-base rounded-[1.25rem] border-2 border-[#4C763B] hover:bg-gray-50 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                        >
                            <Award size={18} className="group-hover:scale-110 transition-transform" />
                            Partner With Us
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default AboutUs;
