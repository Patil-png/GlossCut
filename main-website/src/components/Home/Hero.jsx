import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative w-full min-h-[100dvh] flex items-center bg-white overflow-hidden px-0">

            {/* ==================================================================================
                OPTIMIZED BACKGROUND (Zero Lag)
                Instead of using many heavy DOM nodes, we use CSS gradients.
            ================================================================================== */}

            {/* 1. Subtle Dot Pattern (Adds texture to the white part) */}
            <div className="absolute inset-0 z-0 opacity-[0.4]"
                style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* 2. The Pink Glow (The Orb) */}
            <div
                className="absolute right-[-10%] top-[-10%] w-[70%] h-[120%] rounded-full opacity-60 blur-[100px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, #EC4899 0%, #8B5CF6 50%, transparent 70%)',
                    willChange: 'transform' // GPU Acceleration hint
                }}
            />

            {/* 3. The Vertical "Curtain" Lines (Optimized: 1 Div instead of 20) 
                We use repeating-linear-gradient to draw lines via CSS. It is lightning fast.
            */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.4) 50px, rgba(255,255,255,0.4) 90px)',
                    maskImage: 'linear-gradient(to right, transparent, black 60%)', // Smooth fade in from left
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)'
                }}
            />

            {/* 4. White Fade Out (Left side readability) */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />


            {/* ==================================================================================
                MAIN CONTENT
            ================================================================================== */}
            <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-24 pb-12 lg:py-0">

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
                        className="text-[40px] sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.0] sm:leading-[1.1] tracking-tight mb-6 sm:mb-8"
                    >
                        <span className="block text-gray-900">Beautiful Gradients</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 pb-1">
                            Made Effortlessly.
                        </span>
                    </motion.h1>

                    {/* Description Paragraph */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-lg mb-8 sm:mb-12 font-normal"
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
                                    <Star key={i} size={16} className="fill-pink-500 text-pink-500" />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                                <span className="font-bold text-gray-900">4.8</span> from 10k+ reviews
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Spacer */}
                <div className="hidden lg:block relative h-full min-h-[600px] pointer-events-none" />
            </div>
        </section>
    );
};

export default Hero;