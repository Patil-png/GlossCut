import React from 'react';

const StatusBadge = ({ isAvailable, isFullyBooked }) => (
    <div className={`
    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-lg
    ${isFullyBooked
            ? 'bg-amber-500/20 text-amber-500 border-amber-500/20 shadow-amber-500/10'
            : isAvailable
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/20 shadow-rose-500/5'
        }
  `}>
        <div className={`w-1.5 h-1.5 rounded-full ${isFullyBooked ? 'bg-amber-500' : isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        {isFullyBooked ? 'Fully Booked' : isAvailable ? 'Open Now' : 'Closed'}
    </div>
);

export default StatusBadge;
