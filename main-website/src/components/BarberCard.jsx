import React, { memo } from 'react';
import { Star, Clock } from 'lucide-react';
import Image from './Image';

// MEMOIZED Barber Card
const BarberCard = memo(({ barber, onClick }) => {
    const maxAppointments = barber.owner?.maxAppointmentsPerDay || 10;
    const fullness = Math.min((barber.todaysBookings / maxAppointments) * 100, 100);

    return (
        <div
            className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#4C763B]/30 hover:shadow-lg hover:shadow-[#4C763B]/5 transition-all duration-300 transform-gpu"
            onClick={() => onClick(barber)}
        >
            <div className="flex p-4 gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                        src={barber.image}
                        fallbackSrc="/GlossCut.png"
                        alt={barber.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-1 right-1">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${barber.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h4 className="text-gray-900 font-bold text-lg group-hover:text-[#4C763B] transition-colors">{barber.name}</h4>
                        {barber.rating > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {barber.rating.toFixed(1)}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-3">{barber.tag || 'Stylist'}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-4">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-300" /> {barber.avgAppointmentTime}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="flex items-center gap-1">{barber.reviews} reviews</span>
                    </div>

                    <button
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${barber.isAvailable
                            ? 'bg-[#4C763B] hover:bg-[#3b5c2e] text-white shadow-lg shadow-[#4C763B]/20 hover:shadow-[#4C763B]/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {barber.isAvailable ? 'Select Barber' : 'Unavailable'}
                    </button>
                </div>
            </div>

            {/* Capacity Bar at bottom */}
            {barber.isAvailable && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                    <div
                        className={`h-full ${fullness > 80 ? 'bg-red-500' : 'bg-[#4C763B]'}`}
                        style={{ width: `${fullness}%` }}
                    />
                </div>
            )}
        </div>
    );
});

export default BarberCard;
