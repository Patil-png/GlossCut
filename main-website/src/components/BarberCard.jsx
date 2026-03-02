import React, { memo } from 'react';
import { Star, Scissors, MapPin } from 'lucide-react';
import Image from './Image';

// MEMOIZED Barber Card
const BarberCard = memo(({ barber, onClick, distance }) => {
    const maxAppointments = barber.owner?.maxAppointmentsPerDay || 10;
    const fullness = Math.min((barber.todaysBookings / maxAppointments) * 100, 100);

    return (
        <div
            className="group relative bg-white border border-gray-100 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:border-[#4C763B]/30 hover:shadow-xl hover:shadow-[#4C763B]/8 transition-all duration-300 transform-gpu hover:-translate-y-0.5"
            onClick={() => onClick(barber)}
        >
            {/* Mobile layout: horizontal */}
            <div className="flex md:hidden p-4 gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                        src={barber.image}
                        fallbackSrc="/GlossCut.png"
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-1 right-1">
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${barber.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-gray-900 font-bold text-base group-hover:text-[#4C763B] transition-colors">{barber.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium my-1.5">
                        <span className="flex items-center gap-1 text-gray-800 font-bold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {barber.rating > 0 ? barber.rating.toFixed(1) : 'New'}
                        </span>
                        {distance && (
                            <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="flex items-center gap-1 text-[#4C763B] font-bold">
                                    <MapPin className="w-3 h-3" />
                                    {distance} km
                                </span>
                            </>
                        )}
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : (barber.reviewCount || 0))} reviews</span>
                    </div>
                    <button
                        className={`mt-1 w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 ${barber.isAvailable
                            ? 'bg-[#4C763B] hover:bg-[#3b5c2e] text-white shadow-md shadow-[#4C763B]/20'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {barber.isAvailable ? 'Select Barber' : 'Unavailable'}
                    </button>
                </div>
            </div>

            {/* Desktop layout: card-style vertical */}
            <div className="hidden md:flex flex-col">
                {/* Image area */}
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                    <Image
                        src={barber.image}
                        fallbackSrc="/GlossCut.png"
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Availability dot */}
                    <div className="absolute top-3 right-3">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-md ${barber.isAvailable ? 'bg-green-500/20 text-green-100 border-green-400/30' : 'bg-red-500/20 text-red-100 border-red-400/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${barber.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                            {barber.isAvailable ? 'Open' : 'Busy'}
                        </div>
                    </div>
                    {/* Distance Badge Desktop */}
                    {distance && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-[#4C763B] border border-[#4C763B]/20 flex items-center gap-1 shadow-sm">
                            <MapPin className="w-2.5 h-2.5" />
                            {distance} km
                        </div>
                    )}
                    {/* Scissors icon watermark */}
                    <div className="absolute bottom-2 left-3">
                        <Scissors className="w-4 h-4 text-white/30" />
                    </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                    <h4 className="text-gray-900 font-bold text-base group-hover:text-[#4C763B] transition-colors leading-tight mb-2">
                        {barber.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1 font-bold text-gray-800">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {barber.rating > 0 ? barber.rating.toFixed(1) : 'New'}
                        </span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span>{typeof barber.reviews === 'number' ? barber.reviews : (Array.isArray(barber.reviews) ? barber.reviews.length : (barber.reviewCount || 0))} reviews</span>
                    </div>
                    <button
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${barber.isAvailable
                            ? 'bg-[#4C763B] hover:bg-[#3b5c2e] text-white shadow-md shadow-[#4C763B]/20 hover:shadow-[#4C763B]/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {barber.isAvailable ? 'Select Barber' : 'Unavailable'}
                    </button>
                </div>
            </div>

            {/* Capacity bar */}
            {barber.isAvailable && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                    <div
                        className={`h-full ${fullness > 80 ? 'bg-red-400' : 'bg-[#4C763B]'}`}
                        style={{ width: `${fullness}%` }}
                    />
                </div>
            )}
        </div>
    );
});

export default BarberCard;
