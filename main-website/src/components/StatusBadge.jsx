import React from 'react';

const StatusBadge = ({ isAvailable, isFullyBooked }) => {
    if (isFullyBooked) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white text-black shadow-sm border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                Fully Booked
            </div>
        );
    }

    if (isAvailable) {
        return (
            <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider overflow-hidden group border border-gray-100 bg-white text-black shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full border border-black group-hover:bg-black transition-colors duration-300 relative flex items-center justify-center">
                    <div className="w-full h-full bg-black rounded-full animate-ping absolute opacity-30" />
                </div>
                <span className="relative z-10 font-[800]">Open Now</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black text-white shadow-sm border border-gray-900">
            <div className="w-1.5 h-1.5 rounded-full border border-white" />
            Closed
        </div>
    );
};

export default StatusBadge;
