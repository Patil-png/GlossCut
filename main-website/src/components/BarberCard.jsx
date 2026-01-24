import React, { memo } from 'react';
import { Star, Clock } from 'lucide-react';
import Image from './Image';

// MEMOIZED Barber Card
const BarberCard = memo(({ barber, onClick }) => {
    const maxAppointments = barber.owner?.maxAppointmentsPerDay || 10;
    const fullness = Math.min((barber.todaysBookings / maxAppointments) * 100, 100);

    return (
        <div
            className="group relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300"
            onClick={() => onClick(barber)}
        >
            <div className="flex p-3 gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-800">
                    <Image
                        src={barber.image}
                        fallbackSrc="/GlossCut.png"
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-1 right-1">
                        <div className={`w-3 h-3 rounded-full border-2 border-[#121212] ${barber.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h4 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{barber.name}</h4>
                        {barber.rating > 0 && (
                            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {barber.rating.toFixed(1)}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{barber.tag || 'Stylist'}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {barber.avgAppointmentTime}</span>
                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                        <span className="flex items-center gap-1">{barber.reviews} reviews</span>
                    </div>

                    <button
                        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${barber.isAvailable
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-white/5 text-gray-500'
                            }`}
                    >
                        {barber.isAvailable ? 'Select Barber' : 'Unavailable'}
                    </button>
                </div>
            </div>

            {/* Capacity Bar at bottom */}
            {barber.isAvailable && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                    <div
                        className={`h-full ${fullness > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${fullness}%` }}
                    />
                </div>
            )}
        </div>
    );
});

export default BarberCard;
