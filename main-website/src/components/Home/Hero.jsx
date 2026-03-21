import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
    const navigate = useNavigate();

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    return (
        // CHANGED: 'min-h-[100dvh]' -> 'min-h-auto lg:min-h-[100dvh]'
        // On mobile, let content define height to avoid large gaps. On desktop, keep full screen.
        <section className="relative w-full min-h-auto lg:min-h-[100dvh] flex items-start lg:items-center bg-transparent overflow-hidden px-0">

            {/* ==================================================================================
                MAIN CONTENT
            ================================================================================== */}

            {/* CHANGED: Adjusted padding 'pt-28 pb-16' for better mobile clearance, 'lg:py-0' keeps desktop centered */}
            <motion.div
                className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center pt-28 pb-16 lg:py-0"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >

                {/* Left Text Content */}
                <div className="flex flex-col items-start text-left">


                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-200 bg-white/70 mb-4 sm:mb-8 hover:border-gray-300 transition-colors cursor-pointer shadow-sm group"
                        onClick={() => navigate('/all-services-search')}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] group-hover:scale-125 transition-transform" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600 tracking-wide">Available in Amravati</span>
                    </motion.div>

                    {/* Headline */}
                    {/* Headline */}
                    <motion.h1
                        variants={itemVariants}
                        // CHANGED: 'text-[40px]' -> 'text-4xl' for safer mobile fit, keeping larger sizes for sm/lg
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] sm:leading-[1.1] tracking-tight mb-3 sm:mb-8"
                    >
                        <span className="block text-gray-900">Book Your Salon</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#4C763B] to-green-600 pb-1">
                            Slot Effortlessly.
                        </span>
                    </motion.h1>

                    {/* Description Paragraph */}
                    {/* Description Paragraph */}
                    <motion.p
                        variants={itemVariants}
                        // CHANGED: 'text-lg' -> 'text-base sm:text-xl' for better readability on small screens
                        className="text-base sm:text-xl text-gray-700 leading-relaxed max-w-lg mb-5 sm:mb-12 font-normal"
                    >
                        Find and schedule your next haircut, shave, or massage. Choose your preferred time, stylist, and service instantly for a seamless experience.</motion.p>

                    {/* Buttons - Hidden on mobile */}
                    <motion.div
                        variants={itemVariants}
                        className="hidden sm:flex sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-10 sm:mb-16"
                    >
                        <button
                            onClick={() => window.location.href = 'https://partner.glosscut.com/login'}
                            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 bg-gray-900 text-white rounded-full font-bold text-base hover:bg-black hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all duration-300"
                        >
                            Download App
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/all-services-search')}
                            className="w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-base hover:bg-gray-50 hover:border-gray-300 active:scale-95 shadow-sm justify-center flex transition-all duration-300"
                        >
                            Book Now
                        </button>
                    </motion.div>

                </div>

                {/* Right Spacer (Hidden on Mobile) */}
                <div className="hidden lg:block relative h-full min-h-[600px] pointer-events-none" />
            </motion.div>
        </section>
    );
};

export default Hero;