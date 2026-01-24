import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Sparkles, Users, ArrowRight } from 'lucide-react';
import Image from './Image';
import StatusBadge from './StatusBadge';

// MEMOIZED Provider Card to prevent re-renders of the list
const ProviderCard = memo(({ provider, onClick }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }} // Simplified transition
            className="group relative w-full h-full"
        >
            {/* Glow Effect behind card - simplified */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />

            <div className="relative flex flex-col h-full bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-white/10">

                {/* Image Area */}
                <div className="relative h-56 overflow-hidden bg-gray-900">
                    <Image
                        src={provider.image}
                        fallbackSrc="/GlossCut.png"
                        alt={provider.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

                    <div className="absolute top-4 right-4 z-10">
                        <StatusBadge isAvailable={provider.isAvailable} />
                    </div>

                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        {provider.rating > 0 && (
                            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-xs font-medium text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{provider.rating.toFixed(1)}</span>
                            </div>
                        )}
                        <div className="hidden group-hover:flex items-center gap-1 bg-blue-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-blue-500/20 text-xs font-medium text-blue-300 animate-in fade-in slide-in-from-left-2">
                            <Sparkles className="w-3 h-3" />
                            <span>Popular</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-5 pt-2">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{provider.name}</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                <span className="line-clamp-1">{provider.address}</span>
                            </p>
                        </div>
                    </div>

                    {/* Tags/Services */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                        {provider.services?.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">
                                {typeof s === 'string' ? s : s.name}
                            </span>
                        ))}
                        {(provider.services?.length || 0) > 3 && (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-500 border border-white/5">
                                +{provider.services.length - 3} more
                            </span>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Next slot: Today</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{provider.todaysBookings} booked</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onClick(provider)}
                                disabled={!provider.isAvailable}
                                className={`
                  relative overflow-hidden pl-4 pr-3 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300
                  ${provider.isAvailable
                                        ? 'bg-white text-black hover:bg-blue-50 hover:scale-105 active:scale-95'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    }
                `}
                            >
                                {provider.isAvailable ? (
                                    <>
                                        <span>Book</span>
                                        <div className="bg-black/10 rounded-full p-0.5">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
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
