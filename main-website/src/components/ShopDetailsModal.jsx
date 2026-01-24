import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Star, Users } from 'lucide-react';
import Image from './Image';
import BarberCard from './BarberCard';

// Helper function to get valid image URL (duplicated from parent, should ideally be a util)
const getValidImageUrl = (imageField) => {
    if (typeof imageField === 'string' && imageField.trim()) {
        // If it's already a full URL (starts with http), return as-is
        if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
            return imageField;
        }
        // If it's a relative path, prepend the API URL
        if (imageField.startsWith('/')) {
            return `${process.env.REACT_APP_API_URL}${imageField}`;
        }
        // For other cases, return the field as-is
        return imageField;
    }
    return '/GlossCut.png';
};

const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !shop) return null;

    const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(staff => staff._id)].filter(id => id);
    const shopBarbers = barbers.filter(barber =>
        shopMemberIds.includes(barber.barberId) && barber.approvalStatus === 'approved'
    );

    // Render outside the main DOM hierarchy using createPortal
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-5xl h-[85vh] md:h-[85vh] bg-[#0f0f0f] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Close Button - Positioned safely with high Z-Index */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Banner Header */}
                <div className="relative h-48 md:h-64 shrink-0">
                    <Image
                        src={getValidImageUrl(shop.image || shop.owner?.profilePicture)}
                        fallbackSrc="/gloss_cut.png"
                        className="w-full h-full object-cover opacity-60"
                        alt="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                        {shop.category || 'Barber Shop'}
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                        <span className="text-sm font-bold">{shop.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">{shop.name}</h2>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {shop.address}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-20">

                    {/* Professional Selection Header */}
                    <div className="mb-8 relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl"></div>
                        <div className="relative bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f] border border-white/10 rounded-2xl p-5 overflow-hidden">
                            <div className="relative flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Select a Professional</h3>
                                            <p className="text-blue-400 text-sm font-medium">Choose who you want to book with</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Counter Badge */}
                                <div className="ml-4">
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 rounded-xl border border-white/20 shadow-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white tabular-nums">{shopBarbers.length}</div>
                                            <div className="text-xs text-blue-200 font-medium uppercase tracking-wider">Available</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {shopBarbers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shopBarbers.map((barber) => (
                                <BarberCard
                                    key={barber.id}
                                    barber={barber}
                                    onClick={onBarberClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Users className="w-12 h-12 text-gray-600 mb-3" />
                            <p className="text-gray-400">No staff currently available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body // This renders the modal directly into the <body>
    );
};

export default ShopDetailsModal;
