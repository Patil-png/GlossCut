import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';

const Pricing = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Services & Pricing | GlossCut";
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black font-serif text-gray-900 mb-4 tracking-tight">Services & <span className="text-[#4C763B]">Pricing</span></h1>
                    <p className="text-gray-600 max-w-2xl mx-auto font-medium">Clear, transparent pricing in ₹ (INR) for premium grooming services and platform access.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Card 1: Standard Search */}
                    <motion.div
                        whileHover={{ y: -8 }}
                        className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-[1.5rem] p-8 flex flex-col relative overflow-hidden"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold font-serif text-gray-900 mb-2">Platform Access</h3>
                            <p className="text-gray-500 text-sm">Find top-rated local barbers and view shop details.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-gray-900">₹0</span>
                            <span className="text-gray-500 ml-2">/ free</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                <Check size={18} className="text-[#4C763B] shrink-0 mt-0.5" />
                                <span>Search salons near you</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                <Check size={18} className="text-[#4C763B] shrink-0 mt-0.5" />
                                <span>View real-time queues</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                <Check size={18} className="text-[#4C763B] shrink-0 mt-0.5" />
                                <span>Read verified reviews</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Card 2: Barber Subscription */}
                    <motion.div
                        whileHover={{ y: -8 }}
                        className="bg-gray-900 text-white border border-gray-800 shadow-2xl shadow-gray-900/20 rounded-[1.5rem] p-8 flex flex-col relative overflow-hidden transform scale-105 z-10"
                    >
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#d4af37] to-yellow-600"></div>
                        <div className="absolute top-6 right-6">
                            <span className="bg-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-[#d4af37]/30">Popular</span>
                        </div>
                        <div className="mb-6 pr-16">
                            <h3 className="text-xl font-bold font-serif mb-2">Barber Booking Subscription</h3>
                            <p className="text-gray-400 text-sm">For professional barbers mapping their shops & managing bookings.</p>
                        </div>
                        <div className="mb-8 flex items-end">
                            <span className="text-4xl font-black">₹999</span>
                            <span className="text-gray-400 ml-2 mb-1">/ month</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-sm text-gray-300">
                                <Star size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
                                <span>Premium Map Visibility</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-300">
                                <Zap size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
                                <span>Unlimited Online Bookings</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-300">
                                <Check size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
                                <span>Real-time shop visibility gating</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-300">
                                <Check size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
                                <span>Direct customer payouts</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Card 3: Premium Services */}
                    <motion.div
                        whileHover={{ y: -8 }}
                        className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-[1.5rem] p-8 flex flex-col relative overflow-hidden"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold font-serif text-gray-900 mb-2">In-Shop Services</h3>
                            <p className="text-gray-500 text-sm">Estimated local barber service costs (Varies by partner shop).</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-gray-900">Variable</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex flex-col gap-1 text-sm text-gray-700 border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900">Classic Haircut</span>
                                <span className="text-gray-500">₹150 - ₹500</span>
                            </li>
                            <li className="flex flex-col gap-1 text-sm text-gray-700 border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900">Beard Grooming</span>
                                <span className="text-gray-500">₹100 - ₹300</span>
                            </li>
                            <li className="flex flex-col gap-1 text-sm text-gray-700 border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900">Premium Facial</span>
                                <span className="text-gray-500">₹300 - ₹1200+</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
