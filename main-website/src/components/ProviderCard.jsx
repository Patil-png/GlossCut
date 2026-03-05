import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Sparkles, Users, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';
import Image from './Image';
import StatusBadge from './StatusBadge';

// MEMOIZED Provider Card to prevent re-renders of the list
const ProviderCard = memo(({ provider, onClick, distance }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }} // Simplified transition
            className="group relative w-full h-full transform-gpu" // GPU accelerated
        >
            {/* Glow Effect behind card - simplified for mobile */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#4C763B]/20 to-green-500/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg hidden md:block" />

            {/* Main Card Container - Light Theme */}
            <div className="relative flex flex-col h-full bg-white border border-gray-200 rounded-[1.5rem] overflow-hidden shadow-xl shadow-gray-200/50 transition-all duration-300 group-hover:border-[#4C763B]/30 group-hover:shadow-[#4C763B]/10">

                {/* Image Area */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                    <Image
                        src={provider.image}
                        fallbackSrc="/GlossCut.png"
                        alt={`${provider.name} - Best ${provider.category || 'Salon'} in ${provider.address}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Subtle gradient for text readability if needed, but keeping it clean for light theme */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    <div className="absolute top-4 right-4 z-10">
                        <StatusBadge isAvailable={provider.isAvailable} isFullyBooked={provider.isFullyBooked} />
                    </div>

                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        {provider.rating > 0 && (
                            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{provider.rating.toFixed(1)}</span>
                            </div>
                        )}
                        <div className="hidden group-hover:flex items-center gap-1 bg-[#4C763B] backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm animate-in fade-in slide-in-from-left-2">
                            <Sparkles className="w-3 h-3 text-white" />
                            <span>Popular</span>
                        </div>
                    </div>
                    {/* Verified Badge */}
                    {provider.isVerified && (
                        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-blue-500 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-white" />
                            <span>Verified</span>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-5 pt-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#4C763B] transition-colors line-clamp-1 tracking-tight">{provider.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span className="line-clamp-1">{provider.address}</span>
                            </p>
                            {distance && (
                                <p className="text-xs text-[#4C763B] flex items-center gap-1.5 mt-1 font-bold">
                                    <Navigation className="w-3 h-3" />
                                    <span>{distance} km away</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tags/Services */}
                    {provider.services?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {provider.services.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100 font-medium">
                                    {typeof s === 'string' ? s : s.name}
                                </span>
                            ))}
                            {provider.services.length > 3 && (
                                <span className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-100 font-medium">
                                    +{provider.services.length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Divider - Darker at middle */}
                    <div className="mt-auto relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[92%] h-[1.5px] bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-70" />
                        <div className="flex items-center justify-between gap-4 pt-4">
                            <div className="text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {provider.isFullyBooked ? (
                                        <span>Full for today</span>
                                    ) : provider.estimatedWaitTime > 0 ? (
                                        <span className={provider.estimatedWaitTime > 45 ? "text-amber-600 font-bold" : "text-[#4C763B] font-bold"}>
                                            ~{provider.estimatedWaitTime} min wait
                                        </span>
                                    ) : (
                                        <span className="text-[#4C763B] font-bold">Available Now</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-gray-400" />
                                    <span>{provider.todaysBookings} booked</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onClick(provider)}
                                disabled={!provider.isAvailable || provider.isFullyBooked}
                                className={`
                  relative overflow-hidden pl-5 pr-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 shadow-lg active:scale-95
                  ${provider.isFullyBooked
                                        ? 'bg-amber-50 text-amber-600 border border-amber-100 cursor-not-allowed'
                                        : provider.isAvailable
                                            ? 'bg-gray-900 text-white shadow-gray-900/20 group/btn'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    }
                `}
                            >
                                {provider.isFullyBooked ? (
                                    <span>Done for Today</span>
                                ) : provider.isAvailable ? (
                                    <>
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#4C763B] to-green-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            Book <ArrowRight className="w-3.5 h-3.5 group-hover/btn:-rotate-45 transition-transform duration-300" />
                                        </span>
                                    </>
                                ) : (
                                    <span>Closed</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default ProviderCard;
