import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const ContactUs = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Contact Us | GlossCut";
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] pt-24 pb-16 relative overflow-hidden">

            {/* Background Elements */}
            <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#4C763B]/5 to-transparent z-0 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                        <h1 className="text-4xl md:text-5xl font-black font-serif text-gray-900 mb-4 tracking-tight">Contact <span className="text-[#4C763B]">Us</span></h1>
                        <p className="text-gray-600 font-medium text-lg leading-relaxed">
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
                        className="bg-white rounded-[1.5rem] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/50"
                    >
                        <h2 className="text-2xl font-black font-serif text-gray-900 mb-8">Registered Office Info</h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-[#4C763B]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4C763B] transition-colors">
                                    <MapPin className="text-[#4C763B] group-hover:text-white transition-colors" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Address</h3>
                                    <p className="text-gray-900 font-medium text-base leading-relaxed">
                                        5A, Rukhmini Nagar, Bypass Road, Vidhyapith Colony, Behind Avtar Meher Baba Center, Amravati, Maharashtra - 444606
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-[#4C763B]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4C763B] transition-colors">
                                    <Mail className="text-[#4C763B] group-hover:text-white transition-colors" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email Details</h3>
                                    <p className="text-lg font-bold text-gray-900">
                                        <a href="mailto:ombhaupatil3107@gmail.com" className="hover:text-[#4C763B] transition-colors">
                                            ombhaupatil3107@gmail.com
                                        </a>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">For support and standard inquiries</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-[#4C763B]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4C763B] transition-colors">
                                    <Phone className="text-[#4C763B] group-hover:text-white transition-colors" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Direct Line</h3>
                                    <p className="text-lg font-bold text-gray-900">
                                        <a href="tel:+918799866811" className="hover:text-[#4C763B] transition-colors">
                                            +91 8799866811
                                        </a>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Available Mon-Sat (9:00 AM - 6:00 PM)</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[#4C763B] font-bold text-lg mb-1">Registered Business Name: Glosscut</p>
                            <p className="text-gray-600 font-medium">Proprietor: Om Bhaulal Patil</p>
                        </div>
                    </motion.div>

                    {/* Support / Quick Message (Optional visual block) */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="bg-gray-900 rounded-[1.5rem] p-8 md:p-10 border border-gray-800 shadow-2xl shadow-gray-900/40 text-white"
                    >
                        <h2 className="text-2xl font-black font-serif mb-6">Business Hours</h2>
                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <span className="text-gray-400 font-medium">Monday - Friday</span>
                                <span className="font-bold">9:00 AM - 8:00 PM</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <span className="text-gray-400 font-medium">Saturday</span>
                                <span className="font-bold">9:00 AM - 6:00 PM</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Sunday</span>
                                <span className="text-[#d4af37] font-bold">Closed</span>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 flex items-start gap-4">
                            <Clock className="text-[#d4af37] shrink-0" size={24} />
                            <div>
                                <h3 className="font-bold text-white mb-2">Need immediate assistance?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
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
