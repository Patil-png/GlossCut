import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const Hero = () => {
    const navigate = useNavigate();

    return (
        // CHANGED: 'min-h-[100dvh]' -> 'min-h-auto lg:min-h-[100dvh]'
        // On mobile, let content define height to avoid large gaps. On desktop, keep full screen.
        <section className="relative w-full min-h-auto lg:min-h-[100dvh] flex items-start lg:items-center bg-transparent overflow-hidden px-0">

            {/* ==================================================================================
                MAIN CONTENT
            ================================================================================== */}

            {/* CHANGED: Adjusted padding 'pt-28 pb-16' for better mobile clearance, 'lg:py-0' keeps desktop centered */}
            <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-28 pb-16 lg:py-0">

                {/* Left Text Content */}
                <div className="flex flex-col items-start text-left">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm mb-6 sm:mb-8 hover:border-gray-300 transition-colors cursor-pointer shadow-sm group"
                        onClick={() => navigate('/all-services-search')}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] group-hover:scale-125 transition-transform" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600 tracking-wide">New features available</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        // CHANGED: 'text-[40px]' -> 'text-4xl' for safer mobile fit, keeping larger sizes for sm/lg
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] sm:leading-[1.1] tracking-tight mb-6 sm:mb-8"
                    >
                        <span className="block text-gray-900">Beautiful Gradients</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#4C763B] to-green-600 pb-1">
                            Made Effortlessly.
                        </span>
                    </motion.h1>

                    {/* Description Paragraph */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        // CHANGED: 'text-lg' -> 'text-base sm:text-xl' for better readability on small screens
                        className="text-base sm:text-xl text-gray-600 leading-relaxed max-w-lg mb-8 sm:mb-12 font-normal"
                    >
                        Create gradients step by step, adjust colours and angles, and export them instantly for your projects.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-12 sm:mb-16"
                    >
                        <button
                            onClick={() => navigate('/customer-account-creation')}
                            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 bg-gray-900 text-white rounded-full font-semibold text-base hover:bg-black hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                        >
                            Get Started
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/all-services-search')}
                            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold text-base hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm justify-center flex"
                        >
                            Learn More
                        </button>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-wrap items-center gap-4 sm:gap-6"
                    >
                        <div className="flex -space-x-3 sm:-space-x-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-white bg-gray-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col">
                            <div className="flex gap-0.5 mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-[#4C763B] text-[#4C763B]" />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                                <span className="font-bold text-gray-900">4.8</span> from 10k+ reviews
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Spacer (Hidden on Mobile) */}
                <div className="hidden lg:block relative h-full min-h-[600px] pointer-events-none" />
            </div>
        </section>
    );
};

export default Hero;