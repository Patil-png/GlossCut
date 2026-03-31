import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Sparkles } from 'lucide-react';

const ContactUs = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Contact Us | GlossCut";
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] pt-24 pb-16 relative overflow-hidden">

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

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4C763B]/10 backdrop-blur-md border border-[#4C763B]/20 mb-6">
                            <Sparkles size={14} className="text-[#4C763B]" />
                            <span className="text-[10px] md:text-xs font-black tracking-[0.3em] text-[#4C763B] uppercase">Get In Touch</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-serif text-gray-900 mb-6 tracking-tight leading-[1.1]">
                            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Us</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-base md:text-lg leading-relaxed max-w-lg mx-auto">
                            Have questions or need support? We are here to help. Reach out to the GlossCut team during our business hours.
                        </p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">

                    {/* Contact Information */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:border-[#4C763B]/20 transition-all duration-500 group/main h-full"
                    >
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-8 border-l-4 border-[#4C763B] pl-4">Registered Office</h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-5 group/item">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover/item:bg-[#4C763B]/10 group-hover/item:rotate-6 transition-all duration-500">
                                    <MapPin className="text-[#4C763B]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Address</h3>
                                    <p className="text-gray-900 font-bold text-sm md:text-base leading-relaxed tracking-tight">
                                        MIDC Road, Amravati, Maharashtra - 444606
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group/item">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover/item:bg-[#4C763B]/10 group-hover/item:rotate-6 transition-all duration-500">
                                    <Mail className="text-[#4C763B]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Details</h3>
                                    <p className="text-xl font-black text-gray-900 tracking-tight">
                                        <a href="mailto:ombhaupatil@glosscut.com" className="hover:text-[#4C763B] transition-colors">
                                            ombhaupatil@glosscut.com
                                        </a>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">For support and standard inquiries</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group/item">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover/item:bg-[#4C763B]/10 group-hover/item:rotate-6 transition-all duration-500">
                                    <Phone className="text-[#4C763B]" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Direct Line</h3>
                                    <p className="text-xl font-black text-gray-900 tracking-tight">
                                        <a href="tel:+918799866811" className="hover:text-[#4C763B] transition-colors">
                                            +91 8799866811
                                        </a>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium italic">Available Mon-Sat (9:00 AM - 6:00 PM)</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-[#4C763B] uppercase tracking-[0.2em] mb-1">Registered Entity</p>
                                <p className="text-gray-900 font-black text-lg tracking-tight">Glosscut</p>
                                <p className="text-xs text-gray-500 font-medium italic">Proprietor: Om Bhaulal Patil</p>
                            </div>
                            <Sparkles className="text-[#4C763B]/20" size={24} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="bg-gray-900 rounded-[2rem] p-6 md:p-10 border border-gray-800 shadow-[0_40px_100px_rgba(0,0,0,0.3)] text-white relative overflow-hidden group h-full"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C763B]/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-700"></div>
                        
                        <h2 className="text-2xl font-black font-serif mb-8 border-l-4 border-green-500 pl-4">Business Hours</h2>
                        
                        <div className="space-y-4 mb-10">
                            {[
                                { day: "Monday - Friday", hours: "9:00 AM - 8:00 PM", status: "Active" },
                                { day: "Saturday", hours: "9:00 AM - 6:00 PM", status: "Active" },
                                { day: "Sunday", hours: "Closed", status: "Inactive" }
                            ].map((row, i) => (
                                <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-800/50 group/row">
                                    <span className="text-gray-400 font-bold text-sm tracking-tight group-hover/row:text-white transition-colors">{row.day}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-black text-sm tracking-tight ${row.status === 'Inactive' ? 'text-red-500/80' : 'text-white'}`}>
                                            {row.hours}
                                        </span>
                                        {row.status === 'Active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-start gap-4 hover:border-green-500/30 transition-all">
                            <Clock className="text-green-500 shrink-0 mt-1" size={20} />
                            <div>
                                <h3 className="font-black text-white text-sm mb-2 tracking-tight">Need immediate assistance?</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    For urgent issues regarding your booking or shop management, please call our direct line for the fastest response.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
