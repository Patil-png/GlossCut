import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const Hero = () => {
    const navigate = useNavigate();

    // Configuration for the "Random Structure" of light beams


    return (
        <section className="relative w-full min-h-screen flex items-center bg-transparent overflow-hidden">
            {/* MAIN CONTENT */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Text Content */}
                <div className="flex flex-col items-start text-left mt-16 lg:mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-200 bg-white/90 backdrop-blur-sm mb-8 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
                        onClick={() => navigate('/all-services-search')}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                        <span className="text-sm font-medium text-gray-600 tracking-wide">New features are available</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-8"
                    >
                        <span className="block text-gray-900 whitespace-nowrap">Beautiful Gradients</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 mt-1 pb-2 whitespace-nowrap">
                            Made Effortlessly.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-gray-600 leading-relaxed max-w-xl mb-10 font-normal"
                    >
                        Create gradients step by step, adjust colours and angles, and export them instantly for your projects.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center gap-4 w-full mb-16"
                    >
                        <button
                            onClick={() => navigate('/customer-account-creation')}
                            className="px-10 py-4 bg-black text-white rounded-full font-semibold text-base hover:bg-gray-900 transition-colors active:scale-95 flex items-center gap-2 shadow-lg"
                        >
                            Get Started
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/all-services-search')}
                            className="px-10 py-4 bg-white text-gray-700 border border-gray-300 rounded-full font-semibold text-base hover:bg-gray-50 hover:border-gray-400 transition-colors active:scale-95 shadow-sm"
                        >
                            Learn More
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex items-center gap-6"
                    >
                        <div className="flex -space-x-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-md">
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
                                <span className="font-bold text-gray-900">4.8</span> ★★★★★
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right side - empty but keeps the layout */}
                <div className="hidden lg:block relative h-full min-h-[600px]">
                    {/* This space can be used for an image or illustration if needed */}
                </div>
            </div>
        </section>
    );
};

export default Hero;